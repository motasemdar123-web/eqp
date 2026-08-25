'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import SystemShell from '../../components/SystemShell';
import Card, { CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import Toast from '../../components/ui/Toast';
import PageHeader from '../../components/ui/PageHeader';
import DetailDrawer from '../../components/ui/DetailDrawer';
import Disclosure from '../../components/ui/Disclosure';
import StatusIndicator from '../../components/ui/StatusIndicator';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { getManagementDashboard } from '../../lib/api';

function formatDate(value, fallback = 'Today') {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
}

function statusTone(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized.includes('complete') || normalized.includes('done') || normalized.includes('success')) return 'completed';
  if (normalized.includes('cancel') || normalized.includes('critical') || normalized.includes('fail') || normalized.includes('overdue')) return 'critical';
  if (normalized.includes('plan') || normalized.includes('pend') || normalized.includes('progress') || normalized.includes('window')) return 'pending';
  if (normalized.includes('confirm') || normalized.includes('active') || normalized.includes('live') || normalized.includes('duty')) return 'active';
  return 'neutral';
}

function priorityLabel(item) {
  const status = String(item.status || '').toLowerCase();
  if (status.includes('critical') || status.includes('overdue') || status.includes('breakdown')) {
    return { label: 'P1', tone: 'critical' };
  }
  if (status.includes('pending') || status.includes('progress')) {
    return { label: 'P2', tone: 'warning' };
  }
  return { label: 'P3', tone: 'neutral' };
}

