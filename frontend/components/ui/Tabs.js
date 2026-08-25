'use client';

import React, { createContext, useContext, useState } from 'react';

const TabsContext = createContext(null);

export function Tabs({ value, onValueChange, defaultValue, children, className = '' }) {
  const [activeTab, setActiveTab] = useState(defaultValue || value);

  const currentTab = value !== undefined ? value : activeTab;
  const setTab = onValueChange || setActiveTab;

  return (
    <TabsContext.Provider value={{ value: currentTab, onValueChange: setTab }}>
      <div className={`space-y-4 ${className}`}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className = '' }) {
  return (
    <div className={`inline-flex items-center gap-1 p-1 bg-slate-100/90 rounded-lg border border-slate-200/70 ${className}`}>
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children, className = '', disabled = false }) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');

  const isActive = context.value === value;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => context.onValueChange(value)}
      className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/15 disabled:opacity-50 disabled:pointer-events-none ${
        isActive
          ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/60 font-semibold'
          : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 border border-transparent'
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className = '' }) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');

  if (context.value !== value) return null;

  return <div className={`animate-[ds-toast-in_100ms_ease] ${className}`}>{children}</div>;
}

export default Tabs;

