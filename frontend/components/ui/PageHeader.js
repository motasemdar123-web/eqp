'use client';

import React from 'react';

export default function PageHeader({
  title,
  badge,
  description,
  actions,
  className = '',
}) {
  return (
    <header className={`pb-3.5 border-b border-slate-200/80 mb-4 sm:mb-5 ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 leading-tight">
              {title}
            </h1>
            {badge && <div>{badge}</div>}
          </div>
          {description && (
            <p className="text-xs text-slate-500 max-w-3xl leading-normal">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}

