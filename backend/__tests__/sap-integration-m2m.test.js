const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const request = require('supertest');
const { createApp } = require('../src/app');
const { getPrisma } = require('../src/config/prisma');
const { createApiKey, hashApiKey, validateApiKey } = require('../src/services/apiKeyService');
const { computeDeliveryDueDate, resolveChannel } = require('../src/services/komatsuSyncService');

jest.setTimeout(30000);

describe('SAP B1 M2M Integration API Suite', () => {
  let app;
  let prisma;
  let testApiKey;
  let readOnlyKey;
  let testOrder;

  beforeAll(async () => {
    app = createApp();
    prisma = getPrisma();

    // 1. Create a full-access test API key
    testApiKey = await createApiKey({
      name: 'Automated Test ABS Key',
      scopes: ['sap:read', 'sap:write'],
      allowedIps: [],
      role: 'SAP_INTEGRATION_SERVICE',
    });

    // 2. Create a read-only test API key
    readOnlyKey = await createApiKey({
      name: 'Automated Test Read-Only Key',
      scopes: ['sap:read'],
      allowedIps: [],
      role: 'SAP_INTEGRATION_SERVICE',
    });

    // 3. Create a test Komatsu order in database
    testOrder = await prisma.komatsuOrder.create({
      data: {
        komatsuSalesOrderNo: `TEST-SO-${Date.now()}`,
        komatsuQuotationNo: `TEST-QTN-${Date.now()}`,
        distributorRefNo: 'R999/2026',
        channel: 'EMERGENCY_ORDER',
        orderDate: new Date('2026-10-12T07:00:00Z'),
        deliveryDueDate: new Date('2026-11-11T07:00:00Z'),
        currency: 'USD',
        vendorCode: 'V000006',
        customerCode: '536K',
        customerName: 'DAR AL HAI',
        equipmentSerial: 'TEST-12345',
        equipmentModel: 'PC500LC-10R',
        sapStatus: 'PENDING_SAP_PULL',
        tags: ['EMERGENCY_ORDER', 'TEST_HARNESS'],
        items: {
          create: [
            {
              lineNumber: 1,
              partNumber: '6742-01-5280',
              description: 'GASKET, CYLINDER HEAD',
              quantity: 2,
              unitPriceUSD: 45.5,
              lineTotalUSD: 91.0,
              suggestedWarehouse: '003',
              suggestedTaxCode: 'P0',
            },
            {
              lineNumber: 2,
              partNumber: '07000-12015',
              description: 'O-RING',
              quantity: 5,
              unitPriceUSD: 3.2,
              lineTotalUSD: 16.0,
              suggestedWarehouse: '003',
              suggestedTaxCode: 'P0',
            },
          ],
        },
      },
    });
  });

  afterAll(async () => {
    // Cleanup created test records
    if (prisma && testOrder) {
      await prisma.komatsuOrder.deleteMany({
        where: { id: testOrder.id },
      });
    }
    if (prisma && testApiKey) {
      await prisma.apiKey.deleteMany({
        where: { id: { in: [testApiKey.id, readOnlyKey.id] } },
      });
    }
  });

  describe('1. API Key Service & Cryptography', () => {
    it('computes correct SHA-256 hash for keys', () => {
      const hash1 = hashApiKey('eqp_live_testkey123');
      const hash2 = hashApiKey('eqp_live_testkey123');
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });

    it('validates active key successfully', async () => {
      const validation = await validateApiKey(testApiKey.rawKey, {
        requiredScope: 'sap:read',
      });
      expect(validation.valid).toBe(true);
      expect(validation.apiKey.id).toBe(testApiKey.id);
    });

    it('rejects tampered or unregistered API keys', async () => {
      const validation = await validateApiKey('eqp_live_invalid_secret_key');
      expect(validation.valid).toBe(false);
      expect(validation.error).toBe('Invalid API key');
    });

    it('enforces required scopes on validation', async () => {
      const writeValidation = await validateApiKey(readOnlyKey.rawKey, {
        requiredScope: 'sap:write',
      });
      expect(writeValidation.valid).toBe(false);
      expect(writeValidation.error).toContain('Missing required scope: sap:write');
    });

    it('enforces IP whitelisting when configured', async () => {
      const ipRestrictedKey = await createApiKey({
        name: 'IP Restricted Key',
        scopes: ['sap:read'],
        allowedIps: ['192.168.1.100'],
      });

      const blockedValidation = await validateApiKey(ipRestrictedKey.rawKey, {
        clientIp: '10.0.0.1',
      });
      expect(blockedValidation.valid).toBe(false);
      expect(blockedValidation.error).toContain('not in allowed IP whitelist');

      const allowedValidation = await validateApiKey(ipRestrictedKey.rawKey, {
        clientIp: '192.168.1.100',
      });
      expect(allowedValidation.valid).toBe(true);

      // Verify IPv4-mapped IPv6 address matches cleanly
      const ipv6MappedValidation = await validateApiKey(ipRestrictedKey.rawKey, {
        clientIp: '::ffff:192.168.1.100',
      });
      expect(ipv6MappedValidation.valid).toBe(true);

      await prisma.apiKey.delete({ where: { id: ipRestrictedKey.id } });
    });
  });

  describe('2. Business Rules & SLA Calculation', () => {
    it('calculates +30 days for EMERGENCY_ORDER', () => {
      const base = new Date('2026-10-01T00:00:00Z');
      const due = computeDeliveryDueDate(base, 'EMERGENCY_ORDER');
      const diffDays = Math.round((due - base) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(30);
    });

    it('calculates +10 days for DAILY_STOCK', () => {
      const base = new Date('2026-10-01T00:00:00Z');
      const due = computeDeliveryDueDate(base, 'DAILY_STOCK');
      const diffDays = Math.round((due - base) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(10);
    });

    it('calculates +120 days for STOCK_ORDER', () => {
      const base = new Date('2026-10-01T00:00:00Z');
      const due = computeDeliveryDueDate(base, 'STOCK_ORDER');
      const diffDays = Math.round((due - base) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(120);
    });

    it('correctly resolves channel enum from order codes', () => {
      expect(resolveChannel('EO-12345')).toBe('EMERGENCY_ORDER');
      expect(resolveChannel('DS-987')).toBe('DAILY_STOCK');
      expect(resolveChannel('SO-555')).toBe('STOCK_ORDER');
      expect(resolveChannel('R197/2026', 'Emergency Part')).toBe('EMERGENCY_ORDER');
    });
  });

  describe('3. M2M Security Middleware & Authentication Enforcement', () => {
    it('blocks request without Authorization header', async () => {
      const res = await request(app).get('/api/v1/integration/sap/health');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('UNAUTHORIZED');
    });

    it('blocks request with invalid bearer token', async () => {
      const res = await request(app)
        .get('/api/v1/integration/sap/health')
        .set('Authorization', 'Bearer invalid_secret_token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('allows valid API Key on GET /health', async () => {
      const res = await request(app)
        .get('/api/v1/integration/sap/health')
        .set('Authorization', `Bearer ${testApiKey.rawKey}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.service).toContain('SAP B1 M2M Integration API');
      expect(res.body.status).toBe('HEALTHY');
      expect(res.body.authenticatedKey.role).toBe('SAP_INTEGRATION_SERVICE');
    });
  });

  describe('4. Order Lifecycle & Integration Endpoints', () => {
    it('GET /orders/pending retrieves pending order and transitions it to PULLED_BY_SAP', async () => {
      const res = await request(app)
        .get('/api/v1/integration/sap/orders/pending')
        .set('Authorization', `Bearer ${testApiKey.rawKey}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.orders)).toBe(true);

      const found = res.body.orders.find((o) => o.id === testOrder.id);
      expect(found).toBeDefined();
      expect(found.komatsuSalesOrderNo).toBe(testOrder.komatsuSalesOrderNo);
      expect(found.items).toHaveLength(2);
      expect(found.items[0].partNumber).toBe('6742-01-5280');
      expect(found.items[0].suggestedWarehouse).toBe('003');

      // Verify that database record transitioned to PULLED_BY_SAP
      const updated = await prisma.komatsuOrder.findUnique({
        where: { id: testOrder.id },
      });
      expect(updated.sapStatus).toBe('PULLED_BY_SAP');

      // Verify audit log was created
      const audit = await prisma.komatsuOrderAuditLog.findFirst({
        where: { orderId: testOrder.id, action: 'SAP_PULLED' },
      });
      expect(audit).toBeDefined();
      expect(audit.actorType).toBe('SAP_M2M_API');
    });

    it('GET /orders/:id retrieves order manifest by ID or SO number', async () => {
      const res = await request(app)
        .get(`/api/v1/integration/sap/orders/${testOrder.komatsuSalesOrderNo}`)
        .set('Authorization', `Bearer ${testApiKey.rawKey}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.order.id).toBe(testOrder.id);
      expect(res.body.order.items).toHaveLength(2);
    });

    it('POST /orders/:id/acknowledge rejects missing sapDocNum', async () => {
      const res = await request(app)
        .post(`/api/v1/integration/sap/orders/${testOrder.id}/acknowledge`)
        .set('Authorization', `Bearer ${testApiKey.rawKey}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('VALIDATION_ERROR');
    });

    it('POST /orders/:id/acknowledge successfully confirms SAP PO creation', async () => {
      const res = await request(app)
        .post(`/api/v1/integration/sap/orders/${testOrder.id}/acknowledge`)
        .set('Authorization', `Bearer ${testApiKey.rawKey}`)
        .send({
          sapDocNum: '300951',
          sapDocEntry: 1542,
          remarks: 'Created via ABS B1i Gateway',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.order.sapStatus).toBe('SAP_PO_CREATED');
      expect(res.body.order.sapDocNum).toBe('300951');
      expect(res.body.order.sapDocEntry).toBe(1542);

      // Verify audit log for acknowledgment
      const ackAudit = await prisma.komatsuOrderAuditLog.findFirst({
        where: { orderId: testOrder.id, action: 'SAP_ACKNOWLEDGED' },
      });
      expect(ackAudit).toBeDefined();
      expect(ackAudit.actorType).toBe('SAP_M2M_API');
      expect(ackAudit.newValues.sapDocNum).toBe('300951');
    });

    it('POST /orders/:id/acknowledge is idempotent when called again with the same sapDocNum', async () => {
      const logsBefore = await prisma.komatsuOrderAuditLog.count({
        where: { orderId: testOrder.id, action: 'SAP_ACKNOWLEDGED' },
      });

      const res = await request(app)
        .post(`/api/v1/integration/sap/orders/${testOrder.id}/acknowledge`)
        .set('Authorization', `Bearer ${testApiKey.rawKey}`)
        .send({
          sapDocNum: '300951',
          sapDocEntry: 1542,
          remarks: 'Duplicate retry call',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('idempotent');

      // Verify no duplicate audit log was created
      const logsAfter = await prisma.komatsuOrderAuditLog.count({
        where: { orderId: testOrder.id, action: 'SAP_ACKNOWLEDGED' },
      });
      expect(logsAfter).toBe(logsBefore);
    });

    it('POST /orders/:id/acknowledge rejects conflict when order is already confirmed with different DocNum', async () => {
      const res = await request(app)
        .post(`/api/v1/integration/sap/orders/${testOrder.id}/acknowledge`)
        .set('Authorization', `Bearer ${testApiKey.rawKey}`)
        .send({
          sapDocNum: '999999',
          sapDocEntry: 9999,
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('ALREADY_ACKNOWLEDGED');
      expect(res.body.message).toContain('already confirmed under SAP PO #300951');
    });

    it('POST /orders/:id/fail rejects reporting failure on an already confirmed SAP order (409)', async () => {
      const res = await request(app)
        .post(`/api/v1/integration/sap/orders/${testOrder.id}/fail`)
        .set('Authorization', `Bearer ${testApiKey.rawKey}`)
        .send({
          reason: 'Attempted failure on confirmed order',
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('ALREADY_CONFIRMED');
    });

    it('POST /orders/:id/fail flags an unconfirmed order with failure diagnostic', async () => {
      const failOrder = await prisma.komatsuOrder.create({
        data: {
          komatsuSalesOrderNo: `FAIL-SO-${Date.now()}`,
          komatsuQuotationNo: `FAIL-QTN-${Date.now()}`,
          sapStatus: 'PENDING_SAP_PULL',
        },
      });

      const res = await request(app)
        .post(`/api/v1/integration/sap/orders/${failOrder.id}/fail`)
        .set('Authorization', `Bearer ${testApiKey.rawKey}`)
        .send({
          reason: 'Item master code mismatch in SAP database',
          errorCode: '-5002',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.order.sapStatus).toBe('SAP_SYNC_FAILED');
      expect(res.body.order.sapFailureReason).toContain('Item master code mismatch');

      // Verify audit log for failure
      const failAudit = await prisma.komatsuOrderAuditLog.findFirst({
        where: { orderId: failOrder.id, action: 'SAP_FAILED' },
      });
      expect(failAudit).toBeDefined();

      await prisma.komatsuOrder.delete({ where: { id: failOrder.id } });
    });

    it('POST /orders/:id/acknowledge rejects modifying an EXCLUDED order', async () => {
      const excludedOrder = await prisma.komatsuOrder.create({
        data: {
          komatsuSalesOrderNo: `EXCL-SO-${Date.now()}`,
          sapStatus: 'EXCLUDED',
        },
      });

      const res = await request(app)
        .post(`/api/v1/integration/sap/orders/${excludedOrder.id}/acknowledge`)
        .set('Authorization', `Bearer ${testApiKey.rawKey}`)
        .send({ sapDocNum: '300999' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('ORDER_EXCLUDED');

      await prisma.komatsuOrder.delete({ where: { id: excludedOrder.id } });
    });

    it('POST /orders/:id/acknowledge resolves order by komatsuQuotationNo', async () => {
      const quoteOnlyOrder = await prisma.komatsuOrder.create({
        data: {
          komatsuQuotationNo: `QUOTE-REF-${Date.now()}`,
          sapStatus: 'PENDING_SAP_PULL',
        },
      });

      const res = await request(app)
        .post(`/api/v1/integration/sap/orders/${quoteOnlyOrder.komatsuQuotationNo}/acknowledge`)
        .set('Authorization', `Bearer ${testApiKey.rawKey}`)
        .send({ sapDocNum: '300777' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.order.sapStatus).toBe('SAP_PO_CREATED');
      expect(res.body.order.sapDocNum).toBe('300777');

      await prisma.komatsuOrder.delete({ where: { id: quoteOnlyOrder.id } });
    });

    it('GET /orders/pending?status=PULLED_BY_SAP filters by requested status', async () => {
      const res = await request(app)
        .get('/api/v1/integration/sap/orders/pending?status=PULLED_BY_SAP&autoMarkPulled=false')
        .set('Authorization', `Bearer ${testApiKey.rawKey}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.orders)).toBe(true);
    });

    it('enforces scope on write endpoints (read-only key is blocked)', async () => {
      const res = await request(app)
        .post(`/api/v1/integration/sap/orders/${testOrder.id}/acknowledge`)
        .set('Authorization', `Bearer ${readOnlyKey.rawKey}`)
        .send({ sapDocNum: '300999' });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('FORBIDDEN');
      expect(res.body.message).toContain('Missing required scope: sap:write');
    });
  });

  describe('5. Documentation & Swagger UI', () => {
    it('serves OpenAPI 3.0 specification at /api/docs/sap-integration/openapi.json', async () => {
      const res = await request(app).get('/api/docs/sap-integration/openapi.json');
      expect(res.status).toBe(200);
      expect(res.body.openapi).toBe('3.0.3');
      expect(res.body.info.title).toContain('SAP Business One M2M Integration API');
      expect(res.body.paths['/orders/pending']).toBeDefined();
    });

    it('serves interactive Swagger UI HTML at /api/docs/sap-integration', async () => {
      const res = await request(app).get('/api/docs/sap-integration');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Dar Al Hai EQP');
      expect(res.text).toContain('swagger-ui');
    });
  });
});
