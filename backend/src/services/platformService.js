const bcrypt = require('bcryptjs');
const { getPrisma } = require('../config/prisma');
const { ApiError } = require('../utils/ApiError');
const { signJwt } = require('../middleware/platformAuthMiddleware');
const { normalizeArabicStatus } = require('../utils/platformEnums');

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

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roles: roleNames,
    },
  };
}

function nextNumber(prefix) {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${stamp}-${random}`;
}

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
        scheduledStartAt: payload.scheduledStartAt ? new Date(payload.scheduledStartAt) : null,
        scheduledEndAt: payload.scheduledEndAt ? new Date(payload.scheduledEndAt) : null,
      },
    });

    if (payload.assignedTechnicianId) {
      await tx.workOrderAssignment.create({
        data: {
          workOrderId: workOrder.id,
          technicianId: payload.assignedTechnicianId,
        },
      });
    }

    return tx.workOrder.findUnique({
      where: { id: workOrder.id },
      include: { assignments: true },
    });
  });
}

async function listWorkOrders() {
  const prisma = requirePrisma();
  return prisma.workOrder.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
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
  listDashboard,
  createMaintenanceRequest,
  listMaintenanceRequests,
  updateMaintenanceRequestStatus,
  createWorkOrder,
  listWorkOrders,
  closeWorkOrder,
  listModel,
  createModel,
};
