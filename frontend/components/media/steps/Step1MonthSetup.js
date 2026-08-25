'use client';

import React, { useState, useMemo } from 'react';
import Card from '../../ui/Card';
import Badge from '../../ui/Badge';
import Button from '../../ui/Button';

/* ── Donut chart constants ─────────────────────────────────────── */
const PILLARS = [
  { id: 'pillar_authority', label: 'Brand Authority', pct: 20, color: '#0ea5e9', bg: 'bg-sky-500' },
  { id: 'pillar_engineering', label: 'Tech & Product Specs', pct: 30, color: '#6366f1', bg: 'bg-indigo-500' },
  { id: 'pillar_workshop', label: 'Workshop BTS & Overhauls', pct: 20, color: '#f59e0b', bg: 'bg-amber-500' },
  { id: 'pillar_projects', label: 'Kuwait Jobsites', pct: 15, color: '#10b981', bg: 'bg-emerald-500' },
  { id: 'pillar_leadgen', label: 'After-Sales & Parts', pct: 15, color: '#f43f5e', bg: 'bg-rose-500' },
];

const DONUT_RADIUS = 50;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

function buildArcs() {
  let accumulated = 0;
  return PILLARS.map((p) => {
    const dash = (p.pct / 100) * DONUT_CIRCUMFERENCE;
    const gap = DONUT_CIRCUMFERENCE - dash;
    const offset = -accumulated * (DONUT_CIRCUMFERENCE / 100);
    accumulated += p.pct;
    return { ...p, dash, gap, offset };
  });
}
const ARCS = buildArcs();

