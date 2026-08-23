'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import SystemShell from '../../../components/SystemShell';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Skeleton from '../../../components/ui/Skeleton';
import Toast from '../../../components/ui/Toast';
import { getSheetsManifest, getSheetData } from '../../../lib/api';

const CATEGORIES = [
  { id: 'ALL', label: 'All 34 Sheets', icon: '📂' },
  { id: 'Parts & Warehouse', label: 'Parts & Warehouse', icon: '📦' },
  { id: 'Fleet & Operations', label: 'Fleet & Operations', icon: '🚜' },
  { id: 'Workshop & Vehicles', label: 'Workshop & Vehicles', icon: '🚗' },
  { id: 'Workforce & Management', label: 'Workforce & Management', icon: '👥' },
  { id: 'Customers & BP', label: 'Customers & BP', icon: '🏢' },
  { id: 'General Reference', label: 'General Reference', icon: '🔗' },
];

export default function MasterSheetsHubPage() {
  const [manifest, setManifest] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedSheetId, setSelectedSheetId] = useState('sap_query');
  const [loadingManifest, setLoadingManifest] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [sheetData, setSheetData] = useState(null);
  const [toast, setToast] = useState(null);

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load manifest on mount
  useEffect(() => {
    async function loadManifest() {
      try {
        setLoadingManifest(true);
        const res = await getSheetsManifest();
        setManifest(res.data || { sheets: [] });
      } catch (err) {
        setToast({ type: 'error', message: err.message || 'Failed to load sheets manifest.' });
      } finally {
        setLoadingManifest(false);
      }
    }
    loadManifest();
  }, []);

  // Load sheet data
  useEffect(() => {
    if (!selectedSheetId) return;
    let ignore = false;

    async function loadData() {
      try {
        setLoadingData(true);
        const res = await getSheetData(selectedSheetId, {
          query: debouncedQuery,
          page,
          limit,
          sortField,
          sortOrder,
        });
        if (!ignore) {
          setSheetData(res.data || null);
        }
      } catch (err) {
        if (!ignore) {
          setToast({ type: 'error', message: err.message || `Failed to load ${selectedSheetId} data.` });
        }
      } finally {
        if (!ignore) setLoadingData(false);
      }
    }

    loadData();
    return () => { ignore = true; };
  }, [selectedSheetId, debouncedQuery, page, limit, sortField, sortOrder]);

  const sheets = manifest?.sheets || [];

  const filteredSheets = useMemo(() => {
    if (selectedCategory === 'ALL') return sheets;
    return sheets.filter((s) => s.category === selectedCategory);
  }, [sheets, selectedCategory]);

  const currentSheetMeta = useMemo(() => {
    return sheets.find((s) => s.id === selectedSheetId) || null;
  }, [sheets, selectedSheetId]);

  // CSV Export Handler
  function exportToCsv() {
    if (!sheetData?.records || sheetData.records.length === 0) return;
    const headers = sheetData.headers || Object.keys(sheetData.records[0]);
    const csvRows = [];
    csvRows.push(headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(','));

    sheetData.records.forEach((row) => {
      const values = headers.map((h) => {
        const val = row[h] ?? '';
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${sheetData.id || 'sheet_export'}_page${page}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToast({ type: 'success', message: 'CSV downloaded successfully!' });
  }

  return (
    <SystemShell
      activePath="/management/sheets-hub"
      eyebrow="Enterprise Master Data Lake"
      title="Master Spreadsheet & Enterprise Data Explorer"
      description="100% complete embedded data lake across all 34 operational sheets, including 6,050 SAP parts, 822 Business Partners, contacts, and tool registers."
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={exportToCsv}
            disabled={!sheetData?.records?.length}
            className="ds-button ds-button-secondary text-xs flex items-center gap-1"
          >
            <span>📥</span> Export CSV
          </button>
          <Link href="/management" className="ds-button ds-button-secondary text-xs">
            Dashboard
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* KPI Header Bar */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Sheets Ingested</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {loadingManifest ? <Skeleton className="h-7 w-12" /> : manifest?.totalSheets || 34}
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">100% full workbook coverage</div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Total Active Records</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {loadingManifest ? <Skeleton className="h-7 w-20" /> : manifest?.totalRecords?.toLocaleString() || '9,000+'}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">Fast indexed memory cache</div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">SAP Parts Query Records</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">6,050</div>
            <div className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Instant part number lookup</div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Customer BP Directory</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">822</div>
            <div className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">Business partner master list</div>
          </div>
        </section>

        {/* Quick Jump Shortcuts */}
        <section className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
            ⚡ Quick Jump to High-Value Datasets
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'sap_query', label: 'SAP Parts Master (6,050)', icon: '🔍' },
              { id: 'customer_list', label: 'Customer BP Codes (822)', icon: '🏢' },
              { id: 'people', label: 'Contacts & People Directory', icon: '📱' },
              { id: 'technicians_tools', label: 'Technician Tool Custody', icon: '🧰' },
              { id: 'excavators_follow-up', label: 'Excavators Maintenance Log', icon: '🚜' },
              { id: '7th_follow-up', label: '7th Ring Follow-up', icon: '🏗️' },
              { id: 'smr', label: 'SMR Fleet Counters', icon: '⏱️' },
              { id: 'tracker_-_abdelrahman', label: 'Field Service Tracker', icon: '📋' },
              { id: 'spare_parts_check', label: 'Spare Parts Check', icon: '📦' },
              { id: 'links', label: 'Operational Links & Docs', icon: '🔗' },
            ].map((quick) => (
              <button
                key={quick.id}
                onClick={() => {
                  setSelectedSheetId(quick.id);
                  setSearchQuery('');
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  selectedSheetId === quick.id
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{quick.icon}</span>
                <span>{quick.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Category Pills & Sheet Selector */}
        <section className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    const firstInCat = cat.id === 'ALL' ? sheets[0] : sheets.find((s) => s.category === cat.id);
                    if (firstInCat) {
                      setSelectedSheetId(firstInCat.id);
                      setPage(1);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    active
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sheet Selector & Search Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                Select Sheet ({filteredSheets.length}):
              </label>
              <select
                value={selectedSheetId}
                onChange={(e) => {
                  setSelectedSheetId(e.target.value);
                  setSearchQuery('');
                  setPage(1);
                }}
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden font-semibold max-w-md w-full"
              >
                {filteredSheets.map((s) => (
                  <option key={s.id} value={s.id}>
                    [{s.index}] {s.sheetName} ({s.totalRows} rows) — {s.category}
                  </option>
                ))}
              </select>
            </div>

            {/* Universal Full-Text Search */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder={`Search in ${currentSheetMeta?.sheetName || 'sheet'}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3 py-2 pl-8 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden min-w-[260px]"
                />
                <span className="absolute left-2.5 top-2.5 text-xs text-slate-400">🔍</span>
              </div>

              {/* Rows Per Page */}
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden font-mono"
              >
                <option value="25">25 / page</option>
                <option value="50">50 / page</option>
                <option value="100">100 / page</option>
                <option value="200">200 / page</option>
              </select>
            </div>
          </div>
        </section>

        {/* Data Grid Card */}
        <Card className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {sheetData?.sheetName || currentSheetMeta?.sheetName || 'Sheet Data'}
                </h2>
                <Badge tone="live">{sheetData?.category || currentSheetMeta?.category || 'Dataset'}</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Showing {sheetData?.records?.length || 0} of {sheetData?.total || 0} matching records
                {debouncedQuery ? ` for query "${debouncedQuery}"` : ''}
              </p>
            </div>

            {/* Pagination Controls Top */}
            {sheetData?.totalPages > 1 && (
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <button
                  disabled={page <= 1 || loadingData}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  ← Prev
                </button>
                <span className="px-2 font-bold text-slate-700 dark:text-slate-300">
                  Page {page} of {sheetData.totalPages}
                </span>
                <button
                  disabled={page >= sheetData.totalPages || loadingData}
                  onClick={() => setPage((p) => Math.min(sheetData.totalPages, p + 1))}
                  className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Next →
                </button>
              </div>
            )}
          </div>

          {/* Table Container */}
          <div className="mt-4 overflow-x-auto max-h-[600px] overflow-y-auto">
            {loadingData ? (
              <div className="p-8 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : !sheetData?.records?.length ? (
              <div className="text-center py-12 text-slate-400">
                <div className="text-2xl mb-2">🔍</div>
                <div className="text-sm font-semibold">No records found</div>
                <div className="text-xs text-slate-500 mt-1">Try refining your search keyword or selecting another sheet.</div>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse min-w-[800px]">
                <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 z-10">
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold">
                    <th className="py-2.5 px-3 w-12 text-center text-slate-400">#</th>
                    {(sheetData.headers || []).map((header, idx) => (
                      <th
                        key={idx}
                        onClick={() => {
                          if (sortField === header) {
                            setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
                          } else {
                            setSortField(header);
                            setSortOrder('asc');
                          }
                        }}
                        className="py-2.5 px-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-all select-none whitespace-nowrap"
                      >
                        <div className="flex items-center gap-1">
                          <span>{header}</span>
                          {sortField === header && (
                            <span className="text-[10px] text-amber-500">
                              {sortOrder === 'asc' ? '▲' : '▼'}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                  {sheetData.records.map((row, rowIdx) => (
                    <tr key={rowIdx} className="hover:bg-amber-500/5 transition-colors">
                      <td className="py-2 px-3 text-center text-slate-400 text-[10px]">
                        {(page - 1) * limit + rowIdx + 1}
                      </td>
                      {(sheetData.headers || []).map((header, colIdx) => {
                        const cellVal = row[header];
                        return (
                          <td
                            key={colIdx}
                            className="py-2 px-3 text-slate-800 dark:text-slate-200 whitespace-nowrap max-w-xs truncate"
                            title={cellVal !== null && cellVal !== undefined ? String(cellVal) : ''}
                          >
                            {cellVal !== null && cellVal !== undefined ? String(cellVal) : '-'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Bottom Pagination */}
          {sheetData?.totalPages > 1 && (
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Showing rows {(page - 1) * limit + 1} - {Math.min(page * limit, sheetData.total)} of {sheetData.total}
              </span>
              <div className="flex items-center gap-1.5 font-mono">
                <button
                  disabled={page <= 1 || loadingData}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  ← Previous
                </button>
                <span className="px-2 font-bold text-slate-700 dark:text-slate-300">
                  {page} / {sheetData.totalPages}
                </span>
                <button
                  disabled={page >= sheetData.totalPages || loadingData}
                  onClick={() => setPage((p) => Math.min(sheetData.totalPages, p + 1))}
                  className="px-3 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </SystemShell>
  );
}
