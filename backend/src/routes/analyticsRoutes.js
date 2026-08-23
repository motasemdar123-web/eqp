const { Router } = require('express');
const analyticsController = require('../controllers/analyticsController');
const { asyncHandler } = require('../utils/asyncHandler');
const { requireAuth } = require('../middleware/authMiddleware');

const router = Router();

router.get('/analytics/overview', requireAuth, asyncHandler(analyticsController.overview));
router.get('/analytics/fleet-summary', requireAuth, asyncHandler(analyticsController.fleetSummary));
router.get('/analytics/greasing', requireAuth, asyncHandler(analyticsController.greasing));
router.get('/analytics/component-rotations', requireAuth, asyncHandler(analyticsController.componentRotations));
router.get('/analytics/wear-lifespan', requireAuth, asyncHandler(analyticsController.wearLifespan));
router.get('/analytics/ripper-teeth', requireAuth, asyncHandler(analyticsController.ripperTeeth));
router.get('/analytics/cylinders', requireAuth, asyncHandler(analyticsController.cylinders));
router.get('/analytics/workshop', requireAuth, asyncHandler(analyticsController.workshop));
router.get('/analytics/governance', requireAuth, asyncHandler(analyticsController.governance));

module.exports = router;



