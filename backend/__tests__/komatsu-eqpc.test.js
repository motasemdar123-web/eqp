const komatsuEqpCareService = require('../src/services/komatsuEqpCareService');

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
});
