const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const { getPrisma } = require('../config/prisma');
const { env } = require('../config/env');
const { ApiError } = require('../utils/ApiError');
const { signJwt } = require('../middleware/platformAuthMiddleware');
const { normalizeArabicStatus } = require('../utils/platformEnums');
const { createSessionToken } = require('../utils/sessionToken');
const storageService = require('./storageService');
const machineRepository = require('../repositories/machineRepository');
const historyRepository = require('../repositories/historyRepository');
const reportRepository = require('../repositories/reportRepository');

const DEFAULT_OPENAI_MANUAL_MODEL = 'gpt-5.4-mini';
const MANUAL_CHUNK_READ_LIMIT = Number(process.env.MANUAL_CHUNK_READ_LIMIT || 5000);
const MANUAL_CONTEXT_PAGES_BEFORE = Number(process.env.MANUAL_CONTEXT_PAGES_BEFORE || 1);
const MANUAL_CONTEXT_PAGES_AFTER = Number(process.env.MANUAL_CONTEXT_PAGES_AFTER || 8);
const MANUAL_CONTEXT_CHUNK_LIMIT = Number(process.env.MANUAL_CONTEXT_CHUNK_LIMIT || 18);
const MANUAL_AI_CONTEXT_CHARS = Number(process.env.MANUAL_AI_CONTEXT_CHARS || 18000);
const MANUAL_INDEX_CHUNK_LIMIT = Number(process.env.MANUAL_INDEX_CHUNK_LIMIT || 2500);
const MANUAL_PDF_PAGE_LIMIT = Number(process.env.MANUAL_PDF_PAGE_LIMIT || 12);
const MANUAL_PDF_CONTEXT_CHARS = Number(process.env.MANUAL_PDF_CONTEXT_CHARS || 30000);
const LOCAL_MANUAL_STORAGE_DIR = process.env.MANUAL_STORAGE_DIR || path.join(process.cwd(), 'storage', 'shop-manuals');

function requirePrisma() {
  const prisma = getPrisma();

  if (!prisma) {
    throw new ApiError(503, 'Database is not configured for Prisma. Set DATABASE_URL or DB_HOST, DB_PORT, DB_NAME, DB_USER, and DB_PASSWORD on the backend environment.');
  }

  return prisma;
}

function getManualModel() {
  return process.env.OPENAI_MANUAL_MODEL || DEFAULT_OPENAI_MANUAL_MODEL;
}

function isReasoningManualModel(model) {
  return /^gpt-5/i.test(String(model || ''));
}

function buildManualChatCompletionBody({ temperature, messages }) {
  const model = getManualModel();
  const body = {
    model,
    response_format: { type: 'json_object' },
    messages,
  };

  if (isReasoningManualModel(model) && process.env.OPENAI_MANUAL_REASONING_EFFORT) {
    body.reasoning_effort = process.env.OPENAI_MANUAL_REASONING_EFFORT;
  } else if (temperature !== undefined) {
    body.temperature = temperature;
  }

  return body;
}

function getManualPdfModel() {
  return process.env.OPENAI_MANUAL_PDF_MODEL || getManualModel();
}

async function buildPlatformAuthResult(prisma, user, preferredModule, authType = 'PLATFORM') {
  const userRoles = await prisma.userRole.findMany({
    where: { userId: user.id },
    include: { role: true },
  });
  const roleNames = userRoles.map((userRole) => userRole.role.code);
  const permissions = await prisma.rolePermission.findMany({
    where: { role: { code: { in: roleNames } } },
    include: { permission: true },
  });
  const permissionNames = [...new Set(permissions.map((rolePermission) => rolePermission.permission.code))];
  const sessionToken = createSessionToken({
    id: user.id,
    user_number: user.userNumber,
    full_name: user.fullName,
  });

  const token = signJwt({
    sub: user.id,
    email: user.email,
    fullName: user.fullName,
    userNumber: user.userNumber,
    roles: roleNames,
    permissions: permissionNames,
  });

  return {
    authType,
    token,
    user: {
      id: user.id,
      email: user.email,
      userNumber: user.userNumber,
      fullName: user.fullName,
      roles: roleNames,
      permissions: permissionNames,
      sessionToken,
    },
    redirectTo: resolvePlatformRedirect(roleNames, permissionNames, preferredModule),
  };
}

async function login() {
  throw new ApiError(410, 'Microsoft authentication is required.');
}

function resolvePlatformRedirect(roles, permissions, preferredModule) {
  if (preferredModule === 'technician' || roles.includes('TECHNICIAN')) {
    return '/technician';
  }

  if (preferredModule === 'eqp' && permissions.includes('EQP_MANAGE')) {
    return '/eqp';
  }

  const managementRoles = [
    'SUPER_ADMIN',
    'GENERAL_MANAGER',
    'OPERATIONS_MANAGER',
    'SERVICE_ENGINEER',
    'MAINTENANCE_SUPERVISOR',
    'CALL_CENTER',
    'WAREHOUSE_OFFICER',
    'FINANCE',
    'SYSTEM_ADMIN',
    'FIELD_TECHNICIAN',
  ];

  if (roles.some((role) => managementRoles.includes(role))) {
    return '/management';
  }

  return '/management';
}

async function unifiedLogin() {
  throw new ApiError(410, 'Microsoft authentication is required.');
}

async function technicianLogin(payload) {
  const prisma = requirePrisma();
  const email = String(payload.email || '').trim().toLowerCase();
  const employeeCode = String(payload.employeeCode || payload.employee_code || '').trim().toUpperCase();

  if (!email || !employeeCode) {
    throw new ApiError(400, 'Email and technician code are required.');
  }

  const technician = await prisma.technicianProfile.findFirst({
    where: {
      employeeCode,
      deletedAt: null,
      user: {
        email,
        deletedAt: null,
        status: 'ACTIVE',
      },
    },
    include: {
      user: true,
    },
  });

  if (!technician) {
    throw new ApiError(401, 'Invalid technician email or code.');
  }

  return buildPlatformAuthResult(prisma, technician.user, 'technician', 'TECHNICIAN');
}

const MICROSOFT_SCOPE = 'openid profile email User.Read';
const MICROSOFT_STATE_TTL_MS = 10 * 60 * 1000;
const microsoftStates = new Map();
const microsoftLoginCodes = new Map();

function cleanupMicrosoftAuthStore() {
  const now = Date.now();

  for (const [state, value] of microsoftStates.entries()) {
    if (value.expiresAt <= now) microsoftStates.delete(state);
  }

  for (const [code, value] of microsoftLoginCodes.entries()) {
    if (value.expiresAt <= now) microsoftLoginCodes.delete(code);
  }
}

function randomToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function requireMicrosoftConfig() {
  const { tenantId, clientId, clientSecret } = env.microsoft;

  if (!tenantId || !clientId || !clientSecret) {
    throw new ApiError(503, 'Microsoft authentication is not configured. Set MICROSOFT_TENANT_ID, MICROSOFT_CLIENT_ID, and MICROSOFT_CLIENT_SECRET.');
  }

  return { tenantId, clientId, clientSecret };
}

function requestOrigin(req) {
  const proto = req.get('x-forwarded-proto') || req.protocol || 'https';
  const host = req.get('x-forwarded-host') || req.get('host');
  return `${proto}://${host}`;
}

function microsoftRedirectUri(req) {
  return env.microsoft.redirectUri || `${requestOrigin(req)}/api/auth/microsoft/callback`;
}

function originMatchesAllowed(origin, allowedOrigin) {
  if (allowedOrigin === '*') return true;
  if (allowedOrigin === origin) return true;
  if (!allowedOrigin.includes('*')) return false;

  const escapedPattern = allowedOrigin
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*');

  return new RegExp(`^${escapedPattern}$`).test(origin);
}

function safeFrontendCallbackUrl(value) {
  if (!value || typeof value !== 'string') return null;

  try {
    const url = new URL(value);
    const isAllowed = env.security.allowedOrigins.some((origin) => originMatchesAllowed(url.origin, origin));

    if (!isAllowed) return null;

    url.pathname = '/auth/microsoft/callback';
    url.search = '';
    url.hash = '';
    return url;
  } catch {
    return null;
  }
}

function frontendCallbackUrl(req, preferredCallbackUrl) {
  const preferred = safeFrontendCallbackUrl(preferredCallbackUrl);
  if (preferred) return preferred;

  const configured = env.microsoft.frontendCallbackUrl;
  const fallbackOrigin = env.security.allowedOrigins.find((origin) => origin.startsWith('http') && !origin.includes('*'));
  const base = configured || fallbackOrigin || 'http://localhost:3000';
  const url = new URL(base);

  if (url.pathname === '/' || url.pathname === '') {
    url.pathname = '/auth/microsoft/callback';
  }

  return url;
}

function safeReturnTo(returnTo) {
  if (!returnTo || typeof returnTo !== 'string') return null;
  if (!returnTo.startsWith('/') || returnTo.startsWith('//')) return null;
  if (returnTo.startsWith('/auth/')) return null;
  return returnTo;
}

function microsoftErrorRedirect(req, message, preferredCallbackUrl) {
  const url = frontendCallbackUrl(req, preferredCallbackUrl);
  url.searchParams.set('error', message || 'Microsoft authentication failed.');
  return url.toString();
}

