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

async function technicianSchedule(req, res) {
  const data = await platformService.listTechnicianSchedule(req.platformUser, req.query.date);
  res.json({ success: true, ...data });
}

async function listTechnicians(req, res) {
  const technicians = await platformService.listTechnicians();
  res.json({ success: true, technicians });
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
  const board = await platformService.getSchedulingBoard(req.query.date);
  res.json({ success: true, board });
}

async function upsertTechnicianSchedule(req, res) {
  requireFields(req.body, ['technicianId', 'workDate', 'startsAt', 'endsAt']);
  const schedule = await platformService.upsertTechnicianSchedule(req.body, req.platformUser?.sub);
  res.status(201).json({ success: true, schedule });
}

function list(modelName, responseKey) {
  return async (req, res) => {
    const items = await platformService.listModel(modelName);
    res.json({ success: true, [responseKey]: items });
  };
}

function create(modelName, responseKey) {
  return async (req, res) => {
    const item = await platformService.createModel(modelName, req.body);
    res.status(201).json({ success: true, [responseKey]: item });
  };
}

module.exports = {
  login,
  unifiedLogin,
  startMicrosoftLogin,
  microsoftCallback,
  completeMicrosoftLogin,
  dashboard,
  technicianSchedule,
  listTechnicians,
  createTechnician,
  updateTechnician,
  listShifts,
  createShift,
  schedulingBoard,
  upsertTechnicianSchedule,
  list,
  create,
};