export default function Step1MonthSetup({ campaign, onUpdateCampaign, onNextStep }) {
  const [formData, setFormData] = useState({
    themeTitle: campaign.themeTitle || '',
    strategicGoal: campaign.strategicGoal || '',
    targetKpi: campaign.targetKpi || '',
  });

  const handleSave = () => {
    onUpdateCampaign(formData);
  };

  const concepts = campaign.concepts ?? [];

  const stats = useMemo(() => {
    const totalPosts = concepts.length;
    const reels = concepts.filter((c) => c.format === 'reel').length;
    const carousels = concepts.filter((c) => c.format === 'carousel').length;
    const scripted = concepts.filter(
      (c) => (c.scenes?.length > 0) || (c.slides?.length > 0),
    ).length;
    return { totalPosts, reels, carousels, scripted };
  }, [concepts]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-[ds-toast-in_180ms_ease]">
      {/* Step Header */}
      <div className="border-b border-slate-200 pb-3">
        <h2 className="text-base font-bold text-slate-900">Monthly Campaign Theme & Strategy</h2>
        <p className="text-xs text-slate-500 mt-0.5">Define the overarching market narrative, target KPIs, and content pillar balance.</p>
      </div>


      {/* Quick-Stat Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Monthly Total</span>
          <span className="text-xl font-bold font-mono text-slate-900 mt-0.5 block">{stats.totalPosts}</span>
          <span className="text-[11px] font-medium text-slate-600">Total Releases</span>
        </div>

        <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Video Format</span>
          <span className="text-xl font-bold font-mono text-slate-900 mt-0.5 block">{stats.reels}</span>
          <span className="text-[11px] font-medium text-slate-600">Short-Form Reels</span>
        </div>

        <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Slide Format</span>
          <span className="text-xl font-bold font-mono text-slate-900 mt-0.5 block">{stats.carousels}</span>
          <span className="text-[11px] font-medium text-slate-600">Technical Carousels</span>
        </div>

        <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Production Ready</span>
          <span className="text-xl font-bold font-mono text-emerald-700 mt-0.5 block">{stats.scripted}</span>
          <span className="text-[11px] font-medium text-slate-600">Director Scripted</span>
        </div>
      </div>

      {/* Section 1: Campaign Narrative & Goals Card */}
      <Card className="p-5 space-y-4 bg-white border border-slate-200 shadow-2xs">
        <div className="border-b border-slate-100 pb-2.5">
          <h3 className="text-sm font-bold text-slate-900">Campaign Messaging & Goals</h3>
          <p className="text-xs text-slate-500">Core market positioning unifying all reels, carousels, and case studies this month.</p>
        </div>

        {/* Campaign Theme Title */}
        <div>
          <label className="text-xs font-semibold text-slate-900 mb-1.5 block">
            Campaign Theme Headline
          </label>
          <input
            type="text"
            value={formData.themeTitle}
            onChange={(e) => setFormData({ ...formData, themeTitle: e.target.value })}
            onBlur={handleSave}
            placeholder="e.g. Extreme Desert Heat Resilience & 50°C+ Summer Operations"
            className="ds-input text-xs sm:text-sm font-semibold text-slate-900"
          />
        </div>

        {/* Strategic Narrative / Objective */}
        <div>
          <label className="text-xs font-semibold text-slate-900 mb-1.5 block">
            Campaign Narrative & Customer Objective
          </label>
          <textarea
            rows={2}
            value={formData.strategicGoal}
            onChange={(e) => setFormData({ ...formData, strategicGoal: e.target.value })}
            onBlur={handleSave}
            placeholder="What core problem in Kuwait does this month's content address? (e.g. Proving Komatsu radiator cooling and genuine filtration eliminates summer breakdowns on desert jobsites)..."
            className="ds-input text-xs text-slate-800 leading-relaxed"
          />
        </div>

        {/* Target KPIs */}
        <div>
          <label className="text-xs font-semibold text-slate-900 mb-1.5 block">
            Target Monthly Performance KPIs
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
      </Card>

      {/* Section 2: Content Pillar Distribution Card */}
      <Card className="p-5 space-y-4 bg-white border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recommended Content Pillar Balance</h3>
            <p className="text-xs text-slate-500">Target allocation vs actual posts scheduled across strategic pillars.</p>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">100% Balanced Strategy</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 pt-1">
          {/* SVG Donut Chart */}
          <div className="shrink-0 relative w-32 h-32">
            <svg viewBox="0 0 130 130" className="w-full h-full -rotate-90">
              {/* Background ring */}
              <circle cx="65" cy="65" r={DONUT_RADIUS} fill="none" stroke="#f1f5f9" strokeWidth="12" />
              {/* Pillar arcs */}
              {ARCS.map((arc, i) => (
                <circle
                  key={i}
                  cx="65"
                  cy="65"
                  r={DONUT_RADIUS}
                  fill="none"
                  stroke={arc.color}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${arc.dash} ${arc.gap}`}
                  strokeDashoffset={arc.offset}
                  className="transition-all duration-500 ease-out"
                />
              ))}
            </svg>
            {/* Centre label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold font-mono text-slate-900 leading-none">5</span>
              <span className="text-[10px] font-semibold text-slate-400">Pillars</span>
            </div>
          </div>

          {/* Clean Breakdown List */}
          <div className="flex-1 w-full divide-y divide-slate-100">
            {PILLARS.map((p, i) => {
              const countInPillar = concepts.filter((c) => c.pillar === p.id).length;
              return (
                <div key={i} className="py-1.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${p.bg} shrink-0`} />
                    <span className="font-semibold text-slate-800">{p.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 font-mono text-[11px]">
                      {countInPillar} {countInPillar === 1 ? 'post' : 'posts'}
                    </span>
                    <span className="font-mono font-bold text-slate-700 w-9 text-right">{p.pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-slate-400">Auto-saved to campaign workspace</span>
        <Button
          type="button"
          variant="primary"
          onClick={() => {
            handleSave();
            onNextStep();
          }}
          className="!bg-slate-900 hover:!bg-slate-800 !text-white !font-bold text-xs shadow-xs"
        >
          Next: 4-Week Schedule (Step 2) →
        </Button>
      </div>
    </div>
  );
}

