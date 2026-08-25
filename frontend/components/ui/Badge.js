'use client';

import React from 'react';

export default function Badge({ children, tone = 'neutral', variant = 'soft', className = '' }) {
  // Color tones mapped to soft background, border, and sharp text
  const tones = {
    neutral: 'bg-slate-100 text-slate-800 border-slate-200',
    dark: 'bg-slate-900 text-white border-slate-900',
    yellow: 'bg-amber-50 text-amber-800 border-amber-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    komatsu: 'bg-amber-400/20 text-amber-900 border-amber-400/40 font-black',
    green: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    active: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    ready: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    completed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    red: 'bg-red-50 text-red-800 border-red-200',
    danger: 'bg-red-50 text-red-800 border-red-200',
    critical: 'bg-red-50 text-red-800 border-red-200',
    blue: 'bg-blue-50 text-blue-800 border-blue-200',
    info: 'bg-sky-50 text-sky-800 border-sky-200',
    cyan: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    live: 'bg-amber-500/15 text-amber-900 border-amber-500/30',
    preserved: 'bg-slate-100 text-slate-700 border-slate-200',
    pending: 'bg-amber-50 text-amber-800 border-amber-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    archived: 'bg-slate-100 text-slate-500 border-slate-200',
  };

  const selectedTone = tones[tone] || tones.neutral;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold border leading-snug tracking-wide select-none ${selectedTone} ${className}`}
    >
      {children}
    </span>
  );
}
