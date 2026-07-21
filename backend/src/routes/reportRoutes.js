const { Router } = require('express');
const reportController = require('../controllers/reportController');
const { asyncHandler } = require('../utils/asyncHandler');
const { requireAuth, requireEqpAccess } = require('../middleware/authMiddleware');
const { reportGenerationRateLimit } = require('../middleware/securityMiddleware');

const router = Router();

router.get('/reports', requireAuth, requireEqpAccess, asyncHandler(reportController.listReports));
router.get('/report-profile', requireAuth, requireEqpAccess, asyncHandler(reportController.getReportProfile));
router.put('/reports/:id', requireAuth, requireEqpAccess, asyncHandler(reportController.renameReport));
router.delete('/reports/:id', requireAuth, requireEqpAccess, asyncHandler(reportController.deleteReport));
router.post('/generate-reports', requireAuth, requireEqpAccess, reportGenerationRateLimit, asyncHandler(reportController.generateReports));

module.exports = router;
