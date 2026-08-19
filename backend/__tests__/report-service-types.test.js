const path = require('path');

const reportGeneratorService = require('../src/services/reportGeneratorService');
const reportRepository = require('../src/repositories/reportRepository');
const { getLifecycleReportCount } = require('../src/data/lifecycleReportCounts');

const {
  buildReportFileName,
  buildTemplateCandidates,
  getCommentScope,
  getEffectiveReportType,
  getInitialRepeatingReportCounter,
  getRequiredReportType,
  getTemplateServiceType,
  isRepeatingServiceType,
} = reportGeneratorService.__private;

describe('report service type handling', () => {
  it('lists storage service under the storage comment scope', () => {
    expect(getCommentScope('Storage Service')).toEqual({
      documentType: 'storage',
      serviceStage: 'storage_service',
    });
  });

  it('uses add service workbook templates for storage service reports', () => {
    expect(getTemplateServiceType('Storage Service')).toBe('Add Service');
    expect(getRequiredReportType('Storage Service')).toBe('W30');

    const candidates = buildTemplateCandidates('W41', 'Storage Service', 'HM400');

    expect(candidates).toEqual([
      {
        path: path.join(__dirname, '..', 'templates', 'HM400', 'W30_Add_Service.xlsx'),
        variant: 'default',
        group: null,
      },
    ]);
  });

  it('forces additional service to W41X while using the W41 template files', () => {
    expect(getRequiredReportType('Add. Service')).toBe('W41X');
    expect(getEffectiveReportType('W30', 'Add. Service')).toBe('W41X');

    const candidates = buildTemplateCandidates('W41X', 'Add. Service', 'HM400');

    expect(candidates).toEqual([
      {
        path: path.join(__dirname, '..', 'templates', 'HM400', 'W41_Add_Service.xlsx'),
        variant: 'default',
        group: null,
      },
    ]);
  });

  it('names one-time scheduled service files without a counter', () => {
    expect(buildReportFileName({
      machineModel: 'HM400',
      machineNumber: '9720',
      reportType: 'W41',
      serviceType: '3rd Service',
      reportCounter: 1,
    })).toBe('HM400 9720 3rd.pdf');
  });

  it('names repeating storage service files with report type and sequence', () => {
    expect(isRepeatingServiceType('Storage Service')).toBe(true);
    expect(buildReportFileName({
      machineModel: 'D155A',
      machineNumber: '81867',
      reportType: getEffectiveReportType('W41', 'Storage Service'),
      serviceType: 'Storage Service',
      reportCounter: 1,
    })).toBe('D155A 81867 W30-1.pdf');
  });

  it('names repeating additional service files with Ex shortcuts', () => {
    expect(isRepeatingServiceType('Add. Service')).toBe(true);
    expect(buildReportFileName({
      machineModel: 'D155A',
      machineNumber: '81867',
      reportType: getEffectiveReportType('W30', 'Add. Service'),
      serviceType: 'Add. Service',
      reportCounter: 1,
    })).toBe('D155A 81867 Ex_1.pdf');
  });

  it('reads W30 and W41X counters from the imported lifecycle baseline', () => {
    expect(getLifecycleReportCount('88767', 'W30')).toBe(9);
    expect(getLifecycleReportCount('88767', 'W41X')).toBe(16);
    expect(getLifecycleReportCount('9720', 'W30')).toBe(7);
    expect(getLifecycleReportCount('9720', 'W41X')).toBe(5);
  });

  it('continues repeating report counters from lifecycle plus generated reports', async () => {
    jest
      .spyOn(reportRepository, 'countByMachineAndReportType')
      .mockResolvedValueOnce(2);

    await expect(getInitialRepeatingReportCounter({
      machine: {
        id: 16,
        machine_number: '88767',
      },
      reportType: 'W41X',
    })).resolves.toBe(18);

    reportRepository.countByMachineAndReportType.mockRestore();
  });
});
