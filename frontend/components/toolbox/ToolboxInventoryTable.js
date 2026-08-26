'use client';

import { useMemo, useState } from 'react';

const STATUS_CONFIG = {
  good: {
    labelAr: 'سليم / متوفر',
    labelEn: 'Operational',
    badge: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    dot: 'bg-emerald-400',
  },
  damaged: {
    labelAr: 'تالف',
    labelEn: 'Damaged',
    badge: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
    dot: 'bg-amber-400',
  },
  missing: {
    labelAr: 'مفقود',
    labelEn: 'Missing',
    badge: 'bg-red-500/15 border-red-500/30 text-red-400',
    dot: 'bg-red-400',
  },
  not_delivered: {
    labelAr: 'لم يتم التسليم',
    labelEn: 'Pending Delivery',
    badge: 'bg-purple-500/15 border-purple-500/30 text-purple-400',
    dot: 'bg-purple-400',
  },
};

export default function ToolboxInventoryTable({
  tools = [],
  technician,
  onSelectTool,
  onUpdateStatus,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Categories list for filter
  const categories = useMemo(() => {
    const map = new Map();
    tools.forEach((t) => {
      if (!map.has(t.category)) {
        map.set(t.category, { id: t.category, nameAr: t.categoryAr, nameEn: t.categoryEn });
      }
    });
    return Array.from(map.values());
  }, [tools]);

  // Filtered tools
  const filtered = useMemo(() => {
    return tools.filter((t) => {
      if (selectedCat !== 'ALL' && t.category !== selectedCat) return false;
      if (selectedStatus !== 'ALL' && t.status !== selectedStatus) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const mName = (t.name || '').toLowerCase().includes(q);
        const mEn = (t.nameEn || '').toLowerCase().includes(q);
        const mCat = (t.categoryAr || '').toLowerCase().includes(q);
        const mSpec = (t.specification || '').toLowerCase().includes(q);
        if (!mName && !mEn && !mCat && !mSpec) return false;
      }
      return true;
    });
  }, [tools, selectedCat, selectedStatus, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // CSV Export
  const handleExportCsv = () => {
    const headers = ['ID', 'Tool Name (Arabic)', 'Tool Name (English)', 'Category', 'Specification (mm)', 'Quantity', 'Status', 'Technician'];
    const rows = filtered.map((t) => [
      t.id,
      `"${t.name.replace(/"/g, '""')}"`,
      `"${(t.nameEn || '').replace(/"/g, '""')}"`,
      `"${t.categoryEn || t.categoryAr}"`,
      `"${t.specification || ''}"`,
      t.quantity,
      `"${t.statusLabelEn || t.status}"`,
      `"${technician?.name || ''}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Toolbox_${technician?.nameEn || 'Technician'}_Audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
      {/* Table Header & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <span>📋</span> Complete Toolbox Inventory & Audit
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Detailed list of all {tools.length} tools registered for {technician?.name} ({technician?.nameEn})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Search tool name, size, spec..."
              className="w-64 px-3.5 py-2 pl-9 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
            />
            <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:border-slate-600 transition-colors flex items-center gap-1.5"
          >
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => {
              setSelectedStatus('ALL');
              setPage(1);
            }}
            className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
              selectedStatus === 'ALL'
                ? 'bg-slate-700 text-white font-bold'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            All Statuses ({tools.length})
          </button>

          <button
            onClick={() => {
              setSelectedStatus('good');
              setPage(1);
            }}
            className={`px-3 py-1 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
              selectedStatus === 'good'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                : 'bg-slate-800/60 text-slate-400 hover:text-emerald-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Operational ({tools.filter((t) => t.status === 'good').length})
          </button>

          <button
            onClick={() => {
              setSelectedStatus('damaged');
              setPage(1);
            }}
            className={`px-3 py-1 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
              selectedStatus === 'damaged'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : 'bg-slate-800/60 text-slate-400 hover:text-amber-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Damaged ({tools.filter((t) => t.status === 'damaged').length})
          </button>

          <button
            onClick={() => {
              setSelectedStatus('missing');
              setPage(1);
            }}
            className={`px-3 py-1 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
              selectedStatus === 'missing'
                ? 'bg-red-500/20 text-red-300 border border-red-500/40 font-bold'
                : 'bg-slate-800/60 text-slate-400 hover:text-red-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-400" />
            Missing ({tools.filter((t) => t.status === 'missing').length})
          </button>

          <button
            onClick={() => {
              setSelectedStatus('not_delivered');
              setPage(1);
            }}
            className={`px-3 py-1 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
              selectedStatus === 'not_delivered'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold'
                : 'bg-slate-800/60 text-slate-400 hover:text-purple-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            Pending ({tools.filter((t) => t.status === 'not_delivered').length})
          </button>
        </div>

        {/* Category Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Category:</span>
          <select
            value={selectedCat}
            onChange={(e) => {
              setSelectedCat(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameEn || c.nameAr}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Inventory Data Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-800">
              <th className="py-3 px-4 w-14 text-center">#</th>
              <th className="py-3 px-4">Tool Name (Arabic & English)</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Specification / Size</th>
              <th className="py-3 px-4 text-center">Quantity</th>
              <th className="py-3 px-4">Condition Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {paginated.length > 0 ? (
              paginated.map((t, idx) => {
                const st = STATUS_CONFIG[t.status] || STATUS_CONFIG.good;
                return (
                  <tr
                    key={t.id}
                    className="hover:bg-slate-850/60 transition-colors group cursor-pointer"
                    onClick={() => onSelectTool && onSelectTool(t)}
                  >
                    <td className="py-3 px-4 text-center text-slate-500 font-mono text-[11px]">
                      {(page - 1) * pageSize + idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {t.name}
                      </div>
                      <div className="text-[11px] text-slate-400">{t.nameEn}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px] border border-slate-700/60">
                        {t.categoryEn || t.categoryAr}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-200">
                      {t.specification ? `${t.specification} mm` : '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-cyan-400 font-bold font-mono text-xs">
                        {t.quantity}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border inline-flex items-center gap-1.5 ${st.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                        {st.labelEn}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectTool) onSelectTool(t);
                        }}
                        className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 font-bold text-[11px] transition-all"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  <div className="text-3xl mb-2">🔍</div>
                  <p className="text-sm font-medium">No tools match your filter criteria.</p>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCat('ALL');
                      setSelectedStatus('ALL');
                    }}
                    className="mt-2 text-xs text-cyan-400 hover:underline"
                  >
                    Reset all filters
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-400">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filtered.length)} of {filtered.length} tools
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 text-xs text-slate-400 font-mono">
              Page {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
