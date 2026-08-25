'use client';

import React from 'react';

export default function SectionHeader({
  title,
  badge,
  description,
  actions,
  className = '',
}) {
  return (
    <div className={`flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-3 mb-3 border-b border-slate-100 ${className}`}>
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <h2 className="text-sm sm:text-base font-semibold text-slate-900 tracking-tight">
            {title}
          </h2>
          {badge && <div>{badge}</div>}
        </div>
        {description && (
          <p className="text-xs text-slate-500 leading-normal">{description}</p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
