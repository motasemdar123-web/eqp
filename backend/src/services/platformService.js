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

  if (roles.includes('FIELD_TECHNICIAN') && roles.length === 1) {
    return '/technician';
  }

  if (permissions.includes('WORK_ORDERS_MANAGE') || permissions.includes('REQUESTS_ASSIGN')) {
    return '/engineer';
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

async function createWorkOrder(payload, actorId) {
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
        createdById: actorId,
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
          createdById: actorId,
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

function assertEngineerAccess(actor) {
  const permissions = actor?.permissions || [];

  if (
    !permissions.includes('WORK_ORDERS_MANAGE') &&
    !permissions.includes('REQUESTS_ASSIGN') &&
    !permissions.includes('SYSTEM_CONFIGURE')
  ) {
    throw new ApiError(403, 'Engineer approval access is required.');
  }
}

async function findTechnicianForActor(prisma, actor) {
  if (!actor?.sub) {
    throw new ApiError(401, 'Authentication required');
  }

  const permissions = actor.permissions || [];
  if (
    permissions.includes('WORK_ORDERS_MANAGE') ||
    permissions.includes('REQUESTS_ASSIGN') ||
    permissions.includes('EQP_MANAGE') ||
    permissions.includes('SYSTEM_CONFIGURE')
  ) {
    throw new ApiError(403, 'Engineer accounts cannot use the technician page.');
  }

  const technician = await prisma.technicianProfile.findFirst({
    where: {
      userId: actor.sub,
      deletedAt: null,
    },
    include: {
      user: { select: publicUserSelect },
      shift: true,
      skills: true,
    },
  });

  if (!technician) {
    throw new ApiError(403, 'Technician profile is required for this page.');
  }

  return technician;
}

async function attachWorkOrderEvidence(prisma, workOrders) {
  const ids = workOrders.map((workOrder) => workOrder.id);

  if (ids.length === 0) return workOrders;

  const [attachments, comments, timeline] = await Promise.all([
    prisma.attachment.findMany({
      where: {
        ownerType: 'WORK_ORDER',
        ownerId: { in: ids },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.comment.findMany({
      where: {
        workOrderId: { in: ids },
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      take: ids.length * 8,
    }),
    prisma.activityTimeline.findMany({
      where: {
        workOrderId: { in: ids },
      },
      orderBy: { createdAt: 'desc' },
      take: ids.length * 8,
    }),
  ]);

  return workOrders.map((workOrder) => ({
    ...workOrder,
    attachments: attachments.filter((attachment) => attachment.ownerId === workOrder.id),
    comments: comments.filter((comment) => comment.workOrderId === workOrder.id),
    timeline: timeline.filter((event) => event.workOrderId === workOrder.id),
  }));
}

async function listTechnicianSchedule(actor, dateText) {
  const prisma = requirePrisma();
  const technician = await findTechnicianForActor(prisma, actor);
  const { date, start, end, workDate } = schedulingRange(dateText);

  const [schedule, workOrders] = await Promise.all([
    prisma.technicianSchedule.findUnique({
      where: {
        technicianId_workDate: {
          technicianId: technician.id,
          workDate,
        },
      },
      include: {
        shift: true,
        branch: true,
      },
    }),
    prisma.workOrder.findMany({
      where: {
        deletedAt: null,
        assignments: {
          some: {
            technicianId: technician.id,
          },
        },
        status: { notIn: ['CANCELLED', 'CLOSED'] },
        OR: [
          { scheduledStartAt: { gte: start, lt: end } },
          { scheduledStartAt: null, status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_PARTS', 'PENDING_APPROVAL'] } },
          { status: 'PENDING_APPROVAL' },
        ],
      },
      include: workOrderInclude,
      orderBy: [
        { scheduledStartAt: 'asc' },
        { createdAt: 'desc' },
      ],
      take: 50,
    }),
  ]);

  return {
    date,
    technician,
    schedule,
    workOrders: await attachWorkOrderEvidence(prisma, workOrders),
  };
}

function normalizeCompletionPhotos(photos = []) {
  if (!Array.isArray(photos)) {
    throw new ApiError(400, 'photos must be an array.');
  }

  if (photos.length > 6) {
    throw new ApiError(400, 'Upload up to 6 photos per completion request.');
  }

  const totalSize = photos.reduce((size, photo) => size + String(photo.dataUrl || '').length, 0);
  if (totalSize > 18 * 1024 * 1024) {
    throw new ApiError(400, 'Photo upload is too large. Compress the images and try again.');
  }

  return photos.map((photo, index) => {
    const fileName = String(photo.fileName || `completion-photo-${index + 1}.jpg`).slice(0, 160);
    const mimeType = String(photo.mimeType || 'image/jpeg').slice(0, 80);
    const dataUrl = String(photo.dataUrl || '');

    if (!dataUrl.startsWith('data:image/')) {
      throw new ApiError(400, 'Only image uploads are allowed.');
    }

    return { fileName, mimeType, dataUrl };
  });
}

async function notifyEngineers(tx, workOrder, actorId) {
  const recipientFilters = [
    {
      roles: {
        some: {
          role: {
            code: { in: ['MAINTENANCE_SUPERVISOR', 'OPERATIONS_MANAGER', 'SYSTEM_ADMIN', 'SUPER_ADMIN'] },
          },
        },
      },
    },
  ];

  if (workOrder.createdById) {
    recipientFilters.unshift({ id: workOrder.createdById });
  }

  const engineerUsers = await tx.user.findMany({
    where: {
      OR: recipientFilters,
    },
    select: { id: true },
  });
  const userIds = uniqueIds(engineerUsers.map((user) => user.id));

  if (userIds.length === 0) return;

  await tx.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      title: 'Work order completion pending approval',
      message: `${workOrder.workOrderNumber} is waiting for engineer approval.`,
      metadata: {
        workOrderId: workOrder.id,
        workOrderNumber: workOrder.workOrderNumber,
      },
      createdById: actorId,
    })),
  });
}

async function notifyTechnicians(tx, workOrder, actorId, title, message) {
  const assignments = await tx.workOrderAssignment.findMany({
    where: { workOrderId: workOrder.id },
    include: { technician: true },
  });
  const userIds = uniqueIds(assignments.map((assignment) => assignment.technician.userId));

  if (userIds.length === 0) return;

  await tx.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      title,
      message,
      metadata: {
        workOrderId: workOrder.id,
        workOrderNumber: workOrder.workOrderNumber,
      },
      createdById: actorId,
    })),
  });
}

