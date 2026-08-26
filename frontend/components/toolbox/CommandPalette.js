'use client';

import { useEffect, useState, useMemo, useRef } from 'react';

export default function CommandPalette({
  isOpen,
  onClose,
  technicians = [],
  tools = [],
  selectedTechnician,
  onSelectTechnician,
  onSelectTool,
  onSetViewMode,
  onResetCamera,
  onToggleExplode,
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Command items matching query
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();

    const actions = [
      {
        id: 'action-3d',
        type: 'action',
        title: 'Switch to 3D Digital Twin Studio',
        subtitle: 'View spatial 3D interactive model and tools',
        icon: '🪐',
        run: () => {
          onSetViewMode('3D');
          onClose();
        },
      },
      {
        id: 'action-list',
        type: 'action',
        title: 'Switch to Inventory Audit Matrix (List View)',
        subtitle: 'Tabular inventory management and CSV export',
        icon: '📋',
        run: () => {
          onSetViewMode('INVENTORY');
          onClose();
        },
      },
      {
        id: 'action-fleet',
        type: 'action',
        title: 'View Fleet Readiness Matrix',
        subtitle: 'Cross-technician readiness analysis',
        icon: '📊',
        run: () => {
          onSetViewMode('FLEET');
          onClose();
        },
      },
      {
        id: 'action-reset-cam',
        type: 'action',
        title: 'Reset 3D Camera View (Key: R)',
        subtitle: 'Re-center camera to isometric overview',
        icon: '🎯',
        run: () => {
          if (onResetCamera) onResetCamera();
          onClose();
        },
      },
      {
        id: 'action-explode',
        type: 'action',
        title: 'Toggle Exploded / Inspection View (Key: E)',
        subtitle: 'Expand or close toolbox drawers',
        icon: '🔓',
        run: () => {
          if (onToggleExplode) onToggleExplode();
          onClose();
        },
      },
    ];

    const techResults = technicians.map((t) => ({
      id: `tech-${t.slug}`,
      type: 'technician',
      title: `${t.name} (${t.nameEn})`,
      subtitle: `${t.role} • ${t.stats.totalQuantity} tools • ${t.stats.operationalRate}% ready`,
      icon: '👤',
      run: () => {
        onSelectTechnician(t.slug);
        onClose();
      },
    }));

    const toolResults = tools.map((tool) => ({
      id: `tool-${tool.id}`,
      type: 'tool',
      title: `${tool.name} ${tool.specification ? `(${tool.specification}mm)` : ''}`,
      subtitle: `${tool.nameEn} • ${tool.categoryEn || tool.categoryAr} • Qty: ${tool.quantity} • ${tool.statusLabelEn}`,
      icon: '🛠️',
      status: tool.status,
      run: () => {
        onSelectTool(tool);
        onClose();
      },
    }));

    if (!q) {
      return [...actions, ...techResults.slice(0, 4), ...toolResults.slice(0, 6)];
    }

    const filteredActions = actions.filter(
      (a) => a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q)
    );
    const filteredTechs = techResults.filter(
      (t) => t.title.toLowerCase().includes(q) || t.subtitle.toLowerCase().includes(q)
    );
    const filteredTools = toolResults.filter(
      (t) => t.title.toLowerCase().includes(q) || t.subtitle.toLowerCase().includes(q)
    );

    return [...filteredActions, ...filteredTechs, ...filteredTools].slice(0, 20);
  }, [query, technicians, tools, onSetViewMode, onResetCamera, onToggleExplode, onSelectTechnician, onSelectTool, onClose]);

  // Keyboard navigation inside palette
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, results.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % Math.max(1, results.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        results[selectedIndex].run();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-start justify-center pt-20 p-4 animate-[ds-toast-in_120ms_ease]"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-2xl bg-slate-900 rounded-2xl shadow-2xl border border-slate-700/80 overflow-hidden flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800 bg-slate-950/90">
          <span className="text-slate-400 text-base">🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a tool name, technician, size, drawer, or action..."
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
          />
          <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-400">
            ESC to close
          </kbd>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 divide-y divide-slate-800/40">
          {results.length > 0 ? (
            results.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.run}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 rounded-xl cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                    isSelected ? 'bg-cyan-500/15 border border-cyan-500/40 text-white' : 'hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-lg w-7 h-7 rounded-lg bg-slate-800/80 flex items-center justify-center shrink-0">
                      {item.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-xs sm:text-sm text-white truncate">{item.title}</div>
                      <div className="text-[11px] text-slate-400 truncate">{item.subtitle}</div>
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-500 font-mono shrink-0">
                    {item.type === 'action' ? 'Action' : item.type === 'technician' ? 'Technician' : 'Tool'}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs">
              No results found for &ldquo;{query}&rdquo;. Try another term.
            </div>
          )}
        </div>

        {/* Bottom Footer Info */}
        <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
          <span>Dar Al Hai Toolbox Digital Twin</span>
        </div>
      </div>
    </div>
  );
}
