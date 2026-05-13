const { Router } = require('express');
const machineController = require('../controllers/machineController');
const { asyncHandler } = require('../utils/asyncHandler');
const { requireAuth } = require('../middleware/authMiddleware');

const router = Router();

router.get('/machines', requireAuth, asyncHandler(machineController.listMachines));
router.get('/machine-history', requireAuth, asyncHandler(machineController.listMachineHistory));

module.exports = router;