function buildMicrosoftLoginUrl(req, query = {}) {
  cleanupMicrosoftAuthStore();
  const { tenantId, clientId } = requireMicrosoftConfig();
  const state = randomToken();
  const redirectUri = microsoftRedirectUri(req);

  microsoftStates.set(state, {
    redirectUri,
    frontendCallbackUrl: safeFrontendCallbackUrl(query.frontendCallbackUrl)?.toString(),
    returnTo: safeReturnTo(query.returnTo),
    preferredModule: query.preferredModule || 'auto',
    expiresAt: Date.now() + MICROSOFT_STATE_TTL_MS,
  });

  const authUrl = new URL(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`);
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_mode', 'query');
  authUrl.searchParams.set('scope', MICROSOFT_SCOPE);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('prompt', 'select_account');

  return authUrl.toString();
}

async function exchangeMicrosoftCode({ code, redirectUri }) {
  const { tenantId, clientId, clientSecret } = requireMicrosoftConfig();
  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
    scope: MICROSOFT_SCOPE,
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.access_token) {
    throw new ApiError(502, data.error_description || data.error || 'Microsoft token exchange failed.');
  }

  return data;
}

async function fetchMicrosoftProfile(accessToken) {
  const response = await fetch('https://graph.microsoft.com/v1.0/me?$select=id,displayName,mail,userPrincipalName', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const profile = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(502, profile.error?.message || 'Unable to read Microsoft profile.');
  }

  return profile;
}

function normalizeMicrosoftEmail(profile) {
  return String(profile.mail || profile.userPrincipalName || '').trim().toLowerCase();
}

function assertAllowedMicrosoftEmail(email) {
  if (!email || !email.includes('@')) {
    throw new ApiError(403, 'Microsoft account does not expose a valid email address.');
  }

  const domain = email.split('@').pop();
  if (env.microsoft.allowedDomains.length > 0 && !env.microsoft.allowedDomains.includes(domain)) {
    throw new ApiError(403, 'Use an approved Dar Al HAI Microsoft account.');
  }
}

async function ensureUserRole(prisma, userId, roleCode) {
  const role = await prisma.role.findUnique({ where: { code: roleCode } });

  if (!role) {
    throw new ApiError(503, `Role ${roleCode} is not configured in the database.`);
  }

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId,
        roleId: role.id,
      },
    },
    update: {},
    create: {
      userId,
      roleId: role.id,
    },
  });
}

function isConfiguredEngineer(email, profile) {
  const displayName = String(profile.displayName || '').toLowerCase();

  return (
    env.microsoft.engineerEmails.includes(email) ||
    env.microsoft.engineerNames.some((name) => displayName.includes(name))
  );
}

async function findOrCreateMicrosoftUser(prisma, profile) {
  const email = normalizeMicrosoftEmail(profile);
  if (!email || !email.includes('@')) {
    throw new ApiError(403, 'Microsoft account does not expose a valid email address.');
  }

  let user = await prisma.user.findUnique({ where: { email } });
  const isConfiguredAdmin = env.microsoft.adminEmails.includes(email);
  const isEngineer = isConfiguredEngineer(email, profile);

  if (!user) {
    assertAllowedMicrosoftEmail(email);

    if (!isConfiguredAdmin && !isEngineer && !env.microsoft.autoProvision) {
      throw new ApiError(403, 'Microsoft account verified, but no platform user exists. Ask an administrator to create your user or enable MICROSOFT_AUTO_PROVISION.');
    }

    user = await prisma.user.create({
      data: {
        email,
        fullName: profile.displayName || email,
        passwordHash: `MICROSOFT_SSO_ONLY:${randomToken()}`,
        locale: 'en',
        status: 'ACTIVE',
      },
    });
  }

  if (user.status !== 'ACTIVE') {
    throw new ApiError(403, 'This platform user is not active.');
  }

  if (isConfiguredAdmin) {
    await ensureUserRole(prisma, user.id, 'SUPER_ADMIN');
  } else if (isEngineer) {
    await ensureUserRole(prisma, user.id, 'SERVICE_ENGINEER');

    const nonEngineerRoles = await prisma.role.findMany({
      where: { code: { in: ['FIELD_TECHNICIAN', 'TECHNICIAN', 'MAINTENANCE_SUPERVISOR'] } },
    });
    if (nonEngineerRoles.length) {
      await prisma.userRole.deleteMany({
        where: {
          userId: user.id,
          roleId: { in: nonEngineerRoles.map((role) => role.id) },
        },
      });
    }
  } else if (env.microsoft.autoProvision) {
    await ensureUserRole(prisma, user.id, env.microsoft.defaultRole);
  }

  return user;
}

async function finishMicrosoftCallback(query, req) {
  cleanupMicrosoftAuthStore();

  if (query.error) {
    throw new ApiError(401, query.error_description || query.error);
  }

  if (!query.code || !query.state) {
    throw new ApiError(400, 'Microsoft callback is missing code or state.');
  }

  const state = microsoftStates.get(query.state);
  microsoftStates.delete(query.state);

  if (!state || state.expiresAt <= Date.now()) {
    throw new ApiError(401, 'Microsoft login session expired. Please sign in again.');
  }

  const tokenSet = await exchangeMicrosoftCode({
    code: query.code,
    redirectUri: state.redirectUri,
  });
  const profile = await fetchMicrosoftProfile(tokenSet.access_token);
  const prisma = requirePrisma();
  const user = await findOrCreateMicrosoftUser(prisma, profile);
  const authResult = await buildPlatformAuthResult(prisma, user, state.preferredModule, 'MICROSOFT');
  const loginCode = randomToken();

  authResult.redirectTo = state.returnTo || authResult.redirectTo;
  microsoftLoginCodes.set(loginCode, {
    authResult,
    expiresAt: Date.now() + MICROSOFT_STATE_TTL_MS,
  });

  const callbackUrl = frontendCallbackUrl(req, state.frontendCallbackUrl);
  callbackUrl.searchParams.set('code', loginCode);
  return callbackUrl.toString();
}

function completeMicrosoftLogin(code) {
  cleanupMicrosoftAuthStore();

  if (!code || typeof code !== 'string') {
    throw new ApiError(400, 'Microsoft login code is required.');
  }

  const session = microsoftLoginCodes.get(code);
  microsoftLoginCodes.delete(code);

  if (!session || session.expiresAt <= Date.now()) {
    throw new ApiError(401, 'Microsoft login code expired. Please sign in again.');
  }

  return session.authResult;
}

function todayText() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeDateText(dateText) {
  const value = dateText || todayText();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ApiError(400, 'Date must use YYYY-MM-DD format');
  }
  return value;
}

function toWorkDate(dateText) {
  return new Date(`${normalizeDateText(dateText)}T00:00:00.000Z`);
}

function schedulingRange(dateText) {
  const day = normalizeDateText(dateText);
  return {
    date: day,
    workDate: toWorkDate(day),
  };
}

function uniqueIds(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function toIdArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

const publicUserSelect = {
  id: true,
  email: true,
  userNumber: true,
  fullName: true,
  phone: true,
  locale: true,
  status: true,
};

const shopManualMetadataSelect = {
  id: true,
  machineModel: true,
  title: true,
  fileName: true,
  sourceType: true,
  status: true,
  originalPdfSize: true,
  originalPdfContentType: true,
  originalStoredAt: true,
  createdAt: true,
  updatedAt: true,
  createdById: true,
  updatedById: true,
  deletedAt: true,
};

const shopManualChunkInclude = {
  manual: {
    select: shopManualMetadataSelect,
  },
};

const defaultTechnicianSeeds = [
  { email: 'alikomatsu223@gmail.com', fullName: 'Ali Sabri', employeeCode: 'TECH-1001', region: null, skills: [] },
  { email: 'mhmaad600042@gmail.com', fullName: 'Mohammad Alharsa', employeeCode: 'TECH-1002', region: null, skills: [] },
  { email: 'smm198071@gmail.com', fullName: 'Sameer Almuji', employeeCode: 'TECH-1003', region: null, skills: [] },
  { email: 'ahmadaljawawdi99@gmail.com', fullName: 'Ahmad Jawawdeh', employeeCode: 'TECH-1004', region: null, skills: [] },
  { email: 'lutfimutaz@gmail.com', fullName: 'Mutazz Lutfi', employeeCode: 'TECH-1005', region: null, skills: [] },
  { email: 'aliaboalheki@gmail.com', fullName: 'Ali Sayed Alheki', employeeCode: 'TECH-1006', region: null, skills: [] },
  { email: 'barh507@gmail.com', fullName: 'Ibrahim Abdulrazzaq', employeeCode: 'TECH-1007', region: null, skills: [] },
  { email: 'test@gmail.com', fullName: 'Test Technician', employeeCode: 'TEST-1015', region: null, skills: [] },
];

const dailyScheduleTaskInclude = {
  technicians: {
    include: {
      technician: {
        include: {
          user: { select: publicUserSelect },
          shift: true,
          skills: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  },
};

async function ensureDefaultTechnicians(prisma) {
  const activeTechnicians = await prisma.technicianProfile.count({ where: { deletedAt: null } });
  if (activeTechnicians > 0) return;

  await prisma.$transaction(async (tx) => {
    const role = await tx.role.upsert({
      where: { code: 'TECHNICIAN' },
      update: {},
      create: {
        code: 'TECHNICIAN',
        name: 'Technician',
      },
    });

    for (const seed of defaultTechnicianSeeds) {
      const user = await tx.user.upsert({
        where: { email: seed.email },
        update: {
          fullName: seed.fullName,
          status: 'ACTIVE',
          deletedAt: null,
        },
        create: {
          email: seed.email,
          fullName: seed.fullName,
          passwordHash: `MICROSOFT_SSO_ONLY:${randomToken()}`,
          locale: 'en',
          status: 'ACTIVE',
        },
      });

      await tx.userRole.upsert({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId: role.id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          roleId: role.id,
        },
      });

      const existingProfile = await tx.technicianProfile.findFirst({
        where: {
          OR: [
            { userId: user.id },
            { employeeCode: seed.employeeCode },
          ],
        },
      });

      const technician = existingProfile
        ? await tx.technicianProfile.update({
          where: { id: existingProfile.id },
          data: {
            userId: user.id,
            employeeCode: seed.employeeCode,
            region: seed.region,
            shiftId: null,
            isAvailable: true,
            deletedAt: null,
          },
        })
        : await tx.technicianProfile.create({
          data: {
            userId: user.id,
            employeeCode: seed.employeeCode,
            region: seed.region,
            isAvailable: true,
          },
        });

      await tx.technicianSkill.deleteMany({
        where: { technicianId: technician.id },
      });

      await tx.technicianSkill.createMany({
        data: seed.skills.map(([skill, level]) => ({
          technicianId: technician.id,
          skill,
          level,
        })),
        skipDuplicates: true,
      });
    }
  });
}

async function listDashboard() {
  const prisma = requirePrisma();
  const today = todayText();
  const todayDate = toWorkDate(today);
  const weekStart = new Date(todayDate);
  weekStart.setUTCDate(weekStart.getUTCDate() - 6);
  const [
    technicians,
    availableTechnicians,
    dailyTasks,
    completedToday,
    scheduledTechnicians,
    shifts,
    upcomingTasks,
    weekTasks,
    recentTasks,
    machines,
    reports,
    machineHistory,
  ] = await Promise.all([
    prisma.technicianProfile.count({ where: { deletedAt: null } }),
    prisma.technicianProfile.count({ where: { deletedAt: null, isAvailable: true } }),
    prisma.dailyScheduleTask.count({ where: { workDate: todayDate, deletedAt: null } }),
    prisma.dailyScheduleTask.count({ where: { workDate: todayDate, deletedAt: null, status: 'COMPLETED' } }),
    prisma.dailyScheduleTaskTechnician.findMany({
      where: {
        task: { workDate: todayDate, deletedAt: null },
      },
      select: { technicianId: true },
      distinct: ['technicianId'],
    }),
    prisma.shift.count({ where: { deletedAt: null } }),
    prisma.dailyScheduleTask.findMany({
      where: {
        workDate: { gte: todayDate },
        deletedAt: null,
      },
      include: {
        technicians: {
          include: {
            technician: {
              include: { user: { select: publicUserSelect } },
            },
          },
        },
      },
      orderBy: [{ workDate: 'asc' }, { startsAt: 'asc' }],
      take: 6,
    }),
    prisma.dailyScheduleTask.findMany({
      where: {
        workDate: { gte: weekStart, lte: todayDate },
        deletedAt: null,
      },
      select: {
        id: true,
        workDate: true,
        status: true,
      },
    }),
    prisma.dailyScheduleTask.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      take: 4,
    }),
    machineRepository.findAll().catch(() => []),
    reportRepository.findAll().catch(() => []),
    historyRepository.findAll().catch(() => []),
  ]);
  const activeMachines = machines.filter((machine) => !machine.deleted_at);
  const activeReports = reports.filter((report) => !report.deleted_at);
  const dateKey = (value) => {
    const date = value ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : '';
  };
  const reportMachineIds = new Set(activeReports.map((report) => report.machine_id || report.machine_number).filter(Boolean));
  const reportsThisWeek = activeReports.filter((report) => {
    const createdAt = report.created_at ? new Date(report.created_at) : null;
    return createdAt && createdAt >= weekStart;
  }).length;
  const machineTypes = new Set(activeMachines.map((machine) => machine.machine_type).filter(Boolean)).size;
  const latestOperationDate = machineHistory[0]?.operation_date || machineHistory[0]?.created_at || null;
  const timeline = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setUTCDate(weekStart.getUTCDate() + index);
    const key = date.toISOString().slice(0, 10);
    const scheduled = weekTasks.filter((task) => dateKey(task.workDate) === key).length;
    const completed = weekTasks.filter((task) => dateKey(task.workDate) === key && task.status === 'COMPLETED').length;
    const generatedReports = activeReports.filter((report) => dateKey(report.created_at) === key).length;
    return {
      date: key,
      label: key.slice(5),
      scheduled,
      completed,
      reports: generatedReports,
    };
  });
  const activity = [
    ...recentTasks.map((task) => ({
      action: `Schedule task updated: ${task.task}`,
      time: task.updatedAt,
      status: task.status,
      href: '/management/scheduling',
    })),
    ...activeReports.slice(0, 4).map((report) => ({
      action: `EQP report generated: ${report.report_no || report.file_name || report.machine_number || 'Report'}`,
      time: report.created_at,
      status: 'COMPLETED',
      href: '/eqp/reports',
    })),
    ...machineHistory.slice(0, 4).map((entry) => ({
      action: `Machine activity: ${entry.machine_type || ''} ${entry.machine_number || ''}`.trim(),
      time: entry.created_at || entry.operation_date,
      status: entry.operation_type || 'ACTIVE',
      href: '/eqp/machines',
    })),
  ]
    .filter((entry) => entry.time)
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 6);
  const assignmentCoverage = technicians ? Math.round((scheduledTechnicians.length / technicians) * 100) : 0;
  const availabilityRate = technicians ? Math.round((availableTechnicians / technicians) * 100) : 0;
  const completionRate = dailyTasks ? Math.round((completedToday / dailyTasks) * 100) : 0;
  const eqpCoverage = activeMachines.length ? Math.round((reportMachineIds.size / activeMachines.length) * 100) : 0;

  return {
    kpis: {
      technicians,
      availableTechnicians,
      dailyTasks,
      completedToday,
      scheduledTechnicians: scheduledTechnicians.length,
      shifts,
      machines: activeMachines.length,
      machineTypes,
      reports: activeReports.length,
      reportsThisWeek,
      latestOperationDate,
    },
    governance: [
      { title: 'Technician availability', value: availabilityRate },
      { title: 'Scheduling assignment', value: assignmentCoverage },
      { title: 'Today completion', value: completionRate },
      { title: 'EQP machine coverage', value: eqpCoverage },
    ],
    timeline,
    activity,
    upcomingMaintenance: upcomingTasks.map((task) => ({
      id: task.id,
      machine: task.machineModel || task.location || 'General task',
      technician: task.technicians?.map((assignment) => assignment.technician?.user?.fullName).filter(Boolean).join(', ') || 'Unassigned',
      dueDate: task.workDate,
      status: task.status,
    })),
    modules: ['technicians', 'scheduling', 'workspace', 'eqp'],
  };
}

async function listTechnicians() {
  const prisma = requirePrisma();
  await ensureDefaultTechnicians(prisma);

  return prisma.technicianProfile.findMany({
    where: { deletedAt: null },
    include: {
      user: { select: publicUserSelect },
      shift: true,
      skills: true,
    },
    orderBy: { employeeCode: 'asc' },
  });
}

function normalizeTechnicianSkills(skills) {
  if (!skills) return [];

  const items = Array.isArray(skills)
    ? skills
    : String(skills).split(',').map((skill) => skill.trim()).filter(Boolean);

  return items
    .map((item) => {
      if (typeof item === 'string') return { skill: item.trim(), level: null };
      return {
        skill: String(item.skill || item.name || '').trim(),
        level: item.level ? String(item.level).trim() : null,
      };
    })
    .filter((item) => item.skill);
}

async function syncTechnicianSkills(tx, technicianId, skills) {
  if (skills === undefined) return;

  const normalizedSkills = normalizeTechnicianSkills(skills);

  await tx.technicianSkill.deleteMany({
    where: { technicianId },
  });

  if (normalizedSkills.length === 0) return;

  await tx.technicianSkill.createMany({
    data: normalizedSkills.map((item) => ({
      technicianId,
      skill: item.skill,
      level: item.level,
    })),
    skipDuplicates: true,
  });
}

async function assignTechnicianRole(tx, userId) {
  const role = await tx.role.findUnique({ where: { code: 'TECHNICIAN' } });

  if (!role) {
    throw new ApiError(503, 'TECHNICIAN role is not configured.');
  }

  await tx.userRole.upsert({
    where: {
      userId_roleId: {
        userId,
        roleId: role.id,
      },
    },
    update: {},
    create: {
      userId,
      roleId: role.id,
    },
  });

  const legacyRole = await tx.role.findUnique({ where: { code: 'FIELD_TECHNICIAN' } });
  if (legacyRole) {
    await tx.userRole.deleteMany({
      where: {
        userId,
        roleId: legacyRole.id,
      },
    });
  }
}

async function createTechnician(payload, actorId) {
  const prisma = requirePrisma();
  const fullName = String(payload.fullName || payload.full_name || '').trim();
  const email = String(payload.email || '').trim().toLowerCase();
  const employeeCode = String(payload.employeeCode || payload.employee_code || '').trim();

  if (!fullName || !email || !employeeCode) {
    throw new ApiError(400, 'fullName, email, and employeeCode are required.');
  }

  return prisma.$transaction(async (tx) => {
    const existingProfile = await tx.technicianProfile.findFirst({
      where: { employeeCode },
    });

    if (existingProfile && !existingProfile.deletedAt) {
      throw new ApiError(409, 'A technician with this employee code already exists.');
    }

    const requestedUserNumber = payload.userNumber || payload.user_number
      ? Number(payload.userNumber || payload.user_number)
      : null;

    if (requestedUserNumber) {
      const userNumberOwner = await tx.user.findUnique({ where: { userNumber: requestedUserNumber } });
      if (userNumberOwner && userNumberOwner.email !== email) {
        throw new ApiError(409, 'This user number is already assigned to another user.');
      }
    }

    const user = await tx.user.upsert({
      where: { email },
      update: {
        fullName,
        ...(requestedUserNumber ? { userNumber: requestedUserNumber } : {}),
        phone: payload.phone || null,
        locale: payload.locale || 'ar',
        status: payload.status || 'ACTIVE',
        deletedAt: null,
        updatedById: actorId,
      },
      create: {
        email,
        ...(requestedUserNumber ? { userNumber: requestedUserNumber } : {}),
        fullName,
        phone: payload.phone || null,
        locale: payload.locale || 'ar',
        status: payload.status || 'ACTIVE',
        passwordHash: `MICROSOFT_SSO_ONLY:${randomToken()}`,
        createdById: actorId,
      },
    });

    if (existingProfile && existingProfile.deletedAt && existingProfile.userId !== user.id) {
      await tx.technicianProfile.update({
        where: { id: existingProfile.id },
        data: {
          employeeCode: null,
          updatedById: actorId,
        },
      });
    }

    await assignTechnicianRole(tx, user.id);

    const technician = await tx.technicianProfile.upsert({
      where: { userId: user.id },
      update: {
        employeeCode,
        region: payload.region || null,
        shiftId: payload.shiftId || null,
        isAvailable: payload.isAvailable !== undefined ? Boolean(payload.isAvailable) : true,
        deletedAt: null,
        updatedById: actorId,
      },
      create: {
        userId: user.id,
        employeeCode,
        region: payload.region || null,
        shiftId: payload.shiftId || null,
        isAvailable: payload.isAvailable !== undefined ? Boolean(payload.isAvailable) : true,
        createdById: actorId,
      },
    });

    await syncTechnicianSkills(tx, technician.id, payload.skills);

    return tx.technicianProfile.findUnique({
      where: { id: technician.id },
      include: {
        user: { select: publicUserSelect },
        shift: true,
        skills: true,
      },
    });
  });
}

async function updateTechnician(id, payload, actorId) {
  const prisma = requirePrisma();
  const technician = await prisma.technicianProfile.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!technician || technician.deletedAt) {
    throw new ApiError(404, 'Technician not found.');
  }

  return prisma.$transaction(async (tx) => {
    const userUpdates = {};
    if (payload.fullName || payload.full_name) userUpdates.fullName = String(payload.fullName || payload.full_name).trim();
    if (payload.email) userUpdates.email = String(payload.email).trim().toLowerCase();
    if (payload.phone !== undefined) userUpdates.phone = payload.phone || null;
    if (payload.userNumber !== undefined || payload.user_number !== undefined) {
      const userNumber = payload.userNumber || payload.user_number ? Number(payload.userNumber || payload.user_number) : null;
      if (userNumber) {
        const owner = await tx.user.findUnique({ where: { userNumber } });
        if (owner && owner.id !== technician.userId) {
          throw new ApiError(409, 'This user number is already assigned to another user.');
        }
      }
      userUpdates.userNumber = userNumber;
    }
    if (payload.status) userUpdates.status = payload.status;

    if (Object.keys(userUpdates).length > 0) {
      await tx.user.update({
        where: { id: technician.userId },
        data: {
          ...userUpdates,
          updatedById: actorId,
        },
      });
    }

    const profileUpdates = {};
    if (payload.employeeCode || payload.employee_code) profileUpdates.employeeCode = String(payload.employeeCode || payload.employee_code).trim();
    if (payload.region !== undefined) profileUpdates.region = payload.region || null;
    if (payload.shiftId !== undefined) profileUpdates.shiftId = payload.shiftId || null;
    if (payload.isAvailable !== undefined) profileUpdates.isAvailable = Boolean(payload.isAvailable);

    if (profileUpdates.employeeCode && profileUpdates.employeeCode !== technician.employeeCode) {
      const existingProfile = await tx.technicianProfile.findFirst({
        where: {
          employeeCode: profileUpdates.employeeCode,
          id: { not: id },
        },
      });

      if (existingProfile && !existingProfile.deletedAt) {
        throw new ApiError(409, 'A technician with this employee code already exists.');
      }

      if (existingProfile && existingProfile.deletedAt) {
        await tx.technicianProfile.update({
          where: { id: existingProfile.id },
          data: {
            employeeCode: null,
            updatedById: actorId,
          },
        });
      }
    }

    if (Object.keys(profileUpdates).length > 0) {
      await tx.technicianProfile.update({
        where: { id },
        data: {
          ...profileUpdates,
          updatedById: actorId,
        },
      });
    }

    if (payload.skills !== undefined) {
      await syncTechnicianSkills(tx, id, payload.skills);
    }

    return tx.technicianProfile.findUnique({
      where: { id },
      include: {
        user: { select: publicUserSelect },
        shift: true,
        skills: true,
      },
    });
  });
}

async function deleteTechnician(id, actorId) {
  const prisma = requirePrisma();
  const technician = await prisma.technicianProfile.findUnique({
    where: { id },
    include: {
      user: { select: publicUserSelect },
    },
  });

  if (!technician || technician.deletedAt) {
    throw new ApiError(404, 'Technician not found.');
  }

  const deletedAt = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.technicianProfile.update({
      where: { id },
      data: {
        isAvailable: false,
        deletedAt,
        updatedById: actorId,
      },
    });

    await tx.technicianSchedule.updateMany({
      where: {
        technicianId: id,
        deletedAt: null,
        workDate: { gte: toWorkDate(new Date().toISOString().slice(0, 10)) },
      },
      data: {
        status: 'CANCELLED',
        deletedAt,
        updatedById: actorId,
      },
    });
  });

  return {
    id: technician.id,
    employeeCode: technician.employeeCode,
    user: technician.user,
    deletedAt,
  };
}

async function listShifts() {
  const prisma = requirePrisma();
  return prisma.shift.findMany({ where: { deletedAt: null }, include: { branch: true }, orderBy: { startsAt: 'asc' } });
}

async function createShift(payload, actorId) {
  const prisma = requirePrisma();
  const name = payload.name?.trim();
  if (!name || !payload.startsAt || !payload.endsAt) {
    throw new ApiError(400, 'Shift name, startsAt, and endsAt are required');
  }

  const existingShift = await prisma.shift.findFirst({
    where: { branchId: payload.branchId || null, name, deletedAt: null },
  });

  if (existingShift) {
    return prisma.shift.update({
      where: { id: existingShift.id },
      data: {
        startsAt: payload.startsAt,
        endsAt: payload.endsAt,
        updatedById: actorId,
      },
    });
  }

  return prisma.shift.create({
    data: {
      name,
      startsAt: payload.startsAt,
      endsAt: payload.endsAt,
      branchId: payload.branchId || null,
      createdById: actorId,
    },
  });
}

async function upsertTechnicianSchedule(payload, actorId) {
  const prisma = requirePrisma();
  const workDate = toWorkDate(payload.workDate || payload.date);

  if (!payload.technicianId || !payload.startsAt || !payload.endsAt) {
    throw new ApiError(400, 'technicianId, startsAt, and endsAt are required');
  }

  return prisma.technicianSchedule.upsert({
    where: {
      technicianId_workDate: {
        technicianId: payload.technicianId,
        workDate,
      },
    },
    update: {
      shiftId: payload.shiftId || null,
      branchId: payload.branchId || null,
      startsAt: payload.startsAt,
      endsAt: payload.endsAt,
      status: payload.status || 'PLANNED',
      notes: payload.notes || null,
      updatedById: actorId,
    },
    create: {
      technicianId: payload.technicianId,
      shiftId: payload.shiftId || null,
      branchId: payload.branchId || null,
      workDate,
      startsAt: payload.startsAt,
      endsAt: payload.endsAt,
      status: payload.status || 'PLANNED',
      notes: payload.notes || null,
      createdById: actorId,
    },
    include: {
      technician: { include: { user: { select: publicUserSelect } } },
      shift: true,
      branch: true,
    },
  });
}

function normalizeDailyScheduleTask(task) {
  if (!task) return task;
  return {
    ...task,
    technicians: (task.technicians || []).map((assignment) => assignment.technician),
    photos: Array.isArray(task.photos) ? task.photos : [],
    checklist: normalizeTaskChecklist(task.checklist),
    checklistReports: normalizeChecklistReports(task.checklistReports, normalizeTaskChecklist(task.checklist)),
  };
}

function checklistItemId(index) {
  return `point-${index + 1}`;
}

function normalizeTaskChecklist(value) {
  const rawItems = Array.isArray(value)
    ? value
    : String(value || '').split(/\r?\n/).map((item) => item.trim()).filter(Boolean);

  return rawItems
    .map((item, index) => {
      const text = typeof item === 'string'
        ? item
        : String(item.text || item.title || item.label || '').trim();
      if (!text) return null;
      return {
        id: String((typeof item === 'object' && item?.id) || checklistItemId(index)).slice(0, 80),
        text: text.slice(0, 500),
        required: typeof item === 'object' && item?.required === false ? false : true,
      };
    })
    .filter(Boolean)
    .slice(0, 30);
}

function normalizeChecklistReports(value, checklist = []) {
  const rawReports = Array.isArray(value) ? value : [];
  const checklistIds = new Set(checklist.map((item) => item.id));

  return rawReports
    .map((report, index) => {
      const id = String(report?.id || checklist[index]?.id || checklistItemId(index)).slice(0, 80);
      if (checklistIds.size > 0 && !checklistIds.has(id)) return null;
      return {
        id,
        done: Boolean(report?.done),
        notes: String(report?.notes || '').trim().slice(0, 1500),
        photos: normalizeTaskPhotos(report?.photos).slice(0, 6),
        updatedAt: new Date().toISOString(),
      };
    })
    .filter(Boolean)
    .slice(0, 30);
}

function normalizeMachineModel(value) {
  return String(value || '').trim().toUpperCase();
}

function manualStorageKey(manualId) {
  return `${String(manualId || '').replace(/[^a-z0-9-]/gi, '')}.pdf`;
}

function localManualPath(manualId) {
  return path.join(LOCAL_MANUAL_STORAGE_DIR, manualStorageKey(manualId));
}

async function readOriginalManualPdf(manualId) {
  if (!manualId) return null;

  const prisma = requirePrisma();
  const manual = await prisma.shopManual.findFirst({
    where: {
      id: String(manualId),
      deletedAt: null,
    },
    select: {
      originalPdf: true,
    },
  });

  if (manual?.originalPdf) {
    return Buffer.from(manual.originalPdf);
  }

  const key = manualStorageKey(manualId);

  try {
    return await storageService.downloadManual(key);
  } catch {
    // Local storage is a fallback for development or environments without Supabase storage.
  }

  try {
    return await fs.readFile(localManualPath(manualId));
  } catch {
    return null;
  }
}

function decodeBase64Payload(value) {
  const content = String(value || '');
  const [, base64 = content] = content.match(/^data:.*?;base64,(.*)$/) || [];
  return Buffer.from(base64, 'base64');
}

function normalizeManualText(text) {
  return String(text || '')
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function chunkText(text, maxLength = 2800) {
  const clean = normalizeManualText(text);
  if (!clean) return [];

  const paragraphs = clean.split(/\n\s*\n/);
  const chunks = [];
  let current = '';

  for (const paragraph of paragraphs) {
    const next = current ? `${current}\n\n${paragraph}` : paragraph;
    if (next.length > maxLength && current) {
      chunks.push(current);
      current = paragraph;
    } else {
      current = next;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

async function extractManualDocumentFromBuffer(buffer) {
  const { PDFParse } = require('pdf-parse');
  const parser = new PDFParse({ data: buffer });
  try {
    const parsed = await parser.getText();
    const pages = Array.isArray(parsed.pages)
      ? parsed.pages.map((page, index) => ({
        pageNumber: index + 1,
        text: normalizeManualText(page.text || ''),
      })).filter((page) => page.text)
      : [];

    return {
      text: normalizeManualText(parsed.text || pages.map((page) => page.text).join('\n\n')),
      pages,
    };
  } finally {
    await parser.destroy();
  }
}

async function extractManualDocument(payload) {
  if (payload.text) {
    return {
      text: normalizeManualText(payload.text),
      pages: [],
    };
  }
  if (!payload.fileBase64) {
    throw new ApiError(400, 'Manual text or fileBase64 is required.');
  }

  const buffer = decodeBase64Payload(payload.fileBase64);
  if (buffer.length > 35 * 1024 * 1024) {
    throw new ApiError(413, 'Manual file is too large. Keep uploads under 35 MB.');
  }

  return extractManualDocumentFromBuffer(buffer);
}

async function extractManualText(payload) {
  const document = await extractManualDocument(payload);
  return document.text;
}

async function extractManualDocumentFromFile(filePath) {
  const buffer = await fs.readFile(filePath);
  return extractManualDocumentFromBuffer(buffer);
}

async function extractManualTextFromFile(filePath) {
  const document = await extractManualDocumentFromFile(filePath);
  return document.text;
}

function chunkManualDocument(document, maxLength = 3200) {
  const pages = Array.isArray(document?.pages) ? document.pages : [];
  if (pages.length > 0) {
    return pages.flatMap((page, pageIndex) => (
      chunkText(page.text, maxLength).map((content, partIndex) => ({
        content,
        pageNumber: Number.isFinite(Number(page.pageNumber)) ? Number(page.pageNumber) : pageIndex + 1,
        pagePart: partIndex + 1,
      }))
    )).filter((chunk) => chunk.content);
  }

  const text = typeof document === 'string' ? document : document?.text;
  return chunkText(text, maxLength).map((content, index) => ({
    content,
    pageNumber: index + 1,
    pagePart: 1,
  }));
}

async function createIndexedShopManual(payload, document, actorId, originalPdfBuffer = null) {
  const prisma = requirePrisma();
  const machineModel = normalizeMachineModel(payload.machineModel);
  const title = String(payload.title || payload.fileName || '').trim();

  if (!machineModel || !title) {
    throw new ApiError(400, 'machineModel and title are required.');
  }

  const chunks = chunkManualDocument(document);
  if (chunks.length === 0) {
    throw new ApiError(400, 'No readable text was found in this manual.');
  }

  const manualId = crypto.randomUUID();
  const originalPdfData = originalPdfBuffer?.length
    ? {
      originalPdf: originalPdfBuffer,
      originalPdfSize: originalPdfBuffer.length,
      originalPdfContentType: 'application/pdf',
      originalStoredAt: new Date(),
    }
    : {};
  const manual = await prisma.$transaction(async (tx) => {
    const manual = await tx.shopManual.create({
      data: {
        id: manualId,
        machineModel,
        title,
        fileName: payload.fileName || null,
        sourceType: payload.sourceType || 'PDF',
        status: 'INDEXED',
        createdById: actorId,
        ...originalPdfData,
      },
      select: shopManualMetadataSelect,
    });

    const indexedChunks = chunks.slice(0, MANUAL_INDEX_CHUNK_LIMIT);
    for (let index = 0; index < indexedChunks.length; index += 200) {
      const batch = indexedChunks.slice(index, index + 200);
      await tx.shopManualChunk.createMany({
        data: batch.map((chunk) => ({
          manualId: manual.id,
          machineModel,
          pageNumber: chunk.pageNumber,
          section: inferSectionTitle(chunk.content),
          content: chunk.content,
        })),
      });
    }

    return {
      ...manual,
      chunks: indexedChunks.length,
    };
  }, { timeout: 120000 });

  return {
    ...manual,
    originalAvailable: Boolean(manual.originalPdfSize),
  };
}

async function uploadShopManual(payload, actorId) {
  let originalPdfBuffer = null;
  let document;

  if (payload.fileBase64 && !payload.text) {
    originalPdfBuffer = decodeBase64Payload(payload.fileBase64);
    if (originalPdfBuffer.length > 35 * 1024 * 1024) {
      throw new ApiError(413, 'Manual file is too large. Keep uploads under 35 MB.');
    }
    document = await extractManualDocumentFromBuffer(originalPdfBuffer);
  } else {
    document = await extractManualDocument(payload);
  }

  return createIndexedShopManual({
    ...payload,
    sourceType: payload.fileBase64 ? 'PDF' : 'TEXT',
  }, document, actorId, originalPdfBuffer);
}

async function uploadShopManualFile(payload, file, actorId) {
  if (!file?.path) {
    throw new ApiError(400, 'PDF manual file is required.');
  }

  try {
    const originalPdfBuffer = await fs.readFile(file.path);
    const document = await extractManualDocumentFromBuffer(originalPdfBuffer);
    return await createIndexedShopManual({
      ...payload,
      fileName: file.originalname,
      sourceType: 'PDF',
    }, document, actorId, originalPdfBuffer);
  } finally {
    await fs.unlink(file.path).catch(() => {});
  }
}

function inferSectionTitle(content) {
  const lines = String(content || '')
    .split('\n')
    .map(cleanManualLine)
    .filter(Boolean);
  const heading = lines.find((line) => looksLikeManualHeading(line));
  const line = heading || lines.find((item) => item.length > 4);
  return line ? cleanManualTitle(line).slice(0, 160) : null;
}

async function listShopManuals() {
  const prisma = requirePrisma();
  const manuals = await prisma.shopManual.findMany({
    where: { deletedAt: null },
    select: {
      ...shopManualMetadataSelect,
      _count: { select: { chunks: true } },
    },
    orderBy: [{ machineModel: 'asc' }, { createdAt: 'desc' }],
  });

  return manuals.map((manual) => ({
    ...manual,
    originalAvailable: Boolean(manual.originalPdfSize),
    chunkCount: manual._count.chunks,
    _count: undefined,
  }));
}

async function findShopManualById(manualId) {
  const prisma = requirePrisma();
  const manual = await prisma.shopManual.findFirst({
    where: {
      id: String(manualId || ''),
      deletedAt: null,
    },
    select: shopManualMetadataSelect,
  });

  if (!manual) {
    throw new ApiError(404, 'Shop manual was not found.');
  }

  return manual;
}

function safePdfFileName(value, fallback = 'shop-manual.pdf') {
  const clean = String(value || fallback)
    .replace(/\.pdf$/i, '')
    .replace(/[^a-z0-9._-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
  return `${clean || fallback.replace(/\.pdf$/i, '')}.pdf`;
}

async function getShopManualFile(manualId) {
  const manual = await findShopManualById(manualId);
  const buffer = await readOriginalManualPdf(manual.id);

  if (!buffer) {
    throw new ApiError(404, 'Original PDF is not available for this manual. Open a page PDF from indexed text instead.');
  }

  return {
    buffer,
    contentType: 'application/pdf',
    fileName: safePdfFileName(manual.fileName || manual.title),
    sourceType: 'original',
  };
}

async function extractOriginalManualPagePdf(buffer, pageNumber) {
  const { PDFDocument: PdfLibDocument } = require('pdf-lib');
  const sourcePdf = await PdfLibDocument.load(buffer, { ignoreEncryption: true });
  const pageCount = sourcePdf.getPageCount();
  const pageIndex = Number(pageNumber) - 1;

  if (pageIndex < 0 || pageIndex >= pageCount) {
    throw new ApiError(404, `Page ${pageNumber} is outside this manual PDF.`);
  }

  const outputPdf = await PdfLibDocument.create();
  const [page] = await outputPdf.copyPages(sourcePdf, [pageIndex]);
  outputPdf.addPage(page);
  return Buffer.from(await outputPdf.save());
}

async function createManualPageTextPdfBuffer(manual, chunks, pageNumber) {
  const PDFDocument = require('pdfkit');

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 42,
      info: {
        Title: `${manual.title} - page ${pageNumber}`,
        Author: 'EQP Manual Assistant',
      },
    });
    const buffers = [];
    const content = chunks
      .map((chunk) => String(chunk.content || '').trim())
      .filter(Boolean)
      .join('\n\n');

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    doc.font('Helvetica-Bold').fontSize(15).text(manual.title || 'Shop Manual', { align: 'center' });
    doc.moveDown(0.35);
    doc.font('Helvetica').fontSize(9).text(`Machine model: ${manual.machineModel || '-'}`);
    doc.text(`Indexed page: ${pageNumber}`);
    doc.text('Original PDF was not available; this page was rebuilt from indexed manual text.');
    doc.moveDown();
    doc.font('Helvetica').fontSize(8.5).text(content || 'No indexed text was found for this page.', {
      align: 'left',
      lineGap: 2,
    });
    doc.end();
  });
}

async function getShopManualPagePdf(manualId, pageNumberText) {
  const manual = await findShopManualById(manualId);
  const pageNumber = Number(pageNumberText);

  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    throw new ApiError(400, 'A valid manual page number is required.');
  }

  const originalBuffer = await readOriginalManualPdf(manual.id);
  if (originalBuffer) {
    try {
      return {
        buffer: await extractOriginalManualPagePdf(originalBuffer, pageNumber),
        contentType: 'application/pdf',
        fileName: safePdfFileName(`${manual.title}-p${pageNumber}`),
        sourceType: 'original-page',
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
    }
  }

  const prisma = requirePrisma();
  const chunks = await prisma.shopManualChunk.findMany({
    where: {
      manualId: manual.id,
      pageNumber,
    },
    orderBy: [{ pageNumber: 'asc' }, { createdAt: 'asc' }],
  });

  if (chunks.length === 0) {
    throw new ApiError(404, `No indexed content was found for manual page ${pageNumber}.`);
  }

  return {
    buffer: await createManualPageTextPdfBuffer(manual, chunks, pageNumber),
    contentType: 'application/pdf',
    fileName: safePdfFileName(`${manual.title}-indexed-p${pageNumber}`),
    sourceType: 'indexed-page',
  };
}

function tokenizeSearchText(value) {
  return [...new Set(String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 3))];
}

function expandManualSearchTerms(values) {
  const baseTerms = [...new Set(values.map((value) => String(value || '').toLowerCase()).filter(Boolean))];
  const expanded = new Set(baseTerms);
  const expansions = {
    remove: ['removal', 'removing', 'disassembly', 'disassemble'],
    removal: ['remove', 'removing', 'disassembly', 'disassemble'],
    replace: ['replacement', 'installation', 'install', 'assembly'],
    replacement: ['replace', 'installation', 'install', 'assembly'],
    install: ['installation', 'installing', 'assembly'],
    installation: ['install', 'installing', 'assembly'],
    disassemble: ['disassembly', 'remove', 'removal'],
    disassembly: ['disassemble', 'remove', 'removal'],
    assemble: ['assembly', 'install', 'installation'],
    assembly: ['assemble', 'install', 'installation'],
    left: ['LH', 'left-hand'],
    right: ['RH', 'right-hand'],
  };

  for (const term of baseTerms) {
    const tokens = tokenizeSearchText(term);
    for (const token of tokens) {
      if (expansions[token]) {
        for (const expansion of expansions[token]) expanded.add(expansion);
      }
      if (token.endsWith('e')) expanded.add(`${token.slice(0, -1)}al`);
      if (token.endsWith('al')) expanded.add(token.slice(0, -2));
    }
  }

  return [...expanded];
}

function buildManualChunkWhere(machineModel) {
  const normalizedModel = normalizeMachineModel(machineModel);
  return {
    ...(normalizedModel ? { machineModel: normalizedModel } : {}),
    manual: { is: { deletedAt: null } },
  };
}

const localTaskSearchMap = [
  {
    pattern: /(ديزل|مازوت|سولار|fuel|diesel|فلتر|فلتره|filter|هوا|هواء|نسحب|نفضي|تنفيس|تنسيم|bleed|bleeding)/i,
    phrases: [
      'bleeding air from fuel circuit',
      'fuel filter replacement',
      'fuel circuit air bleeding',
      'electric priming pump',
      'air bleeding plug',
      'fuel piping',
      'fuel filter',
    ],
  },
  {
    pattern: /(هيدروليك|هايدروليك|زيت|تهريب|leak|oil|hydraulic|hose|خرطوم|سلندر|cylinder)/i,
    phrases: [
      'hydraulic oil leak',
      'hydraulic hose',
      'hydraulic cylinder',
      'oil leakage',
      'hydraulic circuit',
      'bleeding hydraulic circuit',
    ],
  },
  {
    pattern: /(كهرب|بطارية|حساس|سنسور|wire|wiring|electric|electrical|battery|sensor|لمبة|lamp|switch|سويتش)/i,
    phrases: [
      'electrical troubleshooting',
      'wiring harness',
      'sensor inspection',
      'battery circuit',
      'switch inspection',
      'lamp indicator',
    ],
  },
  {
    pattern: /(تبريد|راديتر|ماء|حرارة|coolant|radiator|overheat|سخونة|temperature)/i,
    phrases: [
      'cooling system',
      'radiator coolant',
      'engine overheating',
      'coolant level',
      'thermostat inspection',
    ],
  },
  {
    pattern: /(جنزير|track|undercarriage|رولر|roller|sprocket|idler|سلسلة)/i,
    phrases: [
      'undercarriage inspection',
      'track tension',
      'track roller',
      'sprocket',
      'idler',
    ],
  },
  {
    pattern: /(بريك|فرامل|brake|steering|دركسون|توجيه)/i,
    phrases: [
      'brake system',
      'steering system',
      'brake pedal',
      'steering clutch',
    ],
  },
];

const localTaskSearchMapSafe = [
  {
    pattern: /(\u062f\u064a\u0632\u0644|\u0645\u0627\u0632\u0648\u062a|\u0633\u0648\u0644\u0627\u0631|fuel|diesel|\u0641\u0644\u062a\u0631|\u0641\u0644\u062a\u0631\u0647|filter|\u0647\u0648\u0627|\u0647\u0648\u0627\u0621|\u0646\u0633\u062d\u0628|\u0646\u0641\u0636\u064a|\u062a\u0646\u0641\u064a\u0633|\u062a\u0646\u0633\u064a\u0645|\u0637\u0631\u0645\u0628\u0629|\u0628\u0645\u0628|bleed|bleeding|tanfees|diesal|deezel)/i,
    phrases: ['bleeding air from fuel circuit', 'fuel filter replacement', 'fuel circuit air bleeding', 'electric priming pump', 'air bleeding plug', 'fuel piping', 'fuel filter'],
  },
  {
    pattern: /(\u0647\u064a\u062f\u0631\u0648\u0644\u064a\u0643|\u0647\u0627\u064a\u062f\u0631\u0648\u0644\u064a\u0643|\u0632\u064a\u062a|\u062a\u0647\u0631\u064a\u0628|leak|oil|hydraulic|hose|\u062e\u0631\u0637\u0648\u0645|\u0633\u0644\u0646\u062f\u0631|cylinder|hydrulik|hydrolic)/i,
    phrases: ['hydraulic oil leak', 'hydraulic hose', 'hydraulic cylinder', 'oil leakage', 'hydraulic circuit', 'bleeding hydraulic circuit'],
  },
  {
    pattern: /(\u0643\u0647\u0631\u0628|\u0628\u0637\u0627\u0631\u064a\u0629|\u062d\u0633\u0627\u0633|\u0633\u0646\u0633\u0648\u0631|wire|wiring|electric|electrical|battery|sensor|\u0644\u0645\u0628\u0629|lamp|switch|\u0633\u0648\u064a\u062a\u0634|kahraba)/i,
    phrases: ['electrical troubleshooting', 'wiring harness', 'sensor inspection', 'battery circuit', 'switch inspection', 'lamp indicator'],
  },
  {
    pattern: /(\u062a\u0628\u0631\u064a\u062f|\u0631\u0627\u062f\u064a\u062a\u0631|\u0645\u0627\u0621|\u062d\u0631\u0627\u0631\u0629|coolant|radiator|overheat|\u0633\u062e\u0648\u0646\u0629|temperature)/i,
    phrases: ['cooling system', 'radiator coolant', 'engine overheating', 'coolant level', 'thermostat inspection'],
  },
  {
    pattern: /(\u062c\u0646\u0632\u064a\u0631|track|undercarriage|\u0631\u0648\u0644\u0631|roller|sprocket|idler|\u0633\u0644\u0633\u0644\u0629)/i,
    phrases: ['undercarriage inspection', 'track tension', 'track roller', 'sprocket', 'idler'],
  },
  {
    pattern: /(\u0628\u0631\u064a\u0643|\u0641\u0631\u0627\u0645\u0644|brake|steering|\u062f\u0631\u0643\u0633\u0648\u0646|\u062a\u0648\u062c\u064a\u0647)/i,
    phrases: ['brake system', 'steering system', 'brake pedal', 'steering clutch'],
  },
];

function localTaskSearchProfile(payload) {
  const rawText = [
    payload.task,
    payload.description,
    payload.notes,
  ].filter(Boolean).join(' ');
  const phrases = [];

  for (const item of [...localTaskSearchMap, ...localTaskSearchMapSafe]) {
    if (item.pattern.test(rawText)) {
      phrases.push(...item.phrases);
    }
  }

  return {
    interpretedTask: phrases[0] || String(payload.task || '').trim(),
    searchPhrases: [...new Set([
      rawText,
      payload.task,
      payload.description,
      payload.notes,
      ...phrases,
    ].filter(Boolean))],
    keywords: tokenizeSearchText([rawText, ...phrases].join(' ')),
    assumptions: phrases.length
      ? [`Expanded local task wording into ${phrases.length} technical manual search phrases.`]
      : ['Used the task text as written because no local synonym pattern matched.'],
    generatedBy: 'local-rules',
  };
}

async function generateTaskSearchProfileWithAi(payload) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      missingKey: true,
      errorMessage: 'OPENAI_API_KEY is not configured on the backend.',
    };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildManualChatCompletionBody({
        temperature: 0.1,
        messages: [
          {
            role: 'system',
            content: 'You convert messy Arabic/English field technician task wording into shop manual search language. Return JSON only. Include likely English technical task names, component names, synonyms, and uncertainty notes. Do not invent procedure details.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              machineModel: payload.machineModel,
              task: payload.task,
              description: payload.description,
              notes: payload.notes,
              requiredJsonShape: {
                interpretedTask: 'best technical English interpretation',
                searchPhrases: ['manual search phrase 1', 'manual search phrase 2'],
                keywords: ['component', 'action'],
                assumptions: ['why you interpreted it this way'],
              },
            }),
          },
        ],
      })),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        ok: false,
        errorMessage: `OpenAI request failed (${response.status}): ${errorData.error?.message || response.statusText || 'Unknown error'}`,
      };
    }
    const data = await response.json();
    const parsed = parseJsonFromModel(data.choices?.[0]?.message?.content);
    return {
      ok: true,
      interpretedTask: parsed.interpretedTask || payload.task,
      searchPhrases: Array.isArray(parsed.searchPhrases) ? parsed.searchPhrases.filter(Boolean) : [],
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.filter(Boolean) : [],
      assumptions: Array.isArray(parsed.assumptions) ? parsed.assumptions.filter(Boolean) : [],
      generatedBy: 'openai',
    };
  } catch (error) {
    return {
      ok: false,
      errorMessage: `OpenAI request failed: ${error.message}`,
    };
  }
}

async function buildTaskSearchProfile(payload) {
  const aiProfile = await generateTaskSearchProfileWithAi(payload);

  if (!aiProfile?.ok) {
    const rawText = [
      payload.task,
      payload.description,
      payload.notes,
    ].filter(Boolean).join(' ');

    return {
      interpretedTask: String(payload.task || '').trim(),
      searchPhrases: [rawText, payload.task, payload.description, payload.notes].filter(Boolean),
      keywords: tokenizeSearchText(rawText),
      assumptions: [
        aiProfile?.errorMessage || 'AI task interpretation failed. The system did not make a confident technical interpretation.',
      ],
      generatedBy: aiProfile?.missingKey ? 'missing-openai-key' : 'openai-error',
    };
  }

  const searchPhrases = [...new Set([
    aiProfile.interpretedTask,
    ...aiProfile.searchPhrases,
    payload.task,
    payload.description,
    payload.notes,
  ].filter(Boolean))];
  const keywords = [...new Set([
    ...tokenizeSearchText(searchPhrases.join(' ')),
    ...aiProfile.keywords.map((keyword) => String(keyword).toLowerCase()),
  ].filter(Boolean))];

  return {
    interpretedTask: aiProfile.interpretedTask || payload.task,
    searchPhrases,
    keywords,
    assumptions: [...new Set(aiProfile.assumptions)],
    generatedBy: 'openai',
  };
}

function scoreManualChunk(chunk, terms) {
  const haystack = `${chunk.section || ''} ${chunk.content || ''}`.toLowerCase();
  return terms.reduce((score, term) => {
    if (!term) return score;
    const value = String(term).toLowerCase();
    if (haystack.includes(value)) return score + (value.includes(' ') ? 8 : 2);
    const tokens = tokenizeSearchText(value);
    const tokenMatches = tokens.filter((token) => haystack.includes(token)).length;
    if (tokens.length > 1 && tokenMatches > 0) return score + tokenMatches;
    return score;
  }, 0);
}

async function findRelevantManualChunks(machineModel, searchProfile) {
  const prisma = requirePrisma();
  const normalizedModel = normalizeMachineModel(machineModel);
  const terms = [...new Set([
    ...(searchProfile.searchPhrases || []).map((phrase) => String(phrase).toLowerCase()),
    ...(searchProfile.keywords || []).map((keyword) => String(keyword).toLowerCase()),
  ].filter(Boolean))];
  const expandedTerms = expandManualSearchTerms(terms);

  const chunks = await prisma.shopManualChunk.findMany({
    where: buildManualChunkWhere(normalizedModel),
    include: shopManualChunkInclude,
    take: MANUAL_CHUNK_READ_LIMIT,
    orderBy: { createdAt: 'asc' },
  });

  return chunks
    .map((chunk) => ({ ...chunk, score: scoreManualChunk(chunk, expandedTerms) }))
    .filter((chunk) => chunk.score > 0 || expandedTerms.length === 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

function cleanManualTitle(value) {
  return String(value || '')
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ')
    .replace(/\.{3,}\s*\d*$/g, '')
    .replace(/\bSEN\d{5}-\d{2}\b/gi, '')
    .replace(/\bD155A-\d+\b/gi, '')
    .replace(/\b\d+\s+(Structure|Testing|Disassembly|Index)\b.*$/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/^[\d.\-\s]+/, '')
    .replace(/\b1SHOP MANUAL\b/gi, 'Shop Manual')
    .replace(/\s+\d+$/g, '')
    .trim()
    .slice(0, 180);
}

function normalizeManualMatchText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ')
    .replace(/\.{3,}/g, ' ')
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isGenericManualLine(value) {
  const line = String(value || '').trim();
  if (!line || line.length < 6) return true;
  if (/^\d+$/.test(line)) return true;
  if (/^SEN\d+/i.test(line)) return true;
  if (/^D155A-\d+$/i.test(line)) return true;
  if (/^(page|contents|index|testing and adjusting|disassembly and assembly)$/i.test(line)) return true;
  return false;
}

function looksLikeManualHeading(value) {
  const line = String(value || '').trim();
  if (isGenericManualLine(line)) return false;
  if (/\.{3,}\s*\d+\s*$/.test(line)) return true;
  if (/^(removal|installation|removal and installation|disassembly|assembly|testing|adjusting|bleeding|inspection|check|replace|replacement|maintenance|troubleshooting)\b/i.test(line)) {
    return true;
  }
  if (/\b(idler|roller|sprocket|track|fuel|hydraulic|pump|engine|blade|circuit|filter|brake|cooling|radiator|transmission|valve|cylinder|hose|motor|alternator|starter)\b/i.test(line) && line.length <= 120) {
    return true;
  }
  return false;
}

function isProceduralManualTitle(value) {
  return /\b(removal and installation|disassembly and assembly|spreading and installation|general disassembly|removal|installation|disassembly|assembly|testing|adjusting|bleeding|inspection|check|replacement|troubleshooting)\b/i.test(String(value || '').trim());
}

function hasProcedureLikeManualContent(chunks) {
  const text = (chunks || []).map((chunk) => chunk.content || '').join('\n');
  return /^(removal|installation|preparation)\s*$/im.test(text)
    || (
      /\b(special tools|required tools|removal|installation)\b/i.test(text)
      && /\b1\.\s+|\b2\.\s+|\b3\.\s+/i.test(text)
    );
}

function extractManualIndexCandidatesFromChunk(chunk) {
  const candidates = [];
  const lines = String(chunk.content || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (chunk.section && looksLikeManualHeading(chunk.section)) {
    candidates.push({
      title: cleanManualTitle(chunk.section),
      sourceType: 'section',
    });
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const nextLine = lines[index + 1] || '';
    const tocMatch = line.match(/^(.{6,180}?)\.{3,}\s*(\d+)?$/);
    if (tocMatch) {
      candidates.push({
        title: cleanManualTitle(tocMatch[1]),
        sourceType: 'index',
      });
      continue;
    }

    const combined = looksLikeManualHeading(line) && /^[a-z][a-z0-9\s-]{2,40}$/i.test(nextLine)
      ? `${line} ${nextLine}`
      : line;

    if (looksLikeManualHeading(combined)) {
      candidates.push({
        title: cleanManualTitle(combined),
        sourceType: 'heading',
      });
    }
  }

  return candidates.filter((candidate) => candidate.title && !isGenericManualLine(candidate.title));
}

function cleanManualLine(value) {
  return String(value || '')
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findManualSectionTitleInLines(lines, preferredTitle = '') {
  const preferred = normalizeManualMatchText(preferredTitle);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (/\.{3,}/.test(line) || isGenericManualLine(line)) continue;

    if (preferred) {
      const normalizedLine = normalizeManualMatchText(line);
      const nextLine = lines[index + 1] || '';
      const combined = nextLine && nextLine.length <= 70
        ? cleanManualTitle(`${line} ${nextLine}`)
        : cleanManualTitle(line);
      const normalizedCombined = normalizeManualMatchText(combined);
      const lineMatchesPreferred = normalizedLine === preferred || normalizedLine.includes(preferred);
      const combinedMatchesPreferred = normalizedCombined === preferred || normalizedCombined.includes(preferred);
      if (
        normalizedLine
        && line.length <= 180
        && (lineMatchesPreferred || combinedMatchesPreferred)
      ) {
        return {
          title: combinedMatchesPreferred && normalizedCombined !== normalizedLine ? combined : cleanManualTitle(line),
          index,
          nextLineUsed: combinedMatchesPreferred && normalizedCombined !== normalizedLine,
          exactPreferred: true,
        };
      }
    }

    if (!/^(removal|installation|removal and installation|disassembly|assembly|testing|adjusting|bleeding|inspection|check|replacement|spreading)\b/i.test(line)) {
      continue;
    }

    const nextLine = lines[index + 1] || '';
    const shouldJoinNext = nextLine
      && !/\.{3,}/.test(nextLine)
      && !isGenericManualLine(nextLine)
      && !/^(special tools|removal|installation|preparation)$/i.test(nextLine)
      && nextLine.length <= 70;
    const title = cleanManualTitle(shouldJoinNext ? `${line} ${nextLine}` : line);
    if (!title || isGenericManualLine(title)) continue;
    if (preferred) {
      const normalizedTitle = normalizeManualMatchText(title);
      if (!normalizedTitle.includes(preferred) && !preferred.includes(normalizedTitle)) continue;
    }
    return { title, index, nextLineUsed: shouldJoinNext };
  }
  return null;
}

function extractCleanSectionTitleFromChunks(chunks, preferredTitle = '') {
  for (const chunk of chunks) {
    const lines = String(chunk.content || '')
      .split('\n')
      .map(cleanManualLine)
      .filter(Boolean);

    const match = findManualSectionTitleInLines(lines, preferredTitle);
    if (match?.title) return match.title;
  }

  return null;
}

async function buildManualIndexCandidates(machineModel) {
  const prisma = requirePrisma();
  const normalizedModel = normalizeMachineModel(machineModel);
  const chunks = await prisma.shopManualChunk.findMany({
    where: buildManualChunkWhere(normalizedModel),
    include: shopManualChunkInclude,
    take: MANUAL_CHUNK_READ_LIMIT,
    orderBy: [{ manualId: 'asc' }, { pageNumber: 'asc' }, { createdAt: 'asc' }],
  });
  const seen = new Set();
  const candidates = [];

  for (const chunk of chunks) {
    for (const candidate of extractManualIndexCandidatesFromChunk(chunk)) {
      const key = `${chunk.manualId}:${candidate.title.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      candidates.push({
        id: `M${candidates.length + 1}`,
        chunkId: chunk.id,
        manualId: chunk.manualId,
        manual: chunk.manual?.title,
        machineModel: chunk.machineModel,
        page: chunk.pageNumber,
        title: candidate.title,
        sourceType: candidate.sourceType,
      });
    }
  }

  return candidates.slice(0, 1200);
}

