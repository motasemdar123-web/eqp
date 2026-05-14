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
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>
        )}

        <section className="grid gap-4 md:grid-cols-4">
          <Metric label="Machines" value={stats.machines} tone="dark" />
          <Metric label="Machine Types" value={stats.types} />
          <Metric label="Average SMR" value={stats.averageSmr} />
          <Metric label="Engineers" value={stats.activeEngineers} />
        </section>

        <Card className="overflow-hidden">
          <div className="border-b border-zinc-200 p-5">
            <div className="grid gap-3 lg:grid-cols-[1.4fr_0.8fr_auto]">
              <input
                type="text"
                placeholder="Search machines, engine number, or engineer"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="h-11 rounded-md border border-zinc-300 bg-white px-4 text-zinc-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
              />
              <select
                value={machineType}
                onChange={(event) => setMachineType(event.target.value)}
                className="h-11 rounded-md border border-zinc-300 bg-white px-4 text-zinc-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
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
                <thead className="bg-zinc-50 text-xs uppercase tracking-[0.12em] text-zinc-500">
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
                    <tr key={machine.id} className="border-t border-zinc-100 transition hover:bg-yellow-50/60">
                      <td className="px-5 py-4 font-semibold text-zinc-950">{machine.machine_number}</td>
                      <td className="px-5 py-4 text-zinc-700">{machine.machine_type}</td>
                      <td className="px-5 py-4 font-mono text-sm text-zinc-600">{machine.engine_number}</td>
                      <td className="px-5 py-4 text-zinc-700">{machine.last_smr}</td>
                      <td className="px-5 py-4 text-zinc-700">{machine.smr_step}</td>
                      <td className="px-5 py-4 text-zinc-700">{machine.responsible_engineer || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Latest EQP Activity</p>
          <p className="mt-2 text-lg font-black text-zinc-950">{stats.latestActivity}</p>
        </Card>
      </div>
    </SystemShell>
  );
}

function Metric({ label, value, tone = 'light' }) {
  return (
    <Card className={`p-5 ${tone === 'dark' ? 'border-zinc-900 bg-zinc-950 text-white' : ''}`}>
      <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${tone === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>{label}</p>
      <p className={`mt-3 text-3xl font-black ${tone === 'dark' ? 'text-yellow-400' : 'text-zinc-950'}`}>{value}</p>
    </Card>
  );
}
