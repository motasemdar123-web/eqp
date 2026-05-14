'use client';

import Link from 'next/link';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const kpis = [
  { label: 'Open Requests', value: '128', tone: 'dark' },
  { label: 'SLA Compliance', value: '94%' },
  { label: 'Open Work Orders', value: '76' },
  { label: 'Low Stock Items', value: '11' },
];

const modules = [
  { title: 'Maintenance Requests', href: '/management/requests', description: 'Request intake, SLA, notes, attachments, and reopen flow.' },
  { title: 'Work Orders', href: '/management/work-orders', description: 'Assignment, labor, materials, closure, and quality controls.' },
  { title: 'Assets', href: '/management/assets', description: 'Asset register, QR readiness, warranty, and maintenance history.' },
  { title: 'Inventory', href: '/management/inventory', description: 'Stock, reorder thresholds, transfers, issue and return logs.' },
  { title: 'Scheduling', href: '/management/scheduling', description: 'Dispatch, shift availability, workload, and escalation readiness.' },
  { title: 'EQP Module', href: '/eqp', description: 'Preventive maintenance Excel reporting and machine history.' },
];

export default function ManagementDashboardPage() {
  return (
    <main className="min-h-screen bg-[#f4f6f3] text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Dar Al HAI</p>
            <h1 className="mt-2 text-3xl font-black text-zinc-950">Maintenance Management System</h1>
            <p className="mt-2 text-sm text-zinc-500">Executive and operations control for maintenance delivery.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/technician/tasks" className="rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
              Technician Portal
            </Link>
            <Link href="/eqp" className="rounded-md bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-yellow-300">
              EQP Module
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8">
        <div className="grid gap-4 md:grid-cols-4">
          {kpis.map((kpi) => (
            <Card key={kpi.label} className={`p-5 ${kpi.tone === 'dark' ? 'border-zinc-900 bg-zinc-950 text-white' : ''}`}>
              <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${kpi.tone === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                {kpi.label}
              </p>
              <p className={`mt-3 text-3xl font-black ${kpi.tone === 'dark' ? 'text-yellow-400' : 'text-zinc-950'}`}>
                {kpi.value}
              </p>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {modules.map((module) => (
            <Card key={module.title} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-xl font-bold text-zinc-950">{module.title}</h2>
                <Badge tone="yellow">Ready</Badge>
              </div>
              <p className="mt-3 min-h-12 text-sm leading-6 text-zinc-600">{module.description}</p>
              <Link href={module.href} className="mt-5 inline-flex rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
                Open
              </Link>
            </Card>
          ))}
        </div>

        <Card className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-zinc-950">Operational Governance</h2>
              <p className="mt-2 text-sm text-zinc-600">Audit trail, approvals, CAPA readiness, escalation policies, and SLA control are modeled in the backend.</p>
            </div>
            <Button>Generate Executive Report</Button>
          </div>
        </Card>
      </section>
    </main>
  );
}