function inferManualTaskIntent(payload, interpretedTask = '') {
  const text = [
    payload.task,
    payload.description,
    payload.notes,
    interpretedTask,
  ].filter(Boolean).join(' ').toLowerCase();
  return {
    removeInstall: /(remove|removal|replace|replacement|install|installation|disassembl|assembl|فك|تبديل|تغيير|استبدال)/i.test(text),
    adjustCheck: /(adjust|adjusting|clearance|check|inspect|measure|قياس|تشييك|فحص|ضبط|تعديل)/i.test(text),
    idler: /(idler|ايدلر|آيدلر|الايدلر|الآيدلر)/i.test(text),
    track: /(track|undercarriage|جنزير|شوز|سلسلة)/i.test(text),
  };
}

function scoreManualCandidateForIntent(candidate, intent) {
  const title = String(candidate?.title || '').toLowerCase();
  let score = 0;

  if (intent.idler && title.includes('idler')) score += 40;
  if (intent.track && /(track|undercarriage)/i.test(title)) score += 10;
  if (intent.removeInstall && /(removal and installation|removal|installation|disassembly|assembly)/i.test(title)) score += 35;
  if (intent.removeInstall && /(adjust|adjusting|clearance|testing)/i.test(title)) score -= 35;
  if (intent.adjustCheck && /(adjust|adjusting|clearance|testing|inspection|check)/i.test(title)) score += 20;
  if (/^removal and installation/i.test(title)) score += 8;
  if (/assembly/i.test(title)) score += 5;

  return score;
}

