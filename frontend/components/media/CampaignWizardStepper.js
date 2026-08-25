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
      <div className="rounded-t-xl bg-slate-900 border border-slate-800 px-4 py-3 sm:px-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100">Media & Campaign Studio</h2>
              <p className="text-[11px] text-slate-400">Monthly editorial strategy, shot scripting, and call sheets</p>
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
                  className={`px-3 py-1 rounded-md text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                      : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white font-medium'
                  }`}
                >
                  {m.monthName}
                </button>
              );
            })}

            <button
              type="button"
              onClick={onOpenNewMonthModal}
              className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white transition-all cursor-pointer"
            >
              + New Month
            </button>

            {onResetCampaign && (
              <button
                type="button"
                onClick={onResetCampaign}
                title="Reload full master campaign template"
                className="px-2 py-1 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5-Step Unified Stepper Bar */}
      <div className="rounded-b-xl bg-slate-900 border-x border-b border-slate-800 p-1.5 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5">
          {steps.map((step) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onStepChange(step.id)}
                className={`p-2 rounded-lg text-left transition-all flex items-center gap-2.5 border cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-white border-amber-400/60 shadow-xs ring-1 ring-amber-400/20'
                    : isCompleted
                    ? 'bg-slate-900/80 border-slate-800/80 text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    : 'bg-slate-900/30 border-transparent text-slate-500 hover:bg-slate-800/30 hover:text-slate-400'
                }`}
              >
                {/* Step number badge */}
                <div className="relative shrink-0">
                  <div
                    className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs transition-all ${
                      isActive
                        ? 'bg-amber-400 text-slate-950 font-black'
                        : isCompleted
                        ? 'bg-slate-800 text-amber-400 border border-slate-700'
                        : 'bg-slate-800/80 text-slate-500 border border-slate-800'
                    }`}
                  >
                    {isCompleted ? '✓' : step.id}
                  </div>
                </div>

                <div className="min-w-0">
                  <p className={`text-xs font-semibold truncate ${isActive ? 'text-white' : isCompleted ? 'text-slate-200' : 'text-slate-400'}`}>
                    {step.label}
                  </p>
                  <p className={`text-[10px] truncate ${isActive ? 'text-amber-400 font-medium' : 'text-slate-500'}`}>
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