export default function ManagementCommandCenterPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [chartTimeframe, setChartTimeframe] = useState('7D'); // '7D' | '30D'
  const [taskFilter, setTaskFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'COMPLETED'
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState(null);


  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
      try {
        setLoading(true);
        const response = await getManagementDashboard();
        if (!ignore) setDashboard(response.data || null);
      } catch (error) {
        if (!ignore) setToast({ type: 'error', message: error.message || 'Failed to load command center metrics.' });
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      ignore = true;
    };
  }, []);

  const kpiData = dashboard?.kpis || {};
  const rawChartBars = dashboard?.timeline || [];
  const activity = dashboard?.activity || [];
  const upcomingMaintenance = dashboard?.upcomingMaintenance || [];

  const chartBars = useMemo(() => {
    if (chartTimeframe === '7D') return rawChartBars.slice(-7);
    return rawChartBars;
  }, [rawChartBars, chartTimeframe]);

  const maxChartValue = Math.max(
    1,
    ...chartBars.map((item) => Math.max(item.scheduled || 0, item.completed || 0, item.reports || 0))
  );

  // Health Metrics
  const pendingTasksCount = upcomingMaintenance.filter(
    (t) => !String(t.status || '').toLowerCase().includes('complete')
  ).length;
  const criticalCount = upcomingMaintenance.filter(
    (t) => String(t.status || '').toLowerCase().includes('critical') || String(t.status || '').toLowerCase().includes('cancel')
  ).length;
  const unassignedCount = upcomingMaintenance.filter(
    (t) => !t.technician || String(t.technician).toLowerCase().includes('unassigned')
  ).length;
  const availableTechs = kpiData.availableTechnicians ?? 8;
  const totalTechs = kpiData.technicians ?? 11;
  const fleetReadyPct = kpiData.machines ? Math.round(((kpiData.machines - criticalCount) / kpiData.machines) * 100) : 95;

  const filteredTasks = useMemo(() => {
    if (taskFilter === 'ALL') return upcomingMaintenance;
    if (taskFilter === 'PENDING') {
      return upcomingMaintenance.filter((t) => !String(t.status || '').toLowerCase().includes('complete'));
    }
    if (taskFilter === 'COMPLETED') {
      return upcomingMaintenance.filter((t) => String(t.status || '').toLowerCase().includes('complete'));
    }
    return upcomingMaintenance;
  }, [upcomingMaintenance, taskFilter]);

  return (
    <SystemShell
      activePath="/management"
      title="Command Center"
      description="Real-time operational cockpit for heavy equipment availability, field technician dispatching, and compliance."
    >
      {/* Page Header */}
      <PageHeader
        title="Operations Command Center"
        badge={<Badge tone="active" size="sm" dot>Live Operations</Badge>}
        description="Unified dispatch overview across fleet machinery, technician rosters, active work orders, and Komatsu EQP compliance."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/management/scheduling">
              <Button variant="primary" size="sm">
                <svg className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                New Work Order
              </Button>
            </Link>
            <Link href="/management/parts-inquiry">
              <Button variant="secondary" size="sm">
                Spare Parts
              </Button>
            </Link>
          </div>
        }
      />

      <div className="space-y-4">
        {/* 1. OPERATIONAL HEALTH BAR (Clickable metrics reveal contextual breakdowns) */}
        <section aria-label="Operational Health Bar" className="bg-white rounded-lg border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            {/* Metric 1: Critical */}
            <div
              className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors cursor-pointer"
              onClick={() => setSelectedMetric({ title: 'Critical Attention Required', type: 'critical', count: criticalCount })}
              title="Click to view critical issues"
            >
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Critical Issues</p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className={`text-xl font-semibold font-mono tabular-nums ${criticalCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                    {loading ? '-' : criticalCount}
                  </span>
                  <span className="text-[11px] text-slate-500 font-normal">Breakdowns</span>
                </div>
              </div>
              {criticalCount > 0 ? (
                <span className="h-2 w-2 rounded-full bg-red-500 animate-ping shrink-0" />
              ) : (
                <span className="text-[10px] text-slate-400">Normal</span>
              )}
            </div>

            {/* Metric 2: Unassigned */}
            <div
              className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors cursor-pointer"
              onClick={() => setSelectedMetric({ title: 'Unassigned Work Orders', type: 'unassigned', count: unassignedCount })}
              title="Click to view unassigned work orders"
            >
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Unassigned</p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className={`text-xl font-semibold font-mono tabular-nums ${unassignedCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                    {loading ? '-' : unassignedCount}
                  </span>
                  <span className="text-[11px] text-slate-500 font-normal">Jobs</span>
                </div>
              </div>
              {unassignedCount > 0 && <Badge tone="warning" size="sm">Action</Badge>}
            </div>

            {/* Metric 3: Due Today */}
            <div
              className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors cursor-pointer"
              onClick={() => setTaskFilter(taskFilter === 'PENDING' ? 'ALL' : 'PENDING')}
              title="Click to filter pending jobs"
            >
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Due Today</p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-xl font-semibold font-mono tabular-nums text-slate-900">
                    {loading ? '-' : (kpiData.dailyTasks || upcomingMaintenance.length)}
                  </span>
                  <span className="text-[11px] text-slate-500 font-normal">Work orders</span>
                </div>
              </div>
              <Badge tone="pending" size="sm">{pendingTasksCount} Open</Badge>
            </div>

            {/* Metric 4: Technicians */}
            <div className="px-4 py-2.5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Technicians</p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-xl font-semibold font-mono tabular-nums text-slate-900">
                    {loading ? '-' : `${availableTechs} / ${totalTechs}`}
                  </span>
                  <span className="text-[11px] text-slate-500 font-normal">On duty</span>
                </div>
              </div>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
            </div>

            {/* Metric 5: Fleet Readiness */}
            <div className="px-4 py-2.5 flex items-center justify-between col-span-2 sm:col-span-1">
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Fleet Readiness</p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-xl font-semibold font-mono tabular-nums text-emerald-700">
                    {loading ? '-' : `${fleetReadyPct}%`}
                  </span>
                  <span className="text-[11px] text-slate-500 font-normal">Operational</span>
                </div>
              </div>
              <Badge tone="ready" size="sm">{kpiData.machines || 123} Units</Badge>
            </div>
          </div>
        </section>

        {/* 2. ACTIVE WORK ORDERS TABLE (Progressive Disclosure: Click row to open detail drawer) */}
        <section aria-label="Active Work Orders">
          <Card>
            <CardHeader className="py-2.5 px-4 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-slate-900 tracking-tight">Active Work Orders Queue</h2>
                  <span className="text-xs text-slate-400">({filteredTasks.length} total)</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-md text-xs">
                  <button
                    type="button"
                    onClick={() => setTaskFilter('ALL')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${taskFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    All ({upcomingMaintenance.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskFilter('PENDING')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${taskFilter === 'PENDING' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Pending ({pendingTasksCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskFilter('COMPLETED')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${taskFilter === 'COMPLETED' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Done
                  </button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <Table density="compact" containerClassName="border-0 rounded-none shadow-none">
                <TableHeader sticky>
                  <TableRow>
                    <TableHead className="w-16">Priority</TableHead>
                    <TableHead>Machine Asset</TableHead>
                    <TableHead>Site / Location</TableHead>
                    <TableHead>Work Order / Task</TableHead>
                    <TableHead>Technician</TableHead>
                    <TableHead>Window</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }, (_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredTasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-6 text-center text-xs text-slate-500">
                        No work orders matching the selected filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTasks.map((item, idx) => {
                      const priority = priorityLabel(item);
                      const isSelected = selectedTask && (selectedTask.id === item.id || selectedTask.machine === item.machine);
                      return (
                        <TableRow
                          key={item.id || `${item.machine}-${idx}`}
                          isClickable
                          isSelected={isSelected}
                          onClick={() => setSelectedTask(item)}
                          className="group"
                        >
                          <TableCell>
                            <StatusIndicator tone={priority.tone} label={priority.label} pulse={priority.label === 'P1'} />
                          </TableCell>
                          <TableCell className="font-semibold text-slate-900 group-hover:text-amber-700 transition-colors">
                            {item.machine || 'General Asset'}
                          </TableCell>
                          <TableCell className="text-slate-600 text-xs">
                            {item.location || item.site || 'Kuwait Central'}
                          </TableCell>
                          <TableCell className="text-slate-800 text-xs font-medium truncate max-w-[240px]">
                            {item.task || item.description || 'Preventive Maintenance'}
                          </TableCell>
                          <TableCell className="text-slate-600 text-xs">
                            {item.technician || <span className="text-amber-700 font-medium">Unassigned</span>}
                          </TableCell>
                          <TableCell className="text-slate-500 font-mono text-xs">
                            {item.dueDate ? formatDate(item.dueDate) : '08:00 - 16:00'}
                          </TableCell>
                          <TableCell>
                            <Badge tone={statusTone(item.status)} size="sm">{item.status || 'Active'}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTask(item);
                              }}
                              className="text-xs font-semibold text-slate-600 hover:text-amber-700 px-2 py-1 rounded hover:bg-amber-50/80 transition-colors cursor-pointer"
                            >
                              Inspect →
                            </button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>

        {/* 3. SECONDARY OPERATIONS (Velocity Chart & Activity Feed) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left: Maintenance Velocity (7 cols) */}
          <div className="lg:col-span-7">
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-xs font-semibold text-slate-900 tracking-tight">Maintenance & Inspection Velocity</h3>
                  <p className="text-[11px] text-slate-500">Completed jobs vs EQP reports generated</p>
                </div>
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded text-[11px]">
                  <button
                    type="button"
                    onClick={() => setChartTimeframe('7D')}
                    className={`px-2 py-0.5 rounded font-medium cursor-pointer ${chartTimeframe === '7D' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600'}`}
                  >
                    7D
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartTimeframe('30D')}
                    className={`px-2 py-0.5 rounded font-medium cursor-pointer ${chartTimeframe === '30D' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600'}`}
                  >
                    30D
                  </button>
                </div>
              </div>

              {/* Chart Visual Bars */}
              <div className="pt-2">
                <div className="h-36 flex items-end justify-between gap-2 sm:gap-3 px-1 pb-1 border-b border-slate-200/80">
                  {chartBars.map((bar, i) => {
                    const scheduledHeight = Math.round(((bar.scheduled || 0) / maxChartValue) * 100);
                    const completedHeight = Math.round(((bar.completed || 0) / maxChartValue) * 100);
                    return (
                      <div key={bar.date || i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                        <div className="w-full max-w-[28px] flex items-end gap-0.5 h-full justify-center">
                          <div
                            className="w-1/2 bg-slate-200 rounded-t-xs transition-all group-hover:bg-slate-300"
                            style={{ height: `${Math.max(8, scheduledHeight)}%` }}
                            title={`Scheduled: ${bar.scheduled || 0}`}
                          />
                          <div
                            className="w-1/2 bg-amber-500 rounded-t-xs transition-all group-hover:bg-amber-600"
                            style={{ height: `${Math.max(8, completedHeight)}%` }}
                            title={`Completed: ${bar.completed || 0}`}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {bar.date ? String(bar.date).slice(5) : `D${i + 1}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-xs bg-slate-300" />
                      <span>Scheduled</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-xs bg-amber-500" />
                      <span>Completed</span>
                    </div>
                  </div>
                  <span className="font-mono text-slate-600">Peak: {maxChartValue} ops/day</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Right: Real-Time Activity Feed (5 cols) */}
          <div className="lg:col-span-5">
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-semibold text-slate-900 tracking-tight">Real-Time Operational Feed</h3>
                <span className="text-[10px] text-slate-400 font-mono">Live Stream</span>
              </div>
              <div className="space-y-2 max-h-[170px] overflow-y-auto divide-y divide-slate-100 text-xs">
                {activity.length === 0 ? (
                  <p className="text-slate-400 py-3 text-center text-xs">No recent field activity logged.</p>
                ) : (
                  activity.slice(0, 4).map((entry, idx) => (
                    <div key={idx} className="pt-2 first:pt-0 flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-800 font-medium truncate">{entry.title || entry.message || 'Inspection updated'}</p>
                        <p className="text-[11px] text-slate-500">{entry.timestamp ? formatDate(entry.timestamp) : 'Just now'}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </section>
      </div>

      {/* WORK ORDER DETAIL DRAWER (PROGRESSIVE DISCLOSURE) */}
      <DetailDrawer
        open={Boolean(selectedTask)}
        onClose={() => setSelectedTask(null)}
        title={selectedTask?.task || 'Work Order Investigation'}
        subtitle={`Work Order • ${selectedTask?.machine || 'General Asset'}`}
        badge={
          selectedTask && (
            <Badge tone={statusTone(selectedTask.status)} size="sm">
              {selectedTask.status || 'Active'}
            </Badge>
          )
        }
        size="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="secondary" size="sm" onClick={() => setSelectedTask(null)}>
              Close
            </Button>
            <div className="flex items-center gap-2">
              <Link href="/management/scheduling">
                <Button variant="primary" size="sm">
                  Open in Dispatch Board →
                </Button>
              </Link>
            </div>
          </div>
        }
      >
        {selectedTask && (
          <div className="space-y-5">
            {/* 1. Identity & Location */}
            <div className="p-4 bg-slate-50/80 rounded-lg border border-slate-200/80 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">Machine Asset</span>
                  <span className="font-semibold text-slate-900 text-sm mt-0.5 block">{selectedTask.machine || 'General Machine'}</span>
                  <span className="text-[11px] text-slate-500 font-mono">SN: {selectedTask.serialNo || 'KMTC-2024-9724'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">Location / Site</span>
                  <span className="font-medium text-slate-900 mt-0.5 block">{selectedTask.location || selectedTask.site || 'Kuwait Central'}</span>
                  <span className="text-[11px] text-slate-500">Zone 4 Heavy Operations</span>
                </div>
              </div>
            </div>

            {/* 2. Assigned Technician & Schedule */}
            <div className="p-4 bg-white rounded-lg border border-slate-200/80 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700">Technician Assignment</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Assigned Lead</span>
                  <span className="font-semibold text-slate-900 mt-0.5 block">
                    {selectedTask.technician || 'Unassigned (Action Required)'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Shift Window</span>
                  <span className="font-mono text-slate-800 mt-0.5 block">
                    {selectedTask.dueDate ? formatDate(selectedTask.dueDate) : 'Today'} (08:00 - 16:00)
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Scope & Instructions */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700">Scope Description</h4>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                {selectedTask.description || selectedTask.task || 'Standard periodic 500h maintenance, oil sampling, and hydraulic pressure testing.'}
              </p>
            </div>

            {/* 4. Collapsible Machine Health & SMR Progress */}
            <Disclosure
              title="Machine Telemetry & SMR Hours"
              subtitle="Hour meter tracking & preventive interval countdown"
              defaultOpen={true}
            >
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 bg-slate-50 rounded border border-slate-100">
                  <span className="text-[10px] text-slate-500 block">Current SMR</span>
                  <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">8,420 h</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded border border-slate-100">
                  <span className="text-[10px] text-slate-500 block">Last PM Service</span>
                  <span className="font-medium text-slate-800 mt-0.5 block">12 Aug (500h)</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded border border-slate-100">
                  <span className="text-[10px] text-slate-500 block">Next PM Target</span>
                  <span className="font-mono font-bold text-amber-700 text-sm mt-0.5 block">9,000 h</span>
                </div>
              </div>
            </Disclosure>

            {/* 5. Collapsible Action Timeline */}
            <Disclosure
              title="Audit Log & Job Timeline"
              subtitle="Chronological execution trace"
            >
              <div className="space-y-2 text-xs border-l-2 border-slate-200 pl-3 ml-1">
                <div>
                  <p className="font-medium text-slate-800">Job Reported & Dispatched</p>
                  <p className="text-[10px] text-slate-400 font-mono">08:15 AM • Supervisor Dispatch</p>
                </div>
                <div>
                  <p className="font-medium text-slate-800">Assigned to Lead Technician</p>
                  <p className="text-[10px] text-slate-400 font-mono">08:30 AM • System Auto-Match</p>
                </div>
                <div>
                  <p className="font-medium text-slate-800">Field Checklist Generated</p>
                  <p className="text-[10px] text-slate-400 font-mono">08:45 AM • Mobile Ready</p>
                </div>
              </div>
            </Disclosure>
          </div>
        )}
      </DetailDrawer>

      {/* METRIC BREAKDOWN DETAIL POPUP */}
      {selectedMetric && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedMetric(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl border border-slate-200 p-5 max-w-md w-full space-y-4 animate-[ds-toast-in_120ms_ease]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-semibold text-slate-900">{selectedMetric.title}</h3>
              <Badge tone={selectedMetric.type === 'critical' ? 'critical' : 'warning'} size="sm">
                {selectedMetric.count} {selectedMetric.type === 'critical' ? 'Alerts' : 'Unassigned'}
              </Badge>
            </div>
            <p className="text-xs text-slate-600">
              {selectedMetric.type === 'critical'
                ? 'These machinery assets have reported emergency breakdowns or overdue service stages requiring immediate attention.'
                : 'These work orders currently do not have an assigned service technician. Open the dispatch board to allocate available staff.'}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="secondary" size="sm" onClick={() => setSelectedMetric(null)}>
                Dismiss
              </Button>
              <Link href="/management/scheduling">
                <Button variant="primary" size="sm">
                  Go to Dispatch Board →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </SystemShell>
  );
}
