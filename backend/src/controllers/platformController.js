const platformService = require('../services/platformService');
const { requireFields } = require('../utils/validation');

async function login(req, res) {
  requireFields(req.body, ['email', 'password']);
  const result = await platformService.login(req.body);
  res.json({ success: true, ...result });
}

async function unifiedLogin(req, res) {
  const result = await platformService.unifiedLogin(req.body);
  res.json({ success: true, ...result });
}

async function dashboard(req, res) {
  const data = await platformService.listDashboard();
  res.json({ success: true, data });
}

async function listRequests(req, res) {
  const requests = await platformService.listMaintenanceRequests();
  res.json({ success: true, requests });
}

async function createRequest(req, res) {
  requireFields(req.body, ['title', 'category']);
  const request = await platformService.createMaintenanceRequest(req.body, req.platformUser?.sub);
  res.status(201).json({ success: true, request });
}

async function updateRequestStatus(req, res) {
  requireFields(req.body, ['status']);
  const request = await platformService.updateMaintenanceRequestStatus(req.params.id, req.body.status, req.body.notes);
  res.json({ success: true, request });
}

async function listWorkOrders(req, res) {
  const workOrders = await platformService.listWorkOrders();
  res.json({ success: true, workOrders });
}

async function createWorkOrder(req, res) {
  requireFields(req.body, ['title']);
  const workOrder = await platformService.createWorkOrder(req.body);
  res.status(201).json({ success: true, workOrder });
}

async function closeWorkOrder(req, res) {
  const workOrder = await platformService.closeWorkOrder(req.params.id, req.body);
  res.json({ success: true, workOrder });
}

async function listTechnicians(req, res) {
  const technicians = await platformService.listTechnicians();
  res.json({ success: true, technicians });
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

async function createJobCard(req, res) {
  requireFields(req.body, ['title', 'workDate', 'startsAt', 'endsAt']);
  const jobCard = await platformService.createJobCard(req.body, req.platformUser?.sub);
  res.status(201).json({ success: true, jobCard });
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
  dashboard,
  listRequests,
  createRequest,
  updateRequestStatus,
  listWorkOrders,
  createWorkOrder,
  closeWorkOrder,
  listTechnicians,
  listShifts,
  createShift,
  schedulingBoard,
  upsertTechnicianSchedule,
  createJobCard,
  list,
  create,
};
