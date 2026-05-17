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
};

const statusTone = {
  PLANNED: 'yellow',
  CONFIRMED: 'green',
  ON_DUTY: 'green',
  OFF_DUTY: 'neutral',
  LEAVE: 'red',
  COMPLETED: 'dark',
  CANCELLED: 'red',
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function technicianName(technician) {
  return technician?.user?.fullName || technician?.user?.full_name || technician?.employeeCode || 'Technician';
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
      throw new Error(data.message || data.error || 'Request failed');
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

  useEffect(() => {
    if (!token) return undefined;
    const timer = setTimeout(() => loadBoard(date), 0);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const technicians = board.technicians || [];
  const shifts = board.shifts || [];
  const branches = board.branches || [];

  return (
    <SystemShell
      activePath="/management/scheduling"
      eyebrow="Operations Control"
      title="Scheduling"
      description="Daily roster, shifts, and technician availability planning."
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

        <div className="grid gap-4 md:grid-cols-4">
          {[
            ['Technicians', board.kpis?.technicians || 0],
            ['Scheduled', board.kpis?.scheduledTechnicians || 0],
            ['Available', board.kpis?.availableTechnicians || 0],
            ['Shifts', board.kpis?.shifts || 0],
          ].map(([label, value]) => (
            <Card key={label} className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">{label}</p>
              <p className="mt-2 text-3xl font-black text-zinc-950">{value}</p>
            </Card>
          ))}
        </div>

        <Card className="overflow-hidden">
          <div className="border-b border-zinc-100 px-5 py-4">
            <h2 className="text-xl font-bold text-zinc-950">Technician Roster</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead className="bg-zinc-50 text-xs uppercase tracking-[0.12em] text-zinc-500">
                <tr>
                  <th className="px-5 py-4 text-left">Technician</th>
                  <th className="px-5 py-4 text-left">Shift</th>
                  <th className="px-5 py-4 text-left">Hours</th>
                  <th className="px-5 py-4 text-left">Region</th>
                  <th className="px-5 py-4 text-left">Skills</th>
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid gap-5 xl:grid-cols-2">
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
        </div>
      </section>
    </SystemShell>
  );
}
