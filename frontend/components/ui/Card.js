'use client';

import React from 'react';

export default function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200 shadow-xs transition-all ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`p-5 sm:p-6 pb-3 sm:pb-4 space-y-1 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', ...props }) {
  return (
    <h3 className={`text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '', ...props }) {
  return (
    <p className={`text-xs text-slate-500 leading-relaxed ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={`p-5 sm:p-6 pt-0 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={`p-4 sm:p-5 pt-3 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex items-center justify-between ${className}`} {...props}>
      {children}
    </div>
  );
}
