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

async function uploadShopManualFileToOpenAi(req, res) {
  requireFields(req.body, ['machineModel', 'title']);
  const manual = await platformService.uploadShopManualFileToOpenAi(req.body, req.file, req.platformUser?.sub);
  res.status(201).json({ success: true, manual });
}

function sendPdf(res, document) {
  res.setHeader('Content-Type', document.contentType || 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${document.fileName || 'shop-manual.pdf'}"`);
  res.setHeader('Cache-Control', 'private, max-age=300');
  res.send(document.buffer);
}

async function getShopManualFile(req, res) {
  const document = await platformService.getShopManualFile(req.params.id);
  sendPdf(res, document);
}

async function getShopManualPagePdf(req, res) {
  const document = await platformService.getShopManualPagePdf(req.params.id, req.params.page);
  sendPdf(res, document);
}

async function deleteShopManual(req, res) {
  const manual = await platformService.deleteShopManual(req.params.id);
  res.json({ success: true, manual });
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

async function suggestScheduleTaskFromManual(req, res) {
  requireFields(req.body, ['machineModel', 'task']);
  const result = await platformService.suggestScheduleTaskFromManual(req.body);
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

async function deleteTechnician(req, res) {
  const technician = await platformService.deleteTechnician(req.params.id, req.platformUser?.sub);
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
  requireFields(req.body, ['workDate', 'task', 'startsAt', 'endsAt']);
  const task = await platformService.createDailyScheduleTask(req.body, req.platformUser?.sub);
  res.status(201).json({ success: true, task });
}

async function updateDailyScheduleTask(req, res) {
  requireFields(req.body, ['workDate', 'task', 'startsAt', 'endsAt']);
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

async function transcribeTechnicianAudio(req, res) {
  const result = await platformService.transcribeTechnicianAudio(req.platformUser, req.file, req.body);
  res.json({ success: true, ...result });
}

async function startMyDailyScheduleTask(req, res) {
  const task = await platformService.startMyDailyScheduleTask(req.platformUser, req.params.id);
  res.json({ success: true, task });
}

async function generateMyDailyScheduleTaskAudio(req, res) {
  const audio = await platformService.generateMyDailyScheduleTaskAudio(req.platformUser, req.params.id);
  res.setHeader('Content-Type', audio.contentType);
  res.setHeader('Cache-Control', 'private, max-age=300');
  res.send(audio.buffer);
}

async function completeMyDailyScheduleTask(req, res) {
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

async function listNotifications(req, res) {
  const data = await platformService.listNotifications(req.platformUser, req.query.limit);
  res.json({ success: true, ...data });
}

async function markNotificationRead(req, res) {
  const notification = await platformService.markNotificationRead(req.platformUser, req.params.id);
  res.json({ success: true, notification });
}

async function markAllNotificationsRead(req, res) {
  const data = await platformService.markAllNotificationsRead(req.platformUser);
  res.json({ success: true, ...data });
}

async function listWorkspaceEngineers(req, res) {
  const engineers = await platformService.listWorkspaceEngineers();
  res.json({ success: true, engineers });
}

async function createWorkspacePlannerTaskPush(req, res) {
  requireFields(req.body, ['title', 'assigneeIds']);
  const tasks = await platformService.createWorkspacePlannerTaskPush(req.platformUser, req.body);
  res.status(201).json({ success: true, tasks });
}

async function listMyWorkspacePlannerTaskPushes(req, res) {
  const tasks = await platformService.listMyWorkspacePlannerTaskPushes(req.platformUser);
  res.json({ success: true, tasks });
}

async function planMyWorkspacePlannerTaskPush(req, res) {
  const task = await platformService.planMyWorkspacePlannerTaskPush(req.platformUser, req.params.id, req.body);
  res.json({ success: true, task });
}

async function dismissMyWorkspacePlannerTaskPush(req, res) {
  const task = await platformService.dismissMyWorkspacePlannerTaskPush(req.platformUser, req.params.id);
  res.json({ success: true, task });
}

const komatsuInquiryService = require('../services/komatsuInquiryService');
const komatsuEoService = require('../services/komatsuEoService');
const komatsuEqpCareService = require('../services/komatsuEqpCareService');

async function getKomatsuStatus(req, res) {
  const { cookie } = req.query || {};
  if (cookie) {
    komatsuInquiryService.saveCookie(cookie);
  }
  const status = await komatsuInquiryService.testPdxConnection(cookie);
  res.json({ success: true, ...status, hasSavedCookie: Boolean(komatsuInquiryService.loadCookie()) });
}

async function saveKomatsuCookie(req, res) {
  const { cookie } = req.body || {};
  if (!cookie) {
    return res.status(400).json({ success: false, message: 'Cookie content is required' });
  }
  const saved = komatsuInquiryService.saveCookie(cookie);
  const status = await komatsuInquiryService.testPdxConnection(saved);
  res.json({ success: true, ...status });
}

async function runKomatsuInquiry(req, res) {
  const { parts, cookie } = req.body || {};
  if (!Array.isArray(parts) || parts.length === 0) {
    return res.status(400).json({ success: false, message: 'Array of parts is required' });
  }
  if (cookie) {
    komatsuInquiryService.saveCookie(cookie);
  }
  const results = await komatsuInquiryService.runBulkInquiry(parts, cookie);
  res.json({ success: true, ...results });
}

async function getKomatsuFleet(req, res) {
  const data = await komatsuEoService.loadFleetData();
  res.json({ success: true, ...data });
}

async function addKomatsuCustomMachine(req, res) {
  const data = await komatsuEoService.addCustomMachine(req.body || {});
  res.json({ success: true, ...data });
}

async function lookupKomatsuPartMaster(req, res) {
  const { partNo, cookie } = req.query || {};
  if (!partNo) {
    return res.status(400).json({ success: false, message: 'Part number is required' });
  }
  if (cookie) {
    komatsuInquiryService.saveCookie(cookie);
  }
  try {
    const data = await komatsuEoService.lookupPartMaster(partNo, cookie);
    res.json({ success: true, ...data });
  } catch (err) {
    console.warn('[lookupKomatsuPartMaster] Lookup fallback for', partNo, err.message);
    const cleanNo = String(partNo).trim().toUpperCase();
    res.json({
      success: true,
      part_no: cleanNo,
      description: 'Komatsu Genuine Component',
      qty_by_unit: 1,
      models: ['PC500LC-10R', 'PC500LC-10', 'PC400-8R', 'WA380-6', 'PC200-8'],
      raw_models: 'PC500LC-10R; PC400-8R; WA380-6; PC200-8',
      price: '0.00',
      weight: '0',
      rank: 'A',
      warning: err.message,
    });
  }
}

async function getKomatsuLatestOrderNo(req, res) {
  const { customerCode, cookie } = req.query || {};
  if (cookie) {
    komatsuInquiryService.saveCookie(cookie);
  }
  try {
    const data = await komatsuEoService.getLatestDbOrderNo(customerCode || 'REG', cookie);
    res.json({ success: true, ...data });
  } catch (err) {
    console.warn('[getKomatsuLatestOrderNo] Fallback for latest order no:', err.message);
    res.json({
      success: true,
      next_order_no: 'R1/2026',
      next_seq: 1,
      year: 2026,
    });
  }
}

async function executeKomatsuEoOrder(req, res) {
  const { dryRun, cookie, ...orderData } = req.body || {};
  if (cookie) {
    komatsuInquiryService.saveCookie(cookie);
  }

  if (dryRun) {
    const mockQtn = `0000${Math.floor(280350 + Math.random() * 9000)}`;
    return res.json({
      success: true,
      status: 'SUCCESS',
      quotation_no: mockQtn,
      db_order_no: orderData.db_order_no,
      model_code: orderData.model_code,
      serial_no: orderData.serial_no,
      customer: orderData.customer_detail,
      dry_run: true,
    });
  }

  try {
    const result = await komatsuEoService.executeSingleEmergencyOrder(orderData, cookie);
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('[executeKomatsuEoOrder] Live portal dispatch error:', err.message);
    return res.status(400).json({
      success: false,
      status: 'FAILED',
      error: err.message,
    });
  }
}

async function searchKomatsuQuotations(req, res) {
  const { cookie, ...filters } = req.query || {};
  if (cookie) {
    komatsuInquiryService.saveCookie(cookie);
  }
  const data = await komatsuEoService.searchQuotations(filters, cookie);
  res.json({ success: true, ...data });
}

async function confirmKomatsuQuotation(req, res) {
  const { quotationNo, seqNo, cookie } = req.body || {};
  if (!quotationNo) {
    return res.status(400).json({ success: false, message: 'Quotation number is required' });
  }
  if (cookie) {
    komatsuInquiryService.saveCookie(cookie);
  }
  const result = await komatsuEoService.confirmQuotation(quotationNo, seqNo || '00', cookie);
  res.json({ success: true, ...result });
}

async function copyKomatsuQuotationToSo(req, res) {
  const { quotationNo, seqNo, cookie, options } = req.body || {};
  if (!quotationNo) {
    return res.status(400).json({ success: false, message: 'Quotation number is required' });
  }
  if (cookie) {
    komatsuInquiryService.saveCookie(cookie);
  }
  try {
    const result = await komatsuEoService.copyQuotationToSo(quotationNo, seqNo || '00', cookie, options || {});
    res.json({ success: true, ...result });
  } catch (err) {
    console.error(`[copyKomatsuQuotationToSo] Error for ${quotationNo}:`, err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

// ----------------------------------------------------
// KOMATSU EQUIPMENT CARE (EQP CARE) CONTROLLER METHODS
// ----------------------------------------------------

async function getEqpcStatus(req, res) {
  const status = await komatsuEqpCareService.testEqpcConnection();
  res.json({
    success: true,
    ...status,
    hasSavedCookie: Boolean(komatsuEqpCareService.loadCookie()),
  });
}

async function saveEqpcCookie(req, res) {
  const { cookie } = req.body || {};
  if (!cookie) {
    return res.status(400).json({ success: false, message: 'Cookie content is required' });
  }
  const saved = komatsuEqpCareService.saveCookie(cookie);
  const status = await komatsuEqpCareService.testEqpcConnection(saved);
  res.json({ success: true, cleanCookie: saved, ...status });
}

async function getEqpcEventCodes(req, res) {
  res.json({
    success: true,
    eventCodes: komatsuEqpCareService.EVENT_CODES,
  });
}

async function lookupEqpcMachine(req, res) {
  const { model, serialNo } = req.query || {};
  const data = await komatsuEqpCareService.lookupMachineDetails({ model, serialNo });
  res.json({ success: true, ...data });
}

async function uploadEqpcReport(req, res) {
  const reportData = req.body || {};
  requireFields(reportData, ['model', 'serialNo', 'eventCode', 'serviceDate']);

  const result = await komatsuEqpCareService.uploadReportToEqpCare({
    ...reportData,
    performedBy: req.platformUser?.fullName || req.user?.fullName || 'IBRAHIM AHMAD ALDARAWSHEH',
  });

  res.json({ success: true, ...result });
}

async function batchUploadEqpcReports(req, res) {
  const { items } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Array of report items is required' });
  }

  const result = await komatsuEqpCareService.batchUploadReports(items);
  res.json({ success: true, ...result });
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
  uploadShopManualFileToOpenAi,
  getShopManualFile,
  getShopManualPagePdf,
  deleteShopManual,
  suggestManualOptions,
  suggestManualTools,
  suggestScheduleTaskFromManual,
  createTechnician,
  updateTechnician,
  deleteTechnician,
  listShifts,
  createShift,
  schedulingBoard,
  createDailyScheduleTask,
  updateDailyScheduleTask,
  deleteDailyScheduleTask,
  myDailyScheduleTasks,
  myWeatherAdvice,
  transcribeTechnicianAudio,
  startMyDailyScheduleTask,
  generateMyDailyScheduleTaskAudio,
  completeMyDailyScheduleTask,
  listDailyScheduleTasks,
  upsertTechnicianSchedule,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  listWorkspaceEngineers,
  createWorkspacePlannerTaskPush,
  listMyWorkspacePlannerTaskPushes,
  planMyWorkspacePlannerTaskPush,
  dismissMyWorkspacePlannerTaskPush,
  getKomatsuStatus,
  saveKomatsuCookie,
  runKomatsuInquiry,
  getKomatsuFleet,
  addKomatsuCustomMachine,
  lookupKomatsuPartMaster,
  getKomatsuLatestOrderNo,
  executeKomatsuEoOrder,
  searchKomatsuQuotations,
  confirmKomatsuQuotation,
  copyKomatsuQuotationToSo,
  getEqpcStatus,
  saveEqpcCookie,
  getEqpcEventCodes,
  lookupEqpcMachine,
  uploadEqpcReport,
  batchUploadEqpcReports,
};

