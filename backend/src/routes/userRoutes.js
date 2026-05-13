const { Router } = require('express');
const userController = require('../controllers/userController');
const { asyncHandler } = require('../utils/asyncHandler');
const { authRateLimit } = require('../middleware/securityMiddleware');

const router = Router();

router.post('/verify-user', authRateLimit, asyncHandler(userController.verifyUser));

module.exports = router;
