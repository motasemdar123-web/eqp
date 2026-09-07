const reportGeneratorService = require('../src/services/reportGeneratorService');
const userRepository = require('../src/repositories/userRepository');
const machineRepository = require('../src/repositories/machineRepository');
const commentRepository = require('../src/repositories/commentRepository');
const reportRepository = require('../src/repositories/reportRepository');
const storageService = require('../src/services/storageService');
const reportSignatureService = require('../src/services/reportSignatureService');

const { setPdfConverterForTesting } = reportGeneratorService.__private;

describe('Gap Reports Generator (Counter Preservation & Manual SMR)', () => {
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

  it('generates gap report with manual SMR without calling machineRepository.updateCounters', async () => {
    const mockUser = {
      id: 1,
      full_name: 'Faisal Inaya',
      user_number: 'ENG-01',
    };

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

    const updateCountersSpy = jest.spyOn(machineRepository, 'updateCounters').mockResolvedValue(undefined);
    const reportCreateSpy = jest.spyOn(reportRepository, 'create').mockResolvedValue(undefined);
    jest.spyOn(storageService, 'uploadReport').mockResolvedValue('https://storage.example.com/report.pdf');

    const result = await reportGeneratorService.generateReports({
      userId: 1,
      machineModel: 'D155A',
      reportType: 'W41X',
      serviceType: 'Add. Service',
      selectedMachines: [10],
      reportDates: ['2024-05-15'],
      manualSmr: 42,
      reportCounter: 14,
      skipCounterUpdates: true,
    });

    // 1. Result was generated
    expect(result.generatedFiles).toHaveLength(1);
    expect(result.generatedFiles[0].machine).toBe('88685');

    // 2. Machine counters were strictly NOT updated
    expect(updateCountersSpy).not.toHaveBeenCalled();

    // 3. Report record was created with the manual SMR = 42
    expect(reportCreateSpy).toHaveBeenCalledTimes(1);
    const createdReport = reportCreateSpy.mock.calls[0][0];
    expect(createdReport.smr).toBe(42);
    expect(createdReport.serviceDate).toBe('2024-05-15');
    // 4. Report filename used the custom counter Ex_14
    expect(createdReport.fileName).toContain('Ex_14');
  });

  it('updates machine counters normally when skipCounterUpdates is false', async () => {
    const mockUser = {
      id: 1,
      full_name: 'Faisal Inaya',
      user_number: 'ENG-01',
    };

    const mockMachine = {
      id: 10,
      machine_number: '88685',
      machine_type: 'D155A',
      engine_number: 'ENG-88685',
      last_smr: 500,
      smr_step: 0,
      report_counter: 20,
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

    const updateCountersSpy = jest.spyOn(machineRepository, 'updateCounters').mockResolvedValue(undefined);
    jest.spyOn(reportRepository, 'create').mockResolvedValue(undefined);
    jest.spyOn(storageService, 'uploadReport').mockResolvedValue('https://storage.example.com/report.pdf');

    await reportGeneratorService.generateReports({
      userId: 1,
      machineModel: 'D155A',
      reportType: 'W41X',
      serviceType: 'Add. Service',
      selectedMachines: [10],
      reportDates: ['2024-05-15'],
      skipCounterUpdates: false,
    });

    // machineRepository.updateCounters MUST be called in standard mode
    expect(updateCountersSpy).toHaveBeenCalledTimes(1);
    expect(updateCountersSpy).toHaveBeenCalledWith(10, expect.objectContaining({
      reportCounter: 28,
      lastSmr: 500,
    }));
  });
});
