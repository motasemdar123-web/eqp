const bcrypt = require('bcryptjs');
const { getPrisma } = require('../config/prisma');
const { ApiError } = require('../utils/ApiError');
const { signJwt } = require('../middleware/platformAuthMiddleware');
const { normalizeArabicStatus } = require('../utils/platformEnums');
const { createSessionToken } = require('../utils/sessionToken');

function requirePrisma() {
  const prisma = getPrisma();

  if (!prisma) {
    throw new ApiError(503, 'Prisma is not configured. Set DATABASE_URL and run migrations.');
  }

  return prisma;
}

async function login({ email, password }) {
  const prisma = requirePrisma();
  const user = await prisma.user.findUnique({
    where: { email },
    include: { roles: { include: { role: true } } },
  });

  if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const roleNames = user.roles.map((userRole) => userRole.role.code);
  const permissions = await prisma.rolePermission.findMany({
    where: { role: { code: { in: roleNames } } },
    include: { permission: true },
  });

  const token = signJwt({
    sub: user.id,
    email: user.email,
    fullName: user.fullName,
    roles: roleNames,
    permissions: [...new Set(permissions.map((rolePermission) => rolePermission.permission.code))],
  });
  const permissionNames = [...new Set(permissions.map((rolePermission) => rolePermission.permission.code))];

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roles: roleNames,
      permissions: permissionNames,
    },
  };
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

async function unifiedLogin({ identifier, email, password, userNumber, preferredModule }) {
  const prisma = requirePrisma();
  const rawIdentifier = String(identifier || email || userNumber || '').trim();

  if (!rawIdentifier) {
    throw new ApiError(400, 'Email or technician code is required');
  }

  if (rawIdentifier.includes('@')) {
    if (!password) {
      throw new ApiError(400, 'Password is required for email login');
    }

    const result = await login({ email: rawIdentifier.toLowerCase(), password });
    const permissions = result.user.permissions || [];

    return {
      authType: 'PLATFORM',
      token: result.token,
      user: result.user,
      redirectTo: resolvePlatformRedirect(result.user.roles, permissions, preferredModule),
    };
  }

  const technicianCode = Number(rawIdentifier);
  if (!Number.isInteger(technicianCode) || technicianCode <= 0) {
    throw new ApiError(400, 'Enter a valid email or technician code');
  }

  const user = await prisma.user.findUnique({
    where: { userNumber: technicianCode },
    include: { roles: { include: { role: true } } },
  });

  if (!user) {
    throw new ApiError(404, 'Invalid user code');
  }

  const roles = user.roles.map((userRole) => userRole.role.code);
  const eqpUser = {
    id: user.id,
    user_number: user.userNumber,
    full_name: user.fullName,
  };
  const sessionToken = createSessionToken(eqpUser);

  return {
    authType: 'EQP_TECHNICIAN',
    token: sessionToken,
    user: {
      id: user.id,
      userNumber: user.userNumber,
      fullName: user.fullName,
      roles,
      locale: user.locale,
      sessionToken,
    },
    redirectTo: '/dashboard',
  };
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
