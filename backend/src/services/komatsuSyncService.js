const fs = require('fs');
const path = require('path');
const { getPrisma } = require('../config/prisma');
const { searchQuotations } = require('./komatsuEoService');
const { getQuotationParts } = require('./komatsuQuotationPartsService');
const { createAuditLog } = require('./komatsuOrderAuditService');

const COOKIE_FILE_PATH = path.join(__dirname, '../../data/pdx_cookies.txt');
const CONVERTED_SO_MAP_PATH = path.join(__dirname, '../../data/converted_so_quotations.json');

let isSyncRunning = false;

/**
 * Checks whether PDX cookie exists in file or env
 */
function checkCookieHealth() {
  let cookieContent = '';
  if (process.env.PDX_COOKIES) {
    cookieContent = process.env.PDX_COOKIES;
  } else if (fs.existsSync(COOKIE_FILE_PATH)) {
    try {
      cookieContent = fs.readFileSync(COOKIE_FILE_PATH, 'utf8').trim();
    } catch {
      cookieContent = '';
    }
  }

  const hasCookie = Boolean(cookieContent && cookieContent.length > 10);
  const hasAspNetAuth = Boolean(cookieContent && cookieContent.includes('.AspNet.Cookies'));
  const isValid = Boolean(hasCookie && hasAspNetAuth);

  return {
    valid: isValid,
    hasCookie,
    hasAspNetAuth,
    cookieLength: cookieContent.length,
    source: process.env.PDX_COOKIES ? 'env' : 'data/pdx_cookies.txt',
  };
}

/**
 * Computes delivery due date based on channel and order date
 */
function computeDeliveryDueDate(orderDate, channel) {
  const baseDate = orderDate ? new Date(orderDate) : new Date();
  const dueDate = new Date(baseDate);

  switch (channel) {
    case 'DAILY_STOCK':
      dueDate.setDate(dueDate.getDate() + 10);
      break;
    case 'STOCK_ORDER':
      dueDate.setDate(dueDate.getDate() + 120);
      break;
    case 'EMERGENCY_ORDER':
    default:
      dueDate.setDate(dueDate.getDate() + 30);
      break;
  }

  return dueDate;
}

/**
 * Resolves channel enum from order/ref text
 */
function resolveChannel(dbOrderNo = '', remarks = '') {
  const combined = `${dbOrderNo} ${remarks}`.toUpperCase();
  if (combined.includes('DS') || combined.includes('DAILY')) {
    return 'DAILY_STOCK';
  }
  if (combined.includes('SO') || combined.includes('STOCK ORDER')) {
    return 'STOCK_ORDER';
  }
  return 'EMERGENCY_ORDER';
}

/**
 * Format Date as DD/MM/YYYY for PDX portal search
 */
function formatPdxDate(d) {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Creates notification for operators when PDX authentication expires
 */
async function notifyAuthExpired(prisma, message) {
  try {
    const adminUsers = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        roles: {
          some: {
            role: {
              code: { in: ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'OPERATIONS_MANAGER'] },
            },
          },
        },
      },
      select: { id: true },
    });

    for (const u of adminUsers) {
      await prisma.notification.create({
        data: {
          userId: u.id,
          type: 'KOMATSU_SYNC_ALERT',
          severity: 'warning',
          title: 'Komatsu PDX Session Expired',
          message: message || 'Komatsu PDX authentication cookie expired. Please update data/pdx_cookies.txt.',
          href: '/admin/komatsu-sync',
        },
      });
    }
  } catch (err) {
    console.warn('[komatsuSyncService] Failed to notify admin users:', err.message);
  }
}

/**
 * Core delta synchronization runner
 */
