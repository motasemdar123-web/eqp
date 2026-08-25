'use client';

import React, { useEffect } from 'react';

export function Dialog({ open, onClose, children, className = '' }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-[ds-toast-in_140ms_ease]">
      <div
        className={`relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ title, description, onClose }) {
  return (
    <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
      <div>
        <h3 className="text-base font-black text-white tracking-tight">{title}</h3>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors text-sm font-bold"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export function DialogContent({ children, className = '' }) {
  return <div className={`p-6 overflow-y-auto space-y-4 flex-1 ${className}`}>{children}</div>;
}

export function DialogFooter({ children, className = '' }) {
  return (
    <div className={`p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 ${className}`}>
      {children}
    </div>
  );
}

export default Dialog;
