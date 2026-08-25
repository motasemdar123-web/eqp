'use client';

import React, { useState, useMemo } from 'react';
import Card from '../../ui/Card';
import Badge from '../../ui/Badge';
import Button from '../../ui/Button';

/* ── Donut chart constants ─────────────────────────────────────── */
const PILLARS = [
  { label: 'Brand Authority', pct: 20, color: '#0ea5e9' },   // sky-500
  { label: 'Tech & Specs',    pct: 30, color: '#6366f1' },   // indigo-500
  { label: 'Workshop BTS',    pct: 20, color: '#f59e0b' },   // amber-500
  { label: 'Kuwait Projects', pct: 15, color: '#10b981' },   // emerald-500
  { label: 'Lead Gen',        pct: 15, color: '#f43f5e' },   // rose-500
];

const DONUT_RADIUS = 54;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

/** Build stroke-dasharray / dashoffset arcs for each pillar. */
function buildArcs() {
  let accumulated = 0;
  return PILLARS.map((p) => {
    const dash = (p.pct / 100) * DONUT_CIRCUMFERENCE;
    const gap  = DONUT_CIRCUMFERENCE - dash;
    const offset = -accumulated * (DONUT_CIRCUMFERENCE / 100);
    accumulated += p.pct;
    return { ...p, dash, gap, offset };
  });
}
const ARCS = buildArcs();

/* ── Tailwind color‐class map (for dots / cards) ──────────────── */
const TW_BG = [
  'bg-sky-500', 'bg-indigo-500', 'bg-amber-500', 'bg-emerald-500', 'bg-rose-500',
];