function scoreManualCandidateForTaskText(candidate, payload, interpretedTask = '') {
  const title = normalizeManualMatchText(candidate?.title);
  if (!title) return 0;

  const common = new Set(['and', 'the', 'with', 'from', 'into', 'only', 'that', 'this', 'for', 'work', 'task']);
  const terms = expandManualSearchTerms(tokenizeSearchText([
    payload.task,
    payload.description,
    payload.notes,
    interpretedTask,
  ].filter(Boolean).join(' '))).filter((term) => !common.has(term));

  let score = 0;
  for (const term of terms) {
    const normalizedTerm = normalizeManualMatchText(term);
    if (!normalizedTerm) continue;
    if (title.includes(normalizedTerm)) {
      score += normalizedTerm.includes(' ') ? 18 : 8;
      continue;
    }

    const tokens = tokenizeSearchText(normalizedTerm);
    const tokenMatches = tokens.filter((token) => title.includes(token)).length;
    if (tokens.length > 1 && tokenMatches > 0) score += tokenMatches * 3;
  }

  if (candidate?.sourceType === 'section' || candidate?.sourceType === 'heading') score += 3;
  return score;
}

function scoreChunkForManualTitle(chunk, candidate) {
  const title = normalizeManualMatchText(candidate?.title);
  if (!title) return 0;

  const section = normalizeManualMatchText(chunk.section);
  const content = normalizeManualMatchText(chunk.content);
  const haystack = `${section} ${content}`;
  const tokens = title.split(' ').filter((token) => token.length >= 3);
  const tokenMatches = tokens.filter((token) => haystack.includes(token)).length;
  let score = tokenMatches * 8;

  if (haystack.includes(title)) score += 120;
  if (section.includes(title)) score += 60;
  if (/special tools/i.test(chunk.content || '')) score += 25;
  if (/\bremoval\b/i.test(chunk.content || '')) score += 20;
  if (/\binstallation\b/i.test(chunk.content || '')) score += 15;
  if (/\b1\.\s|\b2\.\s|\b3\.\s/.test(chunk.content || '')) score += 10;
  if (/index and foreword/i.test(chunk.section || '') || /index and foreword/i.test(chunk.content || '')) score -= 90;
  if ((String(chunk.content || '').match(/\.{8,}/g) || []).length >= 3) score -= 70;

  return score;
}

function rankManualCandidatesForTask(payload, candidates, interpretedTask = '') {
  const intent = inferManualTaskIntent(payload, interpretedTask);
  return [...candidates]
    .map((candidate) => ({
      ...candidate,
      taskScore: scoreManualCandidateForIntent(candidate, intent)
        + scoreManualCandidateForTaskText(candidate, payload, interpretedTask),
    }))
    .sort((a, b) => {
      if (b.taskScore !== a.taskScore) return b.taskScore - a.taskScore;
      return String(a.title).localeCompare(String(b.title));
    });
}

function improveSelectedManualCandidates(payload, candidates, selectedCandidates, interpretedTask = '') {
  const intent = inferManualTaskIntent(payload, interpretedTask);
  if (!intent.removeInstall) return selectedCandidates;

  const selectedHasRemoval = selectedCandidates.some((candidate) => (
    /removal|installation|disassembly|assembly/i.test(candidate.title || '')
  ));
  if (selectedHasRemoval) return selectedCandidates;

  const ranked = rankManualCandidatesForTask(payload, candidates, interpretedTask);
  const strongerMatch = ranked.find((candidate) => (
    candidate.taskScore >= 60
    && /removal|installation|disassembly|assembly/i.test(candidate.title || '')
  ));

  if (!strongerMatch) return selectedCandidates;
  return [
    strongerMatch,
    ...selectedCandidates.filter((candidate) => candidate.id !== strongerMatch.id),
  ].slice(0, 5);
}

async function chooseManualIndexWithAi(payload, candidates) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      missingKey: true,
      errorMessage: 'OPENAI_API_KEY is not configured on the backend.',
    };
  }
  if (candidates.length === 0) {
    return {
      ok: false,
      errorMessage: 'No manual index headings were found for this machine model.',
    };
  }

  try {
    const rankedCandidates = rankManualCandidatesForTask(payload, candidates).slice(0, 260);
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildManualChatCompletionBody({
        temperature: 0.05,
        messages: [
          {
            role: 'system',
            content: 'You match messy Arabic/English field technician task wording to the best shop manual index or section titles. Choose only from the provided candidates. Return JSON only. Do not provide tools, PPE, or procedure details. If the task means remove, replace, install, or disassemble a component, strongly prefer Removal/Installation or Disassembly/Assembly sections over Adjusting/Testing sections for the same component. Select the best candidate first, then useful alternatives that could contain nearby procedure evidence.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              machineModel: payload.machineModel,
              task: payload.task,
              description: payload.description,
              notes: payload.notes,
              candidates: rankedCandidates.map((candidate) => ({
                id: candidate.id,
                title: candidate.title,
                page: candidate.page,
                manual: candidate.manual,
                taskScore: candidate.taskScore,
              })),
              requiredJsonShape: {
                interpretedTask: 'best technical English interpretation',
                selectedCandidateIds: ['M1', 'M2', 'M3 in ranked order, best first'],
                candidateReasons: [{ id: 'M1', reason: 'short evidence-based reason', confidence: 'high | medium | low' }],
                searchPhrases: ['extra search phrase if useful'],
                keywords: ['component', 'action'],
                assumptions: ['short reason for the chosen heading'],
                confidence: 'high | medium | low',
              },
            }),
          },
        ],
      })),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        ok: false,
        errorMessage: `OpenAI index selection failed (${response.status}): ${errorData.error?.message || response.statusText || 'Unknown error'}`,
      };
    }

    const data = await response.json();
    const parsed = parseJsonFromModel(data.choices?.[0]?.message?.content);
    const candidateMap = new Map(candidates.map((candidate) => [candidate.id, candidate]));
    const selectedIds = Array.isArray(parsed.selectedCandidateIds) ? parsed.selectedCandidateIds : [];
    const reasonById = new Map();
    if (Array.isArray(parsed.candidateReasons)) {
      for (const item of parsed.candidateReasons) {
        if (!item?.id) continue;
        reasonById.set(String(item.id), {
          reason: String(item.reason || '').trim(),
          confidence: item.confidence || parsed.confidence || 'low',
        });
      }
    } else if (parsed.candidateReasons && typeof parsed.candidateReasons === 'object') {
      for (const [id, reason] of Object.entries(parsed.candidateReasons)) {
        reasonById.set(String(id), {
          reason: typeof reason === 'string' ? reason : String(reason?.reason || ''),
          confidence: reason?.confidence || parsed.confidence || 'low',
        });
      }
    }
    const selectedCandidates = improveSelectedManualCandidates(payload, candidates, selectedIds
      .map((id) => candidateMap.get(String(id)))
      .filter(Boolean)
      .slice(0, 5), parsed.interpretedTask || payload.task);

    return {
      ok: true,
      interpretedTask: parsed.interpretedTask || payload.task,
      searchPhrases: Array.isArray(parsed.searchPhrases) ? parsed.searchPhrases.filter(Boolean) : [],
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.filter(Boolean) : [],
      assumptions: Array.isArray(parsed.assumptions) ? parsed.assumptions.filter(Boolean) : [],
      confidence: parsed.confidence || 'low',
      selectedCandidates,
      alternatives: selectedCandidates.map((candidate) => {
        const candidateReason = reasonById.get(candidate.id) || {};
        return {
          id: candidate.id,
          title: candidate.title,
          manual: candidate.manual,
          page: candidate.page,
          sourceType: candidate.sourceType,
          taskScore: candidate.taskScore,
          reason: candidateReason.reason || '',
          confidence: candidateReason.confidence || parsed.confidence || 'low',
        };
      }),
    };
  } catch (error) {
    return {
      ok: false,
      errorMessage: `OpenAI index selection failed: ${error.message}`,
    };
  }
}

