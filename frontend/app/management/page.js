'use client';

import Link from 'next/link';
import SystemShell from '../../components/SystemShell';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

const kpis = [
  {
    label: 'Modules',
    metric: '4',
    unit: 'Core Modules',
    secondary: 'Workspace Live',
    status: 'Ready',
    tone: 'ready',
    code: 'AM',
  },
  {
    label: 'Technicians',
    metric: '24',
    unit: 'Active',
    secondary: '6 Available Today',
    status: 'Live',
    tone: 'live',
    code: 'TM',
    accent: true,
  },
  {
    label: 'Scheduling',
    metric: '18',
    unit: 'Shifts',
    secondary: '4 Pending / 92% Coverage',
    status: 'Active',
    tone: 'active',
    code: 'SC',
  },
  {
    label: 'EQP Reports',
    metric: '136',
    unit: 'Reports',
    secondary: '12 This Week',
    status: 'Preserved / Live',
    tone: 'preserved',
    code: 'EQ',
    accent: true,
  },
  {
    label: 'Machines',
    metric: '58',
    unit: 'Machines',
    secondary: '9 Due Soon / 3 Critical',
    status: 'Warning',
    tone: 'warning',
    code: 'MA',
  },
];

const governanceItems = [
  { title: 'RBAC permissions', value: '88%', width: '88%' },
  { title: 'Audit-ready activities', value: '76%', width: '76%' },
  { title: 'SLA and escalation readiness', value: '64%', width: '64%' },
  { title: 'Centralized role routing', value: '92%', width: '92%' },
];

const modules = [
  { title: 'Technicians Management', href: '/management/technicians', status: 'Live', tone: 'live', code: 'TM', description: 'Technician records, shifts, regions, skills, and dispatch availability.' },
  { title: 'Scheduling', href: '/management/scheduling', status: 'Live', tone: 'live', code: 'SC', description: 'Daily roster control, work windows, task groups, and technician assignment.' },
  { title: 'Engineering Workspace', href: '/workspace', status: 'Live', tone: 'live', code: 'WS', description: 'Creative canvas and day planner for engineering productivity.' },
  { title: 'EQP Module', href: '/eqp', status: 'Preserved / Live', tone: 'preserved', code: 'EQ', description: 'Reports, machines, PDF archive, and report builder under one EQP workspace.' },
];

const activity = [
  { action: 'Technician profile updated', time: '08:20 AM', status: 'Ready' },
  { action: 'New schedule created', time: '09:10 AM', status: 'Pending' },
  { action: 'EQP report uploaded', time: '10:35 AM', status: 'Completed' },
  { action: 'Machine maintenance record archived', time: '11:00 AM', status: 'Archived' },
];

const chartBars = [
  { label: '18/05', primary: 88, secondary: 40 },
  { label: '19/05', primary: 68, secondary: 34 },
  { label: '20/05', primary: 76, secondary: 60 },
  { label: '21/05', primary: 32, secondary: 54 },
  { label: '22/05', primary: 56, secondary: 82 },
  { label: '23/05', primary: 74, secondary: 96 },
  { label: '24/05', primary: 62, secondary: 72 },
  { label: '25/05', primary: 50, secondary: 46 },
];

const upcomingMaintenance = [
  { machine: 'D155A-6', technician: 'Motasem Ghanem', dueDate: 'May 21, 2026', status: 'Due Soon', tone: 'warning' },
  { machine: 'GD705A-4', technician: 'Abdelrahman', dueDate: 'May 22, 2026', status: 'Ready', tone: 'ready' },
  { machine: 'WA470-6', technician: 'Faisal', dueDate: 'May 23, 2026', status: 'Critical', tone: 'critical' },
  { machine: 'PC200-8', technician: 'Operations Team', dueDate: 'May 25, 2026', status: 'Scheduled', tone: 'active' },
];

