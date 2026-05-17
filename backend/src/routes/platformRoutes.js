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
router.get('/auth/microsoft/start', asyncHandler(platformController.startMicrosoftLogin));
router.get('/auth/microsoft/callback', asyncHandler(platformController.microsoftCallback));
router.post('/auth/microsoft/session', asyncHandler(platformController.completeMicrosoftLogin));

router.get('/api/dashboard', requirePlatformAuth, requirePermission('REPORTS_READ'), asyncHandler(platformController.dashboard));

router.get('/api/technician/schedule', requirePlatformAuth, asyncHandler(platformController.technicianSchedule));

router.get('/api/technicians', requirePlatformAuth, requirePermission('SCHEDULE_MANAGE'), asyncHandler(platformController.listTechnicians));
router.post('/api/technicians', requirePlatformAuth, requirePermission('SCHEDULE_MANAGE'), asyncHandler(platformController.createTechnician));
router.patch('/api/technicians/:id', requirePlatformAuth, requirePermission('SCHEDULE_MANAGE'), asyncHandler(platformController.updateTechnician));
router.get('/api/shifts', requirePlatformAuth, requirePermission('SCHEDULE_MANAGE'), asyncHandler(platformController.listShifts));
router.post('/api/shifts', requirePlatformAuth, requirePermission('SCHEDULE_MANAGE'), asyncHandler(platformController.createShift));
router.get('/api/scheduling/board', requirePlatformAuth, requirePermission('SCHEDULE_MANAGE'), asyncHandler(platformController.schedulingBoard));
router.post('/api/scheduling/technician-schedules', requirePlatformAuth, requirePermission('SCHEDULE_MANAGE'), asyncHandler(platformController.upsertTechnicianSchedule));

router.get('/api/clients', requirePlatformAuth, requirePermission('SYSTEM_CONFIGURE'), asyncHandler(platformController.list('client', 'clients')));
router.post('/api/clients', requirePlatformAuth, requirePermission('SYSTEM_CONFIGURE'), asyncHandler(platformController.create('client', 'client')));

router.get('/api/notifications', requirePlatformAuth, asyncHandler(platformController.list('notification', 'notifications')));

module.exports = router;
