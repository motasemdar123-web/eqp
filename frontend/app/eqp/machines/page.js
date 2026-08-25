'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import SystemShell from '../../../components/SystemShell';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';
import Skeleton from '../../../components/ui/Skeleton';
import DetailDrawer from '../../../components/ui/DetailDrawer';
import Disclosure from '../../../components/ui/Disclosure';
import { getMachineHistory, getMachines } from '../../../lib/api';
import { getStoredPlatformSession, getStoredUser, getMatchingEngineerName } from '../../../lib/auth';
import { FleetModelBarChart } from '../../../components/eqp/EqpCharts';
import MachineTimelineModal from '../../../components/eqp/MachineTimelineModal';
import EqpNav from '../../../components/eqp/EqpNav';

export default function MachinesPage() {
  const [machines, setMachines] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [machineType, setMachineType] = useState('ALL');
  const [filterEngineer, setFilterEngineer] = useState('ALL');
  const [timelineMachine, setTimelineMachine] = useState(null);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [drawerTab, setDrawerTab] = useState('overview'); // 'overview' | 'history'


  async function loadData() {
    try {
      setLoading(true);
      setError('');
      const session = getStoredPlatformSession();
      const user = getStoredUser();
      const currentUser = session?.user || user;

      const [machinesResponse, historyResponse] = await Promise.all([
        getMachines(),
        getMachineHistory(),
      ]);
      const loaded = machinesResponse.machines || [];
      setMachines(loaded);
      setHistory(historyResponse.history || []);

      const engList = [...new Set(loaded.map((m) => m.responsible_engineer).filter(Boolean))];
      const matched = getMatchingEngineerName(currentUser, engList);
      if (matched !== 'ALL') {
        setFilterEngineer((prev) => (prev === 'ALL' ? matched : prev));
      }
    } catch (loadError) {
      setError(loadError.message || 'Failed to load machines.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const session = getStoredPlatformSession();
    const user = getStoredUser();

    if (!session?.token && !user?.sessionToken) {
      window.location.href = '/';
      return;
    }

    const timer = setTimeout(loadData, 0);
    return () => clearTimeout(timer);
  }, []);

  const types = useMemo(
    () => [...new Set(machines.map((machine) => machine.machine_type).filter(Boolean))],
    [machines]
  );

  const engineers = useMemo(
    () => [...new Set(machines.map((machine) => machine.responsible_engineer).filter(Boolean))].sort(),
    [machines]
  );

  const filteredMachines = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return machines.filter((machine) => {
      const matchesType = machineType === 'ALL' || machine.machine_type === machineType;
      const matchesEngineer =
        filterEngineer === 'ALL' || machine.responsible_engineer === filterEngineer;
      const matchesSearch =
        !query ||
        machine.machine_number?.toString().toLowerCase().includes(query) ||
        machine.engine_number?.toString().toLowerCase().includes(query) ||
        machine.machine_type?.toString().toLowerCase().includes(query) ||
        machine.responsible_engineer?.toString().toLowerCase().includes(query) ||
        machine.customer_name?.toString().toLowerCase().includes(query) ||
        machine.location?.toString().toLowerCase().includes(query);

      return matchesType && matchesEngineer && matchesSearch;
    });
  }, [machines, machineType, filterEngineer, searchTerm]);

  const stats = useMemo(() => {
    const averageSmr = machines.length
      ? Math.round(machines.reduce((total, machine) => total + Number(machine.last_smr || 0), 0) / machines.length)
      : 0;
    const activeEngineers = new Set(machines.map((machine) => machine.responsible_engineer).filter(Boolean)).size;

    return {
      machines: machines.length,
      types: types.length,
      averageSmr,
      activeEngineers,
      latestActivity: history[0]?.operation_date ? new Date(history[0].operation_date).toLocaleDateString() : 'No activity recorded',
    };
  }, [history, machines, types.length]);

  return (
    <SystemShell
      activePath="/eqp/machines"
      eyebrow="Komatsu EQP Platform"
      title="Fleet Machinery Register"
      description="Asset database, SMR operating hour meters, engine serials, sequential counters, and service histories."
      actions={
        <Button type="button" variant="secondary" onClick={loadData} disabled={loading}>
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Fleet
        </Button>
      }
    >
      <div className="space-y-5">
        <EqpNav />

        {error && (
          <div className="ds-alert ds-alert-error">
            <span>{error}</span>
          </div>
        )}


        {/* Fleet KPI Metrics */}
        <section className="ds-kpi-grid">
          <article className="ds-kpi-card">
            <div className="ds-icon-tile">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="ds-kpi-content">
              <div className="ds-kpi-head">
                <p className="ds-kpi-label">Registered Fleet</p>
                <Badge tone="active">Active</Badge>
              </div>
              <p className="ds-kpi-main">{stats.machines}</p>
              <p className="ds-kpi-descriptor">Tracked Units</p>
            </div>
          </article>

          <article className="ds-kpi-card">
            <div className="ds-icon-tile ds-icon-tile-accent">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </div>
            <div className="ds-kpi-content">
              <div className="ds-kpi-head">
                <p className="ds-kpi-label">Machine Types</p>
                <Badge tone="ready">Ready</Badge>
              </div>
              <p className="ds-kpi-main">{stats.types}</p>
              <p className="ds-kpi-descriptor">Model Families</p>
            </div>
          </article>

          <article className="ds-kpi-card">
            <div className="ds-icon-tile">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ds-kpi-content">
              <div className="ds-kpi-head">
                <p className="ds-kpi-label">Average SMR</p>
                <Badge tone="live">Live</Badge>
              </div>
              <p className="ds-kpi-main">{stats.averageSmr} hrs</p>
              <p className="ds-kpi-descriptor">Operating Hours</p>
            </div>
          </article>

          <article className="ds-kpi-card">
            <div className="ds-icon-tile ds-icon-tile-accent">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="ds-kpi-content">
              <div className="ds-kpi-head">
                <p className="ds-kpi-label">Engineers</p>
                <Badge tone="info">Assigned</Badge>
              </div>
              <p className="ds-kpi-main">{stats.activeEngineers}</p>
              <p className="ds-kpi-descriptor">Assigned Leads</p>
            </div>
          </article>
        </section>

        {/* Visual Model Distribution Filter */}
        <Card className="p-4 bg-slate-50/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Fleet Model Distribution Filter</span>
            <span className="text-xs text-slate-400">Click model to isolate</span>
          </div>
          <FleetModelBarChart
            machines={machines}
            selectedModel={machineType}
            onSelectModel={setMachineType}
          />
        </Card>

        {/* Machines Table Card */}
        <Card className="overflow-hidden">
          <div className="border-b border-slate-200 p-5 bg-slate-50/70 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Registered Machine Units</h3>
                <p className="text-xs text-slate-500">Full specification, operating hour meters, and service counters</p>
              </div>
              <Badge tone="neutral">{filteredMachines.length} Units Listed</Badge>
            </div>

            {/* Engineer Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200/60">
              <span className="text-xs font-bold text-slate-500 mr-1">Engineer Lead:</span>
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

              {engineers.map((eng) => {
                const count = machines.filter((m) => m.responsible_engineer === eng).length;
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

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
              <div className="relative flex-1 max-w-md">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search machine number, serials, customer, or site..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="ds-input pl-9 text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={machineType}
                  onChange={(event) => setMachineType(event.target.value)}
                  className="ds-input text-xs min-w-[150px]"
                >
                  <option value="ALL">All Models</option>
                  {types.map((type) => <option key={type}>{type}</option>)}
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-3 p-6">
              <Skeleton className="h-12 rounded-lg" />
              <Skeleton className="h-12 rounded-lg" />
              <Skeleton className="h-12 rounded-lg" />
            </div>
          ) : filteredMachines.length === 0 ? (
            <div className="p-8">
              <EmptyState title="No machines found" description="Adjust your search criteria or select all machine types." />
            </div>
          ) : (
            <div className="ds-table-wrap">
              <table className="ds-table">
                <thead>
                  <tr>
                    <th>Machine ID</th>
                    <th>Model Family</th>
                    <th>Operating SMR</th>
                    <th>Last Counter</th>
                    <th>Assigned Lead</th>
                    <th>Location / Plant</th>
                    <th>Customer</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMachines.map((machine) => {
                    const counter = Number(machine.report_counter || 0);
                    const isSelected = selectedMachine && selectedMachine.id === machine.id;

                    return (
                      <tr
                        key={machine.id}
                        onClick={() => setSelectedMachine(machine)}
                        className={`cursor-pointer transition-colors group ${
                          isSelected ? 'bg-amber-50/80 font-medium' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="font-extrabold text-slate-900 group-hover:text-amber-700 transition-colors">
                          {machine.machine_number}
                        </td>
                        <td>
                          <span className="font-bold text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                            {machine.machine_type}
                          </span>
                        </td>
                        <td>
                          <span className="font-bold text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {machine.last_smr} hrs
                          </span>
                        </td>
                        <td>
                          <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Ex_{counter + 1}
                          </span>
                        </td>
                        <td className="text-xs font-semibold text-slate-800">{machine.responsible_engineer || '—'}</td>
                        <td className="text-xs text-slate-600">{machine.location || '—'}</td>
                        <td className="text-xs text-slate-500 max-w-[180px] truncate">{machine.customer_name || '—'}</td>
                        <td className="text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMachine(machine);
                            }}
                            className="px-2.5 py-1 rounded-md text-xs font-semibold text-slate-600 hover:text-amber-700 hover:bg-amber-100/70 transition-colors cursor-pointer"
                          >
                            Inspect →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* MACHINE MASTER-DETAIL DRAWER (PROGRESSIVE DISCLOSURE) */}
      <DetailDrawer
        open={Boolean(selectedMachine)}
        onClose={() => setSelectedMachine(null)}
        title={selectedMachine?.machine_number || 'Machine Record'}
        subtitle={`${selectedMachine?.machine_type || 'Komatsu Asset'} • SMR ${selectedMachine?.last_smr || 0} hrs`}
        badge={<Badge tone="ready" size="sm">Active Register</Badge>}
        size="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              onClick={() => {
                const m = selectedMachine;
                setSelectedMachine(null);
                setTimelineMachine(m);
              }}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer underline"
            >
              Full Visual Timeline
            </button>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setSelectedMachine(null)}>
                Close
              </Button>
              <Link href={`/eqp/generate-reports?machine=${encodeURIComponent(selectedMachine?.machine_number || '')}`}>
                <Button variant="primary" size="sm">
                  Generate Report →
                </Button>
              </Link>
            </div>
          </div>
        }
      >
        {selectedMachine && (
          <div className="space-y-5">
            {/* Quick Tab Header */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs">
              <button
                type="button"
                onClick={() => setDrawerTab('overview')}
                className={`px-3 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                  drawerTab === 'overview' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab('history')}
                className={`px-3 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                  drawerTab === 'history' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Inspection History ({history.filter((h) => h.machine_number === selectedMachine.machine_number).length})
              </button>
            </div>

            {drawerTab === 'overview' && (
              <div className="space-y-4">
                {/* Identity Card */}
                <div className="p-4 bg-slate-50/80 rounded-lg border border-slate-200/80 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">Machine Unit</span>
                      <span className="font-bold text-slate-900 text-sm mt-0.5 block">{selectedMachine.machine_number}</span>
                      <span className="text-[11px] text-slate-500 font-mono">Engine SN: {selectedMachine.engine_number || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">Operating Hours</span>
                      <span className="font-mono font-bold text-emerald-700 text-sm mt-0.5 block">{selectedMachine.last_smr} SMR</span>
                      <span className="text-[11px] text-slate-500">Counter: Ex_{Number(selectedMachine.report_counter || 0) + 1}</span>
                    </div>
                  </div>
                </div>

                {/* Assignment & Location */}
                <div className="p-4 bg-white rounded-lg border border-slate-200/80 space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700">Account & Job Site</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Customer Account</span>
                      <span className="font-semibold text-slate-900 mt-0.5 block">{selectedMachine.customer_name || 'Dar Al Hai Internal'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Deployment Site</span>
                      <span className="font-semibold text-slate-900 mt-0.5 block">{selectedMachine.location || 'Central Workshop'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Lead Field Engineer</span>
                      <span className="font-semibold text-slate-900 mt-0.5 block">{selectedMachine.responsible_engineer || 'Unassigned'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Model Family</span>
                      <span className="font-semibold text-slate-900 mt-0.5 block">{selectedMachine.machine_type}</span>
                    </div>
                  </div>
                </div>

                {/* Collapsible Telemetry */}
                <Disclosure
                  title="Preventive Service Milestones"
                  subtitle="250h / 500h / 1000h / 2000h interval tracking"
                  defaultOpen={true}
                >
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-100">
                      <span className="text-[10px] text-slate-500 block">Last Recorded SMR</span>
                      <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">{selectedMachine.last_smr} h</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-100">
                      <span className="text-[10px] text-slate-500 block">Next PM Due</span>
                      <span className="font-mono font-bold text-amber-700 text-sm mt-0.5 block">
                        {Math.ceil(Number(selectedMachine.last_smr || 0) / 250) * 250} h
                      </span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-100">
                      <span className="text-[10px] text-slate-500 block">Compliance</span>
                      <span className="font-bold text-emerald-700 text-sm mt-0.5 block">Certified</span>
                    </div>
                  </div>
                </Disclosure>
              </div>
            )}

            {drawerTab === 'history' && (
              <div className="space-y-2">
                {(() => {
                  const machineHistory = history.filter((h) => h.machine_number === selectedMachine.machine_number);
                  if (machineHistory.length === 0) {
                    return <p className="text-xs text-slate-400 p-4 text-center">No past inspection records archived yet for this unit.</p>;
                  }
                  return machineHistory.map((rec, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-slate-900">{rec.report_type || 'Periodic PM'} ({rec.smr_hours || 0} h)</p>
                        <p className="text-[11px] text-slate-500">{rec.inspection_date || 'Past Record'} • {rec.engineer || 'Field Inspector'}</p>
                      </div>
                      <Badge tone="ready" size="sm">Certified</Badge>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
        )}
      </DetailDrawer>

      {/* Machine Timeline Modal */}
      {timelineMachine && (
        <MachineTimelineModal
          machine={timelineMachine}
          onClose={() => setTimelineMachine(null)}
        />
      )}
    </SystemShell>
  );
}

