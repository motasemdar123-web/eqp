const { Router } = require('express');
const sheetsController = require('../controllers/sheetsController');
const { asyncHandler } = require('../utils/asyncHandler');
const { requireAuth } = require('../middleware/authMiddleware');

const router = Router();

router.get('/sheets/manifest', requireAuth, asyncHandler(sheetsController.manifest));
router.get('/sheets/sap-search', requireAuth, asyncHandler(sheetsController.sapSearch));
router.get('/sheets/customers', requireAuth, asyncHandler(sheetsController.customers));
router.get('/sheets/people', requireAuth, asyncHandler(sheetsController.people));
router.get('/sheets/tool-custody', requireAuth, asyncHandler(sheetsController.toolCustody));
router.get('/sheets/:sheetId', requireAuth, asyncHandler(sheetsController.getSheet));

module.exports = router;
