'use client';

import Link from 'next/link';
import SystemShell from '../../components/SystemShell';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

const modules = [
  { href: '/eqp/generate-reports', title: 'Report Builder', metric: 'PDF', description: 'Generate finalized preventive maintenance PDFs from the EQP templates.' },
  { href: '/eqp/reports', title: 'PDF Archive', metric: 'Archive', description: 'Review, download, rename, and remove generated maintenance PDFs.' },
  { href: '/eqp/machines', title: 'Machines', metric: 'Fleet', description: 'Monitor machine counters, SMR state, engine numbers, and report readiness.' },
];

const controls = [
  ['Output Format', 'PDF'],
  ['Access', 'Engineers'],
  ['Storage', 'Supabase'],
  ['Numbering', 'Preserved'],
];

export default function EqpModulePage() {
  return (
    <SystemShell
      activePath="/eqp"
      eyebrow="EQP Module"
      title="Equipment Preventive Maintenance"
      description="The EQP workflow is part of the main maintenance platform, with engineer moderation and PDF report output."
    >
      <div className="grid gap-6">
        <section className="grid gap-4 md:grid-cols-4">
          {controls.map(([label, value], index) => (
            <Card key={label} className={`p-5 ${index === 0 ? 'border-zinc-900 bg-zinc-950 text-white' : ''}`}>
              <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${index === 0 ? 'text-zinc-400' : 'text-zinc-500'}`}>
                {label}
              </p>
              <p className={`mt-3 text-2xl font-black ${index === 0 ? 'text-yellow-400' : 'text-zinc-950'}`}>
                {value}
              </p>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {modules.map((module) => (
            <Card key={module.title} className="p-5 transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl font-bold text-zinc-950">{module.title}</h2>
                <Badge tone="yellow">{module.metric}</Badge>
              </div>
              <p className="mt-3 min-h-16 text-sm leading-6 text-zinc-600">{module.description}</p>
              <Link href={module.href} className="mt-5 inline-flex rounded-md bg-yellow-400 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-yellow-300">
                Open
              </Link>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_0.65fr]">
          <Card className="p-6">
            <Badge tone="dark">Integrated Module</Badge>
            <h2 className="mt-4 text-2xl font-black text-zinc-950">Same platform, same controls</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600">
              EQP now uses the shared Dar Al HAI navigation, role model, visual system, and archive conventions while keeping the existing machine counters and report history compatible.
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Primary workflow</p>
            <div className="mt-4 grid gap-3">
              {['Select machines', 'Populate EQP workbook', 'Export final PDF', 'Store and archive'].map((step) => (
                <div key={step} className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-700">
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
