const { Router } = require('express');
const machineController = require('../controllers/machineController');
const { asyncHandler } = require('../utils/asyncHandler');
const { requireAuth, requireEqpAccess } = require('../middleware/authMiddleware');

const router = Router();

router.get('/machines', requireAuth, requireEqpAccess, asyncHandler(machineController.listMachines));
router.get('/machine-history', requireAuth, requireEqpAccess, asyncHandler(machineController.listMachineHistory));

module.exports = router;
