'use client';

import React from 'react';

export function Input({ className = '', type = 'text', ...props }) {
  return (
    <input
      type={type}
      className={`flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-900 shadow-2xs transition-all placeholder:text-slate-400 placeholder:font-normal focus-visible:outline-none focus-visible:border-amber-500 focus-visible:ring-2 focus-visible:ring-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}

export function Textarea({ className = '', rows = 3, ...props }) {
  return (
    <textarea
      rows={rows}
      className={`flex min-h-[80px] w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-normal text-slate-900 shadow-2xs transition-all placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-amber-500 focus-visible:ring-2 focus-visible:ring-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50 leading-relaxed ${className}`}
      {...props}
    />
  );
}

export function Select({ className = '', children, ...props }) {
  return (
    <div className="relative w-full">
      <select
        className={`flex h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2 pr-8 text-xs sm:text-sm font-semibold text-slate-900 shadow-2xs transition-all focus-visible:outline-none focus-visible:border-amber-500 focus-visible:ring-2 focus-visible:ring-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        {...props}
      >
        {children}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
        ▼
      </span>
    </div>
  );
}

export function Label({ children, className = '', required = false, ...props }) {
  return (
    <label
      className={`text-xs font-bold text-slate-800 tracking-wide block mb-1.5 ${className}`}
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

export default Input;
