const fs = require('fs');
const path = require('path');

const SHEETS_DIR = path.join(__dirname, '../data/sheets');

// Cache in memory for lightning-fast search
const memoryCache = new Map();

function loadSheetJson(filename) {
  if (memoryCache.has(filename)) {
    return memoryCache.get(filename);
  }
  const filePath = path.join(SHEETS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    memoryCache.set(filename, data);
    return data;
  } catch (err) {
    console.error(`Error loading sheet json ${filename}:`, err);
    return null;
  }
}

function getManifest() {
  const manifest = loadSheetJson('all_sheets_manifest.json');
  return manifest || { totalSheets: 0, totalRecords: 0, sheets: [] };
}

function getSheetData(sheetId, options = {}) {
  const { query = '', page = 1, limit = 50, sortField, sortOrder = 'asc' } = options;
  const manifest = getManifest();
  const sheetMeta = manifest.sheets?.find(
    (s) => s.id === sheetId || s.sheetName.toLowerCase() === sheetId.toLowerCase()
  );

  if (!sheetMeta) {
    return { error: 'Sheet not found', total: 0, page, limit, records: [] };
  }

  const fullData = loadSheetJson(sheetMeta.file);
  if (!fullData) {
    return { error: 'Sheet data unreadable', total: 0, page, limit, records: [] };
  }

  let records = fullData.records || [];

  // Full-text search across all cell values
  if (query && query.trim()) {
    const q = query.trim().toLowerCase();
    records = records.filter((r) => {
      return Object.values(r).some((val) => val !== null && val !== undefined && String(val).toLowerCase().includes(q));
    });
  }

  // Sort
  if (sortField) {
    records.sort((a, b) => {
      const valA = a[sortField] ?? '';
      const valB = b[sortField] ?? '';
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'desc' ? valB - valA : valA - valB;
      }
      return sortOrder === 'desc'
        ? String(valB).localeCompare(String(valA))
        : String(valA).localeCompare(String(valB));
    });
  }

  const total = records.length;
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
  const startIndex = (p - 1) * l;
  const paginatedRecords = records.slice(startIndex, startIndex + l);

  return {
    sheetName: fullData.sheetName,
    id: fullData.id,
    category: fullData.category,
    headers: fullData.headers || [],
    total,
    page: p,
    limit: l,
    totalPages: Math.ceil(total / l),
    records: paginatedRecords,
  };
}

function searchSap(options = {}) {
  return getSheetData('sap_query', options);
}

function getCustomers(options = {}) {
  return getSheetData('customer_list', options);
}

function getPeopleDirectory(options = {}) {
  return getSheetData('people', options);
}

function getToolCustody(options = {}) {
  return getSheetData('technicians_tools', options);
}

module.exports = {
  getManifest,
  getSheetData,
  searchSap,
  getCustomers,
  getPeopleDirectory,
  getToolCustody,
};