async function runSync({
  triggerType = 'SCHEDULED_CRON',
  triggeredById = null,
  triggeredByName = null,
  daysBack = 14,
  customCookie = null,
} = {}) {
  if (isSyncRunning) {
    throw new Error('A Komatsu synchronization job is currently in progress. Please wait.');
  }

  const prisma = getPrisma();
  if (!prisma) {
    throw new Error('Database connection is not available');
  }

  isSyncRunning = true;

  // 1. Create sync job record
  const syncJob = await prisma.komatsuSyncJob.create({
    data: {
      triggerType,
      status: 'SUCCESS',
      startedAt: new Date(),
      triggeredById,
      triggeredByName: triggeredByName || (triggerType === 'SCHEDULED_CRON' ? 'System Scheduler' : 'Operator'),
    },
  });

  let ordersFound = 0;
  let ordersInserted = 0;
  let ordersUpdated = 0;
  let syncError = null;

  try {
    // 2. Cookie Health Check
    const cookieHealth = checkCookieHealth();
    if (!cookieHealth.valid && !customCookie) {
      const authMsg = 'Komatsu PDX session cookie missing or expired in data/pdx_cookies.txt';
      await prisma.komatsuSyncJob.update({
        where: { id: syncJob.id },
        data: {
          status: 'AUTH_EXPIRED',
          errorMessage: authMsg,
          completedAt: new Date(),
        },
      });
      await notifyAuthExpired(prisma, authMsg);
      return {
        jobId: syncJob.id,
        status: 'AUTH_EXPIRED',
        message: authMsg,
        ordersFound: 0,
        ordersInserted: 0,
        ordersUpdated: 0,
      };
    }

    // 3. Prepare Date Range for 14-day scanning window
    const now = new Date();
    const from = new Date();
    from.setDate(now.getDate() - (daysBack || 14));

    const fromDateStr = formatPdxDate(from);
    const toDateStr = formatPdxDate(now);

    const fetchedQuotations = [];

    // Query status = '2' (Confirmed Orders / SO) and status = '1' (Open / Quoted)
    for (const st of ['2', '1']) {
      try {
        const searchRes = await searchQuotations(
          {
            status: st,
            fromDate: fromDateStr,
            toDate: toDateStr,
            limit: '100',
          },
          customCookie,
        );

        if (Array.isArray(searchRes.quotations)) {
          for (const q of searchRes.quotations) {
            fetchedQuotations.push(q);
          }
        }
      } catch (searchErr) {
        if (
          searchErr.message &&
          (searchErr.message.includes('No PDX session cookie') ||
            searchErr.message.includes('expired') ||
            searchErr.message.includes('non-JSON'))
        ) {
          const authMsg = `PDX Session expired during search: ${searchErr.message}`;
          await prisma.komatsuSyncJob.update({
            where: { id: syncJob.id },
            data: {
              status: 'AUTH_EXPIRED',
              errorMessage: authMsg,
              completedAt: new Date(),
            },
          });
          await notifyAuthExpired(prisma, authMsg);
          return {
            jobId: syncJob.id,
            status: 'AUTH_EXPIRED',
            message: authMsg,
            ordersFound: 0,
            ordersInserted: 0,
            ordersUpdated: 0,
          };
        }
        console.warn(`[komatsuSyncService] Non-fatal search warning for status ${st}:`, searchErr.message);
      }
    }

    ordersFound = fetchedQuotations.length;

    // 4. Ingest and deduplicate each order
    for (const q of fetchedQuotations) {
      const qtnNo = String(q.quotation_no || '').trim();
      const rawSoNo = String(q.sales_order_no || '').trim();
      const soNo = rawSoNo && rawSoNo !== '-' && rawSoNo !== 'None' ? rawSoNo : null;
      const dbRef = String(q.db_order_no || '').trim() || null;
      const channel = resolveChannel(dbRef, q.status);
      let orderDate = new Date();
      if (q.order_date) {
        const parts = String(q.order_date).split(/[\/\-]/);
        if (parts.length === 3) {
          const d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
          if (!isNaN(d.getTime())) orderDate = d;
        }
      } else if (q.converted_at) {
        const d = new Date(q.converted_at);
        if (!isNaN(d.getTime())) orderDate = d;
      }
      const deliveryDueDate = computeDeliveryDueDate(orderDate, channel);

      // Try finding existing order
      let existingOrder = null;
      if (soNo) {
        existingOrder = await prisma.komatsuOrder.findUnique({
          where: { komatsuSalesOrderNo: soNo },
        });
      }
      if (!existingOrder && qtnNo) {
        existingOrder = await prisma.komatsuOrder.findFirst({
          where: { komatsuQuotationNo: qtnNo },
        });
      }

      if (!existingOrder) {
        // Fetch line items for new order
        let lineItems = [];
        try {
          const partsRes = await getQuotationParts(qtnNo, q.revision_no || '00', customCookie);
          if (partsRes && Array.isArray(partsRes.parts)) {
            lineItems = partsRes.parts.map((p, idx) => ({
              lineNumber: idx + 1,
              partNumber: String(p.part_no || p.part_number || '').trim(),
              description: p.description || null,
              quantity: parseInt(p.quantity, 10) || 1,
              unitPriceUSD: parseFloat(p.unit_price) || 0,
              lineTotalUSD: parseFloat(p.total_price) || (parseInt(p.quantity, 10) || 1) * (parseFloat(p.unit_price) || 0),
              suggestedWarehouse: '003',
              suggestedTaxCode: 'P0',
              rawMetadata: p,
            }));
          }
        } catch (partsErr) {
          console.warn(`[komatsuSyncService] Line items fetch warning for ${qtnNo}:`, partsErr.message);
        }

        // Create new KomatsuOrder
        const newOrder = await prisma.komatsuOrder.create({
          data: {
            komatsuSalesOrderNo: soNo,
            komatsuQuotationNo: qtnNo,
            distributorRefNo: dbRef,
            channel,
            orderDate,
            deliveryDueDate,
            currency: 'USD',
            vendorCode: 'V000006',
            customerCode: q.customer_code || null,
            customerName: q.customer_name || null,
            comments: q.person_in_charge ? `In charge: ${q.person_in_charge}` : null,
            tags: [channel, `KOMATSU_PORTAL`],
            sapStatus: 'PENDING_SAP_PULL',
            syncJobId: syncJob.id,
            rawPayload: q,
            items: {
              create: lineItems,
            },
          },
        });

        // Audit Log
        await createAuditLog({
          orderId: newOrder.id,
          action: 'SYNC_CREATED',
          actorType: triggerType === 'SCHEDULED_CRON' ? 'SYSTEM_CRON' : 'USER',
          actorId: triggeredById,
          actorName: triggeredByName,
          newValues: {
            komatsuSalesOrderNo: soNo,
            komatsuQuotationNo: qtnNo,
            distributorRefNo: dbRef,
            channel,
            sapStatus: 'PENDING_SAP_PULL',
            itemsCount: lineItems.length,
          },
          prismaClient: prisma,
        });

        ordersInserted++;
      } else {
        // Delta update if sales order number was assigned or status changed
        const updates = {};
        const oldValues = {};
        const newValues = {};

        if (soNo && existingOrder.komatsuSalesOrderNo !== soNo) {
          updates.komatsuSalesOrderNo = soNo;
          oldValues.komatsuSalesOrderNo = existingOrder.komatsuSalesOrderNo;
          newValues.komatsuSalesOrderNo = soNo;
        }

        if (dbRef && existingOrder.distributorRefNo !== dbRef) {
          updates.distributorRefNo = dbRef;
          oldValues.distributorRefNo = existingOrder.distributorRefNo;
          newValues.distributorRefNo = dbRef;
        }

        if (Object.keys(updates).length > 0) {
          await prisma.komatsuOrder.update({
            where: { id: existingOrder.id },
            data: updates,
          });

          await createAuditLog({
            orderId: existingOrder.id,
            action: 'SYNC_UPDATED',
            actorType: triggerType === 'SCHEDULED_CRON' ? 'SYSTEM_CRON' : 'USER',
            actorId: triggeredById,
            actorName: triggeredByName,
            oldValues,
            newValues,
            prismaClient: prisma,
          });

          ordersUpdated++;
        }
      }
    }

    // 5. Ingest any legacy items from converted_so_quotations.json if not present
    if (fs.existsSync(CONVERTED_SO_MAP_PATH)) {
      try {
        const rawMap = JSON.parse(fs.readFileSync(CONVERTED_SO_MAP_PATH, 'utf8'));
        for (const [mapKey, item] of Object.entries(rawMap)) {
          const qtn = item.quotation_no || mapKey;
          const exists = await prisma.komatsuOrder.findFirst({
            where: {
              OR: [
                { komatsuQuotationNo: qtn },
                { distributorRefNo: item.db_order_no || undefined },
              ],
            },
          });

          if (!exists) {
            const channel = resolveChannel(item.db_order_no);
            const created = await prisma.komatsuOrder.create({
              data: {
                komatsuSalesOrderNo: item.sales_order_no !== 'Converted' ? item.sales_order_no : `SO-${qtn}`,
                komatsuQuotationNo: qtn,
                distributorRefNo: item.db_order_no || null,
                channel,
                orderDate: item.converted_at ? new Date(item.converted_at) : new Date(),
                deliveryDueDate: computeDeliveryDueDate(item.converted_at ? new Date(item.converted_at) : new Date(), channel),
                currency: 'USD',
                vendorCode: 'V000006',
                tags: [channel, 'LEGACY_MIGRATED'],
                sapStatus: 'PENDING_SAP_PULL',
                syncJobId: syncJob.id,
                rawPayload: item,
              },
            });

            await createAuditLog({
              orderId: created.id,
              action: 'SYNC_CREATED',
              actorType: 'SYSTEM_CRON',
              actorName: 'Legacy Migration Ingest',
              newValues: item,
              prismaClient: prisma,
            });

            ordersInserted++;
          }
        }
      } catch (mapErr) {
        console.warn('[komatsuSyncService] Legacy map import notice:', mapErr.message);
      }
    }

    // 6. Complete Job Record
    await prisma.komatsuSyncJob.update({
      where: { id: syncJob.id },
      data: {
        status: 'SUCCESS',
        ordersFound,
        ordersInserted,
        ordersUpdated,
        completedAt: new Date(),
      },
    });

    return {
      jobId: syncJob.id,
      status: 'SUCCESS',
      ordersFound,
      ordersInserted,
      ordersUpdated,
    };
  } catch (err) {
    syncError = err.message;
    console.error('[komatsuSyncService] Sync failure:', err);

    await prisma.komatsuSyncJob.update({
      where: { id: syncJob.id },
      data: {
        status: 'FAILED',
        errorMessage: syncError,
        ordersFound,
        ordersInserted,
        ordersUpdated,
        completedAt: new Date(),
      },
    });

    throw err;
  } finally {
    isSyncRunning = false;
  }
}

/**
 * Returns latest sync status and health indicators
 */
async function getSyncStatus() {
  const prisma = getPrisma();
  const cookieHealth = checkCookieHealth();

  let latestJob = null;
  if (prisma) {
    latestJob = await prisma.komatsuSyncJob.findFirst({
      orderBy: { startedAt: 'desc' },
    });
  }

  const isAuthExpired = latestJob?.status === 'AUTH_EXPIRED' || !cookieHealth.valid;

  return {
    isSyncRunning,
    cookieHealth,
    alertBanner: isAuthExpired
      ? {
          active: true,
          severity: 'warning',
          message: 'Komatsu PDX session cookie has expired or is missing. Automatic synchronization is paused.',
        }
      : {
          active: false,
        },
    latestJob,
  };
}

module.exports = {
  runSync,
  getSyncStatus,
  checkCookieHealth,
  computeDeliveryDueDate,
  resolveChannel,
};
