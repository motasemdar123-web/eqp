'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import SystemShell from '../../components/SystemShell';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { getStoredPlatformSession } from '../../lib/auth';

const modules = [
  { title: 'Technicians Management', href: '/management/technicians', status: 'Live', code: 'TM', description: 'Technician records, shifts, regions, skills, and dispatch availability.' },
  { title: 'Scheduling', href: '/management/scheduling', status: 'Live', code: 'SC', description: 'Daily roster control, work windows, task groups, and technician assignment.' },
  { title: 'EQP Module', href: '/eqp', status: 'Preserved / Live', code: 'EQ', description: 'Preventive maintenance PDFs, machine history, archive control, and report output.' },
];

const kpis = [
  { label: 'Assets / Modules', value: '3', delta: '+ Core', code: 'AM' },
  { label: 'Technicians Management', value: 'Live', delta: 'Ready', code: 'TM', accent: true },
  { label: 'Scheduling', value: 'Live', delta: 'Daily', code: 'SC' },
  { label: 'EQP Module', value: 'Preserved / Live', delta: 'Archive', code: 'EQ', accent: true },
];

const governanceItems = [
  { title: 'RBAC permissions', value: 'Role gated', percent: '88%' },
  { title: 'Audit-ready activities', value: 'Traceable', percent: '76%' },
  { title: 'SLA and escalation readiness', value: 'Prepared', percent: '64%' },
  { title: 'Centralized role routing', value: 'Unified', percent: '92%' },
];

const operations = [
  { label: 'Technicians', value: 'Live', width: '92%' },
  { label: 'Scheduling', value: 'Live', width: '86%' },
  { label: 'EQP Reports', value: 'Preserved', width: '78%' },
];

