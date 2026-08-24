'use client';

import { useEffect, useMemo, useState } from 'react';
import SystemShell from '../../../components/SystemShell';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import EmptyState from '../../../components/ui/EmptyState';
import { getMachines, getReports } from '../../../lib/api';
import { getStoredPlatformSession, getStoredUser, getMatchingEngineerName } from '../../../lib/auth';
import {
  buildDynamicLifecycleRecords,
  formatLifecycleDate,
  formatLifecycleMonth,
} from '../../../lib/eqpLifecycleData';

const DISMISSED_MONTHLY_GAPS_KEY = 'eqp.dismissedMonthlyGaps';

export default function EqpLifecyclePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [modelFilter, setModelFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [filterEngineer, setFilterEngineer] = useState('ALL');
  const [selectedMachineNumber, setSelectedMachineNumber] = useState('');
  const [dismissedGapKeys, setDismissedGapKeys] = useState([]);
  const [monthlyListOpen, setMonthlyListOpen] = useState(false);
  const [dismissedListOpen, setDismissedListOpen] = useState(false);
  const [generatedReports, setGeneratedReports] = useState([]);
  const [machinesList, setMachinesList] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      try {
        const storedKeys = JSON.parse(window.localStorage.getItem(DISMISSED_MONTHLY_GAPS_KEY) || '[]');
        setDismissedGapKeys(Array.isArray(storedKeys) ? storedKeys : []);
      } catch {
        setDismissedGapKeys([]);
      }
    }, 0);

    loadReportsData();

    return () => window.clearTimeout(timerId);
  }, []);

  async function loadReportsData() {
    try {
      setLoadingReports(true);
      const [reportsRes, machinesRes] = await Promise.all([
        getReports().catch(() => []),
        getMachines().catch(() => ({ machines: [] })),
      ]);
      setGeneratedReports(reportsRes || []);
      const mList = machinesRes?.machines || [];
      setMachinesList(mList);

      const session = getStoredPlatformSession();
      const user = getStoredUser();
      const currentUser = session?.user || user;
      const engList = [...new Set(mList.map((m) => m.responsible_engineer).filter(Boolean))];
      const matched = getMatchingEngineerName(currentUser, engList);
      if (matched !== 'ALL') {
        setFilterEngineer((prev) => (prev === 'ALL' ? matched : prev));
      }
    } catch {
      // Non-fatal, baseline will be used
    } finally {
      setLoadingReports(false);
    }
  }

  const dismissedGapKeySet = useMemo(() => new Set(dismissedGapKeys), [dismissedGapKeys]);

  const dynamicRecords = useMemo(() => {
    return buildDynamicLifecycleRecords(generatedReports, machinesList);
  }, [generatedReports, machinesList]);

  const machines = useMemo(() => {
    return dynamicRecords.map((machine) => {
      const activeMonthlyGaps = machine.monthlyGaps.filter((gap) => !dismissedGapKeySet.has(getMonthlyGapKey(machine.machineNumber, gap)));
      const dismissedMonthlyGaps = machine.monthlyGaps.filter((gap) => dismissedGapKeySet.has(getMonthlyGapKey(machine.machineNumber, gap)));
      const hasMonthlyGap = activeMonthlyGaps.length > 0;

      return {
        ...machine,
        activeMonthlyGaps,
        dismissedMonthlyGaps,
        hasMonthlyGap,
        hasLifecycleGap: machine.missingReports.length > 0 || hasMonthlyGap,
        status: hasMonthlyGap ? 'Follow-up Required' : 'Lifecycle Current',
        statusTone: hasMonthlyGap ? 'warning' : 'ready',
        nextAction: buildNextAction(machine.missingReports, activeMonthlyGaps),
      };
    });
  }, [dynamicRecords, dismissedGapKeySet]);

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

  const engineerOptions = useMemo(() => {
    return [...new Set(machines.map((machine) => machine.responsibleEngineer).filter(Boolean))].sort();
  }, [machines]);

  const filteredMachines = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return machines.filter((machine) => {
      const matchesSearch = !query || machine.machineNumber.includes(query) || machine.model.toLowerCase().includes(query);
      const matchesModel = modelFilter === 'ALL' || machine.model === modelFilter;
      const matchesEngineer = filterEngineer === 'ALL' || machine.responsibleEngineer === filterEngineer;
      const matchesStatus = statusFilter === 'ALL' || machine.status === statusFilter;

      return matchesSearch && matchesModel && matchesEngineer && matchesStatus;
    });
  }, [machines, modelFilter, filterEngineer, searchTerm, statusFilter]);

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
      title="Machine Lifecycle Tracker"
      description="Factory delivery milestones, service interval progression, and monthly gap verification for each EQP asset."
      actions={
        <div className="flex items-center gap-2">
          <Badge tone={generatedReports.length > 0 ? 'ready' : 'neutral'}>
            {loadingReports ? 'Syncing...' : `⚡ ${generatedReports.length} Generated Reports Synced`}
          </Badge>
          <button
            type="button"
            onClick={loadReportsData}
            disabled={loadingReports}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          >
            {loadingReports ? 'Refreshing...' : '🔄 Refresh Lifecycle'}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* KPI Metrics */}
        <section className="ds-kpi-grid">
          <article className="ds-kpi-card">
            <div className="ds-icon-tile">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="ds-kpi-content">
              <div className="ds-kpi-head">
                <p className="ds-kpi-label">Tracked Fleet</p>
                <Badge tone="live">Live</Badge>
              </div>
              <p className="ds-kpi-main">{stats.total}</p>
              <p className="ds-kpi-descriptor">Lifecycle Units</p>
            </div>
          </article>

          <article className="ds-kpi-card">
            <div className="ds-icon-tile ds-icon-tile-accent">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ds-kpi-content">
              <div className="ds-kpi-head">
                <p className="ds-kpi-label">Not Working</p>
                <Badge tone="warning">Storage</Badge>
              </div>
              <p className="ds-kpi-main">{stats.addCycle}</p>
              <p className="ds-kpi-descriptor">Cycle Follow-up</p>
            </div>
          </article>

          <article className="ds-kpi-card">
            <div className="ds-icon-tile">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ds-kpi-content">
              <div className="ds-kpi-head">
                <p className="ds-kpi-label">2nd Service Done</p>
                <Badge tone="ready">Ready</Badge>
              </div>
              <p className="ds-kpi-main">{stats.secondDone}</p>
              <p className="ds-kpi-descriptor">Awaiting 3rd Run</p>
            </div>
          </article>

          <article className="ds-kpi-card">
            <div className="ds-icon-tile ds-icon-tile-accent">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ds-kpi-content">
              <div className="ds-kpi-head">
                <p className="ds-kpi-label">Monthly Gaps</p>
                <Badge tone={stats.monthlyGaps > 0 ? 'warning' : 'ready'}>
                  {stats.monthlyGaps > 0 ? 'Review' : 'Clear'}
                </Badge>
              </div>
              <p className="ds-kpi-main">{stats.monthlyGaps}</p>
              <p className="ds-kpi-descriptor">{stats.dismissedMonthlyGaps} Dismissed</p>
            </div>
          </article>
        </section>

        {/* Main Grid: Machine List & Detail Timeline Card */}
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(380px,0.8fr)]">
          {/* Table Card */}
          <Card className="overflow-hidden">
            <div className="border-b border-slate-200 p-5 bg-slate-50/60">
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                <input
                  type="text"
                  placeholder="Search machine ID or model..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="ds-input"
                />
                <select
                  value={filterEngineer}
                  onChange={(event) => setFilterEngineer(event.target.value)}
                  className="ds-input"
                >
                  <option value="ALL">All Engineers</option>
                  {engineerOptions.map((eng) => (
                    <option key={eng} value={eng}>{eng}</option>
                  ))}
                </select>
                <select value={modelFilter} onChange={(event) => setModelFilter(event.target.value)} className="ds-input">
                  <option value="ALL">All Models</option>
                  {modelOptions.map((model) => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="ds-input">
                  <option value="ALL">All Statuses</option>
                  <option value="Follow-up Required">Follow-up Required</option>
                  <option value="Lifecycle Current">Lifecycle Current</option>
                </select>
              </div>
            </div>

            {filteredMachines.length === 0 ? (
              <div className="p-8">
                <EmptyState title="No lifecycle records found" description="Adjust your filters to see machine assets." />
              </div>
            ) : (
              <div className="ds-table-wrap">
                <table className="ds-table">
                  <thead>
                    <tr>
                      <th>Machine</th>
                      <th>Model</th>
                      <th>Latest Run</th>
                      <th>Delivery</th>
                      <th>3rd Service</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMachines.map((machine) => {
                      const isSelected = selectedMachine?.machineNumber === machine.machineNumber;
                      return (
                        <tr
                          key={machine.machineNumber}
                          className={`cursor-pointer ${isSelected ? '!bg-amber-50/60 font-semibold' : ''}`}
                          onClick={() => setSelectedMachineNumber(machine.machineNumber)}
                        >
                          <td className="font-bold text-slate-900">{machine.machineNumber}</td>
                          <td className="text-slate-700">{machine.model}</td>
                          <td>
                            <span className="font-semibold text-slate-800">{machine.latestReportType}</span>
                            <span className="block text-[0.6875rem] font-mono text-slate-400">{formatLifecycleDate(machine.latestReportDate)}</span>
                          </td>
                          <td className="text-xs text-slate-600">{formatLifecycleDate(machine.deliveryDate)}</td>
                          <td className="text-xs text-slate-600">{formatLifecycleDate(machine.thirdServiceDate)}</td>
                          <td>
                            <Badge tone={machine.statusTone}>{machine.status}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Selected Machine Detail Card */}
          {selectedMachine && (
            <Card className="p-6 h-fit space-y-5">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Selected Machine</p>
                  <h2 className="mt-1 text-2xl font-bold text-slate-900">{selectedMachine.machineNumber}</h2>
                  <p className="text-xs font-semibold text-slate-500">{selectedMachine.model}</p>
                </div>
                <Badge tone={selectedMachine.statusTone}>{selectedMachine.latestReportCode}</Badge>
              </div>

              {/* Next Action Box */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Recommended Action</p>
                <p className="mt-1.5 text-xs text-slate-800 font-medium leading-relaxed">{selectedMachine.nextAction}</p>
              </div>

              {/* Missing Reports Alerts */}
              {selectedMachine.missingReports.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-bold uppercase text-amber-800">Missing Lifecycle Reports</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selectedMachine.missingReports.map((report) => (
                      <Badge key={report} tone="warning">{report}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Monthly Gaps Drawer */}
              {selectedMachine.hasMonthlyGap && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-4">
                  <button
                    type="button"
                    onClick={() => setMonthlyListOpen((isOpen) => !isOpen)}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <span className="text-xs font-bold uppercase text-amber-800">
                      Missing Monthly Reports ({selectedMachine.activeMonthlyGaps.length})
                    </span>
                    <span className="text-xs font-bold text-amber-700 hover:underline">
                      {monthlyListOpen ? 'Hide' : 'Show'}
                    </span>
                  </button>
                  {monthlyListOpen && (
                    <div className="mt-3 space-y-2">
                      {selectedMachine.activeMonthlyGaps.map((gap) => (
                        <div key={`${gap.code}-${gap.month}`} className="flex items-center justify-between rounded bg-white p-2.5 text-xs border border-amber-200">
                          <div>
                            <span className="font-bold text-slate-900">{gap.type}</span>
                            <span className="ml-2 font-mono text-slate-500">{gap.code} ({formatLifecycleMonth(gap.month)})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDismissMonthlyGap(selectedMachine.machineNumber, gap)}
                            className="rounded bg-amber-100 px-2 py-1 text-[0.6875rem] font-bold text-amber-900 hover:bg-amber-200 transition"
                          >
                            Dismiss
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Dismissed Monthly Reports */}
              {selectedMachine.dismissedMonthlyGaps.length > 0 && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <button
                    type="button"
                    onClick={() => setDismissedListOpen((isOpen) => !isOpen)}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <span className="text-xs font-bold uppercase text-slate-500">
                      Dismissed Gaps ({selectedMachine.dismissedMonthlyGaps.length})
                    </span>
                    <span className="text-xs font-bold text-slate-600 hover:underline">
                      {dismissedListOpen ? 'Hide' : 'Show'}
                    </span>
                  </button>
                  {dismissedListOpen && (
                    <div className="mt-3 space-y-2">
                      {selectedMachine.dismissedMonthlyGaps.map((gap) => (
                        <div key={`${gap.code}-${gap.month}`} className="flex items-center justify-between rounded bg-white p-2.5 text-xs border border-slate-200">
                          <div>
                            <span className="font-semibold text-slate-800">{gap.type}</span>
                            <span className="ml-2 font-mono text-slate-400">{gap.code} ({formatLifecycleMonth(gap.month)})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRestoreMonthlyGap(selectedMachine.machineNumber, gap)}
                            className="rounded bg-slate-100 px-2 py-1 text-[0.6875rem] font-bold text-slate-700 hover:bg-slate-200 transition"
                          >
                            Restore
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Timeline Items */}
              <div>
                <p className="text-xs font-bold uppercase text-slate-500 mb-3">Service Timeline Milestones</p>
                <div className="space-y-2">
                  {selectedTimelineItems.map((milestone) => (
                    <div key={milestone.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 bg-white text-xs">
                      <div>
                        <p className="font-bold text-slate-900">{milestone.label}</p>
                        <p className="font-mono text-slate-400 text-[0.6875rem]">{milestone.code}</p>
                      </div>
                      <span className="font-semibold text-slate-700">{formatLifecycleDate(milestone.date)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-center">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-[0.6875rem] font-bold uppercase text-slate-400">Total Services</p>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">{selectedMachine.addServiceCount}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-[0.6875rem] font-bold uppercase text-slate-400">Latest SMR</p>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">{selectedMachine.latestSmr ?? '-'}</p>
                </div>
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
    return `Create missing lifecycle report(s), then close ${monthlyGaps.length} monthly storage gap(s).`;
  }

  if (monthlyGaps.length) {
    const nextGap = monthlyGaps[0];
    return `Generate ${nextGap.code} for ${formatLifecycleMonth(nextGap.month)} or dismiss if intentionally skipped.`;
  }

  if (missingReports.length) {
    return `Generate certified report(s): ${missingReports.join(', ')}.`;
  }

  return 'Lifecycle tracking is current and all service cycles are validated.';
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
