'use client';

import React, { useState, useRef, useEffect } from 'react';

export function OverflowMenu({
  items = [],
  triggerText = '⋯',
  align = 'right',
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={menuRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="px-2 py-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md font-mono text-sm leading-none transition-colors cursor-pointer"
        aria-haspopup="true"
        aria-expanded={open}
        title="More actions"
      >
        {triggerText}
      </button>

      {open && (
        <div
          className={`absolute z-30 mt-1 w-48 rounded-lg bg-white shadow-lg border border-slate-200 py-1 focus:outline-none animate-[ds-toast-in_100ms_ease] ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((item, index) => {
            if (item.divider) {
              return <div key={index} className="my-1 border-t border-slate-100" />;
            }

            return (
              <button
                key={item.label || index}
                type="button"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false);
                  if (item.onClick) item.onClick();
                }}
                className={`w-full text-left px-3.5 py-1.5 text-xs flex items-center gap-2 transition-colors cursor-pointer ${
                  item.variant === 'danger'
                    ? 'text-red-600 hover:bg-red-50 hover:text-red-700'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                } ${item.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                {item.icon && <span className="text-slate-400 shrink-0">{item.icon}</span>}
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default OverflowMenu;
