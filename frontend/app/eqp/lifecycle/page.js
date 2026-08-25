'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import SystemShell from '../../../components/SystemShell';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import EmptyState from '../../../components/ui/EmptyState';
import Button from '../../../components/ui/Button';
import { getMachines, getReports } from '../../../lib/api';
import { getStoredPlatformSession, getStoredUser, getMatchingEngineerName } from '../../../lib/auth';
import {
  buildDynamicLifecycleRecords,
  formatLifecycleDate,
  formatLifecycleMonth,
} from '../../../lib/eqpLifecycleData';
import { LifecycleMilestoneProgressBar } from '../../../components/eqp/EqpCharts';
import EqpNav from '../../../components/eqp/EqpNav';

const DISMISSED_MONTHLY_GAPS_KEY = 'eqp.dismissedMonthlyGaps';

export default function EqpLifecyclePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [modelFilter, setModelFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [filterEngineer, setFilterEngineer] = useState('ALL');
  const [selectedMachineNumber, setSelectedMachineNumber] = useState('');
  const [dismissedGapKeys, setDismissedGapKeys] = useState([]);
  const [monthlyListOpen, setMonthlyListOpen] = useState(true);
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
    const total = machines.length || 1;
    const pdiDone = machines.filter((m) => m.preDeliveryDate).length;
    const delDone = machines.filter((m) => m.deliveryDate).length;
    const s1Done = machines.filter((m) => m.firstServiceDate).length;
    const s2Done = machines.filter((m) => m.secondServiceDate).length;
    const s3Done = machines.filter((m) => m.thirdServiceDate).length;
    const monthlyGaps = machines.reduce((total, machine) => total + machine.activeMonthlyGaps.length, 0);
    const dismissedMonthlyGaps = machines.reduce((total, machine) => total + machine.dismissedMonthlyGaps.length, 0);

    return {
      total: machines.length,
      pdiDone,
      delDone,
      s1Done,
      s2Done,
      s3Done,
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
      eyebrow="Komatsu EQP Platform"
      title="Machine Lifecycle & Service Tracker"
      description="Interactive milestone timeline, service stage progression, and monthly gap verification across the fleet."
      actions={
        <div className="flex items-center gap-2">
          <Badge tone={generatedReports.length > 0 ? 'ready' : 'neutral'} size="sm">
            {loadingReports ? 'Syncing...' : `${generatedReports.length} Reports Synced`}
          </Badge>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={loadReportsData}
            disabled={loadingReports}
          >
            {loadingReports ? 'Refreshing...' : 'Refresh Lifecycle'}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <EqpNav />

        {/* Fleet Milestone Funnel Bar */}
        <Card className="p-4 bg-slate-900 text-white border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-3 mb-3">
            <div>
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Fleet Factory Milestone Progression</h3>
              <p className="text-[11px] text-slate-400">Completion rate of standard Komatsu lifecycle intervals across {stats.total} units</p>
            </div>
            <Badge tone="live" size="sm">Active Tracking</Badge>
          </div>


          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700">
              <p className="text-[10px] font-bold uppercase text-slate-400">Pre-Delivery (PDI)</p>
              <p className="text-xl font-extrabold text-amber-400 mt-1">{stats.pdiDone}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{Math.round((stats.pdiDone / (stats.total || 1)) * 100)}% Verified</p>
            </div>
            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700">
              <p className="text-[10px] font-bold uppercase text-slate-400">Delivery New</p>
              <p className="text-xl font-extrabold text-sky-400 mt-1">{stats.delDone}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{Math.round((stats.delDone / (stats.total || 1)) * 100)}% Delivered</p>
            </div>
            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700">
              <p className="text-[10px] font-bold uppercase text-slate-400">1st Service (250h)</p>
              <p className="text-xl font-extrabold text-emerald-400 mt-1">{stats.s1Done}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{Math.round((stats.s1Done / (stats.total || 1)) * 100)}% Done</p>
            </div>
            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700">
              <p className="text-[10px] font-bold uppercase text-slate-400">2nd Service (500h)</p>
              <p className="text-xl font-extrabold text-indigo-400 mt-1">{stats.s2Done}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{Math.round((stats.s2Done / (stats.total || 1)) * 100)}% Done</p>
            </div>
            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 col-span-2 sm:col-span-1">
              <p className="text-[10px] font-bold uppercase text-slate-400">Monthly Gaps</p>
              <p className={`text-xl font-extrabold mt-1 ${stats.monthlyGaps > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {stats.monthlyGaps}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">{stats.monthlyGaps > 0 ? 'Action Needed' : 'All Clear'}</p>
            </div>
          </div>
        </Card>

        {/* Main Grid: Machine List & Interactive Detail Timeline Card */}
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(420px,0.8fr)]">
          {/* Table Card */}
          <Card className="overflow-hidden">
            <div className="border-b border-slate-200 p-5 bg-slate-50/70 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Tracked Fleet Assets</h3>
                  <p className="text-xs text-slate-500">Click any machine to inspect its visual milestone timeline</p>
                </div>
                <Badge tone="neutral">{filteredMachines.length} Units</Badge>
              </div>

              {/* Engineer Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200/60">
                <span className="text-xs font-bold text-slate-500 mr-1">Engineer:</span>
                <button
                  type="button"
                  onClick={() => setFilterEngineer('ALL')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    filterEngineer === 'ALL'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  All ({machines.length})
                </button>

                {engineerOptions.map((eng) => {
                  const count = machines.filter((m) => m.responsibleEngineer === eng).length;
                  const isSelected = filterEngineer === eng;
                  return (
                    <button
                      key={eng}
                      type="button"
                      onClick={() => setFilterEngineer(eng)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                        isSelected
                          ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {eng} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Filter Row */}
              <div className="grid gap-2 sm:grid-cols-[1.5fr_1fr_1fr]">
                <input
                  type="text"
                  placeholder="Search machine ID or model..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="ds-input text-xs"
                />
                <select value={modelFilter} onChange={(event) => setModelFilter(event.target.value)} className="ds-input text-xs">
                  <option value="ALL">All Models</option>
                  {modelOptions.map((model) => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="ds-input text-xs">
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
                          className={`cursor-pointer transition-colors ${isSelected ? '!bg-amber-50/70 font-semibold' : 'hover:bg-slate-50/60'}`}
                          onClick={() => setSelectedMachineNumber(machine.machineNumber)}
                        >
                          <td className="font-bold text-slate-900">{machine.machineNumber}</td>
                          <td className="text-slate-700">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-xs font-semibold">
                              {machine.model}
                            </span>
                          </td>
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

          {/* Selected Machine Interactive Detail Timeline Card */}
          {selectedMachine ? (
            <Card className="p-6 h-fit space-y-5">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-extrabold text-base border border-amber-500/20">
                    🚜
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{selectedMachine.model} #{selectedMachine.machineNumber}</h2>
                    <p className="text-xs text-slate-500">
                      Lead: <span className="font-semibold text-slate-800">{selectedMachine.responsibleEngineer || 'Service Engineer'}</span>
                    </p>
                  </div>
                </div>
                <Badge tone={selectedMachine.statusTone}>{selectedMachine.latestReportCode}</Badge>
              </div>

              {/* Visual Lifecycle Milestone Stepper */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Standard Lifecycle Stepper</p>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <LifecycleMilestoneProgressBar milestones={selectedMachine.milestones} />
                </div>
              </div>

              {/* Recommended Next Action */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-800">Recommended Next Step</p>
                  <Link
                    href="/eqp/generate-reports"
                    className="text-[11px] font-bold text-amber-700 hover:underline"
                  >
                    Open Builder →
                  </Link>
                </div>
                <p className="text-xs text-slate-800 font-medium leading-relaxed">{selectedMachine.nextAction}</p>
              </div>

              {/* Monthly Gaps Drawer */}
              {selectedMachine.hasMonthlyGap && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4">
                  <button
                    type="button"
                    onClick={() => setMonthlyListOpen((isOpen) => !isOpen)}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <span className="text-xs font-bold uppercase text-rose-800">
                      Missing Monthly Reports ({selectedMachine.activeMonthlyGaps.length})
                    </span>
                    <span className="text-xs font-bold text-rose-700 hover:underline">
                      {monthlyListOpen ? 'Hide' : 'Show'}
                    </span>
                  </button>
                  {monthlyListOpen && (
                    <div className="mt-3 space-y-2">
                      {selectedMachine.activeMonthlyGaps.map((gap) => (
                        <div key={`${gap.code}-${gap.month}`} className="flex items-center justify-between rounded-lg bg-white p-2.5 text-xs border border-rose-200 shadow-2xs">
                          <div>
                            <span className="font-bold text-slate-900">{gap.type}</span>
                            <span className="ml-2 font-mono text-slate-500">{gap.code} ({formatLifecycleMonth(gap.month)})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDismissMonthlyGap(selectedMachine.machineNumber, gap)}
                            className="rounded-md bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-900 hover:bg-rose-200 transition"
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
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <button
                    type="button"
                    onClick={() => setDismissedListOpen((isOpen) => !isOpen)}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <span className="text-xs font-bold uppercase text-slate-500">
                      Dismissed Monthly Gaps ({selectedMachine.dismissedMonthlyGaps.length})
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
                            className="rounded bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-200 transition"
                          >
                            Restore
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Chronological Timeline Feed */}
              <div>
                <p className="text-xs font-bold uppercase text-slate-500 mb-3">Service Events Timeline</p>
                <div className="relative pl-5 space-y-2.5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 max-h-64 overflow-y-auto pr-1">
                  {selectedTimelineItems.map((milestone) => (
                    <div key={milestone.id} className="relative group flex items-center justify-between rounded-lg border border-slate-200 p-2.5 bg-white text-xs shadow-2xs">
                      <span className="absolute -left-5 top-3 w-2 h-2 rounded-full bg-slate-400 group-hover:bg-amber-500 ring-4 ring-white" />
                      <div>
                        <p className="font-bold text-slate-900">{milestone.label}</p>
                        <p className="font-mono text-slate-400 text-[10px]">{milestone.code}</p>
                      </div>
                      <span className="font-semibold text-slate-700 font-mono text-[11px]">
                        {formatLifecycleDate(milestone.date)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-center">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[11px] font-bold uppercase text-slate-400">Total Add Services</p>
                  <p className="text-xl font-extrabold text-slate-900 mt-0.5">{selectedMachine.addServiceCount}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[11px] font-bold uppercase text-slate-400">Current SMR</p>
                  <p className="text-xl font-extrabold text-slate-900 mt-0.5">{selectedMachine.latestSmr ?? '-'}</p>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center">
              <EmptyState title="No machine selected" description="Select a machine from the left table to view timeline details." />
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
