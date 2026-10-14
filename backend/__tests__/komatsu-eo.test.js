const komatsuEoService = require('../src/services/komatsuEoService');

describe('Komatsu Emergency Order Service', () => {
  test('loads customer fleet data from bundled excel', async () => {
    const fleet = await komatsuEoService.loadFleetData();
    expect(fleet).toBeDefined();
    expect(Array.isArray(fleet.machines)).toBe(true);
    expect(fleet.machines.length).toBeGreaterThanOrEqual(281);
    expect(fleet.customers.length).toBeGreaterThan(0);
    expect(fleet.models.length).toBeGreaterThan(0);
  });

  test('adds custom machine to fleet', async () => {
    const fleet = await komatsuEoService.addCustomMachine({
      customer: 'TEST_CUSTOM_CUSTOMER',
      machine_type: 'Excavator',
      model: 'PC999-TEST',
      serials: '99901, 99902'
    });
    expect(fleet.customers).toContain('TEST_CUSTOM_CUSTOMER');
    expect(fleet.models).toContain('PC999-TEST');
  });

  test('exposes searchQuotations, confirmQuotation, and copyQuotationToSo functions', () => {
    expect(typeof komatsuEoService.searchQuotations).toBe('function');
    expect(typeof komatsuEoService.confirmQuotation).toBe('function');
    expect(typeof komatsuEoService.copyQuotationToSo).toBe('function');
  });

  test('creates DS quotation with correct order type aliases, 0% premium rate, and stock settings', async () => {
    const originalFetch = global.fetch;
    const fetchCalls = [];

    global.fetch = jest.fn(async (url, options = {}) => {
      fetchCalls.push({ url, options });

      if (url.includes('/QuotationCondition/Index')) {
        return {
          status: 200,
          headers: { getSetCookie: () => ['ASP.NET_SessionId=mockSession123'] },
          text: async () => '<html>currentUserID = "motasemgha"</html>',
        };
      }

      if (url.includes('/DistributerCodes_OnChangeLoadCustInfo')) {
        return {
          status: 200,
          headers: { getSetCookie: () => [] },
          json: async () => ({ CustomerCode: 'REG' }),
        };
      }

      if (url.includes('/OrderTypes_OnChange')) {
        return {
          status: 200,
          headers: { getSetCookie: () => [] },
          json: async () => ({
            OrderType: 'DS',
            DeliveryTerms: 'DDU',
            PremiumRate: '0.00',
            ModelInfoMark: false,
          }),
        };
      }

      if (url.includes('/QuotationCondition/Save')) {
        return {
          status: 200,
          headers: { getSetCookie: () => [] },
          text: async () => JSON.stringify({
            ErrorOccured: 0,
            NewQuotaioonNumber: '0000289999',
            RecordUpdated: 1,
          }),
        };
      }

      if (url.includes('/QuotationDetails/Index')) {
        return { status: 200, headers: { getSetCookie: () => [] }, text: async () => '' };
      }

      if (url.includes('/QuotationDetails/Search')) {
        return { status: 200, headers: { getSetCookie: () => [] }, text: async () => '' };
      }

      if (url.includes('/QuotationDetails/AddNewParts')) {
        return { status: 200, headers: { getSetCookie: () => [] }, text: async () => 'Success' };
      }

      if (url.includes('/QuotationDetails/UpdateDetails')) {
        return { status: 200, headers: { getSetCookie: () => [] }, text: async () => '' };
      }

      return { status: 200, headers: { getSetCookie: () => [] }, text: async () => '' };
    });

    try {
      const result = await komatsuEoService.executeSingleEmergencyOrder({
        order_type: 'DS',
        db_order_no: 'R500/2026',
        model_code: '',
        serial_no: '',
        customer_detail: '',
        comments: 'Stock Replenishment',
        parts: [{ part_no: '600-311-6742', quantity: 10 }],
      }, 'ASP.NET_SessionId=testCookie');

      expect(result.status).toBe('SUCCESS');
      expect(result.quotation_no).toBe('0000289999');
      expect(result.order_type).toBe('DS');
      expect(result.model_code).toBe('');
      expect(result.serial_no).toBe('');

      // Find QuotationCondition/Save call
      const saveCall = fetchCalls.find((c) => c.url.includes('/QuotationCondition/Save'));
      expect(saveCall).toBeDefined();

      const savePayload = JSON.parse(saveCall.options.body);
      const postModel = savePayload.objQuotationConditionPostModel;

      expect(postModel.OrderType).toBe('DS');
      expect(postModel.OrderTypes).toBe('DS');
      expect(postModel.SelectedOrderType).toBe('DS');
      expect(postModel.SelectedOrderTypeCode).toBe('DS');
      expect(postModel.strOTYP).toBe('DS');
      expect(postModel.PremiumRate).toBe('0.00');
      expect(postModel.DeliveryTerms).toBe('DDU');
      expect(postModel.ModelInfoMark).toBe(false);
      expect(postModel.ModelCode).toBe('');
      expect(postModel.SerialNo).toBe('');
      expect(postModel.Comments).toBe('STOCK REPLENISHMENT');

      // Verify OrderTypes_OnChange call parameters
      const otCall = fetchCalls.find((c) => c.url.includes('/OrderTypes_OnChange'));
      expect(otCall).toBeDefined();
      const otBody = otCall.options.body;
      expect(otBody).toContain('strOTYP=DS');
      expect(otBody).toContain('OrderTypes=DS');
      expect(otBody).toContain('strOrderType=DS');
    } finally {
      global.fetch = originalFetch;
    }
  });

  test('confirmQuotation preserves DS order type and does not overwrite to EO', async () => {
    const originalFetch = global.fetch;
    const fetchCalls = [];

    global.fetch = jest.fn(async (url, options = {}) => {
      fetchCalls.push({ url, options });

      if (url.includes('/QuotationDetails/Index') || url.includes('/QuotationDetails/Search') || url.includes('/QuotationDetails/UpdateDetails')) {
        return { status: 200, text: async () => '' };
      }

      if (url.includes('/QuotationCondition/Search')) {
        return {
          status: 200,
          text: async () => JSON.stringify({
            TimeStamp: '2026-10-13T10:00:00',
            DistributerOrderNo: 'R500/2026',
            DistributerName: 'DAR AL HAI',
            SelectedTransportationCode: 'RD',
            OrderType: 'DS',
            OrderTypes: 'DS',
            DeliveryTerms: 'DDU',
            PremiumRate: '0.00',
            ModelInfoMark: false,
            ModelCode: '',
            SerialNo: '',
            CustomerDetails: '',
            Comments: 'STOCK REPLENISHMENT',
            SavedCustomerCode: 'REG',
          }),
        };
      }

      if (url.includes('/QuotationCondition/Save')) {
        return {
          status: 200,
          text: async () => JSON.stringify({
            ErrorOccured: 0,
            RecordUpdated: 1,
            OperationSuccessful: 1,
          }),
        };
      }

      return { status: 200, text: async () => '' };
    });

    try {
      const result = await komatsuEoService.confirmQuotation('0000289999', '00', 'ASP.NET_SessionId=testCookie');
      expect(result.status).toBe('CONFIRMED');

      const saveCall = fetchCalls.find((c) => c.url.includes('/QuotationCondition/Save'));
      expect(saveCall).toBeDefined();

      const savePayload = JSON.parse(saveCall.options.body);
      const postModel = savePayload.objQuotationConditionPostModel;

      expect(postModel.OrderType).toBe('DS');
      expect(postModel.OrderTypes).toBe('DS');
      expect(postModel.SelectedOrderType).toBe('DS');
      expect(postModel.Status).toBe('2'); // 2 = Confirmed
      expect(postModel.PremiumRate).toBe('0.00');
      expect(postModel.ModelInfoMark).toBe(false);
      expect(postModel.ModelCode).toBe('');
      expect(postModel.Comments).toBe('STOCK REPLENISHMENT');
    } finally {
      global.fetch = originalFetch;
    }
  });

  test('copyQuotationToSo initializes session view and posts conversion parameters', async () => {
    const originalFetch = global.fetch;
    const fetchCalls = [];

    global.fetch = jest.fn(async (url, options) => {
      fetchCalls.push({ url, options });

      if (url.includes('/Inquiry/CopyToSO')) {
        return {
          status: 200,
          headers: { getSetCookie: () => [] },
          text: async () => JSON.stringify({ ErrorOccured: 0 }),
        };
      }

      if (url.includes('/CopyToSO/CopyToSOView')) {
        return {
          status: 200,
          headers: { getSetCookie: () => [] },
          text: async () => '<html>CopyToSOView loaded</html>',
        };
      }

      if (url.includes('/CopyToSO/CheckConsumedLines')) {
        return {
          status: 200,
          headers: { getSetCookie: () => [] },
          text: async () => '[]',
        };
      }

      if (url.includes('/CopyToSO/CopyTOSOConversion')) {
        return {
          status: 200,
          headers: { getSetCookie: () => [] },
          text: async () => '<html>Success: Quotation copied to Sales Order</html>',
        };
      }

      return { status: 200, headers: { getSetCookie: () => [] }, text: async () => '' };
    });

    try {
      const result = await komatsuEoService.copyQuotationToSo('0000289999', '00', 'ASP.NET_SessionId=testCookie', { bods: '1' });
      expect(result.status).toBe('COPIED_TO_SO');
      expect(result.quotation_no).toBe('0000289999');

      const viewCall = fetchCalls.find((c) => c.url.includes('/CopyToSO/CopyToSOView'));
      expect(viewCall).toBeDefined();

      const convCall = fetchCalls.find((c) => c.url.includes('/CopyToSO/CopyTOSOConversion'));
      expect(convCall).toBeDefined();
      expect(convCall.options.body).toContain('QuotationNo=0000289999');
      expect(convCall.options.body).toContain('ddlBODSSelectedVal=1');
    } finally {
      global.fetch = originalFetch;
    }
  });
});