async function findManualChunksForIndexSelection(machineModel, selectedCandidates, searchProfile) {
  const prisma = requirePrisma();
  const normalizedModel = normalizeMachineModel(machineModel);
  const chunks = await prisma.shopManualChunk.findMany({
    where: buildManualChunkWhere(normalizedModel),
    include: shopManualChunkInclude,
    take: MANUAL_CHUNK_READ_LIMIT,
    orderBy: [{ manualId: 'asc' }, { pageNumber: 'asc' }, { createdAt: 'asc' }],
  });
  const selectedKeys = new Set();
  const anchorScores = [];
  const selectedChunkIds = new Set((selectedCandidates || [])
    .map((candidate) => candidate?.chunkId)
    .filter(Boolean)
    .map((id) => String(id)));
  const userSelected = Boolean(searchProfile?.userSelected);
  const selectedOptionIsProcedural = Boolean(searchProfile?.selectedOptionIsProcedural)
    || (selectedCandidates || []).some((candidate) => isProceduralManualTitle(candidate?.title));
  const narrowToSelectedPage = userSelected && !selectedOptionIsProcedural;

  if (narrowToSelectedPage) {
    for (const candidate of selectedCandidates) {
      if (candidate?.manualId && Number.isFinite(candidate.page)) {
        selectedKeys.add(`${candidate.manualId}:${candidate.page}`);
      }
    }

    const exactChunks = chunks.filter((chunk) => (
      selectedChunkIds.has(String(chunk.id))
      || selectedKeys.has(`${chunk.manualId}:${chunk.pageNumber}`)
    ));
    if (exactChunks.length > 0) {
      return exactChunks.slice(0, Math.min(MANUAL_CONTEXT_CHUNK_LIMIT, 4));
    }
    selectedKeys.clear();
  }

  for (const candidate of selectedCandidates) {
    if (!candidate?.manualId) continue;
    for (const chunk of chunks.filter((item) => item.manualId === candidate.manualId)) {
      const score = scoreChunkForManualTitle(chunk, candidate);
      if (score > 60 && Number.isFinite(chunk.pageNumber)) {
        anchorScores.push({ chunk, score, candidate });
      }
    }
  }

  const anchors = anchorScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  for (const anchor of anchors) {
    const pageNumber = anchor.chunk.pageNumber;
    const pagesBefore = narrowToSelectedPage ? 0 : MANUAL_CONTEXT_PAGES_BEFORE;
    const pagesAfter = narrowToSelectedPage ? 0 : MANUAL_CONTEXT_PAGES_AFTER;
    for (let page = pageNumber - pagesBefore; page <= pageNumber + pagesAfter; page += 1) {
      if (page < 1) continue;
      selectedKeys.add(`${anchor.chunk.manualId}:${page}`);
    }
  }

  if (selectedKeys.size === 0) {
    for (const candidate of selectedCandidates) {
      if (!candidate?.manualId || !Number.isFinite(candidate.page)) continue;
      const pagesBefore = narrowToSelectedPage ? 0 : MANUAL_CONTEXT_PAGES_BEFORE;
      const pagesAfter = narrowToSelectedPage ? 0 : MANUAL_CONTEXT_PAGES_AFTER;
      for (let page = candidate.page - pagesBefore; page <= candidate.page + pagesAfter; page += 1) {
        if (page < 1) continue;
        selectedKeys.add(`${candidate.manualId}:${page}`);
      }
    }
  }

  const selectedChunks = chunks.filter((chunk) => selectedKeys.has(`${chunk.manualId}:${chunk.pageNumber}`));
  if (selectedChunks.length > 0) return selectedChunks.slice(0, MANUAL_CONTEXT_CHUNK_LIMIT);
  if (narrowToSelectedPage) return [];

  return findRelevantManualChunks(machineModel, searchProfile);
}

function fallbackManualSuggestion(payload, chunks) {
  const combined = chunks.map((chunk) => chunk.content).join('\n').toLowerCase();
  const warnings = [];
  const tools = ['Basic hand tools', 'Work light'];
  const ppe = ['Safety glasses', 'Work gloves', 'Safety shoes'];

  if (/fuel|diesel|bleed|filter/.test(combined)) {
    tools.push('Fuel spill tray', 'Absorbent rags');
    ppe.push('Fuel-resistant gloves');
    warnings.push('Fuel may be pressurized. Do not loosen plugs or lines while the pump is operating.');
  }
  if (/hydraulic|oil|lubricat|grease/.test(combined)) {
    tools.push('Oil absorbent pads', 'Drain pan');
    ppe.push('Oil-resistant gloves');
  }
  if (/electric|battery|wiring|sensor|lamp|switch/.test(combined)) {
    tools.push('Multimeter');
    warnings.push('Keep connectors and test equipment dry and isolate power where required.');
  }

  return {
    requiredTools: [...new Set(tools)],
    ppe: [...new Set(ppe)],
    consumables: [],
    warnings: warnings.length ? warnings : ['Review the referenced manual pages before starting work.'],
    procedureSummary: chunks.slice(0, 2).map((chunk) => chunk.section || chunk.content.slice(0, 120)),
    sources: chunks.map((chunk) => buildManualSourceFromChunk(chunk)),
    confidence: chunks.length ? 'medium' : 'low',
    generatedBy: 'rules',
    task: payload.task,
    interpretedTask: payload.searchProfile?.interpretedTask || payload.task,
    interpretationNotes: payload.searchProfile?.assumptions || [],
  };
}

function parseJsonFromModel(text) {
  const value = String(text || '').trim();
  const match = value.match(/\{[\s\S]*\}/);
  return JSON.parse(match ? match[0] : value);
}

function toCleanArray(value) {
  return Array.isArray(value)
    ? value.map((item) => {
      if (item && typeof item === 'object') {
        return String(item.text || item.name || item.title || item.value || '').trim();
      }
      return String(item || '').trim();
    }).filter((item) => item && item !== '-')
    : [];
}

function isMajorManualSectionHeading(line) {
  if (!line || /\.{3,}/.test(line) || isGenericManualLine(line)) return false;
  return /^(removal and installation|disassembly and assembly|spreading and installation|general disassembly|removal|installation|disassembly|assembly|testing|adjusting|bleeding|inspection|check|replacement)\b/i.test(line);
}

function getManualContentLineEntries(chunks, preferredTitle = '') {
  const entries = chunks
    .flatMap((chunk) => String(chunk.content || '').split('\n').map((line, lineIndex) => ({
      text: line.replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ').replace(/\s+/g, ' ').trim(),
      lineIndex,
      chunk,
    })))
    .filter((entry) => entry.text.length >= 8)
    .filter((entry) => !/^\d+$/.test(entry.text))
    .filter((entry) => !/\.{5,}/.test(entry.text))
    .filter((entry) => !/^-- \d+ of \d+ --$/.test(entry.text));

  const preferred = cleanManualTitle(preferredTitle);
  if (!preferred) return entries;

  const lines = entries.map((entry) => entry.text);
  const start = findManualSectionTitleInLines(lines, preferred);
  if (!start) return entries;

  const scoped = [];
  const startIndex = start.index + (start.nextLineUsed ? 2 : 1);
  scoped.push({ ...entries[start.index], text: start.title });

  for (let index = startIndex; index < lines.length; index += 1) {
    const line = lines[index];
    const nextLine = lines[index + 1] || '';
    const combinedTitle = cleanManualTitle(nextLine && nextLine.length <= 70 ? `${line} ${nextLine}` : line);
    const normalizedCombined = normalizeManualMatchText(combinedTitle);
    const normalizedPreferred = normalizeManualMatchText(preferred);

    if (isMajorManualSectionHeading(line) && normalizedCombined && !normalizedCombined.includes(normalizedPreferred) && !normalizedPreferred.includes(normalizedCombined)) {
      break;
    }
    scoped.push(entries[index]);
  }

  return scoped;
}

function getManualContentLines(chunks, preferredTitle = '') {
  return getManualContentLineEntries(chunks, preferredTitle).map((entry) => entry.text);
}

function mergeUniqueManualItems(...groups) {
  const seen = new Set();
  const values = [];
  for (const group of groups) {
    for (const item of group || []) {
      const value = String(item || '').replace(/\s+/g, ' ').trim();
      if (!value || value === '-') continue;
      const key = value.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      values.push(value);
    }
  }
  return values;
}

function buildManualSourceFromChunk(chunk, matchedSectionTitle = '') {
  const manualId = chunk?.manualId || chunk?.manual?.id;
  const page = chunk?.pageNumber;
  const pagePdfUrl = manualId && page
    ? `/api/shop-manuals/${manualId}/pages/${page}/pdf`
    : null;

  return {
    manualId,
    chunkId: chunk?.id,
    manual: chunk?.manual?.title,
    machineModel: chunk?.machineModel,
    page,
    section: matchedSectionTitle || cleanManualTitle(chunk?.section),
    pagePdfUrl,
    manualPdfUrl: manualId ? `/api/shop-manuals/${manualId}/file` : null,
  };
}

function buildManualSources(chunks, matchedSectionTitle = '') {
  const seen = new Set();
  const sources = [];

  for (const chunk of chunks || []) {
    const source = buildManualSourceFromChunk(chunk, matchedSectionTitle);
    const key = `${source.manual || ''}:${source.machineModel || ''}:${source.page || ''}:${source.section || ''}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    sources.push({
      ...source,
      matchedSectionTitle,
    });
  }

  return sources;
}

function scoreManualEvidenceLine(item, line) {
  const itemText = String(item || '').toLowerCase();
  const lineText = String(line || '').toLowerCase();
  if (!itemText || !lineText) return 0;

  let score = 0;
  if (lineText.includes(itemText)) score += 120;

  const itemPartNumbers = itemText.match(/\b\d{3}-\d{3}-\d{4}\b|\b\d{5}-\d{5}\b/g) || [];
  for (const partNumber of itemPartNumbers) {
    if (lineText.includes(partNumber)) score += 90;
  }

  const common = new Set(['and', 'the', 'with', 'from', 'into', 'only', 'that', 'this', 'for', 'use']);
  const tokens = tokenizeSearchText(itemText).filter((token) => !common.has(token));
  const tokenMatches = tokens.filter((token) => lineText.includes(token)).length;
  if (tokens.length > 0) {
    score += tokenMatches * 10;
    score += (tokenMatches / tokens.length) * 30;
  }

  return score;
}

function findManualEvidenceForItem(item, entries) {
  let best = null;

  for (const entry of entries || []) {
    const score = scoreManualEvidenceLine(item, entry.text);
    if (!best || score > best.score) {
      best = { entry, score };
    }
  }

  if (!best || best.score < 18) return null;

  return {
    ...buildManualSourceFromChunk(best.entry.chunk),
    excerpt: best.entry.text.slice(0, 240),
    matchScore: Math.round(best.score),
  };
}

function buildManualEvidence(suggestion, chunks, matchedSectionTitle = '') {
  const entries = getManualContentLineEntries(chunks, matchedSectionTitle);
  const evidence = {};
  const categories = ['requiredTools', 'ppe', 'consumables', 'warnings', 'procedureSummary'];

  for (const category of categories) {
    const items = toCleanArray(suggestion[category]);
    evidence[category] = items
      .map((item) => ({
        text: item,
        source: findManualEvidenceForItem(item, entries),
      }))
      .filter((item) => item.source);
  }

  return evidence;
}

function buildManualExcerptsForAi(chunks, matchedSectionTitle = '') {
  const entries = getManualContentLineEntries(chunks, matchedSectionTitle);
  const groups = new Map();

  for (const entry of entries) {
    const chunk = entry.chunk || {};
    const key = chunk.id || `${chunk.manualId || chunk.manual?.id || 'manual'}:${chunk.pageNumber || 0}`;
    if (!groups.has(key)) {
      groups.set(key, {
        order: groups.size,
        chunk,
        lines: [],
      });
    }
    groups.get(key).lines.push(entry.text);
  }

  let remaining = MANUAL_AI_CONTEXT_CHARS;
  const selected = [];
  const prioritizedGroups = [...groups.values()]
    .map((group) => {
      const text = group.lines.join('\n');
      let priority = 0;
      if (/special tools/i.test(text)) priority += 35;
      if (/\bremoval\b/i.test(text)) priority += 30;
      if (/\binstallation\b/i.test(text)) priority += 25;
      if (/\b\d+\.\s/.test(text)) priority += 20;
      if (/warning|never|be sure|pressure|fall|damage/i.test(text)) priority += 15;
      return { ...group, text, priority };
    })
    .sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.order - b.order;
    });

  for (const group of prioritizedGroups) {
    if (remaining <= 600) break;
    const content = group.text.slice(0, Math.min(4500, remaining));
    if (!content.trim()) continue;
    selected.push({
      ...buildManualSourceFromChunk(group.chunk, matchedSectionTitle),
      content,
    });
    remaining -= content.length;
  }

  return selected.sort((a, b) => {
    const pageA = Number.isFinite(a.page) ? a.page : 0;
    const pageB = Number.isFinite(b.page) ? b.page : 0;
    if (pageA !== pageB) return pageA - pageB;
    return String(a.section || '').localeCompare(String(b.section || ''));
  });
}

function groupManualChunksByPage(chunks) {
  const groups = new Map();

  for (const chunk of chunks || []) {
    const key = `${chunk.manualId || chunk.manual?.id || 'manual'}:${chunk.pageNumber || groups.size + 1}`;
    if (!groups.has(key)) {
      groups.set(key, {
        manual: chunk.manual?.title,
        machineModel: chunk.machineModel,
        page: chunk.pageNumber,
        section: cleanManualTitle(chunk.section),
        lines: [],
      });
    }
    groups.get(key).lines.push(String(chunk.content || ''));
  }

  return [...groups.values()]
    .sort((a, b) => {
      const pageA = Number.isFinite(a.page) ? a.page : 0;
      const pageB = Number.isFinite(b.page) ? b.page : 0;
      return pageA - pageB;
    });
}

function createManualSectionPdfBuffer(payload, chunks, matchedSectionTitle = '') {
  return new Promise((resolve, reject) => {
    const PDFDocument = require('pdfkit');
    const pages = groupManualChunksByPage(chunks).slice(0, MANUAL_PDF_PAGE_LIMIT);
    const doc = new PDFDocument({
      size: 'A4',
      margin: 42,
      bufferPages: false,
      info: {
        Title: `Manual section - ${matchedSectionTitle || payload.task || 'selected section'}`,
        Author: 'EQP Manual Assistant',
      },
    });
    const buffers = [];
    let writtenChars = 0;

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    doc.font('Helvetica-Bold').fontSize(15).text('Selected Shop Manual Section', { align: 'center' });
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(9).text(`Machine model: ${payload.machineModel || '-'}`);
    doc.text(`Task: ${payload.task || '-'}`);
    doc.text(`Selected section: ${matchedSectionTitle || '-'}`);
    doc.text('Generated for AI extraction from indexed manual text.');
    doc.moveDown();

    for (const [index, page] of pages.entries()) {
      if (index > 0) doc.addPage();
      const header = [
        page.manual || 'Manual',
        page.machineModel || payload.machineModel,
        page.page ? `page ${page.page}` : '',
        matchedSectionTitle || page.section || '',
      ].filter(Boolean).join(' | ');
      const remaining = MANUAL_PDF_CONTEXT_CHARS - writtenChars;
      if (remaining <= 0) break;
      const content = page.lines.join('\n\n').slice(0, remaining);
      writtenChars += content.length;

      doc.font('Helvetica-Bold').fontSize(11).text(header || `Manual excerpt ${index + 1}`);
      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(8.5).text(content || '-', {
        align: 'left',
        lineGap: 2,
      });
    }

    doc.end();
  });
}

const manualSuggestionJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'schemaVersion',
    'matchedSectionTitle',
    'interpretedTask',
    'confidence',
    'sourceQuality',
    'requiredTools',
    'ppe',
    'consumables',
    'warnings',
    'procedureSummary',
    'interpretationNotes',
    'missingInformation',
  ],
  properties: {
    schemaVersion: { type: 'string' },
    matchedSectionTitle: { type: 'string' },
    interpretedTask: { type: 'string' },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    sourceQuality: { type: 'string', enum: ['exact_section', 'related_section', 'partial_ocr', 'insufficient'] },
    requiredTools: { type: 'array', items: { type: 'string' } },
    ppe: { type: 'array', items: { type: 'string' } },
    consumables: { type: 'array', items: { type: 'string' } },
    warnings: { type: 'array', items: { type: 'string' } },
    procedureSummary: { type: 'array', items: { type: 'string' } },
    interpretationNotes: { type: 'array', items: { type: 'string' } },
    missingInformation: { type: 'array', items: { type: 'string' } },
  },
};

function extractResponsesOutputText(data) {
  if (typeof data?.output_text === 'string') return data.output_text;

  for (const item of data?.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === 'string') return content.text;
      if (typeof content.output_text === 'string') return content.output_text;
    }
  }

  return '';
}

async function generateManualSuggestionWithPdfAi(payload, chunks) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || chunks.length === 0) return null;

  const matchedSectionTitle = payload.searchProfile?.matchedSectionTitle
    || cleanManualTitle(payload.searchProfile?.selectedManualTitles?.[0]?.title)
    || cleanManualTitle(chunks[0]?.section);
  const pdfBuffer = await createManualSectionPdfBuffer(payload, chunks, matchedSectionTitle);

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: getManualPdfModel(),
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_file',
                filename: `${normalizeMachineModel(payload.machineModel) || 'manual'}-selected-section.pdf`,
                file_data: pdfBuffer.toString('base64'),
              },
              {
                type: 'input_text',
                text: JSON.stringify({
                  instruction: [
                    'Read the attached PDF section like a senior Komatsu shop manual advisor.',
                    'Return only information supported by the PDF.',
                    'If a tool, warning, consumable, or step is not visible in the PDF, leave it out and mention it in missingInformation.',
                    'If the selected section is only a parts list, specification line, index entry, or component listing, set sourceQuality to insufficient and do not infer removal or installation steps from nearby unrelated sections.',
                    'Keep procedureSummary practical and ordered for a field technician.',
                    'Preserve readable part numbers exactly.',
                  ],
                  machineModel: payload.machineModel,
                  task: payload.task,
                  description: payload.description,
                  notes: payload.notes,
                  selectedManualTitles: payload.searchProfile?.selectedManualTitles,
                  matchedSectionTitle,
                  requiredOutput: 'JSON matching the provided schema.',
                }),
              },
            ],
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'manual_suggestion',
            strict: true,
            schema: manualSuggestionJsonSchema,
          },
        },
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const parsed = parseJsonFromModel(extractResponsesOutputText(data));

    return completeManualSuggestionFromChunks({
      ...parsed,
      generatedBy: 'openai-pdf',
      task: payload.task,
      interpretedTask: parsed.interpretedTask || payload.searchProfile?.interpretedTask || payload.task,
      interpretationNotes: [
        ...(payload.searchProfile?.assumptions || []),
        ...toCleanArray(parsed.interpretationNotes),
        ...toCleanArray(parsed.missingInformation).map((item) => `Missing from selected PDF: ${item}`),
      ],
      selectedManualTitles: payload.searchProfile?.selectedManualTitles || [],
      alternatives: payload.searchProfile?.manualAlternatives || [],
      matchedSectionTitle: parsed.matchedSectionTitle || matchedSectionTitle,
      selectionMode: payload.searchProfile?.generatedBy,
      userSelected: payload.searchProfile?.userSelected,
      selectedOptionIsProcedural: payload.searchProfile?.selectedOptionIsProcedural,
    }, chunks);
  } catch {
    return null;
  }
}

function buildManualOption(option, fallback = {}) {
  return {
    id: option.id || fallback.id,
    title: option.title || fallback.title,
    manual: option.manual || fallback.manual,
    page: option.page || fallback.page,
    sourceType: option.sourceType || fallback.sourceType,
    taskScore: option.taskScore ?? fallback.taskScore,
    reason: option.reason || fallback.reason || '',
    confidence: option.confidence || fallback.confidence || 'medium',
  };
}

function uniqueManualOptions(options) {
  const seen = new Set();
  const values = [];

  for (const option of options || []) {
    const value = buildManualOption(option);
    if (!value.id && !value.title) continue;
    const key = `${value.id || ''}:${value.manual || ''}:${value.title || ''}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    values.push(value);
  }

  return values;
}

