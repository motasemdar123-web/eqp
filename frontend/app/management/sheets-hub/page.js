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
  { id: 'ALL', label: 'All 34 Sheets', count: 34, icon: '📂' },
  { id: 'Parts & Warehouse', label: 'Parts & SAP', count: 7, icon: '📦' },
  { id: 'Fleet & Operations', label: 'Fleet & Operations', count: 12, icon: '🚜' },
  { id: 'Workshop & Vehicles', label: 'Workshop & Fleet', count: 5, icon: '🚗' },
  { id: 'Workforce & Management', label: 'Workforce & KPIs', count: 6, icon: '👥' },
  { id: 'Customers & BP', label: 'Customers & BP', count: 1, icon: '🏢' },
  { id: 'General Reference', label: 'Reference & Links', count: 3, icon: '🔗' },
];

export default function MasterSheetsHubPage() {
  const [manifest, setManifest] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedSheetId, setSelectedSheetId] = useState('sap_query');
  const [loadingManifest, setLoadingManifest] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [sheetData, setSheetData] = useState(null);
  const [toast, setToast] = useState(null);

  // Search, Sort & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [copiedText, setCopiedText] = useState(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 200);
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

  function copyToClipboard(text) {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopiedText(String(text));
    setToast({ type: 'success', message: `Copied "${text}" to clipboard` });
    setTimeout(() => setCopiedText(null), 2000);
  }

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
  }

  return (
    <SystemShell
      activePath="/management/sheets-hub"
      eyebrow="Master Data Lake & Spreadsheet Archive"
      title="Master Sheets & Enterprise Data Explorer"
      description="Instant search, filtering, and export across all 34 operational datasets, 6,050 SAP parts, 822 Business Partners, and fleet registers."
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={exportToCsv}
            disabled={!sheetData?.records?.length}
            className="ds-button ds-button-secondary text-xs flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Export CSV</span>
          </button>
          <Link href="/management" className="ds-button ds-button-secondary text-xs">
            Management Hub
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Executive Stat Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="ds-card p-4 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold text-lg">
              34
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Sheets Ingested</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">100% Coverage</div>
            </div>
          </div>

          <div className="ds-card p-4 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg">
              9k+
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Records</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">9,171 Rows</div>
            </div>
          </div>

          <div className="ds-card p-4 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-lg">
              SAP
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">SAP Part Catalog</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">6,050 Parts</div>
            </div>
          </div>

          <div className="ds-card p-4 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-lg">
              BP
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Business Partners</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">822 Clients</div>
            </div>
          </div>
        </section>

        {/* Quick Jump Ribbon */}
        <section className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-4 rounded-xl shadow-md border border-slate-700/60 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400">⚡ Fast Lookups & Critical Datasets</div>
              <div className="text-[11px] text-slate-300">Click any key dataset below for immediate one-click browsing:</div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'sap_query', label: 'SAP Query (6,050)', icon: '🔍' },
                { id: 'customer_list', label: 'Customer BP (822)', icon: '🏢' },
                { id: 'people', label: 'Personnel & Contacts', icon: '📱' },
                { id: 'technicians_tools', label: 'Tool Custody', icon: '🧰' },
                { id: 'excavators_follow-up', label: 'Excavator Log', icon: '🚜' },
                { id: 'smr', label: 'Fleet SMR Matrix', icon: '⏱️' },
              ].map((quick) => (
                <button
                  key={quick.id}
                  onClick={() => {
                    setSelectedSheetId(quick.id);
                    setSearchQuery('');
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    selectedSheetId === quick.id
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                      : 'bg-white/10 text-slate-200 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  <span>{quick.icon}</span>
                  <span>{quick.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Control Bar: Category Pills + Sheet Selector + Live Search */}
        <section className="ds-card p-4 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-2">Categories:</span>
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
                      ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Selector & Search Form */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 items-center">
            {/* Sheet Selector */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                Sheet ({filteredSheets.length}):
              </label>
              <select
                value={selectedSheetId}
                onChange={(e) => {
                  setSelectedSheetId(e.target.value);
                  setSearchQuery('');
                  setPage(1);
                }}
                className="ds-input text-xs font-semibold py-2"
              >
                {filteredSheets.map((s) => (
                  <option key={s.id} value={s.id}>
                    [{s.index}] {s.sheetName} ({s.totalRows} rows) — {s.category}
                  </option>
                ))}
              </select>
            </div>

            {/* Instant Search Bar */}
            <div className="relative min-w-[280px]">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder={`Search across ${currentSheetMeta?.sheetName || 'sheet'}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ds-input pl-9 text-xs py-2"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Limit Selector */}
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="ds-input text-xs py-2 w-28 font-mono"
            >
              <option value="25">25 / page</option>
              <option value="50">50 / page</option>
              <option value="100">100 / page</option>
              <option value="200">200 / page</option>
            </select>
          </div>
        </section>

        {/* Data Grid Table Card */}
        <Card className="overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xs">
          {/* Table Header Bar */}
          <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {sheetData?.sheetName || currentSheetMeta?.sheetName || 'Sheet Data'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {sheetData?.category || currentSheetMeta?.category || 'Dataset'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Showing <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{sheetData?.records?.length || 0}</span> of{' '}
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{sheetData?.total || 0}</span> records
                {debouncedQuery && <span> for query &ldquo;<span className="font-bold text-amber-600">{debouncedQuery}</span>&rdquo;</span>}
              </p>
            </div>

            {/* Pagination Mini Buttons */}
            {sheetData?.totalPages > 1 && (
              <div className="flex items-center gap-1 text-xs font-mono">
                <button
                  disabled={page <= 1 || loadingData}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50"
                >
                  ‹ Prev
                </button>
                <span className="px-2 text-slate-600 dark:text-slate-400 font-semibold">
                  {page} / {sheetData.totalPages}
                </span>
                <button
                  disabled={page >= sheetData.totalPages || loadingData}
                  onClick={() => setPage((p) => Math.min(sheetData.totalPages, p + 1))}
                  className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50"
                >
                  Next ›
                </button>
              </div>
            )}
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto max-h-[620px] overflow-y-auto">
            {loadingData ? (
              <div className="p-8 space-y-3">
                <Skeleton className="h-9 w-full rounded-lg" />
                <Skeleton className="h-8 w-full rounded-lg" />
                <Skeleton className="h-8 w-full rounded-lg" />
                <Skeleton className="h-8 w-full rounded-lg" />
                <Skeleton className="h-8 w-full rounded-lg" />
              </div>
            ) : !sheetData?.records?.length ? (
              <div className="text-center py-16 text-slate-400">
                <div className="text-3xl mb-2">🔍</div>
                <div className="text-sm font-bold text-slate-700 dark:text-slate-300">No matching records found</div>
                <div className="text-xs text-slate-500 mt-1">Try clearing your search query or choosing another sheet.</div>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse min-w-[850px]">
                <thead className="sticky top-0 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-xs z-10">
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3 w-12 text-center text-slate-400 font-mono">#</th>
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
                        className="py-2.5 px-3.5 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-all select-none whitespace-nowrap"
                      >
                        <div className="flex items-center gap-1.5">
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
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px] font-sans">
                  {sheetData.records.map((row, rowIdx) => (
                    <tr key={rowIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-2.5 px-3 text-center text-slate-400 text-[10px] font-mono">
                        {(page - 1) * limit + rowIdx + 1}
                      </td>
                      {(sheetData.headers || []).map((header, colIdx) => {
                        const cellVal = row[header];
                        const isNull = cellVal === null || cellVal === undefined || String(cellVal).trim() === '';
                        const isQueryText = String(header).toLowerCase().includes('query') || String(cellVal).includes('SELECT');

                        return (
                          <td
                            key={colIdx}
                            className="py-2.5 px-3.5 text-slate-800 dark:text-slate-200 whitespace-nowrap max-w-sm truncate"
                            title={!isNull ? String(cellVal) : ''}
                          >
                            {isNull ? (
                              <span className="text-slate-300 dark:text-slate-600">-</span>
                            ) : isQueryText ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => copyToClipboard(cellVal)}
                                  className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 hover:text-amber-800 text-[10px] font-mono border border-slate-200 dark:border-slate-700 transition-all"
                                >
                                  📋 Copy SQL
                                </button>
                                <span className="font-mono text-[10px] text-slate-500 truncate max-w-xs">{String(cellVal).slice(0, 40)}...</span>
                              </div>
                            ) : (
                              <span className="font-mono">{String(cellVal)}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Bottom Pagination Bar */}
          {sheetData?.totalPages > 1 && (
            <div className="p-3.5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">
                Showing rows <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{(page - 1) * limit + 1}</span> -{' '}
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{Math.min(page * limit, sheetData.total)}</span> of{' '}
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{sheetData.total}</span>
              </span>

              <div className="flex items-center gap-1.5 font-mono">
                <button
                  disabled={page <= 1 || loadingData}
                  onClick={() => setPage(1)}
                  className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-50"
                  title="First Page"
                >
                  «
                </button>
                <button
                  disabled={page <= 1 || loadingData}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 font-sans font-semibold text-xs"
                >
                  Previous
                </button>
                <span className="px-2 font-bold text-slate-800 dark:text-slate-200">
                  {page} / {sheetData.totalPages}
                </span>
                <button
                  disabled={page >= sheetData.totalPages || loadingData}
                  onClick={() => setPage((p) => Math.min(sheetData.totalPages, p + 1))}
                  className="px-3 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 font-sans font-semibold text-xs"
                >
                  Next
                </button>
                <button
                  disabled={page >= sheetData.totalPages || loadingData}
                  onClick={() => setPage(sheetData.totalPages)}
                  className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-50"
                  title="Last Page"
                >
                  »
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
