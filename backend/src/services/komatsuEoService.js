const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const { loadCookie, parseCookieInput } = require('./komatsuInquiryService');

const BASE_PORTAL_URL = 'https://www.komatsu.ae/kmewebportal';
const FLEET_EXCEL_PATH = path.join(__dirname, '../../data/fleet_machines.xlsx');
const USER_DOWNLOADS_EXCEL = 'C:\\Users\\Motasem.ghanem\\Downloads\\Default Dashboard_Machine List_21_08_2026, 23_25_45.xlsx';

let cachedFleet = null;
let customMachines = [];

async function loadFleetData() {
  if (cachedFleet && customMachines.length === 0) {
    return cachedFleet;
  }

  let filePath = FLEET_EXCEL_PATH;
  if (fs.existsSync(USER_DOWNLOADS_EXCEL)) {
    filePath = USER_DOWNLOADS_EXCEL;
  } else if (!fs.existsSync(FLEET_EXCEL_PATH)) {
    return { customers: [], machine_types: [], models: [], machines: customMachines };
  }

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];

    const machines = [];
    let headerMap = {};

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        row.eachCell((cell, colNumber) => {
          const val = String(cell.value || '').trim().toLowerCase();
          if (val.includes('machine') && val.includes('type')) headerMap.type = colNumber;
          else if (val.includes('model')) headerMap.model = colNumber;
          else if (val.includes('serial')) headerMap.serial = colNumber;
          else if (val.includes('cust')) headerMap.customer = colNumber;
        });
      } else {
        const cust = headerMap.customer ? String(row.getCell(headerMap.customer).value || '').trim() : 'Unknown';
        const mtype = headerMap.type ? String(row.getCell(headerMap.type).value || '').trim() : 'Other';
        const model = headerMap.model ? String(row.getCell(headerMap.model).value || '').trim() : '';
        let serial = headerMap.serial ? String(row.getCell(headerMap.serial).value || '').trim() : '';
        
        if (serial.endsWith('.0')) {
          serial = serial.slice(0, -2);
        }

        if (model || serial) {
          machines.push({
            customer: cust,
            machine_type: mtype,
            model: model,
            serial: serial,
          });
        }
      }
    });

    // Merge custom machines
    const allMachines = [...machines, ...customMachines];
    const customers = [...new Set(allMachines.map((m) => m.customer).filter(Boolean))].sort();
    const machineTypes = [...new Set(allMachines.map((m) => m.machine_type).filter(Boolean))].sort();
    const models = [...new Set(allMachines.map((m) => m.model).filter(Boolean))].sort();

    cachedFleet = {
      customers,
      machine_types: machineTypes,
      models,
      machines: allMachines,
      total: allMachines.length,
    };

    return cachedFleet;
  } catch (err) {
    console.error('Error loading fleet Excel:', err);
    return {
      customers: [],
      machine_types: [],
      models: [],
      machines: customMachines,
      total: customMachines.length,
    };
  }
}

function addCustomMachine({ customer, machine_type, model, serials }) {
  const serialList = String(serials || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  for (const sn of serialList) {
    customMachines.push({
      customer: String(customer || '').trim(),
      machine_type: String(machine_type || 'Custom').trim(),
      model: String(model || '').trim(),
      serial: sn,
    });
  }

  // Invalidate cache
  cachedFleet = null;
  return loadFleetData();
}

async function lookupPartMaster(partNo, customCookie = null) {
  const cookieStr = customCookie ? parseCookieInput(customCookie) : loadCookie();
  if (!cookieStr) {
    throw new Error('No PDX session cookie found. Please configure your cookie first.');
  }

  const url = `${BASE_PORTAL_URL}/StockInquiry/PartsMasterInquirySearch`;
  const bodyData = new URLSearchParams({ txtPartNo: String(partNo).trim() });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest',
      'Origin': 'https://www.komatsu.ae',
      'Cookie': cookieStr,
    },
    body: bodyData.toString(),
  });

  if (response.status !== 200) {
    throw new Error(`Part Master lookup failed with status: ${response.status}`);
  }

  const resJson = await response.json();
  const desc = resJson.txtPNAM || '';
  const qtyByUnitStr = resJson.txtQBYU || '1';
  let qtyByUnit = parseInt(qtyByUnitStr, 10);
  if (Number.isNaN(qtyByUnit) || qtyByUnit <= 0) qtyByUnit = 1;

  const rawModels = resJson.txtModelInfo || '';
  const models = rawModels
    .split(';')
    .map((m) => m.trim())
    .filter(Boolean);

  return {
    part_no: String(partNo).trim(),
    description: desc,
    qty_by_unit: qtyByUnit,
    models: models,
    raw_models: rawModels,
    price: resJson.txtKMELstPrc || '0.00',
    weight: resJson.txtUWEI || '0',
    rank: resJson.txtKMERank || '',
  };
}

