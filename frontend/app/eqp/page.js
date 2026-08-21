'use client';

import Link from 'next/link';
import SystemShell from '../../components/SystemShell';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

const modules = [
  {
    href: '/eqp/generate-reports',
    title: 'Report Builder',
    status: 'Ready',
    tone: 'ready',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    description: 'Generate finalized preventive maintenance PDFs directly from standardized EQP templates.',
  },
  {
    href: '/eqp/lifecycle',
    title: 'Lifecycle View',
    status: 'Live',
    tone: 'live',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    description: 'Review each machine stage, delivery milestones, service cycles, and monthly gap follow-ups.',
  },
  {
    href: '/eqp/reports',
    title: 'PDF Archive',
    status: 'Archived',
    tone: 'archived',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    ),
    description: 'Review, download in batch ZIP, rename, and manage all generated maintenance PDFs.',
  },
  {
    href: '/eqp/machines',
    title: 'Machines Register',
    status: 'Active',
    tone: 'active',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    description: 'Monitor machine counters, SMR progression, engine serials, and report readiness.',
  },
];

const controls = [
  { label: 'Format', value: 'PDF', unit: 'Final Reports', detail: 'Signed EQP output', tone: 'preserved', status: 'Preserved' },
  { label: 'Access', value: 'Engineers', unit: 'RBAC Scoped', detail: 'Certified workflow', tone: 'ready', status: 'Ready' },
  { label: 'Storage', value: 'Supabase', unit: 'Archive Bucket', detail: 'Cloud document store', tone: 'live', status: 'Live', accent: true },
  { label: 'Sequence', value: 'Automatic', unit: 'Report Numbers', detail: 'Sequential indexing', tone: 'ready', status: 'Active' },
];

const workflow = ['Select target machines from fleet', 'Configure service type & dates', 'Generate certified PDF reports', 'Archive & export to client'];

export default function EqpModulePage() {
  return (
    <SystemShell
      activePath="/eqp"
      eyebrow="EQP Module"
      title="Equipment Preventive Maintenance"
      description="The EQP workflow is integrated with the main maintenance platform, providing engineer moderation, machine history, and certified PDF generation."
    >
      <div className="space-y-6">
        {/* KPI Metrics */}
        <section className="ds-kpi-grid">
          {controls.map((item) => (
            <article key={item.label} className="ds-kpi-card">
              <div className={`ds-icon-tile ${item.accent ? 'ds-icon-tile-accent' : ''}`}>
                <span className="font-mono text-xs font-bold">{item.value.slice(0, 3).toUpperCase()}</span>
              </div>
              <div className="ds-kpi-content">
                <div className="ds-kpi-head">
                  <p className="ds-kpi-label">{item.label}</p>
                  <Badge tone={item.tone}>{item.status}</Badge>
                </div>
                <div>
                  <p className="ds-kpi-main ds-kpi-main-compact">{item.value}</p>
                  <p className="ds-kpi-descriptor">{item.unit}</p>
                  <p className="ds-kpi-secondary mt-0.5">{item.detail}</p>
                </div>
              </div>
            </article>
          ))}
        </section>

        {/* Module Cards Grid */}
        <section className="ds-module-grid">
          {modules.map((module) => (
            <Card key={module.title} className="ds-card-hover ds-module-card">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="ds-icon-tile">{module.icon}</div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">{module.title}</h2>
                      <p className="text-xs text-slate-500 font-medium">EQP Workspace</p>
                    </div>
                  </div>
                  <Badge tone={module.tone}>{module.status}</Badge>
                </div>
                <p className="mt-4 text-xs text-slate-600 leading-relaxed">{module.description}</p>
              </div>
              <Link href={module.href} className="ds-button ds-button-secondary mt-5 w-full">
                Open Workspace
              </Link>
            </Card>
          ))}
        </section>

        {/* Workflow Guide & Integration Notice */}
        <section className="grid gap-6 lg:grid-cols-[1fr_400px]">
          <Card className="p-6">
            <Badge tone="info">Integrated Architecture</Badge>
            <h2 className="mt-3 text-xl font-bold text-slate-900">Unified Fleet Management & EQP Compliance</h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              EQP operates under the shared Dar Al Hai role permissions, data layer, and visual system. Machine counters, SMR steps, and certified PDF templates work seamlessly together without external export steps.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Automatic SMR Progression
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Digital Signature Validation
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Batch ZIP Generation
              </span>
            </div>
          </Card>

          <Card className="p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Standard EQP Workflow</p>
            <div className="mt-4 space-y-2.5">
              {workflow.map((step, index) => (
                <div key={step} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-semibold text-slate-800">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[0.6875rem] font-bold text-white shrink-0">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </div>
    </SystemShell>
  );
}
