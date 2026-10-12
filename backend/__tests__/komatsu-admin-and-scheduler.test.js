const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const request = require('supertest');
const { createApp } = require('../src/app');
const { getPrisma } = require('../src/config/prisma');
const { getKuwaitTimeString, SCHEDULED_TIMES } = require('../src/services/cronSchedulerService');
const { checkCookieHealth } = require('../src/services/komatsuSyncService');

jest.setTimeout(30000);

describe('Komatsu Admin Management & Scheduler Suite', () => {
  let app;
  let prisma;
  let adminToken;
  let testOrder;

  beforeAll(async () => {
    app = createApp();
    prisma = getPrisma();

    // Create staff token recognized by internalApiAuthMiddleware
    const payload = Buffer.from(
      JSON.stringify({
        sub: 'admin-user-test',
        email: 'ops-admin@daralhai.com',
        fullName: 'Operations Manager',
        roles: ['SUPER_ADMIN'],
      })
    ).toString('base64url');
    adminToken = `test-header.${payload}.test-sig`;

    // Create a test Komatsu order
    testOrder = await prisma.komatsuOrder.create({
      data: {
        komatsuSalesOrderNo: `ADMIN-TEST-SO-${Date.now()}`,
        komatsuQuotationNo: `ADMIN-TEST-QTN-${Date.now()}`,
        distributorRefNo: 'R888/2026',
        channel: 'DAILY_STOCK',
        orderDate: new Date('2026-10-12T07:00:00Z'),
        deliveryDueDate: new Date('2026-10-22T07:00:00Z'),
        currency: 'USD',
        vendorCode: 'V000006',
        customerName: 'DAR AL HAI',
        sapStatus: 'SAP_SYNC_FAILED',
        sapFailureReason: 'Simulation test error',
        remarks: 'Initial remark',
        tags: ['DAILY_STOCK'],
      },
    });
  });

  afterAll(async () => {
    if (prisma && testOrder) {
      await prisma.komatsuOrder.deleteMany({
        where: { id: testOrder.id },
      });
    }
  });

  describe('1. Scheduler Kuwait Time Alignment', () => {
    it('computes correct Kuwait Time (UTC+3)', () => {
      // 04:00 UTC = 07:00 Kuwait
      const d1 = new Date(Date.UTC(2026, 9, 12, 4, 0, 0));
      expect(getKuwaitTimeString(d1)).toBe('07:00');

      // 08:00 UTC = 11:00 Kuwait
      const d2 = new Date(Date.UTC(2026, 9, 12, 8, 0, 0));
      expect(getKuwaitTimeString(d2)).toBe('11:00');

      // 11:00 UTC = 14:00 Kuwait
      const d3 = new Date(Date.UTC(2026, 9, 12, 11, 0, 0));
      expect(getKuwaitTimeString(d3)).toBe('14:00');

      // 15:00 UTC = 18:00 Kuwait
      const d4 = new Date(Date.UTC(2026, 9, 12, 15, 0, 0));
      expect(getKuwaitTimeString(d4)).toBe('18:00');
    });

    it('contains all 4 daily scheduled slots', () => {
      expect(SCHEDULED_TIMES.has('07:00')).toBe(true);
      expect(SCHEDULED_TIMES.has('11:00')).toBe(true);
      expect(SCHEDULED_TIMES.has('14:00')).toBe(true);
      expect(SCHEDULED_TIMES.has('18:00')).toBe(true);
      expect(SCHEDULED_TIMES.size).toBe(4);
    });

    it('checks cookie health without crashing', () => {
      const health = checkCookieHealth();
      expect(health).toBeDefined();
      expect(typeof health.valid).toBe('boolean');
      expect(typeof health.cookieLength).toBe('number');
      expect(health.source).toBeDefined();
    });
  });

  describe('2. Admin API Authentication Protection', () => {
    it('blocks access to /api/admin/komatsu-orders without internal staff token', async () => {
      const res = await request(app).get('/api/admin/komatsu-orders');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('allows access with internal staff token', async () => {
      const res = await request(app)
        .get('/api/admin/komatsu-orders')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.orders)).toBe(true);
      expect(res.body.statusSummary).toBeDefined();
    });
  });

  describe('3. Order Editing & Manual Retry Queue', () => {
    it('allows updating remarks and custom tags', async () => {
      const res = await request(app)
        .patch(`/api/admin/komatsu-orders/${testOrder.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          remarks: 'Updated remark by Operations',
          tags: ['DAILY_STOCK', 'VERIFIED_BY_ADMIN'],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.order.remarks).toBe('Updated remark by Operations');
      expect(res.body.order.tags).toContain('VERIFIED_BY_ADMIN');

      // Verify audit log
      const audit = await prisma.komatsuOrderAuditLog.findFirst({
        where: { orderId: testOrder.id, action: 'MANUAL_EDIT' },
      });
      expect(audit).toBeDefined();
      expect(audit.actorType).toBe('USER');
    });

    it('allows queuing manual retry for failed SAP order', async () => {
      const res = await request(app)
        .patch(`/api/admin/komatsu-orders/${testOrder.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          retrySapStatus: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.order.sapStatus).toBe('PENDING_SAP_PULL');
      expect(res.body.order.sapFailureReason).toBeNull();

      // Verify RETRY_QUEUED audit entry
      const audit = await prisma.komatsuOrderAuditLog.findFirst({
        where: { orderId: testOrder.id, action: 'RETRY_QUEUED' },
      });
      expect(audit).toBeDefined();
    });

    it('strictly rejects any attempts to edit immutable OEM line items or quantities', async () => {
      const res = await request(app)
        .patch(`/api/admin/komatsu-orders/${testOrder.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items: [{ partNumber: 'HACKED-PART', quantity: 999 }],
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('IMMUTABLE_FIELD');
      expect(res.body.message).toContain('immutable and cannot be modified');
    });

    it('blocks retrySapStatus on orders that already have a confirmed SAP Purchase Order', async () => {
      const confirmedOrder = await prisma.komatsuOrder.create({
        data: {
          komatsuSalesOrderNo: `CONFIRMED-${Date.now()}`,
          sapStatus: 'SAP_PO_CREATED',
          sapDocNum: '300999',
        },
      });

      const res = await request(app)
        .patch(`/api/admin/komatsu-orders/${confirmedOrder.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          retrySapStatus: true,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('CANNOT_RETRY_CONFIRMED_ORDER');
      expect(res.body.message).toContain('SAP Purchase Order #300999 has already been created');

      await prisma.komatsuOrder.delete({ where: { id: confirmedOrder.id } });
    });

    it('retrieves chronological audit log via GET /api/admin/komatsu-orders/:id/audit-log', async () => {
      const res = await request(app)
        .get(`/api/admin/komatsu-orders/${testOrder.id}/audit-log`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBeGreaterThan(0);
      expect(Array.isArray(res.body.auditLogs)).toBe(true);
    });
  });

  describe('4. Admin Sync Jobs & API Key Management', () => {
    it('GET /api/admin/komatsu-orders/sync-jobs returns job history and cookie status', async () => {
      const res = await request(app)
        .get('/api/admin/komatsu-orders/sync-jobs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.cookieHealth).toBeDefined();
      expect(res.body.alertBanner).toBeDefined();
      expect(Array.isArray(res.body.jobs)).toBe(true);
    });

    it('POST /api/admin/api-keys generates new M2M key and GET lists it', async () => {
      const createRes = await request(app)
        .post('/api/admin/api-keys')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Rand ABS Integration Key Admin Test',
          scopes: ['sap:read', 'sap:write'],
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.success).toBe(true);
      expect(createRes.body.apiKey.rawKey).toBeDefined();
      expect(createRes.body.apiKey.rawKey.startsWith('eqp_live_')).toBe(true);

      const keyId = createRes.body.apiKey.id;

      // List keys
      const listRes = await request(app)
        .get('/api/admin/api-keys')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.success).toBe(true);
      const found = listRes.body.keys.find((k) => k.id === keyId);
      expect(found).toBeDefined();
      expect(found.name).toBe('Rand ABS Integration Key Admin Test');

      // Cleanup
      await prisma.apiKey.delete({ where: { id: keyId } });
    });
  });
});
