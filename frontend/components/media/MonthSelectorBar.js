'use client';

import React from 'react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { CONTENT_PILLARS } from '../../lib/mediaMonthlyData';

export default function MonthSelectorBar({
  availableMonths,
  selectedMonthId,
  onSelectMonth,
  activeCampaign,
  onOpenNewMonthModal,
  onOpenNewConceptModal,
  onOpenPrintBook,
  onResetMonth,
}) {
  if (!activeCampaign) return null;

  return (
    <div className="space-y-4">
      {/* Month Navigation Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider px-2">
            Campaign Month:
          </span>
          {availableMonths.map((m) => {
            const isSelected = selectedMonthId === m.monthId;
            return (
              <button
                key={m.monthId}
                type="button"
                onClick={() => onSelectMonth(m.monthId)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs scale-102'
                    : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                📅 {m.monthName}
              </button>
            );
          })}

          <button
            type="button"
            onClick={onOpenNewMonthModal}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100 transition-all flex items-center gap-1"
          >
            <span>+</span> New Month
          </button>
        </div>

        {/* Global Month Actions */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onOpenPrintBook}
            className="text-xs font-bold !bg-white hover:!bg-slate-50"
          >
            📖 Master Production Book
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onResetMonth}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            ↺ Reset
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onOpenNewConceptModal}
            className="!bg-amber-500 hover:!bg-amber-400 !text-slate-950 !font-bold text-xs shadow-xs"
          >
            + Add Concept
          </Button>
        </div>
      </div>

      {/* Strategic Campaign Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-extrabold uppercase tracking-wider">
                Monthly Strategic Focus
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {activeCampaign.monthName}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {activeCampaign.themeTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-0.5">
              {activeCampaign.strategicGoal}
            </p>
          </div>

          {/* Target KPI Badge */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 space-y-1.5 shrink-0 max-w-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Target Monthly KPIs
              </span>
              <Badge tone="live">Live Target</Badge>
            </div>
            <p className="text-xs font-bold text-amber-300 leading-snug">
              {activeCampaign.targetKpi}
            </p>
          </div>
        </div>

        {/* Content Pillar Allocation Visualizer Bar */}
        <div className="pt-2 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-slate-400 uppercase tracking-wider">
              Strategic Content Pillar Split:
            </span>
            <span className="text-slate-400 text-[10px]">100% Balanced Campaign Mix</span>
          </div>

          <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
            <div style={{ width: '20%' }} className="bg-sky-500" title="Brand Authority (20%)" />
            <div style={{ width: '30%' }} className="bg-indigo-500" title="Technical Specs (30%)" />
            <div style={{ width: '20%' }} className="bg-amber-500" title="Workshop BTS (20%)" />
            <div style={{ width: '15%' }} className="bg-emerald-500" title="Kuwait Projects (15%)" />
            <div style={{ width: '15%' }} className="bg-rose-500" title="After-Sales & Lead Gen (15%)" />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1 text-[10px] font-semibold text-slate-300">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-500" /> Brand (20%)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500" /> Engineering Specs (30%)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Workshop & Overhaul (20%)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Kuwait Jobsites (15%)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Lead Gen & Parts (15%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
