'use client';

import React, { useState } from 'react';
import Card from '../../ui/Card';
import Badge from '../../ui/Badge';
import Button from '../../ui/Button';

export default function Step1MonthSetup({ campaign, onUpdateCampaign, onNextStep }) {
  const [formData, setFormData] = useState({
    themeTitle: campaign.themeTitle || '',
    strategicGoal: campaign.strategicGoal || '',
    targetKpi: campaign.targetKpi || '',
  });

  const handleSave = () => {
    onUpdateCampaign(formData);
  };

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

        {/* Content Pillar Meter */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 uppercase text-[11px]">Recommended Content Pillar Balance</span>
            <span className="text-[10px] text-slate-400">100% Balanced Strategy</span>
          </div>

          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            <div style={{ width: '20%' }} className="bg-sky-500" title="Brand Authority (20%)" />
            <div style={{ width: '30%' }} className="bg-indigo-500" title="Technical Specs (30%)" />
            <div style={{ width: '20%' }} className="bg-amber-500" title="Workshop BTS (20%)" />
            <div style={{ width: '15%' }} className="bg-emerald-500" title="Kuwait Projects (15%)" />
            <div style={{ width: '15%' }} className="bg-rose-500" title="Lead Gen (15%)" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-[11px] font-semibold text-slate-600">
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" /> Brand Authority (20%)</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" /> Tech & Specs (30%)</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" /> Workshop Overhaul (20%)</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" /> Kuwait Jobsites (15%)</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" /> Lead Gen & Parts (15%)</div>
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
