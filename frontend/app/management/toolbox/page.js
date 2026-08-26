'use client';

import { useEffect, useMemo, useState } from 'react';
import SystemShell from '../../../components/SystemShell';
import Toolbox3DCanvas from '../../../components/toolbox/Toolbox3DCanvas';
import ToolboxTrayViewer from '../../../components/toolbox/ToolboxTrayViewer';
import ToolboxInventoryTable from '../../../components/toolbox/ToolboxInventoryTable';
import ToolDetailModal from '../../../components/toolbox/ToolDetailModal';
import rawTechniciansData from '../../../data/techniciansToolboxes.json';

const STORAGE_KEY = 'eqp_technician_toolboxes_state';

const THEMES = [
  { id: 'cobalt', name: 'Cobalt Blue', color: '#1d4ed8' },
  { id: 'crimson', name: 'Crimson Red', color: '#dc2626' },
  { id: 'stealth', name: 'Stealth Black', color: '#18181b' },
  { id: 'dewalt', name: 'Dewalt Yellow', color: '#eab308' },
  { id: 'emerald', name: 'Workshop Green', color: '#059669' },
];

export default function ManagementToolboxPage() {
  // Load technicians data with localStorage override if updated
  const [technicians, setTechnicians] = useState(() => {
    if (typeof window === 'undefined') return rawTechniciansData;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : rawTechniciansData;
    } catch {
      return rawTechniciansData;
    }
  });

  const [selectedSlug, setSelectedSlug] = useState(rawTechniciansData[0]?.slug || 'ahmad-jawawdeh');
  const [viewMode, setViewMode] = useState('3D'); // '3D' | 'TRAYS' | 'INVENTORY' | 'FLEET'
  const [isOpen3D, setIsOpen3D] = useState(true);
  const [themeKey, setThemeKey] = useState('cobalt');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTool, setSelectedTool] = useState(null);

  // Sync state to localStorage whenever modified
  const updateToolStatus = (toolId, newStatus, note) => {
    setTechnicians((prevTechs) => {
      const updated = prevTechs.map((tech) => {
        const hasTool = tech.tools.some((t) => t.id === toolId);
        if (!hasTool) return tech;

        const updatedTools = tech.tools.map((t) => {
          if (t.id === toolId) {
            return {
              ...t,
              status: newStatus,
              statusLabelAr:
                newStatus === 'good'
                  ? 'سليم / متوفر'
                  : newStatus === 'damaged'
                  ? 'تالف'
                  : newStatus === 'missing'
                  ? 'مفقود'
                  : 'لم يتم التسليم',
              statusLabelEn:
                newStatus === 'good'
                  ? 'Operational'
                  : newStatus === 'damaged'
                  ? 'Damaged'
                  : newStatus === 'missing'
                  ? 'Missing'
                  : 'Pending Delivery',
              inspectionNote: note || t.inspectionNote,
            };
          }
          return t;
        });

        // Recalculate stats
        const totalItems = updatedTools.reduce((acc, t) => acc + t.quantity, 0);
        const goodCount = updatedTools.filter((t) => t.status === 'good').reduce((acc, t) => acc + t.quantity, 0);
        const damagedCount = updatedTools.filter((t) => t.status === 'damaged').reduce((acc, t) => acc + t.quantity, 0);
        const missingCount = updatedTools.filter((t) => t.status === 'missing').reduce((acc, t) => acc + t.quantity, 0);
        const notDeliveredCount = updatedTools.filter((t) => t.status === 'not_delivered').reduce((acc, t) => acc + t.quantity, 0);

        return {
          ...tech,
          tools: updatedTools,
          stats: {
            ...tech.stats,
            goodCount,
            damagedCount,
            missingCount,
            notDeliveredCount,
            operationalRate: round((goodCount / totalItems) * 100, 1),
          },
        };
      });

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
          console.error('Failed to save to localStorage', e);
        }
      }
      return updated;
    });
  };

  function round(val, decimals = 1) {
    return Math.round(val * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  // Active Technician
  const currentTech = useMemo(() => {
    return technicians.find((t) => t.slug === selectedSlug) || technicians[0];
  }, [technicians, selectedSlug]);

  return (
    <SystemShell title="Technician Toolboxes" activeModule="toolbox">
      <div className="space-y-6 pb-12">
        {/* Top Header Hero */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                3D Interactive Digital Twin
              </span>
              <span className="text-xs text-slate-400">8 Technicians Configured</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Technician 3D Toolboxes & Assets
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Inspect openable 3D toolboxes, dynamic floating tool clouds, physical cantilever tray layouts, and complete tool audits for field & workshop specialists.
            </p>
          </div>

          {/* View Mode Switcher Pills */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-950/80 p-2 rounded-2xl border border-slate-800/80 self-start lg:self-center shadow-inner">
            <button
              onClick={() => setViewMode('3D')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                viewMode === '3D'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span>🪐</span> 3D Studio & Float
            </button>
            <button
              onClick={() => setViewMode('TRAYS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                viewMode === 'TRAYS'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span>🗄️</span> 2.5D Tray Organizer
            </button>
            <button
              onClick={() => setViewMode('INVENTORY')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                viewMode === 'INVENTORY'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span>📋</span> Inventory & Audit
            </button>
            <button
              onClick={() => setViewMode('FLEET')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                viewMode === 'FLEET'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span>📊</span> Fleet Readiness
            </button>
          </div>
        </div>

        {/* Technician Selector Horizontal Carousel */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3 px-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Select Technician</span>
            <span className="text-xs text-cyan-400 font-medium">Click to inspect active toolbox</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {technicians.map((t) => {
              const isSelected = t.slug === selectedSlug;
              const hasAlerts = t.stats.damagedCount > 0 || t.stats.missingCount > 0 || t.stats.notDeliveredCount > 0;
              return (
                <button
                  key={t.slug}
                  onClick={() => setSelectedSlug(t.slug)}
                  className={`relative p-3 rounded-2xl text-left transition-all flex flex-col justify-between border ${
                    isSelected
                      ? 'bg-gradient-to-b from-cyan-950/80 to-slate-900 border-cyan-500 shadow-lg shadow-cyan-500/15 scale-[1.02]'
                      : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-base">🧰</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          t.stats.operationalRate >= 95
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {t.stats.operationalRate}%
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white leading-tight truncate">{t.name}</h4>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{t.nameEn}</p>
                  </div>

                  <div className="mt-2.5 pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{t.stats.totalQuantity} pcs</span>
                    {hasAlerts && (
                      <span className="w-2 h-2 rounded-full bg-amber-400" title="Has damaged/missing/pending tools" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Technician Summary Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
            <span className="text-xs text-slate-400 font-medium block">Technician Name</span>
            <span className="text-sm font-bold text-white mt-1 block truncate">{currentTech?.name}</span>
            <span className="text-[11px] text-slate-400 block truncate">{currentTech?.role}</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
            <span className="text-xs text-slate-400 font-medium block">Toolbox Readiness</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xl font-black text-cyan-400 font-mono">
                {currentTech?.stats?.operationalRate}%
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                {currentTech?.stats?.goodCount}/{currentTech?.stats?.totalQuantity}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block">Operational state</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
            <span className="text-xs text-slate-400 font-medium block">Total Tool Items</span>
            <span className="text-xl font-black text-white font-mono mt-1 block">
              {currentTech?.stats?.totalQuantity} <span className="text-xs font-normal text-slate-400">PCS</span>
            </span>
            <span className="text-[11px] text-slate-400 block">{currentTech?.stats?.uniqueTools} unique types</span>
          </div>

          <div
            onClick={() => {
              setStatusFilter('damaged');
              if (viewMode === '3D') setViewMode('INVENTORY');
            }}
            className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 cursor-pointer rounded-2xl p-4 shadow-lg transition-colors"
          >
            <span className="text-xs text-amber-400 font-medium block">Damaged Tools</span>
            <span className="text-xl font-black text-amber-400 font-mono mt-1 block">
              {currentTech?.stats?.damagedCount}
            </span>
            <span className="text-[11px] text-slate-400 block">Needs repair / replacement</span>
          </div>

          <div
            onClick={() => {
              setStatusFilter('missing');
              if (viewMode === '3D') setViewMode('INVENTORY');
            }}
            className="bg-slate-900/90 border border-slate-800 hover:border-red-500/40 cursor-pointer rounded-2xl p-4 shadow-lg transition-colors"
          >
            <span className="text-xs text-red-400 font-medium block">Missing Tools</span>
            <span className="text-xl font-black text-red-400 font-mono mt-1 block">
              {currentTech?.stats?.missingCount}
            </span>
            <span className="text-[11px] text-slate-400 block">Unaccounted / lost</span>
          </div>

          <div
            onClick={() => {
              setStatusFilter('not_delivered');
              if (viewMode === '3D') setViewMode('INVENTORY');
            }}
            className="bg-slate-900/90 border border-slate-800 hover:border-purple-500/40 cursor-pointer rounded-2xl p-4 shadow-lg transition-colors"
          >
            <span className="text-xs text-purple-400 font-medium block">Pending Delivery</span>
            <span className="text-xl font-black text-purple-400 font-mono mt-1 block">
              {currentTech?.stats?.notDeliveredCount}
            </span>
            <span className="text-[11px] text-slate-400 block">Not yet issued</span>
          </div>
        </div>

        {/* View Mode 1: 3D Studio & Floating Tools View */}
        {viewMode === '3D' && (
          <div className="space-y-4">
            {/* 3D Filter & Customization Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 p-3.5 rounded-2xl border border-slate-800">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Paint Color:</span>
                <div className="flex items-center gap-1.5">
                  {THEMES.map((th) => (
                    <button
                      key={th.id}
                      onClick={() => setThemeKey(th.id)}
                      className={`w-6 h-6 rounded-full border transition-all ${
                        themeKey === th.id ? 'border-white scale-110 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: th.color }}
                      title={th.name}
                    />
                  ))}
                </div>
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 font-medium mr-1">Condition Filter:</span>
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                    statusFilter === 'ALL' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter('good')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                    statusFilter === 'good' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  Operational
                </button>
                <button
                  onClick={() => setStatusFilter('damaged')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                    statusFilter === 'damaged' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  Damaged
                </button>
                <button
                  onClick={() => setStatusFilter('not_delivered')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                    statusFilter === 'not_delivered' ? 'bg-purple-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  Pending
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter 3D tools..."
                  className="px-3 py-1.5 pl-8 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                />
                <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
              </div>
            </div>

            {/* 3D WebGL Canvas */}
            <div className="h-[620px] w-full">
              <Toolbox3DCanvas
                technician={currentTech}
                tools={currentTech?.tools || []}
                selectedTool={selectedTool}
                onSelectTool={(tool) => setSelectedTool(tool)}
                isOpen={isOpen3D}
                onToggleOpen={() => setIsOpen3D(!isOpen3D)}
                activeCategory={activeCategory}
                statusFilter={statusFilter}
                searchQuery={searchQuery}
                themeKey={themeKey}
              />
            </div>
          </div>
        )}

        {/* View Mode 2: 2.5D Cantilever Tray Organizer */}
        {viewMode === 'TRAYS' && (
          <ToolboxTrayViewer
            tools={currentTech?.tools || []}
            technician={currentTech}
            onSelectTool={(tool) => setSelectedTool(tool)}
          />
        )}

        {/* View Mode 3: Inventory & Audit Table */}
        {viewMode === 'INVENTORY' && (
          <ToolboxInventoryTable
            tools={currentTech?.tools || []}
            technician={currentTech}
            onSelectTool={(tool) => setSelectedTool(tool)}
            onUpdateStatus={updateToolStatus}
          />
        )}

        {/* View Mode 4: Fleet Readiness Comparison Matrix */}
        {viewMode === 'FLEET' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
            <div>
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <span>📊</span> Workshop Fleet Toolboxes Comparison Matrix
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Comparative equipment readiness analysis across all 8 certified technicians
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {technicians.map((t) => (
                <div
                  key={t.slug}
                  onClick={() => {
                    setSelectedSlug(t.slug);
                    setViewMode('3D');
                  }}
                  className="bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 shadow-lg cursor-pointer transition-all hover:-translate-y-1 group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-white font-bold text-sm group-hover:text-cyan-400 transition-colors">
                        {t.name}
                      </h4>
                      <p className="text-xs text-slate-400">{t.nameEn}</p>
                    </div>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        t.stats.operationalRate >= 95
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {t.stats.operationalRate}%
                    </span>
                  </div>

                  {/* Readiness Progress Bar */}
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-3">
                    <div
                      className={`h-full transition-all duration-500 ${
                        t.stats.operationalRate >= 95 ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                      style={{ width: `${t.stats.operationalRate}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs py-2 bg-slate-900/60 rounded-xl border border-slate-800/60">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Total</span>
                      <span className="font-bold text-white font-mono">{t.stats.totalQuantity}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-400 block">Damaged</span>
                      <span className="font-bold text-amber-400 font-mono">{t.stats.damagedCount}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-purple-400 block">Pending</span>
                      <span className="font-bold text-purple-400 font-mono">{t.stats.notDeliveredCount}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                    <span>Issued: {t.deliveryDate}</span>
                    <span className="text-cyan-400 font-bold group-hover:underline">Open 3D Box →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Tool Holographic Detail Modal */}
        {selectedTool && (
          <ToolDetailModal
            tool={selectedTool}
            technician={currentTech}
            onClose={() => setSelectedTool(null)}
            onUpdateStatus={updateToolStatus}
          />
        )}
      </div>
    </SystemShell>
  );
}
