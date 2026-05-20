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
      )}
    >
      {children}
    </SystemShell>
  );
}
