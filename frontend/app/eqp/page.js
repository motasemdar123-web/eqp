'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import SystemShell from '../../components/SystemShell';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import { getMachines, getReports } from '../../lib/api';
import { getStoredPlatformSession, getStoredUser } from '../../lib/auth';
import { FleetModelBarChart, EngineerFleetDonutChart, SmrDistributionChart } from '../../components/eqp/EqpCharts';
import MachineTimelineModal from '../../components/eqp/MachineTimelineModal';
import EqpNav from '../../components/eqp/EqpNav';

const modules = [
  {
    href: '/eqp/generate-reports',
    title: 'Report Builder',
    status: 'Ready',
    tone: 'ready',
    color: 'from-amber-500/10 to-amber-500/5 border-amber-500/20',
    iconColor: 'bg-amber-500 text-white',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    description: 'Generate standardized Komatsu PM inspection PDFs in batches with sequential naming & auto-signatures.',
  },
  {
    href: '/eqp/lifecycle',
    title: 'Lifecycle View',
    status: 'Live',
    tone: 'live',
    color: 'from-sky-500/10 to-sky-500/5 border-sky-500/20',
    iconColor: 'bg-sky-600 text-white',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    description: 'Track factory delivery milestones, service interval progression, and monthly gap verification.',
  },
  {
    href: '/eqp/upload',
    title: 'EQP Care Dispatch',
    status: 'Live',
    tone: 'live',
    color: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20',
    iconColor: 'bg-emerald-600 text-white',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    ),
    description: 'Automate PDF report uploads directly to Komatsu Equipment Care Daily Operation portal.',
  },
  {
    href: '/eqp/reports',
    title: 'PDF Archive',
    status: 'Archived',
    tone: 'archived',
    color: 'from-indigo-500/10 to-indigo-500/5 border-indigo-500/20',
    iconColor: 'bg-indigo-600 text-white',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    ),
    description: 'Review, download batch ZIP archives, rename, and manage all generated maintenance PDFs.',
  },
  {
    href: '/eqp/machines',
    title: 'Machines Register',
    status: 'Active',
    tone: 'active',
    color: 'from-purple-500/10 to-purple-500/5 border-purple-500/20',
    iconColor: 'bg-purple-600 text-white',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    description: 'Real-time machinery database, SMR operating hour meters, engine numbers, and interval steps.',
  },
  {
    href: '/eqp/comments',
    title: 'Comments Pool',
    status: 'Active',
    tone: 'active',
    color: 'from-slate-500/10 to-slate-500/5 border-slate-500/20',
    iconColor: 'bg-slate-700 text-white',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
    ),
    description: 'Customize weighted inspection remarks and commentary pools for HM400, PC400, and D155A.',
  },
];

