'use client';

import { useEffect, useMemo, useState } from 'react';
import SystemShell from '../../../components/SystemShell';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';
import Skeleton from '../../../components/ui/Skeleton';
import { createTechnician, getShifts, getTechnicians, updateTechnician } from '../../../lib/api';
import { getStoredPlatformSession } from '../../../lib/auth';

const emptyForm = {
  fullName: '',
  email: '',
  userNumber: '',
  employeeCode: '',
  phone: '',
  region: '',
  shiftId: '',
  isAvailable: true,
  skills: '',
};

function technicianName(technician) {
  return technician?.user?.fullName || technician?.employeeCode || 'Technician';
}

function formFromTechnician(technician) {
  return {
    fullName: technician.user?.fullName || '',
    email: technician.user?.email || '',
    userNumber: technician.user?.userNumber || '',
    employeeCode: technician.employeeCode || '',
    phone: technician.user?.phone || '',
    region: technician.region || '',
    shiftId: technician.shiftId || '',
    isAvailable: Boolean(technician.isAvailable),
    skills: (technician.skills || []).map((skill) => skill.skill).join(', '),
  };
}

function payloadFromForm(form) {
  return {
    fullName: form.fullName.trim(),
    email: form.email.trim(),
    userNumber: form.userNumber ? Number(form.userNumber) : null,
    employeeCode: form.employeeCode.trim(),
    phone: form.phone.trim() || null,
    region: form.region.trim() || null,
    shiftId: form.shiftId || null,
    isAvailable: form.isAvailable,
    skills: form.skills
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean),
  };
}

