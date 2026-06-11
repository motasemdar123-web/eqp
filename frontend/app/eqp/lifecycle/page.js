'use client';

import { useMemo, useState } from 'react';
import SystemShell from '../../../components/SystemShell';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import EmptyState from '../../../components/ui/EmptyState';
import { EQP_LIFECYCLE_RECORDS, formatLifecycleDate } from '../../../lib/eqpLifecycleData';

export default function EqpLifecyclePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [modelFilter, setModelFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedMachineNumber, setSelectedMachineNumber] = useState(EQP_LIFECYCLE_RECORDS[0]?.machineNumber || '');

  const filteredMachines = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return EQP_LIFECYCLE_RECORDS.filter((machine) => {
      const matchesSearch = !query || machine.machineNumber.includes(query) || machine.model.toLowerCase().includes(query);
      const matchesModel = modelFilter === 'ALL' || machine.model === modelFilter;
      const matchesStatus = statusFilter === 'ALL' || machine.status === statusFilter;

      return matchesSearch && matchesModel && matchesStatus;
    });
  }, [modelFilter, searchTerm, statusFilter]);

  const selectedMachine = useMemo(
    () => EQP_LIFECYCLE_RECORDS.find((machine) => machine.machineNumber === selectedMachineNumber) || filteredMachines[0],
    [filteredMachines, selectedMachineNumber]
  );

  const stats = useMemo(() => {
    const addCycle = EQP_LIFECYCLE_RECORDS.filter((machine) => machine.latestReportCode === 'W41X').length;
    const secondDone = EQP_LIFECYCLE_RECORDS.filter((machine) => machine.latestReportCode === 'W412').length;
    const lifecycleGaps = EQP_LIFECYCLE_RECORDS.filter((machine) => machine.hasLifecycleGap).length;

    return {
      total: EQP_LIFECYCLE_RECORDS.length,
      addCycle,
      secondDone,
      lifecycleGaps,
    };
  }, []);

  return (
    <SystemShell
      activePath="/eqp/lifecycle"
      eyebrow="EQP Module"
      title="Machine Lifecycle"
      description="Factory-to-delivery and service-cycle visibility for each EQP machine."
    >
      <div className="grid gap-6">
        <section className="ds-kpi-grid">
          <Metric label="Machines" value={stats.total} unit="Tracked assets" detail="Imported lifecycle rows" code="LC" status="Live" tone="live" />
          <Metric label="Add Service" value={stats.addCycle} unit="Monthly cycle" detail="Not working or storage follow-up" code="AS" status="Watch" tone="yellow" accent />
          <Metric label="2nd Done" value={stats.secondDone} unit="HM400 group" detail="Waiting for 3rd service plan" code="S2" status="Planned" tone="ready" />
          <Metric label="Gaps" value={stats.lifecycleGaps} unit="Needs review" detail="Missing lifecycle reports" code="GP" status="Review" tone="archived" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
          <Card className="overflow-hidden">
            <div className="border-b border-[var(--color-border)] p-5">
              <div className="grid gap-3 lg:grid-cols-[1.2fr_0.6fr_0.8fr]">
                <input
                  type="text"
                  placeholder="Search machine or model"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="ds-input"
                />
                <select value={modelFilter} onChange={(event) => setModelFilter(event.target.value)} className="ds-input">
                  <option value="ALL">All models</option>
                  <option value="D155A">D155A</option>
                  <option value="HM400">HM400</option>
                </select>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="ds-input">
                  <option value="ALL">All statuses</option>
                  <option value="Monthly add-service cycle">Monthly add-service cycle</option>
                  <option value="Second service completed">Second service completed</option>
                </select>
              </div>
            </div>

            {filteredMachines.length === 0 ? (
              <div className="p-6">
                <EmptyState title="No lifecycle records found" description="Change filters and try again." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="ds-table min-w-[980px]">
                  <thead>
                    <tr>
                      <th className="px-5 py-4 text-left">Machine</th>
                      <th className="px-5 py-4 text-left">Model</th>
                      <th className="px-5 py-4 text-left">Latest</th>
                      <th className="px-5 py-4 text-left">Delivery</th>
                      <th className="px-5 py-4 text-left">3rd Service</th>
                      <th className="px-5 py-4 text-left">Gaps</th>
                      <th className="px-5 py-4 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMachines.map((machine) => (
                      <tr
                        key={machine.machineNumber}
                        className="cursor-pointer border-t border-[var(--color-border)] transition hover:bg-[var(--color-brand-soft)]"
                        onClick={() => setSelectedMachineNumber(machine.machineNumber)}
                      >
                        <td className="px-5 py-4 font-black text-[var(--color-ink)]">{machine.machineNumber}</td>
                        <td className="px-5 py-4 text-[var(--color-ink-soft)]">{machine.model}</td>
                        <td className="px-5 py-4">
                          <div className="font-semibold text-[var(--color-ink-soft)]">{machine.latestReportType}</div>
                          <div className="mt-1 font-mono text-xs text-[var(--color-muted)]">{formatLifecycleDate(machine.latestReportDate)}</div>
                        </td>
                        <td className="px-5 py-4 text-[var(--color-ink-soft)]">{formatLifecycleDate(machine.deliveryDate)}</td>
                        <td className="px-5 py-4 text-[var(--color-ink-soft)]">{formatLifecycleDate(machine.thirdServiceDate)}</td>
                        <td className="px-5 py-4">
                          {machine.hasLifecycleGap ? (
                            <Badge tone="archived">{machine.missingReports.length} missing</Badge>
                          ) : (
                            <Badge tone="ready">Complete</Badge>
                          )}
                        </td>
                        <td className="px-5 py-4"><Badge tone={machine.statusTone}>{machine.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {selectedMachine && (
            <Card className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--color-muted)]">Selected Machine</p>
                  <h2 className="mt-2 text-3xl font-black text-[var(--color-ink)]">{selectedMachine.machineNumber}</h2>
                  <p className="mt-1 text-sm font-bold text-[var(--color-ink-soft)]">{selectedMachine.model}</p>
                </div>
                <Badge tone={selectedMachine.statusTone}>{selectedMachine.latestReportCode}</Badge>
              </div>

              <div className="mt-6 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--color-muted)]">Next Action</p>
                <p className="mt-2 text-sm font-bold leading-6 text-[var(--color-ink)]">{selectedMachine.nextAction}</p>
              </div>

              {selectedMachine.hasLifecycleGap && (
                <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-700">Missing From Lifecycle</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedMachine.missingReports.map((report) => (
                      <Badge key={report} tone="yellow">{report}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 grid gap-3">
                {selectedMachine.milestones.map((milestone) => (
                  <div key={milestone.label} className="grid grid-cols-[1fr_auto] items-center gap-4 rounded-md border border-[var(--color-border)] px-4 py-3">
                    <div>
                      <p className="text-sm font-black text-[var(--color-ink)]">{milestone.label}</p>
                      <p className="mt-1 font-mono text-xs text-[var(--color-muted)]">{milestone.code}</p>
                    </div>
                    <p className="text-sm font-bold text-[var(--color-ink-soft)]">{formatLifecycleDate(milestone.date)}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <MiniMetric label="Add Services" value={selectedMachine.addServiceCount} />
                <MiniMetric label="Latest SMR" value={selectedMachine.latestSmr ?? '-'} />
              </div>
            </Card>
          )}
        </section>
      </div>
    </SystemShell>
  );
}

function Metric({ label, value, unit, detail, code, status, tone = 'neutral', accent = false }) {
  return (
    <article className="ds-kpi-card">
      <div className={`ds-icon-tile ${accent ? 'ds-icon-tile-accent' : ''}`}>{code}</div>
      <div className="ds-kpi-content">
        <div className="ds-kpi-head">
          <p className="ds-kpi-label">{label}</p>
          <Badge tone={tone}>{status}</Badge>
        </div>
        <div>
          <p className="ds-kpi-main">{value}</p>
          <p className="ds-kpi-descriptor">{unit}</p>
          <p className="ds-kpi-secondary">{detail}</p>
        </div>
      </div>
    </article>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-md border border-[var(--color-border)] p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--color-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-black text-[var(--color-ink)]">{value}</p>
    </div>
  );
}