async function submitTechnicianCompletion(workOrderId, payload, actor) {
  const prisma = requirePrisma();
  const technician = await findTechnicianForActor(prisma, actor);
  const notes = String(payload.completionNotes || payload.notes || '').trim();
  const photos = normalizeCompletionPhotos(payload.photos || []);

  if (!notes && photos.length === 0) {
    throw new ApiError(400, 'Completion notes or photos are required.');
  }

  const workOrder = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
    include: {
      ...workOrderInclude,
      assignments: true,
    },
  });

  if (!workOrder || workOrder.deletedAt) {
    throw new ApiError(404, 'Work order not found.');
  }

  if (!workOrder.assignments.some((assignment) => assignment.technicianId === technician.id)) {
    throw new ApiError(403, 'This work order is not assigned to you.');
  }

  if (['COMPLETED', 'CLOSED', 'CANCELLED'].includes(workOrder.status)) {
    throw new ApiError(400, 'This work order is already closed.');
  }

  return prisma.$transaction(async (tx) => {
    const updatedWorkOrder = await tx.workOrder.update({
      where: { id: workOrder.id },
      data: {
        status: 'PENDING_APPROVAL',
        completedAt: new Date(),
        closureNotes: notes || workOrder.closureNotes,
        updatedById: actor.sub,
      },
      include: workOrderInclude,
    });

    if (notes) {
      await tx.comment.create({
        data: {
          workOrderId: workOrder.id,
          visibility: 'TECHNICIAN',
          body: notes,
          createdById: actor.sub,
        },
      });
    }

    if (photos.length > 0) {
      await tx.attachment.createMany({
        data: photos.map((photo) => ({
          ownerType: 'WORK_ORDER',
          ownerId: workOrder.id,
          fileName: photo.fileName,
          fileUrl: photo.dataUrl,
          mimeType: photo.mimeType,
          category: 'TECHNICIAN_COMPLETION_PHOTO',
          createdById: actor.sub,
        })),
      });
    }

    await tx.activityTimeline.create({
      data: {
        requestId: workOrder.requestId || null,
        workOrderId: workOrder.id,
        eventType: 'TECHNICIAN_COMPLETION_SUBMITTED',
        message: 'Technician submitted completion evidence for engineer approval.',
        metadata: {
          technicianId: technician.id,
          photoCount: photos.length,
        },
        createdById: actor.sub,
      },
    });

    await notifyEngineers(tx, workOrder, actor.sub);

    return updatedWorkOrder;
  });
}

