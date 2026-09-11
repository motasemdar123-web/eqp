const { Router } = require('express');
const partsInquiryController = require('../controllers/partsInquiryController');
const { asyncHandler } = require('../utils/asyncHandler');
const { requirePlatformAuth, optionalPlatformAuth } = require('../middleware/platformAuthMiddleware');

const router = Router();

// Outlook Status & Ingestion
router.get('/api/inquiries/outlook/status', optionalPlatformAuth, asyncHandler(partsInquiryController.getOutlookStatus));
router.post('/api/inquiries/sync', optionalPlatformAuth, asyncHandler(partsInquiryController.syncInquiries));

// Inquiry Queries & Management
router.get('/api/inquiries', optionalPlatformAuth, asyncHandler(partsInquiryController.listInquiries));
router.get('/api/inquiries/:id', optionalPlatformAuth, asyncHandler(partsInquiryController.getInquiry));
router.patch('/api/inquiries/:id/status', optionalPlatformAuth, asyncHandler(partsInquiryController.updateStatus));
router.post('/api/inquiries/:id/pdx-price', optionalPlatformAuth, asyncHandler(partsInquiryController.priceWithPdx));

// Line Items
router.post('/api/inquiries/:id/items', optionalPlatformAuth, asyncHandler(partsInquiryController.addItem));
router.patch('/api/inquiries/items/:itemId', optionalPlatformAuth, asyncHandler(partsInquiryController.updateItem));
router.delete('/api/inquiries/items/:itemId', optionalPlatformAuth, asyncHandler(partsInquiryController.deleteItem));

module.exports = router;
