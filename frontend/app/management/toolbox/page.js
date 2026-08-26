'use client';

import { useEffect, useMemo, useState } from 'react';
import SystemShell from '../../../components/SystemShell';
import Toolbox3DCanvas from '../../../components/toolbox/Toolbox3DCanvas';
import ToolboxTrayViewer from '../../../components/toolbox/ToolboxTrayViewer';
import ToolboxInventoryTable from '../../../components/toolbox/ToolboxInventoryTable';
import ToolInspectorPanel from '../../../components/toolbox/ToolInspectorPanel';
import ToolDetailModal from '../../../components/toolbox/ToolDetailModal';
import rawTechniciansData from '../../../data/techniciansToolboxes.json';

const STORAGE_KEY = 'eqp_technician_toolboxes_state';

const THEMES = [
  { id: 'cobalt', name: 'Cobalt Blue', color: '#1e3a8a' },
  { id: 'crimson', name: 'Crimson Red', color: '#b91c1c' },
  { id: 'stealth', name: 'Stealth Black', color: '#18181b' },
  { id: 'dewalt', name: 'Dewalt Yellow', color: '#ca8a04' },
  { id: 'emerald', name: 'Titanium Green', color: '#047857' },
];

export default function ManagementToolboxPage() {
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

  // Sync tool updates
  const updateToolStatus = (toolId, newStatus, note) => {
    setTechnicians((prevTechs) => {
      const updated = prevTechs.map((tech) => {
        const hasTool = tech.tools.some((t) => t.id === toolId);
        if (!hasTool) return tech;

        const updatedTools = tech.tools.map((t) => {
          if (t.id === toolId) {
            const updatedItem = {
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
              inspectionNote: note !== undefined ? note : t.inspectionNote,
            };
            if (selectedTool?.id === toolId) {
              setSelectedTool(updatedItem);
            }
            return updatedItem;
          }
          return t;
        });

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
            operationalRate: Math.round((goodCount / totalItems) * 1000) / 10,
          },
        };
      });

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
      }
      return updated;
    });
  };

  const currentTech = useMemo(() => {
    return technicians.find((t) => t.slug === selectedSlug) || technicians[0];
  }, [technicians, selectedSlug]);

  return (
    <SystemShell title="Technician Toolboxes" activeModule="toolbox">
      <div className="space-y-6 pb-12">
        {/* Top Header Hero */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                3D WebGL Digital Twin
              </span>
              <span className="text-xs text-slate-400 font-medium">8 Verified Technicians • 1,077 Assets</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Technician 3D Toolboxes & Assets Studio
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Inspect openable 3D toolboxes, dynamic floating tool arcs, physical multi-drawer tray organizers, and live condition audits for certified maintenance specialists.
            </p>
          </div>

          {/* View Mode Switcher Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/90 p-2 rounded-2xl border border-slate-800 self-start lg:self-center shadow-inner">
            <button
              onClick={() => setViewMode('3D')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                viewMode === '3D'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <span>🪐</span>
              <span>3D Studio</span>
            </button>

            <button
              onClick={() => setViewMode('TRAYS')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                viewMode === 'TRAYS'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <span>🗄️</span>
              <span>Tray Drawers</span>
            </button>

            <button
              onClick={() => setViewMode('INVENTORY')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                viewMode === 'INVENTORY'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <span>📋</span>
              <span>Inventory Audit</span>
            </button>

            <button
              onClick={() => setViewMode('FLEET')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                viewMode === 'FLEET'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <span>📊</span>
              <span>Fleet Matrix</span>
            </button>
          </div>
        </div>

        {/* Technician Selection Carousel Ribbon */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">Select Technician</span>
            <span className="text-xs text-cyan-400 font-bold">Live Asset Roster</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {technicians.map((t) => {
              const isSelected = t.slug === selectedSlug;
              const hasAlerts = t.stats.damagedCount > 0 || t.stats.missingCount > 0 || t.stats.notDeliveredCount > 0;
              return (
                <button
                  key={t.slug}
                  onClick={() => {
                    setSelectedSlug(t.slug);
                    setSelectedTool(null);
                  }}
                  className={`p-3.5 rounded-2xl text-left transition-all flex flex-col justify-between border ${
                    isSelected
                      ? 'bg-gradient-to-b from-cyan-950/90 to-slate-900 border-cyan-400 shadow-xl shadow-cyan-500/20 scale-[1.03]'
                      : 'bg-slate-950/70 border-slate-800 hover:bg-slate-850 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg">🧰</span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                          t.stats.operationalRate >= 95
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {t.stats.operationalRate}%
                      </span>
                    </div>

                    <h4 className="text-xs font-black text-white leading-snug truncate">{t.name}</h4>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{t.nameEn}</p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-mono">{t.stats.totalQuantity} pcs</span>
                    {hasAlerts && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Contains damaged/pending tools" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick KPI Stat Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
            <span className="text-[11px] text-slate-400 font-medium block">Technician Profile</span>
            <span className="text-sm font-black text-white mt-1 block truncate">{currentTech?.name}</span>
            <span className="text-[11px] text-slate-400 block truncate">{currentTech?.role}</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
            <span className="text-[11px] text-slate-400 font-medium block">Toolbox Readiness</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xl font-black text-cyan-400 font-mono">
                {currentTech?.stats?.operationalRate}%
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                {currentTech?.stats?.goodCount}/{currentTech?.stats?.totalQuantity}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block">Operational state</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
            <span className="text-[11px] text-slate-400 font-medium block">Total Tool Items</span>
            <span className="text-xl font-black text-white font-mono mt-1 block">
              {currentTech?.stats?.totalQuantity} <span className="text-xs font-normal text-slate-400">PCS</span>
            </span>
            <span className="text-[10px] text-slate-400 block">{currentTech?.stats?.uniqueTools} unique specifications</span>
          </div>

          <div
            onClick={() => {
              setStatusFilter('damaged');
              if (viewMode === '3D') setViewMode('INVENTORY');
            }}
            className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 cursor-pointer rounded-2xl p-4 shadow-lg transition-colors"
          >
            <span className="text-[11px] text-amber-400 font-bold block">Damaged Tools</span>
            <span className="text-xl font-black text-amber-400 font-mono mt-1 block">
              {currentTech?.stats?.damagedCount}
            </span>
            <span className="text-[10px] text-slate-400 block">Requires repair / replacement</span>
          </div>

          <div
            onClick={() => {
              setStatusFilter('missing');
              if (viewMode === '3D') setViewMode('INVENTORY');
            }}
            className="bg-slate-900 border border-slate-800 hover:border-red-500/40 cursor-pointer rounded-2xl p-4 shadow-lg transition-colors"
          >
            <span className="text-[11px] text-red-400 font-bold block">Missing Tools</span>
            <span className="text-xl font-black text-red-400 font-mono mt-1 block">
              {currentTech?.stats?.missingCount}
            </span>
            <span className="text-[10px] text-slate-400 block">Unaccounted / lost</span>
          </div>

          <div
            onClick={() => {
              setStatusFilter('not_delivered');
              if (viewMode === '3D') setViewMode('INVENTORY');
            }}
            className="bg-slate-900 border border-slate-800 hover:border-purple-500/40 cursor-pointer rounded-2xl p-4 shadow-lg transition-colors"
          >
            <span className="text-[11px] text-purple-400 font-bold block">Pending Delivery</span>
            <span className="text-xl font-black text-purple-400 font-mono mt-1 block">
              {currentTech?.stats?.notDeliveredCount}
            </span>
            <span className="text-[10px] text-slate-400 block">Not yet issued to technician</span>
          </div>
        </div>

        {/* View Mode 1: 3D Studio (Canvas + Docked Tool Inspector Split View) */}
        {viewMode === '3D' && (
          <div className="space-y-4">
            {/* Paint & Filter Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 p-4 rounded-3xl border border-slate-800 shadow-xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Toolbox Paint:</span>
                <div className="flex items-center gap-2">
                  {THEMES.map((th) => (
                    <button
                      key={th.id}
                      onClick={() => setThemeKey(th.id)}
                      className={`w-7 h-7 rounded-full border-2 transition-all shadow-md ${
                        themeKey === th.id ? 'border-cyan-400 scale-110 shadow-cyan-500/30' : 'border-slate-700 opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: th.color }}
                      title={th.name}
                    />
                  ))}
                </div>
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 font-medium mr-1">Filter:</span>
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                    statusFilter === 'ALL' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter('good')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                    statusFilter === 'good' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Operational
                </button>
                <button
                  onClick={() => setStatusFilter('damaged')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                    statusFilter === 'damaged' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Damaged
                </button>
                <button
                  onClick={() => setStatusFilter('not_delivered')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                    statusFilter === 'not_delivered' ? 'bg-purple-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
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
                  className="px-3.5 py-2 pl-9 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                />
                <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
              </div>
            </div>

            {/* Split View: 3D Canvas + Docked Live Inspector */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[640px]">
              <div className="lg:col-span-8 xl:col-span-9 h-[640px] w-full">
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

              <div className="lg:col-span-4 xl:col-span-3 h-[640px]">
                <ToolInspectorPanel
                  tool={selectedTool}
                  technician={currentTech}
                  onClose={() => setSelectedTool(null)}
                  onUpdateStatus={updateToolStatus}
                />
              </div>
            </div>
          </div>
        )}

        {/* View Mode 2: Multi-Drawer Cantilever Tray View */}
        {viewMode === 'TRAYS' && (
          <ToolboxTrayViewer
            tools={currentTech?.tools || []}
            technician={currentTech}
            onSelectTool={(tool) => setSelectedTool(tool)}
          />
        )}

        {/* View Mode 3: Complete Inventory & Audit Matrix */}
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
              <h3 className="text-white font-black text-lg flex items-center gap-2">
                <span>📊</span> Fleet Toolbox Readiness & Status Matrix
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Comparative readiness index across all 8 certified field technicians
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
                  className="bg-slate-950 border border-slate-800 hover:border-cyan-500 rounded-2xl p-5 shadow-xl cursor-pointer transition-all hover:-translate-y-1 group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-white font-black text-sm group-hover:text-cyan-400 transition-colors">
                        {t.name}
                      </h4>
                      <p className="text-xs text-slate-400">{t.nameEn}</p>
                    </div>
                    <span
                      className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                        t.stats.operationalRate >= 95
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {t.stats.operationalRate}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-850 h-2.5 rounded-full overflow-hidden mb-3">
                    <div
                      className={`h-full transition-all duration-500 ${
                        t.stats.operationalRate >= 95 ? 'bg-gradient-to-r from-emerald-500 to-cyan-400' : 'bg-gradient-to-r from-amber-500 to-yellow-400'
                      }`}
                      style={{ width: `${t.stats.operationalRate}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs py-2 bg-slate-900 rounded-xl border border-slate-800">
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

        {/* Selected Tool Modal */}
        {selectedTool && viewMode !== '3D' && (
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
