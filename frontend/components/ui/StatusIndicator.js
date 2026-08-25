'use client';

import React from 'react';

const toneMap = {
  critical: 'bg-red-500 text-red-700',
  warning: 'bg-amber-500 text-amber-800',
  pending: 'bg-amber-400 text-amber-700',
  active: 'bg-blue-500 text-blue-700',
  ready: 'bg-emerald-500 text-emerald-700',
  completed: 'bg-emerald-500 text-emerald-700',
  neutral: 'bg-slate-400 text-slate-600',
};

export function StatusIndicator({
  tone = 'neutral',
  label,
  sublabel,
  pulse = false,
  className = '',
}) {
  const dotColor = (toneMap[tone] || toneMap.neutral).split(' ')[0];

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="relative flex h-2 w-2 shrink-0">
        {pulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor}`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`} />
      </span>
      {label && <span className="text-xs font-semibold text-slate-800 leading-none">{label}</span>}
      {sublabel && <span className="text-[11px] text-slate-500 leading-none">({sublabel})</span>}
    </div>
  );
}

export default StatusIndicator;
