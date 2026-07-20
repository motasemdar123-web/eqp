'use client';

import { useEffect, useMemo, useState } from 'react';
import SystemShell from '../../../components/SystemShell';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import EmptyState from '../../../components/ui/EmptyState';
import { EQP_LIFECYCLE_RECORDS, formatLifecycleDate, formatLifecycleMonth } from '../../../lib/eqpLifecycleData';

const DISMISSED_MONTHLY_GAPS_KEY = 'eqp.dismissedMonthlyGaps';

export default function EqpLifecyclePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [modelFilter, setModelFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedMachineNumber, setSelectedMachineNumber] = useState(EQP_LIFECYCLE_RECORDS[0]?.machineNumber || '');
  const [dismissedGapKeys, setDismissedGapKeys] = useState([]);
  const [monthlyListOpen, setMonthlyListOpen] = useState(false);
  const [dismissedListOpen, setDismissedListOpen] = useState(false);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      try {
        const storedKeys = JSON.parse(window.localStorage.getItem(DISMISSED_MONTHLY_GAPS_KEY) || '[]');
        setDismissedGapKeys(Array.isArray(storedKeys) ? storedKeys : []);
      } catch {
        setDismissedGapKeys([]);
      }
    }, 0);

    return () => window.clearTimeout(timerId);
  }, []);

  const dismissedGapKeySet = useMemo(() => new Set(dismissedGapKeys), [dismissedGapKeys]);

  const machines = useMemo(() => {
    return EQP_LIFECYCLE_RECORDS.map((machine) => {
      const activeMonthlyGaps = machine.monthlyGaps.filter((gap) => !dismissedGapKeySet.has(getMonthlyGapKey(machine.machineNumber, gap)));
      const dismissedMonthlyGaps = machine.monthlyGaps.filter((gap) => dismissedGapKeySet.has(getMonthlyGapKey(machine.machineNumber, gap)));
      const hasMonthlyGap = activeMonthlyGaps.length > 0;

      return {
        ...machine,
        activeMonthlyGaps,
        dismissedMonthlyGaps,
        hasMonthlyGap,
        hasLifecycleGap: machine.missingReports.length > 0 || hasMonthlyGap,
        status: hasMonthlyGap ? 'Monthly follow-up missing' : 'Monthly follow-up current',
        statusTone: hasMonthlyGap ? 'archived' : 'ready',
        nextAction: buildNextAction(machine.missingReports, activeMonthlyGaps),
      };
    });
  }, [dismissedGapKeySet]);

  const persistDismissedKeys = (keys) => {
    setDismissedGapKeys(keys);
    window.localStorage.setItem(DISMISSED_MONTHLY_GAPS_KEY, JSON.stringify(keys));
  };

  const handleDismissMonthlyGap = (machineNumber, gap) => {
    const key = getMonthlyGapKey(machineNumber, gap);
    if (dismissedGapKeySet.has(key)) return;
    persistDismissedKeys([...dismissedGapKeys, key]);
  };

  const handleRestoreMonthlyGap = (machineNumber, gap) => {
    const key = getMonthlyGapKey(machineNumber, gap);
    persistDismissedKeys(dismissedGapKeys.filter((dismissedKey) => dismissedKey !== key));
  };

  const filteredMachines = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return machines.filter((machine) => {
      const matchesSearch = !query || machine.machineNumber.includes(query) || machine.model.toLowerCase().includes(query);
      const matchesModel = modelFilter === 'ALL' || machine.model === modelFilter;
      const matchesStatus = statusFilter === 'ALL' || machine.status === statusFilter;

      return matchesSearch && matchesModel && matchesStatus;
    });
  }, [machines, modelFilter, searchTerm, statusFilter]);

  const selectedMachine = useMemo(
    () => machines.find((machine) => machine.machineNumber === selectedMachineNumber) || filteredMachines[0],
    [filteredMachines, machines, selectedMachineNumber]
  );

  const stats = useMemo(() => {
    const addCycle = machines.filter((machine) => machine.workingStatus === 'not_working').length;
    const secondDone = machines.filter((machine) => machine.latestReportCode === 'W412').length;
    const monthlyGaps = machines.reduce((total, machine) => total + machine.activeMonthlyGaps.length, 0);
    const dismissedMonthlyGaps = machines.reduce((total, machine) => total + machine.dismissedMonthlyGaps.length, 0);

    return {
      total: machines.length,
      addCycle,
      secondDone,
      monthlyGaps,
      dismissedMonthlyGaps,
    };
  }, [machines]);

  const modelOptions = useMemo(() => {
    return [...new Set(machines.map((machine) => machine.model))].sort();
  }, [machines]);

  const selectedTimelineItems = useMemo(() => {
    if (!selectedMachine) return [];
    return buildTimelineItems(selectedMachine);
  }, [selectedMachine]);

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
          <Metric label="Not Working" value={stats.addCycle} unit="Monthly cycle" detail="Storage or add-service follow-up" code="NW" status="Watch" tone="yellow" accent />
          <Metric label="2nd Done" value={stats.secondDone} unit="HM400 group" detail="Waiting for 3rd service plan" code="S2" status="Planned" tone="ready" />
          <Metric label="Monthly Gaps" value={stats.monthlyGaps} unit="Active months" detail={`${stats.dismissedMonthlyGaps} dismissed as overlap/skip`} code="MG" status="Review" tone="archived" />
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
                  {modelOptions.map((model) => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="ds-input">
                  <option value="ALL">All statuses</option>
                  <option value="Monthly follow-up missing">Monthly follow-up missing</option>
                  <option value="Monthly follow-up current">Monthly follow-up current</option>
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
                      <th className="px-5 py-4 text-left">Lifecycle</th>
                      <th className="px-5 py-4 text-left">Monthly</th>
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
                          {machine.missingReports.length > 0 ? (
                            <Badge tone="archived">{machine.missingReports.length} missing</Badge>
                          ) : (
                            <Badge tone="ready">Complete</Badge>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {machine.hasMonthlyGap ? (
                            <Badge tone="yellow">{machine.activeMonthlyGaps.length} months</Badge>
                          ) : (
                            <Badge tone="ready">Current</Badge>
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

              {selectedMachine.missingReports.length > 0 && (
                <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-700">Missing From Lifecycle</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedMachine.missingReports.map((report) => (
                      <Badge key={report} tone="yellow">{report}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedMachine.hasMonthlyGap && (
                <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4">
                  <button
                    type="button"
                    onClick={() => setMonthlyListOpen((isOpen) => !isOpen)}
                    className="grid w-full grid-cols-[1fr_auto] items-center gap-3 text-left"
                  >
                    <span className="text-xs font-black uppercase tracking-[0.14em] text-amber-700">Missing Monthly Reports</span>
                    <span className="rounded-md border border-amber-300 bg-white px-2 py-1 text-xs font-black text-amber-800">
                      {selectedMachine.activeMonthlyGaps.length} {monthlyListOpen ? 'Hide' : 'Show'}
                    </span>
                  </button>
                  {monthlyListOpen && (
                    <div className="mt-3 grid gap-2">
                      {selectedMachine.activeMonthlyGaps.map((gap) => (
                        <div key={`${gap.code}-${gap.month}`} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-md bg-white px-3 py-2 text-sm">
                          <span className="font-bold text-[var(--color-ink)]">{gap.type}</span>
                          <span className="font-mono text-xs font-black text-amber-700">{gap.code} - {formatLifecycleMonth(gap.month)}</span>
                          <button
                            type="button"
                            onClick={() => handleDismissMonthlyGap(selectedMachine.machineNumber, gap)}
                            className="rounded-md border border-amber-300 px-2 py-1 text-xs font-black text-amber-800 transition hover:bg-amber-100"
                          >
                            Dismiss
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {selectedMachine.dismissedMonthlyGaps.length > 0 && (
                <div className="mt-4 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
                  <button
                    type="button"
                    onClick={() => setDismissedListOpen((isOpen) => !isOpen)}
                    className="grid w-full grid-cols-[1fr_auto] items-center gap-3 text-left"
                  >
                    <span className="text-xs font-black uppercase tracking-[0.14em] text-[var(--color-muted)]">Dismissed Monthly Reports</span>
                    <span className="rounded-md border border-[var(--color-border)] bg-white px-2 py-1 text-xs font-black text-[var(--color-ink-soft)]">
                      {selectedMachine.dismissedMonthlyGaps.length} {dismissedListOpen ? 'Hide' : 'Show'}
                    </span>
                  </button>
                  {dismissedListOpen && (
                    <div className="mt-3 grid gap-2">
                      {selectedMachine.dismissedMonthlyGaps.map((gap) => (
                        <div key={`${gap.code}-${gap.month}`} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-md bg-white px-3 py-2 text-sm">
                          <span className="font-bold text-[var(--color-ink-soft)]">{gap.type}</span>
                          <span className="font-mono text-xs font-black text-[var(--color-muted)]">{gap.code} - {formatLifecycleMonth(gap.month)}</span>
                          <button
                            type="button"
                            onClick={() => handleRestoreMonthlyGap(selectedMachine.machineNumber, gap)}
                            className="rounded-md border border-[var(--color-border)] px-2 py-1 text-xs font-black text-[var(--color-ink-soft)] transition hover:bg-[var(--color-brand-soft)]"
                          >
                            Restore
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {selectedTimelineItems.map((milestone) => (
                  <div key={milestone.id} className="grid grid-cols-[1fr_auto] items-center gap-4 rounded-md border border-[var(--color-border)] px-4 py-3">
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
                <MiniMetric label="Storage Gaps" value={selectedMachine.activeMonthlyGaps.filter((gap) => gap.code === 'W30').length} />
                <MiniMetric label="Add. Gaps" value={selectedMachine.activeMonthlyGaps.filter((gap) => gap.code === 'W41X').length} />
              </div>
            </Card>
          )}
        </section>
      </div>
    </SystemShell>
  );
}

function getMonthlyGapKey(machineNumber, gap) {
  return `${machineNumber}:${gap.code}:${gap.month}`;
}

function buildNextAction(missingReports, monthlyGaps) {
  if (missingReports.length && monthlyGaps.length) {
    return `Create the missing lifecycle report(s), then close ${monthlyGaps.length} monthly storage/add-service gap(s).`;
  }

  if (monthlyGaps.length) {
    const nextGap = monthlyGaps[0];
    return `Create ${nextGap.code} for ${formatLifecycleMonth(nextGap.month)} or dismiss it if it was intentionally skipped/covered by overlap.`;
  }

  if (missingReports.length) {
    return `Create the missing lifecycle report(s): ${missingReports.join(', ')}.`;
  }

  return 'Monthly tracking is current after active and dismissed storage/add-service months.';
}

function buildTimelineItems(machine) {
  const mainItems = machine.milestones.map((milestone) => ({
    ...milestone,
    id: `main-${milestone.code}`,
    sortDate: milestone.date || '9999-12-31',
  }));
  const monthlyItems = machine.observedReports
    .filter(([code]) => ['W30', 'W41X'].includes(code))
    .map(([code, date], index) => ({
      id: `monthly-${code}-${date}-${index}`,
      label: code === 'W30' ? 'Storage Operation' : 'Add. Service',
      code,
      date,
      sortDate: date,
    }));

  return [...mainItems, ...monthlyItems].sort((left, right) => left.sortDate.localeCompare(right.sortDate));
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
