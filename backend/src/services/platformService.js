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
  ];

  if (roles.some((role) => managementRoles.includes(role))) {
    return '/management';
  }

  if (roles.includes('FIELD_TECHNICIAN')) {
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
  if (!returnTo || typeof returnTo !== 'string') return '/management';
  if (!returnTo.startsWith('/') || returnTo.startsWith('//')) return '/management';
  if (returnTo.startsWith('/auth/')) return '/management';
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

async function findOrCreateMicrosoftUser(prisma, profile) {
  const email = normalizeMicrosoftEmail(profile);
  assertAllowedMicrosoftEmail(email);

  let user = await prisma.user.findUnique({ where: { email } });
  const isConfiguredAdmin = env.microsoft.adminEmails.includes(email);

  if (!user) {
    if (!isConfiguredAdmin && !env.microsoft.autoProvision) {
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

function nextNumber(prefix) {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${stamp}-${random}`;
}

const BUSINESS_TIMEZONE_OFFSET = process.env.BUSINESS_TIMEZONE_OFFSET || '+03:00';

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

function addDays(dateText, days) {
  const date = toWorkDate(dateText);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function buildBusinessDateTime(dateText, timeText) {
  if (!dateText || !timeText) return null;
  const normalizedTime = timeText.length === 5 ? `${timeText}:00` : timeText;
  return new Date(`${normalizeDateText(dateText)}T${normalizedTime}${BUSINESS_TIMEZONE_OFFSET}`);
}

function buildScheduledWindow(payload) {
  const workDate = normalizeDateText(payload.workDate || payload.date || todayText());
  const startsAt = payload.startsAt || payload.startTime;
  const endsAt = payload.endsAt || payload.endTime;
  const scheduledStartAt = payload.scheduledStartAt
    ? new Date(payload.scheduledStartAt)
    : buildBusinessDateTime(workDate, startsAt);
  let scheduledEndAt = payload.scheduledEndAt
    ? new Date(payload.scheduledEndAt)
    : buildBusinessDateTime(workDate, endsAt);

  if (scheduledStartAt && scheduledEndAt && scheduledEndAt <= scheduledStartAt) {
    scheduledEndAt = buildBusinessDateTime(addDays(workDate, 1), endsAt);
  }

  return { workDate, scheduledStartAt, scheduledEndAt };
}

function schedulingRange(dateText) {
  const day = normalizeDateText(dateText);
  return {
    date: day,
    start: buildBusinessDateTime(day, '00:00'),
    end: buildBusinessDateTime(addDays(day, 1), '00:00'),
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

const workOrderInclude = {
  request: true,
  asset: true,
  teamLead: {
    include: {
      user: { select: publicUserSelect },
      shift: true,
    },
  },
  assignments: {
    include: {
      technician: {
        include: {
          user: { select: publicUserSelect },
          shift: true,
          skills: true,
        },
      },
    },
  },
};

async function listDashboard() {
  const prisma = requirePrisma();
  const [
    openRequests,
    overdueRequests,
    openWorkOrders,
    assets,
    lowStock,
    recentRequests,
  ] = await Promise.all([
    prisma.maintenanceRequest.count({ where: { status: { in: ['NEW', 'TRIAGED', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD'] } } }),
    prisma.maintenanceRequest.count({ where: { slaTargetAt: { lt: new Date() }, status: { notIn: ['COMPLETED', 'CLOSED', 'CANCELLED'] } } }),
    prisma.workOrder.count({ where: { status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_PARTS'] } } }),
    prisma.asset.count(),
    prisma.inventoryItem.count({ where: { quantity: { lte: 0 } } }),
    prisma.maintenanceRequest.findMany({ orderBy: { createdAt: 'desc' }, take: 8 }),
  ]);

  return {
    kpis: {
      openRequests,
      overdueRequests,
      openWorkOrders,
      assets,
      lowStock,
      slaCompliance: openRequests === 0 ? 100 : Math.max(0, Math.round(((openRequests - overdueRequests) / openRequests) * 100)),
    },
    recentRequests,
  };
}

async function createMaintenanceRequest(payload, actorId) {
  const prisma = requirePrisma();

  return prisma.maintenanceRequest.create({
    data: {
      requestNumber: nextNumber('REQ'),
      title: payload.title,
      description: payload.description,
      category: payload.category,
      priority: payload.priority || 'MEDIUM',
      source: payload.source || 'PORTAL',
      status: normalizeArabicStatus(payload.status || 'NEW'),
      slaTargetAt: payload.slaTargetAt ? new Date(payload.slaTargetAt) : null,
      branchId: payload.branchId,
      locationId: payload.locationId,
      assetId: payload.assetId,
      createdById: actorId,
      internalNotes: payload.internalNotes,
      customerVisibleNotes: payload.customerVisibleNotes,
    },
  });
}

async function listMaintenanceRequests() {
  const prisma = requirePrisma();
  return prisma.maintenanceRequest.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
}

async function updateMaintenanceRequestStatus(id, status, notes) {
  const prisma = requirePrisma();
  const internalStatus = normalizeArabicStatus(status);

  return prisma.maintenanceRequest.update({
    where: { id },
    data: {
      status: internalStatus,
      internalNotes: notes,
    },
  });
}

async function createWorkOrder(payload) {
  const prisma = requirePrisma();
  const { scheduledStartAt, scheduledEndAt } = buildScheduledWindow(payload);

  return prisma.$transaction(async (tx) => {
    const workOrder = await tx.workOrder.create({
      data: {
        workOrderNumber: nextNumber('WO'),
        requestId: payload.requestId,
        assetId: payload.assetId,
        title: payload.title,
        description: payload.description,
        priority: payload.priority || 'MEDIUM',
        status: payload.status || 'OPEN',
        jobType: payload.jobType,
        workScope: payload.workScope,
        safetyNotes: payload.safetyNotes,
        requiredTools: payload.requiredTools,
        requiredParts: payload.requiredParts,
        permitRequired: Boolean(payload.permitRequired),
        customerContact: payload.customerContact,
        estimatedDurationMinutes: payload.estimatedDurationMinutes ? Number(payload.estimatedDurationMinutes) : null,
        teamLeadTechnicianId: payload.teamLeadTechnicianId || null,
        scheduledStartAt,
        scheduledEndAt,
      },
    });

    const technicianIds = uniqueIds([
      payload.assignedTechnicianId,
      ...toIdArray(payload.technicianIds),
    ]);

    if (technicianIds.length > 0) {
      await tx.workOrderAssignment.createMany({
        data: technicianIds.map((technicianId) => ({
          workOrderId: workOrder.id,
          technicianId,
        })),
        skipDuplicates: true,
      });
    }

    return tx.workOrder.findUnique({
      where: { id: workOrder.id },
      include: workOrderInclude,
    });
  });
}

async function listWorkOrders() {
  const prisma = requirePrisma();
  return prisma.workOrder.findMany({ include: workOrderInclude, orderBy: { createdAt: 'desc' }, take: 100 });
}

async function closeWorkOrder(id, payload) {
  const prisma = requirePrisma();

  return prisma.workOrder.update({
    where: { id },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      closureNotes: payload.closureNotes,
      rootCause: payload.rootCause,
      correctiveAction: payload.correctiveAction,
      preventiveAction: payload.preventiveAction,
    },
  });
}

async function listTechnicians() {
  const prisma = requirePrisma();

  return prisma.technicianProfile.findMany({
    where: { deletedAt: null },
    include: {
      user: { select: publicUserSelect },
      shift: true,
      skills: true,
      assignments: {
        where: { workOrder: { status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_PARTS'] } } },
        include: { workOrder: true },
      },
    },
    orderBy: { employeeCode: 'asc' },
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

async function createJobCard(payload, actorId) {
  const prisma = requirePrisma();
  const technicianIds = uniqueIds([payload.teamLeadTechnicianId, ...toIdArray(payload.technicianIds)]);
  if (!payload.title || !payload.workDate || !payload.startsAt || !payload.endsAt) {
    throw new ApiError(400, 'title, workDate, startsAt, and endsAt are required');
  }
  if (technicianIds.length === 0) {
    throw new ApiError(400, 'At least one technician is required');
  }

  const { scheduledStartAt, scheduledEndAt } = buildScheduledWindow(payload);

  return prisma.$transaction(async (tx) => {
    const workOrder = await tx.workOrder.create({
      data: {
        workOrderNumber: nextNumber('JC'),
        requestId: payload.requestId || null,
        assetId: payload.assetId || null,
        title: payload.title,
        description: payload.description || payload.workScope || null,
        priority: payload.priority || 'MEDIUM',
        status: 'ASSIGNED',
        jobType: payload.jobType || 'Corrective Maintenance',
        workScope: payload.workScope || payload.description || null,
        safetyNotes: payload.safetyNotes || null,
        requiredTools: payload.requiredTools || null,
        requiredParts: payload.requiredParts || null,
        permitRequired: Boolean(payload.permitRequired),
        customerContact: payload.customerContact || null,
        estimatedDurationMinutes: payload.estimatedDurationMinutes ? Number(payload.estimatedDurationMinutes) : null,
        teamLeadTechnicianId: payload.teamLeadTechnicianId || technicianIds[0],
        scheduledStartAt,
        scheduledEndAt,
        createdById: actorId,
      },
    });

    await tx.workOrderAssignment.createMany({
      data: technicianIds.map((technicianId) => ({
        workOrderId: workOrder.id,
        technicianId,
        createdById: actorId,
      })),
      skipDuplicates: true,
    });

    if (payload.requestId) {
      await tx.maintenanceRequest.update({
        where: { id: payload.requestId },
        data: { status: 'ASSIGNED', updatedById: actorId },
      });
    }

    await tx.activityTimeline.create({
      data: {
        requestId: payload.requestId || null,
        workOrderId: workOrder.id,
        eventType: 'JOB_CARD_CREATED',
        message: 'Job card created and dispatched to technicians.',
        metadata: {
          technicianIds,
          scheduledStartAt,
          scheduledEndAt,
          jobType: payload.jobType || 'Corrective Maintenance',
        },
        createdById: actorId,
      },
    });

    return tx.workOrder.findUnique({
      where: { id: workOrder.id },
      include: workOrderInclude,
    });
  });
}

async function getSchedulingBoard(dateText) {
  const prisma = requirePrisma();
  const { date, start, end, workDate } = schedulingRange(dateText);

  const [
    technicians,
    shifts,
    branches,
    assets,
    openRequests,
    jobCards,
    unscheduledWorkOrders,
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
        assignments: {
          where: {
            workOrder: {
              scheduledStartAt: { gte: start, lt: end },
              deletedAt: null,
            },
          },
          include: { workOrder: true },
        },
      },
      orderBy: { employeeCode: 'asc' },
    }),
    prisma.shift.findMany({ where: { deletedAt: null }, include: { branch: true }, orderBy: { startsAt: 'asc' } }),
    prisma.branch.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' } }),
    prisma.asset.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' }, take: 100 }),
    prisma.maintenanceRequest.findMany({
      where: { status: { in: ['NEW', 'TRIAGED', 'ASSIGNED', 'IN_PROGRESS'] }, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.workOrder.findMany({
      where: { scheduledStartAt: { gte: start, lt: end }, deletedAt: null },
      include: workOrderInclude,
      orderBy: { scheduledStartAt: 'asc' },
      take: 100,
    }),
    prisma.workOrder.findMany({
      where: {
        scheduledStartAt: null,
        status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_PARTS'] },
        deletedAt: null,
      },
      include: workOrderInclude,
      orderBy: { createdAt: 'desc' },
      take: 25,
    }),
  ]);

  const scheduledTechnicians = technicians.filter((technician) => technician.schedules.length > 0).length;
  const availableTechnicians = technicians.filter((technician) => {
    const status = technician.schedules[0]?.status;
    return technician.isAvailable && (!status || ['PLANNED', 'CONFIRMED', 'ON_DUTY'].includes(status));
  }).length;
  const overloadedTechnicians = technicians.filter((technician) => technician.assignments.length >= 4).length;

  return {
    date,
    kpis: {
      technicians: technicians.length,
      scheduledTechnicians,
      availableTechnicians,
      jobCards: jobCards.length,
      unscheduledWorkOrders: unscheduledWorkOrders.length,
      overloadedTechnicians,
    },
    technicians,
    shifts,
    branches,
    assets,
    openRequests,
    jobCards,
    unscheduledWorkOrders,
  };
}

async function listModel(modelName) {
  const prisma = requirePrisma();
  return prisma[modelName].findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
}

async function createModel(modelName, payload) {
  const prisma = requirePrisma();
  return prisma[modelName].create({ data: payload });
}

module.exports = {
  login,
  unifiedLogin,
  buildMicrosoftLoginUrl,
  finishMicrosoftCallback,
  completeMicrosoftLogin,
  microsoftErrorRedirect,
  listDashboard,
  createMaintenanceRequest,
  listMaintenanceRequests,
  updateMaintenanceRequestStatus,
  createWorkOrder,
  listWorkOrders,
  closeWorkOrder,
  listTechnicians,
  listShifts,
  createShift,
  upsertTechnicianSchedule,
  createJobCard,
  getSchedulingBoard,
  listModel,
  createModel,
};