async function getLatestDbOrderNo(customerCode = 'REG', customCookie = null) {
  const cookieStr = customCookie ? parseCookieInput(customCookie) : loadCookie();
  if (!cookieStr) {
    throw new Error('No PDX session cookie found.');
  }

  const url = `${BASE_PORTAL_URL}/Inquiry/SearchResult`;
  const bodyData = new URLSearchParams({
    QuotationNo: '',
    QuotationSubNo: '',
    DistributerOrderNo: '',
    SalesOrderNo: '',
    Status: '',
    FromDate: '',
    ToDate: '',
    PersonIncharge: '',
    CustomerCode: customerCode,
    page: '1',
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Accept': '*/*',
      'X-Requested-With': 'XMLHttpRequest',
      'Origin': 'https://www.komatsu.ae',
      'Cookie': cookieStr,
    },
    body: bodyData.toString(),
  });

  const text = await response.text();
  const matches = [...text.matchAll(/R(\d+)\/(\d{4})/g)];

  if (!matches || matches.length === 0) {
    return { next_order_no: 'R1/2026', next_seq: 1, year: 2026 };
  }

  let maxNum = 0;
  let curYear = 2026;

  for (const m of matches) {
    const num = parseInt(m[1], 10);
    const yr = parseInt(m[2], 10);
    if (num > maxNum) {
      maxNum = num;
      curYear = yr;
    }
  }

  const nextSeq = maxNum + 1;
  const nextOrderNo = `R${nextSeq}/${curYear}`;

  return {
    next_order_no: nextOrderNo,
    next_seq: nextSeq,
    year: curYear,
  };
}

async function executeSingleEmergencyOrder(orderData, customCookie = null) {
  const cookieStr = customCookie ? parseCookieInput(customCookie) : loadCookie();
  if (!cookieStr) {
    throw new Error('No PDX session cookie configured.');
  }

  const {
    db_order_no,
    model_code,
    serial_no,
    customer_detail,
    comments = 'Urgent',
    parts = [],
    order_type = 'EO',
    customer_code = 'REG',
    db_code = '536K',
    db_name = 'DAR AL HAI',
    user_id = 'motasemgha',
  } = orderData;

  const defaultHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0',
    'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
    'Origin': 'https://www.komatsu.ae',
    'Cookie': cookieStr,
  };

  // STEP 1: Reset session by calling QuotationCondition/Index
  const initUrl = `${BASE_PORTAL_URL}/QuotationCondition/Index`;
  await fetch(initUrl, { method: 'GET', headers: defaultHeaders });

  // STEP 2: Save Quotation Condition
  const saveUrl = `${BASE_PORTAL_URL}/QuotationCondition/Save`;
  const rates = ['A', 'B', 'C', 'D', 'DA', 'E', 'F', 'NA', 'Other', 'S'].map((grp) => ({
    QuotationNo: '',
    QuotationSubNo: '',
    RateType: '1',
    CommodityGroupCode: grp,
    RateValue: '0.00',
  }));

  const payload = {
    objQuotationConditionPostModel: {
      OrigQuotationNo: '0000000000',
      OrigQuotationSeqNo: '00',
      QuotationNo: '',
      QuotationSeqNo: '00',
      DistributerOrderNo: db_order_no,
      DistributerCodes: db_code,
      DistributerName: db_name,
      SalesPriceList: 'USD037',
      Currency: 'USD',
      ExchangeRate: '1',
      OrderType: order_type,
      Usance: '30',
      TaxRate: '0',
      Transportation: 'RD',
      DeliveryTerms: 'DDU',
      PaymentTerms: 'T2',
      OrderPRobability: 'A',
      Region: 'AE',
      Status: '1',
      LoadingPort: 'JEA',
      UnloadingPort: 'KWI',
      PersonIncharge: user_id,
      QuotationValidity: '08/29/2026',
      RequestedDeliveryTime: '08/22/2026',
      PriceCalculationMethod: 'D',
      DiscountRateOther: '0',
      PremiumRate: '13.3',
      BillingRateA: '0',
      BillingRateB: '0',
      BillingRateC: '0',
      BillingRateD: '0',
      BillingRateE: '0',
      BillingRateF: '0',
      ShipToAddress: 'DAR AL HAI\nKUWAIT GENERAL TRADING. Al-Rai Industrial Area  Plot # 1732  Block # 2  Street # 4  Behind the Avenues  Kuwait',
      AvailableMark: true,
      UseHSCode: false,
      ReserverStock: false,
      DontConsiderEORes: false,
      FixPrice: false,
      Memo: '',
      Comments: comments,
      ModelCode: model_code,
      SerialNo: serial_no,
      EngineSrNo: '-',
      CustomerDetails: customer_detail,
      ModelInfoMark: true,
      jobCard: '',
      Warranty: '',
      TSINumber: '',
      ModelSVREMark: false,
      ExitPoint: 'JEA',
      CustomerCode: customer_code,
      lstRates: rates,
      MarkingCode: 'MCOIL',
    },
  };

  const saveResp = await fetch(saveUrl, {
    method: 'POST',
    headers: {
      ...defaultHeaders,
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': initUrl,
    },
    body: JSON.stringify(payload),
  });

  const saveJson = await saveResp.json();
  const newQtn = saveJson.NewQuotaioonNumber || saveJson.NewQuotationNumber;
  if (!newQtn) {
    throw new Error(`QuotationCondition Save failed: ${JSON.stringify(saveJson)}`);
  }

  // Small delay
  await new Promise((r) => setTimeout(r, 400));

  // STEP 3: Load detail page & Search
  const detailUrl = `${BASE_PORTAL_URL}/QuotationDetails/Index?strQUTN=${newQtn}&strQutnSubNo=0&DBCode=${db_code}`;
  await fetch(detailUrl, { method: 'GET', headers: defaultHeaders });

  const searchUrl = `${BASE_PORTAL_URL}/QuotationDetails/Search`;
  await fetch(searchUrl, {
    method: 'POST',
    headers: {
      ...defaultHeaders,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': detailUrl,
    },
    body: new URLSearchParams({ qtno: newQtn, subqtno: '0', DBCode: db_code }).toString(),
  });

  // STEP 4: Add New Parts
  const addUrl = `${BASE_PORTAL_URL}/QuotationDetails/AddNewParts`;
  const newPartsPayload = parts.map((p) => ({
    RequestedPartNo: String(p.part_no || p.partNumber).trim(),
    Requested_Quantity: String(p.quantity || p.Requested_Quantity || 1).trim(),
    Unit_Price: '0',
    Discount: '0',
    CTO: 'ZZ',
    DCOD: db_code,
  }));

  const addData = new URLSearchParams({
    userID: user_id,
    strNewParts: JSON.stringify(newPartsPayload),
    page: '',
  });

  const addResp = await fetch(addUrl, {
    method: 'POST',
    headers: {
      ...defaultHeaders,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': detailUrl,
    },
    body: addData.toString(),
  });

  if (addResp.status !== 200) {
    throw new Error(`AddNewParts failed with status: ${addResp.status}`);
  }

  // STEP 5: Update Details
  const updateUrl = `${BASE_PORTAL_URL}/QuotationDetails/UpdateDetails`;
  const updateData = new URLSearchParams({
    userID: user_id,
    currency: 'USD',
    tax: '0.00',
    nameOfOtherCharges1: '',
    nameOfOtherCharges2: '',
    otherCharges1: '0.00',
    otherCharges2: '0.00',
    sellingPrice: '0.00',
    shippingCharges: '0.00',
  });

  const updResp = await fetch(updateUrl, {
    method: 'POST',
    headers: {
      ...defaultHeaders,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': detailUrl,
    },
    body: updateData.toString(),
  });

  if (updResp.status !== 200) {
    throw new Error(`UpdateDetails failed with status: ${updResp.status}`);
  }

  return {
    status: 'SUCCESS',
    quotation_no: newQtn,
    db_order_no,
    model_code,
    serial_no,
    customer: customer_detail,
    parts,
  };
}

async function searchQuotations(filters = {}, customCookie = null) {
  const cookieStr = customCookie ? parseCookieInput(customCookie) : loadCookie();
  if (!cookieStr) {
    throw new Error('No PDX session cookie configured.');
  }

  const {
    status = '1',
    customerCode = '',
    fromDate = '',
    toDate = '',
    quotationNo = '',
    dbOrderNo = '',
    salesOrderNo = '',
    personIncharge = '',
    page = '1',
    limit = '100',
  } = filters;

  const targetLimit = parseInt(limit, 10) || 100;
  const maxPages = Math.min(10, Math.ceil(targetLimit / 10));
  const startPage = parseInt(page, 10) || 1;

  const defaultHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'Accept': '*/*',
    'X-Requested-With': 'XMLHttpRequest',
    'Origin': 'https://www.komatsu.ae',
    'Referer': `${BASE_PORTAL_URL}/Inquiry/Index`,
    'Cookie': cookieStr,
  };

  const quotations = [];
  const seenQtns = new Set();

  for (let p = startPage; p < startPage + maxPages; p++) {
    const url = `${BASE_PORTAL_URL}/Inquiry/SearchResult`;
    const bodyData = new URLSearchParams({
      QuotationNo: quotationNo,
      QuotationSubNo: '',
      DistributerOrderNo: dbOrderNo,
      SalesOrderNo: salesOrderNo,
      Status: status,
      FromDate: fromDate,
      ToDate: toDate,
      PersonIncharge: personIncharge,
      CustomerCode: customerCode,
      page: String(p),
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: defaultHeaders,
        body: bodyData.toString(),
      });

      const text = await response.text();
      const trMatches = text.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
      let pageRowsCount = 0;

      for (const tr of trMatches) {
        const tdMatches = tr.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
        if (tdMatches.length < 9) continue;

        const cleanTds = tdMatches.map((td) => {
          let txt = td.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').trim();
          return txt.replace(/\s+/g, ' ');
        });

        const qtnNo = cleanTds[0] || '';
        if (!qtnNo || isNaN(Number(qtnNo)) || seenQtns.has(qtnNo)) continue;

        seenQtns.add(qtnNo);
        pageRowsCount++;

        quotations.push({
          quotation_no: qtnNo,
          revision_no: cleanTds[1] || '00',
          sales_order_no: cleanTds[2] || '',
          db_order_no: cleanTds[3] || '',
          db_code: cleanTds[4] || '536K',
          customer_code: cleanTds[5] || '',
          customer_name: cleanTds[6] || '',
          person_in_charge: cleanTds[7] || '',
          status: cleanTds[8] || '',
          total_amount: cleanTds[9] || '0.00',
        });

        if (quotations.length >= targetLimit) break;
      }

      if (pageRowsCount === 0 || quotations.length >= targetLimit) {
        break;
      }
    } catch {
      break;
    }
  }

  return {
    total: quotations.length,
    status_filter: status,
    limit: targetLimit,
    quotations,
  };
}

