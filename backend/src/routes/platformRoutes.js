const { Router } = require('express');
const platformController = require('../controllers/platformController');
const { asyncHandler } = require('../utils/asyncHandler');
const { requirePlatformAuth, requirePermission } = require('../middleware/platformAuthMiddleware');
const { manualUpload } = require('../middleware/uploadMiddleware');

const router = Router();

router.post('/api/auth/login', asyncHandler(platformController.login));
router.post('/api/auth/unified-login', asyncHandler(platformController.unifiedLogin));
router.post('/api/auth/technician-login', asyncHandler(platformController.technicianLogin));
router.get('/api/auth/microsoft/start', asyncHandler(platformController.startMicrosoftLogin));
router.get('/api/auth/microsoft/callback', asyncHandler(platformController.microsoftCallback));
router.post('/api/auth/microsoft/session', asyncHandler(platformController.completeMicrosoftLogin));
router.get('/auth/microsoft/start', asyncHandler(platformController.startMicrosoftLogin));
router.get('/auth/microsoft/callback', asyncHandler(platformController.microsoftCallback));
router.post('/auth/microsoft/session', asyncHandler(platformController.completeMicrosoftLogin));

router.get('/api/dashboard', requirePlatformAuth, requirePermission('REPORTS_READ'), asyncHandler(platformController.dashboard));
router.get('/api/notifications', requirePlatformAuth, asyncHandler(platformController.listNotifications));
router.post('/api/notifications/read-all', requirePlatformAuth, asyncHandler(platformController.markAllNotificationsRead));
router.post('/api/notifications/:id/read', requirePlatformAuth, asyncHandler(platformController.markNotificationRead));

router.get('/api/technician/tasks', requirePlatformAuth, asyncHandler(platformController.myDailyScheduleTasks));
router.get('/api/technician/weather', requirePlatformAuth, asyncHandler(platformController.myWeatherAdvice));
router.post('/api/technician/tasks/:id/start', requirePlatformAuth, asyncHandler(platformController.startMyDailyScheduleTask));
router.post('/api/technician/tasks/:id/complete', requirePlatformAuth, asyncHandler(platformController.completeMyDailyScheduleTask));

router.get('/api/technicians', requirePlatformAuth, requirePermission('SCHEDULE_MANAGE'), asyncHandler(platformController.listTechnicians));
router.get('/api/shop-manuals', requirePlatformAuth, requirePermission('SCHEDULE_MANAGE'), asyncHandler(platformController.listShopManuals));
router.post('/api/shop-manuals', requirePlatformAuth, requirePermission('SCHEDULE_MANAGE'), asyncHandler(platformController.uploadShopManual));
router.post('/api/shop-manuals/upload', requirePlatformAuth, requirePermission('SCHEDULE_MANAGE'), manualUpload.single('manual'), asyncHandler(platformController.uploadShopManualFile));
router.get('/api/shop-manuals/:id/file', requirePlatformAuth, asyncHandler(platformController.getShopManualFile));
router.get('/api/shop-manuals/:id/pages/:page/pdf', requirePlatformAuth, asyncHandler(platformController.getShopManualPagePdf));
router.post('/api/shop-manuals/suggest-options', requirePlatformAuth, requirePermission('SCHEDULE_MANAGE'), asyncHandler(platformController.suggestManualOptions));
router.post('/api/shop-manuals/suggest-tools', requirePlatformAuth, requirePermission('SCHEDULE_MANAGE'), asyncHandler(platformController.suggestManualTools));
router.post('/api/technicians', requirePlatformAuth, requirePermission('SCHEDULE_MANAGE'), asyncHandler(platformController.createTechnician));
router.patch('/api/technicians/:id', requirePlatformAuth, requirePermission('SCHEDULE_MANAGE'), asyncHandler(platformController.updateTechnician));
router.delete('/api/technicians/:id', requirePlatformAuth, requirePermission('SCHEDULE_MANAGE'), asyncHandler(platformController.deleteTechnician));
router.get('/api/shifts', requirePlatformAuth, requirePermission('SCHEDULE_MANAGE'), asyncHandler(platformController.listShifts));
router.post('/api/shifts', requirePlatformAuth, requirePermission('SCHEDULE_MANAGE'), asyncHandler(platformController.createShift));
router.get('/api/scheduling/board', requirePlatformAuth, requirePermission('SCHEDULE_MANAGE'), asyncHandler(platformController.schedulingBoard));
router.get('/api/scheduling/tasks', requirePlatformAuth, requirePermission('SCHEDULE_MANAGE'), asyncHandler(platformController.listDailyScheduleTasks));
router.post('/api/scheduling/tasks', requirePlatformAuth, requirePermission('SCHEDULE_MANAGE'), asyncHandler(platformController.createDailyScheduleTask));
router.patch('/api/scheduling/tasks/:id', requirePlatformAuth, requirePermission('SCHEDULE_MANAGE'), asyncHandler(platformController.updateDailyScheduleTask));
router.delete('/api/scheduling/tasks/:id', requirePlatformAuth, requirePermission('SCHEDULE_MANAGE'), asyncHandler(platformController.deleteDailyScheduleTask));
router.post('/api/scheduling/technician-schedules', requirePlatformAuth, requirePermission('SCHEDULE_MANAGE'), asyncHandler(platformController.upsertTechnicianSchedule));

module.exports = router;
