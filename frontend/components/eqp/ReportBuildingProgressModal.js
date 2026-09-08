'use client';

import { useEffect, useState } from 'react';

const GENERATION_PHASES = [
  { label: 'Asset Pre-flight & Schedule Audit', desc: 'Verifying machinery IDs, SMR baselines, and active engineers...' },
  { label: 'Contradiction Protection & Exclusion', desc: 'Checking monthly records to exclude duplicate or contradictory reports...' },
  { label: 'Certified Komatsu Document Building', desc: 'Filling official service forms, test values, and sequential report counters...' },
  { label: 'Cryptographic Signatures & PDF Export', desc: 'Applying authorized engineer digital signature and compiling PDF files...' },
  { label: 'Cataloging & Fleet Lifecycle Sync', desc: 'Updating machine timelines, saving archive records, and compiling summary...' },
];

export default function ReportBuildingProgressModal({
  isOpen,
  totalMachines = 1,
  totalDates = 1,
}) {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(10);

  const totalReportsEstimate = Math.max(1, totalMachines * totalDates);

  useEffect(() => {
    if (!isOpen) {
      setPhaseIndex(0);
      setProgressPercent(10);
      return;
    }

    // Smoothly step through phases to give user real-time visible feedback
    const interval = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev >= 92) return prev; // Hold at 92% until request actually completes
        const next = prev + Math.floor(Math.random() * 8) + 4;
        return Math.min(92, next);
      });
    }, 450);

    const phaseTimer1 = setTimeout(() => setPhaseIndex(1), 600);
    const phaseTimer2 = setTimeout(() => setPhaseIndex(2), 1600);
    const phaseTimer3 = setTimeout(() => setPhaseIndex(3), 3200);
    const phaseTimer4 = setTimeout(() => setPhaseIndex(4), 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(phaseTimer1);
      clearTimeout(phaseTimer2);
      clearTimeout(phaseTimer3);
      clearTimeout(phaseTimer4);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentPhase = GENERATION_PHASES[phaseIndex] || GENERATION_PHASES[GENERATION_PHASES.length - 1];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      aria-modal="true"
      role="dialog"
      aria-labelledby="progress-modal-title"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200/80 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
              </span>
              <span className="text-[11px] font-mono font-bold tracking-wider text-amber-600 uppercase">
                Building Report Batch
              </span>
            </div>
            <h3 id="progress-modal-title" className="text-lg font-bold text-slate-900">
              Generating Certified Service Documents
            </h3>
          </div>
          <span className="font-mono text-sm font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
            {progressPercent}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 p-0.5 border border-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-500 transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-500">
            <span>Target: {totalMachines} machine(s) × {totalDates} date(s) ({totalReportsEstimate} total)</span>
            <span>Protecting from contradictions</span>
          </div>
        </div>

        {/* Current Phase Card */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
            <svg
              className="h-4 w-4 animate-spin text-amber-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            <span>{currentPhase.label}</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed pl-6">
            {currentPhase.desc}
          </p>
        </div>

        {/* Multi-step list */}
        <div className="space-y-2 pt-1">
          {GENERATION_PHASES.map((phase, idx) => {
            const isCompleted = idx < phaseIndex;
            const isCurrent = idx === phaseIndex;
            return (
              <div key={phase.label} className="flex items-center gap-2.5 text-xs">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    isCompleted
                      ? 'bg-emerald-100 text-emerald-700'
                      : isCurrent
                      ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-400'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isCompleted ? '✓' : idx + 1}
                </span>
                <span className={isCurrent ? 'font-semibold text-slate-900' : isCompleted ? 'text-slate-700 line-through opacity-70' : 'text-slate-400'}>
                  {phase.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Lock note */}
        <div className="rounded-lg bg-amber-50/60 p-2.5 border border-amber-100 text-center">
          <p className="text-[11px] text-amber-800 font-medium">
            🔒 Input locked to prevent duplicate submissions. Please wait while the batch is being created.
          </p>
        </div>
      </div>
    </div>
  );
}
