const reportService = require('../services/reportService');
const reportGeneratorService = require('../services/reportGeneratorService');
const {
  requireFields,
  assertArray,
  assertDateStrings,
} = require('../utils/validation');

async function listReports(req, res) {
  const reports = await reportService.listReports(req.user.sub, req.user.fullName);

  res.json(reports);
}

async function renameReport(req, res) {
  requireFields(req.body, ['file_name']);

  const report = await reportService.renameReport(req.params.id, req.body.file_name.trim(), req.user.sub, req.user.fullName);

  res.json(report);
}

async function deleteReport(req, res) {
  const rollbackCounters = req.query.rollbackCounters === 'true';
  const result = await reportService.deleteReport(req.params.id, req.user.sub, req.user.fullName, rollbackCounters);

  res.json(result);
}

async function generateReports(req, res) {
  requireFields(req.body, [
    'reportType',
    'serviceType',
    'selectedMachines',
    'reportDates',
  ]);

  assertArray(req.body.selectedMachines, 'selectedMachines');
  assertDateStrings(req.body.reportDates, 'reportDates');

  const result = await reportGeneratorService.generateReports({
    userId: req.user.sub,
    userNumber: req.user.userNumber,
    machineModel: req.body.machineModel,
    reportType: req.body.reportType,
    serviceType: req.body.serviceType,
    selectedMachines: req.body.selectedMachines.map(Number),
    reportDates: req.body.reportDates,
  });

  res.json({
    success: true,
    ...result,
  });
}

module.exports = {
  listReports,
  renameReport,
  deleteReport,
  generateReports,
};
