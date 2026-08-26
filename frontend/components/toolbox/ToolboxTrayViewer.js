'use client';

import { useMemo, useState } from 'react';

const STATUS_ICONS = {
  good: { dot: 'bg-emerald-400', label: 'Operational' },
  damaged: { dot: 'bg-amber-400', label: 'Damaged' },
  missing: { dot: 'bg-red-400', label: 'Missing' },
  not_delivered: { dot: 'bg-purple-400', label: 'Pending' },
};

export default function ToolboxTrayViewer({
  tools = [],
  technician,
  onSelectTool,
}) {
  const [activeTray, setActiveTray] = useState('ALL'); // 'ALL' | 'TOP_L' | 'TOP_R' | 'MID_L' | 'MID_R' | 'BOTTOM'

  // Partition tools by physical toolbox compartments
  const traySections = useMemo(() => {
    const topL = tools.filter((t) => ['sockets', 'specialty_sets'].includes(t.category));
    const topR = tools.filter((t) => ['torx_keys', 'hex_keys'].includes(t.category));
    const midL = tools.filter((t) => ['combination_wrenches', 'open_wrenches'].includes(t.category));
    const midR = tools.filter((t) => ['screwdrivers', 'snap_rings', 'files'].includes(t.category));
    const bottom = tools.filter((t) =>
      ['ratchets_extensions', 'pliers_cutters', 'hammers_saws', 'electrical_measuring', 'storage', 'specialty_tools', 'general_tools'].includes(
        t.category
      )
    );

    return { topL, topR, midL, midR, bottom };
  }, [tools]);

  const renderToolPill = (tool) => {
    const st = STATUS_ICONS[tool.status] || STATUS_ICONS.good;
    return (
      <button
        key={tool.id}
        onClick={() => onSelectTool && onSelectTool(tool)}
        className="group relative p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/60 transition-all text-left flex flex-col justify-between shadow-md hover:shadow-cyan-500/10 hover:-translate-y-0.5"
      >
        <div className="flex items-start justify-between gap-1 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-cyan-400 transition-colors truncate">
            {tool.categoryEn || tool.categoryAr}
          </span>
          <span className={`w-2 h-2 rounded-full ${st.dot} flex-shrink-0`} title={st.label} />
        </div>

        <h5 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
          {tool.name}
        </h5>

        <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span className="font-mono text-slate-300 font-medium">{tool.specification ? `${tool.specification}mm` : '—'}</span>
          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-300 font-bold">
            x{tool.quantity}
          </span>
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Tray Selection Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTray('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTray === 'ALL'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            All Compartments ({tools.length})
          </button>
          <button
            onClick={() => setActiveTray('TOP_L')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeTray === 'TOP_L' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Top Left: Sockets ({traySections.topL.length})
          </button>
          <button
            onClick={() => setActiveTray('TOP_R')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeTray === 'TOP_R' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Top Right: Hex / Torx ({traySections.topR.length})
          </button>
          <button
            onClick={() => setActiveTray('MID_L')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeTray === 'MID_L' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Spanners & Wrenches ({traySections.midL.length})
          </button>
          <button
            onClick={() => setActiveTray('MID_R')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeTray === 'MID_R' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Screwdrivers & Files ({traySections.midR.length})
          </button>
          <button
            onClick={() => setActiveTray('BOTTOM')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeTray === 'BOTTOM' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Deep Base: Heavy Tools ({traySections.bottom.length})
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Operational
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> Damaged
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-400" /> Missing
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400" /> Pending
          </span>
        </div>
      </div>

      {/* 2.5D Cantilever Multi-Tier Organizer Container */}
      <div className="p-6 bg-slate-950 rounded-3xl border border-slate-800 space-y-6 shadow-2xl">
        {/* Tier 1: Dual Top Trays (Cantilever Outriggers) */}
        {(activeTray === 'ALL' || activeTray === 'TOP_L' || activeTray === 'TOP_R') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Left: Sockets */}
            {(activeTray === 'ALL' || activeTray === 'TOP_L') && (
              <div className="bg-slate-900/90 rounded-2xl border border-cyan-500/30 p-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500" />
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">
                      1
                    </span>
                    <h4 className="text-white font-bold text-sm">Top Left Cantilever: Sockets & Bits</h4>
                  </div>
                  <span className="text-xs text-cyan-400 font-mono font-bold">{traySections.topL.length} tools</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-72 overflow-y-auto pr-1">
                  {traySections.topL.length > 0 ? (
                    traySections.topL.map(renderToolPill)
                  ) : (
                    <div className="col-span-full py-8 text-center text-slate-500 text-xs">No tools in this compartment</div>
                  )}
                </div>
              </div>
            )}

            {/* Top Right: Hex & Torx Keys */}
            {(activeTray === 'ALL' || activeTray === 'TOP_R') && (
              <div className="bg-slate-900/90 rounded-2xl border border-purple-500/30 p-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500" />
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold">
                      2
                    </span>
                    <h4 className="text-white font-bold text-sm">Top Right Cantilever: Torx & Allen Keys</h4>
                  </div>
                  <span className="text-xs text-purple-400 font-mono font-bold">{traySections.topR.length} tools</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-72 overflow-y-auto pr-1">
                  {traySections.topR.length > 0 ? (
                    traySections.topR.map(renderToolPill)
                  ) : (
                    <div className="col-span-full py-8 text-center text-slate-500 text-xs">No tools in this compartment</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tier 2: Middle Trays (Wrenches & Screwdrivers) */}
        {(activeTray === 'ALL' || activeTray === 'MID_L' || activeTray === 'MID_R') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Middle Left: Spanners */}
            {(activeTray === 'ALL' || activeTray === 'MID_L') && (
              <div className="bg-slate-900/90 rounded-2xl border border-amber-500/30 p-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">
                      3
                    </span>
                    <h4 className="text-white font-bold text-sm">Middle Tray: Spanners & Wrenches</h4>
                  </div>
                  <span className="text-xs text-amber-400 font-mono font-bold">{traySections.midL.length} tools</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-72 overflow-y-auto pr-1">
                  {traySections.midL.length > 0 ? (
                    traySections.midL.map(renderToolPill)
                  ) : (
                    <div className="col-span-full py-8 text-center text-slate-500 text-xs">No tools in this compartment</div>
                  )}
                </div>
              </div>
            )}

            {/* Middle Right: Screwdrivers & Files */}
            {(activeTray === 'ALL' || activeTray === 'MID_R') && (
              <div className="bg-slate-900/90 rounded-2xl border border-pink-500/30 p-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 to-rose-500" />
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center text-xs font-bold">
                      4
                    </span>
                    <h4 className="text-white font-bold text-sm">Middle Tray: Screwdrivers & Pliers</h4>
                  </div>
                  <span className="text-xs text-pink-400 font-mono font-bold">{traySections.midR.length} tools</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-72 overflow-y-auto pr-1">
                  {traySections.midR.length > 0 ? (
                    traySections.midR.map(renderToolPill)
                  ) : (
                    <div className="col-span-full py-8 text-center text-slate-500 text-xs">No tools in this compartment</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tier 3: Bottom Base Cavity (Heavy Tools, Ratchets, Multimeter, Hammers) */}
        {(activeTray === 'ALL' || activeTray === 'BOTTOM') && (
          <div className="bg-slate-900/90 rounded-2xl border border-emerald-500/30 p-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
                  5
                </span>
                <h4 className="text-white font-bold text-sm">
                  Deep Base Cavity: Ratchets, Extensions, Pliers, Multimeter, Hammers & Specialty
                </h4>
              </div>
              <span className="text-xs text-emerald-400 font-mono font-bold">{traySections.bottom.length} tools</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 max-h-80 overflow-y-auto pr-1">
              {traySections.bottom.length > 0 ? (
                traySections.bottom.map(renderToolPill)
              ) : (
                <div className="col-span-full py-8 text-center text-slate-500 text-xs">No tools in this compartment</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
