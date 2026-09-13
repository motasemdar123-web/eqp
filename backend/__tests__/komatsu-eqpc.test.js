const komatsuEqpCareService = require('../src/services/komatsuEqpCareService');
const reportGeneratorService = require('../src/services/reportGeneratorService');

describe('Komatsu Equipment Care (EQP Care) Service', () => {
  describe('Cookie Management', () => {
    test('parses raw cookie input correctly', () => {
      const raw = 'mkmwFlg=""; userId=s021895; langCd=ENG; bandwidth=true; eqpMenuCtg=E; dispMenu=1';
      const parsed = komatsuEqpCareService.parseCookieInput(raw);
      expect(parsed).toBe(raw);
    });

    test('parses cURL cookie header', () => {
      const curl = "curl -H 'Cookie: JSESSIONID=abc12345; userId=s021895; eqpMenuCtg=E' https://eqp-care.komatsu.co.jp";
      const parsed = komatsuEqpCareService.parseCookieInput(curl);
      expect(parsed).toBe('JSESSIONID=abc12345; userId=s021895; eqpMenuCtg=E');
    });

    test('saves and loads cookie', () => {
      const cookieStr = 'JSESSIONID=test_session_xyz; userId=s021895; eqpMenuCtg=E';
      komatsuEqpCareService.saveCookie(cookieStr);
      expect(komatsuEqpCareService.loadCookie()).toBe(cookieStr);
    });
  });

  describe('Event Codes Master Dictionary', () => {
    test('contains standard EQP Care event codes', () => {
      const codes = komatsuEqpCareService.EVENT_CODES;
      expect(Array.isArray(codes)).toBe(true);
      expect(codes.length).toBeGreaterThanOrEqual(15);

      const w413 = codes.find((c) => c.code === 'W413');
      expect(w413).toBeDefined();
      expect(w413.name).toContain('SERVICE REPORT(3RD PERIODIC SERVICE)');

      const w411 = codes.find((c) => c.code === 'W411');
      expect(w411).toBeDefined();
      expect(w411.name).toContain('1ST PERIODIC SERVICE');

      const w41x = codes.find((c) => c.code === 'W41X');
      expect(w41x).toBeDefined();
      expect(w41x.name).toContain('EXTRA SERVICE');
    });

    test('maps service types to standard event codes', () => {
      expect(komatsuEqpCareService.mapServiceTypeToEventCode('1ST PERIODIC SERVICE (250H)')).toBe('W411');
      expect(komatsuEqpCareService.mapServiceTypeToEventCode('2nd Periodic 500 Hours')).toBe('W412');
      expect(komatsuEqpCareService.mapServiceTypeToEventCode('3rd Periodic 1000 Hours')).toBe('W413');
      expect(komatsuEqpCareService.mapServiceTypeToEventCode('PDI Pre-delivery Service')).toBe('W41P');
      expect(komatsuEqpCareService.mapServiceTypeToEventCode('General Inspection')).toBe('W41X');
    });
  });

  describe('Machine Details Lookup', () => {
    test('resolves machine type and subtype for HM400 and PC400', async () => {
      const hm400 = await komatsuEqpCareService.lookupMachineDetails({ model: 'HM400', serialNo: '9720' });
      expect(hm400.model).toBe('HM400');
      expect(hm400.type).toBe('3');
      expect(hm400.subtype).toBe('R');
      expect(hm400.distributor).toBe('5194');
      expect(hm400.subsidiary).toBe('9961');
      expect(hm400.country).toBe('KW');

      const pc400 = await komatsuEqpCareService.lookupMachineDetails({ model: 'PC400', serialNo: '100433' });
      expect(pc400.model).toBe('PC400');
      expect(pc400.type).toBe('8');
      expect(pc400.subtype).toBe('R');
    });

    test('resolveMachineTypeAndSubtype handles all Komatsu fleet classes and autocorrects mismatched types', () => {
      expect(komatsuEqpCareService.resolveMachineTypeAndSubtype('PC400-8R')).toEqual({ type: '8', subtype: 'R' });
      expect(komatsuEqpCareService.resolveMachineTypeAndSubtype('PC500LC-10M0')).toEqual({ type: '8', subtype: 'R' });
      expect(komatsuEqpCareService.resolveMachineTypeAndSubtype('D155A-6R')).toEqual({ type: '6', subtype: 'R' });
      expect(komatsuEqpCareService.resolveMachineTypeAndSubtype('WA600-6')).toEqual({ type: '6', subtype: 'R' });
      expect(komatsuEqpCareService.resolveMachineTypeAndSubtype('HM400-2')).toEqual({ type: '3', subtype: 'R' });

      // Autocorrects PC400 when incorrectly passed as Dump Truck (Type 3)
      expect(komatsuEqpCareService.resolveMachineTypeAndSubtype('PC400', '3', 'R')).toEqual({ type: '8', subtype: 'R' });
      // Autocorrects D155A when incorrectly passed as Dump Truck (Type 3)
      expect(komatsuEqpCareService.resolveMachineTypeAndSubtype('D155A', '3', 'R')).toEqual({ type: '6', subtype: 'R' });
    });
  });

  describe('Connection & Session Security', () => {
    test('rejects placeholder test cookies with informative error', async () => {
      const res = await komatsuEqpCareService.testEqpcConnection('JSESSIONID=test_session_xyz; userId=s021895');
      expect(res.connected).toBe(false);
      expect(res.status).toBe(401);
      expect(res.message).toContain('No active Komatsu Equipment Care session cookie configured');
    });

    test('rejects cookies missing JSESSIONID', async () => {
      const res = await komatsuEqpCareService.testEqpcConnection('userId=s021895; eqpMenuCtg=E');
      expect(res.connected).toBe(false);
      expect(res.status).toBe(401);
      expect(res.message).toContain("missing 'JSESSIONID'");
    });
  });

  describe('Report Upload Validation', () => {
    test('rejects upload missing required fields', async () => {
      await expect(komatsuEqpCareService.uploadReportToEqpCare({})).rejects.toThrow('Machine model and serial number are required.');
    });

    test('rejects upload missing service date', async () => {
      await expect(
        komatsuEqpCareService.uploadReportToEqpCare({
          model: 'HM400',
          serialNo: '9720',
          eventCode: 'W413',
        })
      ).rejects.toThrow('Service date is required.');
    });

    test('validates batch upload item requirements', async () => {
      await expect(komatsuEqpCareService.batchUploadReports([])).resolves.toEqual({
        total: 0,
        successful: 0,
        failed: 0,
        results: [],
        errors: [],
      });
    });
  });

  describe('Lifecycle History Extraction & Cache', () => {
    test('loads and saves cached lifecycle data safely', () => {
      const initial = komatsuEqpCareService.loadCachedLiveLifecycle();
      expect(typeof initial).toBe('object');
      expect(initial.machines).toBeDefined();

      const testData = { ...initial, testKey: 'live_test_val' };
      komatsuEqpCareService.saveCachedLiveLifecycle(testData);
      const reloaded = komatsuEqpCareService.loadCachedLiveLifecycle();
      expect(reloaded.testKey).toBe('live_test_val');
      komatsuEqpCareService.saveCachedLiveLifecycle(initial);
    });

    test('parseHistoryTableFromHtml extracts genuine reports from HTML table', () => {
      const sampleHtml = `
        <input type="hidden" name="machineId" value="3411838">
        <table id="resultTable">
          <thead>
            <tr>
              <th>Event Code</th>
              <th>Event Name</th>
              <th>Service Date</th>
              <th>SMR</th>
              <th>Country</th>
              <th>Distributor</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>W411</td>
              <td>1ST PERIODIC SERVICE</td>
              <td>2023/05/20</td>
              <td>250</td>
              <td>KUWAIT</td>
              <td>5194</td>
            </tr>
            <tr>
              <td>W41P</td>
              <td>PRE-DELIVERY INSPECTION</td>
              <td>2023/02/04</td>
              <td>10</td>
              <td>KUWAIT</td>
              <td>5194</td>
            </tr>
          </tbody>
        </table>
      `;

      const result = komatsuEqpCareService.parseHistoryTableFromHtml(sampleHtml, '77149', 'PC400');
      expect(result.machineNumber).toBe('77149');
      expect(result.model).toBe('PC400');
      expect(result.machineId).toBe('3411838');
      expect(result.totalReports).toBe(2);
      expect(result.reports[0].eventCode).toBe('W411');
      expect(result.reports[0].date).toBe('2023-05-20');
      expect(result.reports[0].smr).toBe(250);
      expect(result.reports[1].eventCode).toBe('W41P');
      expect(result.reports[1].date).toBe('2023-02-04');
    });
  });

  describe('In-Place Service Log & SMR Editing', () => {
    test('parseDwrResponse accurately deserializes Komatsu DWR response DTOs and arrays', () => {
      const mockDwrReply = `//#DWR-INSERT
//#DWR-REPLY
var s0={};
var s1=[];
var s2=[];
s1[0]="1";
s2[0]="report_9582.pdf";
s0.actionMode="update";
s0.machineId="3780894";
s0.hisInfoCd="W41X";
s0.hisDate="08/13/2026";
s0.hisSmr="10";
s0.dataSrc="01";
s0.subsidiary="9961";
s0.subsidiaryNm="KME";
s0.cntryCd="KW";
s0.cntryNm="KUWAIT";
s0.db="5194";
s0.dbNm="DAR ALHAI GENERAL TRADING KW";
s0.siteCd="##1";
s0.siteNm="##1";
s0.custCd="DAH-1404";
s0.custNm="LA'ALA AL-KUWAIT REAL ESTATE CO.";
s0.seqNo=s1;
s0.fileName=s2;
s0.strEvdId="EVD12345";
s0.commentId="98765";
s0.comment1="PM Verified";
s0.hisDateRule="2";
s0.dbRule="2";
dwr.engine._remoteHandleCallback('0','0',s0);
`;
      const dto = komatsuEqpCareService.parseDwrResponse(mockDwrReply);
      expect(dto.actionMode).toBe('update');
      expect(dto.machineId).toBe('3780894');
      expect(dto.hisSmr).toBe('10');
      expect(dto.dataSrc).toBe('01');
      expect(dto.subsidiary).toBe('9961');
      expect(dto.seqNo).toEqual(['1']);
      expect(dto.fileName).toEqual(['report_9582.pdf']);
      expect(dto.strEvdId).toBe('EVD12345');
      expect(dto.commentId).toBe('98765');
      expect(dto.comment1).toBe('PM Verified');
    });

    test('normalizeServiceDate accurately parses all valid date formats including DD/MM/YYYY and ISO', () => {
      const d1 = komatsuEqpCareService.normalizeServiceDate('13/08/2026');
      expect(d1.isoDate).toBe('2026-08-13');
      expect(d1.formattedDate).toBe('08/13/2026');
      expect(d1.dbDateFormat).toBe('20260813');
      expect(d1.monthKey).toBe('2026-08');

      const d2 = komatsuEqpCareService.normalizeServiceDate('2026-08-13');
      expect(d2.isoDate).toBe('2026-08-13');
      expect(d2.formattedDate).toBe('08/13/2026');
      expect(d2.dbDateFormat).toBe('20260813');

      const d3 = komatsuEqpCareService.normalizeServiceDate('08/13/2026');
      expect(d3.isoDate).toBe('2026-08-13');
      expect(d3.formattedDate).toBe('08/13/2026');

      const d4 = komatsuEqpCareService.normalizeServiceDate('20260813');
      expect(d4.isoDate).toBe('2026-08-13');
      expect(d4.formattedDate).toBe('08/13/2026');

      const d5 = komatsuEqpCareService.normalizeServiceDate('2026-08-13T10:00:00.000Z');
      expect(d5.isoDate).toBe('2026-08-13');
      expect(d5.formattedDate).toBe('08/13/2026');
    });

    test('updateServiceLogInEqpCare accepts DD/MM/YYYY input (e.g. 13/08/2026) and updates cache cleanly', async () => {
      const originalCache = komatsuEqpCareService.loadCachedLiveLifecycle();
      const testCache = {
        lastSync: new Date().toISOString(),
        totalMachines: 1,
        machines: {
          '9582': {
            machineNumber: '9582',
            model: 'HM400',
            totalReports: 1,
            reports: [
              { eventCode: 'W41X', eventName: 'EXTRA SERVICE', date: '2026-08-13', rawDate: '08/13/2026', smr: 10 },
            ],
          },
        },
      };
      komatsuEqpCareService.saveCachedLiveLifecycle(testCache);

      try {
        const res = await komatsuEqpCareService.updateServiceLogInEqpCare({
          serialNo: '9582',
          model: 'HM400',
          eventCode: 'W41X',
          serviceDate: '13/08/2026', // Passed in DD/MM/YYYY display format
          newSmr: 14,
          currentSmr: 10,
          syncToEqpc: false,
        });

        expect(res.success).toBe(true);
        expect(res.newSmr).toBe(14);
        expect(res.serviceDate).toBe('2026-08-13');
        expect(res.cacheUpdated).toBe(true);

        const updatedCache = komatsuEqpCareService.loadCachedLiveLifecycle();
        expect(updatedCache.machines['9582'].reports.length).toBe(1);
        expect(updatedCache.machines['9582'].reports[0].smr).toBe(14);
      } finally {
        komatsuEqpCareService.saveCachedLiveLifecycle(originalCache);
      }
    });

    test('rejects update missing required fields', async () => {
      await expect(komatsuEqpCareService.updateServiceLogInEqpCare({})).rejects.toThrow(
        'Machine serial number is required.'
      );
      await expect(
        komatsuEqpCareService.updateServiceLogInEqpCare({ serialNo: '9631' })
      ).rejects.toThrow('Event code is required.');
      await expect(
        komatsuEqpCareService.updateServiceLogInEqpCare({ serialNo: '9631', eventCode: 'W41X' })
      ).rejects.toThrow('Service date is required.');
      await expect(
        komatsuEqpCareService.updateServiceLogInEqpCare({
          serialNo: '9631',
          eventCode: 'W41X',
          serviceDate: '2026-08-18',
        })
      ).rejects.toThrow('Valid new SMR number is required.');
    });

    test('updates existing report SMR in place without creating extra reports', async () => {
      // Mock cache with existing machine and 2 reports
      const originalCache = komatsuEqpCareService.loadCachedLiveLifecycle();
      const testCache = {
        lastSync: new Date().toISOString(),
        totalMachines: 1,
        machines: {
          '9999': {
            machineNumber: '9999',
            model: 'HM400',
            totalReports: 2,
            reports: [
              { eventCode: 'W41X', eventName: 'EXTRA SERVICE', date: '2026-08-18', rawDate: '08/18/2026', smr: 10 },
              { eventCode: 'W41X', eventName: 'EXTRA SERVICE', date: '2026-07-09', rawDate: '07/09/2026', smr: 9 },
            ],
          },
        },
      };
      komatsuEqpCareService.saveCachedLiveLifecycle(testCache);

      try {
        const res = await komatsuEqpCareService.updateServiceLogInEqpCare({
          serialNo: '9999',
          model: 'HM400',
          eventCode: 'W41X',
          serviceDate: '2026-08-18',
          newSmr: 18,
          currentSmr: 10,
          syncToEqpc: false, // local in-place update
        });

        expect(res.success).toBe(true);
        expect(res.newSmr).toBe(18);
        expect(res.cacheUpdated).toBe(true);

        const updatedCache = komatsuEqpCareService.loadCachedLiveLifecycle();
        const mObj = updatedCache.machines['9999'];
        expect(mObj).toBeDefined();
        // Total reports count MUST remain exactly 2 (NO duplicate report created!)
        expect(mObj.reports.length).toBe(2);
        expect(mObj.reports[0].date).toBe('2026-08-18');
        expect(mObj.reports[0].smr).toBe(18);
        expect(mObj.reports[1].smr).toBe(9);
      } finally {
        // Restore original cache
        komatsuEqpCareService.saveCachedLiveLifecycle(originalCache);
      }
    });

    test('generateReplacementReportPdf creates valid PDF buffer with updated SMR', async () => {
      const result = await reportGeneratorService.generateReplacementReportPdf({
        machineNumber: '9631',
        eventCode: 'W41X',
        serviceDate: '2026-02-14',
        newSmr: 15,
        comments: 'Verified periodic maintenance completed.',
        performedBy: 'IBRAHIM AHMAD ALDARAWSHEH',
      });

      expect(result).toBeDefined();
      expect(result.smr).toBe(15);
      expect(result.fileName).toContain('9631');
      expect(result.fileName).toContain('.pdf');
      expect(Buffer.isBuffer(result.pdfBuffer)).toBe(true);
      expect(result.pdfBuffer.subarray(0, 4).toString('utf8')).toBe('%PDF');
    });

    test('auto-generates replacement PDF and preserves zero counter updates', async () => {
      const originalCache = komatsuEqpCareService.loadCachedLiveLifecycle();
      const testCache = {
        lastSync: new Date().toISOString(),
        totalMachines: 1,
        machines: {
          '9631': {
            machineNumber: '9631',
            model: 'HM400',
            totalReports: 1,
            reports: [
              { eventCode: 'W41X', eventName: 'EXTRA SERVICE', date: '2026-02-14', rawDate: '02/14/2026', smr: 10 },
            ],
          },
        },
      };
      komatsuEqpCareService.saveCachedLiveLifecycle(testCache);

      try {
        const res = await komatsuEqpCareService.updateServiceLogInEqpCare({
          serialNo: '9631',
          model: 'HM400',
          eventCode: 'W41X',
          serviceDate: '2026-02-14',
          newSmr: 16,
          currentSmr: 10,
          syncToEqpc: false,
        });

        expect(res.success).toBe(true);
        expect(res.newSmr).toBe(16);
        // Replacement file must be automatically generated
        expect(res.replacementFile).toBeDefined();
        expect(res.replacementFile).toContain('.pdf');

        const updatedCache = komatsuEqpCareService.loadCachedLiveLifecycle();
        expect(updatedCache.machines['9631'].reports.length).toBe(1);
        expect(updatedCache.machines['9631'].reports[0].smr).toBe(16);
      } finally {
        komatsuEqpCareService.saveCachedLiveLifecycle(originalCache);
      }
    });

    test('should reject updateServiceLogInEqpCare with an error when syncToEqpc is true and session cookie is missing or invalid', async () => {
      await expect(
        komatsuEqpCareService.updateServiceLogInEqpCare(
          {
            serialNo: '9631',
            model: 'HM400',
            eventCode: 'W41X',
            serviceDate: '2026-02-14',
            newSmr: 18,
            syncToEqpc: true,
          },
          'test_session_xyz'
        )
      ).rejects.toThrow('Komatsu session cookie is missing or invalid');
    });

    test('should identify isLastReportGenerated correctly for latest vs older reports', async () => {
      const originalCache = komatsuEqpCareService.loadCachedLiveLifecycle();
      const testCache = {
        lastSync: new Date().toISOString(),
        machines: {
          '9999': {
            machineNumber: '9999',
            model: 'HM400',
            latestSmr: 20,
            reports: [
              { eventCode: 'W41X', date: '2026-08-15', smr: 20 },
              { eventCode: 'W41X', date: '2026-05-10', smr: 15 },
            ],
          },
        },
      };
      komatsuEqpCareService.saveCachedLiveLifecycle(testCache);

      try {
        // 1. Edit the older report (2026-05-10) -> isLastReportGenerated should be false
        const resOld = await komatsuEqpCareService.updateServiceLogInEqpCare({
          serialNo: '9999',
          model: 'HM400',
          eventCode: 'W41X',
          serviceDate: '2026-05-10',
          newSmr: 17,
          syncToEqpc: false,
        });
        expect(resOld.isLastReportGenerated).toBe(false);
        const cacheAfterOld = komatsuEqpCareService.loadCachedLiveLifecycle();
        expect(cacheAfterOld.machines['9999'].latestSmr).toBe(20); // Unchanged!
        expect(cacheAfterOld.machines['9999'].reports.find((r) => r.date === '2026-05-10').smr).toBe(17);

        // 2. Edit the latest report (2026-08-15) -> isLastReportGenerated should be true
        const resLatest = await komatsuEqpCareService.updateServiceLogInEqpCare({
          serialNo: '9999',
          model: 'HM400',
          eventCode: 'W41X',
          serviceDate: '2026-08-15',
          newSmr: 25,
          syncToEqpc: false,
        });
        expect(resLatest.isLastReportGenerated).toBe(true);
        const cacheAfterLatest = komatsuEqpCareService.loadCachedLiveLifecycle();
        expect(cacheAfterLatest.machines['9999'].latestSmr).toBe(25); // Updated!
        expect(cacheAfterLatest.machines['9999'].reports.find((r) => r.date === '2026-08-15').smr).toBe(25);
      } finally {
        komatsuEqpCareService.saveCachedLiveLifecycle(originalCache);
      }
    });
  });
});

