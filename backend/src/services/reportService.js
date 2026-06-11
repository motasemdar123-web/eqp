const reportRepository = require('../repositories/reportRepository');
const machineRepository = require('../repositories/machineRepository');
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

async function deleteReport(id, ownerId, ownerName, rollbackCounters = false) {
  const report = await reportRepository.findByIdForOwner(id, ownerId, ownerName);

  if (!report) {
    throw new ApiError(404, 'Report not found');
  }

  const shouldRollbackMachineCounters = rollbackCounters && Boolean(report.machine_id);
  const fileName = decodeURIComponent(report.file_url.split('/').pop());

  await storageService.deleteReport(fileName);
  await reportRepository.remove(id, ownerId, ownerName);

  if (shouldRollbackMachineCounters) {
    await rollbackReportCounters(report.machine_id);
  }

  return {
    success: true,
    rollbackRequested: Boolean(rollbackCounters),
    countersRolledBack: Boolean(shouldRollbackMachineCounters),
  };
}

async function rollbackReportCounters(machineId) {
  const machine = await machineRepository.findById(machineId);
  if (!machine) return;

  const currentSmr = Math.max(Number(machine.last_smr) || 0, 0);
  const currentStep = Math.max(Number(machine.smr_step) || 0, 0);
  const currentCounter = Math.max(Number(machine.report_counter) || 0, 0);

  if (currentCounter <= 0) return;

  const previousStep = currentStep > 0 ? currentStep - 1 : 3;
  const previousSmr = currentStep > 0 ? currentSmr : Math.max(currentSmr - 1, 0);

  await machineRepository.updateCounters(machineId, {
    lastSmr: previousSmr,
    smrStep: previousStep,
    reportCounter: Math.max(currentCounter - 1, 0),
  });
}

module.exports = {
  listReports,
  renameReport,
  deleteReport,
};
