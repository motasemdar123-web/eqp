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
        <div className="flex items-center gap-2">
          <div className="ds-tab-list">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onNavigate(tab.id)}
                className={`ds-tab ${activePage === tab.id ? 'ds-tab-active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <a
            href="/eqp/comments"
            className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 flex items-center gap-1"
          >
            <span>💬</span> Comments Pool
          </a>
        </div>
      )}
    >
      {children}
    </SystemShell>
  );
}
