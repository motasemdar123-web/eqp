'use client';

import Link from 'next/link';
import SystemShell from '../../components/SystemShell';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

const modules = [
  { href: '/eqp/generate-reports', title: 'Report Builder', code: 'RB', status: 'Ready', tone: 'ready', description: 'Generate finalized preventive maintenance PDFs from the EQP templates.' },
  { href: '/eqp/reports', title: 'PDF Archive', code: 'PA', status: 'Archived', tone: 'archived', description: 'Review, download, rename, and remove generated maintenance PDFs.' },
  { href: '/eqp/machines', title: 'Machines', code: 'MA', status: 'Active', tone: 'active', description: 'Monitor machine counters, SMR state, engine numbers, and report readiness.' },
];

const controls = [
  { label: 'Output Format', value: 'PDF', code: 'PDF', status: 'Preserved' },
  { label: 'Access', value: 'Engineers', code: 'AC', status: 'RBAC' },
  { label: 'Storage', value: 'Supabase', code: 'ST', status: 'Live' },
  { label: 'Numbering', value: 'Preserved', code: 'NO', status: 'Ready' },
];

const workflow = ['Select machines', 'Populate EQP workbook', 'Export final PDF', 'Store and archive'];

export default function EqpModulePage() {
  return (
    <SystemShell
      activePath="/eqp"
      eyebrow="EQP Module"
      title="Equipment Preventive Maintenance"
      description="The EQP workflow is part of the main maintenance platform, with engineer moderation and PDF report output."
    >
      <div className="ds-dashboard-grid">
        <section className="ds-kpi-grid">
          {controls.map((item, index) => (
            <article key={item.label} className="ds-kpi-card">
              <div className={`ds-icon-tile ${index % 2 ? 'ds-icon-tile-accent' : ''}`}>{item.code}</div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--color-muted)]">{item.label}</p>
                <p className="mt-3 text-2xl font-black text-[var(--color-ink)]">{item.value}</p>
                <div className="mt-2"><Badge tone={index === 0 ? 'preserved' : 'ready'}>{item.status}</Badge></div>
              </div>
            </article>
          ))}
        </section>

        <section className="ds-module-grid">
          {modules.map((module) => (
            <Card key={module.title} className="ds-card-hover ds-module-card">
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="ds-icon-tile">{module.code}</div>
                    <div>
                      <h2 className="text-xl font-black text-[var(--color-ink)]">{module.title}</h2>
                      <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-muted)]">EQP workspace</p>
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
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_0.7fr]">
          <Card className="p-6">
            <Badge tone="dark">Integrated Module</Badge>
            <h2 className="mt-4 text-2xl font-black text-[var(--color-ink)]">Same platform, same controls</h2>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-[var(--color-muted)]">
              EQP uses the shared Dar Al Hai navigation, role model, visual system, and archive conventions while keeping the existing machine counters and report history compatible.
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--color-muted)]">Primary Workflow</p>
            <div className="mt-5 grid gap-3">
              {workflow.map((step, index) => (
                <div key={step} className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-black text-[var(--color-ink-soft)]">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--color-brand-soft)] text-xs font-black text-[var(--color-brand)]">{index + 1}</span>
                  {step}
                </div>
              ))}
            </div>
          </Card>
        </section>
      </div>
    </SystemShell>
  );
}
