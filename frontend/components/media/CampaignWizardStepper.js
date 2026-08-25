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
  onResetCampaign,
}) {
  const steps = [
    { id: 1, label: '1. Month Setup', desc: 'Strategy & Goal' },
    { id: 2, label: '2. 4-Week Schedule', desc: '12–15 Releases' },
    { id: 3, label: '3. Script Studio', desc: 'Hooks, Scenes & B-Roll' },
    { id: 4, label: '4. Platform Copy', desc: 'LinkedIn, IG & FB' },
    { id: 5, label: '5. Call Sheet', desc: 'Print & Hand-Off' },
  ];

  const progressPercent = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="space-y-0">
      {/* Top Header Bar */}
      <div className="rounded-t-xl bg-slate-900 border border-slate-800 px-4 py-3.5 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
              MC
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Social Media Campaign Wizard</h2>
              <p className="text-[11px] text-slate-400">Monthly editorial strategy and videographer production call sheets</p>
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
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                      : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {m.monthName}
                </button>
              );
            })}

            <button
              type="button"
              onClick={onOpenNewMonthModal}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-700 hover:bg-slate-600 text-white transition-all cursor-pointer"
            >
              + New Month
            </button>

            {onResetCampaign && (
              <button
                type="button"
                onClick={onResetCampaign}
                title="Reload full 12-post master campaign template"
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5-Step Visual Stepper Bar */}
      <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 shadow-xs">
        {/* Step buttons */}
        <div className="p-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5">
            {steps.map((step) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => onStepChange(step.id)}
                  className={`group relative p-2.5 rounded-lg text-left transition-all flex items-center gap-2.5 border cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : isCompleted
                      ? 'bg-amber-50/60 border-amber-200 text-slate-800 hover:bg-amber-50'
                      : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  {/* Step number badge */}
                  <div className="relative shrink-0">
                    <div
                      className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs transition-all ${
                        isActive
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : isCompleted
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {isCompleted ? (
                        <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
                          <path d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        step.id
                      )}
                    </div>
                  </div>

                  <div className="min-w-0">
                    <p className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-900'}`}>
                      {step.label}
                    </p>
                    <p className={`text-[10px] truncate ${isActive ? 'text-slate-400' : 'text-slate-500'}`}>
                      {step.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

