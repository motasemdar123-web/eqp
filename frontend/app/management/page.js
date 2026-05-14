'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { clearStoredUser, getStoredPlatformSession } from '../../lib/auth';

const modules = [
  { title: 'Engineer Approvals', href: '/engineer', status: 'Live', description: 'Review technician completion evidence, approve finished jobs, or return work for correction.' },
  { title: 'Scheduling', href: '/management/scheduling', status: 'Live', description: 'Daily roster, shifts, dispatch board, and multi-technician job cards.' },
  { title: 'Maintenance Requests', href: '/management/requests', status: 'Ready', description: 'Request intake, SLA, notes, attachments, reopen and lifecycle control.' },
  { title: 'Work Orders', href: '/management/work-orders', status: 'Ready', description: 'Assignment, labor, materials, closure controls, and team execution.' },
  { title: 'Assets', href: '/management/assets', status: 'Ready', description: 'Asset register, QR readiness, warranty, history, and cost accumulation.' },
  { title: 'Inventory', href: '/management/inventory', status: 'Ready', description: 'Stock, reorder thresholds, issue, return, transfer, supplier and cost tracking.' },
  { title: 'EQP Module', href: '/eqp', status: 'Preserved', description: 'Preventive maintenance Excel reports, archive, machine history, and storage.' },
];

const kpis = [
  { label: 'Open Requests', value: '128', tone: 'dark' },
  { label: 'SLA Compliance', value: '94%' },
  { label: 'Active Technicians', value: '9' },
  { label: 'Job Cards Today', value: '3' },
];

export default function ManagementDashboardPage() {
  const [session] = useState(() => getStoredPlatformSession());
  const user = session?.user;
  const roleLabel = useMemo(() => user?.roles?.join(', ') || 'Guest view', [user]);

  function logout() {
    clearStoredUser();
    window.location.href = '/';
  }

  return (
    <main className="min-h-screen bg-[#edf1ea] text-zinc-900">
      <header className="border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Dar Al HAI</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950 md:text-4xl">Maintenance Command Center</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
              A unified operations workspace for requests, scheduling, assets, inventory, work orders, and EQP reporting.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm text-zinc-700">
              <span className="font-semibold">{user?.fullName || 'Not signed in'}</span>
              <span className="block text-xs text-zinc-500">{roleLabel}</span>
            </div>
            {user ? (
              <Button variant="ghost" onClick={logout}>Logout</Button>
            ) : (
              <Link href="/" className="rounded-md bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-yellow-300">
                Sign In
              </Link>
            )}
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
            <Card key={module.title} className="p-5 transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-xl font-bold text-zinc-950">{module.title}</h2>
                <Badge tone={module.status === 'Live' ? 'green' : 'yellow'}>{module.status}</Badge>
              </div>
              <p className="mt-3 min-h-16 text-sm leading-6 text-zinc-600">{module.description}</p>
              <Link href={module.href} className="mt-5 inline-flex rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
                Open Module
              </Link>
            </Card>
          ))}
        </div>

        <Card className="overflow-hidden">
          <div className="grid gap-0 lg:grid-cols-[1fr_0.7fr]">
            <div className="p-6">
              <Badge tone="dark">Enterprise Pattern</Badge>
              <h2 className="mt-4 text-2xl font-black text-zinc-950">Unified login, role-based routing, and operational governance</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600">
                Users enter through one login screen. The platform routes authorized users into the management workspace or EQP reporting module according to role and permissions.
              </p>
            </div>
            <div className="border-t border-zinc-100 bg-zinc-50 p-6 lg:border-l lg:border-t-0">
              <div className="grid gap-3 text-sm">
                {['RBAC permissions', 'Audit-ready activities', 'SLA and escalation readiness', 'Centralized role routing'].map((item) => (
                  <div key={item} className="rounded-md bg-white px-4 py-3 font-semibold text-zinc-700 shadow-sm">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}
