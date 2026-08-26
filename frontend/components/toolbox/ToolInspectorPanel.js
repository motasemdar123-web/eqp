'use client';

import { useState } from 'react';

const STATUS_OPTIONS = [
  {
    key: 'good',
    labelAr: 'سليم / متوفر',
    labelEn: 'Operational',
    badge: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    dot: 'bg-emerald-400',
    icon: '✅',
  },
  {
    key: 'damaged',
    labelAr: 'تالف',
    labelEn: 'Damaged',
    badge: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
    dot: 'bg-amber-400',
    icon: '⚠️',
  },
  {
    key: 'missing',
    labelAr: 'مفقود',
    labelEn: 'Missing',
    badge: 'bg-red-500/15 border-red-500/30 text-red-400',
    dot: 'bg-red-400',
    icon: '❌',
  },
  {
    key: 'not_delivered',
    labelAr: 'لم يتم التسليم',
    labelEn: 'Pending',
    badge: 'bg-purple-500/15 border-purple-500/30 text-purple-400',
    dot: 'bg-purple-400',
    icon: '⏳',
  },
];

export default function ToolInspectorPanel({
  tool,
  technician,
  onClose,
  onUpdateStatus,
}) {
  const [note, setNote] = useState(tool?.inspectionNote || '');
  const [copied, setCopied] = useState(false);

  if (!tool) {
    return (
      <div className="h-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center text-slate-500 space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-3xl">
          🔍
        </div>
        <h4 className="text-white font-bold text-base">Live Tool Inspector</h4>
        <p className="text-xs text-slate-400 max-w-xs">
          Click any floating tool in the 3D scene or tray list to inspect specifications and update condition states in real-time.
        </p>
      </div>
    );
  }

  const currentStatus = tool.status || 'good';
  const statusCfg = STATUS_OPTIONS.find((s) => s.key === currentStatus) || STATUS_OPTIONS[0];

  const handleCopyTag = () => {
    const tag = `[EQP-TOOL] ID:${tool.id} | Name: ${tool.name} (${tool.nameEn}) | Tech: ${technician?.name || 'N/A'} | Status: ${currentStatus}`;
    navigator.clipboard.writeText(tag);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-2xl space-y-6">
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[11px] font-bold uppercase tracking-wider">
              {tool.categoryEn || tool.categoryAr}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${statusCfg.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
              {statusCfg.labelEn}
            </span>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Tool Title */}
        <h3 className="text-xl font-black text-white leading-snug">{tool.name}</h3>
        <p className="text-xs text-slate-400 mt-0.5">{tool.nameEn}</p>

        {/* Specs Card Grid */}
        <div className="grid grid-cols-2 gap-2.5 mt-4">
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-400 font-medium block">Size / Spec</span>
            <span className="text-sm font-bold text-white font-mono mt-0.5 block">
              {tool.specification ? `${tool.specification} mm` : 'Standard'}
            </span>
          </div>

          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-400 font-medium block">Quantity in Box</span>
            <span className="text-sm font-bold text-cyan-400 font-mono mt-0.5 block">
              {tool.quantity} PCS
            </span>
          </div>

          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-400 font-medium block">Assigned Tech</span>
            <span className="text-xs font-bold text-white mt-0.5 block truncate">
              {technician?.name}
            </span>
          </div>

          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-400 font-medium block">Delivery Date</span>
            <span className="text-xs font-bold text-slate-300 mt-0.5 block">
              {technician?.deliveryDate || 'N/A'}
            </span>
          </div>
        </div>

        {/* Condition Status Buttons */}
        <div className="mt-5">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
            Tool Condition Status
          </label>
          <div className="grid grid-cols-2 gap-2">
            {STATUS_OPTIONS.map((st) => (
              <button
                key={st.key}
                onClick={() => onUpdateStatus && onUpdateStatus(tool.id, st.key, note)}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-between ${
                  currentStatus === st.key
                    ? 'bg-slate-800 border-cyan-400 text-white shadow-md shadow-cyan-950/50'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span>{st.icon}</span>
                  <span>{st.labelEn}</span>
                </span>
                <span className="text-[10px] text-slate-500 font-normal">{st.labelAr}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Inspection Note */}
        <div className="mt-4">
          <label className="text-xs font-medium text-slate-400 block mb-1">
            Inspection / Maintenance Log
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => onUpdateStatus && onUpdateStatus(tool.id, currentStatus, note)}
            placeholder="e.g. Socket surface cleaned, torque calibrated"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Footer Copy Tag */}
      <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
        <button
          onClick={handleCopyTag}
          className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition-all flex items-center justify-center gap-2"
        >
          <span>{copied ? '✓ Tag Copied to Clipboard' : '📋 Copy Asset Tag'}</span>
        </button>
      </div>
    </div>
  );
}
