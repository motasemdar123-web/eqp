'use client';

import React from 'react';

export default function Field({
  label,
  children,
  error,
  hint,
  required = false,
  htmlFor,
  className = '',
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-xs font-medium text-slate-700 tracking-normal select-none"
        >
          {label}
          {required && <span className="text-red-500 ml-1 font-semibold">*</span>}
        </label>
      )}
      <div>{children}</div>
      {hint && !error && (
        <p className="text-[11px] text-slate-500 leading-normal">{hint}</p>
      )}
      {error && (
        <p className="text-[11px] font-medium text-red-600 flex items-center gap-1 leading-normal">
          <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