function buildManualSuggestionSearchProfile(payload, machineModel, indexChoice) {
  const selectedManualTitles = (indexChoice.selectedCandidates || []).map((candidate) => ({
    title: candidate.title,
    manual: candidate.manual,
    page: candidate.page,
    sourceType: candidate.sourceType,
    confidence: indexChoice.confidence,
    isProcedural: isProceduralManualTitle(candidate.title),
    userSelected: indexChoice.generatedBy === 'manual-user-selection',
  }));
  const taskIntent = inferManualTaskIntent(payload, indexChoice.interpretedTask || payload.task);
  const selectedOptionIsProcedural = selectedManualTitles.some((candidate) => candidate.isProcedural);

  return {
    interpretedTask: indexChoice.interpretedTask || payload.task,
    searchPhrases: [...new Set([
      indexChoice.interpretedTask,
      ...(indexChoice.searchPhrases || []),
      ...(indexChoice.selectedCandidates || []).map((candidate) => candidate.title),
      payload.task,
      payload.description,
      payload.notes,
    ].filter(Boolean))],
    keywords: [...new Set([
      ...(indexChoice.keywords || []).map((keyword) => String(keyword).toLowerCase()),
      ...tokenizeSearchText([
        indexChoice.interpretedTask,
        ...(indexChoice.searchPhrases || []),
        ...(indexChoice.selectedCandidates || []).map((candidate) => candidate.title),
      ].join(' ')),
    ].filter(Boolean))],
    assumptions: [...new Set(indexChoice.assumptions || [])],
    generatedBy: indexChoice.generatedBy || 'openai-index',
    userSelected: indexChoice.generatedBy === 'manual-user-selection',
    taskNeedsProcedure: Boolean(taskIntent.removeInstall || taskIntent.adjustCheck),
    selectedOptionIsProcedural,
    matchedSectionTitle: cleanManualTitle(indexChoice.selectedCandidates?.[0]?.title),
    selectedManualTitles,
    manualAlternatives: indexChoice.alternatives || [],
  };
}

function buildManualOptionsFromIndexChoice(payload, candidates, indexChoice) {
  const taskIntent = inferManualTaskIntent(payload, indexChoice.interpretedTask || payload.task);
  const taskNeedsProcedure = Boolean(taskIntent.removeInstall || taskIntent.adjustCheck);
  const decorateOption = (option) => {
    if (!taskNeedsProcedure || isProceduralManualTitle(option.title)) return option;
    return {
      ...option,
      confidence: option.confidence === 'high' ? 'medium' : option.confidence,
      reason: option.reason
        ? `${option.reason} This looks like a parts/spec listing, so final advice may be limited.`
        : 'This looks like a parts/spec listing, so final advice may be limited.',
    };
  };
  const selectedOptions = (indexChoice.selectedCandidates || []).map((candidate) => {
    const alternative = (indexChoice.alternatives || []).find((item) => item.id === candidate.id) || {};
    return decorateOption(buildManualOption(candidate, {
      reason: alternative.reason || 'Best match selected from the manual index.',
      confidence: alternative.confidence || indexChoice.confidence,
    }));
  });
  const rankedOptions = rankManualCandidatesForTask(payload, candidates, indexChoice.interpretedTask || payload.task)
    .slice(0, 12)
    .map((candidate) => decorateOption(buildManualOption(candidate, {
      reason: candidate.taskScore > 0 ? 'Related section found by task keyword and intent scoring.' : 'Nearby manual section candidate.',
      confidence: candidate.taskScore >= 40 ? 'medium' : 'low',
    })));

  return uniqueManualOptions([
    ...(indexChoice.alternatives || []).map((option) => decorateOption(buildManualOption(option))),
    ...selectedOptions,
    ...rankedOptions,
  ]).slice(0, 8);
}

function buildSelectedManualIndexChoice(payload, candidates) {
  const selectedIds = Array.isArray(payload.selectedManualCandidateIds)
    ? payload.selectedManualCandidateIds.map((id) => String(id))
    : [];
  const candidateMap = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  const selectedCandidates = selectedIds
    .map((id) => candidateMap.get(id))
    .filter(Boolean)
    .slice(0, 5);

  if (selectedCandidates.length === 0) return null;

  const options = Array.isArray(payload.manualOptions) ? payload.manualOptions : [];
  const optionMap = new Map(options.map((option) => [String(option.id), option]));
  const alternatives = uniqueManualOptions([
    ...selectedCandidates.map((candidate) => buildManualOption(candidate, optionMap.get(candidate.id) || {})),
    ...options,
  ]);

  return {
    ok: true,
    generatedBy: 'manual-user-selection',
    interpretedTask: payload.interpretedTask || payload.task,
    searchPhrases: Array.isArray(payload.searchPhrases) ? payload.searchPhrases : [],
    keywords: tokenizeSearchText([
      payload.task,
      payload.description,
      payload.notes,
      payload.interpretedTask,
      ...selectedCandidates.map((candidate) => candidate.title),
    ].filter(Boolean).join(' ')),
    assumptions: [
      'The user selected the closest manual section before generating advice.',
      ...(Array.isArray(payload.interpretationNotes) ? payload.interpretationNotes : []),
    ],
    confidence: 'high',
    selectedCandidates,
    alternatives,
  };
}

function extractManualProcedureFallback(chunks, matchedSectionTitle = '') {
  const lines = getManualContentLines(chunks, matchedSectionTitle);
  const procedure = [];
  let current = null;
  let inProcedure = false;

  for (const line of lines) {
    if (/^(removal|installation|preparation)$/i.test(line)) {
      inProcedure = true;
      current = null;
      procedure.push(line);
      continue;
    }
    if (/^(special tools|sym-?bol|part no\.?|necessity|sketch)$/i.test(line)) continue;
    if (/^(sources?|form no\.?|machine model|serial number)/i.test(line)) continue;

    if (/^\d+\.\s/.test(line)) {
      if (current) procedure.push(current);
      current = line;
      continue;
    }

    if (current && !/^\d+\)|^\d+\./.test(line) && !/^(removal|installation|special tools)$/i.test(line)) {
      current = `${current} ${line}`.slice(0, 320);
      continue;
    }

    if (inProcedure && (
      /^a\s/i.test(line)
      || /\b(remove|disconnect|install|tighten|loosen|sling|replace|check|never|be sure|align|apply|drain|open)\b/i.test(line)
    )) {
      procedure.push(line);
    }
  }

  if (current) procedure.push(current);

  return mergeUniqueManualItems(procedure).slice(0, 14);
}

function extractManualToolFallback(chunks, matchedSectionTitle = '') {
  const lines = getManualContentLines(chunks, matchedSectionTitle);
  const tools = [];
  let inSpecialTools = false;

  for (const line of lines) {
    if (/^special tools$/i.test(line)) {
      inSpecialTools = true;
      continue;
    }
    if (inSpecialTools && /^(removal|installation|preparation)$/i.test(line)) {
      inSpecialTools = false;
    }
    if (!inSpecialTools) continue;

    const match = line.match(/(\d{3}-\d{3}-\d{4}|\d{5}-\d{5})\s+([A-Za-z][A-Za-z0-9 /().-]{1,60}?)(?:\s+\d+)?$/);
    if (match) {
      tools.push(`${match[2].trim()} (${match[1]})`);
    }
  }

  const text = lines.join('\n');
  const patterns = [
    /standard puller/i,
    /hydraulic pump/i,
    /hydraulic jack/i,
    /floor jack/i,
    /wire rope/i,
    /\bblocks?\b/i,
    /\bstands?\b/i,
    /\bsling\b/i,
    /\bpuller\b/i,
    /\binstaller\b/i,
    /\boil pump\b/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) tools.push(match[0].replace(/\b\w/g, (letter) => letter.toUpperCase()));
  }

  return mergeUniqueManualItems(tools).slice(0, 12);
}

function extractManualConsumablesFallback(chunks, matchedSectionTitle = '') {
  const lines = getManualContentLines(chunks, matchedSectionTitle);
  const consumables = [];

  for (const line of lines) {
    if (/\b(grease|oil|adhesive|LT-\d|EO-\d|coolant|washer|bolt|gasket|seal|O-ring|packing|fuel high-pressure pipe)\b/i.test(line)) {
      consumables.push(line);
    }
  }

  return mergeUniqueManualItems(consumables).slice(0, 8);
}

function extractManualWarningsFallback(chunks, matchedSectionTitle = '') {
  const lines = getManualContentLines(chunks, matchedSectionTitle)
    .filter((line) => /never|be sure|care|prevent|warning|pressure|fall|damage|misaligned|leakage|disconnect the cable|negative/i.test(line));
  return mergeUniqueManualItems(lines).slice(0, 8);
}

function completeManualSuggestionFromChunks(suggestion, chunks) {
  const procedureSummary = toCleanArray(suggestion.procedureSummary);
  const requiredTools = toCleanArray(suggestion.requiredTools);
  const warnings = toCleanArray(suggestion.warnings);
  const consumables = toCleanArray(suggestion.consumables);
  const selectedManualTitle = suggestion.selectedManualTitles?.[0] || {};
  const preferredSectionTitle = cleanManualTitle(suggestion.selectedManualTitles?.[0]?.title)
    || cleanManualTitle(suggestion.matchedSectionTitle);
  const userSelected = Boolean(
    suggestion.userSelected
    || suggestion.selectionMode === 'manual-user-selection'
    || selectedManualTitle.userSelected
  );
  const selectedTitleIsProcedural = Boolean(selectedManualTitle.isProcedural)
    || isProceduralManualTitle(preferredSectionTitle);
  const procedureContentAvailable = hasProcedureLikeManualContent(chunks);
  const lockedNonProceduralSelection = userSelected && !selectedTitleIsProcedural && !procedureContentAvailable;
  const matchedSectionTitle = extractCleanSectionTitleFromChunks(chunks, preferredSectionTitle)
    || (userSelected && preferredSectionTitle ? preferredSectionTitle : extractCleanSectionTitleFromChunks(chunks))
    || preferredSectionTitle;
  const manualTools = lockedNonProceduralSelection ? [] : extractManualToolFallback(chunks, matchedSectionTitle);
  const manualWarnings = lockedNonProceduralSelection ? [] : extractManualWarningsFallback(chunks, matchedSectionTitle);
  const manualConsumables = lockedNonProceduralSelection ? [] : extractManualConsumablesFallback(chunks, matchedSectionTitle);
  const manualProcedure = lockedNonProceduralSelection ? [] : extractManualProcedureFallback(chunks, matchedSectionTitle);
  const sourceQualityNote = lockedNonProceduralSelection
    ? 'Selected manual section appears to be a parts/specification listing, not a removal/installation procedure. Choose a removal/installation section for procedure steps.'
    : null;
  const completed = {
    ...suggestion,
    matchedSectionTitle,
    requiredTools: mergeUniqueManualItems(manualTools, requiredTools).slice(0, 12),
    ppe: toCleanArray(suggestion.ppe),
    consumables: mergeUniqueManualItems(manualConsumables, consumables).slice(0, 10),
    warnings: mergeUniqueManualItems(sourceQualityNote ? [sourceQualityNote] : [], manualWarnings, warnings).slice(0, 10),
    procedureSummary: mergeUniqueManualItems(manualProcedure, procedureSummary).slice(0, 14),
    confidence: lockedNonProceduralSelection ? 'low' : suggestion.confidence,
    sourceQuality: lockedNonProceduralSelection ? 'insufficient' : suggestion.sourceQuality,
    interpretationNotes: mergeUniqueManualItems(
      toCleanArray(suggestion.interpretationNotes),
      sourceQualityNote ? [sourceQualityNote] : [],
    ),
    sources: buildManualSources(chunks, matchedSectionTitle).slice(0, 10),
  };

  return {
    ...completed,
    evidence: buildManualEvidence(completed, chunks, matchedSectionTitle),
  };
}

async function generateManualSuggestionWithAi(payload, chunks) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || chunks.length === 0) return null;
  const manualExcerpts = buildManualExcerptsForAi(chunks, payload.searchProfile?.matchedSectionTitle);
  const excerpts = manualExcerpts.length ? manualExcerpts : chunks.slice(0, 4).map((chunk) => ({
    ...buildManualSourceFromChunk(chunk, payload.searchProfile?.matchedSectionTitle),
    content: String(chunk.content || '').slice(0, 3000),
  }));

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildManualChatCompletionBody({
        temperature: 0.1,
        messages: [
          {
            role: 'system',
            content: 'You extract required tools, PPE, consumables, warnings, and a short procedure summary from Komatsu disassembly/assembly shop manual excerpts. These manuals usually contain a clean section title, warning/note lines, a Special tools table, then Removal/Installation steps. Answer only using the supplied excerpts. Do not invent tools. Preserve part numbers when listed. If the text is OCR-damaged, extract only the readable technical lines.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              task: payload.task,
              description: payload.description,
              notes: payload.notes,
              machineModel: payload.machineModel,
              interpretedTask: payload.searchProfile?.interpretedTask,
              searchAssumptions: payload.searchProfile?.assumptions,
              selectedManualTitles: payload.searchProfile?.selectedManualTitles,
              alternatives: payload.searchProfile?.manualAlternatives,
              excerpts,
              context: {
                excerptCount: excerpts.length,
                maxContextCharacters: MANUAL_AI_CONTEXT_CHARS,
              },
              extractionRules: [
                'Use Special tools table rows for requiredTools, including part numbers where readable.',
                'Use warning/note lines beginning with a, never, be sure, prevent, pressure, fall, or damage for warnings.',
                'Use Removal, Installation, and numbered steps for procedureSummary.',
                'Use oils, grease, adhesive, seals, gaskets, replacement bolts/washers, and specified pipes as consumables.',
                'Do not use index/table-of-contents lines as procedure evidence.',
                'If the selected title is a parts/specification listing instead of a procedure section, return insufficient information instead of borrowing steps from another heading.',
                'Prefer items that can be tied to a supplied page/section excerpt.',
              ],
              requiredJsonShape: {
                requiredTools: [],
                ppe: [],
                consumables: [],
                warnings: [],
                procedureSummary: [],
                sources: [],
                matchedSectionTitle: 'clean manual section title only',
                interpretedTask: '',
                interpretationNotes: [],
                confidence: 'high | medium | low',
              },
            }),
          },
        ],
      })),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return completeManualSuggestionFromChunks({
      ...parseJsonFromModel(data.choices?.[0]?.message?.content),
      generatedBy: 'openai',
      task: payload.task,
      interpretedTask: payload.searchProfile?.interpretedTask || payload.task,
      interpretationNotes: payload.searchProfile?.assumptions || [],
      selectedManualTitles: payload.searchProfile?.selectedManualTitles || [],
      alternatives: payload.searchProfile?.manualAlternatives || [],
      matchedSectionTitle: payload.searchProfile?.matchedSectionTitle,
      selectionMode: payload.searchProfile?.generatedBy,
      userSelected: payload.searchProfile?.userSelected,
      selectedOptionIsProcedural: payload.searchProfile?.selectedOptionIsProcedural,
    }, chunks);
  } catch {
    return null;
  }
}

async function suggestManualOptions(payload) {
  const machineModel = normalizeMachineModel(payload.machineModel);
  if (!machineModel) {
    throw new ApiError(400, 'machineModel is required to search shop manuals.');
  }
  if (!String(payload.task || '').trim()) {
    throw new ApiError(400, 'task is required.');
  }

  const candidates = await buildManualIndexCandidates(machineModel);
  const indexChoice = await chooseManualIndexWithAi({ ...payload, machineModel }, candidates);

  if (!indexChoice.ok) {
    const options = rankManualCandidatesForTask({ ...payload, machineModel }, candidates, payload.task)
      .slice(0, 8)
      .map((candidate) => buildManualOption(candidate, {
        reason: 'Local fallback match from manual title and task keywords.',
        confidence: candidate.taskScore >= 40 ? 'medium' : 'low',
      }));

    return {
      machineModel,
      task: payload.task,
      interpretedTask: payload.task,
      interpretationNotes: [indexChoice.errorMessage || 'The system could not choose manual options for this task.'],
      searchPhrases: [],
      confidence: options.length ? 'medium' : 'low',
      generatedBy: indexChoice.missingKey ? 'missing-openai-key' : 'openai-index-error',
      options,
    };
  }

  return {
    machineModel,
    task: payload.task,
    interpretedTask: indexChoice.interpretedTask || payload.task,
    interpretationNotes: [...new Set(indexChoice.assumptions || [])],
    searchPhrases: [...new Set([
      indexChoice.interpretedTask,
      ...(indexChoice.searchPhrases || []),
      payload.task,
      payload.description,
      payload.notes,
    ].filter(Boolean))],
    confidence: indexChoice.confidence || 'medium',
    generatedBy: 'openai-index',
    options: buildManualOptionsFromIndexChoice({ ...payload, machineModel }, candidates, indexChoice),
  };
}

async function suggestManualTools(payload) {
  const machineModel = normalizeMachineModel(payload.machineModel);
  if (!machineModel) {
    throw new ApiError(400, 'machineModel is required to search shop manuals.');
  }
  if (!String(payload.task || '').trim()) {
    throw new ApiError(400, 'task is required.');
  }

  const indexCandidates = await buildManualIndexCandidates(machineModel);
  const selectedIndexChoice = buildSelectedManualIndexChoice({ ...payload, machineModel }, indexCandidates);
  const indexChoice = selectedIndexChoice || await chooseManualIndexWithAi({ ...payload, machineModel }, indexCandidates);
  if (!indexChoice.ok) {
    return {
      requiredTools: [],
      ppe: [],
      consumables: [],
      warnings: [indexChoice.errorMessage || 'AI manual index selection failed.'],
      procedureSummary: [],
      sources: [],
      confidence: 'low',
      generatedBy: indexChoice.missingKey ? 'missing-openai-key' : 'openai-index-error',
      task: payload.task,
      interpretedTask: payload.task,
      interpretationNotes: [indexChoice.errorMessage || 'The system could not choose a manual index heading for this task.'],
      searchPhrases: [],
      selectedManualTitles: [],
      alternatives: [],
      evidence: {},
    };
  }

  const searchProfile = buildManualSuggestionSearchProfile(payload, machineModel, indexChoice);
  const enrichedPayload = { ...payload, machineModel, searchProfile };
  const chunks = await findManualChunksForIndexSelection(machineModel, indexChoice.selectedCandidates || [], searchProfile);
  if (chunks.length === 0) {
    return {
      requiredTools: [],
      ppe: [],
      consumables: [],
      warnings: ['No matching manual section was found for this task and machine model.'],
      procedureSummary: [],
      sources: [],
      confidence: 'low',
      generatedBy: 'none',
      task: payload.task,
      interpretedTask: searchProfile.interpretedTask,
      interpretationNotes: searchProfile.assumptions,
      searchPhrases: searchProfile.searchPhrases,
      matchedSectionTitle: searchProfile.matchedSectionTitle,
      selectedManualTitles: searchProfile.selectedManualTitles,
      alternatives: searchProfile.manualAlternatives,
      evidence: {},
    };
  }

  const suggestion = await generateManualSuggestionWithPdfAi(enrichedPayload, chunks)
    || await generateManualSuggestionWithAi(enrichedPayload, chunks);
  if (!suggestion) {
    return completeManualSuggestionFromChunks({
      requiredTools: [],
      ppe: [],
      consumables: [],
      warnings: ['AI extraction was unavailable, so the system used readable lines from the selected manual section only.'],
      procedureSummary: [],
      confidence: 'low',
      generatedBy: 'rules-extraction',
      task: payload.task,
      interpretedTask: searchProfile.interpretedTask,
      interpretationNotes: searchProfile.assumptions,
      searchPhrases: searchProfile.searchPhrases,
      matchedSectionTitle: searchProfile.matchedSectionTitle,
      selectedManualTitles: searchProfile.selectedManualTitles,
      alternatives: searchProfile.manualAlternatives,
      selectionMode: searchProfile.generatedBy,
      userSelected: searchProfile.userSelected,
      selectedOptionIsProcedural: searchProfile.selectedOptionIsProcedural,
      evidence: {},
    }, chunks);
  }

  return {
    ...suggestion,
    interpretedTask: suggestion.interpretedTask || searchProfile.interpretedTask,
    interpretationNotes: suggestion.interpretationNotes || searchProfile.assumptions,
    searchPhrases: searchProfile.searchPhrases,
    matchedSectionTitle: suggestion.matchedSectionTitle || searchProfile.matchedSectionTitle,
    selectedManualTitles: suggestion.selectedManualTitles || searchProfile.selectedManualTitles,
    alternatives: suggestion.alternatives || searchProfile.manualAlternatives,
  };
}

