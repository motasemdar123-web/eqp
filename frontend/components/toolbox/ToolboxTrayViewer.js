'use client';

import { useMemo, useState } from 'react';

const STATUS_CONFIG = {
  good: { dot: 'bg-emerald-400', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  damaged: { dot: 'bg-amber-400', badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  missing: { dot: 'bg-red-400', badge: 'bg-red-500/15 text-red-300 border-red-500/30' },
  not_delivered: { dot: 'bg-purple-400', badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
};

const DRAWERS = [
  {
    id: 'DRAWER_1',
    number: '01',
    title: 'Metric & Torx Sockets Drawer',
    titleAr: 'درج البكسات والبوكسات',
    categories: ['sockets', 'specialty_sets'],
    accent: 'from-cyan-500 to-blue-600',
    border: 'border-cyan-500/40',
    icon: '⚙️',
  },
  {
    id: 'DRAWER_2',
    number: '02',
    title: 'Torx & Hex Allen Keys Drawer',
    titleAr: 'درج مفاتيح ألنكيه وتوركس',
    categories: ['torx_keys', 'hex_keys'],
    accent: 'from-purple-500 to-indigo-600',
    border: 'border-purple-500/40',
    icon: '🔑',
  },
  {
    id: 'DRAWER_3',
    number: '03',
    title: 'Combination Spanners & Open Wrenches',
    titleAr: 'درج مفاتيح شق ورنج',
    categories: ['combination_wrenches', 'open_wrenches'],
    accent: 'from-amber-500 to-orange-600',
    border: 'border-amber-500/40',
    icon: '🔧',
  },
  {
    id: 'DRAWER_4',
    number: '04',
    title: 'Screwdrivers, Files & Snap Ring Pliers',
    titleAr: 'درج المفكات والمبارد والسناب رنج',
    categories: ['screwdrivers', 'snap_rings', 'files'],
    accent: 'from-pink-500 to-rose-600',
    border: 'border-pink-500/40',
    icon: '🪛',
  },
  {
    id: 'DRAWER_5',
    number: '05',
    title: 'Heavy Ratchets, Measurement & Specialty Equipment',
    titleAr: 'قاعدة الصندوق: اليدات، الميتر، المطارق والأدوات الثقيلة',
    categories: ['ratchets_extensions', 'pliers_cutters', 'hammers_saws', 'electrical_measuring', 'storage', 'specialty_tools', 'general_tools'],
    accent: 'from-emerald-500 to-teal-600',
    border: 'border-emerald-500/40',
    icon: '⚡',
  },
];

export default function ToolboxTrayViewer({
  tools = [],
  technician,
  onSelectTool,
}) {
  const [activeDrawer, setActiveDrawer] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Drawer grouping
  const drawerGroups = useMemo(() => {
    return DRAWERS.map((drawer) => {
      const drawerTools = tools.filter((t) => drawer.categories.includes(t.category));
      const filtered = drawerTools.filter((t) => {
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return (
          (t.name || '').toLowerCase().includes(q) ||
          (t.nameEn || '').toLowerCase().includes(q) ||
          (t.specification || '').toLowerCase().includes(q)
        );
      });

      return {
        ...drawer,
        tools: drawerTools,
        filteredTools: filtered,
        operationalCount: drawerTools.filter((t) => t.status === 'good').length,
      };
    });
  }, [tools, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Top Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-xl">
        {/* Drawer Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveDrawer('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeDrawer === 'ALL'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
            }`}
          >
            All Drawers ({tools.length} Tools)
          </button>
          {DRAWERS.map((d) => (
            <button
              key={d.id}
              onClick={() => setActiveDrawer(d.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeDrawer === d.id
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>{d.icon}</span>
              <span>{d.number}</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tools in drawers..."
            className="w-64 px-3.5 py-2 pl-9 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
          />
          <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
        </div>
      </div>

      {/* Industrial Drawer Chest Layout */}
      <div className="space-y-5">
        {drawerGroups
          .filter((d) => activeDrawer === 'ALL' || activeDrawer === d.id)
          .map((drawer) => (
            <div
              key={drawer.id}
              className={`bg-slate-900/90 border ${drawer.border} rounded-3xl p-6 shadow-2xl relative overflow-hidden transition-all`}
            >
              {/* Drawer Accent Top Glow Line */}
              <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${drawer.accent}`} />

              {/* Drawer Header Handle Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg shadow-inner">
                    {drawer.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-cyan-400">DRAWER {drawer.number}</span>
                      <span className="text-xs text-slate-500">•</span>
                      <h4 className="text-white font-black text-base">{drawer.title}</h4>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{drawer.titleAr}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-400">
                    Density: <strong className="text-white font-mono">{drawer.tools.length} Tools</strong>
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold font-mono text-[11px]">
                    {drawer.operationalCount}/{drawer.tools.length} Ready
                  </span>
                </div>
              </div>

              {/* Drawer Tool Grid Slots */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {drawer.filteredTools.length > 0 ? (
                  drawer.filteredTools.map((tool) => {
                    const st = STATUS_CONFIG[tool.status] || STATUS_CONFIG.good;
                    return (
                      <button
                        key={tool.id}
                        onClick={() => onSelectTool && onSelectTool(tool)}
                        className="group relative p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-cyan-500 transition-all text-left flex flex-col justify-between shadow-lg hover:shadow-cyan-500/10 hover:-translate-y-1"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-1 mb-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-cyan-400 transition-colors truncate">
                              {tool.categoryEn || tool.categoryAr}
                            </span>
                            <span className={`w-2 h-2 rounded-full ${st.dot} flex-shrink-0`} />
                          </div>

                          <h5 className="text-xs font-black text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                            {tool.name}
                          </h5>
                          <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{tool.nameEn}</p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-850 flex items-center justify-between text-[11px]">
                          <span className="font-mono text-cyan-400 font-bold">
                            {tool.specification ? `${tool.specification}mm` : '—'}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-900 text-[10px] text-slate-300 font-bold font-mono">
                            x{tool.quantity}
                          </span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="col-span-full py-8 text-center text-slate-500 text-xs">
                    No tools match the filter in this drawer.
                  </div>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
