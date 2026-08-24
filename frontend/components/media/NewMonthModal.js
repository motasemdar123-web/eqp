'use client';

import React, { useState } from 'react';
import Button from '../ui/Button';

export default function NewMonthModal({ availableMonths, onSave, onClose }) {
  const [formData, setFormData] = useState({
    monthId: '2026-11',
    monthName: 'November 2026',
    themeTitle: 'Winter Construction Surge & Heavy Infrastructure Delivery',
    strategicGoal: 'Position Komatsu hydraulic excavators and articulated dump trucks for large-scale earthmoving contracts across Kuwait during peak winter operations.',
    targetKpi: '35 Qualified Contractor Inquiries • 250,000 Social Impressions • 15 Field Demos',
    cloneFromMonthId: 'none',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.monthName.trim() || !formData.themeTitle.trim()) return;
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <form
        onSubmit={handleSubmit}
        className="relative bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📅</span>
            <div>
              <h3 className="text-base font-bold">Plan New Monthly Campaign</h3>
              <p className="text-xs text-slate-400">Create a strategic content theme & publishing cycle</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">Month Identifier (YYYY-MM)</label>
              <input
                type="text"
                required
                value={formData.monthId}
                onChange={(e) => setFormData({ ...formData, monthId: e.target.value })}
                placeholder="e.g. 2026-11"
                className="ds-input text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">Display Name</label>
              <input
                type="text"
                required
                value={formData.monthName}
                onChange={(e) => setFormData({ ...formData, monthName: e.target.value })}
                placeholder="e.g. November 2026"
                className="ds-input text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 block">Strategic Campaign Theme Title</label>
            <input
              type="text"
              required
              value={formData.themeTitle}
              onChange={(e) => setFormData({ ...formData, themeTitle: e.target.value })}
              placeholder="e.g. Winter Earthmoving & Heavy Infrastructure Peak"
              className="ds-input text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 block">Strategic Objective / Campaign Narrative</label>
            <textarea
              rows={3}
              value={formData.strategicGoal}
              onChange={(e) => setFormData({ ...formData, strategicGoal: e.target.value })}
              placeholder="Describe the main business goal, customer pain points addressed, and narrative arc for this month..."
              className="ds-input text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 block">Target Monthly KPIs</label>
            <input
              type="text"
              value={formData.targetKpi}
              onChange={(e) => setFormData({ ...formData, targetKpi: e.target.value })}
              placeholder="e.g. 30 Inquiries • 200k Impressions • 10 Sales Meetings"
              className="ds-input text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 block">Template / Clone Existing Month</label>
            <select
              value={formData.cloneFromMonthId}
              onChange={(e) => setFormData({ ...formData, cloneFromMonthId: e.target.value })}
              className="ds-input text-xs"
            >
              <option value="none">Start with Fresh Blank Plan</option>
              {availableMonths.map((m) => (
                <option key={m.monthId} value={m.monthId}>
                  Clone Structure from {m.monthName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="!bg-amber-500 hover:!bg-amber-400 !text-slate-950 !font-bold">
            Create Monthly Campaign
          </Button>
        </div>
      </form>
    </div>
  );
}
