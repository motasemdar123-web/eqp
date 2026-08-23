'use client';

import { useEffect, useMemo, useState } from 'react';
import SystemShell from '../../../components/SystemShell';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';
import Skeleton from '../../../components/ui/Skeleton';
import Toast from '../../../components/ui/Toast';
import { createTechnician, deleteTechnician, getShifts, getTechnicians, updateTechnician, getGovernanceAnalytics } from '../../../lib/api';
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
  const [token, setToken] = useState('');
  const [sessionChecked, setSessionChecked] = useState(false);
  const [technicians, setTechnicians] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [availabilityFilter, setAvailabilityFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Sub-tabs
  const [activeTab, setActiveTab] = useState('roster'); // 'roster' | 'skills' | 'infractions'
  const [governanceData, setGovernanceData] = useState({ technicianSkills: [], technicianInfractions: [] });

  async function loadData() {
    if (!token) return;

    try {
      setLoading(true);
      const [techniciansResponse, shiftsResponse, govResponse] = await Promise.all([
        getTechnicians(),
        getShifts(),
        getGovernanceAnalytics().catch(() => ({ data: {} })),
      ]);
      setTechnicians(techniciansResponse.technicians || []);
      setShifts(shiftsResponse.shifts || []);
      setGovernanceData(govResponse.data || { technicianSkills: [], technicianInfractions: [] });
    } catch (loadError) {
      setToast({ type: 'error', message: loadError.message || 'Failed to load technicians.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setToken(getStoredPlatformSession()?.token || '');
      setSessionChecked(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!sessionChecked) return undefined;
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
    shifts: shifts.length,
  }), [technicians, shifts]);

  function startCreate() {
    setSelectedTechnicianId('');
    setForm(emptyForm);
  }

  function startEdit(technician) {
    setSelectedTechnicianId(technician.id);
    setForm(formFromTechnician(technician));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function saveTechnician(event) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    try {
      const payload = payloadFromForm(form);

      if (selectedTechnician) {
        await updateTechnician(selectedTechnician.id, payload);
        setToast({ type: 'success', message: 'Technician details updated successfully.' });
      } else {
        await createTechnician(payload);
        setToast({ type: 'success', message: 'New technician added to roster.' });
        setForm(emptyForm);
      }

      await loadData();
    } catch (saveError) {
      setToast({ type: 'error', message: saveError.message || 'Failed to save technician.' });
    } finally {
      setSaving(false);
    }
  }

  async function toggleAvailability(technician) {
    const nextState = !technician.isAvailable;
    setSaving(true);
    try {
      await updateTechnician(technician.id, { isAvailable: nextState });
      setToast({
        type: 'info',
        message: `${technicianName(technician)} marked ${nextState ? 'available' : 'unavailable'}.`,
      });
      await loadData();
    } catch (updateError) {
      setToast({ type: 'error', message: updateError.message || 'Failed to update availability.' });
    } finally {
      setSaving(false);
    }
  }

  async function removeTechnician(technician) {
    const name = technicianName(technician);
    const confirmed = window.confirm(`Delete ${name} from Technicians Management? Existing schedule records will be preserved.`);
    if (!confirmed) return;

    setSaving(true);
    try {
      await deleteTechnician(technician.id);
      if (selectedTechnicianId === technician.id) startCreate();
      setToast({ type: 'success', message: `${name} deleted from active roster.` });
      await loadData();
    } catch (deleteError) {
      setToast({ type: 'error', message: deleteError.message || 'Failed to delete technician.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <SystemShell
      activePath="/management/technicians"
      eyebrow="Operations Control"
      title="Technicians Management"
      description="Manage field service technicians, duty availability, shifts, assigned regions, and dispatch skills."
      actions={
        <Button type="button" variant="secondary" onClick={loadData} disabled={loading || saving}>
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </Button>
      }
    >
      <div className="space-y-6">
        {/* KPI Metrics */}
        <section className="ds-kpi-grid">
          <article className="ds-kpi-card">
            <div className="ds-icon-tile">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="ds-kpi-content">
              <div className="ds-kpi-head">
                <p className="ds-kpi-label">Roster</p>
                <Badge tone="live">Live</Badge>
              </div>
              <p className="ds-kpi-main">{stats.total}</p>
              <p className="ds-kpi-descriptor">Registered Staff</p>
            </div>
          </article>

          <article className="ds-kpi-card">
            <div className="ds-icon-tile ds-icon-tile-accent">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ds-kpi-content">
              <div className="ds-kpi-head">
                <p className="ds-kpi-label">Available</p>
                <Badge tone="ready">Ready</Badge>
              </div>
              <p className="ds-kpi-main">{stats.available}</p>
              <p className="ds-kpi-descriptor">Dispatch Ready</p>
            </div>
          </article>

          <article className="ds-kpi-card">
            <div className="ds-icon-tile">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ds-kpi-content">
              <div className="ds-kpi-head">
                <p className="ds-kpi-label">Unavailable</p>
                <Badge tone="pending">Off-Duty</Badge>
              </div>
              <p className="ds-kpi-main">{stats.unavailable}</p>
              <p className="ds-kpi-descriptor">Exceptions / Leave</p>
            </div>
          </article>

          <article className="ds-kpi-card">
            <div className="ds-icon-tile ds-icon-tile-accent">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ds-kpi-content">
              <div className="ds-kpi-head">
                <p className="ds-kpi-label">Shifts</p>
                <Badge tone="info">Active</Badge>
              </div>
              <p className="ds-kpi-main">{stats.shifts}</p>
              <p className="ds-kpi-descriptor">Shift Schedules</p>
            </div>
          </article>
        </section>

        {/* Sub-tabs Selector Ribbon */}
        <section className="ds-card p-1.5 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setActiveTab('roster')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'roster'
                  ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="text-base">👥</span>
              <span>Roster & Shift Assignment</span>
            </button>

            <button
              onClick={() => setActiveTab('skills')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'skills'
                  ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="text-base">🎓</span>
              <span>Skills Matrix & Authorizations</span>
            </button>

            <button
              onClick={() => setActiveTab('infractions')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'infractions'
                  ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="text-base">⚠️</span>
              <span>Quality & Disciplinary Audit Log</span>
            </button>
          </div>
        </section>

        {/* TAB 1: ROSTER & PROFILES */}
        {activeTab === 'roster' && (
        <section className="grid gap-6 xl:grid-cols-[1fr_400px]">
          {/* Technicians Table Card */}
          <Card className="overflow-hidden">
            <div className="border-b border-slate-200 p-5 bg-slate-50/60">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Search by name, code, email, region..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="ds-input pl-9"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={availabilityFilter}
                    onChange={(event) => setAvailabilityFilter(event.target.value)}
                    className="ds-input min-w-[140px]"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="AVAILABLE">Available Only</option>
                    <option value="UNAVAILABLE">Unavailable Only</option>
                  </select>

                  <Button type="button" onClick={startCreate}>
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    New
                  </Button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="grid gap-3 p-6">
                <Skeleton className="h-16 rounded-xl" />
                <Skeleton className="h-16 rounded-xl" />
                <Skeleton className="h-16 rounded-xl" />
              </div>
            ) : filteredTechnicians.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="No technicians found"
                  description="No roster records match your search filters."
                  action={<Button variant="secondary" onClick={startCreate}>Add New Technician</Button>}
                />
              </div>
            ) : (
              <div className="ds-table-wrap">
                <table className="ds-table">
                  <thead>
                    <tr>
                      <th>Technician</th>
                      <th>Status</th>
                      <th>Shift</th>
                      <th>Region</th>
                      <th>Skills</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTechnicians.map((technician) => (
                      <tr key={technician.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 font-bold text-xs text-slate-700">
                              {technicianName(technician).slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 leading-snug">{technicianName(technician)}</p>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                                <span className="font-mono font-medium text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/60">
                                  {technician.employeeCode}
                                </span>
                                <span className="truncate max-w-[150px]">{technician.user?.email}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <Badge tone={technician.isAvailable ? 'active' : 'critical'}>
                            {technician.isAvailable ? 'Available' : 'Unavailable'}
                          </Badge>
                        </td>
                        <td className="text-xs font-medium text-slate-700">{technician.shift?.name || 'Standard'}</td>
                        <td className="text-xs text-slate-600">{technician.region || 'All Regions'}</td>
                        <td>
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {(technician.skills || []).slice(0, 3).map((skill) => (
                              <span key={skill.id} className="inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[0.6875rem] font-medium text-slate-600">
                                {skill.skill}
                              </span>
                            ))}
                            {(technician.skills || []).length > 3 && (
                              <span className="text-[0.6875rem] text-slate-400 font-medium">
                                +{(technician.skills || []).length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <Button type="button" variant="secondary" size="sm" onClick={() => startEdit(technician)}>
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant={technician.isAvailable ? 'ghost' : 'secondary'}
                              size="sm"
                              onClick={() => toggleAvailability(technician)}
                              disabled={saving}
                            >
                              {technician.isAvailable ? 'Off-Duty' : 'Set Active'}
                            </Button>
                            <Button
                              type="button"
                              variant="danger"
                              size="sm"
                              onClick={() => removeTechnician(technician)}
                              disabled={saving}
                            >
                              Delete
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

          {/* Add / Edit Technician Form Drawer */}
          <Card className="p-6 h-fit">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-600">
                  {selectedTechnician ? 'Edit Record' : 'New Registration'}
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  {selectedTechnician ? technicianName(selectedTechnician) : 'Add Technician'}
                </h2>
              </div>
              {selectedTechnician && (
                <Button type="button" variant="ghost" size="sm" onClick={startCreate}>
                  Cancel
                </Button>
              )}
            </div>

            <form onSubmit={saveTechnician} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  required
                  className="ds-input"
                  placeholder="e.g. Tariq Al-Mansoor"
                  value={form.fullName}
                  onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company Email *</label>
                <input
                  required
                  type="email"
                  className="ds-input"
                  placeholder="technician@daralhai.com"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">User No.</label>
                  <input
                    type="number"
                    className="ds-input"
                    placeholder="101"
                    value={form.userNumber}
                    onChange={(event) => setForm((current) => ({ ...current, userNumber: event.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Employee Code *</label>
                  <input
                    required
                    className="ds-input uppercase"
                    placeholder="TEST-1015"
                    value={form.employeeCode}
                    onChange={(event) => setForm((current) => ({ ...current, employeeCode: event.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    className="ds-input"
                    placeholder="+966 5..."
                    value={form.phone}
                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Region</label>
                  <input
                    className="ds-input"
                    placeholder="Riyadh / Eastern"
                    value={form.region}
                    onChange={(event) => setForm((current) => ({ ...current, region: event.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Shift</label>
                <select
                  className="ds-input"
                  value={form.shiftId}
                  onChange={(event) => setForm((current) => ({ ...current, shiftId: event.target.value }))}
                >
                  <option value="">Default Working Hours (08:00 - 16:00)</option>
                  {shifts.map((shift) => (
                    <option key={shift.id} value={shift.id}>
                      {shift.name} ({shift.startsAt} - {shift.endsAt})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Skills (Comma-separated)</label>
                <textarea
                  rows={2}
                  className="ds-input"
                  placeholder="Hydraulics, Engine Overhaul, Transmission, Electrical"
                  value={form.skills}
                  onChange={(event) => setForm((current) => ({ ...current, skills: event.target.value }))}
                />
              </div>

              <div className="pt-2">
                <label className="ds-check-row">
                  <input
                    type="checkbox"
                    checked={form.isAvailable}
                    onChange={(event) => setForm((current) => ({ ...current, isAvailable: event.target.checked }))}
                  />
                  <span>Available for immediate dispatch</span>
                </label>
              </div>

              <Button type="submit" fullWidth disabled={saving}>
                {saving ? 'Saving...' : (selectedTechnician ? 'Update Technician' : 'Add Technician to Roster')}
              </Button>
            </form>
          </Card>
        </section>
        )}

        {/* TAB 2: SKILLS & PROFICIENCY MATRIX */}
        {activeTab === 'skills' && (
          <Card className="p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎓</span>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Technicians Skills & Authorizations Matrix
                  </h2>
                  <Badge tone="live">Certified Matrix</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track technical competencies, equipment operational authorizations, and tool proficiencies.
                </p>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs border-collapse min-w-[850px]">
                <thead className="bg-slate-100 dark:bg-slate-800">
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Technician</th>
                    <th className="py-2.5 px-2 text-center">Crane</th>
                    <th className="py-2.5 px-2 text-center">Pumps</th>
                    <th className="py-2.5 px-2 text-center">Charger</th>
                    <th className="py-2.5 px-2 text-center">Compressor</th>
                    <th className="py-2.5 px-2 text-center">Generator</th>
                    <th className="py-2.5 px-2 text-center">Grinder</th>
                    <th className="py-2.5 px-2 text-center">Press</th>
                    <th className="py-2.5 px-2 text-center">Driller</th>
                    <th className="py-2.5 px-2 text-center">Oxy-Cut</th>
                    <th className="py-2.5 px-3 text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                  {(governanceData.technicianSkills || []).map((t, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-sans font-bold text-slate-900 dark:text-white">
                        {t.technicianName}
                      </td>
                      {['Crane Training', 'Pumps operation', 'Battery charger', 'Compressor', 'Generator', 'Grinder', 'Hydraulic Press', 'Driller', 'Oxy-Acetylene cutting'].map((skillKey) => {
                        const hasSkill = t.skills?.[skillKey];
                        return (
                          <td key={skillKey} className="py-2.5 px-2 text-center">
                            {hasSkill ? (
                              <span className="inline-block w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold text-xs leading-5 shadow-xs">
                                ✓
                              </span>
                            ) : (
                              <span className="inline-block w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs leading-5">
                                -
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td className="py-2.5 px-3 text-right">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
                          {t.certifiedCount} / 9
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* TAB 3: DISCIPLINARY & QUALITY LOG */}
        {activeTab === 'infractions' && (
          <Card className="p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚠️</span>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Quality, Safety & Disciplinary Infraction Log
                  </h2>
                  <Badge tone="live">Supervision Audit</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Incident documentation, workshop policy compliance, and supervisor corrective notices.
                </p>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800">
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Technician</th>
                    <th className="py-2.5 px-3">Infraction Category</th>
                    <th className="py-2.5 px-3">Supervisor Notes & Remarks</th>
                    <th className="py-2.5 px-3 text-right">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                  {(governanceData.technicianInfractions || []).map((inf, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono text-slate-500">{inf.date}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{inf.technicianName}</td>
                      <td className="py-2.5 px-3 text-amber-600 dark:text-amber-400 font-semibold">{inf.type}</td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 max-w-md">{inf.comments}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            inf.severity === 'HIGH'
                              ? 'bg-rose-100 text-rose-700'
                              : inf.severity === 'MEDIUM'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {inf.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

    </SystemShell>
  );
}
