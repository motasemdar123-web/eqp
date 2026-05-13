const reportRepository = require('../repositories/reportRepository');
const storageService = require('./storageService');
const { ApiError } = require('../utils/ApiError');

async function listReports() {
  return reportRepository.findAll();
}

async function renameReport(id, fileName) {
  const report = await reportRepository.rename(id, fileName);

  if (!report) {
    throw new ApiError(404, 'Report not found');
  }

  return report;
}

async function deleteReport(id) {
  const report = await reportRepository.findById(id);

  if (!report) {
    throw new ApiError(404, 'Report not found');
  }

  const fileName = decodeURIComponent(report.file_url.split('/').pop());

  await storageService.deleteReport(fileName);
  await reportRepository.remove(id);

  return { success: true };
}

module.exports = {
  listReports,
  renameReport,
  deleteReport,
};
