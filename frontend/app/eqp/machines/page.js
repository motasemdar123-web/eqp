'use client';

import { useEffect, useMemo, useState } from 'react';
import SystemShell from '../../../components/SystemShell';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';
import Skeleton from '../../../components/ui/Skeleton';
import { getMachineHistory, getMachines } from '../../../lib/api';
import { getStoredPlatformSession, getStoredUser } from '../../../lib/auth';

export default function MachinesPage() {
  const [machines, setMachines] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [machineType, setMachineType] = useState('ALL');

  async function loadData() {
    try {
      setLoading(true);
      setError('');
      const [machinesResponse, historyResponse] = await Promise.all([
        getMachines(),
        getMachineHistory(),
      ]);
      setMachines(machinesResponse.machines || []);
      setHistory(historyResponse.history || []);
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

  const filteredMachines = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return machines.filter((machine) => {
      const matchesType = machineType === 'ALL' || machine.machine_type === machineType;
      const matchesSearch =
        !query ||
        machine.machine_number?.toString().toLowerCase().includes(query) ||
        machine.engine_number?.toString().toLowerCase().includes(query) ||
        machine.machine_type?.toString().toLowerCase().includes(query) ||
        machine.responsible_engineer?.toString().toLowerCase().includes(query) ||
        machine.customer_name?.toString().toLowerCase().includes(query) ||
        machine.location?.toString().toLowerCase().includes(query);

      return matchesType && matchesSearch;
    });
  }, [machines, machineType, searchTerm]);

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
      eyebrow="EQP Module"
      title="Machine Register"
      description="Real-time machinery register, SMR hour meters, engine numbers, and service interval steps."
      actions={
        <Button type="button" variant="secondary" onClick={loadData} disabled={loading}>
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </Button>
      }
    >
      <div className="space-y-6">
        {error && (
          <div className="ds-alert ds-alert-error">
            <span>{error}</span>
          </div>
        )}

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
              <p className="ds-kpi-main">{stats.averageSmr}</p>
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

        {/* Machines Table Card */}
        <Card className="overflow-hidden">
          <div className="border-b border-slate-200 p-5 bg-slate-50/60">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search machines, serials, customer, or engineer..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="ds-input pl-9"
                />
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={machineType}
                  onChange={(event) => setMachineType(event.target.value)}
                  className="ds-input min-w-[160px]"
                >
                  <option value="ALL">All Machine Types</option>
                  {types.map((type) => <option key={type}>{type}</option>)}
                </select>

                <Badge tone="neutral">{filteredMachines.length} Units</Badge>
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
                    <th>Customer</th>
                    <th>Location</th>
                    <th>Engine Number</th>
                    <th>SMR Hours</th>
                    <th>Current Step</th>
                    <th>Engineer</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMachines.map((machine) => (
                    <tr key={machine.id}>
                      <td className="font-bold text-slate-900">{machine.machine_number}</td>
                      <td className="font-medium text-slate-700">{machine.machine_type}</td>
                      <td className="text-slate-600 max-w-[200px] truncate">{machine.customer_name || '-'}</td>
                      <td className="text-slate-600">{machine.location || '-'}</td>
                      <td className="font-mono text-xs text-slate-500">{machine.engine_number}</td>
                      <td className="font-semibold text-slate-900">{machine.last_smr}</td>
                      <td>
                        <span className="inline-block rounded bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200/60">
                          {machine.smr_step}
                        </span>
                      </td>
                      <td className="text-slate-600 font-medium">{machine.responsible_engineer || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Recent Activity Footnote Card */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-3.5 shadow-sm text-xs text-slate-600">
          <span className="font-medium">Latest EQP Cycle Activity: <strong className="text-slate-900">{stats.latestActivity}</strong></span>
          <span className="text-slate-400">Total Fleet Tracking Active</span>
        </div>
      </div>
    </SystemShell>
  );
}
