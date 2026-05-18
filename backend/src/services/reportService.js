const reportRepository = require('../repositories/reportRepository');
const storageService = require('./storageService');
const { ApiError } = require('../utils/ApiError');

async function listReports(ownerId, ownerName) {
  return reportRepository.findByOwner(ownerId, ownerName);
}

async function renameReport(id, fileName, ownerId, ownerName) {
  const existing = await reportRepository.findByIdForOwner(id, ownerId, ownerName);

  if (!existing) {
    throw new ApiError(404, 'Report not found');
  }

  const report = await reportRepository.rename(id, fileName, ownerId, ownerName);

  if (!report) {
    throw new ApiError(404, 'Report not found');
  }

  return report;
}

async function deleteReport(id, ownerId, ownerName) {
  const report = await reportRepository.findByIdForOwner(id, ownerId, ownerName);

  if (!report) {
    throw new ApiError(404, 'Report not found');
  }

  const fileName = decodeURIComponent(report.file_url.split('/').pop());

  await storageService.deleteReport(fileName);
  await reportRepository.remove(id, ownerId, ownerName);

  return { success: true };
}

module.exports = {
  listReports,
  renameReport,
  deleteReport,
};
