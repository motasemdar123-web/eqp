const { Router } = require('express');
const machineController = require('../controllers/machineController');
const reportController = require('../controllers/reportController');
const analyticsController = require('../controllers/analyticsController');
const { asyncHandler } = require('../utils/asyncHandler');
const { requireAuth, requireEqpAccess } = require('../middleware/authMiddleware');
const { reportGenerationRateLimit } = require('../middleware/securityMiddleware');

const router = Router();

router.get('/api/eqp/machines', requireAuth, requireEqpAccess, asyncHandler(machineController.listMachines));
router.get('/api/eqp/machine-history', requireAuth, requireEqpAccess, asyncHandler(machineController.listMachineHistory));
router.get('/api/eqp/reports', requireAuth, requireEqpAccess, asyncHandler(reportController.listReports));
router.put('/api/eqp/reports/:id', requireAuth, requireEqpAccess, asyncHandler(reportController.renameReport));
router.delete('/api/eqp/reports/:id', requireAuth, requireEqpAccess, asyncHandler(reportController.deleteReport));
router.post('/api/eqp/generate-reports', requireAuth, requireEqpAccess, reportGenerationRateLimit, asyncHandler(reportController.generateReports));
router.get('/api/eqp/analytics/overview', requireAuth, requireEqpAccess, asyncHandler(analyticsController.overview));

module.exports = router;
