const reportGeneratorService = require('../src/services/reportGeneratorService');
const userRepository = require('../src/repositories/userRepository');
const machineRepository = require('../src/repositories/machineRepository');
const commentRepository = require('../src/repositories/commentRepository');
const reportRepository = require('../src/repositories/reportRepository');
const storageService = require('../src/services/storageService');
const reportSignatureService = require('../src/services/reportSignatureService');
const komatsuEqpCareService = require('../src/services/komatsuEqpCareService');

const { setPdfConverterForTesting } = reportGeneratorService.__private;

describe('Report Contradiction Protection & Machine Summary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setPdfConverterForTesting(async (jobs) => {
      const map = new Map();
      for (const job of jobs) {
        map.set(job.id, Buffer.from('%PDF-1.4 mock pdf content'));
      }
      return map;
    });
  });

  afterEach(() => {
    setPdfConverterForTesting(null);
  });

  it('excludes duplicate month for a machine that already has an existing report in that month', async () => {
    const mockUser = { id: 1, full_name: 'Faisal Inaya', user_number: 'ENG-01' };
    const mockMachine = {
      id: 10,
      machine_number: '88685',
      machine_type: 'D155A',
      engine_number: 'ENG-88685',
      last_smr: 500,
      smr_step: 1,
      report_counter: 25,
      customer_name: 'Test Customer',
      location: 'Site A',
    };

    jest.spyOn(userRepository, 'findById').mockResolvedValue(mockUser);
    jest.spyOn(reportSignatureService, 'getSignatureStatus').mockReturnValue({
      available: true,
      path: 'fake-signature.png',
      fileName: 'faisal-signature.png',
    });
    jest.spyOn(machineRepository, 'findByIds').mockResolvedValue([mockMachine]);
    jest.spyOn(commentRepository, 'findForReport').mockResolvedValue([
      { comment_text: 'Periodic check completed in accordance with Komatsu specs.', weight: 1 },
    ]);
    jest.spyOn(storageService, 'uploadReport').mockResolvedValue('https://storage.example.com/report.pdf');
    const reportCreateSpy = jest.spyOn(reportRepository, 'create').mockResolvedValue(undefined);

    // Mock an existing report in 2024-05 for machine 88685
    jest.spyOn(reportRepository, 'findByMachineAndMonth').mockImplementation(async (mNum, mKey) => {
      if (mNum === '88685' && mKey === '2024-05') {
        return {
          id: 999,
          report_no: '20240501-1000-001',
          machine_number: '88685',
          service_date: '2024-05-01',
        };
      }
      return null;
    });

    const result = await reportGeneratorService.generateReports({
      userId: 1,
      machineModel: 'D155A',
      reportType: 'W41X',
      serviceType: 'Add. Service',
      selectedMachines: [10],
      reportDates: ['2024-05-15', '2024-06-15'],
      skipCounterUpdates: true,
    });

    // 1. Total requested = 2 (1 machine * 2 dates)
    expect(result.totalRequested).toBe(2);
    // 2. 2024-05 was excluded because a report already exists in May 2024
    expect(result.totalExcluded).toBe(1);
    expect(result.totalGenerated).toBe(1);
    expect(result.generatedFiles).toHaveLength(1);
    expect(result.generatedFiles[0].machine).toBe('88685');

    // 3. Excluded job has detailed reason
    expect(result.excludedJobs).toHaveLength(1);
    expect(result.excludedJobs[0].month).toBe('2024-05');
    expect(result.excludedJobs[0].reason).toContain('Report already exists in month 2024-05');

    // 4. Machine summary provides per-machine breakdown
    expect(result.machineSummary).toBeDefined();
    expect(result.machineSummary).toHaveLength(1);
    const mSummary = result.machineSummary[0];
    expect(mSummary.machineNumber).toBe('88685');
    expect(mSummary.status).toBe('PARTIAL');
    expect(mSummary.successfulReports).toHaveLength(1);
    expect(mSummary.excludedReports).toHaveLength(1);

    // 5. Only 1 report was created in repository (for 2024-06-15)
    expect(reportCreateSpy).toHaveBeenCalledTimes(1);
    expect(reportCreateSpy.mock.calls[0][0].serviceDate).toBe('2024-06-15');
  });

  it('excludes Machine A duplicate month while generating Machine B report in multi-machine batch', async () => {
    const mockUser = { id: 1, full_name: 'Faisal Inaya', user_number: 'ENG-01' };
    const mockMachines = [
      {
        id: 40,
        machine_number: '77150',
        machine_type: 'PC400',
        engine_number: 'ENG-77150',
        last_smr: 4500,
        smr_step: 0,
        report_counter: 21,
      },
      {
        id: 41,
        machine_number: '77151',
        machine_type: 'PC400',
        engine_number: 'ENG-77151',
        last_smr: 5200,
        smr_step: 0,
        report_counter: 22,
      },
    ];

    jest.spyOn(userRepository, 'findById').mockResolvedValue(mockUser);
    jest.spyOn(reportSignatureService, 'getSignatureStatus').mockReturnValue({
      available: true,
      path: 'fake-signature.png',
      fileName: 'faisal-signature.png',
    });
    jest.spyOn(machineRepository, 'findByIds').mockResolvedValue(mockMachines);
    jest.spyOn(commentRepository, 'findForReport').mockResolvedValue([
      { comment_text: 'Periodic check completed in accordance with Komatsu specs.', weight: 1 },
    ]);
    jest.spyOn(storageService, 'uploadReport').mockResolvedValue('https://storage.example.com/report.pdf');
    jest.spyOn(reportRepository, 'create').mockResolvedValue(undefined);

    // Machine 77150 already has a report in 2024-05, but 77151 does NOT
    jest.spyOn(reportRepository, 'findByMachineAndMonth').mockImplementation(async (mNum, mKey) => {
      if (mNum === '77150' && mKey === '2024-05') {
        return { id: 101, report_no: '20240501-77150', machine_number: '77150' };
      }
      return null;
    });

    const result = await reportGeneratorService.generateReports({
      userId: 1,
      machineModel: 'PC400',
      reportType: 'W41X',
      serviceType: 'Add. Service',
      selectedMachines: [40, 41],
      reportDates: ['2024-05-15'],
      skipCounterUpdates: true,
    });

    // 2 requested, 1 generated (77151), 1 excluded (77150)
    expect(result.totalRequested).toBe(2);
    expect(result.totalGenerated).toBe(1);
    expect(result.totalExcluded).toBe(1);

    expect(result.generatedFiles[0].machine).toBe('77151');
    expect(result.excludedJobs[0].machineNumber).toBe('77150');

    // Machine breakdown
    const m77150 = result.machineSummary.find((m) => m.machineNumber === '77150');
    const m77151 = result.machineSummary.find((m) => m.machineNumber === '77151');
    expect(m77150.status).toBe('EXCLUDED');
    expect(m77151.status).toBe('SUCCESS');
  });

  it('excludes reports from EQP Care upload if machine already has a report in that month', async () => {
    // Machine 9720 already has a report in 2024-05
    jest.spyOn(reportRepository, 'findByMachineAndMonth').mockImplementation(async (mNum, mKey) => {
      if (mNum === '9720' && mKey === '2024-05') {
        return { id: 202, report_no: '20240501-9720', machine_number: '9720' };
      }
      return null;
    });

    const singleRes = await komatsuEqpCareService.uploadReportToEqpCare({
      model: 'HM400',
      serialNo: '9720',
      eventCode: 'W413',
      serviceDate: '2024-05-15',
    });

    expect(singleRes.status).toBe('EXCLUDED');
    expect(singleRes.reason).toContain('Excluded from upload to protect against contradictory reports');

    // Batch upload excludes it without error
    const batchRes = await komatsuEqpCareService.batchUploadReports([
      {
        model: 'HM400',
        serialNo: '9720',
        eventCode: 'W413',
        serviceDate: '2024-05-15',
      },
    ]);

    expect(batchRes.total).toBe(1);
    expect(batchRes.excluded).toBe(1);
    expect(batchRes.successful).toBe(0);
    expect(batchRes.failed).toBe(0);
  });
});