export default function TechniciansManagementPage() {
  const [token] = useState(() => (
    typeof window === 'undefined' ? '' : getStoredPlatformSession()?.token || ''
  ));
  const [technicians, setTechnicians] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  async function loadData() {
    if (!token) return;

    try {
      setLoading(true);
      setError('');
      const [techniciansResponse, shiftsResponse] = await Promise.all([
        getTechnicians(),
        getShifts(),
      ]);
      setTechnicians(techniciansResponse.technicians || []);
      setShifts(shiftsResponse.shifts || []);
    } catch (loadError) {
      setError(loadError.message || 'Failed to load technicians.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) {
      window.location.href = '/';
      return undefined;
    }

    const timer = setTimeout(loadData, 0);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const selectedTechnician = useMemo(
    () => technicians.find((technician) => technician.id === selectedTechnicianId) || null,
    [selectedTechnicianId, technicians]
  );

  const filteredTechnicians = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return technicians.filter((technician) => {
      const matchesAvailability =
        availabilityFilter === 'ALL' ||
        (availabilityFilter === 'AVAILABLE' && technician.isAvailable) ||
        (availabilityFilter === 'UNAVAILABLE' && !technician.isAvailable);
      const searchText = [
        technician.employeeCode,
        technician.user?.fullName,
        technician.user?.email,
        technician.region,
        technician.shift?.name,
      ].filter(Boolean).join(' ').toLowerCase();

      return matchesAvailability && (!query || searchText.includes(query));
    });
  }, [availabilityFilter, searchTerm, technicians]);

  const stats = useMemo(() => ({
    total: technicians.length,
    available: technicians.filter((technician) => technician.isAvailable).length,
    unavailable: technicians.filter((technician) => !technician.isAvailable).length,
  }), [technicians]);

  function startCreate() {
    setSelectedTechnicianId('');
    setForm(emptyForm);
    setMessage('');
    setError('');
  }

  function startEdit(technician) {
    setSelectedTechnicianId(technician.id);
    setForm(formFromTechnician(technician));
    setMessage('');
    setError('');
  }

  async function saveTechnician(event) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const payload = payloadFromForm(form);

      if (selectedTechnician) {
        await updateTechnician(selectedTechnician.id, payload);
        setMessage('Technician updated.');
      } else {
        await createTechnician(payload);
        setMessage('Technician added.');
        setForm(emptyForm);
      }

      await loadData();
    } catch (saveError) {
      setError(saveError.message || 'Failed to save technician.');
    } finally {
      setSaving(false);
    }
  }

  async function setAvailability(technician, isAvailable) {
    setSaving(true);
    setMessage('');
    setError('');

    try {
      await updateTechnician(technician.id, { isAvailable });
      setMessage(`${technicianName(technician)} marked ${isAvailable ? 'available' : 'unavailable'}.`);
      await loadData();
    } catch (updateError) {
      setError(updateError.message || 'Failed to update availability.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SystemShell
      activePath="/management/technicians"
      eyebrow="Operations Control"
      title="Technicians Management"
      description="Add technicians, manage availability, assign shifts and regions, and keep skills visible for dispatch."
      actions={<Button type="button" variant="secondary" onClick={loadData} disabled={loading || saving}>Refresh</Button>}
    >
      <div className="grid gap-6">
        {(message || error) && (
          <div className={`rounded-md border px-4 py-3 text-sm font-semibold ${
            error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}>
            {error || message}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-4">
          <Metric label="Technicians" value={stats.total} tone="dark" />
          <Metric label="Available" value={stats.available} />
          <Metric label="Unavailable" value={stats.unavailable} />
          <Metric label="Shifts" value={shifts.length} />
        </section>

        <section className="grid gap-5 xl:grid-cols-[1fr_420px]">
          <Card className="overflow-hidden">
            <div className="border-b border-zinc-200 p-5">
              <div className="grid gap-3 lg:grid-cols-[1.4fr_0.8fr_auto]">
                <input
                  type="text"
                  placeholder="Search by name, code, email, region, or shift"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="h-11 rounded-md border border-zinc-300 bg-white px-4 text-zinc-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                />
                <select
                  value={availabilityFilter}
                  onChange={(event) => setAvailabilityFilter(event.target.value)}
                  className="h-11 rounded-md border border-zinc-300 bg-white px-4 text-zinc-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                >
                  <option value="ALL">All availability</option>
                  <option value="AVAILABLE">Available only</option>
                  <option value="UNAVAILABLE">Unavailable only</option>
                </select>
                <Button type="button" variant="ghost" onClick={startCreate}>Add New</Button>
              </div>
            </div>

            {loading ? (
              <div className="grid gap-3 p-6">
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
              </div>
            ) : filteredTechnicians.length === 0 ? (
              <div className="p-6">
                <EmptyState title="No technicians found" description="Adjust filters or add a new technician." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px]">
                  <thead className="bg-zinc-50 text-xs uppercase tracking-[0.12em] text-zinc-500">
                    <tr>
                      <th className="px-5 py-4 text-left">Technician</th>
                      <th className="px-5 py-4 text-left">Availability</th>
                      <th className="px-5 py-4 text-left">Shift</th>
                      <th className="px-5 py-4 text-left">Region</th>
                      <th className="px-5 py-4 text-left">Skills</th>
                      <th className="px-5 py-4 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTechnicians.map((technician) => (
                      <tr key={technician.id} className="border-t border-zinc-100 align-top transition hover:bg-yellow-50/60">
                        <td className="px-5 py-4">
                          <p className="font-bold text-zinc-950">{technicianName(technician)}</p>
                          <p className="mt-1 font-mono text-xs text-zinc-500">{technician.employeeCode}</p>
                          <p className="mt-1 text-xs text-zinc-500">{technician.user?.email}</p>
                        </td>
                        <td className="px-5 py-4">
                          <Badge tone={technician.isAvailable ? 'green' : 'red'}>
                            {technician.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-zinc-700">{technician.shift?.name || '-'}</td>
                        <td className="px-5 py-4 text-sm text-zinc-600">{technician.region || '-'}</td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {(technician.skills || []).slice(0, 4).map((skill) => (
                              <Badge key={skill.id} tone="neutral">{skill.skill}</Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            <Button type="button" variant="secondary" onClick={() => startEdit(technician)}>Edit</Button>
                            <Button
                              type="button"
                              variant={technician.isAvailable ? 'ghost' : 'primary'}
                              onClick={() => setAvailability(technician, !technician.isAvailable)}
                              disabled={saving}
                            >
                              {technician.isAvailable ? 'Set Unavailable' : 'Set Available'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  {selectedTechnician ? 'Edit Technician' : 'Add Technician'}
                </p>
                <h2 className="mt-2 text-xl font-black text-zinc-950">
                  {selectedTechnician ? technicianName(selectedTechnician) : 'New technician'}
                </h2>
              </div>
              {selectedTechnician && <Button type="button" variant="ghost" onClick={startCreate}>Clear</Button>}
            </div>

            <form onSubmit={saveTechnician} className="mt-5 grid gap-3">
              <input className="h-11 rounded-md border border-zinc-300 px-3" placeholder="Full name" value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} />
              <input type="email" className="h-11 rounded-md border border-zinc-300 px-3" placeholder="Company email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" className="h-11 rounded-md border border-zinc-300 px-3" placeholder="User number" value={form.userNumber} onChange={(event) => setForm((current) => ({ ...current, userNumber: event.target.value }))} />
                <input className="h-11 rounded-md border border-zinc-300 px-3" placeholder="Employee code" value={form.employeeCode} onChange={(event) => setForm((current) => ({ ...current, employeeCode: event.target.value }))} />
              </div>
              <input className="h-11 rounded-md border border-zinc-300 px-3" placeholder="Phone" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
              <input className="h-11 rounded-md border border-zinc-300 px-3" placeholder="Region" value={form.region} onChange={(event) => setForm((current) => ({ ...current, region: event.target.value }))} />
              <select className="h-11 rounded-md border border-zinc-300 px-3" value={form.shiftId} onChange={(event) => setForm((current) => ({ ...current, shiftId: event.target.value }))}>
                <option value="">No default shift</option>
                {shifts.map((shift) => <option key={shift.id} value={shift.id}>{shift.name} ({shift.startsAt}-{shift.endsAt})</option>)}
              </select>
              <textarea rows={3} className="rounded-md border border-zinc-300 px-3 py-2" placeholder="Skills separated by commas" value={form.skills} onChange={(event) => setForm((current) => ({ ...current, skills: event.target.value }))} />
              <label className="flex h-11 items-center gap-3 rounded-md border border-zinc-300 px-3 text-sm font-semibold text-zinc-700">
                <input type="checkbox" checked={form.isAvailable} onChange={(event) => setForm((current) => ({ ...current, isAvailable: event.target.checked }))} />
                Available for dispatch
              </label>
              <Button type="submit" disabled={saving}>
                {selectedTechnician ? 'Save Technician' : 'Add Technician'}
              </Button>
            </form>
          </Card>
        </section>
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
