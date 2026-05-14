const { Router } = require('express');
const platformController = require('../controllers/platformController');
const { asyncHandler } = require('../utils/asyncHandler');
const { requirePlatformAuth, requirePermission } = require('../middleware/platformAuthMiddleware');

const router = Router();

router.post('/api/auth/login', asyncHandler(platformController.login));
router.post('/api/auth/unified-login', asyncHandler(platformController.unifiedLogin));
router.get('/api/auth/microsoft/start', asyncHandler(platformController.startMicrosoftLogin));
router.get('/api/auth/microsoft/callback', asyncHandler(platformController.microsoftCallback));
router.post('/api/auth/microsoft/session', asyncHandler(platformController.completeMicrosoftLogin));

router.get('/api/dashboard', requirePlatformAuth, requirePermission('REPORTS_READ'), asyncHandler(platformController.dashboard));

router.get('/api/maintenance-requests', requirePlatformAuth, requirePermission('REQUESTS_READ'), asyncHandler(platformController.listRequests));
router.post('/api/maintenance-requests', requirePlatformAuth, requirePermission('REQUESTS_CREATE'), asyncHandler(platformController.createRequest));
router.patch('/api/maintenance-requests/:id/status', requirePlatformAuth, requirePermission('REQUESTS_ASSIGN'), asyncHandler(platformController.updateRequestStatus));

router.get('/api/work-orders', requirePlatformAuth, requirePermission('WORK_ORDERS_MANAGE'), asyncHandler(platformController.listWorkOrders));
router.post('/api/work-orders', requirePlatformAuth, requirePermission('WORK_ORDERS_MANAGE'), asyncHandler(platformController.createWorkOrder));
router.post('/api/work-orders/:id/close', requirePlatformAuth, requirePermission('WORK_ORDERS_CLOSE'), asyncHandler(platformController.closeWorkOrder));

router.get('/api/technicians', requirePlatformAuth, requirePermission('SCHEDULE_MANAGE'), asyncHandler(platformController.listTechnicians));
router.get('/api/shifts', requirePlatformAuth, requirePermission('SCHEDULE_MANAGE'), asyncHandler(platformController.listShifts));
router.post('/api/shifts', requirePlatformAuth, requirePermission('SCHEDULE_MANAGE'), asyncHandler(platformController.createShift));
router.get('/api/scheduling/board', requirePlatformAuth, requirePermission('SCHEDULE_MANAGE'), asyncHandler(platformController.schedulingBoard));
router.post('/api/scheduling/technician-schedules', requirePlatformAuth, requirePermission('SCHEDULE_MANAGE'), asyncHandler(platformController.upsertTechnicianSchedule));
router.post('/api/scheduling/job-cards', requirePlatformAuth, requirePermission('WORK_ORDERS_MANAGE'), asyncHandler(platformController.createJobCard));

router.get('/api/assets', requirePlatformAuth, requirePermission('ASSETS_MANAGE'), asyncHandler(platformController.list('asset', 'assets')));
router.post('/api/assets', requirePlatformAuth, requirePermission('ASSETS_MANAGE'), asyncHandler(platformController.create('asset', 'asset')));

router.get('/api/spare-parts', requirePlatformAuth, requirePermission('INVENTORY_MANAGE'), asyncHandler(platformController.list('inventoryItem', 'spareParts')));
router.post('/api/spare-parts', requirePlatformAuth, requirePermission('INVENTORY_MANAGE'), asyncHandler(platformController.create('inventoryItem', 'sparePart')));

router.get('/api/clients', requirePlatformAuth, requirePermission('REQUESTS_READ'), asyncHandler(platformController.list('client', 'clients')));
router.post('/api/clients', requirePlatformAuth, requirePermission('SYSTEM_CONFIGURE'), asyncHandler(platformController.create('client', 'client')));

router.get('/api/notifications', requirePlatformAuth, asyncHandler(platformController.list('notification', 'notifications')));

module.exports = router;
