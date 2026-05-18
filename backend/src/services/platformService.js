const crypto = require('crypto');
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
  assertAllowedMicrosoftEmail(email);

  let user = await prisma.user.findUnique({ where: { email } });
  const isConfiguredAdmin = env.microsoft.adminEmails.includes(email);
  const isEngineer = isConfiguredEngineer(email, profile);

  if (!user) {
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
  { email: 'technician.1001@daralhai.com', fullName: 'Nasser Al Harbi', employeeCode: 'TECH-1001', region: 'Riyadh North', skills: [['HVAC', 'SENIOR'], ['Electrical Safety', 'INTERMEDIATE']] },
  { email: 'technician.1002@daralhai.com', fullName: 'Ahmad Al Harbi', employeeCode: 'TECH-1002', region: 'Riyadh North', skills: [['Plumbing', 'SENIOR'], ['Leak Detection', 'SENIOR']] },
  { email: 'technician.1003@daralhai.com', fullName: 'Omar Al Qahtani', employeeCode: 'TECH-1003', region: 'Riyadh East', skills: [['Electrical', 'SENIOR'], ['Generator', 'INTERMEDIATE']] },
  { email: 'technician.1004@daralhai.com', fullName: 'Khaled Mansour', employeeCode: 'TECH-1004', region: 'Riyadh Central', skills: [['HVAC', 'INTERMEDIATE'], ['BMS', 'INTERMEDIATE']] },
  { email: 'technician.1005@daralhai.com', fullName: 'Yousef Nasser', employeeCode: 'TECH-1005', region: 'Riyadh Central', skills: [['Civil Works', 'SENIOR'], ['Painting', 'INTERMEDIATE']] },
  { email: 'technician.1006@daralhai.com', fullName: 'Fahad Al Mutairi', employeeCode: 'TECH-1006', region: 'Riyadh South', skills: [['Fire Safety', 'SENIOR'], ['Pump Systems', 'INTERMEDIATE']] },
  { email: 'technician.1007@daralhai.com', fullName: 'Saeed Al Otaibi', employeeCode: 'TECH-1007', region: 'Riyadh West', skills: [['Electrical', 'INTERMEDIATE'], ['Emergency Response', 'SENIOR']] },
  { email: 'technician.1008@daralhai.com', fullName: 'Nawaf Saleh', employeeCode: 'TECH-1008', region: 'Riyadh West', skills: [['HVAC', 'INTERMEDIATE'], ['Refrigeration', 'INTERMEDIATE']] },
  { email: 'technician.1009@daralhai.com', fullName: 'Bader Al Dosari', employeeCode: 'TECH-1009', region: 'Riyadh South', skills: [['Plumbing', 'INTERMEDIATE'], ['Water Treatment', 'SENIOR']] },
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

  const technicians = await prisma.technicianProfile.findMany({
    where: { id: { in: technicianIds }, deletedAt: null },
    select: { id: true },
  });

  if (technicians.length !== technicianIds.length) {
    throw new ApiError(400, 'One or more selected technicians are not available.');
  }

  return prisma.$transaction(async (tx) => {
    const createdTask = await tx.dailyScheduleTask.create({
      data: {
        workDate,
        task,
        description: payload.description || null,
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
  buildMicrosoftLoginUrl,
  finishMicrosoftCallback,
  completeMicrosoftLogin,
  microsoftErrorRedirect,
  listDashboard,
  listTechnicians,
  createTechnician,
  updateTechnician,
  listShifts,
  createShift,
  upsertTechnicianSchedule,
  createDailyScheduleTask,
  listDailyScheduleTasks,
  getSchedulingBoard,
};
