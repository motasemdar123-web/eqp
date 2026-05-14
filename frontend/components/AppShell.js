'use client';

import SystemShell from './SystemShell';

export default function AppShell({ activePage, onNavigate, onLogout, userCode, children }) {
  const tabs = [
    { id: 'dashboard', label: 'Report Builder' },
    { id: 'machine-history', label: 'Machine History' },
  ];

  return (
    <SystemShell
      activePath="/eqp/generate-reports"
      eyebrow="EQP Module"
      title="Equipment Preventive Maintenance"
      description="PDF report generation, machine counters, service history, and archive control."
      onLogout={onLogout}
      userLabel={userCode ? `User ${userCode}` : undefined}
      actions={(
        <div className="flex rounded-md border border-zinc-200 bg-zinc-100 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onNavigate(tab.id)}
              className={`rounded px-3 py-2 text-sm font-semibold transition ${
                activePage === tab.id
                  ? 'bg-white text-zinc-950 shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
    >
      {children}
    </SystemShell>
  );
}
