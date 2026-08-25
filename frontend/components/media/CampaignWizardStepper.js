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
    { id: 1, label: '1. Month Setup', icon: '🎯', desc: 'Theme & Goals' },
    { id: 2, label: '2. 4-Week Schedule', icon: '🗓️', desc: '12–15 Releases' },
    { id: 3, label: '3. Script Studio', icon: '🎬', desc: 'Hooks, Scenes & B-Roll' },
    { id: 4, label: '4. Platform Copy', icon: '📝', desc: 'LinkedIn, IG & FB' },
    { id: 5, label: '5. Videographer Call Sheet', icon: '📄', desc: 'Print & Hand-Off' },
  ];

  const progressPercent = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="space-y-0">
      {/* Gradient Top Banner — Dar Al Hay brand identity */}
      <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-4 py-4 sm:px-6">
        {/* Gold accent line at the very top */}
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400" />
        {/* Subtle radial glow */}
        <div className="pointer-events-none absolute -top-12 right-8 h-40 w-40 rounded-full bg-amber-400/10 blur-3xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black text-sm shrink-0 shadow-lg shadow-amber-500/20 ring-2 ring-amber-300/30">
              DH
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-tight tracking-wide">Social Media Campaign Wizard</h2>
              <p className="text-[11px] text-slate-400">Prepare monthly strategy & hand off call sheets to your videographer</p>
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
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 ring-1 ring-amber-300/50'
                      : 'bg-slate-800/80 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  📅 {m.monthName}
                </button>
              );
            })}

            <button
              type="button"
              onClick={onOpenNewMonthModal}
              className="px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-all shadow-sm"
            >
              + New Month
            </button>

            {onResetCampaign && (
              <button
                type="button"
                onClick={onResetCampaign}
                title="Reload full 12-post master campaign template"
                className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
              >
                ↺ Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5-Step Visual Stepper Bar with connected progress line */}
      <div className="bg-white rounded-b-2xl border border-t-0 border-slate-200 shadow-xs">
        {/* Connected progress track */}
        <div className="px-4 sm:px-8 pt-4 pb-1 hidden lg:block">
          <div className="relative mx-auto" style={{ maxWidth: '85%' }}>
            {/* Background track */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2 bg-slate-200 rounded-full" />
            {/* Filled track */}
            <div
              className="absolute top-1/2 left-0 h-0.5 -translate-y-1/2 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
            {/* Step node dots on the line */}
            <div className="relative flex items-center justify-between">
              {steps.map((step) => {
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                return (
                  <div key={step.id} className="flex flex-col items-center">
                    <div
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        isActive
                          ? 'bg-amber-500 ring-4 ring-amber-100 scale-125'
                          : isCompleted
                          ? 'bg-amber-500 ring-2 ring-amber-200'
                          : 'bg-slate-300 ring-2 ring-slate-100'
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

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
                  className={`group relative p-2.5 rounded-xl text-left transition-all duration-200 flex items-center gap-2.5 border ${
                    isActive
                      ? 'bg-gradient-to-br from-slate-900 to-slate-800 text-white border-slate-700 shadow-lg shadow-slate-900/20 scale-[1.02]'
                      : isCompleted
                      ? 'bg-amber-50/60 border-amber-200 text-slate-800 hover:bg-amber-50 hover:shadow-sm'
                      : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  {/* Step number badge with ring */}
                  <div className="relative shrink-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-all ${
                        isActive
                          ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 shadow-md shadow-amber-400/30 ring-2 ring-amber-300/40'
                          : isCompleted
                          ? 'bg-amber-500 text-white ring-2 ring-amber-300/50 shadow-sm'
                          : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200 group-hover:ring-slate-300'
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
                    {/* Active pulse indicator */}
                    {isActive && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-slate-900 animate-pulse" />
                    )}
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