function dailyScheduleDateRange(fromText, toText) {
  const from = normalizeDateText(fromText);
  const to = normalizeDateText(toText || from);
  if (to < from) {
    throw new ApiError(400, 'History end date cannot be before the start date.');
  }
  return {
    from,
    to,
    fromDate: toWorkDate(from),
    toDate: toWorkDate(to),
  };
}

async function assertDailyScheduleTechniciansAvailable(prisma, technicianIds, workDate, excludeTaskId = null) {
  const technicians = await prisma.technicianProfile.findMany({
    where: { id: { in: technicianIds }, deletedAt: null },
    select: { id: true },
  });

  if (technicians.length !== technicianIds.length) {
    throw new ApiError(400, 'One or more selected technicians are not available.');
  }

  const existingAssignments = await prisma.dailyScheduleTaskTechnician.findMany({
    where: {
      technicianId: { in: technicianIds },
      task: {
        workDate,
        deletedAt: null,
        ...(excludeTaskId ? { id: { not: excludeTaskId } } : {}),
      },
    },
    include: {
      technician: {
        include: {
          user: { select: publicUserSelect },
        },
      },
    },
  });

  if (existingAssignments.length > 0) {
    const names = existingAssignments
      .map((assignment) => assignment.technician.user.fullName || assignment.technician.employeeCode)
      .join(', ');
    throw new ApiError(409, `Already assigned for this day: ${names}`);
  }
}

function normalizeNotification(notification) {
  return {
    id: notification.id,
    type: notification.type,
    severity: notification.severity,
    title: notification.title,
    message: notification.message,
    href: notification.href,
    readAt: notification.readAt,
    createdAt: notification.createdAt,
    createdById: notification.createdById,
  };
}

async function createNotifications(prisma, userIds, payload) {
  const recipients = uniqueIds(userIds).filter(Boolean);
  if (recipients.length === 0) return;

  await prisma.notification.createMany({
    data: recipients.map((userId) => ({
      userId,
      type: payload.type || 'SYSTEM',
      severity: payload.severity || 'info',
      title: String(payload.title || 'Notification').slice(0, 160),
      message: String(payload.message || '').slice(0, 600),
      href: payload.href || null,
      createdById: payload.createdById || null,
    })),
  });
}

async function ensureWelcomeNotifications(prisma, userId) {
  const existingCount = await prisma.notification.count({
    where: { userId, type: 'SYSTEM_WELCOME' },
  });

  if (existingCount > 0) return;

  await createNotifications(prisma, [userId], {
    type: 'SYSTEM_WELCOME',
    severity: 'info',
    title: 'Dar Al Hai notifications are active',
    message: 'You will receive schedule, EQP, and operational alerts in this panel.',
    href: '/management',
  });
}

async function findScheduleManagerUserIds(prisma) {
  const userRoles = await prisma.userRole.findMany({
    where: {
      user: { deletedAt: null, status: 'ACTIVE' },
      role: {
        deletedAt: null,
        permissions: {
          some: {
            permission: { code: 'SCHEDULE_MANAGE' },
          },
        },
      },
    },
    include: {
      user: { select: { id: true } },
    },
  });

  return uniqueIds(userRoles.map((userRole) => userRole.user.id));
}

async function listNotifications(actor, limit = 12) {
  const prisma = requirePrisma();
  const userId = actor?.sub;
  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }

  await ensureWelcomeNotifications(prisma, userId);

  const take = Math.min(Math.max(Number(limit) || 12, 1), 30);
  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take,
    }),
    prisma.notification.count({
      where: { userId, readAt: null, deletedAt: null },
    }),
  ]);

  return {
    unreadCount,
    notifications: items.map(normalizeNotification),
  };
}

async function markNotificationRead(actor, notificationId) {
  const prisma = requirePrisma();
  const userId = actor?.sub;
  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }

  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId, deletedAt: null },
  });

  if (!notification) {
    throw new ApiError(404, 'Notification not found.');
  }

  const updated = await prisma.notification.update({
    where: { id: notification.id },
    data: { readAt: notification.readAt || new Date() },
  });

  return normalizeNotification(updated);
}

async function markAllNotificationsRead(actor) {
  const prisma = requirePrisma();
  const userId = actor?.sub;
  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }

  await prisma.notification.updateMany({
    where: { userId, readAt: null, deletedAt: null },
    data: { readAt: new Date() },
  });

  return listNotifications(actor);
}

async function createDailyScheduleTask(payload, actorId) {
  const prisma = requirePrisma();
  const technicianIds = uniqueIds(toIdArray(payload.technicianIds));
  const task = String(payload.task || '').trim();
  const workDate = toWorkDate(payload.workDate || payload.date);
  const checklist = normalizeTaskChecklist(payload.checklist);

  if (!task || !payload.startsAt || !payload.endsAt) {
    throw new ApiError(400, 'task, startsAt, and endsAt are required.');
  }
  if (technicianIds.length === 0) {
    throw new ApiError(400, 'At least one technician is required.');
  }

  await assertDailyScheduleTechniciansAvailable(prisma, technicianIds, workDate);

  return prisma.$transaction(async (tx) => {
    const createdTask = await tx.dailyScheduleTask.create({
      data: {
        workDate,
        task,
        description: payload.description || null,
        checklist,
        machineModel: payload.machineModel ? normalizeMachineModel(payload.machineModel) : null,
        manualAdvice: payload.manualAdvice || null,
        location: payload.location || null,
        startsAt: payload.startsAt,
        endsAt: payload.endsAt,
        status: payload.status || 'CONFIRMED',
        notes: payload.notes || null,
        createdById: actorId,
      },
    });

    await tx.dailyScheduleTaskTechnician.createMany({
      data: technicianIds.map((technicianId) => ({
        taskId: createdTask.id,
        technicianId,
        createdById: actorId,
      })),
      skipDuplicates: true,
    });

    const fullTask = await tx.dailyScheduleTask.findUnique({
      where: { id: createdTask.id },
      include: dailyScheduleTaskInclude,
    });

    await createNotifications(
      tx,
      [
        actorId,
        ...fullTask.technicians.map((assignment) => assignment.technician.userId),
      ],
      {
        type: 'SCHEDULE',
        severity: 'info',
        title: 'Schedule task created',
        message: `${fullTask.task} is scheduled on ${fullTask.workDate.toISOString().slice(0, 10)} from ${fullTask.startsAt} to ${fullTask.endsAt}.`,
        href: '/management/scheduling',
        createdById: actorId,
      },
    );

    return normalizeDailyScheduleTask(fullTask);
  });
}

async function updateDailyScheduleTask(id, payload, actorId) {
  const prisma = requirePrisma();
  const existingTask = await prisma.dailyScheduleTask.findUnique({
    where: { id },
    include: dailyScheduleTaskInclude,
  });

  if (!existingTask || existingTask.deletedAt) {
    throw new ApiError(404, 'Schedule task not found.');
  }

  const technicianIds = uniqueIds(toIdArray(payload.technicianIds));
  const task = String(payload.task || '').trim();
  const workDate = toWorkDate(payload.workDate || payload.date || existingTask.workDate.toISOString().slice(0, 10));
  const checklist = normalizeTaskChecklist(payload.checklist);

  if (!task || !payload.startsAt || !payload.endsAt) {
    throw new ApiError(400, 'task, startsAt, and endsAt are required.');
  }
  if (technicianIds.length === 0) {
    throw new ApiError(400, 'At least one technician is required.');
  }

  await assertDailyScheduleTechniciansAvailable(prisma, technicianIds, workDate, id);

  return prisma.$transaction(async (tx) => {
    await tx.dailyScheduleTask.update({
      where: { id },
      data: {
        workDate,
        task,
        description: payload.description || null,
        checklist,
        machineModel: payload.machineModel ? normalizeMachineModel(payload.machineModel) : null,
        manualAdvice: payload.manualAdvice || existingTask.manualAdvice || null,
        location: payload.location || null,
        startsAt: payload.startsAt,
        endsAt: payload.endsAt,
        status: payload.status || existingTask.status || 'CONFIRMED',
        notes: payload.notes || null,
        updatedById: actorId,
      },
    });

    await tx.dailyScheduleTaskTechnician.deleteMany({
      where: { taskId: id },
    });
    await tx.dailyScheduleTaskTechnician.createMany({
      data: technicianIds.map((technicianId) => ({
        taskId: id,
        technicianId,
        createdById: actorId,
      })),
      skipDuplicates: true,
    });

    const updatedTask = await tx.dailyScheduleTask.findUnique({
      where: { id },
      include: dailyScheduleTaskInclude,
    });

    await createNotifications(
      tx,
      [
        actorId,
        ...updatedTask.technicians.map((assignment) => assignment.technician.userId),
      ],
      {
        type: 'SCHEDULE',
        severity: 'info',
        title: 'Schedule task updated',
        message: `${updatedTask.task} was updated for ${updatedTask.workDate.toISOString().slice(0, 10)}.`,
        href: '/management/scheduling',
        createdById: actorId,
      },
    );

    return normalizeDailyScheduleTask(updatedTask);
  });
}

async function deleteDailyScheduleTask(id, actorId) {
  const prisma = requirePrisma();
  const existingTask = await prisma.dailyScheduleTask.findUnique({ where: { id } });

  if (!existingTask || existingTask.deletedAt) {
    throw new ApiError(404, 'Schedule task not found.');
  }

  await prisma.dailyScheduleTask.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      updatedById: actorId,
    },
  });
}

async function findTechnicianProfileForActor(prisma, actor) {
  if (!actor?.sub) {
    throw new ApiError(401, 'Authentication required.');
  }

  const technician = await prisma.technicianProfile.findFirst({
    where: {
      userId: actor.sub,
      deletedAt: null,
    },
    include: {
      user: { select: publicUserSelect },
      skills: true,
    },
  });

  if (!technician) {
    throw new ApiError(403, 'Technician profile is required.');
  }

  return technician;
}

async function listMyDailyScheduleTasks(actor, dateText) {
  const prisma = requirePrisma();
  const technician = await findTechnicianProfileForActor(prisma, actor);
  const { date, workDate } = schedulingRange(dateText);
  const tasks = await prisma.dailyScheduleTask.findMany({
    where: {
      workDate,
      deletedAt: null,
      technicians: {
        some: {
          technicianId: technician.id,
        },
      },
    },
    include: dailyScheduleTaskInclude,
    orderBy: { startsAt: 'asc' },
  });

  return {
    date,
    technician,
    tasks: tasks.map(normalizeDailyScheduleTask),
  };
}

function taskWeatherText(task) {
  return [
    task.task,
    task.description,
    task.notes,
  ].filter(Boolean).join(' ').toLowerCase();
}

function hasAnyWord(value, words) {
  return words.some((word) => value.includes(word));
}

function weatherCodeLabel(code) {
  const numericCode = Number(code);
  if ([0].includes(numericCode)) return 'clear';
  if ([1, 2, 3].includes(numericCode)) return 'partly cloudy';
  if ([45, 48].includes(numericCode)) return 'fog';
  if ([51, 53, 55, 56, 57].includes(numericCode)) return 'drizzle';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(numericCode)) return 'rain';
  if ([95, 96, 99].includes(numericCode)) return 'thunderstorm';
  return 'cloudy';
}

function shiftHourRange(startsAt, endsAt) {
  const start = Number(String(startsAt || '08:00').split(':')[0]);
  const end = Number(String(endsAt || '16:00').split(':')[0]);
  const safeStart = Number.isFinite(start) ? Math.max(0, Math.min(23, start)) : 8;
  const safeEnd = Number.isFinite(end) ? Math.max(0, Math.min(23, end)) : 16;
  return { start: safeStart, end: safeEnd <= safeStart ? 23 : safeEnd };
}

async function fetchJson(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Request failed with ${response.status}`);
    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

const kuwaitLocationAliases = [
  {
    patterns: [/صباح\s*الأ?حمد/i, /sabah\s+al[-\s]?ahmad/i],
    name: 'Sabah Al-Ahmad, Kuwait',
    latitude: 28.8529,
    longitude: 48.0314,
  },
  {
    patterns: [/الأ?حمدي/i, /ahmadi/i],
    name: 'Al Ahmadi, Kuwait',
    latitude: 29.0769,
    longitude: 48.0839,
  },
  {
    patterns: [/الجهراء/i, /jahra/i],
    name: 'Al Jahra, Kuwait',
    latitude: 29.3375,
    longitude: 47.6581,
  },
  {
    patterns: [/الوفرة/i, /wafra/i],
    name: 'Al Wafrah, Kuwait',
    latitude: 28.6392,
    longitude: 47.9306,
  },
  {
    patterns: [/العبدلي/i, /abdali/i],
    name: 'Al Abdali, Kuwait',
    latitude: 30.0269,
    longitude: 47.7042,
  },
  {
    patterns: [/ميناء\s*عبدالله/i, /mina\s+abdullah/i],
    name: 'Mina Abdullah, Kuwait',
    latitude: 29.0264,
    longitude: 48.1542,
  },
  {
    patterns: [/الفحيحيل/i, /fahaheel/i],
    name: 'Fahaheel, Kuwait',
    latitude: 29.0825,
    longitude: 48.1303,
  },
  {
    patterns: [/الكويت/i, /kuwait\s*city/i],
    name: 'Kuwait City, Kuwait',
    latitude: 29.3759,
    longitude: 47.9774,
  },
];

function resolveLocalKuwaitLocation(location) {
  const value = String(location || '').trim();
  if (!value) return null;
  const match = kuwaitLocationAliases.find((item) => item.patterns.some((pattern) => pattern.test(value)));
  if (!match) return null;

  return {
    name: match.name,
    latitude: match.latitude,
    longitude: match.longitude,
    country: 'Kuwait',
    fallback: false,
    source: 'local-kuwait-map',
  };
}

function normalizeWorkLocation(location) {
  const value = String(location || '').trim();
  if (!value) return 'Kuwait City, Kuwait';
  if (/kuwait/i.test(value)) return value;
  return `${value}, Kuwait`;
}

function fallbackKuwaitLocation(name = 'Kuwait City, Kuwait') {
  return {
    name,
    latitude: 29.3759,
    longitude: 47.9774,
    country: 'Kuwait',
    fallback: true,
  };
}

async function geocodeLocation(location) {
  const query = normalizeWorkLocation(location);
  const localLocation = resolveLocalKuwaitLocation(query);
  if (localLocation) return localLocation;

  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', query);
  url.searchParams.set('count', '1');
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');

  let data;
  try {
    data = await fetchJson(url);
  } catch {
    return fallbackKuwaitLocation(query);
  }
  const result = data.results?.[0];

  if (!result) {
    return fallbackKuwaitLocation(query);
  }

  return {
    name: [result.name, result.admin1, result.country].filter(Boolean).join(', '),
    latitude: result.latitude,
    longitude: result.longitude,
    country: result.country,
    fallback: false,
  };
}

function summarizeShiftWeather(forecast, date, task) {
  const { start, end } = shiftHourRange(task.startsAt, task.endsAt);
  const hourly = forecast.hourly || {};
  const times = hourly.time || [];
  const temperatures = hourly.temperature_2m || [];
  const usesRainProbability = Array.isArray(hourly.precipitation_probability);
  const precipitation = usesRainProbability ? hourly.precipitation_probability : hourly.precipitation || [];
  const windSpeeds = hourly.wind_speed_10m || [];
  const weatherCodes = hourly.weather_code || [];
  const shiftIndexes = times
    .map((time, index) => ({ time, index, hour: Number(String(time).slice(11, 13)) }))
    .filter((entry) => String(entry.time).startsWith(date) && entry.hour >= start && entry.hour <= end)
    .map((entry) => entry.index);
  const indexes = shiftIndexes.length ? shiftIndexes : times
    .map((time, index) => ({ time, index }))
    .filter((entry) => String(entry.time).startsWith(date))
    .map((entry) => entry.index);

  const maxTemperatureC = Math.max(...indexes.map((index) => Number(temperatures[index])).filter(Number.isFinite));
  const maxPrecipitation = Math.max(...indexes.map((index) => Number(precipitation[index])).filter(Number.isFinite), 0);
  const maxRainChance = usesRainProbability
    ? maxPrecipitation
    : Math.min(100, Math.round(maxPrecipitation * 35));
  const maxWindKph = Math.max(...indexes.map((index) => Number(windSpeeds[index])).filter(Number.isFinite), 0);
  const codes = indexes.map((index) => weatherCodes[index]).filter((code) => code !== undefined);
  const condition = weatherCodeLabel(codes.sort((a, b) => Number(b) - Number(a))[0] || 0);

  return {
    maxTemperatureC: Number.isFinite(maxTemperatureC) ? Math.round(maxTemperatureC) : null,
    maxRainChance,
    maxWindKph: Math.round(maxWindKph),
    condition,
  };
}

function addDaysToIso(dateText, days) {
  const date = new Date(`${dateText}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function currentIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function buildOpenMeteoForecastUrl(place, date) {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(place.latitude));
  url.searchParams.set('longitude', String(place.longitude));
  url.searchParams.set('hourly', 'temperature_2m,precipitation_probability,weather_code,wind_speed_10m');
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('start_date', date);
  url.searchParams.set('end_date', date);
  return url;
}

function buildOpenMeteoArchiveUrl(place, date) {
  const url = new URL('https://archive-api.open-meteo.com/v1/archive');
  url.searchParams.set('latitude', String(place.latitude));
  url.searchParams.set('longitude', String(place.longitude));
  url.searchParams.set('hourly', 'temperature_2m,precipitation,weather_code,wind_speed_10m');
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('start_date', date);
  url.searchParams.set('end_date', date);
  return url;
}

