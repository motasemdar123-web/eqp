'use client';

import React from 'react';

export default function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 ${className}`}>
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-slate-200/80 shadow-2xs text-slate-500">
        {icon || (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        )}
      </div>
      <h3 className="text-sm font-semibold text-slate-900 tracking-tight">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-xs text-slate-500 leading-normal">{description}</p>}
      {(action || secondaryAction) && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}

