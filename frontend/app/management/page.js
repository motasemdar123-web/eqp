'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import SystemShell from '../../components/SystemShell';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import Toast from '../../components/ui/Toast';
import { getManagementDashboard } from '../../lib/api';

const modules = [
  { title: 'Technicians Management', href: '/management/technicians', status: 'Live', tone: 'live', code: 'TM', description: 'Technician records, shifts, regions, skills, and dispatch availability.' },
  { title: 'Scheduling', href: '/management/scheduling', status: 'Live', tone: 'live', code: 'SC', description: 'Daily roster control, work windows, task groups, and technician assignment.' },
  { title: 'Engineering Workspace', href: '/workspace', status: 'Live', tone: 'live', code: 'WS', description: 'Creative canvas and day planner for engineering productivity.' },
  { title: 'EQP Module', href: '/eqp', status: 'Preserved / Live', tone: 'preserved', code: 'EQ', description: 'Reports, machines, PDF archive, and report builder under one EQP workspace.' },
];

function formatDate(value, fallback = 'No data') {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function formatTime(value) {
  if (!value) return 'No time';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No time';
  return new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit' }).format(date);
}

function statusTone(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized.includes('complete')) return 'completed';
  if (normalized.includes('cancel') || normalized.includes('critical')) return 'critical';
  if (normalized.includes('planned') || normalized.includes('pending')) return 'pending';
  if (normalized.includes('confirm') || normalized.includes('active')) return 'active';
  return 'neutral';
}

export default function ManagementDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
      try {
        setLoading(true);
        const response = await getManagementDashboard();
        if (!ignore) setDashboard(response.data || null);
      } catch (error) {
        if (!ignore) setToast({ type: 'error', message: error.message || 'Failed to load dashboard metrics.' });
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      ignore = true;
    };
  }, []);

  const kpis = useMemo(() => {
    const data = dashboard?.kpis || {};
    return [
      {
        label: 'Modules',
        metric: dashboard?.modules?.length || modules.length,
        unit: 'Available modules',
        secondary: `${modules.length} navigation workspaces`,
        status: 'Ready',
        tone: 'ready',
        code: 'AM',
      },
      {
        label: 'Technicians',
        metric: data.technicians || 0,
        unit: 'Registered',
        secondary: `${data.availableTechnicians || 0} available today`,
        status: 'Live',
        tone: 'live',
        code: 'TM',
        accent: true,
      },
      {
        label: 'Scheduling',
        metric: data.dailyTasks || 0,
        unit: 'Tasks today',
        secondary: `${data.scheduledTechnicians || 0} technicians assigned`,
        status: 'Active',
        tone: 'active',
        code: 'SC',
      },
      {
        label: 'EQP Reports',
        metric: data.reports || 0,
        unit: 'Archived reports',
        secondary: `${data.reportsThisWeek || 0} generated this week`,
        status: 'Preserved / Live',
        tone: 'preserved',
        code: 'EQ',
        accent: true,
      },
      {
        label: 'Machines',
        metric: data.machines || 0,
        unit: 'Registered assets',
        secondary: `${data.machineTypes || 0} machine types`,
        status: 'Active',
        tone: 'active',
        code: 'MA',
      },
    ];
  }, [dashboard]);

  const governanceItems = dashboard?.governance || [];
  const chartBars = dashboard?.timeline || [];
  const activity = dashboard?.activity || [];
  const upcomingMaintenance = dashboard?.upcomingMaintenance || [];
  const maxChartValue = Math.max(1, ...chartBars.map((item) => Math.max(item.scheduled || 0, item.completed || 0, item.reports || 0)));
  const totalOperations = chartBars.reduce((total, item) => total + (item.scheduled || 0) + (item.reports || 0), 0);

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
          {loading ? Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-36" />) : kpis.map((kpi) => (
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
                <p className="mt-1 text-sm font-bold text-[var(--color-muted)]">{totalOperations} real operations tracked this week</p>
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
                    <span className="ds-bar ds-bar-secondary" style={{ height: `${Math.max(4, ((item.reports || 0) / maxChartValue) * 100)}%` }} />
                    <span className="ds-bar ds-bar-primary" style={{ height: `${Math.max(4, ((item.scheduled || 0) / maxChartValue) * 100)}%` }} />
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
                    <strong>{item.value}%</strong>
                  </div>
                ))}
                {!loading && governanceItems.length === 0 && <span className="text-sm font-bold text-[var(--color-muted)]">No readiness metrics yet.</span>}
              </div>
            </Card>

            <Card className="ds-side-widget">
              <div className="flex items-center justify-between">
                <h2 className="ds-panel-title">Operational Feed</h2>
                <span className="ds-widget-menu">...</span>
              </div>
              <div className="mt-4 grid gap-2">
                {activity.map((item) => (
                  <Link key={`${item.action}-${item.time}`} href={item.href || '/management'} className="ds-feed-row">
                    <span className="ds-feed-icon">{String(item.status || 'A').slice(0, 1)}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black text-[var(--color-ink)]">{item.action}</span>
                      <span className="block text-xs font-bold text-[var(--color-muted)]">{formatTime(item.time)}</span>
                    </span>
                    <Badge tone={statusTone(item.status)}>{item.status}</Badge>
                  </Link>
                ))}
                {!loading && activity.length === 0 && <span className="text-sm font-bold text-[var(--color-muted)]">No recent platform activity.</span>}
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
            <Badge tone="pending">{upcomingMaintenance.length} Items</Badge>
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
                    <tr key={item.id || `${item.machine}-${item.dueDate}`} className="border-t border-[var(--color-border)]">
                      <td className="px-5 py-4 font-black text-[var(--color-ink)]">{item.machine}</td>
                      <td className="px-5 py-4">{item.technician}</td>
                      <td className="px-5 py-4">{formatDate(item.dueDate)}</td>
                      <td className="px-5 py-4"><Badge tone={statusTone(item.status)}>{item.status}</Badge></td>
                    </tr>
                  ))}
                  {!loading && upcomingMaintenance.length === 0 && (
                    <tr>
                      <td className="px-5 py-6 text-sm font-bold text-[var(--color-muted)]" colSpan={4}>No upcoming scheduled maintenance tasks.</td>
                    </tr>
                  )}
                </tbody>
              </table>
          </div>
        </Card>
      </section>
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </SystemShell>
  );
}
