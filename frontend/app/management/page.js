'use client';

import Link from 'next/link';
import SystemShell from '../../components/SystemShell';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

const kpis = [
  {
    label: 'Modules',
    metric: '3',
    unit: 'Core Modules',
    secondary: 'Active',
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

const operations = [
  { label: 'Technicians', value: '39%', color: 'var(--color-brand)' },
  { label: 'Scheduling', value: '25%', color: 'var(--color-accent)' },
  { label: 'EQP Reports', value: '19%', color: 'var(--color-info)' },
  { label: 'Machines', value: '17%', color: 'var(--color-warning)' },
];

const governanceItems = [
  { title: 'RBAC permissions', value: '88%', width: '88%' },
  { title: 'Audit-ready activities', value: '76%', width: '76%' },
  { title: 'SLA and escalation readiness', value: '64%', width: '64%' },
  { title: 'Centralized role routing', value: '92%', width: '92%' },
];

const governanceSummary = [
  { value: '4', label: 'Controls' },
  { value: '80%', label: 'Avg Readiness' },
  { value: 'Enterprise', label: 'Status' },
];

const modules = [
  { title: 'Technicians Management', href: '/management/technicians', status: 'Live', tone: 'live', code: 'TM', description: 'Technician records, shifts, regions, skills, and dispatch availability.' },
  { title: 'Scheduling', href: '/management/scheduling', status: 'Live', tone: 'live', code: 'SC', description: 'Daily roster control, work windows, task groups, and technician assignment.' },
  { title: 'EQP Module', href: '/eqp', status: 'Preserved', tone: 'preserved', code: 'EQ', description: 'Preventive maintenance workflow, reporting controls, and engineer moderation.' },
  { title: 'Machines', href: '/eqp/machines', status: 'Active', tone: 'active', code: 'MA', description: 'Fleet counters, SMR progression, engine references, and maintenance readiness.' },
  { title: 'PDF Archive', href: '/eqp/reports', status: 'Archived', tone: 'archived', code: 'PA', description: 'Generated PDFs, report numbers, machine coverage, and archive actions.' },
  { title: 'Report Builder', href: '/eqp/generate-reports', status: 'Ready', tone: 'ready', code: 'RB', description: 'Create finalized preventive maintenance PDFs from EQP templates.' },
];

const activity = [
  { action: 'Technician profile updated', time: '08:20 AM', status: 'Ready' },
  { action: 'New schedule created', time: '09:10 AM', status: 'Pending' },
  { action: 'EQP report uploaded', time: '10:35 AM', status: 'Completed' },
  { action: 'Machine maintenance record archived', time: '11:00 AM', status: 'Archived' },
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
    >
      <section className="ds-dashboard-grid">
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

        <div className="ds-analytics-grid">
          <Card className="p-6">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="ds-panel-title">Maintenance Operations Distribution</h2>
                  <Badge tone="info">Live Mix</Badge>
                </div>
                <p className="mt-2 max-w-xl text-sm font-semibold leading-6 text-[var(--color-muted)]">
                  Operational attention across technicians, scheduling, EQP reports, and machine readiness.
                </p>
                <div className="mt-6 grid gap-3">
                  {operations.map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-white px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm font-black text-[var(--color-ink)]">{item.label}</span>
                      </div>
                      <span className="text-sm font-black text-[var(--color-brand)]">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mx-auto shrink-0">
                <div className="ds-donut">
                  <div className="ds-donut-core">
                    <p className="text-3xl font-black text-[var(--color-ink)]">100%</p>
                    <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-[var(--color-muted)]">Live Mix</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="ds-panel-title">Governance & Protocol Distribution</h2>
              <Badge tone="dark">Enterprise</Badge>
            </div>
            <p className="mt-2 text-sm font-semibold leading-6 text-[var(--color-muted)]">
              Role routing, audit posture, and escalation readiness for controlled maintenance operations.
            </p>
            <div className="ds-summary-grid mt-5">
              {governanceSummary.map((item) => (
                <div key={item.label} className="ds-summary-tile">
                  <p className="ds-summary-value">{item.value}</p>
                  <p className="ds-summary-label">{item.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-4">
              {governanceItems.map((item) => (
                <div key={item.title} className="ds-chart-row">
                  <div className="min-w-0">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-black text-[var(--color-ink)]">{item.title}</p>
                      <p className="text-sm font-black text-[var(--color-brand)]">{item.value}</p>
                    </div>
                    <div className="ds-chart-bar">
                      <span className="ds-chart-fill" style={{ width: item.width }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="ds-module-grid">
          {modules.map((module) => (
            <Card key={module.title} className="ds-card-hover ds-module-card">
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="ds-icon-tile">{module.code}</div>
                    <div>
                      <h2 className="text-xl font-black text-[var(--color-ink)]">{module.title}</h2>
                      <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-muted)]">Module workspace</p>
                    </div>
                  </div>
                  <Badge tone={module.tone}>{module.status}</Badge>
                </div>
                <p className="mt-5 text-sm font-semibold leading-6 text-[var(--color-muted)]">{module.description}</p>
              </div>
              <Link href={module.href} className="ds-button ds-button-secondary mt-6">
                Open Module
              </Link>
            </Card>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="ds-panel-title">Recent Activity</h2>
              <Badge tone="live">Operational Feed</Badge>
            </div>
            <div className="mt-5 grid gap-3">
              {activity.map((item) => (
                <div key={`${item.action}-${item.time}`} className="ds-activity-item">
                  <span className="ds-activity-dot" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-[var(--color-ink)]">{item.action}</p>
                    <p className="mt-1 text-xs font-bold text-[var(--color-muted)]">{item.time}</p>
                  </div>
                  <Badge tone={item.status.toLowerCase()}>{item.status}</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b border-[var(--color-border)] p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="ds-panel-title">Upcoming Maintenance</h2>
                  <p className="mt-1 text-sm font-semibold text-[var(--color-muted)]">Planned service windows and readiness status.</p>
                </div>
                <Badge tone="pending">4 Items</Badge>
              </div>
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
        </div>
      </section>
    </SystemShell>
  );
}
