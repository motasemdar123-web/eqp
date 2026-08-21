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

module.exports = {
  loadFleetData,
  addCustomMachine,
  lookupPartMaster,
  getLatestDbOrderNo,
  executeSingleEmergencyOrder,
};
