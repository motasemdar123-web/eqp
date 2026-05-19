const platformService = require('../services/platformService');
const { requireFields } = require('../utils/validation');

async function login(req, res) {
  const result = await platformService.login(req.body);
  res.json({ success: true, ...result });
}

async function unifiedLogin(req, res) {
  const result = await platformService.unifiedLogin(req.body);
  res.json({ success: true, ...result });
}

async function technicianLogin(req, res) {
  requireFields(req.body, ['email', 'employeeCode']);
  const result = await platformService.technicianLogin(req.body);
  res.json({ success: true, ...result });
}

async function startMicrosoftLogin(req, res) {
  res.redirect(platformService.buildMicrosoftLoginUrl(req, req.query));
}

async function microsoftCallback(req, res) {
  try {
    const redirectTo = await platformService.finishMicrosoftCallback(req.query, req);
    res.redirect(redirectTo);
  } catch (error) {
    res.redirect(platformService.microsoftErrorRedirect(req, error.message));
  }
}

async function completeMicrosoftLogin(req, res) {
  requireFields(req.body, ['code']);
  const result = platformService.completeMicrosoftLogin(req.body.code);
  res.json({ success: true, ...result });
}

async function dashboard(req, res) {
  const data = await platformService.listDashboard();
  res.json({ success: true, data });
}

async function listTechnicians(req, res) {
  const technicians = await platformService.listTechnicians();
  res.json({ success: true, technicians });
}

async function listShopManuals(req, res) {
  const manuals = await platformService.listShopManuals();
  res.json({ success: true, manuals });
}

async function uploadShopManual(req, res) {
  requireFields(req.body, ['machineModel', 'title']);
  const manual = await platformService.uploadShopManual(req.body, req.platformUser?.sub);
  res.status(201).json({ success: true, manual });
}

async function uploadShopManualFile(req, res) {
  requireFields(req.body, ['machineModel', 'title']);
  const manual = await platformService.uploadShopManualFile(req.body, req.file, req.platformUser?.sub);
  res.status(201).json({ success: true, manual });
}

async function suggestManualTools(req, res) {
  requireFields(req.body, ['machineModel', 'task']);
  const suggestion = await platformService.suggestManualTools(req.body);
  res.json({ success: true, suggestion });
}

async function suggestManualOptions(req, res) {
  requireFields(req.body, ['machineModel', 'task']);
  const result = await platformService.suggestManualOptions(req.body);
  res.json({ success: true, ...result });
}

async function createTechnician(req, res) {
  requireFields(req.body, ['fullName', 'email', 'employeeCode']);
  const technician = await platformService.createTechnician(req.body, req.platformUser?.sub);
  res.status(201).json({ success: true, technician });
}

async function updateTechnician(req, res) {
  const technician = await platformService.updateTechnician(req.params.id, req.body, req.platformUser?.sub);
  res.json({ success: true, technician });
}

async function listShifts(req, res) {
  const shifts = await platformService.listShifts();
  res.json({ success: true, shifts });
}

async function createShift(req, res) {
  requireFields(req.body, ['name', 'startsAt', 'endsAt']);
  const shift = await platformService.createShift(req.body, req.platformUser?.sub);
  res.status(201).json({ success: true, shift });
}

async function schedulingBoard(req, res) {
  const board = await platformService.getSchedulingBoard(req.query.date, req.query.historyFrom, req.query.historyTo);
  res.json({ success: true, board });
}

async function createDailyScheduleTask(req, res) {
  requireFields(req.body, ['technicianIds', 'workDate', 'task', 'startsAt', 'endsAt']);
  const task = await platformService.createDailyScheduleTask(req.body, req.platformUser?.sub);
  res.status(201).json({ success: true, task });
}

async function updateDailyScheduleTask(req, res) {
  requireFields(req.body, ['technicianIds', 'workDate', 'task', 'startsAt', 'endsAt']);
  const task = await platformService.updateDailyScheduleTask(req.params.id, req.body, req.platformUser?.sub);
  res.json({ success: true, task });
}

async function deleteDailyScheduleTask(req, res) {
  await platformService.deleteDailyScheduleTask(req.params.id, req.platformUser?.sub);
  res.json({ success: true });
}

async function myDailyScheduleTasks(req, res) {
  const data = await platformService.listMyDailyScheduleTasks(req.platformUser, req.query.date);
  res.json({ success: true, ...data });
}

async function myWeatherAdvice(req, res) {
  const data = await platformService.getMyWeatherAdvice(req.platformUser, req.query.date);
  res.json({ success: true, ...data });
}

async function startMyDailyScheduleTask(req, res) {
  const task = await platformService.startMyDailyScheduleTask(req.platformUser, req.params.id);
  res.json({ success: true, task });
}

async function completeMyDailyScheduleTask(req, res) {
  requireFields(req.body, ['summary']);
  const task = await platformService.completeMyDailyScheduleTask(req.platformUser, req.params.id, req.body);
  res.json({ success: true, task });
}

async function listDailyScheduleTasks(req, res) {
  const history = await platformService.listDailyScheduleTasks(req.query.from || req.query.date, req.query.to);
  res.json({ success: true, history });
}

async function upsertTechnicianSchedule(req, res) {
  requireFields(req.body, ['technicianId', 'workDate', 'startsAt', 'endsAt']);
  const schedule = await platformService.upsertTechnicianSchedule(req.body, req.platformUser?.sub);
  res.status(201).json({ success: true, schedule });
}

module.exports = {
  login,
  unifiedLogin,
  technicianLogin,
  startMicrosoftLogin,
  microsoftCallback,
  completeMicrosoftLogin,
  dashboard,
  listTechnicians,
  listShopManuals,
  uploadShopManual,
  uploadShopManualFile,
  suggestManualOptions,
  suggestManualTools,
  createTechnician,
  updateTechnician,
  listShifts,
  createShift,
  schedulingBoard,
  createDailyScheduleTask,
  updateDailyScheduleTask,
  deleteDailyScheduleTask,
  myDailyScheduleTasks,
  myWeatherAdvice,
  startMyDailyScheduleTask,
  completeMyDailyScheduleTask,
  listDailyScheduleTasks,
  upsertTechnicianSchedule,
};
