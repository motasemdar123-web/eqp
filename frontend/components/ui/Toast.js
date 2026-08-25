'use client';

import React, { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose, duration = 4000 }) {
  useEffect(() => {
    if (!message || !onClose || duration <= 0) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, onClose, duration]);

  if (!message) return null;

  let displayMessage = message;
  let displayType = type;

  if (typeof message === 'object' && message !== null) {
    displayMessage = message.message || message.text || JSON.stringify(message);
    displayType = message.type || type;
  }

  const styles = {
    success: 'bg-white border-emerald-200 text-slate-800 shadow-md shadow-emerald-500/5',
    error: 'bg-white border-red-200 text-slate-800 shadow-md shadow-red-500/5',
    warning: 'bg-white border-amber-200 text-slate-800 shadow-md shadow-amber-500/5',
    info: 'bg-white border-slate-200 text-slate-800 shadow-md shadow-slate-500/5',
  };

  const icons = {
    success: (
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 shrink-0">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    ),
    error: (
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-50 text-red-600 shrink-0">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    ),
    warning: (
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-50 text-amber-600 shrink-0">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
    ),
    info: (
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-50 text-sky-600 shrink-0">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    ),
  };

  return (
    <div
      className={`fixed right-4 top-4 z-[9999] flex max-w-sm items-center gap-3 px-3.5 py-2.5 rounded-lg border text-xs sm:text-sm animate-[ds-toast-in_140ms_ease] ${styles[displayType] || styles.info}`}
      role="status"
    >
      {icons[displayType] || icons.info}
      <p className="font-medium text-slate-800 flex-1 leading-snug">{String(displayMessage)}</p>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Dismiss notification"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

