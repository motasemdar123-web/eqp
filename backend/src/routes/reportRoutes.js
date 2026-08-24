const { Router } = require('express');
const reportController = require('../controllers/reportController');
const commentController = require('../controllers/commentController');
const { asyncHandler } = require('../utils/asyncHandler');
const { requireAuth, requireEqpAccess } = require('../middleware/authMiddleware');
const { reportGenerationRateLimit } = require('../middleware/securityMiddleware');

const router = Router();

router.get('/reports', requireAuth, requireEqpAccess, asyncHandler(reportController.listReports));
router.get('/report-profile', requireAuth, requireEqpAccess, asyncHandler(reportController.getReportProfile));
router.put('/reports/:id', requireAuth, requireEqpAccess, asyncHandler(reportController.renameReport));
router.delete('/reports/:id', requireAuth, requireEqpAccess, asyncHandler(reportController.deleteReport));
router.post('/generate-reports', requireAuth, requireEqpAccess, reportGenerationRateLimit, asyncHandler(reportController.generateReports));

router.get('/comments', requireAuth, requireEqpAccess, asyncHandler(commentController.listComments));
router.get('/comments/:id', requireAuth, requireEqpAccess, asyncHandler(commentController.getCommentById));
router.post('/comments', requireAuth, requireEqpAccess, asyncHandler(commentController.createComment));
router.put('/comments/:id', requireAuth, requireEqpAccess, asyncHandler(commentController.updateComment));
router.delete('/comments/:id', requireAuth, requireEqpAccess, asyncHandler(commentController.deleteComment));

module.exports = router;
