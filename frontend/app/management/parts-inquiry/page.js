'use client';

import { useEffect, useMemo, useState } from 'react';
import SystemShell from '../../../components/SystemShell';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Field from '../../../components/ui/Field';
import Toast from '../../../components/ui/Toast';
import EmptyState from '../../../components/ui/EmptyState';
import { getKomatsuStatus, saveKomatsuCookie, runKomatsuInquiry } from '../../../lib/api';

const SAMPLE_PARTS = [
  '6742-01-4540, 6',
  '600-319-3750, 6',
  '6261-31-2130, 2',
  '07143-10605, 4',
  '14X-27-11240, 1',
  '07000-12010, 10',
  '6732-71-6120, 3',
  '6754-11-7110, 2',
  '600-185-4100, 2',
  '20Y-26-22230, 1',
  '07000-13038, 8',
  '6735-61-1500, 1',
  '6215-61-1310, 2',
  '6743-81-8040, 1',
];

function parseInputText(text) {
  if (!text) return [];
  const lines = text.split('\n');
  const rows = [];

  for (let idx = 0; idx < lines.length; idx++) {
    const rawLine = lines[idx].trim();
    if (!rawLine) continue;

    // Split on comma, semicolon, or tab
    const tokens = rawLine
      .replace(/\t/g, ',')
      .replace(/;/g, ',')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (tokens.length === 0) continue;
    const partNo = tokens[0];

    // Skip header row if present
    if (['sn', 'part number', 'part no', 'part_number', 'item', 'part', 'number'].includes(partNo.toLowerCase())) {
      continue;
    }

    let qty = 1;
    if (tokens.length > 1) {
      const parsed = parseInt(tokens[1], 10);
      if (!Number.isNaN(parsed) && parsed > 0) qty = parsed;
    }

    rows.push({
      partNumber: partNo,
      quantity: qty,
      originalRow: idx + 1,
    });
  }

  return rows;
}

