'use client';

import React, { useEffect, useCallback } from 'react';

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function DetailDrawer({
  open,
  onClose,
  title,
  subtitle,
  badge,
  actions,
  children,
  footer,
  size = 'md',
  className = '',
}) {
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-slate-950/40 backdrop-blur-xs flex justify-end animate-[ds-toast-in_150ms_ease]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`relative w-full h-full bg-white shadow-2xl border-l border-slate-200 flex flex-col ${sizeClasses[size] || sizeClasses.md} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="px-5 py-4 bg-slate-50/90 backdrop-blur-xs border-b border-slate-200 flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold text-slate-900 tracking-tight truncate">{title}</h2>
              {badge}
            </div>
            {subtitle && <p className="text-xs text-slate-500 truncate">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {actions}
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 p-1.5 rounded-md transition-colors text-xs font-medium cursor-pointer"
              aria-label="Close drawer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-white">
          {children}
        </div>

        {/* Sticky Footer (if provided) */}
        {footer && (
          <div className="px-5 py-3.5 bg-slate-50/90 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default DetailDrawer;