export default function EqpModulePage() {
  const [machines, setMachines] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState('ALL');
  const [selectedEngineer, setSelectedEngineer] = useState('ALL');
  const [inspectMachine, setInspectMachine] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [machinesRes, reportsRes] = await Promise.all([
          getMachines().catch(() => ({ machines: [] })),
          getReports().catch(() => []),
        ]);
        setMachines(machinesRes.machines || []);
        setReports(reportsRes || []);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const stats = useMemo(() => {
    const totalMachines = machines.length;
    const totalReports = reports.length;
    const avgSmr = totalMachines
      ? Math.round(machines.reduce((acc, m) => acc + Number(m.last_smr || 0), 0) / totalMachines)
      : 0;
    const activeEngineers = new Set(machines.map((m) => m.responsible_engineer).filter(Boolean)).size;

    return { totalMachines, totalReports, avgSmr, activeEngineers };
  }, [machines, reports]);

  const recentReports = useMemo(() => {
    return reports.slice(0, 5);
  }, [reports]);

  return (
    <SystemShell
      activePath="/eqp"
      eyebrow="Komatsu EQP Platform"
      title="Equipment Preventive Maintenance Hub"
      description="Command center for preventive maintenance reporting, lifecycle tracking, fleet health analytics, and automated EQP Care dispatch."
    >
      <div className="space-y-5">
        <EqpNav />

        {/* KPI Header Bar */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="p-3.5 border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Tracked Fleet</span>
              <Badge tone="live" size="sm">Synced</Badge>
            </div>
            <p className="text-xl font-semibold font-mono text-slate-900 mt-1">{loading ? '...' : stats.totalMachines}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Active Heavy Machines</p>
          </Card>

          <Card className="p-3.5 border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Field Engineers</span>
              <Badge tone="info" size="sm">Assigned</Badge>
            </div>
            <p className="text-xl font-semibold font-mono text-slate-900 mt-1">{loading ? '...' : stats.activeEngineers}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Lead Service Engineers</p>
          </Card>

          <Card className="p-3.5 border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Average Fleet SMR</span>
              <Badge tone="ready" size="sm">Optimal</Badge>
            </div>
            <p className="text-xl font-semibold font-mono text-slate-900 mt-1">{loading ? '...' : `${stats.avgSmr} hrs`}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Operating Hour Average</p>
          </Card>

          <Card className="p-3.5 border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Generated Archive</span>
              <Badge tone="neutral" size="sm">Preserved</Badge>
            </div>
            <p className="text-xl font-semibold font-mono text-slate-900 mt-1">{loading ? '...' : stats.totalReports}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Verified PDF Reports</p>
          </Card>
        </section>

        {/* Fleet Distribution & Visual Charts Panel */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Model Distribution & Engineer Splits */}
          <Card className="lg:col-span-2 p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 tracking-tight">Fleet Models & Engineer Allocation</h3>
                <p className="text-[11px] text-slate-500">Breakdown of machine models across field service leads</p>
              </div>
              <Badge tone="neutral" size="sm">{machines.length} Units</Badge>
            </div>

            {loading ? (
              <Skeleton className="h-40 rounded-lg" />
            ) : (
              <div className="space-y-4">
                {/* Fleet Model Breakdown */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Model Family Breakdown</span>
                    <span className="text-[10px] text-slate-400">Click to inspect</span>
                  </div>
                  <FleetModelBarChart
                    machines={machines}
                    selectedModel={selectedModel}
                    onSelectModel={setSelectedModel}
                  />
                </div>

                {/* Engineer Allocation */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Assigned Engineer Fleets</span>
                    <span className="text-[10px] text-slate-400">Coverage</span>
                  </div>
                  <EngineerFleetDonutChart
                    machines={machines}
                    selectedEngineer={selectedEngineer}
                    onSelectEngineer={setSelectedEngineer}
                  />
                </div>
              </div>
            )}
          </Card>

          {/* SMR Health & Quick Action Panel */}
          <Card className="p-4 flex flex-col justify-between space-y-4">
            <div>
              <div className="border-b border-slate-100 pb-2.5 mb-3">
                <h3 className="text-sm font-semibold text-slate-900 tracking-tight">Fleet SMR Hour Distribution</h3>
                <p className="text-[11px] text-slate-500">Service hour ranges across active units</p>
              </div>

              {loading ? (
                <Skeleton className="h-32 rounded-lg" />
              ) : (
                <SmrDistributionChart machines={machines} />
              )}
            </div>

            {/* Fast Report Action Banner */}
            <div className="bg-slate-900 text-white rounded-lg p-3.5 space-y-2.5">
              <div>
                <h4 className="text-xs font-semibold text-white">Batch PM Report Generation</h4>
                <p className="text-[11px] text-slate-400">Generate certified inspection PDFs for your fleet</p>
              </div>
              <Link
                href="/eqp/generate-reports"
                className="block w-full py-1.5 text-center text-xs font-semibold rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-2xs"
              >
                Open Report Builder →
              </Link>
            </div>
          </Card>
        </section>


        {/* EQP Module Tiles */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 tracking-tight">EQP Functional Modules</h3>
              <p className="text-[11px] text-slate-500">Access tools for reporting, lifecycle auditing, and EQP Care syncing</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {modules.map((module) => (
              <Link key={module.title} href={module.href} className="group block">
                <Card className="h-full p-4 border border-slate-200/80 hover:border-slate-300 hover:shadow-2xs transition-all bg-white">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-md ${module.iconColor}`}>
                        {module.icon}
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-900 group-hover:text-amber-700 transition-colors">
                          {module.title}
                        </h4>
                        <Badge tone={module.tone} size="sm">{module.status}</Badge>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-2.5">
                    {module.description}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent Reports Timeline Feed */}

        {recentReports.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Latest Generated Reports</h3>
                <p className="text-xs text-slate-500">Recent inspection documents generated in the system</p>
              </div>
              <Link
                href="/eqp/reports"
                className="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors inline-flex items-center gap-1"
              >
                <span>View All Archive ({reports.length})</span>
                <span>→</span>
              </Link>
            </div>

            <Card className="p-4 overflow-hidden">
              <div className="divide-y divide-slate-100">
                {recentReports.map((report) => (
                  <div
                    key={report.id || report.file_name}
                    className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0 hover:bg-slate-50/80 -mx-4 px-4 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs border border-amber-200">
                        PDF
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {report.file_name || report.report_no}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {report.machine_type} #{report.machine_number} • SMR: {report.smr || '—'} hrs
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] font-mono text-slate-400">
                        {report.created_at ? new Date(report.created_at).toLocaleDateString() : ''}
                      </span>
                      {report.pdf_url && (
                        <a
                          href={report.pdf_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 text-xs font-bold rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                        >
                          View PDF
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </section>
        )}
      </div>

      {/* Machine Timeline Modal */}
      {inspectMachine && (
        <MachineTimelineModal
          machine={inspectMachine}
          onClose={() => setInspectMachine(null)}
        />
      )}
    </SystemShell>
  );
}
