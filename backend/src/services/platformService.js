const crypto = require('crypto');
const fs = require('fs/promises');
const { getPrisma } = require('../config/prisma');
const { env } = require('../config/env');
const { ApiError } = require('../utils/ApiError');
const { signJwt } = require('../middleware/platformAuthMiddleware');
const { normalizeArabicStatus } = require('../utils/platformEnums');
const { createSessionToken } = require('../utils/sessionToken');

function requirePrisma() {
  const prisma = getPrisma();

  if (!prisma) {
    throw new ApiError(503, 'Database is not configured for Prisma. Set DATABASE_URL or DB_HOST, DB_PORT, DB_NAME, DB_USER, and DB_PASSWORD on the backend environment.');
  }

  return prisma;
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
  if (preferredModule === 'eqp' && permissions.includes('EQP_MANAGE')) {
    return '/eqp';
  }

  const managementRoles = [
    'SUPER_ADMIN',
    'GENERAL_MANAGER',
    'OPERATIONS_MANAGER',
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
    await ensureUserRole(prisma, user.id, 'MAINTENANCE_SUPERVISOR');

    const fieldTechnicianRole = await prisma.role.findUnique({ where: { code: 'FIELD_TECHNICIAN' } });
    if (fieldTechnicianRole) {
      await prisma.userRole.deleteMany({
        where: {
          userId: user.id,
          roleId: fieldTechnicianRole.id,
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
      where: { code: 'FIELD_TECHNICIAN' },
      update: {},
      create: {
        code: 'FIELD_TECHNICIAN',
        name: 'Field Technician',
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
  const [
    technicians,
    availableTechnicians,
    scheduledToday,
    shifts,
  ] = await Promise.all([
    prisma.technicianProfile.count({ where: { deletedAt: null } }),
    prisma.technicianProfile.count({ where: { deletedAt: null, isAvailable: true } }),
    prisma.dailyScheduleTask.count({ where: { workDate: toWorkDate(new Date().toISOString().slice(0, 10)), deletedAt: null } }),
    prisma.shift.count({ where: { deletedAt: null } }),
  ]);

  return {
    kpis: {
      technicians,
      availableTechnicians,
      scheduledToday,
      shifts,
    },
    modules: ['technicians', 'scheduling', 'eqp'],
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

async function assignFieldTechnicianRole(tx, userId) {
  const role = await tx.role.findUnique({ where: { code: 'FIELD_TECHNICIAN' } });

  if (!role) {
    throw new ApiError(503, 'FIELD_TECHNICIAN role is not configured.');
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

    await assignFieldTechnicianRole(tx, user.id);

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
  };
}

function normalizeMachineModel(value) {
  return String(value || '').trim().toUpperCase();
}

function decodeBase64Payload(value) {
  const content = String(value || '');
  const [, base64 = content] = content.match(/^data:.*?;base64,(.*)$/) || [];
  return Buffer.from(base64, 'base64');
}

function chunkText(text, maxLength = 2800) {
  const clean = String(text || '')
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
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

async function extractManualText(payload) {
  if (payload.text) return String(payload.text);
  if (!payload.fileBase64) {
    throw new ApiError(400, 'Manual text or fileBase64 is required.');
  }

  const buffer = decodeBase64Payload(payload.fileBase64);
  if (buffer.length > 35 * 1024 * 1024) {
    throw new ApiError(413, 'Manual file is too large. Keep uploads under 35 MB.');
  }

  const { PDFParse } = require('pdf-parse');
  const parser = new PDFParse({ data: buffer });
  try {
    const parsed = await parser.getText();
    return parsed.text || '';
  } finally {
    await parser.destroy();
  }
}

async function extractManualTextFromFile(filePath) {
  const { PDFParse } = require('pdf-parse');
  const buffer = await fs.readFile(filePath);
  const parser = new PDFParse({ data: buffer });
  try {
    const parsed = await parser.getText();
    return parsed.text || '';
  } finally {
    await parser.destroy();
  }
}

async function createIndexedShopManual(payload, text, actorId) {
  const prisma = requirePrisma();
  const machineModel = normalizeMachineModel(payload.machineModel);
  const title = String(payload.title || payload.fileName || '').trim();

  if (!machineModel || !title) {
    throw new ApiError(400, 'machineModel and title are required.');
  }

  const chunks = chunkText(text);
  if (chunks.length === 0) {
    throw new ApiError(400, 'No readable text was found in this manual.');
  }

  return prisma.$transaction(async (tx) => {
    const manual = await tx.shopManual.create({
      data: {
        machineModel,
        title,
        fileName: payload.fileName || null,
        sourceType: payload.sourceType || 'PDF',
        status: 'INDEXED',
        createdById: actorId,
      },
    });

    for (let index = 0; index < chunks.slice(0, 1200).length; index += 200) {
      const batch = chunks.slice(0, 1200).slice(index, index + 200);
      await tx.shopManualChunk.createMany({
        data: batch.map((content, offset) => ({
          manualId: manual.id,
          machineModel,
          pageNumber: index + offset + 1,
          section: inferSectionTitle(content),
          content,
        })),
      });
    }

    return {
      ...manual,
      chunks: chunks.length,
    };
  }, { timeout: 120000 });
}

async function uploadShopManual(payload, actorId) {
  const text = await extractManualText(payload);
  return createIndexedShopManual({
    ...payload,
    sourceType: payload.fileBase64 ? 'PDF' : 'TEXT',
  }, text, actorId);
}

async function uploadShopManualFile(payload, file, actorId) {
  if (!file?.path) {
    throw new ApiError(400, 'PDF manual file is required.');
  }

  try {
    const text = await extractManualTextFromFile(file.path);
    return await createIndexedShopManual({
      ...payload,
      fileName: file.originalname,
      sourceType: 'PDF',
    }, text, actorId);
  } finally {
    await fs.unlink(file.path).catch(() => {});
  }
}

function inferSectionTitle(content) {
  const line = String(content || '').split('\n').find((item) => item.trim().length > 4);
  return line ? line.trim().slice(0, 160) : null;
}

async function listShopManuals() {
  const prisma = requirePrisma();
  const manuals = await prisma.shopManual.findMany({
    where: { deletedAt: null },
    include: { _count: { select: { chunks: true } } },
    orderBy: [{ machineModel: 'asc' }, { createdAt: 'desc' }],
  });

  return manuals.map((manual) => ({
    ...manual,
    chunkCount: manual._count.chunks,
    _count: undefined,
  }));
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
      body: JSON.stringify({
        model: process.env.OPENAI_MANUAL_MODEL || 'gpt-4o-mini',
        response_format: { type: 'json_object' },
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
      }),
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
    where: normalizedModel ? { machineModel: normalizedModel } : {},
    include: {
      manual: true,
    },
    take: 1500,
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
    .replace(/\.{3,}\s*\d*$/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^[\d.\-\s]+/, '')
    .replace(/\s+\d+$/g, '')
    .trim()
    .slice(0, 180);
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

async function buildManualIndexCandidates(machineModel) {
  const prisma = requirePrisma();
  const normalizedModel = normalizeMachineModel(machineModel);
  const chunks = await prisma.shopManualChunk.findMany({
    where: normalizedModel ? { machineModel: normalizedModel } : {},
    include: { manual: true },
    take: 1500,
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

  return candidates.slice(0, 400);
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

function rankManualCandidatesForTask(payload, candidates, interpretedTask = '') {
  const intent = inferManualTaskIntent(payload, interpretedTask);
  return [...candidates]
    .map((candidate) => ({
      ...candidate,
      taskScore: scoreManualCandidateForIntent(candidate, intent),
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
    const rankedCandidates = rankManualCandidatesForTask(payload, candidates).slice(0, 180);
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MANUAL_MODEL || 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        temperature: 0.05,
        messages: [
          {
            role: 'system',
            content: 'You match messy Arabic/English field technician task wording to the best shop manual index or section titles. Choose only from the provided candidates. Return JSON only. Do not provide tools, PPE, or procedure details. If the task means remove, replace, install, or disassemble a component, strongly prefer Removal/Installation or Disassembly/Assembly sections over Adjusting/Testing sections for the same component.',
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
                selectedCandidateIds: ['M1'],
                searchPhrases: ['extra search phrase if useful'],
                keywords: ['component', 'action'],
                assumptions: ['short reason for the chosen heading'],
                confidence: 'high | medium | low',
              },
            }),
          },
        ],
      }),
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
    where: normalizedModel ? { machineModel: normalizedModel } : {},
    include: { manual: true },
    take: 1500,
    orderBy: [{ manualId: 'asc' }, { pageNumber: 'asc' }, { createdAt: 'asc' }],
  });
  const selectedKeys = new Set();

  for (const candidate of selectedCandidates) {
    if (!candidate?.manualId || !Number.isFinite(candidate.page)) continue;
    for (let page = candidate.page - 1; page <= candidate.page + 4; page += 1) {
      selectedKeys.add(`${candidate.manualId}:${page}`);
    }
  }

  const selectedChunks = chunks.filter((chunk) => selectedKeys.has(`${chunk.manualId}:${chunk.pageNumber}`));
  if (selectedChunks.length > 0) return selectedChunks.slice(0, 12);

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
    sources: chunks.map((chunk) => ({
      manual: chunk.manual?.title,
      machineModel: chunk.machineModel,
      page: chunk.pageNumber,
      section: chunk.section,
    })),
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

async function generateManualSuggestionWithAi(payload, chunks) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || chunks.length === 0) return null;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MANUAL_MODEL || 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        temperature: 0.1,
        messages: [
          {
            role: 'system',
            content: 'You extract required tools, PPE, consumables, warnings, and a short procedure summary from shop manual excerpts. Answer only using the supplied excerpts. If evidence is weak, say so in confidence.',
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
              excerpts: chunks.map((chunk) => ({
                manual: chunk.manual?.title,
                page: chunk.pageNumber,
                section: chunk.section,
                content: chunk.content.slice(0, 2600),
              })),
              requiredJsonShape: {
                requiredTools: [],
                ppe: [],
                consumables: [],
                warnings: [],
                procedureSummary: [],
                sources: [],
                interpretedTask: '',
                interpretationNotes: [],
                confidence: 'high | medium | low',
              },
            }),
          },
        ],
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return {
      ...parseJsonFromModel(data.choices?.[0]?.message?.content),
      generatedBy: 'openai',
      task: payload.task,
      interpretedTask: payload.searchProfile?.interpretedTask || payload.task,
      interpretationNotes: payload.searchProfile?.assumptions || [],
      selectedManualTitles: payload.searchProfile?.selectedManualTitles || [],
    };
  } catch {
    return null;
  }
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
  const indexChoice = await chooseManualIndexWithAi({ ...payload, machineModel }, indexCandidates);
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
    };
  }

  const searchProfile = {
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
    generatedBy: 'openai-index',
    selectedManualTitles: (indexChoice.selectedCandidates || []).map((candidate) => ({
      title: candidate.title,
      manual: candidate.manual,
      page: candidate.page,
      sourceType: candidate.sourceType,
      confidence: indexChoice.confidence,
    })),
  };
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
      selectedManualTitles: searchProfile.selectedManualTitles,
    };
  }

  const suggestion = await generateManualSuggestionWithAi(enrichedPayload, chunks);
  if (!suggestion) {
    return {
      requiredTools: [],
      ppe: [],
      consumables: [],
      warnings: ['Matching manual sections were found, but AI could not generate verified advice from them. Try again or refine the task description.'],
      procedureSummary: [],
      sources: chunks.map((chunk) => ({
        manual: chunk.manual?.title,
        machineModel: chunk.machineModel,
        page: chunk.pageNumber,
        section: chunk.section,
      })),
      confidence: 'low',
      generatedBy: 'openai-failed',
      task: payload.task,
      interpretedTask: searchProfile.interpretedTask,
      interpretationNotes: searchProfile.assumptions,
      searchPhrases: searchProfile.searchPhrases,
      selectedManualTitles: searchProfile.selectedManualTitles,
    };
  }

  return {
    ...suggestion,
    interpretedTask: suggestion.interpretedTask || searchProfile.interpretedTask,
    interpretationNotes: suggestion.interpretationNotes || searchProfile.assumptions,
    searchPhrases: searchProfile.searchPhrases,
    selectedManualTitles: suggestion.selectedManualTitles || searchProfile.selectedManualTitles,
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

async function createDailyScheduleTask(payload, actorId) {
  const prisma = requirePrisma();
  const technicianIds = uniqueIds(toIdArray(payload.technicianIds));
  const task = String(payload.task || '').trim();
  const workDate = toWorkDate(payload.workDate || payload.date);

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

function normalizeWorkLocation(location) {
  const value = String(location || '').trim();
  if (!value) return 'Kuwait City, Kuwait';
  if (/kuwait/i.test(value)) return value;
  return `${value}, Kuwait`;
}

async function geocodeLocation(location) {
  const query = normalizeWorkLocation(location);
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', query);
  url.searchParams.set('count', '1');
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');

  const data = await fetchJson(url);
  const result = data.results?.[0];

  if (!result) {
    return {
      name: query,
      latitude: 29.3759,
      longitude: 47.9774,
      country: 'Kuwait',
      fallback: true,
    };
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
  const precipitation = hourly.precipitation_probability || [];
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
  const maxRainChance = Math.max(...indexes.map((index) => Number(precipitation[index])).filter(Number.isFinite), 0);
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

function buildWeatherAdvice(task, weather) {
  const text = taskWeatherText(task);
  const advice = [];
  const maxTemperature = weather.maxTemperatureC || 0;

  if (maxTemperature >= 42) {
    advice.push('حرارة شديدة: استخدم ملابس قطنية خفيفة، قبعة أو غطاء للرأس، وماء بارد كاف. خذ استراحة قصيرة كل 30-45 دقيقة.');
  } else if (maxTemperature >= 35) {
    advice.push('الجو حار: ارتد ملابس خفيفة، وخذ ماء كاف، وتجنب الوقوف الطويل تحت الشمس.');
  } else if (maxTemperature <= 12) {
    advice.push('الجو بارد نسبياً: خذ جاكيت خفيف وقفازات إذا كان العمل خارجياً.');
  }

  if (weather.maxRainChance >= 60 || ['rain', 'drizzle', 'thunderstorm'].includes(weather.condition)) {
    advice.push('احتمال المطر عالي: خذ مظلة أو معطف مطر، واحمِ الأجهزة الكهربائية ونقاط الفحص من البلل.');
  } else if (weather.maxRainChance >= 30) {
    advice.push('يوجد احتمال مطر: احتفظ بمظلة صغيرة وغطاء للأدوات الحساسة.');
  }

  if (weather.maxWindKph >= 35) {
    advice.push('الرياح قوية: ثبّت الأوراق والأدوات الخفيفة، وتجنب العمل قرب أغطية أو أجزاء غير مثبتة.');
  }

  if (hasAnyWord(text, ['electrical', 'electric', 'battery', 'sensor', 'wiring', 'diagnostic', 'komtrax'])) {
    advice.push('بسبب طبيعة المهمة الكهربائية، أبقِ أجهزة الفحص والفيش جافة ونظيفة، ولا تفحص الدوائر المكشوفة أثناء المطر.');
  }

  if (hasAnyWord(text, ['oil', 'hydraulic', 'lubrication', 'fuel', 'leak'])) {
    advice.push('لأعمال الزيت أو الهيدروليك، خذ قفازات مقاومة للزيوت ومناديل تنظيف، وانتبه أن الحرارة تزيد ضغط السوائل.');
  }

  if (hasAnyWord(text, ['outdoor', 'site', 'field', 'yard', 'inspection', 'machine', 'dozer', 'shovel'])) {
    advice.push('العمل ميداني: خذ حذاء سلامة، نظارة حماية، وواقي شمس إذا كان الموقع مكشوفاً.');
  }

  if (advice.length === 0) {
    advice.push('الطقس مناسب عموماً. خذ معدات السلامة الأساسية وماء كاف، وراجع الموقع قبل بدء العمل.');
  }

  return advice.slice(0, 5);
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
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(place.latitude));
  url.searchParams.set('longitude', String(place.longitude));
  url.searchParams.set('hourly', 'temperature_2m,precipitation_probability,weather_code,wind_speed_10m');
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('start_date', date);
  url.searchParams.set('end_date', date);

  const forecast = await fetchJson(url);
  const weather = summarizeShiftWeather(forecast, date, task);
  const aiAdvice = await generateAiWeatherAdvice(task, weather, place.name);

  return {
    taskId: task.id,
    task: task.task,
    location: task.location || place.name,
    resolvedLocation: place.name,
    startsAt: task.startsAt,
    endsAt: task.endsAt,
    ...weather,
    advice: aiAdvice?.length ? aiAdvice : buildWeatherAdvice(task, weather),
    generatedBy: aiAdvice?.length ? 'openai' : 'rules',
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
        advice: ['تعذر جلب الطقس حالياً. استخدم معدات السلامة الأساسية وخذ ماء كاف قبل التوجه للموقع.'],
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
  await ensureTaskBelongsToTechnician(prisma, taskId, technician.id);

  const summary = String(payload.summary || '').trim();
  if (!summary) {
    throw new ApiError(400, 'Summary is required.');
  }

  const task = await prisma.dailyScheduleTask.update({
    where: { id: taskId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      summary,
      notes: payload.notes || null,
      photos: normalizeTaskPhotos(payload.photos),
      updatedById: actor.sub,
    },
    include: dailyScheduleTaskInclude,
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
  const availableTechnicians = technicians.filter((technician) => {
    const status = technician.schedules[0]?.status;
    return technician.isAvailable && (!status || ['PLANNED', 'CONFIRMED', 'ON_DUTY'].includes(status));
  }).length;

  return {
    date,
    kpis: {
      technicians: technicians.length,
      scheduledTechnicians,
      availableTechnicians,
      dailyTasks: dayTasks.length,
    },
    technicians,
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
  uploadShopManual,
  uploadShopManualFile,
  suggestManualTools,
  createTechnician,
  updateTechnician,
  listShifts,
  createShift,
  upsertTechnicianSchedule,
  createDailyScheduleTask,
  updateDailyScheduleTask,
  deleteDailyScheduleTask,
  listMyDailyScheduleTasks,
  getMyWeatherAdvice,
  startMyDailyScheduleTask,
  completeMyDailyScheduleTask,
  listDailyScheduleTasks,
  getSchedulingBoard,
};
