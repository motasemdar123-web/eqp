const { getPrisma } = require('../config/prisma');
const { runSync, getSyncStatus } = require('../services/komatsuSyncService');
const { createAuditLog } = require('../services/komatsuOrderAuditService');
const { createApiKey, listApiKeys, revokeApiKey } = require('../services/apiKeyService');

/**
 * GET /api/admin/komatsu-orders
 * List orders with status and date filtering
 */
async function listOrders(req, res) {
  const prisma = getPrisma();
  if (!prisma) {
    return res.status(500).json({ success: false, error: 'Database unavailable' });
  }

  const {
    page = '1',
    pageSize = '25',
    status = null,
    channel = null,
    search = '',
    fromDate = null,
    toDate = null,
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const take = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 25));
  const skip = (pageNum - 1) * take;

  const where = { deletedAt: null };

  if (status && status !== 'ALL') {
    where.sapStatus = status;
  }

  if (channel && channel !== 'ALL') {
    where.channel = channel;
  }

  if (fromDate || toDate) {
    where.orderDate = {};
    if (fromDate) where.orderDate.gte = new Date(fromDate);
    if (toDate) where.orderDate.lte = new Date(toDate);
  }

  if (search && search.trim()) {
    const term = search.trim();
    where.OR = [
      { komatsuSalesOrderNo: { contains: term, mode: 'insensitive' } },
      { komatsuQuotationNo: { contains: term, mode: 'insensitive' } },
      { distributorRefNo: { contains: term, mode: 'insensitive' } },
      { sapDocNum: { contains: term, mode: 'insensitive' } },
      { customerName: { contains: term, mode: 'insensitive' } },
    ];
  }

  try {
    const [totalCount, orders, statusCounts] = await Promise.all([
      prisma.komatsuOrder.count({ where }),
      prisma.komatsuOrder.findMany({
        where,
        skip,
        take,
        orderBy: { orderDate: 'desc' },
        include: {
          items: true,
          _count: { select: { auditLogs: true } },
        },
      }),
      prisma.komatsuOrder.groupBy({
        by: ['sapStatus'],
        _count: { id: true },
        where: { deletedAt: null },
      }),
    ]);

    const statusSummary = {
      PENDING_SAP_PULL: 0,
      PULLED_BY_SAP: 0,
      SAP_PO_CREATED: 0,
      SAP_SYNC_FAILED: 0,
      EXCLUDED: 0,
    };

    statusCounts.forEach((sc) => {
      statusSummary[sc.sapStatus] = sc._count.id;
    });

    return res.json({
      success: true,
      totalCount,
      page: pageNum,
      pageSize: take,
      statusSummary,
      orders,
    });
  } catch (err) {
    console.error('[komatsuOrderAdminController] listOrders error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/admin/komatsu-orders/:id/audit-log
 * Full chronological change history and diffs
 */
async function getOrderAuditLogs(req, res) {
  const prisma = getPrisma();
  if (!prisma) {
    return res.status(500).json({ success: false, error: 'Database unavailable' });
  }

  const { id } = req.params;

  try {
    const logs = await prisma.komatsuOrderAuditLog.findMany({
      where: { orderId: id },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      orderId: id,
      count: logs.length,
      auditLogs: logs,
    });
  } catch (err) {
    console.error('[komatsuOrderAdminController] getOrderAuditLogs error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * PATCH /api/admin/komatsu-orders/:id
 * Edit remarks, custom tags, or trigger manual retry of failed status
 * (OEM line items remain immutable)
 */
async function updateOrder(req, res) {
  const prisma = getPrisma();
  if (!prisma) {
    return res.status(500).json({ success: false, error: 'Database unavailable' });
  }

  const { id } = req.params;
  const { remarks, tags, retrySapStatus, sapStatus, comments } = req.body || {};

  // Strictly enforce OEM part/pricing immutability
  if (
    req.body &&
    (req.body.items ||
      req.body.parts ||
      req.body.partNumber ||
      req.body.quantity ||
      req.body.unitPriceUSD ||
      req.body.lineTotalUSD)
  ) {
    return res.status(400).json({
      success: false,
      error: 'IMMUTABLE_FIELD',
      message: 'OEM line items, part numbers, quantities, and prices are strictly immutable and cannot be modified.',
    });
  }

  try {
    const existing = await prisma.komatsuOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'ORDER_NOT_FOUND', message: `Order ${id} not found` });
    }

    const updates = {};
    const oldValues = {};
    const newValues = {};
    let auditAction = 'MANUAL_EDIT';

    if (remarks !== undefined && remarks !== existing.remarks) {
      updates.remarks = remarks;
      oldValues.remarks = existing.remarks;
      newValues.remarks = remarks;
    }

    if (comments !== undefined && comments !== existing.comments) {
      updates.comments = comments;
      oldValues.comments = existing.comments;
      newValues.comments = comments;
    }

    if (tags !== undefined && Array.isArray(tags)) {
      updates.tags = tags;
      oldValues.tags = existing.tags;
      newValues.tags = tags;
    }

    // Trigger manual retry for failed orders
    if (retrySapStatus === true) {
      if (existing.sapStatus === 'SAP_PO_CREATED') {
        return res.status(400).json({
          success: false,
          error: 'CANNOT_RETRY_CONFIRMED_ORDER',
          message: `Cannot retry order '${id}' because SAP Purchase Order #${existing.sapDocNum} has already been created. Void PO in SAP before retrying.`,
        });
      }
      updates.sapStatus = 'PENDING_SAP_PULL';
      updates.sapFailureReason = null;
      oldValues.sapStatus = existing.sapStatus;
      oldValues.sapFailureReason = existing.sapFailureReason;
      newValues.sapStatus = 'PENDING_SAP_PULL';
      newValues.sapFailureReason = null;
      auditAction = 'RETRY_QUEUED';
    } else if (sapStatus && sapStatus !== existing.sapStatus) {
      updates.sapStatus = sapStatus;
      oldValues.sapStatus = existing.sapStatus;
      newValues.sapStatus = sapStatus;
      auditAction = 'STATUS_CHANGED';
    }

    if (Object.keys(updates).length === 0) {
      return res.json({ success: true, message: 'No changes requested', order: existing });
    }

    updates.updatedById = req.user?.sub || null;

    const updated = await prisma.komatsuOrder.update({
      where: { id },
      data: updates,
      include: { items: true },
    });

    await createAuditLog({
      orderId: id,
      action: auditAction,
      actorType: 'USER',
      actorId: req.user?.sub || 'system-admin',
      actorName: req.user?.fullName || req.user?.email || 'Operations Admin',
      oldValues,
      newValues,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      prismaClient: prisma,
    });

    return res.json({
      success: true,
      message: 'Order updated successfully',
      order: updated,
    });
  } catch (err) {
    console.error('[komatsuOrderAdminController] updateOrder error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/admin/komatsu-orders/sync-now
 * On-demand manual sync trigger
 */
async function syncNow(req, res) {
  try {
    const { daysBack = 14 } = req.body || {};
    const result = await runSync({
      triggerType: 'MANUAL_USER',
      triggeredById: req.user?.sub || null,
      triggeredByName: req.user?.fullName || req.user?.email || 'Admin User',
      daysBack: parseInt(daysBack, 10) || 14,
    });

    return res.json({
      success: true,
      message: 'Komatsu synchronization executed successfully.',
      result,
    });
  } catch (err) {
    console.error('[komatsuOrderAdminController] syncNow error:', err);
    return res.status(400).json({
      success: false,
      error: 'SYNC_ERROR',
      message: err.message,
    });
  }
}

/**
 * GET /api/admin/komatsu-orders/sync-jobs
 * List past sync jobs and cookie status
 */
async function getSyncJobs(req, res) {
  const prisma = getPrisma();
  if (!prisma) {
    return res.status(500).json({ success: false, error: 'Database unavailable' });
  }

  try {
    const [statusInfo, jobs] = await Promise.all([
      getSyncStatus(),
      prisma.komatsuSyncJob.findMany({
        take: 30,
        orderBy: { startedAt: 'desc' },
      }),
    ]);

    return res.json({
      success: true,
      ...statusInfo,
      jobs,
    });
  } catch (err) {
    console.error('[komatsuOrderAdminController] getSyncJobs error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/admin/api-keys
 * Create a new API key for ABS or partners
 */
async function createNewApiKey(req, res) {
  const { name, scopes, allowedIps, role, expiresAt } = req.body || {};

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'Name is required for API Key' });
  }

  try {
    const apiKey = await createApiKey({
      name: name.trim(),
      scopes: Array.isArray(scopes) && scopes.length > 0 ? scopes : ['sap:read', 'sap:write'],
      allowedIps: Array.isArray(allowedIps) ? allowedIps : [],
      role: role || 'SAP_INTEGRATION_SERVICE',
      expiresAt,
      createdById: req.user?.sub || null,
    });

    return res.status(201).json({
      success: true,
      message: 'API Key generated successfully. Save the raw key securely; it will not be displayed again.',
      apiKey,
    });
  } catch (err) {
    console.error('[komatsuOrderAdminController] createNewApiKey error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/admin/api-keys
 * List active API keys
 */
async function getApiKeys(req, res) {
  try {
    const keys = await listApiKeys();
    return res.json({
      success: true,
      count: keys.length,
      keys,
    });
  } catch (err) {
    console.error('[komatsuOrderAdminController] getApiKeys error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * DELETE /api/admin/api-keys/:id
 * Revoke an API key
 */
async function deleteApiKey(req, res) {
  const { id } = req.params;
  try {
    const revoked = await revokeApiKey(id);
    return res.json({
      success: true,
      message: 'API key revoked successfully',
      apiKey: revoked,
    });
  } catch (err) {
    console.error('[komatsuOrderAdminController] deleteApiKey error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  listOrders,
  getOrderAuditLogs,
  updateOrder,
  syncNow,
  getSyncJobs,
  createNewApiKey,
  getApiKeys,
  deleteApiKey,
};
