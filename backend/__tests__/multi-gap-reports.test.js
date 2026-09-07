const reportGeneratorService = require('../src/services/reportGeneratorService');
const userRepository = require('../src/repositories/userRepository');
const machineRepository = require('../src/repositories/machineRepository');
const commentRepository = require('../src/repositories/commentRepository');
const reportRepository = require('../src/repositories/reportRepository');
const storageService = require('../src/services/storageService');
const reportSignatureService = require('../src/services/reportSignatureService');

const { setPdfConverterForTesting } = reportGeneratorService.__private;

describe('Multi-Machine & Multi-Month Gap Reports', () => {
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

  it('generates multi-machine and multi-month gap reports with per-machine manual SMR without updating DB counters', async () => {
    const mockUser = {
      id: 1,
      full_name: 'Faisal Inaya',
      user_number: 'ENG-01',
    };

    const mockMachines = [
      {
        id: 40,
        machine_number: '77150',
        machine_type: 'PC400',
        engine_number: 'ENG-77150',
        last_smr: 4500,
        smr_step: 0,
        report_counter: 21,
        report_template_group: 'SAMA',
        customer_name: 'Sama International',
        location: 'Site A',
      },
      {
        id: 41,
        machine_number: '77151',
        machine_type: 'PC400',
        engine_number: 'ENG-77151',
        last_smr: 5200,
        smr_step: 0,
        report_counter: 22,
        report_template_group: 'SAMA',
        customer_name: 'Sama International',
        location: 'Site B',
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

    const updateCountersSpy = jest.spyOn(machineRepository, 'updateCounters').mockResolvedValue(undefined);
    const reportCreateSpy = jest.spyOn(reportRepository, 'create').mockResolvedValue(undefined);
    jest.spyOn(storageService, 'uploadReport').mockResolvedValue('https://storage.example.com/report.pdf');

    const result = await reportGeneratorService.generateReports({
      userId: 1,
      machineModel: 'PC400',
      reportType: 'W41X',
      serviceType: 'Add. Service',
      selectedMachines: [40, 41],
      reportDates: ['2024-05-15', '2024-06-15'],
      skipCounterUpdates: true,
      machineSmrMap: {
        40: 1200,
        41: 1800,
      },
    });

    // 1. Total reports generated = 2 machines * 2 dates = 4 reports
    expect(result.generatedFiles).toHaveLength(4);

    // 2. Machine counters were NOT updated in DB
    expect(updateCountersSpy).not.toHaveBeenCalled();

    // 3. Reports were created with respective per-machine manual SMR
    expect(reportCreateSpy).toHaveBeenCalledTimes(4);
    const createdReports = reportCreateSpy.mock.calls.map((call) => call[0]);

    const m40Reports = createdReports.filter((r) => r.machineId === 40);
    const m41Reports = createdReports.filter((r) => r.machineId === 41);

    expect(m40Reports).toHaveLength(2);
    expect(m41Reports).toHaveLength(2);

    expect(m40Reports[0].smr).toBe(1200);
    expect(m40Reports[1].smr).toBe(1200);
    expect(m41Reports[0].smr).toBe(1800);
    expect(m41Reports[1].smr).toBe(1800);

    // 4. File names are sequential without jumps
    expect(m40Reports[0].fileName).toBe('PC400 77150 Ex_22.pdf');
    expect(m40Reports[1].fileName).toBe('PC400 77150 Ex_23.pdf');
    expect(m41Reports[0].fileName).toBe('PC400 77151 Ex_23.pdf');
    expect(m41Reports[1].fileName).toBe('PC400 77151 Ex_24.pdf');
  });
});
