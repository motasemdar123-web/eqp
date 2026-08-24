const { Router } = require('express');
const machineController = require('../controllers/machineController');
const reportController = require('../controllers/reportController');
const commentController = require('../controllers/commentController');
const analyticsController = require('../controllers/analyticsController');
const platformController = require('../controllers/platformController');
const { asyncHandler } = require('../utils/asyncHandler');
const { requireAuth, requireEqpAccess } = require('../middleware/authMiddleware');
const { reportGenerationRateLimit } = require('../middleware/securityMiddleware');

const router = Router();

router.get('/api/eqp/machines', requireAuth, requireEqpAccess, asyncHandler(machineController.listMachines));
router.get('/api/eqp/machine-history', requireAuth, requireEqpAccess, asyncHandler(machineController.listMachineHistory));
router.get('/api/eqp/reports', requireAuth, requireEqpAccess, asyncHandler(reportController.listReports));
router.get('/api/eqp/report-profile', requireAuth, requireEqpAccess, asyncHandler(reportController.getReportProfile));
router.put('/api/eqp/reports/:id', requireAuth, requireEqpAccess, asyncHandler(reportController.renameReport));
router.delete('/api/eqp/reports/:id', requireAuth, requireEqpAccess, asyncHandler(reportController.deleteReport));
router.post('/api/eqp/generate-reports', requireAuth, requireEqpAccess, reportGenerationRateLimit, asyncHandler(reportController.generateReports));
router.get('/api/eqp/analytics/overview', requireAuth, requireEqpAccess, asyncHandler(analyticsController.overview));

// EQP Report Comments Endpoints
router.get('/api/eqp/comments', requireAuth, requireEqpAccess, asyncHandler(commentController.listComments));
router.get('/api/eqp/comments/:id', requireAuth, requireEqpAccess, asyncHandler(commentController.getCommentById));
router.post('/api/eqp/comments', requireAuth, requireEqpAccess, asyncHandler(commentController.createComment));
router.put('/api/eqp/comments/:id', requireAuth, requireEqpAccess, asyncHandler(commentController.updateComment));
router.delete('/api/eqp/comments/:id', requireAuth, requireEqpAccess, asyncHandler(commentController.deleteComment));

// EQP Care Direct Endpoints
router.get('/api/eqp/care/status', requireAuth, requireEqpAccess, asyncHandler(platformController.getEqpcStatus));
router.post('/api/eqp/care/cookie', requireAuth, requireEqpAccess, asyncHandler(platformController.saveEqpcCookie));
router.get('/api/eqp/care/event-codes', requireAuth, requireEqpAccess, asyncHandler(platformController.getEqpcEventCodes));
router.get('/api/eqp/care/machine-lookup', requireAuth, requireEqpAccess, asyncHandler(platformController.lookupEqpcMachine));
router.post('/api/eqp/care/upload', requireAuth, requireEqpAccess, asyncHandler(platformController.uploadEqpcReport));
router.post('/api/eqp/care/batch-upload', requireAuth, requireEqpAccess, asyncHandler(platformController.batchUploadEqpcReports));

module.exports = router;

