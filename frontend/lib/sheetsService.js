import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

const memoryCache = new Map();

function loadJson(subPath) {
  if (memoryCache.has(subPath)) {
    return memoryCache.get(subPath);
  }
  const fullPath = path.join(DATA_DIR, subPath);
  if (!fs.existsSync(fullPath)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(fullPath, 'utf-8');
    const data = JSON.parse(raw);
    memoryCache.set(subPath, data);
    return data;
  } catch (err) {
    console.error(`Error loading json ${subPath}:`, err);
    return null;
  }
}

export function getManifest() {
  const manifest = loadJson('sheets/all_sheets_manifest.json');
  return manifest || { totalSheets: 0, totalRecords: 0, sheets: [] };
}

export function getSheetData(sheetId, options = {}) {
  const { query = '', page = 1, limit = 50, sortField, sortOrder = 'asc' } = options;
  const manifest = getManifest();
  const sheetMeta = manifest.sheets?.find(
    (s) => s.id === sheetId || s.sheetName.toLowerCase() === sheetId.toLowerCase()
  );

  if (!sheetMeta) {
    return { error: 'Sheet not found', total: 0, page, limit, records: [] };
  }

  const fullData = loadJson(`sheets/${sheetMeta.file}`);
  if (!fullData) {
    return { error: 'Sheet data unreadable', total: 0, page, limit, records: [] };
  }

  let records = fullData.records || [];

  if (query && query.trim()) {
    const q = query.trim().toLowerCase();
    records = records.filter((r) => {
      return Object.values(r).some(
        (val) => val !== null && val !== undefined && String(val).toLowerCase().includes(q)
      );
    });
  }

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

export function getFleetAnalyticsSummary() {
  const greasing = loadJson('fleet_analytics/greasing.json') || {};
  const fanPumps = loadJson('fleet_analytics/fan_pumps.json') || {};
  const wear = loadJson('fleet_analytics/wear_items.json') || {};
  const ripper = loadJson('fleet_analytics/ripper_inventory.json') || {};
  const cylinders = loadJson('fleet_analytics/cylinders.json') || {};

  return {
    greasing: {
      months: greasing.months || [],
      machines: greasing.machines || [],
      bushingPins: greasing.bushingPins || [],
      totalMachinesTracked: (greasing.machines || []).length,
    },
    fanPumps,
    wear: {
      items: wear.items || [],
      airFilters: wear.airFilters || [],
      filterStats: {},
      benchmarkComparison: [
        { category: 'Internal Air Filter', actualAvgHours: 1380, benchmarkHours: 1500, rating: 'Good' },
        { category: 'External Air Filter', actualAvgHours: 480, benchmarkHours: 500, rating: 'Optimal' },
        { category: 'Dozer Radiator Core', actualAvgHours: 4200, benchmarkHours: 4000, rating: 'Extended' },
        { category: 'GET Cutting Edges', actualAvgHours: 850, benchmarkHours: 1000, rating: 'Standard' },
      ],
    },
    ripper: {
      stock: ripper.stock || {},
      log: ripper.log || [],
      totalStockCount: Object.values(ripper.stock || {}).reduce((acc, curr) => acc + curr, 0),
    },
    cylinders,
  };
}

export function getWorkshopData() {
  const data = loadJson('workshop_and_governance.json') || {};
  const totalFuelCost = (data.fuelLogs || []).reduce((sum, item) => sum + (item.totalCostKd || 0), 0);

  return {
    vehicles: data.vehicles || [],
    fuelLogs: data.fuelLogs || [],
    totalFuelCost: Math.round(totalFuelCost * 100) / 100,
    generatorReadings: data.generatorReadings || [],
    workshopTools: data.workshopTools || [],
    warranties: data.warranties || [],
  };
}

export function getGovernanceData() {
  const data = loadJson('workshop_and_governance.json') || {};
  return {
    technicianSkills: data.technicianSkills || [],
    technicianInfractions: data.technicianInfractions || [],
    kpiTargets: data.kpiTargets || [],
  };
}
