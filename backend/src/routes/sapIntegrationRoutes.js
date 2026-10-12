const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { requireM2mAuth } = require('../middleware/m2mAuthMiddleware');
const sapIntegrationController = require('../controllers/sapIntegrationController');

const router = Router();

// Dedicated M2M Rate Limiter (60 requests per minute per Token / IP)
const m2mRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const auth = req.headers['authorization'] || '';
    if (auth.startsWith('Bearer ')) {
      return auth.substring(7, 30);
    }
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) return forwarded.split(',')[0].trim();
    return req.ip || req.socket?.remoteAddress || '127.0.0.1';
  },
  validate: { keyGeneratorIpFallback: false },
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many integration requests. Allowed rate is 60 requests per minute.',
  },
});

router.use(m2mRateLimiter);

// 1. Health check
router.get('/health', requireM2mAuth('sap:read'), sapIntegrationController.getHealth);

// 2. Pending orders query (auto-mark pulled)
router.get('/orders/pending', requireM2mAuth('sap:read'), sapIntegrationController.getPendingOrders);

// 3. Single order inspection
router.get('/orders/:id', requireM2mAuth('sap:read'), sapIntegrationController.getOrderById);

// 4. Acknowledge SAP PO creation
router.post('/orders/:id/acknowledge', requireM2mAuth('sap:write'), sapIntegrationController.acknowledgeOrder);

// 5. Report SAP PO creation failure
router.post('/orders/:id/fail', requireM2mAuth('sap:write'), sapIntegrationController.reportOrderFailure);

module.exports = router;