async function confirmQuotation(quotationNo, seqNo = '00', customCookie = null) {
  const cookieStr = customCookie ? parseCookieInput(customCookie) : loadCookie();
  if (!cookieStr) {
    throw new Error('No PDX session cookie configured.');
  }

  const defaultHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0',
    'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
    'Origin': 'https://www.komatsu.ae',
    'Connection': 'close',
    'Cookie': cookieStr,
  };

  const qtn = String(quotationNo).trim();
  const seq = String(seqNo || '00').trim();

  // STEP 1: Ensure Quotation Details are loaded and calculated in session
  // (non-blocking — errors here do not fail the confirm; they just pre-warm the session)
  try {
    const detailUrl = `${BASE_PORTAL_URL}/QuotationDetails/Index?strQUTN=${qtn}&strQutnSubNo=${seq}&DBCode=536K`;
    await fetch(detailUrl, { method: 'GET', headers: defaultHeaders });

    // Correct field names confirmed from live API inspection
    const searchUrl = `${BASE_PORTAL_URL}/QuotationDetails/Search`;
    await fetch(searchUrl, {
      method: 'POST',
      headers: {
        ...defaultHeaders,
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': detailUrl,
      },
      body: new URLSearchParams({
        strQuotationNo: qtn,
        strQuotSeqNo: seq,
        DBCode: '536K',
        page: '1',
        pageSize: '50',
        group: '',
        filter: '',
      }).toString(),
    });

    // UpdateDetails returns empty string "" — just call it to warm up session
    const updateUrl = `${BASE_PORTAL_URL}/QuotationDetails/UpdateDetails`;
    await fetch(updateUrl, {
      method: 'POST',
      headers: {
        ...defaultHeaders,
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': detailUrl,
      },
      body: new URLSearchParams({
        strQuotationNo: qtn,
        strQuotSeqNo: seq,
        DBCode: '536K',
      }).toString(),
    });
  } catch {
    // Non-blocking detail refresh — safe to ignore
  }

  // STEP 2: Search QuotationCondition to load fresh state & TimeStamp
  const condSearchUrl = `${BASE_PORTAL_URL}/QuotationCondition/Search`;
  const condSearchData = new URLSearchParams({
    strQuotationNo: qtn,
    strQuotSeqNo: seq,
    DBCode: '536K',
  });

  const searchResp = await fetch(condSearchUrl, {
    method: 'POST',
    headers: {
      ...defaultHeaders,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': `${BASE_PORTAL_URL}/QuotationCondition/Index?strQUTN=${qtn}&strQutnSubNo=${seq}&DBCode=536K`,
    },
    body: condSearchData.toString(),
  });

  const searchText = await searchResp.text();
  console.log(`[confirmQuotation] ${qtn} CondSearch status=${searchResp.status} bodyLen=${searchText.length} isHTML=${searchText.includes('<html')}`);
  
  let searchData;
  try {
    searchData = JSON.parse(searchText);
  } catch (parseErr) {
    console.error(`[confirmQuotation] ${qtn} CondSearch parse error. First 500 chars:`, searchText.substring(0, 500));
    throw new Error(`QuotationCondition/Search returned non-JSON (status ${searchResp.status}). Session may be expired.`);
  }

  const timestamp = searchData.TimeStamp || '';
  console.log(`[confirmQuotation] ${qtn} timestamp=${timestamp} status=${JSON.stringify(searchData.Status)}`);

  let rates = searchData.Rates || searchData.lstRates || [];
  if (!rates || rates.length === 0) {
    rates = ['A', 'B', 'C', 'D', 'DA', 'E', 'F', 'NA', 'Other', 'S'].map((grp) => ({
      QuotationNo: qtn,
      QuotationSubNo: seq,
      RateType: '1',
      CommodityGroupCode: grp,
      RateValue: '0.00',
    }));
  }

  // STEP 3: Save with Status = '2' (Confirmed)
  const saveUrl = `${BASE_PORTAL_URL}/QuotationCondition/Save`;
  const savePayload = {
    objQuotationConditionPostModel: {
      OrigQuotationNo: qtn,
      OrigQuotationSeqNo: seq,
      QuotationNo: qtn,
      QuotationSeqNo: seq,
      DistributerOrderNo: searchData.DistributerOrderNo || '',
      DistributerCodes: '536K',
      DistributerName: searchData.DistributerName || 'DAR AL HAI',
      SalesPriceList: 'USD037',
      Currency: 'USD',
      ExchangeRate: '1',
      OrderType: 'EO',
      Usance: '30',
      TaxRate: '0',
      Transportation: searchData.SelectedTransportationCode || 'RD',
      DeliveryTerms: 'DDU',
      PaymentTerms: 'T2',
      OrderPRobability: 'A',
      Region: 'AE',
      Status: '2', // 2 = Confirmed
      LoadingPort: 'JEA',
      UnloadingPort: 'KWI',
      PersonIncharge: 'motasemgha',
      QuotationValidity: searchData.QuotationValidity || '08/29/2026',
      RequestedDeliveryTime: searchData.RequestedDeliveryTime || '08/22/2026',
      PriceCalculationMethod: 'D',
      DiscountRateOther: '0',
      PremiumRate: '13.3',
      BillingRateA: '0',
      BillingRateB: '0',
      BillingRateC: '0',
      BillingRateD: '0',
      BillingRateE: '0',
      BillingRateF: '0',
      ShipToAddress: searchData.ShipToAddress || 'DAR AL HAI\nKUWAIT GENERAL TRADING. Al-Rai Industrial Area Plot # 1732 Block # 2 Street # 4 Behind the Avenues Kuwait',
      AvailableMark: true,
      UseHSCode: false,
      ReserverStock: false,
      DontConsiderEORes: false,
      FixPrice: false,
      Memo: '',
      Comments: searchData.Comments || 'Urgent',
      ModelCode: searchData.ModelCode || 'PC500LC-10R',
      SerialNo: searchData.SerialNo || '100433',
      EngineSrNo: '-',
      CustomerDetails: searchData.CustomerDetails || 'DAR AL HAI',
      ModelInfoMark: true,
      jobCard: '',
      Warranty: '',
      TSINumber: '',
      ModelSVREMark: false,
      ExitPoint: 'JEA',
      CustomerCode: searchData.SavedCustomerCode || 'REG',
      lstRates: rates,
      MarkingCode: 'MCOIL',
      TimeStamp: timestamp,
    },
  };

  const saveResp = await fetch(saveUrl, {
    method: 'POST',
    headers: {
      ...defaultHeaders,
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': `${BASE_PORTAL_URL}/QuotationCondition/Index?strQUTN=${qtn}&strQutnSubNo=${seq}&DBCode=536K`,
    },
    body: JSON.stringify(savePayload),
  });

  const saveText = await saveResp.text();
  console.log(`[confirmQuotation] ${qtn} Save status=${saveResp.status} bodyLen=${saveText.length}`);

  let saveJson;
  try {
    saveJson = JSON.parse(saveText);
  } catch (parseErr) {
    console.error(`[confirmQuotation] ${qtn} Save parse error. First 500 chars:`, saveText.substring(0, 500));
    throw new Error(`QuotationCondition/Save returned non-JSON (status ${saveResp.status}). Session may be expired.`);
  }

  console.log(`[confirmQuotation] ${qtn} Save result: ErrorOccured=${saveJson.ErrorOccured}(${typeof saveJson.ErrorOccured}) RecordUpdated=${saveJson.RecordUpdated}(${typeof saveJson.RecordUpdated}) ErrorMessage=${saveJson.ErrorMessage}`);

  const hasError = saveJson.ErrorOccured && Number(saveJson.ErrorOccured) !== 0;
  const isUpdated = Number(saveJson.RecordUpdated) === 1 || Number(saveJson.OperationSuccessful) === 1;

  if (hasError && !isUpdated) {
    throw new Error(saveJson.ErrorMessage || 'Failed to update quotation status to Confirmed');
  }

  return {
    status: 'CONFIRMED',
    quotation_no: qtn,
    db_order_no: searchData.DistributerOrderNo,
    timestamp,
    raw_response: saveJson,
  };
}

