'use client';

import React from 'react';

export default function Badge({
  children,
  tone = 'neutral',
  size = 'md', // 'sm' (18px) | 'md' (22px)
  variant = 'soft',
  dot = false,
  className = '',
}) {
  const tones = {
    neutral: 'bg-slate-100 text-slate-700 border-slate-200/80',
    dark: 'bg-slate-900 text-white border-slate-900 font-semibold',
    yellow: 'bg-amber-50 text-amber-900 border-amber-200/80',
    amber: 'bg-amber-50 text-amber-900 border-amber-200/80',
    komatsu: 'bg-amber-100 text-amber-950 border-amber-300 font-semibold',
    green: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    active: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    ready: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    completed: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    red: 'bg-red-50 text-red-800 border-red-200/80',
    danger: 'bg-red-50 text-red-800 border-red-200/80',
    critical: 'bg-red-50 text-red-800 border-red-200/80',
    blue: 'bg-sky-50 text-sky-800 border-sky-200/80',
    info: 'bg-sky-50 text-sky-800 border-sky-200/80',
    cyan: 'bg-cyan-50 text-cyan-800 border-cyan-200/80',
    live: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    preserved: 'bg-slate-100 text-slate-700 border-slate-200',
    pending: 'bg-amber-50 text-amber-900 border-amber-200/80',
    warning: 'bg-amber-50 text-amber-900 border-amber-200/80',
    archived: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  const dotColors = {
    neutral: 'bg-slate-400',
    dark: 'bg-slate-300',
    success: 'bg-emerald-500',
    active: 'bg-emerald-500',
    live: 'bg-emerald-500',
    ready: 'bg-emerald-500',
    completed: 'bg-emerald-500',
    warning: 'bg-amber-500',
    pending: 'bg-amber-500',
    critical: 'bg-red-500',
    danger: 'bg-red-500',
    info: 'bg-sky-500',
  };

  const sizeStyles = {
    sm: 'h-[18px] px-1.5 py-0 text-[10px] gap-1',
    md: 'h-[22px] px-2 py-0.5 text-[11px] gap-1.5',
  };

  const selectedTone = tones[tone] || tones.neutral;
  const selectedDotColor = dotColors[tone] || 'bg-slate-400';
  const selectedSize = sizeStyles[size] || sizeStyles.md;

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border leading-none select-none ${selectedSize} ${selectedTone} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${selectedDotColor} shrink-0`} aria-hidden="true" />}
      <span>{children}</span>
    </span>
  );
}