export default function ManagementDashboardPage() {
  const [session] = useState(() => getStoredPlatformSession());
  const user = session?.user;
  const roleLabel = useMemo(() => user?.roles?.join(', ') || 'Guest view', [user]);

  return (
    <SystemShell
      activePath="/management"
      eyebrow="Dar Al Hai"
      title="Dashboard"
      description="A unified maintenance operations view for technician administration, scheduling, and EQP reporting."
      userLabel={roleLabel}
      actions={!user ? (
        <Link href="/" className="ds-button ds-button-secondary">
          Sign In
        </Link>
      ) : null}
    >
      <section className="grid gap-5">
        <div className="ds-kpi-grid">
          {kpis.map((kpi) => (
            <article key={kpi.label} className="ds-kpi-card">
              <div className={`ds-icon-tile ${kpi.accent ? 'ds-icon-tile-accent' : ''}`}>
                {kpi.code}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-black uppercase tracking-[0.14em] text-[var(--color-muted)]">
                  {kpi.label}
                </p>
                <div className="mt-2 flex flex-wrap items-end gap-2">
                  <p className="text-2xl font-black leading-none text-[var(--color-ink)]">
                    {kpi.value}
                  </p>
                  <span className="ds-stat-pill">{kpi.delta}</span>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="overflow-hidden">
            <div className="grid gap-0 md:grid-cols-[0.86fr_1.14fr]">
              <div className="ds-soft-panel m-4 p-5">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--color-muted)]">
                  Maintenance Flow
                </p>
                <p className="mt-3 text-3xl font-black text-[var(--color-ink)]">3</p>
                <p className="mt-1 text-sm font-bold text-[var(--color-muted)]">
                  Core operational modules
                </p>
                <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                  {operations.map((item) => (
                    <div key={item.label}>
                      <p className="text-lg font-black text-[var(--color-brand)]">{item.value}</p>
                      <p className="mt-1 text-[11px] font-bold text-[var(--color-muted)]">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="ds-panel-title">Operations Distribution</h2>
                  <Badge tone="yellow">Live System</Badge>
                </div>
                <div className="mt-6 grid gap-4">
                  {operations.map((item) => (
                    <div key={item.label}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-bold text-[var(--color-ink-soft)]">{item.label}</span>
                        <span className="font-black text-[var(--color-brand)]">{item.value}</span>
                      </div>
                      <div className="ds-progress-track">
                        <span className="ds-progress-fill" style={{ width: item.width }} />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-5 text-sm font-semibold leading-6 text-[var(--color-muted)]">
                  Management users move through one dashboard while each module keeps its original workflow and route.
                </p>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="grid gap-0 md:grid-cols-[0.95fr_1.05fr]">
              <div className="ds-soft-panel m-4 p-5">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--color-muted)]">
                  Governance Protocols
                </p>
                <p className="mt-4 text-4xl font-black text-[var(--color-brand)]">4</p>
                <p className="mt-1 text-sm font-bold text-[var(--color-muted)]">
                  Enterprise readiness controls
                </p>
                <Link href="/eqp" className="mt-6 inline-flex text-sm font-black text-[var(--color-brand)] hover:text-[var(--color-accent-hover)]">
                  View EQP overview
                </Link>
              </div>

              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="ds-panel-title">Protocol Distribution</h2>
                  <Badge tone="dark">Dar Al Hai</Badge>
                </div>
                <div className="mt-5 grid gap-3">
                  {governanceItems.map((item) => (
                    <div key={item.title} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-md border border-[var(--color-border)] bg-white p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-[var(--color-ink)]">{item.title}</p>
                        <p className="mt-1 text-xs font-bold text-[var(--color-muted)]">{item.value}</p>
                      </div>
                      <span className="text-sm font-black text-[var(--color-accent-hover)]">{item.percent}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {modules.map((module) => (
            <Card key={module.title} className="p-5 transition hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-card)]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="ds-icon-tile h-10 w-10 text-xs">{module.code}</div>
                  <div>
                    <h2 className="text-lg font-black text-[var(--color-ink)]">{module.title}</h2>
                    <p className="mt-1 text-xs font-bold text-[var(--color-muted)]">Module workspace</p>
                  </div>
                </div>
                <Badge tone={module.status === 'Live' ? 'green' : 'yellow'}>{module.status}</Badge>
              </div>
              <p className="mt-4 min-h-20 text-sm font-semibold leading-6 text-[var(--color-muted)]">{module.description}</p>
              <Link href={module.href} className="ds-button ds-button-secondary mt-5">
                Open Module
              </Link>
            </Card>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {governanceItems.slice(0, 3).map((item, index) => (
            <Card key={item.title} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-black text-[var(--color-ink)]">{item.title}</h2>
                  <p className="mt-2 text-sm font-semibold text-[var(--color-muted)]">
                    {index === 0 && 'Permissions and screens stay aligned to user role.'}
                    {index === 1 && 'Operational activity remains ready for review and tracing.'}
                    {index === 2 && 'Escalation handling is prepared for service workflow growth.'}
                  </p>
                </div>
                <div className="ds-ring-meter">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-white text-sm font-black text-[var(--color-brand)]">
                    {item.percent}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="overflow-hidden">
          <div className="grid gap-0 lg:grid-cols-[1fr_0.72fr]">
            <div className="p-6">
              <Badge tone="dark">Enterprise Pattern</Badge>
              <h2 className="mt-4 text-2xl font-black text-[var(--color-ink)]">
                Unified login, role-based routing, and operational governance
              </h2>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-[var(--color-muted)]">
                Users enter through one login screen. The platform routes authorized users into management or EQP reporting according to role and permissions.
              </p>
            </div>
            <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-muted)] p-6 lg:border-l lg:border-t-0">
              <div className="grid gap-3 text-sm">
                {governanceItems.map((item) => (
                  <div key={item.title} className="rounded-md bg-white px-4 py-3 font-bold text-[var(--color-ink-soft)] shadow-sm">
                    {item.title}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </section>
    </SystemShell>
  );
}
