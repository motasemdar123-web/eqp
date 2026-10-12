const { getPrisma } = require('../config/prisma');
const { createAuditLog } = require('../services/komatsuOrderAuditService');

/**
 * GET /api/v1/integration/sap/health
 * Health & connectivity check for ABS integration service
 */
async function getHealth(req, res) {
  return res.json({
    success: true,
    service: 'Dar Al Hai EQP - SAP B1 M2M Integration API',
    status: 'HEALTHY',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    clientIp: req.clientIp,
    authenticatedKey: {
      id: req.apiKey.id,
      name: req.apiKey.name,
      role: req.apiKey.role,
      scopes: req.apiKey.scopes,
      keyPrefix: req.apiKey.keyPrefix,
    },
  });
}

/**
 * GET /api/v1/integration/sap/orders/pending
 * Retrieve pending Komatsu orders ready for SAP PO creation
 */
async function getPendingOrders(req, res) {
  const prisma = getPrisma();
  if (!prisma) {
    return res.status(500).json({ success: false, error: 'Database unavailable' });
  }

  const {
    page = '1',
    pageSize = '50',
    status = 'PENDING_SAP_PULL',
    channel = null,
    fromDate = null,
    toDate = null,
    autoMarkPulled = 'true',
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const take = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 50));
  const skip = (pageNum - 1) * take;

  const where = {
    deletedAt: null,
  };

  if (status && status !== 'ALL') {
    if (status.includes(',')) {
      where.sapStatus = { in: status.split(',').map((s) => s.trim()) };
    } else {
      where.sapStatus = status;
    }
  }

  if (channel && channel !== 'ALL') {
    where.channel = channel;
  }

  if (fromDate || toDate) {
    where.orderDate = {};
    if (fromDate) where.orderDate.gte = new Date(fromDate);
    if (toDate) where.orderDate.lte = new Date(toDate);
  }

  try {
    const [totalCount, orders] = await Promise.all([
      prisma.komatsuOrder.count({ where }),
      prisma.komatsuOrder.findMany({
        where,
        skip,
        take,
        orderBy: { orderDate: 'asc' },
        include: {
          items: {
            orderBy: { lineNumber: 'asc' },
          },
        },
      }),
    ]);

    // Format orders for SAP consumption
    const formattedOrders = orders.map((ord) => ({
      id: ord.id,
      komatsuSalesOrderNo: ord.komatsuSalesOrderNo,
      komatsuQuotationNo: ord.komatsuQuotationNo,
      distributorRefNo: ord.distributorRefNo,
      channel: ord.channel,
      orderDate: ord.orderDate,
      deliveryDueDate: ord.deliveryDueDate,
      currency: ord.currency,
      vendorCode: ord.vendorCode,
      customerCode: ord.customerCode,
      customerName: ord.customerName,
      equipmentSerial: ord.equipmentSerial,
      equipmentModel: ord.equipmentModel,
      comments: ord.comments,
      remarks: ord.remarks,
      tags: ord.tags,
      sapStatus: ord.sapStatus,
      items: ord.items.map((it) => ({
        lineNumber: it.lineNumber,
        partNumber: it.partNumber,
        description: it.description,
        quantity: it.quantity,
        unitPriceUSD: it.unitPriceUSD,
        lineTotalUSD: it.lineTotalUSD,
        suggestedWarehouse: it.suggestedWarehouse,
        suggestedTaxCode: it.suggestedTaxCode,
      })),
      createdAt: ord.createdAt,
    }));

    // If autoMarkPulled is enabled, transition only orders that are currently PENDING_SAP_PULL
    const shouldMarkPulled = autoMarkPulled !== 'false' && orders.length > 0;
    if (shouldMarkPulled) {
      const pendingOrders = orders.filter((o) => o.sapStatus === 'PENDING_SAP_PULL');
      const pendingIds = pendingOrders.map((o) => o.id);

      if (pendingIds.length > 0) {
        await prisma.komatsuOrder.updateMany({
          where: { id: { in: pendingIds } },
          data: { sapStatus: 'PULLED_BY_SAP' },
        });

        // Audit logs for transitioned orders
        for (const ord of pendingOrders) {
          await createAuditLog({
            orderId: ord.id,
            action: 'SAP_PULLED',
            actorType: 'SAP_M2M_API',
            actorId: req.apiKey.id,
            actorName: req.apiKey.name,
            oldValues: { sapStatus: 'PENDING_SAP_PULL' },
            newValues: { sapStatus: 'PULLED_BY_SAP' },
            ipAddress: req.clientIp,
            userAgent: req.headers['user-agent'],
            prismaClient: prisma,
          });
        }
      }
    }

    return res.json({
      success: true,
      totalCount,
      page: pageNum,
      pageSize: take,
      returnedCount: formattedOrders.length,
      orders: formattedOrders,
    });
  } catch (err) {
    console.error('[sapIntegrationController] getPendingOrders error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/v1/integration/sap/orders/:id
 * Retrieve a specific order manifest by ID or Komatsu Sales Order Number
 */
async function getOrderById(req, res) {
  const prisma = getPrisma();
  if (!prisma) {
    return res.status(500).json({ success: false, error: 'Database unavailable' });
  }

  const { id } = req.params;

  try {
    const order = await prisma.komatsuOrder.findFirst({
      where: {
        OR: [{ id }, { komatsuSalesOrderNo: id }, { komatsuQuotationNo: id }],
        deletedAt: null,
      },
      include: {
        items: {
          orderBy: { lineNumber: 'asc' },
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'ORDER_NOT_FOUND',
        message: `Komatsu order '${id}' could not be found.`,
      });
    }

    return res.json({
      success: true,
      order,
    });
  } catch (err) {
    console.error('[sapIntegrationController] getOrderById error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/v1/integration/sap/orders/:id/acknowledge
 * Confirms SAP B1 Purchase Order creation with sapDocNum
 */
async function acknowledgeOrder(req, res) {
  const prisma = getPrisma();
  if (!prisma) {
    return res.status(500).json({ success: false, error: 'Database unavailable' });
  }

  const { id } = req.params;
  const { sapDocNum, sapDocEntry, remarks } = req.body || {};

  if (!sapDocNum) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Field "sapDocNum" is required to acknowledge SAP PO creation.',
    });
  }

  try {
    const existing = await prisma.komatsuOrder.findFirst({
      where: {
        OR: [
          { id },
          { komatsuSalesOrderNo: id },
          { komatsuQuotationNo: id },
          { distributorRefNo: id },
        ],
        deletedAt: null,
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'ORDER_NOT_FOUND',
        message: `Order '${id}' does not exist.`,
      });
    }

    if (existing.sapStatus === 'EXCLUDED') {
      return res.status(400).json({
        success: false,
        error: 'ORDER_EXCLUDED',
        message: `Order '${id}' is marked as EXCLUDED from SAP integration. Contact operations admin to un-exclude.`,
      });
    }

    // Idempotent retry: if already acknowledged with the same PO number, return success without duplicate edits or audit logs
    if (existing.sapStatus === 'SAP_PO_CREATED' && existing.sapDocNum === String(sapDocNum)) {
      return res.json({
        success: true,
        message: 'SAP PO creation already acknowledged (idempotent).',
        order: existing,
      });
    }

    // Collision check: if already confirmed under a different PO number, block collision
    if (existing.sapStatus === 'SAP_PO_CREATED' && existing.sapDocNum && existing.sapDocNum !== String(sapDocNum)) {
      return res.status(409).json({
        success: false,
        error: 'ALREADY_ACKNOWLEDGED',
        message: `Order '${id}' is already confirmed under SAP PO #${existing.sapDocNum}.`,
      });
    }

    const oldValues = {
      sapStatus: existing.sapStatus,
      sapDocNum: existing.sapDocNum,
      sapDocEntry: existing.sapDocEntry,
    };

    const newValues = {
      sapStatus: 'SAP_PO_CREATED',
      sapDocNum: String(sapDocNum),
      sapDocEntry: sapDocEntry ? parseInt(sapDocEntry, 10) : null,
      sapSyncedAt: new Date(),
      sapFailureReason: null,
    };

    const updated = await prisma.komatsuOrder.update({
      where: { id: existing.id },
      data: {
        ...newValues,
        remarks: remarks ? `${existing.remarks || ''}\n${remarks}`.trim() : existing.remarks,
      },
      include: {
        items: true,
      },
    });

    await createAuditLog({
      orderId: existing.id,
      action: 'SAP_ACKNOWLEDGED',
      actorType: 'SAP_M2M_API',
      actorId: req.apiKey.id,
      actorName: req.apiKey.name,
      oldValues,
      newValues: {
        ...newValues,
        remarks,
      },
      ipAddress: req.clientIp,
      userAgent: req.headers['user-agent'],
      prismaClient: prisma,
    });

    return res.json({
      success: true,
      message: 'SAP PO confirmation acknowledged successfully.',
      order: updated,
    });
  } catch (err) {
    console.error('[sapIntegrationController] acknowledgeOrder error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/v1/integration/sap/orders/:id/fail
 * Records SAP integration error reported by ABS
 */
async function reportOrderFailure(req, res) {
  const prisma = getPrisma();
  if (!prisma) {
    return res.status(500).json({ success: false, error: 'Database unavailable' });
  }

  const { id } = req.params;
  const { reason, errorMessage, errorCode, rawError } = req.body || {};
  const failureReason = reason || errorMessage || 'Unknown SAP integration failure';

  try {
    const existing = await prisma.komatsuOrder.findFirst({
      where: {
        OR: [
          { id },
          { komatsuSalesOrderNo: id },
          { komatsuQuotationNo: id },
          { distributorRefNo: id },
        ],
        deletedAt: null,
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'ORDER_NOT_FOUND',
        message: `Order '${id}' does not exist.`,
      });
    }

    if (existing.sapStatus === 'EXCLUDED') {
      return res.status(400).json({
        success: false,
        error: 'ORDER_EXCLUDED',
        message: `Order '${id}' is marked as EXCLUDED from SAP integration.`,
      });
    }

    if (existing.sapStatus === 'SAP_PO_CREATED') {
      return res.status(409).json({
        success: false,
        error: 'ALREADY_CONFIRMED',
        message: `Cannot report failure: Order '${id}' has already been successfully committed to SAP with PO #${existing.sapDocNum}.`,
      });
    }

    const oldValues = {
      sapStatus: existing.sapStatus,
      sapFailureReason: existing.sapFailureReason,
    };

    const updated = await prisma.komatsuOrder.update({
      where: { id: existing.id },
      data: {
        sapStatus: 'SAP_SYNC_FAILED',
        sapFailureReason: failureReason,
      },
    });

    await createAuditLog({
      orderId: existing.id,
      action: 'SAP_FAILED',
      actorType: 'SAP_M2M_API',
      actorId: req.apiKey.id,
      actorName: req.apiKey.name,
      oldValues,
      newValues: {
        sapStatus: 'SAP_SYNC_FAILED',
        failureReason,
        errorCode,
        rawError,
      },
      ipAddress: req.clientIp,
      userAgent: req.headers['user-agent'],
      prismaClient: prisma,
    });

    return res.json({
      success: true,
      message: 'Integration failure recorded. Order flagged for operator review.',
      order: updated,
    });
  } catch (err) {
    console.error('[sapIntegrationController] reportOrderFailure error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getHealth,
  getPendingOrders,
  getOrderById,
  acknowledgeOrder,
  reportOrderFailure,
};
