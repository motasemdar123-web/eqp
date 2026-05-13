const { Router } = require('express');
const reportController = require('../controllers/reportController');
const { asyncHandler } = require('../utils/asyncHandler');
const { requireAuth } = require('../middleware/authMiddleware');
const { reportGenerationRateLimit } = require('../middleware/securityMiddleware');

const router = Router();

router.get('/reports', requireAuth, asyncHandler(reportController.listReports));
router.put('/reports/:id', requireAuth, asyncHandler(reportController.renameReport));
router.delete('/reports/:id', requireAuth, asyncHandler(reportController.deleteReport));
router.post('/generate-reports', requireAuth, reportGenerationRateLimit, asyncHandler(reportController.generateReports));

module.exports = router;
