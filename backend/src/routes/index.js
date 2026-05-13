const { Router } = require('express');

const healthRoutes = require('./healthRoutes');
const userRoutes = require('./userRoutes');
const machineRoutes = require('./machineRoutes');
const reportRoutes = require('./reportRoutes');
const analyticsRoutes = require('./analyticsRoutes');

const router = Router();

router.use(healthRoutes);
router.use(userRoutes);
router.use(machineRoutes);
router.use(reportRoutes);
router.use(analyticsRoutes);

module.exports = router;
