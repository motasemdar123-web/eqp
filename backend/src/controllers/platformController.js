const platformService = require('../services/platformService');
const { requireFields } = require('../utils/validation');

async function login(req, res) {
  requireFields(req.body, ['email', 'password']);
  const result = await platformService.login(req.body);
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
  dashboard,
  listRequests,
  createRequest,
  updateRequestStatus,
  listWorkOrders,
  createWorkOrder,
  closeWorkOrder,
  list,
  create,
};
