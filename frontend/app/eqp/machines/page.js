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
        machine.responsible_engineer?.toString().toLowerCase().includes(query);

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
      latestActivity: history[0]?.operation_date ? new Date(history[0].operation_date).toLocaleDateString() : 'No activity',
    };
  }, [history, machines, types.length]);

  return (
    <SystemShell
      activePath="/eqp/machines"
      eyebrow="EQP Module"
      title="Machine Register"
      description="Machine counters, SMR progression, engine references, and recent EQP activity."
      actions={<Button type="button" variant="secondary" onClick={loadData} disabled={loading}>Refresh</Button>}
    >
      <div className="grid gap-6">
        {error && (
          <p className="rounded-md border-l-4 border-red-500 bg-white px-4 py-3 text-sm font-semibold text-red-700 shadow-sm">{error}</p>
        )}

        <section className="ds-kpi-grid">
          <Metric label="Machines" value={stats.machines} code="MA" />
          <Metric label="Machine Types" value={stats.types} code="TY" accent />
          <Metric label="Average SMR" value={stats.averageSmr} code="SM" />
          <Metric label="Engineers" value={stats.activeEngineers} code="EN" accent />
        </section>

        <Card className="overflow-hidden">
          <div className="border-b border-[var(--color-border)] p-5">
            <div className="grid gap-3 lg:grid-cols-[1.4fr_0.8fr_auto]">
              <input
                type="text"
                placeholder="Search machines, engine number, or engineer"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="ds-input w-full"
              />
              <select
                value={machineType}
                onChange={(event) => setMachineType(event.target.value)}
                className="ds-input w-full"
              >
                <option value="ALL">All machine types</option>
                {types.map((type) => <option key={type}>{type}</option>)}
              </select>
              <Badge tone="neutral" className="h-11 justify-center rounded-md px-4">{filteredMachines.length} visible</Badge>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-3 p-6">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : filteredMachines.length === 0 ? (
            <div className="p-6">
              <EmptyState title="No machines found" description="Change the filters and try again." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px]">
                <thead className="bg-[var(--color-surface-muted)] text-xs uppercase tracking-[0.12em] text-[var(--color-muted)]">
                  <tr>
                    <th className="px-5 py-4 text-left">Machine</th>
                    <th className="px-5 py-4 text-left">Type</th>
                    <th className="px-5 py-4 text-left">Engine</th>
                    <th className="px-5 py-4 text-left">SMR</th>
                    <th className="px-5 py-4 text-left">Step</th>
                    <th className="px-5 py-4 text-left">Engineer</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMachines.map((machine) => (
                    <tr key={machine.id} className="border-t border-[var(--color-border)] transition hover:bg-[var(--color-brand-soft)]">
                      <td className="px-5 py-4 font-semibold text-[var(--color-ink)]">{machine.machine_number}</td>
                      <td className="px-5 py-4 text-[var(--color-ink-soft)]">{machine.machine_type}</td>
                      <td className="px-5 py-4 font-mono text-sm text-[var(--color-muted)]">{machine.engine_number}</td>
                      <td className="px-5 py-4 text-[var(--color-ink-soft)]">{machine.last_smr}</td>
                      <td className="px-5 py-4 text-[var(--color-ink-soft)]">{machine.smr_step}</td>
                      <td className="px-5 py-4 text-[var(--color-ink-soft)]">{machine.responsible_engineer || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--color-muted)]">Latest EQP Activity</p>
          <p className="mt-2 text-lg font-black text-[var(--color-ink)]">{stats.latestActivity}</p>
        </Card>
      </div>
    </SystemShell>
  );
}

function Metric({ label, value, code, accent = false }) {
  return (
    <article className="ds-kpi-card">
      <div className={`ds-icon-tile ${accent ? 'ds-icon-tile-accent' : ''}`}>{code}</div>
      <div>
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--color-muted)]">{label}</p>
        <p className="mt-2 text-3xl font-black leading-none text-[var(--color-ink)]">{value}</p>
      </div>
    </article>
  );
}
