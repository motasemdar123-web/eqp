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
  tasks: [],
  history: { tasks: [] },
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

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toISOString().slice(0, 10);
}

function technicianName(technician) {
  return technician?.user?.fullName || technician?.user?.full_name || technician?.employeeCode || 'Technician';
}

function selectedTechnicianSummary(technicians, ids) {
  if (ids.length === 0) return 'No technicians selected';
  return technicians
    .filter((technician) => ids.includes(technician.id))
    .map(technicianName)
    .join(', ');
}

export default function SchedulingPage() {
  const [token] = useState(() => (
    typeof window === 'undefined' ? '' : localStorage.getItem('platformToken') || ''
  ));
  const [date, setDate] = useState(today());
  const [historyFrom, setHistoryFrom] = useState(today());
  const [historyTo, setHistoryTo] = useState(today());
  const [board, setBoard] = useState(emptyBoard);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [taskForm, setTaskForm] = useState({
    technicianIds: [],
    workDate: today(),
    task: '',
    description: '',
    location: '',
    startsAt: '08:00',
    endsAt: '16:00',
    notes: '',
    status: 'CONFIRMED',
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

  async function loadBoard(nextDate = date, nextFrom = historyFrom, nextTo = historyTo) {
    if (!token) return;
    setLoading(true);
    setMessage('');
    try {
      const params = new URLSearchParams({
        date: nextDate,
        historyFrom: nextFrom,
        historyTo: nextTo,
      });
      const data = await request(`/api/scheduling/board?${params.toString()}`);
      setBoard(data.board || emptyBoard);
      setDate(nextDate);
      setHistoryFrom(nextFrom);
      setHistoryTo(nextTo);
      setTaskForm((current) => ({ ...current, workDate: nextDate }));
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  function signInWithMicrosoft() {
    window.location.href = getMicrosoftLoginUrl('/management/scheduling');
  }

  function toggleTechnician(technicianId) {
    setTaskForm((current) => {
      const hasTechnician = current.technicianIds.includes(technicianId);
      return {
        ...current,
        technicianIds: hasTechnician
          ? current.technicianIds.filter((id) => id !== technicianId)
          : [...current.technicianIds, technicianId],
      };
    });
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

  async function saveDailyTask(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await request('/api/scheduling/tasks', {
        method: 'POST',
        body: JSON.stringify(taskForm),
      });
      setMessage('Daily schedule task saved');
      setTaskForm((current) => ({
        ...current,
        technicianIds: [],
        task: '',
        description: '',
        location: '',
        notes: '',
      }));
      await loadBoard(taskForm.workDate, historyFrom, historyTo);
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
  const branches = board.branches || [];
  const tasks = board.tasks || [];
  const historyTasks = board.history?.tasks || [];

  return (
    <SystemShell
      activePath="/management/scheduling"
      eyebrow="Operations Control"
      title="Scheduling"
      description="Build daily technician groups, assign tasks, and review schedule history."
      actions={(
        <>
          <input
            type="date"
            value={date}
            onChange={(event) => loadBoard(event.target.value, historyFrom, historyTo)}
            className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-800"
          />
          <Button type="button" variant="secondary" onClick={() => loadBoard(date, historyFrom, historyTo)} disabled={!token || loading}>
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
            ['Daily Tasks', board.kpis?.dailyTasks || 0],
            ['Assigned Today', board.kpis?.scheduledTechnicians || 0],
            ['Available', board.kpis?.availableTechnicians || 0],
          ].map(([label, value]) => (
            <Card key={label} className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">{label}</p>
              <p className="mt-2 text-3xl font-black text-zinc-950">{value}</p>
            </Card>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
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
            <h2 className="text-xl font-bold text-zinc-950">Add Daily Schedule Task</h2>
            <form onSubmit={saveDailyTask} className="mt-4 grid gap-3">
              <div className="grid gap-3 md:grid-cols-2">
                <input type="date" className="h-11 rounded-md border border-zinc-300 px-3" value={taskForm.workDate} onChange={(event) => setTaskForm((current) => ({ ...current, workDate: event.target.value }))} />
                <input className="h-11 rounded-md border border-zinc-300 px-3" placeholder="Location" value={taskForm.location} onChange={(event) => setTaskForm((current) => ({ ...current, location: event.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="time" className="h-11 rounded-md border border-zinc-300 px-3" value={taskForm.startsAt} onChange={(event) => setTaskForm((current) => ({ ...current, startsAt: event.target.value }))} />
                <input type="time" className="h-11 rounded-md border border-zinc-300 px-3" value={taskForm.endsAt} onChange={(event) => setTaskForm((current) => ({ ...current, endsAt: event.target.value }))} />
              </div>
              <input className="h-11 rounded-md border border-zinc-300 px-3" placeholder="Task" value={taskForm.task} onChange={(event) => setTaskForm((current) => ({ ...current, task: event.target.value }))} />
              <textarea rows={3} className="rounded-md border border-zinc-300 px-3 py-2" placeholder="Description" value={taskForm.description} onChange={(event) => setTaskForm((current) => ({ ...current, description: event.target.value }))} />
              <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-sm font-bold text-zinc-950">Technicians</p>
                <p className="mt-1 text-xs text-zinc-500">{selectedTechnicianSummary(technicians, taskForm.technicianIds)}</p>
                <div className="mt-3 grid max-h-52 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                  {technicians.map((technician) => (
                    <label key={technician.id} className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700">
                      <input type="checkbox" checked={taskForm.technicianIds.includes(technician.id)} onChange={() => toggleTechnician(technician.id)} />
                      <span>{technicianName(technician)} <span className="font-mono text-xs text-zinc-400">{technician.employeeCode}</span></span>
                    </label>
                  ))}
                </div>
              </div>
              <textarea rows={2} className="rounded-md border border-zinc-300 px-3 py-2" placeholder="Notes" value={taskForm.notes} onChange={(event) => setTaskForm((current) => ({ ...current, notes: event.target.value }))} />
              <Button type="submit" disabled={!token || loading}>Save Daily Task</Button>
            </form>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <div className="border-b border-zinc-100 px-5 py-4">
            <h2 className="text-xl font-bold text-zinc-950">Daily Schedule</h2>
          </div>
          <ScheduleTable tasks={tasks} emptyText="No tasks scheduled for this day." />
        </Card>

        <Card className="overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-zinc-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-xl font-bold text-zinc-950">Schedule History</h2>
            <div className="flex flex-wrap items-center gap-2">
              <input type="date" className="h-10 rounded-md border border-zinc-300 px-3 text-sm" value={historyFrom} onChange={(event) => setHistoryFrom(event.target.value)} />
              <input type="date" className="h-10 rounded-md border border-zinc-300 px-3 text-sm" value={historyTo} onChange={(event) => setHistoryTo(event.target.value)} />
              <Button type="button" variant="secondary" onClick={() => loadBoard(date, historyFrom, historyTo)} disabled={!token || loading}>Search</Button>
            </div>
          </div>
          <ScheduleTable tasks={historyTasks} showDate emptyText="No schedule history found for this range." />
        </Card>
      </section>
    </SystemShell>
  );
}

function ScheduleTable({ tasks, showDate = false, emptyText }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px]">
        <thead className="bg-zinc-50 text-xs uppercase tracking-[0.12em] text-zinc-500">
          <tr>
            {showDate && <th className="px-5 py-4 text-left">Date</th>}
            <th className="px-5 py-4 text-left">Time</th>
            <th className="px-5 py-4 text-left">Task</th>
            <th className="px-5 py-4 text-left">Technicians</th>
            <th className="px-5 py-4 text-left">Location</th>
            <th className="px-5 py-4 text-left">Notes</th>
            <th className="px-5 py-4 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 && (
            <tr>
              <td colSpan={showDate ? 7 : 6} className="px-5 py-8 text-center text-sm font-semibold text-zinc-500">{emptyText}</td>
            </tr>
          )}
          {tasks.map((task) => (
            <tr key={task.id} className="border-t border-zinc-100 align-top">
              {showDate && <td className="px-5 py-4 text-sm font-semibold text-zinc-700">{formatDate(task.workDate)}</td>}
              <td className="px-5 py-4 text-sm font-semibold text-zinc-700">{task.startsAt} - {task.endsAt}</td>
              <td className="px-5 py-4">
                <p className="font-bold text-zinc-950">{task.task}</p>
                <p className="mt-1 max-w-md text-sm leading-6 text-zinc-600">{task.description || '-'}</p>
              </td>
              <td className="px-5 py-4">
                <div className="flex flex-wrap gap-1.5">
                  {(task.technicians || []).map((technician) => (
                    <Badge key={technician.id} tone="neutral">{technicianName(technician)}</Badge>
                  ))}
                </div>
              </td>
              <td className="px-5 py-4 text-sm text-zinc-600">{task.location || '-'}</td>
              <td className="px-5 py-4 text-sm text-zinc-600">{task.notes || '-'}</td>
              <td className="px-5 py-4"><Badge tone={statusTone[task.status] || 'neutral'}>{task.status}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