export default function ManagementDashboardPage() {
  return (
    <SystemShell
      activePath="/management"
      eyebrow="DAR AL HAI"
      title="Dashboard"
      description="A unified maintenance operations view for technician administration, scheduling, and EQP reporting."
      actions={<Link href="/management/scheduling" className="ds-button ds-button-primary">+ Add schedule</Link>}
    >
      <section className="ds-reference-dashboard">
        <div className="ds-kpi-grid">
          {kpis.map((kpi) => (
            <article key={kpi.label} className="ds-kpi-card">
              <div className={`ds-icon-tile ${kpi.accent ? 'ds-icon-tile-accent' : ''}`}>{kpi.code}</div>
              <div className="ds-kpi-content">
                <div className="ds-kpi-head">
                  <p className="ds-kpi-label">{kpi.label}</p>
                  <Badge tone={kpi.tone}>{kpi.status}</Badge>
                </div>
                <div>
                  <p className="ds-kpi-main">{kpi.metric}</p>
                  <p className="ds-kpi-descriptor">{kpi.unit}</p>
                  <p className="ds-kpi-secondary">{kpi.secondary}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="ds-reference-grid">
          <Card className="ds-reference-chart-card">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="ds-panel-title">Maintenance Operations</h2>
                <p className="mt-1 text-sm font-bold text-[var(--color-muted)]">250,400 operational points tracked</p>
              </div>
              <div className="ds-segment-control">
                <span className="ds-segment-active">Day</span>
                <span>Month</span>
              </div>
            </div>

            <div className="ds-chart-legend">
              <span><i className="bg-[var(--color-brand)]" /> Completed</span>
              <span><i className="bg-[var(--color-canvas-strong)]" /> Planned</span>
            </div>

            <div className="ds-bar-chart" aria-label="Maintenance operations chart">
              {chartBars.map((item) => (
                <div key={item.label} className="ds-bar-column">
                  <div className="ds-bar-stack">
                    <span className="ds-bar ds-bar-secondary" style={{ height: `${item.secondary}%` }} />
                    <span className="ds-bar ds-bar-primary" style={{ height: `${item.primary}%` }} />
                  </div>
                  <span className="ds-bar-label">{item.label}</span>
                </div>
              ))}
            </div>
          </Card>

          <div className="ds-widget-stack">
            <Card className="ds-side-widget">
              <div className="flex items-center justify-between">
                <h2 className="ds-panel-title">Governance</h2>
                <Badge tone="info">Live</Badge>
              </div>
              <div className="mt-4 grid gap-2">
                {governanceItems.map((item) => (
                  <div key={item.title} className="ds-compact-row">
                    <span>{item.title}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="ds-side-widget">
              <div className="flex items-center justify-between">
                <h2 className="ds-panel-title">Operational Feed</h2>
                <span className="ds-widget-menu">...</span>
              </div>
              <div className="mt-4 grid gap-2">
                {activity.map((item) => (
                  <div key={`${item.action}-${item.time}`} className="ds-feed-row">
                    <span className="ds-feed-icon">{item.status.slice(0, 1)}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black text-[var(--color-ink)]">{item.action}</span>
                      <span className="block text-xs font-bold text-[var(--color-muted)]">{item.time}</span>
                    </span>
                    <Badge tone={item.status.toLowerCase()}>{item.status}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        <Card className="ds-project-table-card">
          <div className="flex flex-col gap-3 border-b border-[var(--color-border)] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="ds-panel-title">Modules</h2>
              <p className="mt-1 text-sm font-bold text-[var(--color-muted)]">Dar Al Hai workspaces and current readiness</p>
            </div>
            <div className="ds-segment-control">
              <span className="ds-segment-active">Day</span>
              <span>Month</span>
            </div>
          </div>
          <div className="ds-table-wrap">
            <table className="ds-table min-w-[860px]">
              <thead>
                <tr>
                  <th className="px-5 py-4 text-left">Module</th>
                  <th className="px-5 py-4 text-left">Scope</th>
                  <th className="px-5 py-4 text-left">Status</th>
                  <th className="px-5 py-4 text-left">Owner</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {modules.map((module, index) => (
                  <tr key={module.title} className="border-t border-[var(--color-border)]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="ds-mini-module-icon">{module.code}</span>
                        <span>
                          <span className="block font-black text-[var(--color-ink)]">{module.title}</span>
                          <span className="mt-1 block text-xs font-bold text-[var(--color-muted)]">#{String(index + 41).padStart(3, '0')}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">{module.description}</td>
                    <td className="px-5 py-4"><Badge tone={module.tone}>{module.status}</Badge></td>
                    <td className="px-5 py-4">Operations Team</td>
                    <td className="px-5 py-4 text-right">
                      <Link href={module.href} className="ds-button ds-button-secondary ds-button-small">
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="ds-project-table-card">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] p-5">
            <div>
              <h2 className="ds-panel-title">Upcoming Maintenance</h2>
              <p className="mt-1 text-sm font-bold text-[var(--color-muted)]">Planned service windows and readiness status.</p>
            </div>
            <Badge tone="pending">4 Items</Badge>
          </div>
          <div className="ds-table-wrap">
            <table className="ds-table min-w-[720px]">
                <thead>
                  <tr>
                    <th className="px-5 py-4 text-left">Machine</th>
                    <th className="px-5 py-4 text-left">Assigned Technician</th>
                    <th className="px-5 py-4 text-left">Due Date</th>
                    <th className="px-5 py-4 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingMaintenance.map((item) => (
                    <tr key={`${item.machine}-${item.dueDate}`} className="border-t border-[var(--color-border)]">
                      <td className="px-5 py-4 font-black text-[var(--color-ink)]">{item.machine}</td>
                      <td className="px-5 py-4">{item.technician}</td>
                      <td className="px-5 py-4">{item.dueDate}</td>
                      <td className="px-5 py-4"><Badge tone={item.tone}>{item.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </div>
        </Card>
      </section>
    </SystemShell>
  );
}
