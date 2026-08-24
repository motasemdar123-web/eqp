'use client';

import React from 'react';

/**
 * Visual Model Distribution Bar Chart (Pure SVG + CSS)
 */
export function FleetModelBarChart({ machines = [], onSelectModel, selectedModel = 'ALL' }) {
  const modelCounts = React.useMemo(() => {
    const counts = {};
    machines.forEach((m) => {
      const model = m.machine_type || m.model || 'Other';
      counts[model] = (counts[model] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [machines]);

  const total = machines.length || 1;
  const colors = [
    { bg: 'bg-amber-500', bar: '#f59e0b', text: 'text-amber-700', light: 'bg-amber-50' },
    { bg: 'bg-sky-500', bar: '#0ea5e9', text: 'text-sky-700', light: 'bg-sky-50' },
    { bg: 'bg-emerald-500', bar: '#10b981', text: 'text-emerald-700', light: 'bg-emerald-50' },
    { bg: 'bg-indigo-500', bar: '#6366f1', text: 'text-indigo-700', light: 'bg-indigo-50' },
    { bg: 'bg-purple-500', bar: '#a855f7', text: 'text-purple-700', light: 'bg-purple-50' },
    { bg: 'bg-slate-500', bar: '#64748b', text: 'text-slate-700', light: 'bg-slate-50' },
  ];

  return (
    <div className="space-y-3">
      {/* Segmented Distribution Bar */}
      <div className="h-3 w-full rounded-full overflow-hidden flex bg-slate-100 p-0.5 border border-slate-200">
        {modelCounts.map(([model, count], idx) => {
          const pct = ((count / total) * 100).toFixed(1);
          const col = colors[idx % colors.length];
          const isSelected = selectedModel === model || selectedModel === 'ALL';
          return (
            <div
              key={model}
              style={{ width: `${pct}%`, backgroundColor: col.bar }}
              title={`${model}: ${count} units (${pct}%)`}
              className={`h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full ${
                isSelected ? 'opacity-100 ring-1 ring-white/50' : 'opacity-30'
              }`}
            />
          );
        })}
      </div>

      {/* Model Chips Grid */}
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          onClick={() => onSelectModel && onSelectModel('ALL')}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
            selectedModel === 'ALL'
              ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-900/20'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <span>All Models</span>
          <span className="px-1.5 py-0.2 rounded-full bg-black/10 text-[11px]">{machines.length}</span>
        </button>

        {modelCounts.map(([model, count], idx) => {
          const col = colors[idx % colors.length];
          const isSelected = selectedModel === model;
          const pct = Math.round((count / total) * 100);
          return (
            <button
              key={model}
              type="button"
              onClick={() => onSelectModel && onSelectModel(model)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                isSelected
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm ring-2 ring-amber-500/20'
                  : `${col.light} ${col.text} border-slate-200 hover:border-slate-300 hover:shadow-xs`
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : col.bg}`} />
              <span>{model}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isSelected ? 'bg-white/20 text-white' : 'bg-white/80 text-slate-700'}`}>
                {count} <span className="opacity-75">({pct}%)</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Engineer Fleet Split Donut / Multi-Pill Chart
 */
export function EngineerFleetDonutChart({ machines = [], onSelectEngineer, selectedEngineer = 'ALL' }) {
  const engineerCounts = React.useMemo(() => {
    const counts = {};
    machines.forEach((m) => {
      const eng = m.responsible_engineer || m.responsibleEngineer || 'Unassigned';
      counts[eng] = (counts[eng] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [machines]);

  const total = machines.length || 1;
  const engColors = {
    'Motasem Ghanem': { stroke: '#d97706', bg: 'bg-amber-500', text: 'text-amber-800', light: 'bg-amber-50', border: 'border-amber-200' },
    'Faisal Inaya': { stroke: '#0284c7', bg: 'bg-sky-500', text: 'text-sky-800', light: 'bg-sky-50', border: 'border-sky-200' },
    'Abdelrahman Abdullah': { stroke: '#059669', bg: 'bg-emerald-500', text: 'text-emerald-800', light: 'bg-emerald-50', border: 'border-emerald-200' },
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {engineerCounts.map(([eng, count]) => {
        const theme = engColors[eng] || { stroke: '#64748b', bg: 'bg-slate-500', text: 'text-slate-800', light: 'bg-slate-50', border: 'border-slate-200' };
        const isSelected = selectedEngineer === eng;
        const pct = Math.round((count / total) * 100);

        return (
          <button
            key={eng}
            type="button"
            onClick={() => onSelectEngineer && onSelectEngineer(isSelected ? 'ALL' : eng)}
            className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
              isSelected
                ? 'bg-slate-900 border-slate-900 text-white shadow-md ring-2 ring-amber-500/30'
                : `${theme.light} ${theme.border} hover:border-slate-300 hover:shadow-xs`
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-amber-400' : theme.bg}`} />
                <span className={`text-xs font-bold tracking-tight truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                  {eng}
                </span>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-amber-300' : 'bg-white text-slate-600 border border-slate-200'}`}>
                {pct}%
              </span>
            </div>

            <div className="flex items-baseline justify-between mt-1">
              <span className={`text-xl font-extrabold ${isSelected ? 'text-white' : theme.text}`}>
                {count}
              </span>
              <span className={`text-[11px] ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                Assigned Units
              </span>
            </div>

            {/* Mini Progress Line */}
            <div className="w-full bg-black/10 h-1 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full ${isSelected ? 'bg-amber-400' : theme.bg}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Fleet SMR Operating Breakdown
 */
export function SmrDistributionChart({ machines = [] }) {
  const stats = React.useMemo(() => {
    let low = 0; // <= 10
    let mid = 0; // 11 - 20
    let high = 0; // 21 - 50
    let veteran = 0; // > 50

    machines.forEach((m) => {
      const smr = Number(m.last_smr || m.lastSmr || 0);
      if (smr <= 10) low += 1;
      else if (smr <= 20) mid += 1;
      else if (smr <= 50) high += 1;
      else veteran += 1;
    });

    const total = machines.length || 1;
    return [
      { label: '0 – 10 hrs', count: low, pct: Math.round((low / total) * 100), color: 'bg-emerald-500', bar: '#10b981' },
      { label: '11 – 20 hrs', count: mid, pct: Math.round((mid / total) * 100), color: 'bg-sky-500', bar: '#0ea5e9' },
      { label: '21 – 50 hrs', count: high, pct: Math.round((high / total) * 100), color: 'bg-amber-500', bar: '#f59e0b' },
      { label: '50+ hrs', count: veteran, pct: Math.round((veteran / total) * 100), color: 'bg-indigo-500', bar: '#6366f1' },
    ];
  }, [machines]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {stats.map((item) => (
          <div key={item.label} className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5">
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 mb-1">
              <span>{item.label}</span>
              <span className="font-bold text-slate-700">{item.pct}%</span>
            </div>
            <p className="text-base font-bold text-slate-900">{item.count} <span className="text-[10px] font-normal text-slate-400">units</span></p>
            <div className="w-full bg-slate-200 h-1 rounded-full mt-1.5 overflow-hidden">
              <div className={`h-full ${item.color}`} style={{ width: `${item.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Visual Milestone Progress Indicator
 */
export function LifecycleMilestoneProgressBar({ milestones = [] }) {
  // Expected standard stages
  const stages = [
    { code: 'W41P', label: 'PDI' },
    { code: 'W41N', label: 'Delivery' },
    { code: 'W411', label: '1st PM' },
    { code: 'W412', label: '2nd PM' },
    { code: 'W413', label: '3rd PM' },
    { code: 'W41X', label: 'Add. Cycle' },
  ];

  return (
    <div className="relative flex items-center justify-between w-full py-2">
      <div className="absolute top-1/2 left-3 right-3 -translate-y-1/2 h-0.5 bg-slate-200 z-0" />
      {stages.map((st, idx) => {
        const found = milestones.find((m) => m.code === st.code && m.date);
        const isDone = Boolean(found);

        return (
          <div key={st.code} className="relative z-10 flex flex-col items-center group">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 ${
                isDone
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                  : 'bg-white border-slate-300 text-slate-400'
              }`}
            >
              {isDone ? (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                idx + 1
              )}
            </div>
            <span className={`text-[10px] font-semibold mt-1 ${isDone ? 'text-slate-800' : 'text-slate-400'}`}>
              {st.label}
            </span>
            {found?.date && (
              <span className="text-[9px] font-mono text-slate-400 mt-0.5 whitespace-nowrap">
                {found.date.slice(5)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
