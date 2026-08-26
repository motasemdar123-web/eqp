'use client';

import { DetailDrawer } from '../ui/DetailDrawer';

export default function ToolDetailDrawer({
  isOpen,
  tool,
  technician,
  onClose,
  onOpenDamage,
  onOpenMissing,
  onMarkOperational,
}) {
  if (!tool) return null;

  const statusConfig = {
    good: {
      badge: <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold">● Operational</span>,
      icon: '✅',
      desc: 'Tool is certified operational with zero structural wear or calibration drift.',
    },
    damaged: {
      badge: <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs font-bold">⚠️ Damaged</span>,
      icon: '⚠️',
      desc: 'Tool reported damaged. Maintenance review or replacement pending.',
    },
    missing: {
      badge: <span className="px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 text-xs font-bold">❌ Missing</span>,
      icon: '❌',
      desc: 'Tool unaccounted for. Flagged in inventory loss registry.',
    },
    not_delivered: {
      badge: <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 text-xs font-bold">⏳ Pending Delivery</span>,
      icon: '⏳',
      desc: 'Item not yet issued to technician by central tool crib.',
    },
  };

  const currentStatus = statusConfig[tool.status] || statusConfig.good;

  return (
    <DetailDrawer
      open={isOpen}
      onClose={onClose}
      title={tool.name}
      subtitle={`${tool.nameEn} • ${tool.categoryEn || tool.categoryAr}`}
      badge={currentStatus.badge}
      size="lg"
      className="bg-slate-900 text-white border-l border-slate-800"
    >
      <div className="p-6 space-y-6 overflow-y-auto">
        {/* Top Summary Banner */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 font-bold block">
              ASSET ID: DAH-TOOL-{tool.id.toString().padStart(4, '0')}
            </span>
            <h3 className="text-base font-black text-white mt-0.5">{tool.name}</h3>
            <p className="text-xs text-slate-400">{tool.nameEn}</p>
          </div>
          <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-cyan-300 font-mono font-bold text-sm">
            {tool.specification ? `${tool.specification} mm` : 'Standard Metric'}
          </span>
        </div>

        {/* Section 1: Technical Identification */}
        <div>
          <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider mb-3">
            1. Technical Identification & Specs
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl">
              <span className="text-[10px] text-slate-500 font-medium block">Category</span>
              <span className="text-xs font-bold text-white mt-1 block">{tool.categoryEn || tool.categoryAr}</span>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl">
              <span className="text-[10px] text-slate-500 font-medium block">Dimension / Spec</span>
              <span className="text-xs font-bold text-cyan-400 font-mono mt-1 block">
                {tool.specification ? `${tool.specification} mm` : 'Standard'}
              </span>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl">
              <span className="text-[10px] text-slate-500 font-medium block">Quantity in Box</span>
              <span className="text-xs font-bold text-white font-mono mt-1 block">{tool.quantity} PCS</span>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl">
              <span className="text-[10px] text-slate-500 font-medium block">Assigned Technician</span>
              <span className="text-xs font-bold text-slate-200 mt-1 block truncate">{technician?.name}</span>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl">
              <span className="text-[10px] text-slate-500 font-medium block">Handover Date</span>
              <span className="text-xs font-bold text-slate-300 mt-1 block">{technician?.deliveryDate || 'N/A'}</span>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl">
              <span className="text-[10px] text-slate-500 font-medium block">Standard / Grade</span>
              <span className="text-xs font-bold text-slate-300 mt-1 block">ISO 3318 / DIN 3113</span>
            </div>
          </div>
        </div>

        {/* Section 2: Condition & Quality Certification */}
        <div>
          <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider mb-3">
            2. Condition & Readiness Status
          </h4>
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-start gap-3.5">
            <span className="text-2xl">{currentStatus.icon}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white">{tool.statusLabelEn || tool.status}</span>
                <span className="text-xs text-slate-400 font-normal">({tool.statusLabelAr})</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{currentStatus.desc}</p>
              {tool.inspectionNote && (
                <div className="mt-2.5 p-2 bg-slate-900 rounded-lg text-xs text-slate-300 border border-slate-800 font-mono">
                  Inspection Note: {tool.inspectionNote}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Inspection History Timeline */}
        <div>
          <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider mb-3">
            3. Lifecycle & Audit Trail
          </h4>
          <div className="space-y-2.5 border-l-2 border-slate-800 ml-2 pl-4">
            <div className="relative">
              <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-cyan-400 ring-4 ring-slate-900" />
              <div className="text-xs font-bold text-white">Annual Verification & Inventory Calibration</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {technician?.deliveryDate || '2023-08-31'} • Inspector: Quality Assurance Team
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-slate-600 ring-4 ring-slate-900" />
              <div className="text-xs font-bold text-slate-300">Initial Tool Handover & Delivery</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Kit issued to {technician?.name} with complete calibration certificates.
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Workflow Actions */}
        <div className="pt-4 border-t border-slate-800 flex flex-wrap gap-2.5">
          <button
            onClick={() => {
              onClose();
              if (onOpenDamage) onOpenDamage(tool);
            }}
            className="px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <span>⚠️</span>
            <span>Report Damage / Wear</span>
          </button>

          <button
            onClick={() => {
              onClose();
              if (onOpenMissing) onOpenMissing(tool);
            }}
            className="px-4 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-300 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <span>❌</span>
            <span>Mark as Missing</span>
          </button>

          {tool.status !== 'good' && (
            <button
              onClick={() => {
                onClose();
                if (onMarkOperational) onMarkOperational(tool.id);
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <span>✅</span>
              <span>Mark Operational</span>
            </button>
          )}
        </div>
      </div>
    </DetailDrawer>
  );
}
