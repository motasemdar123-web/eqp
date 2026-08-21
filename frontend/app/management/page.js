'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import SystemShell from '../../components/SystemShell';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import Toast from '../../components/ui/Toast';
import { getManagementDashboard } from '../../lib/api';

const modules = [
  { title: 'Technicians Management', href: '/management/technicians', status: 'Live', tone: 'live', icon: 'technicians', description: 'Technician records, shifts, regions, skills, and dispatch availability.' },
  { title: 'Scheduling', href: '/management/scheduling', status: 'Live', tone: 'live', icon: 'scheduling', description: 'Daily roster control, work windows, task groups, and technician assignment.' },
  { title: 'Daily Planner', href: '/management/daily-planner', status: 'Live', tone: 'live', icon: 'planner', description: 'Personal shift schedule with timed work orders and supervisor dispatch inbox.' },
  { title: 'Parts Inquiry Hub', href: '/management/parts-inquiry', status: 'Live', tone: 'live', icon: 'parts', description: 'Komatsu PDX multi-part inquiry tool with live stock and alternative parts.' },
  { title: 'Engineering Workspace', href: '/workspace', status: 'Live', tone: 'live', icon: 'workspace', description: 'Miro-grade visual collaboration whiteboard for machine diagnostics.' },
  { title: 'EQP Module', href: '/eqp', status: 'Preserved / Live', tone: 'preserved', icon: 'eqp', description: 'Reports, machines, PDF archive, and report builder under one EQP workspace.' },
];

function ModuleIcon({ type }) {
  if (type === 'technicians') {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    );
  }
  if (type === 'scheduling') {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    );
  }
  if (type === 'planner') {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  if (type === 'parts') {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    );
  }
  if (type === 'workspace') {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    );
  }
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

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
  if (normalized.includes('confirm') || normalized.includes('active') || normalized.includes('live')) return 'active';
  return 'neutral';
}

