'use client';

import React from 'react';

export function Input({ className = '', type = 'text', hasError = false, ...props }) {
  const errorStyles = hasError ? 'border-red-500 focus-visible:border-red-600 focus-visible:ring-red-500/15' : 'border-slate-300 focus-visible:border-slate-900 focus-visible:ring-slate-900/10';

  return (
    <input
      type={type}
      className={`flex h-9 w-full rounded-md border bg-white px-3 py-1.5 text-xs sm:text-sm font-normal text-slate-900 shadow-2xs transition-all placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 ${errorStyles} ${className}`}
      {...props}
    />
  );
}

export function Textarea({ className = '', rows = 3, hasError = false, ...props }) {
  const errorStyles = hasError ? 'border-red-500 focus-visible:border-red-600 focus-visible:ring-red-500/15' : 'border-slate-300 focus-visible:border-slate-900 focus-visible:ring-slate-900/10';

  return (
    <textarea
      rows={rows}
      className={`flex min-h-[76px] w-full rounded-md border bg-white px-3 py-2 text-xs sm:text-sm font-normal text-slate-900 shadow-2xs transition-all placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 leading-relaxed ${errorStyles} ${className}`}
      {...props}
    />
  );
}

export function Select({ className = '', children, hasError = false, ...props }) {
  const errorStyles = hasError ? 'border-red-500 focus-visible:border-red-600 focus-visible:ring-red-500/15' : 'border-slate-300 focus-visible:border-slate-900 focus-visible:ring-slate-900/10';

  return (
    <div className="relative w-full">
      <select
        className={`flex h-9 w-full appearance-none rounded-md border bg-white px-3 py-1.5 pr-8 text-xs sm:text-sm font-normal text-slate-900 shadow-2xs transition-all focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 ${errorStyles} ${className}`}
        {...props}
      >
        {children}
      </select>
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </span>
    </div>
  );
}

export function Label({ children, className = '', required = false, htmlFor, ...props }) {
  return (
    <label
      htmlFor={htmlFor}
      className={`text-xs font-medium text-slate-700 tracking-normal block mb-1.5 select-none ${className}`}
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-1 font-semibold">*</span>}
    </label>
  );
}

export default Input;

