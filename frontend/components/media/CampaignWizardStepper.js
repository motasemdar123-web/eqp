'use client';

import React from 'react';
import Button from '../ui/Button';

export default function CampaignWizardStepper({
  currentStep,
  onStepChange,
  availableMonths,
  selectedMonthId,
  onSelectMonth,
  onOpenNewMonthModal,
}) {
  const steps = [
    { id: 1, label: '1. Month Setup', icon: '🎯', desc: 'Theme & Goals' },
    { id: 2, label: '2. 4-Week Schedule', icon: '🗓️', desc: '12–15 Releases' },
    { id: 3, label: '3. Script Studio', icon: '🎬', desc: 'Hooks, Scenes & B-Roll' },
    { id: 4, label: '4. Platform Copy', icon: '📝', desc: 'LinkedIn, IG & FB' },
    { id: 5, label: '5. Videographer Call Sheet', icon: '📄', desc: 'Print & Hand-Off' },
  ];

  return (
    <div className="space-y-4">
      {/* Top Header: Month Switcher & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm shrink-0">
            DH
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 leading-tight">Social Media Campaign Wizard</h2>
            <p className="text-[11px] text-slate-500">Prepare monthly strategy & hand off call sheets to your videographer</p>
          </div>
        </div>

        {/* Month Selector Pills */}
        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
          {availableMonths.map((m) => {
            const isSelected = selectedMonthId === m.monthId;
            return (
              <button
                key={m.monthId}
                type="button"
                onClick={() => onSelectMonth(m.monthId)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
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
            className="px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100 transition-all"
          >
            + New Month
          </button>
        </div>
      </div>

      {/* 5-Step Visual Stepper Bar */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5">
          {steps.map((step) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onStepChange(step.id)}
                className={`p-2.5 rounded-xl text-left transition-all flex items-center gap-2.5 border ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm scale-101'
                    : isCompleted
                    ? 'bg-amber-50/60 border-amber-200 text-slate-800 hover:bg-amber-50'
                    : 'bg-white border-transparent text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                    isActive
                      ? 'bg-amber-400 text-slate-950'
                      : isCompleted
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {isCompleted ? '✓' : step.id}
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-900'}`}>
                    {step.label}
                  </p>
                  <p className={`text-[10px] truncate ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                    {step.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