async function copyQuotationToSo(quotationNo, seqNo = '00', options = {}, customCookie = null) {
  const cookieStr = customCookie ? parseCookieInput(customCookie) : loadCookie();
  if (!cookieStr) {
    throw new Error('No PDX session cookie configured.');
  }

  const defaultHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0',
    'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
    'Origin': 'https://www.komatsu.ae',
    'Connection': 'close',
    'Cookie': cookieStr,
  };

  // STEP 1: Inquiry/CopyToSO
  const copyUrl = `${BASE_PORTAL_URL}/Inquiry/CopyToSO`;
  const copyResp = await fetch(copyUrl, {
    method: 'POST',
    headers: {
      ...defaultHeaders,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': `${BASE_PORTAL_URL}/Inquiry/Index`,
    },
    body: new URLSearchParams({ strQutn: quotationNo, strQuto: seqNo }).toString(),
  });

  const copyJson = await copyResp.json();
  const hasCopyError = copyJson.ErrorOccured && Number(copyJson.ErrorOccured) !== 0;
  if (hasCopyError) {
    throw new Error(copyJson.ErrorMessage || 'CopyToSO pre-check failed');
  }

  // STEP 2: CheckConsumedLines
  const chkUrl = `${BASE_PORTAL_URL}/CopyToSO/CheckConsumedLines`;
  await fetch(chkUrl, {
    method: 'POST',
    headers: {
      ...defaultHeaders,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': `${BASE_PORTAL_URL}/CopyToSO/CopyToSOView?strQUTN=${quotationNo}&strQUTO=${seqNo}`,
    },
    body: new URLSearchParams({ strQuotationNumber: quotationNo, strQuotationSubNumber: seqNo }).toString(),
  });

  // STEP 3: CopyTOSOConversion
  const convUrl = `${BASE_PORTAL_URL}/CopyToSO/CopyTOSOConversion`;
  const convData = new URLSearchParams({
    QuotationNo: quotationNo,
    QuotationSubNo: String(parseInt(seqNo, 10) || 0),
    ddlBODSSelectedVal: String(options.bods || '1'),
    chkPickingAllowed: 'true',
    chkMixPackingAllowed: 'true',
    chkPartialShipmentAllowed: 'true',
  });

  const convResp = await fetch(convUrl, {
    method: 'POST',
    headers: {
      ...defaultHeaders,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': `${BASE_PORTAL_URL}/CopyToSO/CopyToSOView?strQUTN=${quotationNo}&strQUTO=${seqNo}`,
    },
    body: convData.toString(),
  });

  const convText = await convResp.text();

  if (convText.includes('txtErrorType = "0"') || convText.includes('error.png') || convText.includes('An error occurred')) {
    const errMatch = convText.match(/txtError\s*=\s*"([^"]+)"/);
    throw new Error(errMatch ? errMatch[1] : 'Copy to SO conversion failed on PDX portal');
  }

  return {
    status: 'COPIED_TO_SO',
    quotation_no: quotationNo,
    message: 'Quotation successfully transferred to Sales Order',
  };
}

module.exports = {
  loadFleetData,
  addCustomMachine,
  lookupPartMaster,
  getLatestDbOrderNo,
  executeSingleEmergencyOrder,
  searchQuotations,
  confirmQuotation,
  copyQuotationToSo,
};
