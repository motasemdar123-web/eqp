const { getPrisma } = require('../config/prisma');

/**
 * Creates an immutable audit log record for a Komatsu order event or change.
 * 
 * @param {Object} params
 * @param {string} params.orderId
 * @param {string} params.action - One of SYNC_CREATED, SYNC_UPDATED, STATUS_CHANGED, SAP_PULLED, SAP_ACKNOWLEDGED, SAP_FAILED, MANUAL_EDIT, RETRY_QUEUED
 * @param {string} [params.actorType='SYSTEM_CRON'] - One of SYSTEM_CRON, USER, SAP_M2M_API
 * @param {string} [params.actorId]
 * @param {string} [params.actorName]
 * @param {Object} [params.oldValues]
 * @param {Object} [params.newValues]
 * @param {string} [params.ipAddress]
 * @param {string} [params.userAgent]
 * @param {Object} [params.prismaClient]
 */
async function createAuditLog({
  orderId,
  action = 'STATUS_CHANGED',
  actorType = 'SYSTEM_CRON',
  actorId = null,
  actorName = null,
  oldValues = null,
  newValues = null,
  ipAddress = null,
  userAgent = null,
  prismaClient = null,
}) {
  const prisma = prismaClient || getPrisma();
  if (!prisma || !orderId) return null;

  try {
    return await prisma.komatsuOrderAuditLog.create({
      data: {
        orderId,
        action,
        actorType,
        actorId: actorId ? String(actorId) : null,
        actorName: actorName ? String(actorName) : null,
        oldValues: oldValues && typeof oldValues === 'object' ? oldValues : (oldValues ? { value: oldValues } : null),
        newValues: newValues && typeof newValues === 'object' ? newValues : (newValues ? { value: newValues } : null),
        ipAddress: ipAddress ? String(ipAddress) : null,
        userAgent: userAgent ? String(userAgent) : null,
      },
    });
  } catch (err) {
    if (err && err.code === 'P2003') {
      console.warn(`[komatsuOrderAuditService] Order ${orderId} was removed or missing; audit log skipped.`);
      return null;
    }
    console.error(`[komatsuOrderAuditService] Failed to create audit log for order ${orderId}:`, err);
    return null;
  }
}

module.exports = {
  createAuditLog,
};
