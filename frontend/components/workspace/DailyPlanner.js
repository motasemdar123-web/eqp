'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SystemShell from '../SystemShell';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Field from '../ui/Field';
import Toast from '../ui/Toast';
import EmptyState from '../ui/EmptyState';
import {
  getWorkspaceEngineers,
  getWorkspacePlannerInbox,
  planWorkspacePlannerTask,
  dismissWorkspacePlannerTask,
} from '../../lib/api';

const PLANNER_STORAGE_KEY = 'dar-al-hai-engineering-day-planner-v3';

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix = 'task') {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function loadStorage(key, fallback) {
  if (typeof window === 'undefined') {
    return typeof fallback === 'function' ? fallback() : fallback;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return typeof fallback === 'function' ? fallback() : fallback;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : (typeof fallback === 'function' ? fallback() : fallback);
  } catch {
    return typeof fallback === 'function' ? fallback() : fallback;
  }
}

function saveStorage(key, value) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
}

export default function DailyPlanner() {
  const [plannerData, setPlannerData] = useState(() => ({ tasks: [] }));
  const [taskTitle, setTaskTitle] = useState('');
  const [dueTime, setDueTime] = useState('09:00');
  const [expectedDuration, setExpectedDuration] = useState('30');
  const [priority, setPriority] = useState('P2');
  const [assignedEngineer, setAssignedEngineer] = useState('');
  const [engineers, setEngineers] = useState([]);
  const [incomingTasks, setIncomingTasks] = useState([]);
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'COMPLETED'

  useEffect(() => {
    const stored = loadStorage(PLANNER_STORAGE_KEY, { tasks: [] });
    if (stored && Array.isArray(stored.tasks)) {
      setPlannerData(stored);
    }
  }, []);

  useEffect(() => {
    saveStorage(PLANNER_STORAGE_KEY, plannerData);
  }, [plannerData]);

  useEffect(() => {
    async function loadWorkspaceData() {
      try {
        const [engRes, inboxRes] = await Promise.all([
          getWorkspaceEngineers().catch(() => ({ engineers: [] })),
          getWorkspacePlannerInbox().catch(() => ({ inbox: [] })),
        ]);
        setEngineers(engRes.engineers || []);
        setIncomingTasks(inboxRes.inbox || []);
      } catch {
        // Fallback silently
      }
    }
    loadWorkspaceData();
  }, []);

  function addTask(event) {
    event.preventDefault();
    if (!taskTitle.trim()) return;
    const newTask = {
      id: createId('task'),
      title: taskTitle.trim(),
      dueTime,
      expectedDuration,
      priority,
      assignedEngineer: assignedEngineer || 'Self',
      completed: false,
      createdAt: nowIso(),
    };
    setPlannerData((curr) => ({
      ...curr,
      tasks: [newTask, ...(curr.tasks || [])],
    }));
    setTaskTitle('');
    setToast({ type: 'success', message: 'Task added to schedule.' });
  }

  function toggleTask(id) {
    setPlannerData((curr) => ({
      ...curr,
      tasks: (curr.tasks || []).map((t) => (t.id === id ? { ...t, completed: !t.completed, completedAt: !t.completed ? nowIso() : null } : t)),
    }));
  }

  function deleteTask(id) {
    setPlannerData((curr) => ({
      ...curr,
      tasks: (curr.tasks || []).filter((t) => t.id !== id),
    }));
    setToast({ type: 'info', message: 'Task removed.' });
  }

  async function acceptInboxTask(inboxItem) {
    const newTask = {
      id: createId('inbox-task'),
      title: inboxItem.title || inboxItem.taskTitle || 'Dispatched task',
      dueTime: inboxItem.dueTime || '10:00',
      expectedDuration: inboxItem.expectedDuration || '45',
      priority: inboxItem.priority || 'P1',
      assignedEngineer: inboxItem.assignedTo || 'Me',
      completed: false,
      createdAt: nowIso(),
    };

    setPlannerData((curr) => ({
      ...curr,
      tasks: [newTask, ...(curr.tasks || [])],
    }));

    try {
      if (inboxItem.id) {
        await planWorkspacePlannerTask(inboxItem.id, { plannedTime: newTask.dueTime });
      }
    } catch {
      // Ignore API push failure if offline
    }

    setIncomingTasks((curr) => curr.filter((item) => item.id !== inboxItem.id));
    setToast({ type: 'success', message: `Accepted "${newTask.title}" into schedule.` });
  }

  async function dismissInboxTask(inboxId) {
    try {
      await dismissWorkspacePlannerTask(inboxId);
    } catch {
      // Ignore
    }
    setIncomingTasks((curr) => curr.filter((item) => item.id !== inboxId));
    setToast({ type: 'info', message: 'Dispatched task dismissed.' });
  }

  const allTasks = plannerData.tasks || [];
  const completedTasks = allTasks.filter((t) => t.completed);
  const pendingTasks = allTasks.filter((t) => !t.completed);
  const totalMinutes = allTasks.reduce((acc, t) => acc + Number(t.expectedDuration || 0), 0);
  const pendingMinutes = pendingTasks.reduce((acc, t) => acc + Number(t.expectedDuration || 0), 0);

  const filteredTasks = allTasks.filter((t) => {
    if (filter === 'PENDING') return !t.completed;
    if (filter === 'COMPLETED') return t.completed;
    return true;
  });

  return (
    <SystemShell
      activePath="/management/daily-planner"
      eyebrow="ENGINEERING PRODUCTIVITY"
      title="Daily Schedule Planner"
      description="Plan, sequence, and execute your day's field inspections, workshop tasks, and preventive maintenance work orders with live supervisor dispatch sync."
      actions={
        <div className="flex items-center gap-2">
          <Link href="/workspace" className="ds-button ds-button-secondary ds-button-small">
            Open Whiteboard Canvas
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* KPI Header Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
            <span className="text-xs font-bold uppercase text-slate-400">Completion Rate</span>
            <div className="flex items-baseline justify-between mt-1">
              <p className="text-2xl font-bold text-slate-900">
                {allTasks.length > 0 ? `${Math.round((completedTasks.length / allTasks.length) * 100)}%` : '0%'}
              </p>
              <Badge tone={completedTasks.length === allTasks.length && allTasks.length > 0 ? 'completed' : 'info'}>
                {completedTasks.length} / {allTasks.length} Done
              </Badge>
            </div>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
            <span className="text-xs font-bold uppercase text-slate-400">Remaining Workload</span>
            <div className="flex items-baseline justify-between mt-1">
              <p className="text-2xl font-bold text-blue-600">
                {Math.round((pendingMinutes / 60) * 10) / 10} hrs
              </p>
              <Badge tone="ready">{pendingTasks.length} Pending</Badge>
            </div>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
            <span className="text-xs font-bold uppercase text-slate-400">Total Scheduled Time</span>
            <div className="flex items-baseline justify-between mt-1">
              <p className="text-2xl font-bold text-slate-900">
                {Math.round((totalMinutes / 60) * 10) / 10} hrs
              </p>
              <span className="text-xs font-mono text-slate-500">{totalMinutes} mins</span>
            </div>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
            <span className="text-xs font-bold uppercase text-slate-400">Supervisor Inbox</span>
            <div className="flex items-baseline justify-between mt-1">
              <p className="text-2xl font-bold text-amber-600">{incomingTasks.length}</p>
              <Badge tone={incomingTasks.length > 0 ? 'warning' : 'neutral'}>
                {incomingTasks.length > 0 ? 'Dispatched Tasks' : 'All Clear'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Incoming Dispatched Tasks Banner */}
        {incomingTasks.length > 0 && (
          <Card className="p-5 border-amber-300 bg-amber-50/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-amber-800 font-semibold text-sm">Dispatched Tasks from Supervisor</span>
                <Badge tone="warning" size="sm">{incomingTasks.length} Action Needed</Badge>
              </div>
              <p className="text-xs text-amber-800">Click accept to schedule these into your day.</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {incomingTasks.map((inbox) => (
                <div key={inbox.id} className="p-3 bg-white border border-amber-200 rounded-lg flex items-center justify-between gap-3 shadow-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{inbox.title}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                        {inbox.priority || 'P1'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">
                      Target: {inbox.dueTime || '10:00'} ({inbox.expectedDuration || '30'} mins) — From: {inbox.dispatchedBy || 'Supervisor'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button type="button" size="sm" variant="primary" onClick={() => acceptInboxTask(inbox)}>
                      Accept
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => dismissInboxTask(inbox.id)}>
                      ✕
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Main Grid: Add Task & Task List */}
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          {/* Add Task Card */}
          <Card className="p-5 h-fit space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Add Day Schedule Task</h3>
              <p className="text-xs text-slate-500">Create timed task blocks for your shift.</p>
            </div>

            <form onSubmit={addTask} className="space-y-3.5">
              <Field label="Task Description">
                <input
                  type="text"
                  placeholder="e.g. Inspect DZR-17 hydraulic seals & valve block"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  required
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Target Time">
                  <input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
                </Field>
                <Field label="Duration (Mins)">
                  <input type="number" min="5" step="5" value={expectedDuration} onChange={(e) => setExpectedDuration(e.target.value)} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Priority Level">
                  <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                    <option value="P1">P1 - Critical Breakdown</option>
                    <option value="P2">P2 - High Priority</option>
                    <option value="P3">P3 - Scheduled PM</option>
                    <option value="P4">P4 - Routine Check</option>
                  </select>
                </Field>
                <Field label="Assigned Engineer">
                  <select value={assignedEngineer} onChange={(e) => setAssignedEngineer(e.target.value)}>
                    <option value="">Myself</option>
                    {engineers.map((eng) => (
                      <option key={eng.id || eng.name} value={eng.name}>
                        {eng.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Button type="submit" variant="primary" className="w-full">
                Schedule Task
              </Button>
            </form>

            <div className="pt-2 border-t border-slate-100">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Whiteboard Sync</p>
              <p className="text-xs text-slate-500 mt-1">
                You can also convert asset cards and diagnosis notes directly from the <Link href="/workspace" className="text-blue-600 font-semibold underline">Engineering Whiteboard</Link>.
              </p>
            </div>
          </Card>

          {/* Schedule Task List Card */}
          <Card className="p-5 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Today's Execution Schedule</h3>
                <p className="text-xs text-slate-500">Ordered by target completion time.</p>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  className={`px-3 py-1 rounded font-semibold transition-all ${filter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
                  onClick={() => setFilter('ALL')}
                >
                  All ({allTasks.length})
                </button>
                <button
                  type="button"
                  className={`px-3 py-1 rounded font-semibold transition-all ${filter === 'PENDING' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
                  onClick={() => setFilter('PENDING')}
                >
                  Pending ({pendingTasks.length})
                </button>
                <button
                  type="button"
                  className={`px-3 py-1 rounded font-semibold transition-all ${filter === 'COMPLETED' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
                  onClick={() => setFilter('COMPLETED')}
                >
                  Completed ({completedTasks.length})
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {filteredTasks.map((task) => {
                const isP1 = task.priority === 'P1';
                return (
                  <div
                    key={task.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${task.completed ? 'bg-slate-50/70 border-slate-200 opacity-60' : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'}`}
                  >
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task.id)}
                        className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold block truncate ${task.completed ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                            {task.title}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${isP1 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                            {task.priority || 'P2'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 font-mono">
                          <span>Target: <strong>{task.dueTime}</strong></span>
                          <span>Duration: <strong>{task.expectedDuration} mins</strong></span>
                          {task.assignedEngineer && task.assignedEngineer !== 'Self' && (
                            <span className="text-slate-700 font-sans">{task.assignedEngineer}</span>
                          )}
                        </div>

                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-slate-400 hover:text-red-600"
                        onClick={() => deleteTask(task.id)}
                        title="Delete task"
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                );
              })}

              {filteredTasks.length === 0 && (
                <EmptyState
                  title={filter === 'COMPLETED' ? 'No completed tasks yet' : 'No tasks scheduled'}
                  description="Use the form on the left to schedule new work orders or convert items from the whiteboard."
                />
              )}
            </div>
          </Card>
        </div>
      </div>

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </SystemShell>
  );
}
