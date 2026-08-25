'use client';

import React, { useState } from 'react';

export function Disclosure({
  title,
  subtitle,
  defaultOpen = false,
  badge,
  icon,
  children,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`border border-slate-200/80 rounded-lg overflow-hidden bg-white ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full px-4 py-2.5 bg-slate-50/70 hover:bg-slate-100/70 flex items-center justify-between text-left transition-colors select-none cursor-pointer"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {icon && <span className="text-slate-400 shrink-0">{icon}</span>}
          <div className="min-w-0">
            <span className="text-xs font-semibold text-slate-900 block truncate">{title}</span>
            {subtitle && <span className="text-[11px] text-slate-500 block truncate mt-0.5">{subtitle}</span>}
          </div>
          {badge}
        </div>

        <span className={`text-slate-400 transform transition-transform duration-150 text-xs shrink-0 ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="p-4 border-t border-slate-200/60 space-y-3 animate-[ds-toast-in_100ms_ease] bg-white">
          {children}
        </div>
      )}
    </div>
  );
}

export default Disclosure;
