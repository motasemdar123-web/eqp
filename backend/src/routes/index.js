const { Router } = require('express');

const healthRoutes = require('./healthRoutes');
const userRoutes = require('./userRoutes');
const machineRoutes = require('./machineRoutes');
const reportRoutes = require('./reportRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const platformRoutes = require('./platformRoutes');
const eqpModuleRoutes = require('./eqpModuleRoutes');
const { requireInternalApiAuth } = require('../middleware/internalApiAuthMiddleware');

const router = Router();

router.use(requireInternalApiAuth);
router.use(healthRoutes);
router.use(userRoutes);
router.use(machineRoutes);
router.use(reportRoutes);
router.use(analyticsRoutes);
router.use(platformRoutes);
router.use(eqpModuleRoutes);

module.exports = router;
