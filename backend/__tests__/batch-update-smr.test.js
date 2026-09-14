const komatsuEqpCareService = require('../src/services/komatsuEqpCareService');
const reportGeneratorService = require('../src/services/reportGeneratorService');

describe('batchUpdateServiceLogsInEqpCare', () => {
  test('supports processing more than 12 reports with no batch limit', async () => {
    const originalCache = komatsuEqpCareService.loadCachedLiveLifecycle();
    const testCache = {
      lastSync: new Date().toISOString(),
      machines: {},
    };
    const items = Array.from({ length: 13 }, (_, i) => {
      const sNo = `90${i < 10 ? '0' + i : i}`;
      testCache.machines[sNo] = {
        machineNumber: sNo,
        model: 'HM400',
        latestSmr: 10,
        reports: [{ eventCode: 'W41X', date: '2026-08-15', smr: 10 }],
      };
      return {
        serialNo: sNo,
        eventCode: 'W41X',
        serviceDate: '2026-08-15',
        newSmr: 20 + i,
      };
    });
    komatsuEqpCareService.saveCachedLiveLifecycle(testCache);

    try {
      const res = await komatsuEqpCareService.batchUpdateServiceLogsInEqpCare(items, { syncToEqpc: false });
      expect(res.total).toBe(13);
      expect(res.successful).toBe(13);
      expect(res.failed).toBe(0);
    } finally {
      komatsuEqpCareService.saveCachedLiveLifecycle(originalCache);
    }
  }, 60000);

  test('handles empty items array gracefully', async () => {
    const res = await komatsuEqpCareService.batchUpdateServiceLogsInEqpCare([], { syncToEqpc: false });
    expect(res).toEqual({
      total: 0,
      successful: 0,
      failed: 0,
      results: [],
      errors: [],
    });
  });

  test('successfully batch updates multiple reports across machines with replacement PDFs and zero counter increments', async () => {
    const originalCache = komatsuEqpCareService.loadCachedLiveLifecycle();
    const testCache = {
      lastSync: new Date().toISOString(),
      machines: {
        '9631': {
          machineNumber: '9631',
          model: 'HM400',
          latestSmr: 50,
          reports: [
            { eventCode: 'W41X', date: '2026-08-15', smr: 50 },
            { eventCode: 'W41X', date: '2026-05-10', smr: 30 },
          ],
        },
        '9582': {
          machineNumber: '9582',
          model: 'HM400',
          latestSmr: 10,
          reports: [
            { eventCode: 'W41X', date: '2026-08-13', smr: 10 },
          ],
        },
      },
    };
    komatsuEqpCareService.saveCachedLiveLifecycle(testCache);

    try {
      const itemsToUpdate = [
        // 1. Edit older report for 9631 (May 10) -> machine latestSmr must remain 50
        {
          serialNo: '9631',
          model: 'HM400',
          eventCode: 'W41X',
          serviceDate: '2026-05-10',
          newSmr: 35,
          syncToEqpc: false,
        },
        // 2. Edit latest report for 9631 (Aug 15) -> machine latestSmr must become 60
        {
          serialNo: '9631',
          model: 'HM400',
          eventCode: 'W41X',
          serviceDate: '2026-08-15',
          newSmr: 60,
          syncToEqpc: false,
        },
        // 3. Edit latest report for 9582 (Aug 13) -> machine latestSmr must become 15
        {
          serialNo: '9582',
          model: 'HM400',
          eventCode: 'W41X',
          serviceDate: '2026-08-13',
          newSmr: 15,
          syncToEqpc: false,
        },
      ];

      const batchRes = await komatsuEqpCareService.batchUpdateServiceLogsInEqpCare(itemsToUpdate, {
        syncToEqpc: false,
      });

      expect(batchRes.total).toBe(3);
      expect(batchRes.successful).toBe(3);
      expect(batchRes.failed).toBe(0);
      expect(batchRes.errors.length).toBe(0);

      // Verify each report got a replacement PDF generated
      expect(batchRes.results[0].replacementFile).toBeDefined();
      expect(batchRes.results[1].replacementFile).toBeDefined();
      expect(batchRes.results[2].replacementFile).toBeDefined();

      // Verify conditional machine SMR updates in cache
      const updatedCache = komatsuEqpCareService.loadCachedLiveLifecycle();

      // 9631: older report updated from 30 -> 35
      expect(updatedCache.machines['9631'].reports.find((r) => r.date === '2026-05-10').smr).toBe(35);
      // 9631: latest report updated from 50 -> 60, machine latestSmr updated to 60
      expect(updatedCache.machines['9631'].reports.find((r) => r.date === '2026-08-15').smr).toBe(60);
      expect(updatedCache.machines['9631'].latestSmr).toBe(60);

      // 9582: latest report updated from 10 -> 15, machine latestSmr updated to 15
      expect(updatedCache.machines['9582'].reports.find((r) => r.date === '2026-08-13').smr).toBe(15);
      expect(updatedCache.machines['9582'].latestSmr).toBe(15);
    } finally {
      komatsuEqpCareService.saveCachedLiveLifecycle(originalCache);
    }
  }, 30000);

  test('continues processing when an individual report item has invalid data', async () => {
    const originalCache = komatsuEqpCareService.loadCachedLiveLifecycle();
    const testCache = {
      lastSync: new Date().toISOString(),
      machines: {
        '9631': {
          machineNumber: '9631',
          model: 'HM400',
          latestSmr: 20,
          reports: [
            { eventCode: 'W41X', date: '2026-08-15', smr: 20 },
          ],
        },
      },
    };
    komatsuEqpCareService.saveCachedLiveLifecycle(testCache);

    try {
      const items = [
        // Valid item
        {
          serialNo: '9631',
          model: 'HM400',
          eventCode: 'W41X',
          serviceDate: '2026-08-15',
          newSmr: 25,
          syncToEqpc: false,
        },
        // Invalid item (missing SMR)
        {
          serialNo: '9631',
          model: 'HM400',
          eventCode: 'W41X',
          serviceDate: '2026-08-15',
          newSmr: null,
          syncToEqpc: false,
        },
      ];

      const res = await komatsuEqpCareService.batchUpdateServiceLogsInEqpCare(items, { syncToEqpc: false });
      expect(res.total).toBe(2);
      expect(res.successful).toBe(1);
      expect(res.failed).toBe(1);
      expect(res.errors.length).toBe(1);
      expect(res.errors[0].message).toContain('required');

      // Verify the valid one still updated
      const updatedCache = komatsuEqpCareService.loadCachedLiveLifecycle();
      expect(updatedCache.machines['9631'].latestSmr).toBe(25);
    } finally {
      komatsuEqpCareService.saveCachedLiveLifecycle(originalCache);
    }
  });

  test('rejects batch update with error if syncToEqpc is true and session cookie is invalid', async () => {
    const items = [
      {
        serialNo: '9631',
        model: 'HM400',
        eventCode: 'W41X',
        serviceDate: '2026-08-15',
        newSmr: 25,
      },
    ];

    const res = await komatsuEqpCareService.batchUpdateServiceLogsInEqpCare(
      items,
      { syncToEqpc: true },
      'test_session_xyz'
    );

    expect(res.total).toBe(1);
    expect(res.successful).toBe(0);
    expect(res.failed).toBe(1);
    expect(res.errors[0].error).toMatch(/session cookie is missing or invalid/i);
  });
});