export default function ManagementDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [chartTimeframe, setChartTimeframe] = useState('7D'); // '7D' | '30D'

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
        label: 'Workspaces',
        metric: dashboard?.modules?.length || modules.length,
        unit: 'Active Modules',
        secondary: `${modules.length} operational zones`,
        status: 'Ready',
        tone: 'ready',
        icon: 'modules',
      },
      {
        label: 'Technicians',
        metric: data.technicians || 0,
        unit: 'Registered Staff',
        secondary: `${data.availableTechnicians || 0} available today`,
        status: 'Live',
        tone: 'live',
        icon: 'technicians',
        accent: true,
      },
      {
        label: 'Scheduling',
        metric: data.dailyTasks || 0,
        unit: 'Tasks Scheduled',
        secondary: `${data.scheduledTechnicians || 0} assigned personnel`,
        status: 'Active',
        tone: 'active',
        icon: 'scheduling',
      },
      {
        label: 'EQP Reports',
        metric: data.reports || 0,
        unit: 'Archived Reports',
        secondary: `${data.reportsThisWeek || 0} created this week`,
        status: 'Preserved',
        tone: 'preserved',
        icon: 'reports',
        accent: true,
      },
      {
        label: 'Machines',
        metric: data.machines || 0,
        unit: 'Registered Assets',
        secondary: `${data.machineTypes || 0} fleet models`,
        status: 'Active',
        tone: 'active',
        icon: 'machines',
      },
    ];
  }, [dashboard]);

  const governanceItems = dashboard?.governance || [];
  const rawChartBars = dashboard?.timeline || [];
  const activity = dashboard?.activity || [];
  const upcomingMaintenance = dashboard?.upcomingMaintenance || [];

  const chartBars = useMemo(() => {
    if (chartTimeframe === '7D') return rawChartBars.slice(-7);
    return rawChartBars;
  }, [rawChartBars, chartTimeframe]);

  const maxChartValue = Math.max(1, ...chartBars.map((item) => Math.max(item.scheduled || 0, item.completed || 0, item.reports || 0)));
  const totalOperations = chartBars.reduce((total, item) => total + (item.scheduled || 0) + (item.reports || 0), 0);

  return (
    <SystemShell
      activePath="/management"
      eyebrow="Dar Al Hai Operations"
      title="Management Command Dashboard"
      description="Unified operations overview for field technicians, maintenance schedules, machine assets, parts inquiry, and EQP reporting."
      actions={
        <div className="flex items-center gap-2">
          <Link href="/management/scheduling" className="ds-button ds-button-primary shadow-xs">
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Schedule
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* KPI Metrics Grid */}
        <section className="ds-kpi-grid">
          {loading
            ? Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-32 rounded-xl" />)
            : kpis.map((kpi) => (
                <article key={kpi.label} className="ds-kpi-card group">
                  <div className={`ds-icon-tile ${kpi.accent ? 'ds-icon-tile-accent' : ''}`}>
                    <ModuleIcon type={kpi.icon} />
                  </div>
                  <div className="ds-kpi-content">
                    <div className="ds-kpi-head">
                      <p className="ds-kpi-label">{kpi.label}</p>
                      <Badge tone={kpi.tone}>{kpi.status}</Badge>
                    </div>
                    <div>
                      <p className="ds-kpi-main">{kpi.metric}</p>
                      <p className="ds-kpi-descriptor">{kpi.unit}</p>
                      <p className="ds-kpi-secondary mt-0.5">{kpi.secondary}</p>
                    </div>
                  </div>
                </article>
              ))}
        </section>

        {/* Analytics Chart & Governance Section */}
        <section className="ds-reference-grid">
          <Card className="p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="ds-panel-title">Maintenance & Inspection Velocity</h2>
                <p className="mt-1 text-xs text-slate-500">{totalOperations} operations tracked in this period</p>
              </div>
              <div className="ds-segment-control">
                <button
                  type="button"
                  className={chartTimeframe === '7D' ? 'ds-segment-active' : ''}
                  onClick={() => setChartTimeframe('7D')}
                >
                  7 Days
                </button>
                <button
                  type="button"
                  className={chartTimeframe === '30D' ? 'ds-segment-active' : ''}
                  onClick={() => setChartTimeframe('30D')}
                >
                  30 Days
                </button>
              </div>
            </div>

            <div className="ds-chart-legend mt-3">
              <span><i className="bg-slate-900" /> Completed Tasks</span>
              <span><i className="bg-amber-500" /> Planned Services</span>
            </div>

            <div className="ds-bar-chart" aria-label="Maintenance operations chart">
              {chartBars.map((item) => (
                <div key={item.label} className="ds-bar-column">
                  <div className="ds-bar-stack">
                    <span
                      className="ds-bar ds-bar-secondary"
                      style={{ height: `${Math.max(6, ((item.reports || 0) / maxChartValue) * 100)}%` }}
                      title={`Reports: ${item.reports || 0}`}
                    />
                    <span
                      className="ds-bar ds-bar-primary"
                      style={{ height: `${Math.max(6, ((item.scheduled || 0) / maxChartValue) * 100)}%` }}
                      title={`Scheduled: ${item.scheduled || 0}`}
                    />
                  </div>
                  <span className="ds-bar-label">{item.label}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Side Widgets */}
          <div className="ds-widget-stack">
            <Card className="ds-side-widget">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="ds-panel-title">Readiness Governance</h2>
                <Badge tone="info">Monitored</Badge>
              </div>
              <div className="mt-4 grid gap-3.5">
                {governanceItems.map((item) => (
                  <div key={item.title} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{item.title}</span>
                      <span className="font-mono">{item.value}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-amber-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, item.value || 0))}%` }}
                      />
                    </div>
                  </div>
                ))}
                {!loading && governanceItems.length === 0 && (
                  <span className="text-xs text-slate-500 py-2">No readiness metrics recorded.</span>
                )}
              </div>
            </Card>

            <Card className="ds-side-widget">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="ds-panel-title">Operational Feed</h2>
                <Badge tone="neutral">Live</Badge>
              </div>
              <div className="mt-3 grid gap-2">
                {activity.slice(0, 4).map((item, idx) => (
                  <Link key={`${item.action}-${idx}`} href={item.href || '/management'} className="ds-feed-row">
                    <span className="ds-feed-icon">
                      <svg className="h-3.5 w-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-slate-900">{item.action}</span>
                      <span className="block text-[0.6875rem] text-slate-400 font-mono">{formatTime(item.time)}</span>
                    </span>
                    <Badge tone={statusTone(item.status)}>{item.status}</Badge>
                  </Link>
                ))}
                {!loading && activity.length === 0 && (
                  <span className="text-xs text-slate-500 py-2">No recent platform activity.</span>
                )}
              </div>
            </Card>
          </div>
        </section>

        {/* Modules Overview */}
        <Card className="ds-project-table-card">
          <div className="flex flex-col gap-2 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between bg-slate-50/60">
            <div>
              <h2 className="ds-panel-title">Operational Workspaces</h2>
              <p className="mt-0.5 text-xs text-slate-500">Core Dar Al Hai modules and live subsystem states</p>
            </div>
            <Badge tone="ready">{modules.length} Modules Online</Badge>
          </div>
          <div className="ds-table-wrap">
            <table className="ds-table">
              <thead>
                <tr>
                  <th>Workspace</th>
                  <th>Scope & Description</th>
                  <th>Status</th>
                  <th>Ownership</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {modules.map((module) => (
                  <tr key={module.title}>
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="ds-mini-module-icon">
                          <ModuleIcon type={module.icon} />
                        </span>
                        <div>
                          <span className="block font-semibold text-slate-900">{module.title}</span>
                          <span className="block text-xs text-slate-500">Dar Al Hai Subsystem</span>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-md text-xs text-slate-600">{module.description}</td>
                    <td><Badge tone={module.tone}>{module.status}</Badge></td>
                    <td className="text-xs font-medium text-slate-700">Operations Team</td>
                    <td className="text-right">
                      <Link href={module.href} className="ds-button ds-button-secondary ds-button-small">
                        Open Workspace
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Upcoming Maintenance Table */}
        <Card className="ds-project-table-card">
          <div className="flex items-center justify-between border-b border-slate-200 p-5 bg-slate-50/60">
            <div>
              <h2 className="ds-panel-title">Upcoming Maintenance Windows</h2>
              <p className="mt-0.5 text-xs text-slate-500">Planned field service windows and dispatch readiness</p>
            </div>
            <Badge tone="pending">{upcomingMaintenance.length} Scheduled</Badge>
          </div>
          <div className="ds-table-wrap">
            <table className="ds-table">
              <thead>
                <tr>
                  <th>Machine Asset</th>
                  <th>Assigned Technician</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {upcomingMaintenance.map((item) => (
                  <tr key={item.id || `${item.machine}-${item.dueDate}`}>
                    <td className="font-semibold text-slate-900">{item.machine}</td>
                    <td className="text-slate-600">{item.technician || 'Unassigned'}</td>
                    <td className="text-slate-600 font-mono">{formatDate(item.dueDate)}</td>
                    <td><Badge tone={statusTone(item.status)}>{item.status}</Badge></td>
                  </tr>
                ))}
                {!loading && upcomingMaintenance.length === 0 && (
                  <tr>
                    <td className="py-8 text-center text-xs text-slate-500" colSpan={4}>
                      No upcoming maintenance tasks currently scheduled.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </SystemShell>
  );
}
