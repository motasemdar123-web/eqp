const { Router } = require('express');
const analyticsController = require('../controllers/analyticsController');
const { asyncHandler } = require('../utils/asyncHandler');
const { requireAuth, requireEqpAccess } = require('../middleware/authMiddleware');

const router = Router();

router.get('/analytics/overview', requireAuth, requireEqpAccess, asyncHandler(analyticsController.overview));

module.exports = router;
