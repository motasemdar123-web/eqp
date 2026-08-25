'use client';

import React, { useEffect, useCallback } from 'react';

export function Dialog({ open, onClose, children, className = '' }) {
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
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-[ds-toast-in_120ms_ease]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`relative w-full max-w-2xl bg-white rounded-xl shadow-xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[90vh] ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ title, description, onClose, children }) {
  return (
    <div className="bg-white p-4 sm:p-5 flex items-start justify-between border-b border-slate-200">
      <div className="space-y-0.5">
        {title && <h3 className="text-sm sm:text-base font-semibold text-slate-900 tracking-tight">{title}</h3>}
        {description && <p className="text-xs text-slate-500">{description}</p>}
        {children}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-md transition-colors text-xs font-medium cursor-pointer"
          aria-label="Close dialog"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

export function DialogTitle({ children, className = '' }) {
  return <h3 className={`text-base font-semibold text-slate-900 tracking-tight ${className}`}>{children}</h3>;
}

export function DialogDescription({ children, className = '' }) {
  return <p className={`text-xs text-slate-500 mt-0.5 leading-normal ${className}`}>{children}</p>;
}

export function DialogContent({ children, className = '' }) {
  return <div className={`p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 ${className}`}>{children}</div>;
}

export function DialogFooter({ children, className = '' }) {
  return (
    <div className={`p-3.5 sm:p-4 bg-slate-50/70 border-t border-slate-200/80 flex items-center justify-end gap-2 rounded-b-xl ${className}`}>
      {children}
    </div>
  );
}

export default Dialog;


