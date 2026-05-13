const reportService = require('../services/reportService');
const reportGeneratorService = require('../services/reportGeneratorService');
const {
  requireFields,
  assertArray,
  assertDateStrings,
} = require('../utils/validation');

async function listReports(req, res) {
  const reports = await reportService.listReports();

  res.json(reports);
}

async function renameReport(req, res) {
  requireFields(req.body, ['file_name']);

  const report = await reportService.renameReport(req.params.id, req.body.file_name.trim());

  res.json(report);
}

async function deleteReport(req, res) {
  const result = await reportService.deleteReport(req.params.id);

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
    userNumber: req.user.userNumber,
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