export default function PartsInquiryPage() {
  const [activeTab, setActiveTab] = useState('inquiry');
  const [status, setStatus] = useState({ connected: false, message: 'Checking PDX status...' });
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [cookieModalOpen, setCookieModalOpen] = useState(false);
  const [cookieInput, setCookieInput] = useState('');
  const [savingCookie, setSavingCookie] = useState(false);

  const [pastedText, setPastedText] = useState(SAMPLE_PARTS.join('\n'));
  const [parsedQueue, setParsedQueue] = useState([]);
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryProgress, setQueryProgress] = useState(null);
  const [results, setResults] = useState([]);
  const [toast, setToast] = useState(null);

  // Filters & Search
  const [searchFilter, setSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'MAIN' | 'IN_STOCK'

  useEffect(() => {
    loadConnectionStatus();
  }, []);

  useEffect(() => {
    const parsed = parseInputText(pastedText);
    setParsedQueue(parsed);
  }, [pastedText]);

  async function loadConnectionStatus() {
    try {
      setLoadingStatus(true);
      const res = await getKomatsuStatus();
      setStatus(res || { connected: false, message: 'Offline' });
    } catch (err) {
      setStatus({ connected: false, message: err.message || 'Unable to connect to PDX server' });
    } finally {
      setLoadingStatus(false);
    }
  }

  async function handleSaveCookie(e) {
    e.preventDefault();
    if (!cookieInput.trim()) {
      setToast({ type: 'error', message: 'Please paste your cookie string' });
      return;
    }

    try {
      setSavingCookie(true);
      const res = await saveKomatsuCookie(cookieInput.trim());
      setStatus(res);
      if (res.connected) {
        setToast({ type: 'success', message: 'PDX session authenticated successfully!' });
        setCookieModalOpen(false);
        setCookieInput('');
      } else {
        setToast({ type: 'error', message: res.message || 'Cookie verification failed' });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to save cookie' });
    } finally {
      setSavingCookie(false);
    }
  }

  function handleFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = String(e.target.result || '');
      setPastedText(content);
      setToast({ type: 'info', message: `Loaded file: ${file.name}` });
    };
    reader.readAsText(file);
  }

  async function executeInquiry() {
    if (parsedQueue.length === 0) {
      setToast({ type: 'error', message: 'Please provide at least one part number' });
      return;
    }

    try {
      setIsQuerying(true);
      const totalBatches = Math.ceil(parsedQueue.length / 12);
      setQueryProgress({
        currentBatch: 1,
        totalBatches,
        totalParts: parsedQueue.length,
      });

      const response = await runKomatsuInquiry(parsedQueue);
      if (response && response.results) {
        setResults(response.results);
        setToast({
          type: 'success',
          message: `Inquiry completed: ${response.results.length} total item records retrieved (${response.totalBatches} batches).`,
        });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Inquiry query failed' });
    } finally {
      setIsQuerying(false);
      setQueryProgress(null);
    }
  }

  // Filtered results
  const filteredResults = useMemo(() => {
    const query = searchFilter.trim().toLowerCase();
    return results.filter((item) => {
      const matchesSearch =
        !query ||
        item.partNumber?.toLowerCase().includes(query) ||
        item.rawPartNumber?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.lpn?.toLowerCase().includes(query);

      const matchesType =
        typeFilter === 'ALL' ||
        (typeFilter === 'MAIN' && !item.isAlternative) ||
        (typeFilter === 'IN_STOCK' && Number(item.kmeStock || 0) > 0);

      return matchesSearch && matchesType;
    });
  }, [results, searchFilter, typeFilter]);

  // Summary Metrics
  const stats = useMemo(() => {
    const totalRecords = results.length;
    const mainParts = results.filter((r) => !r.isAlternative).length;
    const alternativeParts = results.filter((r) => r.isAlternative).length;
    const inStockKme = results.filter((r) => Number(r.kmeStock || 0) > 0).length;
    const totalValue = results.reduce((acc, r) => acc + Number(r.dnetPrice || 0) * Number(r.requestedQty || 1), 0);

    return {
      totalRecords,
      mainParts,
      alternativeParts,
      inStockKme,
      totalValue: totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    };
  }, [results]);

  // Export CSV
  function downloadCsv() {
    if (results.length === 0) return;
    const headers = [
      'Item Type',
      'Part Number',
      'Requested Qty',
      'Description',
      'Latest Part Number (LPN)',
      'KME Stock',
      'DNet Price (USD)',
      'KME On Order',
      'KME EOR',
      'Weight (gm)',
      'KLTD Lead Time (wks)',
      'Character Code (CC)',
      'Interchangeable Code (IC)',
      'Regional Inventory',
      'KLTD Japan Total',
      'KMEQA Stock',
    ];

    const rows = results.map((r) => [
      `"${r.itemType || ''}"`,
      `"${r.partNumber || ''}"`,
      r.requestedQty || 1,
      `"${(r.description || '').replace(/"/g, '""')}"`,
      `"${r.lpn || ''}"`,
      r.kmeStock || 0,
      r.dnetPrice || 0,
      r.onOrder || 0,
      `"${r.eor || ''}"`,
      r.weight || 0,
      `"${r.leadTime || ''}"`,
      `"${r.characterCode || ''}"`,
      `"${r.interchangeableCode || ''}"`,
      `"${r.regionalInventory || ''}"`,
      r.kltdTotal || 0,
      r.kmeqa || 0,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `komatsu-pdx-inquiry-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setToast({ type: 'success', message: 'CSV report downloaded.' });
  }

  // Split into 12-item CSV batches
  function download12ItemBatches() {
    if (parsedQueue.length === 0) return;
    const batches = [];
    for (let i = 0; i < parsedQueue.length; i += 12) {
      batches.push(parsedQueue.slice(i, i + 12));
    }

    batches.forEach((batch, bIdx) => {
      const csv = '\uFEFF' + ['Part Number,Quantity', ...batch.map((p) => `"${p.partNumber}",${p.quantity}`)].join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pdx-batch-${bIdx + 1}-of-${batches.length}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    });

    setToast({ type: 'success', message: `Downloaded ${batches.length} batch CSV files.` });
  }

  return (
    <SystemShell
      activePath="/management/parts-inquiry"
      eyebrow="KOMATSU PDX HUB"
      title="Parts Stock & Price Inquiry"
      description="Automate multi-part inquiries without the 12-item limit. Query live stock across KME & Japan warehouses, verify interchangeable parts, and export consolidated reports."
      actions={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={status.connected ? 'secondary' : 'primary'}
            size="sm"
            onClick={() => setCookieModalOpen(true)}
          >
            <span className={`h-2 w-2 rounded-full mr-1.5 ${status.connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {status.connected ? 'PDX Connected' : 'Configure PDX Cookie'}
          </Button>
          {results.length > 0 && (
            <Button type="button" variant="secondary" size="sm" onClick={downloadCsv}>
              Download CSV Report
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Connection status banner */}
        <div className={`ds-alert ${status.connected ? 'ds-alert-success' : 'ds-alert-warning'} flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">
              {status.connected ? '🟢 Komatsu PDX Live Connection' : '🟡 Action Required: Connect to Komatsu PDX'}
            </span>
            <span className="text-xs text-slate-600">— {status.message}</span>
          </div>
          <button
            type="button"
            className="text-xs font-bold underline hover:opacity-80 ml-4 cursor-pointer"
            onClick={() => setCookieModalOpen(true)}
          >
            {status.connected ? 'Change Cookie' : 'Connect in 10s'}
          </button>
        </div>

        {/* Workspace Mode Tabs */}
        <div className="flex gap-2 border-b border-slate-200 pb-3">
          <button
            type="button"
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'inquiry' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            onClick={() => setActiveTab('inquiry')}
          >
            🚀 Automated Bulk Inquiry
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'split' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            onClick={() => setActiveTab('split')}
          >
            📦 Split into 12-Item Batches
          </button>
        </div>

        {/* Tab 1: Automated Inquiry */}
        {activeTab === 'inquiry' && (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
              {/* Input Section */}
              <Card className="p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">1. Part Numbers & Quantities</h2>
                    <p className="text-xs text-slate-500">Paste your list or upload a file (unlimited items).</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="ds-button ds-button-secondary ds-button-small cursor-pointer">
                      <span>Upload File (.csv, .txt)</span>
                      <input type="file" className="hidden" accept=".csv,.txt,.xlsx,.xls" onChange={handleFileUpload} />
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setPastedText(SAMPLE_PARTS.join('\n'))}
                    >
                      Load Sample
                    </Button>
                  </div>
                </div>

                <Field label="Part Numbers & Quantities (One per line: PartNo, Qty)">
                  <textarea
                    rows={8}
                    className="ds-input font-mono text-xs"
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="6742-01-4540, 6&#10;600-319-3750, 6&#10;6261-31-2130, 2"
                  />
                </Field>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-500 font-medium">
                    Detected: <strong>{parsedQueue.length} parts</strong> ({Math.ceil(parsedQueue.length / 12)} PDX Batches)
                  </span>
                  <Button
                    type="button"
                    variant="primary"
                    disabled={isQuerying || parsedQueue.length === 0}
                    onClick={executeInquiry}
                  >
                    {isQuerying ? 'Querying Komatsu PDX...' : `Start Inquiry (${parsedQueue.length} Parts)`}
                  </Button>
                </div>

                {isQuerying && queryProgress && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-1.5 animate-pulse">
                    <div className="flex justify-between text-xs font-bold text-blue-900">
                      <span>Querying Komatsu PDX Portal...</span>
                      <span>Batch {queryProgress.currentBatch} / {queryProgress.totalBatches}</span>
                    </div>
                    <div className="h-2 w-full bg-blue-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${Math.round((queryProgress.currentBatch / queryProgress.totalBatches) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </Card>

              {/* Side Summary & Guide */}
              <Card className="p-5 space-y-4 h-fit">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900">Inquiry Capabilities</h3>
                  <p className="text-xs text-slate-500">Direct integration with Komatsu Middle East PDX</p>
                </div>
                <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span><strong>12-Item Limit Bypassed</strong>: Batched automatically in background.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span><strong>Interchangeable Parts</strong>: Finds superseded & alternative parts (`↳`).</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span><strong>Multi-Warehouse Stock</strong>: KME Dubai, Japan KLTD, Regional, and QA.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span><strong>DNet Price & Weight</strong>: Full commercial & logistics metadata.</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Connection Guide</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Open Komatsu PDX in Edge ➔ Press F12 ➔ Console ➔ <code>copy(document.cookie)</code> ➔ Paste here.
                  </p>
                </div>
              </Card>
            </div>

            {/* Results KPIs & Data Grid */}
            {results.length > 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
                    <span className="text-xs font-bold uppercase text-slate-400">Total Items</span>
                    <p className="text-xl font-bold text-slate-900 mt-0.5">{stats.totalRecords}</p>
                  </div>
                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
                    <span className="text-xs font-bold uppercase text-slate-400">Main Queried</span>
                    <p className="text-xl font-bold text-slate-900 mt-0.5">{stats.mainParts}</p>
                  </div>
                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
                    <span className="text-xs font-bold uppercase text-slate-400">Alternatives</span>
                    <p className="text-xl font-bold text-purple-600 mt-0.5">{stats.alternativeParts}</p>
                  </div>
                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
                    <span className="text-xs font-bold uppercase text-slate-400">In Stock (KME)</span>
                    <p className="text-xl font-bold text-emerald-600 mt-0.5">{stats.inStockKme}</p>
                  </div>
                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
                    <span className="text-xs font-bold uppercase text-slate-400">Est. Total (USD)</span>
                    <p className="text-xl font-bold text-amber-600 mt-0.5">${stats.totalValue}</p>
                  </div>
                </div>

                {/* Table Card */}
                <Card className="overflow-hidden">
                  <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        placeholder="Filter by part number or description..."
                        className="ds-input text-xs w-64"
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                      />
                      <div className="flex items-center gap-1 bg-slate-200/70 p-0.5 rounded-lg text-xs">
                        <button
                          type="button"
                          className={`px-2.5 py-1 rounded font-semibold transition-all ${typeFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
                          onClick={() => setTypeFilter('ALL')}
                        >
                          All ({results.length})
                        </button>
                        <button
                          type="button"
                          className={`px-2.5 py-1 rounded font-semibold transition-all ${typeFilter === 'MAIN' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
                          onClick={() => setTypeFilter('MAIN')}
                        >
                          Main Only ({stats.mainParts})
                        </button>
                        <button
                          type="button"
                          className={`px-2.5 py-1 rounded font-semibold transition-all ${typeFilter === 'IN_STOCK' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
                          onClick={() => setTypeFilter('IN_STOCK')}
                        >
                          In Stock ({stats.inStockKme})
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="secondary" size="sm" onClick={downloadCsv}>
                        Export CSV
                      </Button>
                    </div>
                  </div>

                  <div className="ds-table-wrap">
                    <table className="ds-table">
                      <thead>
                        <tr>
                          <th>Item Type</th>
                          <th>Part Number</th>
                          <th>Req Qty</th>
                          <th>Description</th>
                          <th>LPN</th>
                          <th>KME Stock</th>
                          <th>DNet Price (USD)</th>
                          <th>On Order</th>
                          <th>Weight (gm)</th>
                          <th>Lead Time</th>
                          <th>Japan (KLTD)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredResults.map((item, idx) => {
                          const hasStock = Number(item.kmeStock || 0) > 0;
                          return (
                            <tr
                              key={`${item.rawPartNumber}-${idx}`}
                              className={item.isAlternative ? 'bg-slate-50/50' : 'bg-white font-medium'}
                            >
                              <td>
                                <Badge tone={item.isAlternative ? 'neutral' : 'info'}>
                                  {item.itemType}
                                </Badge>
                              </td>
                              <td className="font-mono font-bold text-slate-900">
                                {item.partNumber}
                              </td>
                              <td className="font-mono text-center font-bold">
                                {item.requestedQty}
                              </td>
                              <td className="max-w-xs truncate text-slate-700" title={item.description}>
                                {item.description}
                              </td>
                              <td className="font-mono text-xs text-slate-500">
                                {item.lpn}
                              </td>
                              <td>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded font-bold text-xs ${hasStock ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                                  {item.kmeStock}
                                </span>
                              </td>
                              <td className="font-mono text-slate-900 font-bold">
                                ${item.dnetPrice}
                              </td>
                              <td className="font-mono text-slate-600">
                                {item.onOrder}
                              </td>
                              <td className="font-mono text-slate-500">
                                {item.weight}
                              </td>
                              <td className="text-xs text-slate-500">
                                {item.leadTime || '—'}
                              </td>
                              <td className="font-mono text-slate-600">
                                {item.kltdTotal || '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Split 12-Item Batches */}
        {activeTab === 'split' && (
          <Card className="p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Split Large File into 12-Item PDX CSVs</h2>
              <p className="text-xs text-slate-500">
                If you prefer uploading manually to the Komatsu PDX portal, split your master list into individual 12-part CSVs ready for upload.
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-700 font-semibold">
                Loaded Queue: <strong>{parsedQueue.length} Parts</strong> ➔ Will generate <strong>{Math.ceil(parsedQueue.length / 12)} separate CSV batch files</strong>.
              </p>
            </div>
            <Button
              type="button"
              variant="primary"
              disabled={parsedQueue.length === 0}
              onClick={download12ItemBatches}
            >
              Download All 12-Item Batch CSVs ({Math.ceil(parsedQueue.length / 12)} files)
            </Button>
          </Card>
        )}
      </div>

      {/* Configure Cookie Modal */}
      {cookieModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Configure Komatsu PDX Session</h3>
                <p className="text-xs text-slate-500">Connect to the Komatsu Middle East PDX portal</p>
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
                onClick={() => setCookieModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
              <strong>How to get your session cookie in 10 seconds:</strong>
              <ol className="list-decimal list-inside space-y-0.5 mt-1">
                <li>Open your <strong>Komatsu PDX</strong> tab in Microsoft Edge.</li>
                <li>Press <strong>F12</strong> to open Developer Tools.</li>
                <li>Click <strong>Console</strong>, type <code>copy(document.cookie)</code> and press Enter.</li>
                <li>Paste the copied text below:</li>
              </ol>
            </div>

            <form onSubmit={handleSaveCookie} className="space-y-4">
              <Field label="Cookie string or cURL command">
                <textarea
                  rows={4}
                  className="ds-input font-mono text-xs"
                  placeholder="ASP.NET_SessionId=...; user_auth=..."
                  value={cookieInput}
                  onChange={(e) => setCookieInput(e.target.value)}
                  required
                />
              </Field>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button type="button" variant="secondary" onClick={() => setCookieModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={savingCookie}>
                  {savingCookie ? 'Testing Connection...' : 'Save & Test Connection'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </SystemShell>
  );
}
