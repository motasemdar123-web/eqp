'use client';

import { useEffect, useMemo, useState } from 'react';
import SystemShell from '../../../components/SystemShell';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { getMicrosoftLoginUrl } from '../../../lib/api';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'https://eqp-1.onrender.com';

const emptyBoard = {
  kpis: {},
  technicians: [],
  shifts: [],
  branches: [],
  assets: [],
  openRequests: [],
  jobCards: [],
  unscheduledWorkOrders: [],
};

const statusTone = {
  PLANNED: 'yellow',
  CONFIRMED: 'green',
  ON_DUTY: 'green',
  OFF_DUTY: 'neutral',
  LEAVE: 'red',
  COMPLETED: 'dark',
  CANCELLED: 'red',
  ASSIGNED: 'yellow',
  IN_PROGRESS: 'green',
  OPEN: 'neutral',
  WAITING_PARTS: 'red',
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatTime(value) {
  if (!value) return 'Not scheduled';
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

function technicianName(technician) {
  return technician?.user?.fullName || technician?.user?.full_name || technician?.employeeCode || 'Technician';
}

function initialJobCardForm(date) {
  return {
    title: '',
    jobType: 'Corrective Maintenance',
    priority: 'MEDIUM',
    workDate: date,
    startsAt: '09:00',
    endsAt: '11:00',
    requestId: '',
    assetId: '',
    teamLeadTechnicianId: '',
    technicianIds: [],
    customerContact: '',
    estimatedDurationMinutes: '120',
    workScope: '',
    safetyNotes: '',
    requiredTools: '',
    requiredParts: '',
    permitRequired: false,
  };
}

export default function SchedulingPage() {
  const [token] = useState(() => (
    typeof window === 'undefined' ? '' : localStorage.getItem('platformToken') || ''
  ));
  const [date, setDate] = useState(today());
  const [board, setBoard] = useState(emptyBoard);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [scheduleForm, setScheduleForm] = useState({
    technicianId: '',
    shiftId: '',
    branchId: '',
    workDate: today(),
    startsAt: '08:00',
    endsAt: '16:00',
    status: 'CONFIRMED',
    notes: '',
  });
  const [shiftForm, setShiftForm] = useState({
    name: '',
    startsAt: '08:00',
    endsAt: '16:00',
    branchId: '',
  });
  const [jobCardForm, setJobCardForm] = useState(initialJobCardForm(today()));

  const headers = useMemo(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }), [token]);

  async function request(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {}),
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }
    return data;
  }

  async function loadBoard(nextDate = date) {
    if (!token) return;
    setLoading(true);
    setMessage('');
    try {
      const data = await request(`/api/scheduling/board?date=${nextDate}`);
      setBoard(data.board || emptyBoard);
      setDate(nextDate);
      setScheduleForm((current) => ({ ...current, workDate: nextDate }));
      setJobCardForm((current) => ({ ...current, workDate: nextDate }));
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  function signInWithMicrosoft() {
    window.location.href = getMicrosoftLoginUrl('/management/scheduling');
  }

  async function saveShift(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await request('/api/shifts', {
        method: 'POST',
        body: JSON.stringify({
          ...shiftForm,
          branchId: shiftForm.branchId || null,
        }),
      });
      setShiftForm({ name: '', startsAt: '08:00', endsAt: '16:00', branchId: '' });
      setMessage('Shift saved');
      await loadBoard();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveTechnicianSchedule(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await request('/api/scheduling/technician-schedules', {
        method: 'POST',
        body: JSON.stringify({
          ...scheduleForm,
          shiftId: scheduleForm.shiftId || null,
          branchId: scheduleForm.branchId || null,
        }),
      });
      setMessage('Technician schedule saved');
      await loadBoard(scheduleForm.workDate);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function createJobCard(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await request('/api/scheduling/job-cards', {
        method: 'POST',
        body: JSON.stringify({
          ...jobCardForm,
          requestId: jobCardForm.requestId || null,
          assetId: jobCardForm.assetId || null,
          teamLeadTechnicianId: jobCardForm.teamLeadTechnicianId || null,
          estimatedDurationMinutes: Number(jobCardForm.estimatedDurationMinutes) || null,
        }),
      });
      setJobCardForm(initialJobCardForm(jobCardForm.workDate));
      setMessage('Job card created');
      await loadBoard(jobCardForm.workDate);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) return undefined;
    const timer = setTimeout(() => loadBoard(date), 0);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const technicians = board.technicians || [];
  const shifts = board.shifts || [];
  const branches = board.branches || [];
  const jobCards = board.jobCards || [];

  return (
    <SystemShell
      activePath="/management/scheduling"
      eyebrow="Operations Control"
      title="Scheduling & Job Cards"
      description="Daily roster, shifts, job cards, team assignments, and workload control."
      actions={(
        <>
          <input
            type="date"
            value={date}
            onChange={(event) => loadBoard(event.target.value)}
            className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-800"
          />
          <Button type="button" variant="secondary" onClick={() => loadBoard(date)} disabled={!token || loading}>
            Refresh
          </Button>
        </>
      )}
    >
      <section className="grid gap-5">
        {!token && (
          <Card className="p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-sm font-semibold text-zinc-700">Sign in with your Microsoft account to manage scheduling.</p>
              <Button type="button" onClick={signInWithMicrosoft}>Continue with Microsoft</Button>
            </div>
          </Card>
        )}

        {message && (
          <div className="rounded-md border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700">
            {message}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-5">
          {[
            ['Technicians', board.kpis?.technicians || 0],
            ['Scheduled', board.kpis?.scheduledTechnicians || 0],
            ['Available', board.kpis?.availableTechnicians || 0],
            ['Job Cards', board.kpis?.jobCards || 0],
            ['Unscheduled', board.kpis?.unscheduledWorkOrders || 0],
          ].map(([label, value]) => (
            <Card key={label} className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">{label}</p>
              <p className="mt-2 text-3xl font-black text-zinc-950">{value}</p>
            </Card>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
          <Card className="overflow-hidden">
            <div className="border-b border-zinc-100 px-5 py-4">
              <h2 className="text-xl font-bold text-zinc-950">Technician Roster</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px]">
                <thead className="bg-zinc-50 text-xs uppercase tracking-[0.12em] text-zinc-500">
                  <tr>
                    <th className="px-5 py-4 text-left">Technician</th>
                    <th className="px-5 py-4 text-left">Shift</th>
                    <th className="px-5 py-4 text-left">Hours</th>
                    <th className="px-5 py-4 text-left">Region</th>
                    <th className="px-5 py-4 text-left">Skills</th>
                    <th className="px-5 py-4 text-left">Workload</th>
                  </tr>
                </thead>
                <tbody>
                  {technicians.map((technician) => {
                    const schedule = technician.schedules?.[0];
                    return (
                      <tr key={technician.id} className="border-t border-zinc-100 align-top">
                        <td className="px-5 py-4">
                          <p className="font-bold text-zinc-950">{technicianName(technician)}</p>
                          <p className="mt-1 font-mono text-xs text-zinc-500">{technician.employeeCode}</p>
                        </td>
                        <td className="px-5 py-4">
                          <Badge tone={statusTone[schedule?.status] || 'neutral'}>{schedule?.status || 'NO_SCHEDULE'}</Badge>
                          <p className="mt-2 text-sm text-zinc-600">{schedule?.shift?.name || technician.shift?.name || 'Unassigned'}</p>
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-zinc-700">
                          {schedule ? `${schedule.startsAt} - ${schedule.endsAt}` : '-'}
                        </td>
                        <td className="px-5 py-4 text-sm text-zinc-600">{technician.region || '-'}</td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {(technician.skills || []).slice(0, 3).map((skill) => (
                              <Badge key={skill.id} tone="neutral">{skill.skill}</Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-zinc-800">
                          {technician.assignments?.length || 0} cards
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-xl font-bold text-zinc-950">Daily Job Cards</h2>
            <div className="mt-4 grid gap-3">
              {jobCards.length === 0 && <p className="text-sm text-zinc-500">No job cards for this date.</p>}
              {jobCards.map((card) => (
                <div key={card.id} className="rounded-md border border-zinc-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs text-zinc-500">{card.workOrderNumber}</p>
                      <h3 className="mt-1 font-bold text-zinc-950">{card.title}</h3>
                    </div>
                    <Badge tone={statusTone[card.status] || 'neutral'}>{card.status}</Badge>
                  </div>
                  <p className="mt-3 text-sm text-zinc-600">{formatTime(card.scheduledStartAt)} - {formatTime(card.scheduledEndAt)}</p>
                  <p className="mt-2 text-sm text-zinc-700">{card.workScope || card.description || 'No scope entered'}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(card.assignments || []).map((assignment) => (
                      <Badge key={assignment.id} tone="yellow">{technicianName(assignment.technician)}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          <Card className="p-5">
            <h2 className="text-xl font-bold text-zinc-950">Add Shift</h2>
            <form onSubmit={saveShift} className="mt-4 grid gap-3">
              <input className="h-11 rounded-md border border-zinc-300 px-3" placeholder="Shift name" value={shiftForm.name} onChange={(event) => setShiftForm((current) => ({ ...current, name: event.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <input type="time" className="h-11 rounded-md border border-zinc-300 px-3" value={shiftForm.startsAt} onChange={(event) => setShiftForm((current) => ({ ...current, startsAt: event.target.value }))} />
                <input type="time" className="h-11 rounded-md border border-zinc-300 px-3" value={shiftForm.endsAt} onChange={(event) => setShiftForm((current) => ({ ...current, endsAt: event.target.value }))} />
              </div>
              <select className="h-11 rounded-md border border-zinc-300 px-3" value={shiftForm.branchId} onChange={(event) => setShiftForm((current) => ({ ...current, branchId: event.target.value }))}>
                <option value="">All branches</option>
                {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
              </select>
              <Button type="submit" disabled={!token || loading}>Save Shift</Button>
            </form>
          </Card>

          <Card className="p-5">
            <h2 className="text-xl font-bold text-zinc-950">Add Technician Schedule</h2>
            <form onSubmit={saveTechnicianSchedule} className="mt-4 grid gap-3">
              <select className="h-11 rounded-md border border-zinc-300 px-3" value={scheduleForm.technicianId} onChange={(event) => setScheduleForm((current) => ({ ...current, technicianId: event.target.value }))}>
                <option value="">Technician</option>
                {technicians.map((technician) => <option key={technician.id} value={technician.id}>{technicianName(technician)} - {technician.employeeCode}</option>)}
              </select>
              <select className="h-11 rounded-md border border-zinc-300 px-3" value={scheduleForm.shiftId} onChange={(event) => {
                const shift = shifts.find((item) => item.id === event.target.value);
                setScheduleForm((current) => ({
                  ...current,
                  shiftId: event.target.value,
                  startsAt: shift?.startsAt || current.startsAt,
                  endsAt: shift?.endsAt || current.endsAt,
                }));
              }}>
                <option value="">Shift</option>
                {shifts.map((shift) => <option key={shift.id} value={shift.id}>{shift.name} ({shift.startsAt}-{shift.endsAt})</option>)}
              </select>
              <input type="date" className="h-11 rounded-md border border-zinc-300 px-3" value={scheduleForm.workDate} onChange={(event) => setScheduleForm((current) => ({ ...current, workDate: event.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <input type="time" className="h-11 rounded-md border border-zinc-300 px-3" value={scheduleForm.startsAt} onChange={(event) => setScheduleForm((current) => ({ ...current, startsAt: event.target.value }))} />
                <input type="time" className="h-11 rounded-md border border-zinc-300 px-3" value={scheduleForm.endsAt} onChange={(event) => setScheduleForm((current) => ({ ...current, endsAt: event.target.value }))} />
              </div>
              <select className="h-11 rounded-md border border-zinc-300 px-3" value={scheduleForm.status} onChange={(event) => setScheduleForm((current) => ({ ...current, status: event.target.value }))}>
                {['PLANNED', 'CONFIRMED', 'ON_DUTY', 'OFF_DUTY', 'LEAVE', 'COMPLETED', 'CANCELLED'].map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
              <textarea rows={3} className="rounded-md border border-zinc-300 px-3 py-2" placeholder="Schedule notes" value={scheduleForm.notes} onChange={(event) => setScheduleForm((current) => ({ ...current, notes: event.target.value }))} />
              <Button type="submit" disabled={!token || loading}>Save Schedule</Button>
            </form>
          </Card>

          <Card className="p-5">
            <h2 className="text-xl font-bold text-zinc-950">Create Job Card</h2>
            <form onSubmit={createJobCard} className="mt-4 grid gap-3">
              <input className="h-11 rounded-md border border-zinc-300 px-3" placeholder="Job card title" value={jobCardForm.title} onChange={(event) => setJobCardForm((current) => ({ ...current, title: event.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <select className="h-11 rounded-md border border-zinc-300 px-3" value={jobCardForm.jobType} onChange={(event) => setJobCardForm((current) => ({ ...current, jobType: event.target.value }))}>
                  {['Corrective Maintenance', 'Preventive Maintenance', 'Inspection', 'Emergency', 'Project Support'].map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
                <select className="h-11 rounded-md border border-zinc-300 px-3" value={jobCardForm.priority} onChange={(event) => setJobCardForm((current) => ({ ...current, priority: event.target.value }))}>
                  {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input type="date" className="h-11 rounded-md border border-zinc-300 px-3" value={jobCardForm.workDate} onChange={(event) => setJobCardForm((current) => ({ ...current, workDate: event.target.value }))} />
                <input type="time" className="h-11 rounded-md border border-zinc-300 px-3" value={jobCardForm.startsAt} onChange={(event) => setJobCardForm((current) => ({ ...current, startsAt: event.target.value }))} />
                <input type="time" className="h-11 rounded-md border border-zinc-300 px-3" value={jobCardForm.endsAt} onChange={(event) => setJobCardForm((current) => ({ ...current, endsAt: event.target.value }))} />
              </div>
              <select className="h-11 rounded-md border border-zinc-300 px-3" value={jobCardForm.assetId} onChange={(event) => setJobCardForm((current) => ({ ...current, assetId: event.target.value }))}>
                <option value="">Asset</option>
                {(board.assets || []).map((asset) => <option key={asset.id} value={asset.id}>{asset.assetCode} - {asset.name}</option>)}
              </select>
              <select className="h-11 rounded-md border border-zinc-300 px-3" value={jobCardForm.teamLeadTechnicianId} onChange={(event) => setJobCardForm((current) => ({ ...current, teamLeadTechnicianId: event.target.value }))}>
                <option value="">Team lead</option>
                {technicians.map((technician) => <option key={technician.id} value={technician.id}>{technicianName(technician)}</option>)}
              </select>
              <select multiple className="min-h-28 rounded-md border border-zinc-300 px-3 py-2" value={jobCardForm.technicianIds} onChange={(event) => setJobCardForm((current) => ({ ...current, technicianIds: Array.from(event.target.selectedOptions).map((option) => option.value) }))}>
                {technicians.map((technician) => <option key={technician.id} value={technician.id}>{technicianName(technician)} - {technician.employeeCode}</option>)}
              </select>
              <textarea rows={3} className="rounded-md border border-zinc-300 px-3 py-2" placeholder="Task scope" value={jobCardForm.workScope} onChange={(event) => setJobCardForm((current) => ({ ...current, workScope: event.target.value }))} />
              <textarea rows={2} className="rounded-md border border-zinc-300 px-3 py-2" placeholder="Safety notes" value={jobCardForm.safetyNotes} onChange={(event) => setJobCardForm((current) => ({ ...current, safetyNotes: event.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <input className="h-11 rounded-md border border-zinc-300 px-3" placeholder="Required tools" value={jobCardForm.requiredTools} onChange={(event) => setJobCardForm((current) => ({ ...current, requiredTools: event.target.value }))} />
                <input className="h-11 rounded-md border border-zinc-300 px-3" placeholder="Required parts" value={jobCardForm.requiredParts} onChange={(event) => setJobCardForm((current) => ({ ...current, requiredParts: event.target.value }))} />
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <input className="h-11 rounded-md border border-zinc-300 px-3" placeholder="Customer contact" value={jobCardForm.customerContact} onChange={(event) => setJobCardForm((current) => ({ ...current, customerContact: event.target.value }))} />
                <label className="flex h-11 items-center gap-2 rounded-md border border-zinc-300 px-3 text-sm font-semibold text-zinc-700">
                  <input type="checkbox" checked={jobCardForm.permitRequired} onChange={(event) => setJobCardForm((current) => ({ ...current, permitRequired: event.target.checked }))} />
                  Permit
                </label>
              </div>
              <Button type="submit" disabled={!token || loading}>Create Job Card</Button>
            </form>
          </Card>
        </div>
      </section>
    </SystemShell>
  );
}
