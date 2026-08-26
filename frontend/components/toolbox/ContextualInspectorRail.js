'use client';

import { useState } from 'react';

const STATUS_THEMES = {
  good: {
    labelAr: 'سليم / متوفر',
    labelEn: 'Operational',
    badge: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    dot: 'bg-emerald-400',
  },
  damaged: {
    labelAr: 'تالف / صيانة',
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
    labelEn: 'Pending',
    badge: 'bg-purple-500/15 border-purple-500/30 text-purple-400',
    dot: 'bg-purple-400',
  },
};

export default function ContextualInspectorRail({
  tool,
  technician,
  onOpenDetails,
  onOpenDamageModal,
  onOpenMissingModal,
  onQuickMarkOperational,
  isCollapsed = false,
  onToggleCollapse,
}) {
  const [copied, setCopied] = useState(false);

  if (isCollapsed) {
    return (
      <div className="h-full bg-slate-900 border border-slate-800 rounded-3xl p-3 flex flex-col items-center justify-between shadow-xl">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white transition-colors"
          title="Expand Tool Inspector"
        >
          🔍
        </button>
        <span className="text-[10px] text-slate-500 font-mono transform -rotate-90 origin-center whitespace-nowrap">
          INSPECTOR
        </span>
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white transition-colors"
          title="Expand"
        >
          ←
        </button>
      </div>
    );
  }

  if (!tool) {
    return (
      <aside className="h-full bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center text-slate-500 space-y-3 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-2xl shadow-inner">
          🔍
        </div>
        <h4 className="text-white font-bold text-sm">Tool Inspector</h4>
        <p className="text-xs text-slate-400 max-w-[200px] leading-relaxed">
          Select any physical tool in the 3D toolbox or library to inspect specifications and trigger maintenance workflows.
        </p>
      </aside>
    );
  }

  const st = STATUS_THEMES[tool.status] || STATUS_THEMES.good;

  const handleCopyTag = () => {
    const tag = `[DAR-AL-HAI] TOOL-ID: ${tool.id} | Name: ${tool.name} (${tool.nameEn}) | Tech: ${technician?.name || 'N/A'} | Status: ${tool.status}`;
    navigator.clipboard.writeText(tag);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside className="h-full bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between shadow-2xl space-y-4">
      {/* Top Header */}
      <div className="space-y-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-black uppercase tracking-wider">
              {tool.categoryEn || tool.categoryAr}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${st.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
              {st.labelEn}
            </span>
          </div>

          <button
            onClick={onToggleCollapse}
            className="text-slate-400 hover:text-slate-200 text-xs p-1 rounded-lg hover:bg-slate-800 transition-colors"
            title="Collapse Sidebar"
          >
            ▶
          </button>
        </div>

        {/* Title */}
        <div>
          <h3 className="text-lg font-black text-white leading-snug">{tool.name}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{tool.nameEn}</p>
        </div>

        {/* Specification Card Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-400 font-medium block">Size / Spec</span>
            <span className="text-xs font-bold text-cyan-400 font-mono mt-0.5 block">
              {tool.specification ? `${tool.specification} mm` : 'Standard'}
            </span>
          </div>

          <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-400 font-medium block">Quantity in Box</span>
            <span className="text-xs font-bold text-white font-mono mt-0.5 block">
              {tool.quantity} PCS
            </span>
          </div>

          <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-400 font-medium block">Technician</span>
            <span className="text-xs font-bold text-slate-200 mt-0.5 block truncate">
              {technician?.name}
            </span>
          </div>

          <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-400 font-medium block">Delivery Date</span>
            <span className="text-xs font-bold text-slate-300 mt-0.5 block">
              {technician?.deliveryDate || 'N/A'}
            </span>
          </div>
        </div>

        {/* Action Buttons Hub */}
        <div className="space-y-2 pt-2">
          {/* Primary View Details Button */}
          <button
            onClick={() => onOpenDetails && onOpenDetails(tool)}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs transition-all shadow-md shadow-cyan-500/20 flex items-center justify-center gap-2"
          >
            <span>🔍</span>
            <span>Inspect Lifecycle Details</span>
          </button>

          {/* Report Damage Trigger */}
          <button
            onClick={() => onOpenDamageModal && onOpenDamageModal(tool)}
            className="w-full py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs transition-all flex items-center justify-center gap-2"
          >
            <span>⚠️</span>
            <span>Report Damage / Wear</span>
          </button>

          {/* Mark Missing Trigger */}
          <button
            onClick={() => onOpenMissingModal && onOpenMissingModal(tool)}
            className="w-full py-2 px-3 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-300 font-bold text-xs transition-all flex items-center justify-center gap-2"
          >
            <span>❌</span>
            <span>Mark Tool Missing</span>
          </button>

          {/* Quick Mark Operational if Damaged or Missing */}
          {tool.status !== 'good' && (
            <button
              onClick={() => onQuickMarkOperational && onQuickMarkOperational(tool.id)}
              className="w-full py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-bold text-xs transition-all flex items-center justify-center gap-2"
            >
              <span>✅</span>
              <span>Mark Repaired / Operational</span>
            </button>
          )}
        </div>
      </div>

      {/* Footer Copy Asset Tag */}
      <div className="pt-3 border-t border-slate-800">
        <button
          onClick={handleCopyTag}
          className="w-full py-2 rounded-xl text-xs font-bold bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors flex items-center justify-center gap-1.5"
        >
          <span>{copied ? '✓ Tag Copied' : '📋 Copy Asset Tag'}</span>
        </button>
      </div>
    </aside>
  );
}
