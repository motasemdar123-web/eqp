'use client';

import { useState } from 'react';

const STATUS_CONFIG = {
  good: {
    labelAr: 'سليم / متوفر',
    labelEn: 'Operational / Available',
    bg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
    dot: 'bg-emerald-400',
    actionText: 'Mark Operational',
  },
  damaged: {
    labelAr: 'تالف / بحاجة صيانة',
    labelEn: 'Damaged / Needs Repair',
    bg: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
    dot: 'bg-amber-400',
    actionText: 'Report as Damaged',
  },
  missing: {
    labelAr: 'مفقود',
    labelEn: 'Missing / Lost',
    bg: 'bg-red-500/15 border-red-500/40 text-red-300',
    dot: 'bg-red-400',
    actionText: 'Report as Missing',
  },
  not_delivered: {
    labelAr: 'لم يتم التسليم',
    labelEn: 'Pending Delivery / Not Issued',
    bg: 'bg-purple-500/15 border-purple-500/40 text-purple-300',
    dot: 'bg-purple-400',
    actionText: 'Mark Delivered',
  },
};

export default function ToolDetailModal({
  tool,
  technician,
  onClose,
  onUpdateStatus,
}) {
  const [currentStatus, setCurrentStatus] = useState(tool?.status || 'good');
  const [isUpdating, setIsUpdating] = useState(false);
  const [note, setNote] = useState('');
  const [copied, setCopied] = useState(false);

  if (!tool) return null;

  const currentCfg = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.good;

  const handleStatusChange = (newStatus) => {
    setIsUpdating(true);
    setCurrentStatus(newStatus);
    if (onUpdateStatus) {
      onUpdateStatus(tool.id, newStatus, note);
    }
    setTimeout(() => {
      setIsUpdating(false);
    }, 400);
  };

  const handleCopyTag = () => {
    const tag = `TOOL-TAG: [${tool.name}] | Tech: ${technician?.name || 'N/A'} | ID: ${tool.id} | Status: ${currentStatus}`;
    navigator.clipboard.writeText(tag);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Click backdrop to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-cyan-950/40 overflow-hidden z-10 flex flex-col max-h-[90vh]">
        {/* Header Glow Banner */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800 flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-2xl shadow-inner shadow-cyan-500/20">
              🛠️
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-800/60">
                  {tool.categoryEn || tool.categoryAr}
                </span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${currentCfg.bg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${currentCfg.dot}`} />
                  {currentCfg.labelEn}
                </span>
              </div>
              <h2 className="text-xl font-black text-white">{tool.name}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{tool.nameEn}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Key Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
              <span className="text-[11px] font-medium text-slate-400 block">Specification / Size</span>
              <span className="text-base font-bold text-white font-mono mt-0.5 block">
                {tool.specification ? `${tool.specification} mm` : 'Standard'}
              </span>
            </div>

            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
              <span className="text-[11px] font-medium text-slate-400 block">Quantity in Box</span>
              <span className="text-base font-bold text-cyan-400 font-mono mt-0.5 block">
                {tool.quantity} PCS
              </span>
            </div>

            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
              <span className="text-[11px] font-medium text-slate-400 block">Assigned Technician</span>
              <span className="text-xs font-bold text-white mt-1 block truncate">
                {technician?.name || 'Assigned Staff'}
              </span>
            </div>

            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
              <span className="text-[11px] font-medium text-slate-400 block">Delivery Date</span>
              <span className="text-xs font-bold text-slate-300 mt-1 block">
                {technician?.deliveryDate || 'N/A'}
              </span>
            </div>
          </div>

          {/* Condition & Status Management */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
              Update Tool Condition / State
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => handleStatusChange('good')}
                className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                  currentStatus === 'good'
                    ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 shadow-lg shadow-emerald-950/50'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <span className="text-base">✅</span>
                <span>Operational</span>
                <span className="text-[10px] text-emerald-400/80 font-normal">سليم</span>
              </button>

              <button
                onClick={() => handleStatusChange('damaged')}
                className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                  currentStatus === 'damaged'
                    ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-lg shadow-amber-950/50'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <span className="text-base">⚠️</span>
                <span>Damaged</span>
                <span className="text-[10px] text-amber-400/80 font-normal">تالف</span>
              </button>

              <button
                onClick={() => handleStatusChange('missing')}
                className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                  currentStatus === 'missing'
                    ? 'bg-red-500/25 border-red-400 text-red-300 shadow-lg shadow-red-950/50'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <span className="text-base">❌</span>
                <span>Missing</span>
                <span className="text-[10px] text-red-400/80 font-normal">مفقود</span>
              </button>

              <button
                onClick={() => handleStatusChange('not_delivered')}
                className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                  currentStatus === 'not_delivered'
                    ? 'bg-purple-500/25 border-purple-400 text-purple-300 shadow-lg shadow-purple-950/50'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <span className="text-base">⏳</span>
                <span>Pending</span>
                <span className="text-[10px] text-purple-400/80 font-normal">لم يتم التسليم</span>
              </button>
            </div>
          </div>

          {/* Action Log / Notes input */}
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1">
              Workshop Inspection Note (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Broken drive square on socket ratchet, requested replacement from warehouse"
              className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={handleCopyTag}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            {copied ? '✓ Tag Copied' : '📋 Copy Tool Tag'}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                if (onUpdateStatus) onUpdateStatus(tool.id, currentStatus, note);
                onClose();
              }}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all shadow-md shadow-cyan-500/20"
            >
              Save & Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
