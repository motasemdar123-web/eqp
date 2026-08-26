'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Toolbox3DCanvas from '../../../components/toolbox/Toolbox3DCanvas';
import ToolboxTrayViewer from '../../../components/toolbox/ToolboxTrayViewer';
import ToolDetailModal from '../../../components/toolbox/ToolDetailModal';
import rawTechniciansData from '../../../data/techniciansToolboxes.json';

const STORAGE_KEY = 'eqp_technician_toolboxes_state';

export default function TechnicianMobileToolboxPage() {
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
  const [activeTab, setActiveTab] = useState('3D'); // '3D' | 'TRAYS' | 'CHECKLIST'
  const [isOpen3D, setIsOpen3D] = useState(true);
  const [selectedTool, setSelectedTool] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const currentTech = useMemo(() => {
    return technicians.find((t) => t.slug === selectedSlug) || technicians[0];
  }, [technicians, selectedSlug]);

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* Top Mobile Header */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <Link
            href="/technician"
            className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white border border-slate-700"
          >
            ←
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white leading-tight">My 3D Toolbox</h1>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
                {currentTech?.stats?.operationalRate}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-[200px]">{currentTech?.name}</p>
          </div>
        </div>

        {/* Technician Quick Switcher Select */}
        <select
          value={selectedSlug}
          onChange={(e) => setSelectedSlug(e.target.value)}
          className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
        >
          {technicians.map((t) => (
            <option key={t.slug} value={t.slug}>
              {t.name} ({t.stats.totalQuantity} tools)
            </option>
          ))}
        </select>
      </header>

      {/* Main Container */}
      <main className="p-4 space-y-4 max-w-5xl mx-auto">
        {/* Quick Tabs */}
        <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('3D')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === '3D'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🪐</span> 3D Orbit View
          </button>
          <button
            onClick={() => setActiveTab('TRAYS')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'TRAYS'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🗄️</span> Trays
          </button>
          <button
            onClick={() => setActiveTab('CHECKLIST')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'CHECKLIST'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>✅</span> Tool Checklist
          </button>
        </div>

        {/* 3D View Tab */}
        {activeTab === '3D' && (
          <div className="space-y-3">
            <div className="h-[500px] w-full rounded-2xl overflow-hidden border border-slate-800">
              <Toolbox3DCanvas
                technician={currentTech}
                tools={currentTech?.tools || []}
                selectedTool={selectedTool}
                onSelectTool={(tool) => setSelectedTool(tool)}
                isOpen={isOpen3D}
                onToggleOpen={() => setIsOpen3D(!isOpen3D)}
                themeKey="cobalt"
              />
            </div>
            <p className="text-[11px] text-slate-400 text-center">
              💡 Touch & drag to rotate 3D box • Pinch/scroll to zoom • Tap any floating tool card to inspect & report
            </p>
          </div>
        )}

        {/* Trays Tab */}
        {activeTab === 'TRAYS' && (
          <ToolboxTrayViewer
            tools={currentTech?.tools || []}
            technician={currentTech}
            onSelectTool={(tool) => setSelectedTool(tool)}
          />
        )}

        {/* Checklist Tab */}
        {activeTab === 'CHECKLIST' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-sm">Toolbox Shift Checklist</h3>
              <span className="text-xs text-slate-400">{currentTech?.tools?.length} Tools Registered</span>
            </div>

            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tools in checklist..."
                className="w-full px-3 py-2 pl-8 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
              />
              <span className="absolute left-2.5 top-2.5 text-slate-400 text-xs">🔍</span>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {currentTech?.tools
                ?.filter((t) => {
                  if (!searchQuery.trim()) return true;
                  const q = searchQuery.toLowerCase();
                  return (
                    (t.name || '').toLowerCase().includes(q) ||
                    (t.nameEn || '').toLowerCase().includes(q) ||
                    (t.categoryAr || '').toLowerCase().includes(q)
                  );
                })
                .map((tool) => (
                  <div
                    key={tool.id}
                    onClick={() => setSelectedTool(tool)}
                    className="p-3 bg-slate-950/70 border border-slate-800 hover:border-cyan-500/50 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{tool.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {tool.nameEn} • Size: {tool.specification ? `${tool.specification}mm` : '—'} • Qty: {tool.quantity}
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        tool.status === 'good'
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                          : tool.status === 'damaged'
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                          : tool.status === 'missing'
                          ? 'bg-red-500/15 border-red-500/30 text-red-400'
                          : 'bg-purple-500/15 border-purple-500/30 text-purple-400'
                      }`}
                    >
                      {tool.statusLabelEn}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </main>

      {/* Selected Tool Modal */}
      {selectedTool && (
        <ToolDetailModal
          tool={selectedTool}
          technician={currentTech}
          onClose={() => setSelectedTool(null)}
          onUpdateStatus={updateToolStatus}
        />
      )}
    </div>
  );
}