async function listEngineerCompletionRequests(actor) {
  assertEngineerAccess(actor);
  const prisma = requirePrisma();
  const workOrders = await prisma.workOrder.findMany({
    where: {
      status: 'PENDING_APPROVAL',
      deletedAt: null,
    },
    include: workOrderInclude,
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });

  return attachWorkOrderEvidence(prisma, workOrders);
}

async function reviewCompletionRequest(workOrderId, payload, actor) {
  assertEngineerAccess(actor);
  const prisma = requirePrisma();
  const decision = String(payload.decision || '').toUpperCase();
  const reviewNotes = String(payload.reviewNotes || payload.notes || '').trim();

  if (!['APPROVED', 'REJECTED'].includes(decision)) {
    throw new ApiError(400, 'decision must be APPROVED or REJECTED.');
  }

  const workOrder = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
    include: workOrderInclude,
  });

  if (!workOrder || workOrder.deletedAt) {
    throw new ApiError(404, 'Work order not found.');
  }

  if (workOrder.status !== 'PENDING_APPROVAL') {
    throw new ApiError(400, 'This work order is not pending approval.');
  }

  return prisma.$transaction(async (tx) => {
    const approved = decision === 'APPROVED';
    const updatedWorkOrder = await tx.workOrder.update({
      where: { id: workOrder.id },
      data: {
        status: approved ? 'COMPLETED' : 'IN_PROGRESS',
        completedAt: approved ? (workOrder.completedAt || new Date()) : null,
        updatedById: actor.sub,
      },
      include: workOrderInclude,
    });

    if (reviewNotes) {
      await tx.comment.create({
        data: {
          workOrderId: workOrder.id,
          visibility: 'INTERNAL',
          body: reviewNotes,
          createdById: actor.sub,
        },
      });
    }

    await tx.activityTimeline.create({
      data: {
        requestId: workOrder.requestId || null,
        workOrderId: workOrder.id,
        eventType: approved ? 'COMPLETION_APPROVED' : 'COMPLETION_REJECTED',
        message: approved
          ? 'Engineer approved technician completion.'
          : 'Engineer rejected completion and returned the work order to the technician.',
        metadata: {
          decision,
          reviewNotes,
        },
        createdById: actor.sub,
      },
    });

    await notifyTechnicians(
      tx,
      workOrder,
      actor.sub,
      approved ? 'Work order approved' : 'Work order needs correction',
      approved
        ? `${workOrder.workOrderNumber} has been approved by the engineer.`
        : `${workOrder.workOrderNumber} was returned by the engineer. Review the notes and resubmit.`,
    );

    return updatedWorkOrder;
  });
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
        assignments: {
          where: { workOrder: { status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_PARTS'] } } },
          include: { workOrder: true },
        },
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
        assignments: {
          where: { workOrder: { status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_PARTS'] } } },
          include: { workOrder: true },
        },
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
  listTechnicianSchedule,
  submitTechnicianCompletion,
  listEngineerCompletionRequests,
  reviewCompletionRequest,
  listTechnicians,
  createTechnician,
  updateTechnician,
  listShifts,
  createShift,
  upsertTechnicianSchedule,
  createJobCard,
  getSchedulingBoard,
  listModel,
  createModel,
};
