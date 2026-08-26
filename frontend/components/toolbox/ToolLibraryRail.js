'use client';

import { useMemo, useState } from 'react';

const CATEGORY_ICONS = {
  ALL: '📦',
  sockets: '⚙️',
  combination_wrenches: '🔧',
  open_wrenches: '🔩',
  torx_keys: '🔑',
  hex_keys: '🪛',
  screwdrivers: '🪛',
  snap_rings: '🧲',
  files: '📐',
  ratchets_extensions: '🦾',
  pliers_cutters: '✂️',
  hammers_saws: '🔨',
  electrical_measuring: '⚡',
  storage: '🧰',
  specialty_tools: '🛠️',
  general_tools: '🪚',
};

const DRAWERS = [
  { id: 'ALL', name: 'All Trays', icon: '🧰' },
  { id: 'DRAWER_1', name: 'D1: Sockets', categories: ['sockets', 'specialty_sets'], icon: '1️⃣' },
  { id: 'DRAWER_2', name: 'D2: Hex/Torx', categories: ['torx_keys', 'hex_keys'], icon: '2️⃣' },
  { id: 'DRAWER_3', name: 'D3: Spanners', categories: ['combination_wrenches', 'open_wrenches'], icon: '3️⃣' },
  { id: 'DRAWER_4', name: 'D4: Screwdrivers', categories: ['screwdrivers', 'snap_rings', 'files'], icon: '4️⃣' },
  { id: 'DRAWER_5', name: 'D5: Base Heavy', categories: ['ratchets_extensions', 'pliers_cutters', 'hammers_saws', 'electrical_measuring', 'storage', 'specialty_tools', 'general_tools'], icon: '5️⃣' },
];

export default function ToolLibraryRail({
  tools = [],
  selectedToolId,
  onSelectTool,
  activeCategory,
  onSelectCategory,
  activeDrawer,
  onSelectDrawer,
  searchQuery,
  onSearchChange,
  isCollapsed = false,
  onToggleCollapse,
}) {
  const [activeTab, setActiveTab] = useState('CATEGORIES'); // 'CATEGORIES' | 'DRAWERS'

  // Extract available categories
  const categories = useMemo(() => {
    const map = new Map();
    tools.forEach((t) => {
      const cat = t.category || 'general_tools';
      if (!map.has(cat)) {
        map.set(cat, {
          id: cat,
          titleAr: t.categoryAr || cat,
          titleEn: t.categoryEn || cat,
          count: 0,
          damaged: 0,
        });
      }
      const item = map.get(cat);
      item.count += 1;
      if (t.status === 'damaged' || t.status === 'missing') {
        item.damaged += 1;
      }
    });
    return Array.from(map.values());
  }, [tools]);

  // Filter tools for the list
  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      // Drawer filter
      if (activeDrawer && activeDrawer !== 'ALL') {
        const dObj = DRAWERS.find((d) => d.id === activeDrawer);
        if (dObj && !dObj.categories.includes(tool.category)) return false;
      }

      // Category filter
      if (activeCategory && activeCategory !== 'ALL' && tool.category !== activeCategory) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mName = (tool.name || '').toLowerCase().includes(q);
        const mEn = (tool.nameEn || '').toLowerCase().includes(q);
        const mCat = (tool.categoryAr || '').toLowerCase().includes(q);
        const mSpec = (tool.specification || '').toLowerCase().includes(q);
        if (!mName && !mEn && !mCat && !mSpec) return false;
      }

      return true;
    });
  }, [tools, activeDrawer, activeCategory, searchQuery]);

  if (isCollapsed) {
    return (
      <div className="h-full bg-slate-900 border border-slate-800 rounded-3xl p-3 flex flex-col items-center justify-between shadow-xl">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white transition-colors"
          title="Expand Tool Library"
        >
          📂
        </button>
        <span className="text-[10px] text-slate-500 font-mono transform -rotate-90 origin-center whitespace-nowrap">
          LIBRARY ({tools.length})
        </span>
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white transition-colors"
          title="Expand"
        >
          →
        </button>
      </div>
    );
  }

  return (
    <aside className="h-full bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col justify-between shadow-2xl space-y-4">
      {/* Header & Search */}
      <div className="space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm">🗃️</span>
            <h3 className="text-white font-black text-sm tracking-tight">Tool Library</h3>
            <span className="text-[10px] font-mono text-cyan-400 font-bold bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
              {filteredTools.length}
            </span>
          </div>

          <button
            onClick={onToggleCollapse}
            className="text-slate-400 hover:text-slate-200 text-xs p-1 rounded-lg hover:bg-slate-800 transition-colors"
            title="Collapse Sidebar"
          >
            ◀
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search name, size, category..."
            className="w-full px-3 py-2 pl-8.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <span className="absolute left-2.5 top-2 text-slate-500 text-xs">🔍</span>
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-2 text-slate-500 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* View Switcher: Categories vs Drawers */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('CATEGORIES')}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
              activeTab === 'CATEGORIES'
                ? 'bg-slate-800 text-cyan-300 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Categories
          </button>
          <button
            onClick={() => setActiveTab('DRAWERS')}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
              activeTab === 'DRAWERS'
                ? 'bg-slate-800 text-cyan-300 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Drawers (5)
          </button>
        </div>

        {/* Filter Badges Carousel/Chips */}
        {activeTab === 'CATEGORIES' ? (
          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
            <button
              onClick={() => onSelectCategory('ALL')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                activeCategory === 'ALL'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-850'
              }`}
            >
              All ({tools.length})
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelectCategory(c.id)}
                className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all flex items-center gap-1 ${
                  activeCategory === c.id
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-850'
                }`}
              >
                <span>{CATEGORY_ICONS[c.id] || '⚙️'}</span>
                <span>{c.titleEn || c.titleAr}</span>
                <span className="opacity-70">({c.count})</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1">
            {DRAWERS.map((d) => (
              <button
                key={d.id}
                onClick={() => onSelectDrawer(d.id)}
                className={`p-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 ${
                  activeDrawer === d.id
                    ? 'bg-cyan-500 text-slate-950 shadow-xs'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-850'
                }`}
              >
                <span>{d.icon}</span>
                <span className="truncate">{d.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Scrollable Tool Items List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-[220px]">
        {filteredTools.length > 0 ? (
          filteredTools.map((tool) => {
            const isSelected = selectedToolId === tool.id;
            return (
              <div
                key={tool.id}
                onClick={() => onSelectTool(tool)}
                className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-2 border ${
                  isSelected
                    ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-md shadow-cyan-950/40'
                    : 'bg-slate-950/60 border-slate-850 hover:bg-slate-850 text-slate-300'
                }`}
              >
                <div className="min-w-0 flex items-center gap-2">
                  <span className="text-xs">{CATEGORY_ICONS[tool.category] || '🛠️'}</span>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-white truncate">{tool.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{tool.nameEn}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {tool.specification && (
                    <span className="font-mono text-[10px] font-bold text-cyan-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                      {tool.specification}mm
                    </span>
                  )}
                  <span
                    className={`w-2 h-2 rounded-full ${
                      tool.status === 'good'
                        ? 'bg-emerald-400'
                        : tool.status === 'damaged'
                        ? 'bg-amber-400'
                        : tool.status === 'missing'
                        ? 'bg-red-400'
                        : 'bg-purple-400'
                    }`}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-8 text-center text-slate-500 text-xs">
            No matching tools found.
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
        <span>Click tool to focus in 3D</span>
        <kbd className="font-mono text-[10px] bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-slate-400">
          Key: F
        </kbd>
      </div>
    </aside>
  );
}