/* ── Component ────────────────────────────────────────────────── */
export default function Step1MonthSetup({ campaign, onUpdateCampaign, onNextStep }) {
  const [formData, setFormData] = useState({
    themeTitle: campaign.themeTitle || '',
    strategicGoal: campaign.strategicGoal || '',
    targetKpi: campaign.targetKpi || '',
  });

  const handleSave = () => {
    onUpdateCampaign(formData);
  };

  /* ── Derived quick‑stats ──────────────────────────────────── */
  const concepts = campaign.concepts ?? [];

  const stats = useMemo(() => {
    const totalPosts = concepts.length;
    const reels      = concepts.filter((c) => c.format === 'reel').length;
    const carousels  = concepts.filter((c) => c.format === 'carousel').length;
    const scripted   = concepts.filter(
      (c) => (c.scenes?.length > 0) || (c.slides?.length > 0),
    ).length;
    return { totalPosts, reels, carousels, scripted };
  }, [concepts]);

  const STAT_CARDS = [
    { label: 'Total Posts',  value: stats.totalPosts,  icon: '📊', accent: 'from-sky-500/15  to-sky-500/5   text-sky-700   ring-sky-200' },
    { label: 'Reels',        value: stats.reels,       icon: '🎬', accent: 'from-indigo-500/15 to-indigo-500/5 text-indigo-700 ring-indigo-200' },
    { label: 'Carousels',    value: stats.carousels,   icon: '📑', accent: 'from-amber-500/15 to-amber-500/5 text-amber-700 ring-amber-200' },
    { label: 'Scripted',     value: stats.scripted,    icon: '✍️', accent: 'from-emerald-500/15 to-emerald-500/5 text-emerald-700 ring-emerald-200' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-[ds-toast-in_180ms_ease]">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
            Step 1 of 5
          </span>
          <h2 className="text-xl font-black text-slate-900 mt-1">Monthly Campaign Theme & Strategy</h2>
          <p className="text-xs text-slate-500">Define the overarching market narrative and target KPIs for {campaign.monthName}</p>
        </div>

        <Badge tone="active">{campaign.monthName}</Badge>
      </div>

      {/* ── Quick‑Stat Metric Cards ────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STAT_CARDS.map((s) => (
          <div
            key={s.label}
            className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${s.accent} ring-1 p-3.5 flex flex-col gap-1`}
          >
            <span className="text-lg leading-none">{s.icon}</span>
            <span className="text-2xl font-black leading-none">{s.value}</span>
            <span className="text-[11px] font-semibold opacity-80">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Main Setup Card */}
      <Card className="p-6 space-y-5 bg-white">
        {/* Campaign Theme Title */}
        <div>
          <label className="text-xs font-bold text-slate-900 mb-1.5 block">
            🎯 Campaign Theme Headline
          </label>
          <input
            type="text"
            value={formData.themeTitle}
            onChange={(e) => setFormData({ ...formData, themeTitle: e.target.value })}
            onBlur={handleSave}
            placeholder="e.g. Extreme Desert Heat Resilience & 50°C+ Summer Operations"
            className="ds-input text-xs sm:text-sm font-bold text-slate-900"
          />
          <p className="text-[11px] text-slate-500 mt-1">The primary theme unifying all reels, carousels, and case studies this month.</p>
        </div>

        {/* Strategic Narrative / Objective */}
        <div>
          <label className="text-xs font-bold text-slate-900 mb-1.5 block">
            📖 Campaign Narrative & Customer Objective
          </label>
          <textarea
            rows={3}
            value={formData.strategicGoal}
            onChange={(e) => setFormData({ ...formData, strategicGoal: e.target.value })}
            onBlur={handleSave}
            placeholder="What core problem in Kuwait does this month's content address? (e.g. Proving Komatsu radiator cooling and genuine filtration eliminates summer breakdowns on desert jobsites)..."
            className="ds-input text-xs text-slate-800 leading-relaxed"
          />
        </div>

        {/* Target KPIs */}
        <div>
          <label className="text-xs font-bold text-slate-900 mb-1.5 block">
            📊 Target Monthly Performance KPIs
          </label>
          <input
            type="text"
            value={formData.targetKpi}
            onChange={(e) => setFormData({ ...formData, targetKpi: e.target.value })}
            onBlur={handleSave}
            placeholder="e.g. 25 Qualified Contractor Inquiries • 180,000 Video Views in Kuwait • 95% Positive Engagement"
            className="ds-input text-xs font-mono font-semibold"
          />
        </div>

        {/* ── Content Pillar Distribution — donut + legend ──── */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 uppercase text-[11px]">Recommended Content Pillar Balance</span>
            <span className="text-[10px] text-slate-400">100% Balanced Strategy</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* SVG Donut Chart */}
            <div className="shrink-0 relative w-36 h-36">
              <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
                {/* Background ring */}
                <circle cx="70" cy="70" r={DONUT_RADIUS} fill="none" stroke="#f1f5f9" strokeWidth="14" />
                {/* Pillar arcs */}
                {ARCS.map((arc, i) => (
                  <circle
                    key={i}
                    cx="70"
                    cy="70"
                    r={DONUT_RADIUS}
                    fill="none"
                    stroke={arc.color}
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeDasharray={`${arc.dash} ${arc.gap}`}
                    strokeDashoffset={arc.offset}
                    className="transition-all duration-700 ease-out"
                  />
                ))}
              </svg>
              {/* Centre label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-black text-slate-900 leading-none">5</span>
                <span className="text-[10px] font-semibold text-slate-400">Pillars</span>
              </div>
            </div>

            {/* Legend + mini bar */}
            <div className="flex-1 w-full space-y-2">
              {/* Stacked bar (original style preserved) */}
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                <div style={{ width: '20%' }} className="bg-sky-500" title="Brand Authority (20%)" />
                <div style={{ width: '30%' }} className="bg-indigo-500" title="Technical Specs (30%)" />
                <div style={{ width: '20%' }} className="bg-amber-500" title="Workshop BTS (20%)" />
                <div style={{ width: '15%' }} className="bg-emerald-500" title="Kuwait Projects (15%)" />
                <div style={{ width: '15%' }} className="bg-rose-500" title="Lead Gen (15%)" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 pt-1 text-[11px] font-semibold text-slate-600">
                {PILLARS.map((p, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${TW_BG[i]} shrink-0 ring-1 ring-white shadow-sm`} />
                    <span>{p.label}</span>
                    <span className="ml-auto tabular-nums text-slate-400">{p.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-slate-400">Changes auto-saved to campaign</span>
        <Button
          type="button"
          variant="primary"
          onClick={() => {
            handleSave();
            onNextStep();
          }}
          className="!bg-slate-900 hover:!bg-slate-800 !text-white !font-bold text-xs shadow-sm"
        >
          Next: 4-Week Schedule (Step 2) →
        </Button>
      </div>
    </div>
  );
}
