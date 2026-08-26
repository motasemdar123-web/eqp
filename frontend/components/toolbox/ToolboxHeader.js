'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

export default function ToolboxHeader({
  technicians = [],
  selectedSlug,
  onSelectTechnician,
  viewMode,
  onSetViewMode,
  onOpenCommandPalette,
  onExportCsv,
  readinessRate = 100,
  damagedCount = 0,
  missingCount = 0,
}) {
  const [isTechDropdownOpen, setIsTechDropdownOpen] = useState(false);
  const [searchTech, setSearchTech] = useState('');
  const dropdownRef = useRef(null);

  const currentTech = technicians.find((t) => t.slug === selectedSlug) || technicians[0];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsTechDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredTechs = technicians.filter((t) => {
    if (!searchTech.trim()) return true;
    const q = searchTech.toLowerCase();
    return (
      (t.name || '').toLowerCase().includes(q) ||
      (t.nameEn || '').toLowerCase().includes(q) ||
      (t.role || '').toLowerCase().includes(q)
    );
  });

  return (
    <header className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      {/* Left: Breadcrumbs & Compact Technician Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Breadcrumb */}
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Link href="/management" className="hover:text-slate-200 transition-colors">
              Dar Al Hai
            </Link>
            <span>/</span>
            <Link href="/management/fleet-analytics" className="hover:text-slate-200 transition-colors">
              Operations
            </Link>
            <span>/</span>
            <span className="text-cyan-400 font-bold">Technician Toolboxes</span>
          </div>

          {/* Active Technician Dropdown Selector */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsTechDropdownOpen(!isTechDropdownOpen)}
              className="flex items-center gap-3 px-3.5 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-700/80 hover:border-cyan-500/60 rounded-xl transition-all shadow-sm text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-xs">
                🧰
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-white group-hover:text-cyan-300 transition-colors truncate">
                    {currentTech?.name}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${
                      currentTech?.stats?.operationalRate >= 95
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {currentTech?.stats?.operationalRate}%
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">{currentTech?.nameEn} • {currentTech?.role}</p>
              </div>

              <span className="text-xs text-slate-400 ml-2 group-hover:text-cyan-400 transition-colors">
                ▾
              </span>
            </button>

            {/* Dropdown Popover */}
            {isTechDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-2 border-b border-slate-800">
                  <input
                    type="text"
                    value={searchTech}
                    onChange={(e) => setSearchTech(e.target.value)}
                    placeholder="Search technician..."
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    autoFocus
                  />
                </div>

                <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/40 p-1">
                  {filteredTechs.map((t) => {
                    const isSelected = t.slug === selectedSlug;
                    return (
                      <div
                        key={t.slug}
                        onClick={() => {
                          onSelectTechnician(t.slug);
                          setIsTechDropdownOpen(false);
                        }}
                        className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between gap-2 transition-colors ${
                          isSelected ? 'bg-cyan-500/20 text-white border border-cyan-500/40' : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-white truncate">{t.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">{t.nameEn} • {t.stats.totalQuantity} tools</div>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-cyan-400 shrink-0">
                          {t.stats.operationalRate}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Center & Right: Mode Switcher & Global Actions */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* View Mode Switcher Pills */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
          <button
            onClick={() => onSetViewMode('3D')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === '3D'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <span>🪐</span>
            <span>3D Studio</span>
          </button>

          <button
            onClick={() => onSetViewMode('INVENTORY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'INVENTORY'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <span>📋</span>
            <span>Inventory List</span>
          </button>

          <button
            onClick={() => onSetViewMode('FLEET')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'FLEET'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <span>📊</span>
            <span>Fleet Matrix</span>
          </button>
        </div>

        {/* Command Palette Button */}
        <button
          onClick={onOpenCommandPalette}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-2 shadow-xs"
        >
          <span>⌘K</span>
          <span className="hidden sm:inline">Commands</span>
        </button>

        {/* Export CSV Button */}
        {onExportCsv && (
          <button
            onClick={onExportCsv}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <span>📥</span>
            <span className="hidden sm:inline">Audit CSV</span>
          </button>
        )}
      </div>
    </header>
  );
}