function buildEstimatedKuwaitWeather(dateText, task) {
  const parsedMonth = Number(String(dateText || '').slice(5, 7));
  const month = Number.isInteger(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12
    ? parsedMonth - 1
    : new Date().getUTCMonth();
  const monthlyHighs = [19, 22, 27, 34, 40, 44, 46, 46, 43, 36, 28, 21];
  const monthlyWind = [22, 24, 26, 25, 24, 28, 25, 22, 20, 19, 20, 22];
  const rainyMonths = new Set([0, 1, 2, 10, 11]);
  const text = taskWeatherText(task);
  const outdoorAdjustment = hasAnyWord(text, ['outdoor', 'site', 'field', 'yard', 'inspection', 'machine', 'dozer', 'shovel'])
    ? 1
    : 0;

  return {
    maxTemperatureC: monthlyHighs[month] + outdoorAdjustment,
    maxRainChance: rainyMonths.has(month) ? 20 : 5,
    maxWindKph: monthlyWind[month],
    condition: rainyMonths.has(month) ? 'partly cloudy' : 'clear',
  };
}

async function fetchWeatherForTask(place, date, task) {
  try {
    const forecast = await fetchJson(buildOpenMeteoForecastUrl(place, date));
    const weather = summarizeShiftWeather(forecast, date, task);
    if (!Number.isFinite(Number(weather.maxTemperatureC))) {
      return {
        weather: buildEstimatedKuwaitWeather(date, task),
        generatedBy: 'seasonal-fallback-empty-forecast',
      };
    }
    return {
      weather,
      generatedBy: 'open-meteo',
    };
  } catch (forecastError) {
    if (date <= addDaysToIso(currentIsoDate(), -1)) {
      try {
        const archive = await fetchJson(buildOpenMeteoArchiveUrl(place, date));
        const weather = summarizeShiftWeather(archive, date, task);
        if (!Number.isFinite(Number(weather.maxTemperatureC))) {
          return {
            weather: buildEstimatedKuwaitWeather(date, task),
            generatedBy: 'seasonal-fallback-empty-archive',
          };
        }
        return {
          weather,
          generatedBy: 'open-meteo-archive',
        };
      } catch {
        // Fall through to seasonal fallback below.
      }
    }

    return {
      weather: buildEstimatedKuwaitWeather(date, task),
      generatedBy: 'seasonal-fallback',
      weatherError: forecastError.message,
    };
  }
}

function buildWeatherAdvice(task, weather) {
  const text = taskWeatherText(task);
  const weatherAdvice = [];
  const taskAdvice = [];
  const maxTemperature = weather.maxTemperatureC || 0;

  if (maxTemperature >= 42) {
    weatherAdvice.push('حرارة شديدة: استخدم ملابس قطنية خفيفة، قبعة أو غطاء للرأس، وماء بارد كاف. خذ استراحة قصيرة كل 30-45 دقيقة.');
  } else if (maxTemperature >= 35) {
    weatherAdvice.push('الجو حار: ارتد ملابس خفيفة، وخذ ماء كاف، وتجنب الوقوف الطويل تحت الشمس.');
  } else if (maxTemperature <= 12) {
    weatherAdvice.push('الجو بارد نسبياً: خذ جاكيت خفيف وقفازات إذا كان العمل خارجياً.');
  } else {
    weatherAdvice.push('الطقس مناسب عموماً، لكن خذ ماء كافياً وراجع حالة الموقع قبل بدء العمل.');
  }

  if (weather.maxRainChance >= 60 || ['rain', 'drizzle', 'thunderstorm'].includes(weather.condition)) {
    weatherAdvice.push('احتمال المطر عالي: خذ مظلة أو معطف مطر، واحمِ الأجهزة الكهربائية ونقاط الفحص من البلل.');
  } else if (weather.maxRainChance >= 30) {
    weatherAdvice.push('يوجد احتمال مطر: احتفظ بمظلة صغيرة وغطاء للأدوات الحساسة.');
  }

  if (weather.maxWindKph >= 35) {
    weatherAdvice.push('الرياح قوية: ثبّت الأوراق والأدوات الخفيفة، وتجنب العمل قرب أغطية أو أجزاء غير مثبتة.');
  } else if (weather.maxWindKph >= 25) {
    weatherAdvice.push('الرياح متوسطة: انتبه للأتربة وثبّت الأوراق والأدوات الخفيفة في الموقع.');
  }

  if (hasAnyWord(text, ['electrical', 'electric', 'battery', 'sensor', 'wiring', 'diagnostic', 'komtrax'])) {
    taskAdvice.push('بسبب طبيعة المهمة الكهربائية، أبقِ أجهزة الفحص والفيش جافة ونظيفة، ولا تفحص الدوائر المكشوفة أثناء المطر.');
  }

  if (hasAnyWord(text, ['oil', 'hydraulic', 'lubrication', 'fuel', 'leak'])) {
    taskAdvice.push('لأعمال الزيت أو الهيدروليك، خذ قفازات مقاومة للزيوت ومناديل تنظيف، وانتبه أن الحرارة تزيد ضغط السوائل.');
  }

  if (hasAnyWord(text, ['outdoor', 'site', 'field', 'yard', 'inspection', 'machine', 'dozer', 'shovel'])) {
    taskAdvice.push('العمل ميداني: خذ حذاء سلامة، نظارة حماية، وواقي شمس إذا كان الموقع مكشوفاً.');
  }

  if (taskAdvice.length === 0) {
    taskAdvice.push('جهّز معدات السلامة الأساسية وتأكد من توفر الأدوات المطلوبة قبل بدء المهمة.');
  }

  return {
    weatherAdvice: weatherAdvice.slice(0, 3),
    taskAdvice: taskAdvice.slice(0, 3),
  };
}

async function generateAiWeatherAdvice(task, weather, location) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_WEATHER_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You write short, practical Arabic safety advice for field technicians. Return 3 to 5 concise bullet points only.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              task: task.task,
              description: task.description,
              notes: task.notes,
              location,
              shift: `${task.startsAt}-${task.endsAt}`,
              weather,
            }),
          },
        ],
        temperature: 0.2,
        max_tokens: 300,
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    return text
      .split('\n')
      .map((line) => line.replace(/^[-*\d.\s]+/, '').trim())
      .filter(Boolean)
      .slice(0, 5);
  } catch {
    return null;
  }
}

async function buildTaskWeatherAdvice(task) {
  const date = formatDateForResponse(task.workDate);
  const place = await geocodeLocation(task.location);
  const weatherResult = await fetchWeatherForTask(place, date, task);
  const weather = weatherResult.weather;
  const aiAdvice = await generateAiWeatherAdvice(task, weather, place.name);
  const ruleAdvice = buildWeatherAdvice(task, weather);
  const taskAdvice = ruleAdvice.taskAdvice || [];
  const weatherAdvice = ruleAdvice.weatherAdvice || [];

  return {
    taskId: task.id,
    task: task.task,
    location: task.location || place.name,
    resolvedLocation: place.name,
    startsAt: task.startsAt,
    endsAt: task.endsAt,
    ...weather,
    weatherAdvice,
    taskAdvice: aiAdvice?.length ? aiAdvice : taskAdvice,
    advice: [...weatherAdvice, ...(aiAdvice?.length ? aiAdvice : taskAdvice)].slice(0, 6),
    generatedBy: aiAdvice?.length ? `openai-${weatherResult.generatedBy}` : weatherResult.generatedBy,
    weatherError: weatherResult.weatherError,
  };
}

function formatDateForResponse(value) {
  if (!value) return null;
  return new Date(value).toISOString().slice(0, 10);
}

async function getMyWeatherAdvice(actor, dateText) {
  const scheduled = await listMyDailyScheduleTasks(actor, dateText);
  const items = [];

  for (const task of scheduled.tasks) {
    try {
      items.push(await buildTaskWeatherAdvice(task));
    } catch {
      items.push({
        taskId: task.id,
        task: task.task,
        location: task.location || 'Kuwait',
        startsAt: task.startsAt,
        endsAt: task.endsAt,
        maxTemperatureC: null,
        maxRainChance: null,
        maxWindKph: null,
        condition: 'unavailable',
        weatherAdvice: ['تعذر جلب الطقس حالياً. استخدم معدات السلامة الأساسية وخذ ماء كاف قبل التوجه للموقع.'],
        taskAdvice: ['راجع طبيعة المهمة وتأكد من توفر الأدوات ومعدات الوقاية قبل بدء العمل.'],
        advice: [
          'تعذر جلب الطقس حالياً. استخدم معدات السلامة الأساسية وخذ ماء كاف قبل التوجه للموقع.',
          'راجع طبيعة المهمة وتأكد من توفر الأدوات ومعدات الوقاية قبل بدء العمل.',
        ],
        generatedBy: 'fallback',
      });
    }
  }

  return {
    date: scheduled.date,
    items,
  };
}

async function ensureTaskBelongsToTechnician(prisma, taskId, technicianId) {
  const task = await prisma.dailyScheduleTask.findFirst({
    where: {
      id: taskId,
      deletedAt: null,
      technicians: {
        some: {
          technicianId,
        },
      },
    },
    include: dailyScheduleTaskInclude,
  });

  if (!task) {
    throw new ApiError(404, 'Task not found for this technician.');
  }

  return task;
}

async function startMyDailyScheduleTask(actor, taskId) {
  const prisma = requirePrisma();
  const technician = await findTechnicianProfileForActor(prisma, actor);
  await ensureTaskBelongsToTechnician(prisma, taskId, technician.id);

  const task = await prisma.dailyScheduleTask.update({
    where: { id: taskId },
    data: {
      status: 'ON_DUTY',
      startedAt: new Date(),
      updatedById: actor.sub,
    },
    include: dailyScheduleTaskInclude,
  });

  return normalizeDailyScheduleTask(task);
}

function buildTaskAudioScript(task) {
  const checklist = normalizeTaskChecklist(task.checklist);
  const checklistText = checklist.length
    ? checklist.map((item, index) => `النقطة ${index + 1}: ${item.text}`).join('\n')
    : 'لا توجد نقاط عمل مفصلة لهذه المهمة.';
  const timeText = formatArabicSpokenTimeRange(task.startsAt, task.endsAt);

  return [
    `مهمة اليوم: ${task.task || '-'}`,
    `المُعِدَّة: ${task.machineModel || 'غير محددة'}`,
    `الموقع: ${task.location || 'غير محدد'}`,
    `التوقيت: ${timeText}`,
    task.description ? `وصف المهمة: ${task.description}` : '',
    task.notes ? `ملاحظات المهندس: ${task.notes}` : '',
    '',
    'نقاط العمل المطلوبة:',
    checklistText,
    '',
    'تذكير مهم: قبل إرسال المهمة، وثّق كل نقطة بملاحظة واضحة وصورة من الموقع.',
  ].filter(Boolean).join('\n').slice(0, 3500);
}

function formatArabicSpokenTimeRange(startsAt, endsAt) {
  const start = formatArabicSpokenTime(startsAt);
  const end = formatArabicSpokenTime(endsAt);
  if (start && end) return `يبدأ من الساعة ${start} وينتهي عند الساعة ${end}`;
  if (start) return `يبدأ عند الساعة ${start}`;
  if (end) return `حتى الساعة ${end}`;
  return 'غير محدد';
}

function formatArabicSpokenTime(value) {
  const text = String(value || '').trim();
  const match = text.match(/^(\d{1,2}):(\d{2})\s*([AP]\.?M\.?)?/i);
  if (!match) return '';

  let hour24 = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isFinite(hour24) || !Number.isFinite(minute)) return '';
  const meridiem = String(match[3] || '').replace(/\./g, '').toUpperCase();
  if (meridiem === 'PM' && hour24 < 12) hour24 += 12;
  if (meridiem === 'AM' && hour24 === 12) hour24 = 0;

  const period = hour24 < 12 ? 'صباحاً' : 'مساءً';
  const hour12 = hour24 % 12 || 12;
  const hourText = [
    '',
    'الواحدة',
    'الثانية',
    'الثالثة',
    'الرابعة',
    'الخامسة',
    'السادسة',
    'السابعة',
    'الثامنة',
    'التاسعة',
    'العاشرة',
    'الحادية عشرة',
    'الثانية عشرة',
  ][hour12];

  if (minute === 0) return `${hourText} ${period}`;
  if (minute === 15) return `${hourText} والربع ${period}`;
  if (minute === 30) return `${hourText} والنصف ${period}`;
  if (minute === 45) return `${hourText} وخمس وأربعين دقيقة ${period}`;

  return `${hourText} و ${formatArabicMinute(minute)} دقيقة ${period}`;
}

function formatArabicMinute(minute) {
  const minuteWords = {
    1: 'دقيقة واحدة',
    2: 'دقيقتين',
    3: 'ثلاث',
    4: 'أربع',
    5: 'خمس',
    6: 'ست',
    7: 'سبع',
    8: 'ثمان',
    9: 'تسع',
    10: 'عشر',
    11: 'إحدى عشرة',
    12: 'اثنتي عشرة',
    13: 'ثلاث عشرة',
    14: 'أربع عشرة',
    15: 'خمس عشرة',
    16: 'ست عشرة',
    17: 'سبع عشرة',
    18: 'ثماني عشرة',
    19: 'تسع عشرة',
    20: 'عشرين',
    30: 'ثلاثين',
    40: 'أربعين',
    50: 'خمسين',
  };
  if (minuteWords[minute]) return minuteWords[minute];
  const tens = Math.floor(minute / 10) * 10;
  const ones = minute % 10;
  return `${minuteWords[ones]} و${minuteWords[tens] || String(tens)}`;
}

function buildTaskAudioInstructions(task) {
  return [
    'You are generating spoken Arabic audio for a field technician working in a heavy equipment maintenance company.',
    'Do not read these instructions aloud. Only speak the provided input text.',
    'Use a calm, professional field-service tone. Be clear and practical, not dramatic.',
    'Treat the Arabic word "المُعِدَّة" as heavy equipment / machine, never as stomach.',
    'Pronounce machine model codes and equipment names carefully and slowly, for example D155A-6 as separate model characters when needed.',
    'Pause briefly between the location, time, and each checklist point.',
    'If the text includes hydraulic, engine, filter, inspection, leakage, oil, hose, or service terms, read them in the context of maintenance work.',
    task.machineModel ? `The equipment or machine model is: ${task.machineModel}.` : '',
  ].filter(Boolean).join(' ');
}

async function generateMyDailyScheduleTaskAudio(actor, taskId) {
  const prisma = requirePrisma();
  const technician = await findTechnicianProfileForActor(prisma, actor);
  const task = await ensureTaskBelongsToTechnician(prisma, taskId, technician.id);
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new ApiError(503, 'OPENAI_API_KEY is not configured on the backend.');
  }

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts',
      voice: process.env.OPENAI_TTS_VOICE || 'cedar',
      input: buildTaskAudioScript(task),
      instructions: buildTaskAudioInstructions(task),
      response_format: 'mp3',
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(response.status, errorData.error?.message || 'AI voice generation failed.');
  }

  const arrayBuffer = await response.arrayBuffer();
  return {
    contentType: response.headers.get('content-type') || 'audio/mpeg',
    buffer: Buffer.from(arrayBuffer),
  };
}

function normalizeTaskPhotos(photos) {
  if (!Array.isArray(photos)) return [];
  return photos.slice(0, 8).map((photo) => ({
    fileName: String(photo.fileName || photo.name || 'photo.jpg').slice(0, 180),
    mimeType: String(photo.mimeType || photo.type || 'image/jpeg').slice(0, 80),
    dataUrl: String(photo.dataUrl || '').slice(0, 8_000_000),
    createdAt: new Date().toISOString(),
  })).filter((photo) => photo.dataUrl.startsWith('data:image/'));
}

async function completeMyDailyScheduleTask(actor, taskId, payload) {
  const prisma = requirePrisma();
  const technician = await findTechnicianProfileForActor(prisma, actor);
  const existingTask = await ensureTaskBelongsToTechnician(prisma, taskId, technician.id);

  const summary = String(payload.summary || '').trim();
  const checklist = normalizeTaskChecklist(existingTask.checklist);
  const checklistReports = normalizeChecklistReports(payload.checklistReports, checklist);
  const requiredChecklistIds = checklist.filter((item) => item.required !== false).map((item) => item.id);
  const completedChecklistIds = new Set(checklistReports.filter((report) => report.done).map((report) => report.id));

  if (requiredChecklistIds.length > 0 && requiredChecklistIds.some((id) => !completedChecklistIds.has(id))) {
    throw new ApiError(400, 'أكمل كل نقاط العمل المطلوبة قبل إرسال المهمة.');
  }
  const missingEvidence = checklistReports.some((report) => (
    completedChecklistIds.has(report.id) &&
    (!report.notes || report.photos.length === 0)
  ));
  if (missingEvidence) {
    throw new ApiError(400, 'كل نقطة مكتملة تحتاج ملاحظة وصورة واحدة على الأقل.');
  }
  if (!summary && checklistReports.length === 0) {
    throw new ApiError(400, 'أضف توثيق نقاط العمل أو ملخصاً قبل إرسال المهمة.');
  }

  const task = await prisma.dailyScheduleTask.update({
    where: { id: taskId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      summary: summary || checklistReports
        .filter((report) => report.done)
        .map((report) => checklist.find((item) => item.id === report.id)?.text)
        .filter(Boolean)
        .join('\n'),
      notes: payload.notes || null,
      photos: normalizeTaskPhotos(payload.photos),
      checklistReports,
      updatedById: actor.sub,
    },
    include: dailyScheduleTaskInclude,
  });

  const managerUserIds = await findScheduleManagerUserIds(prisma);
  await createNotifications(prisma, [actor.sub, ...managerUserIds], {
    type: 'SCHEDULE',
    severity: 'success',
    title: 'Technician task completed',
    message: `${task.task} was completed by ${technician.user.fullName || technician.employeeCode || 'a technician'}.`,
    href: '/management/scheduling',
    createdById: actor.sub,
  });

  return normalizeDailyScheduleTask(task);
}

async function listDailyScheduleTasks(fromText, toText) {
  const prisma = requirePrisma();
  const { from, to, fromDate, toDate } = dailyScheduleDateRange(fromText, toText);
  const tasks = await prisma.dailyScheduleTask.findMany({
    where: {
      workDate: { gte: fromDate, lte: toDate },
      deletedAt: null,
    },
    include: dailyScheduleTaskInclude,
    orderBy: [
      { workDate: 'desc' },
      { startsAt: 'asc' },
    ],
  });

  return {
    from,
    to,
    tasks: tasks.map(normalizeDailyScheduleTask),
  };
}

async function getSchedulingBoard(dateText, historyFromText, historyToText) {
  const prisma = requirePrisma();
  await ensureDefaultTechnicians(prisma);
  const { date, workDate } = schedulingRange(dateText);
  const historyRange = dailyScheduleDateRange(historyFromText || date, historyToText || historyFromText || date);

  const [
    technicians,
    dayTasks,
    historyTasks,
  ] = await Promise.all([
    prisma.technicianProfile.findMany({
      where: { deletedAt: null },
      include: {
        user: { select: publicUserSelect },
        shift: true,
        skills: true,
        schedules: {
          where: { workDate, deletedAt: null },
          include: { shift: true, branch: true },
        },
      },
      orderBy: { employeeCode: 'asc' },
    }),
    prisma.dailyScheduleTask.findMany({
      where: { workDate, deletedAt: null },
      include: dailyScheduleTaskInclude,
      orderBy: { startsAt: 'asc' },
    }),
    prisma.dailyScheduleTask.findMany({
      where: {
        workDate: { gte: historyRange.fromDate, lte: historyRange.toDate },
        deletedAt: null,
      },
      include: dailyScheduleTaskInclude,
      orderBy: [
        { workDate: 'desc' },
        { startsAt: 'asc' },
      ],
    }),
  ]);

  const scheduledTechnicianIds = new Set(
    dayTasks.flatMap((task) => task.technicians.map((assignment) => assignment.technicianId)),
  );
  const scheduledTechnicians = scheduledTechnicianIds.size;
  const schedulableTechnicians = technicians.filter((technician) => {
    const status = technician.schedules[0]?.status;
    return technician.isAvailable && (!status || ['PLANNED', 'CONFIRMED', 'ON_DUTY'].includes(status));
  });

  return {
    date,
    kpis: {
      technicians: technicians.length,
      scheduledTechnicians,
      availableTechnicians: schedulableTechnicians.length,
      dailyTasks: dayTasks.length,
    },
    technicians: schedulableTechnicians,
    tasks: dayTasks.map(normalizeDailyScheduleTask),
    history: {
      from: historyRange.from,
      to: historyRange.to,
      tasks: historyTasks.map(normalizeDailyScheduleTask),
    },
  };
}

module.exports = {
  login,
  unifiedLogin,
  technicianLogin,
  buildMicrosoftLoginUrl,
  finishMicrosoftCallback,
  completeMicrosoftLogin,
  microsoftErrorRedirect,
  listDashboard,
  listTechnicians,
  listShopManuals,
  getShopManualFile,
  getShopManualPagePdf,
  uploadShopManual,
  uploadShopManualFile,
  suggestManualOptions,
  suggestManualTools,
  createTechnician,
  updateTechnician,
  deleteTechnician,
  listShifts,
  createShift,
  upsertTechnicianSchedule,
  createDailyScheduleTask,
  updateDailyScheduleTask,
  deleteDailyScheduleTask,
  listMyDailyScheduleTasks,
  getMyWeatherAdvice,
  startMyDailyScheduleTask,
  generateMyDailyScheduleTaskAudio,
  completeMyDailyScheduleTask,
  listDailyScheduleTasks,
  getSchedulingBoard,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
