const { Router } = require('express');
const komatsuOrderAdminController = require('../controllers/komatsuOrderAdminController');

const router = Router();

// Order management
router.get('/komatsu-orders', komatsuOrderAdminController.listOrders);
router.get('/komatsu-orders/:id/audit-log', komatsuOrderAdminController.getOrderAuditLogs);
router.patch('/komatsu-orders/:id', komatsuOrderAdminController.updateOrder);
router.post('/komatsu-orders/sync-now', komatsuOrderAdminController.syncNow);
router.get('/komatsu-orders/sync-jobs', komatsuOrderAdminController.getSyncJobs);

// API Key management
router.post('/api-keys', komatsuOrderAdminController.createNewApiKey);
router.get('/api-keys', komatsuOrderAdminController.getApiKeys);
router.delete('/api-keys/:id', komatsuOrderAdminController.deleteApiKey);

module.exports = router;
