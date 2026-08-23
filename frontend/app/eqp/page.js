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
    href: '/eqp/upload',
    title: 'EQP Care Dispatch',
    status: 'Live',
    tone: 'live',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    ),
    description: 'Automate machine report uploads directly to the Komatsu Equipment Care Daily Operation (E0295/E0904) portal.',
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

export default function EqpModulePage() {
  return (
    <SystemShell
      activePath="/eqp"
      eyebrow="EQP Module"
      title="Equipment Preventive Maintenance"
      description="The EQP workflow is integrated with the main maintenance platform, providing engineer moderation, machine history, and certified PDF generation."
    >
      <div className="space-y-6">
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
      </div>
    </SystemShell>
  );
}
