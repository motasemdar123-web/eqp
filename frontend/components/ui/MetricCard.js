'use client';

import React from 'react';
import Badge from './Badge';

export default function MetricCard({
  label,
  value,
  unit,
  subtext,
  status,
  statusTone = 'neutral',
  icon,
  accent = false,
  className = '',
}) {
  return (
    <article
      className={`p-4 rounded-lg border bg-white shadow-2xs transition-all flex flex-col justify-between ${
        accent ? 'border-amber-300/80 bg-gradient-to-br from-amber-50/20 to-white' : 'border-slate-200/80'
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-slate-500 truncate">{label}</span>
        {status && (
          <Badge tone={statusTone} className="text-[10px] px-2 py-0">
            {status}
          </Badge>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight font-mono tabular-nums leading-none">
          {value}
        </span>
        {unit && (
          <span className="text-xs text-slate-500 font-normal truncate">{unit}</span>
        )}
      </div>

      {subtext && (
        <p className="mt-2 text-[11px] text-slate-500 font-normal leading-tight truncate">
          {subtext}
        </p>
      )}
    </article>
  );
}
