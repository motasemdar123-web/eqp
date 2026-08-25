'use client';

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from 'react';
import SystemShell from '../../../components/SystemShell';
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Input, { Textarea, Select, Label } from '../../../components/ui/Input';
import Field from '../../../components/ui/Field';
import PageHeader from '../../../components/ui/PageHeader';
import SectionHeader from '../../../components/ui/SectionHeader';
import MetricCard from '../../../components/ui/MetricCard';
import EmptyState from '../../../components/ui/EmptyState';
import Toast from '../../../components/ui/Toast';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import { getMicrosoftLoginUrl } from '../../../lib/api';
import { getTaskDisplayStatus } from '../../../lib/taskDisplay';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'https://eqp-1.onrender.com';
const APP_TIME_ZONE = 'Asia/Riyadh';

const TIMELINE_START_HOUR = 6; // 06:00
const TIMELINE_END_HOUR = 20;   // 20:00
const TIMELINE_TOTAL_HOURS = TIMELINE_END_HOUR - TIMELINE_START_HOUR; // 14 hours

const emptyBoard = {
  kpis: {},
  technicians: [],
  tasks: [],
  history: { tasks: [] },
};

const emptyManualAssistant = {
  phase: 'idle',
  options: [],
  selectedIds: [],
  context: null,
  error: '',
};

function today() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function addDays(dateText, amount) {
  const value = new Date(`${dateText}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toISOString().slice(0, 10);
}

function formatDayHeader(value) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function technicianName(technician) {
  return technician?.user?.fullName || technician?.user?.full_name || technician?.employeeCode || 'Technician';
}

function newChecklistItem(index) {
  return { id: `point-${index + 1}`, text: '', required: true };
}

function normalizeChecklistForForm(checklist) {
  const items = Array.isArray(checklist) ? checklist : [];
  const normalized = items
    .map((item, index) => ({
      id: String(item?.id || `point-${index + 1}`),
      text: String(item?.text || item?.title || item || ''),
      required: item?.required === false ? false : true,
    }))
    .filter((item) => item.text.trim());

  return normalized.length ? normalized : [newChecklistItem(0)];
}

function normalizeChecklistForSave(checklist) {
  return normalizeChecklistForForm(checklist)
    .map((item, index) => ({
      id: item.id || `point-${index + 1}`,
      text: item.text.trim(),
      required: item.required !== false,
    }))
    .filter((item) => item.text);
}

function isTechnicianSchedulable(technician) {
  if (!technician?.isAvailable) return false;
  const scheduleStatus = technician.schedules?.[0]?.status;
  return !scheduleStatus || ['PLANNED', 'CONFIRMED', 'ON_DUTY'].includes(scheduleStatus);
}

function emptyTaskForm(workDate = today()) {
  return {
    technicianIds: [],
    workDate,
    task: '',
    description: '',
    checklist: [{ id: 'point-1', text: '', required: true }],
    machineModel: 'PC400-8R',
    manualAdvice: null,
    location: 'Desire Site',
    startsAt: '08:00',
    endsAt: '16:00',
    notes: '',
    status: 'CONFIRMED',
  };
}

function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 480; // 08:00 default
  const parts = String(timeStr).split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

function statusTone(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized.includes('complete') || normalized.includes('done')) return 'completed';
  if (normalized.includes('cancel') || normalized.includes('critical') || normalized.includes('overdue')) return 'critical';
  if (normalized.includes('plan') || normalized.includes('pending') || normalized.includes('progress')) return 'pending';
  if (normalized.includes('confirm') || normalized.includes('active') || normalized.includes('live')) return 'active';
  return 'neutral';
}

export default function DispatchAndSchedulingPage() {
  const initialToday = useMemo(() => today(), []);
  const [token, setToken] = useState('');
  const [date, setDate] = useState(initialToday);
  const [historyFrom, setHistoryFrom] = useState(() => addDays(initialToday, -7));
  const [historyTo, setHistoryTo] = useState(initialToday);
  const [board, setBoard] = useState(emptyBoard);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [viewTab, setViewTab] = useState('timeline'); // 'timeline' | 'table' | 'manuals'

  // Task Drawer & Editing
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState('');
  const [taskForm, setTaskForm] = useState(() => emptyTaskForm(initialToday));
  const [techSearch, setTechSearch] = useState('');
  const [viewingTask, setViewingTask] = useState(null);


  // Shop Manuals state
  const [manualUpload, setManualUpload] = useState({
    machineModel: '',
    title: '',
    manualType: 'Disassembly and Assembly',
    serialRange: '',
    revision: '',
    language: 'en',
    file: null,
  });
  const [manuals, setManuals] = useState([]);
  const [manualBusy, setManualBusy] = useState(false);
  const [manualAssistant, setManualAssistant] = useState(emptyManualAssistant);

  const headers = useMemo(
    () => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  async function request(path, options = {}) {
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...(isFormData ? {} : headers),
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || data.error || 'Scheduling request failed');
    }
    return data;
  }

  function signInWithMicrosoft() {
    window.location.href = getMicrosoftLoginUrl('/management/scheduling');
  }

  async function loadBoard(selectedDate = date, from = historyFrom, to = historyTo) {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        date: selectedDate,
        historyFrom: from,
        historyTo: to,
      });

      const data = await request(`/api/scheduling/board?${params.toString()}`);
      let technicians = data.board?.technicians || [];
      if (!technicians.length) {
        try {
          const technicianData = await request('/api/technicians');
          technicians = technicianData.technicians || [];
        } catch {
          // ignore fallback error
        }
      }

      setBoard({
        kpis: data.board?.kpis || {},
        technicians,
        tasks: data.board?.tasks || [],
        history: data.board?.history || { tasks: [] },
      });
      setDate(selectedDate);
      setHistoryFrom(from);
      setHistoryTo(to);
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Failed to load scheduling board.' });
    } finally {
      setLoading(false);
    }
  }

  async function loadManuals() {
    if (!token) return;
    try {
      const data = await request('/api/shop-manuals');
      setManuals(data.manuals || []);
    } catch {
      // Non-blocking
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setToken(localStorage.getItem('platformToken') || '');
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!token) return undefined;
    const timer = setTimeout(() => {
      loadBoard(date);
      loadManuals();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function openCreateDrawer(techId = null, startTime = '08:00') {
    setEditingTaskId('');
    const form = emptyTaskForm(date);
    if (techId) {
      form.technicianIds = [techId];
    }
    form.startsAt = startTime;
    setTaskForm(form);
    setManualAssistant(emptyManualAssistant);
    setIsDrawerOpen(true);
  }

  function openEditDrawer(task) {
    setEditingTaskId(task.id);
    setTaskForm({
      technicianIds: (task.technicians || []).map((t) => t.id),
      workDate: formatDate(task.workDate),
      task: task.task || '',
      description: task.description || '',
      checklist: normalizeChecklistForForm(task.checklist),
      machineModel: task.machineModel || '',
      manualAdvice: task.manualAdvice || null,
      location: task.location || '',
      startsAt: task.startsAt || '08:00',
      endsAt: task.endsAt || '16:00',
      notes: task.notes || '',
      status: task.status || 'CONFIRMED',
    });
    setManualAssistant(emptyManualAssistant);
    setIsDrawerOpen(true);
  }

  async function saveDailyTask(event) {
    event.preventDefault();
    if (!taskForm.task.trim()) {
      setToast({ type: 'error', message: 'Please specify a work order name.' });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...taskForm,
        checklist: normalizeChecklistForSave(taskForm.checklist),
      };
      await request(editingTaskId ? `/api/scheduling/tasks/${editingTaskId}` : '/api/scheduling/tasks', {
        method: editingTaskId ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      });

      setToast({
        type: 'success',
        message: editingTaskId ? 'Work order updated successfully.' : 'Work order scheduled successfully.',
      });
      setIsDrawerOpen(false);
      await loadBoard(taskForm.workDate, historyFrom, historyTo);
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Failed to save work order.' });
    } finally {
      setLoading(false);
    }
  }

  async function deleteTask(task) {
    const confirmed = window.confirm(`Delete "${task.task}" from ${formatDate(task.workDate)}?`);
    if (!confirmed) return;

    setLoading(true);
    try {
      await request(`/api/scheduling/tasks/${task.id}`, { method: 'DELETE' });
      setToast({ type: 'info', message: 'Work order removed.' });
      if (editingTaskId === task.id) setIsDrawerOpen(false);
      await loadBoard(date, historyFrom, historyTo);
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Failed to delete task.' });
    } finally {
      setLoading(false);
    }
  }

  // Checklist Helpers
  function addChecklistPoint() {
    setTaskForm((curr) => ({
      ...curr,
      checklist: [...curr.checklist, newChecklistItem(curr.checklist.length)],
    }));
  }

  function updateChecklistPoint(index, field, value) {
    setTaskForm((curr) => ({
      ...curr,
      checklist: curr.checklist.map((item, idx) => (idx === index ? { ...item, [field]: value } : item)),
    }));
  }

  function removeChecklistPoint(index) {
    setTaskForm((curr) => ({
      ...curr,
      checklist: curr.checklist.filter((_, idx) => idx !== index),
    }));
  }

  // AI Task Helper
  async function runManualTaskHelper() {
    if (!taskForm.task.trim()) {
      setToast({ type: 'error', message: 'Enter a task title to search manuals.' });
      return;
    }

    setManualBusy(true);
    try {
      const payload = {
        machineModel: taskForm.machineModel,
        task: taskForm.task,
        description: taskForm.description,
        notes: taskForm.notes,
      };

      const optionsData = await request('/api/shop-manuals/suggest-options', {
        method: 'POST',
        body: JSON.stringify(payload),
      }).catch(() => ({ options: [] }));

      const options = optionsData.options || [];
      if (options.length > 0) {
        const toolsData = await request('/api/shop-manuals/suggest-tools', {
          method: 'POST',
          body: JSON.stringify({
            ...payload,
            selectedManualCandidateIds: [options[0].id],
            manualOptions: options,
          }),
        }).catch(() => null);

        if (toolsData?.suggestion?.procedureSummary?.length) {
          setTaskForm((curr) => ({
            ...curr,
            checklist: normalizeChecklistForForm(toolsData.suggestion.procedureSummary),
            manualAdvice: toolsData.suggestion,
          }));
          setToast({ type: 'success', message: 'Applied AI manual steps to checklist.' });
        } else {
          setToast({ type: 'info', message: 'No exact procedure steps found in indexed manuals.' });
        }
      } else {
        setToast({ type: 'info', message: 'No matching shop manual found for this machine model.' });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'AI manual assistance failed.' });
    } finally {
      setManualBusy(false);
    }
  }

  const technicians = board.technicians || [];
  const tasks = board.tasks || [];
  const historyTasks = board.history?.tasks || [];

  // Computed timeline metrics
  const assignedTechIds = new Set(tasks.flatMap((t) => (t.technicians || []).map((tech) => tech.id)));

  return (
    <SystemShell
      activePath="/management/scheduling"
      title="Dispatch & Scheduling"
      description="24-hour visual technician timeline, work order dispatch, and Komatsu shop manual guidance."
    >
      {/* Page Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'Operations', href: '/management' },
          { label: 'Dispatch & Scheduling' },
        ]}
        title="Technician Dispatch Board"
        badge={<Badge tone="active" dot>Live Timeline</Badge>}
        description="Assign daily preventive maintenance and breakdown work orders across technicians and active job sites."
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 p-0.5 rounded-md text-xs">
              <button
                type="button"
                onClick={() => loadBoard(addDays(date, -1))}
                className="px-2 py-1 hover:bg-white rounded transition-colors text-slate-700 cursor-pointer"
                title="Previous Day"
              >
                ◀
              </button>
              <button
                type="button"
                onClick={() => loadBoard(today())}
                className="px-2.5 py-1 hover:bg-white rounded font-medium transition-colors text-slate-800 cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => loadBoard(addDays(date, 1))}
                className="px-2 py-1 hover:bg-white rounded transition-colors text-slate-700 cursor-pointer"
                title="Next Day"
              >
                ▶
              </button>
            </div>

            <input
              type="date"
              value={date}
              onChange={(e) => loadBoard(e.target.value)}
              className="h-8 px-2.5 rounded-md border border-slate-300 text-xs font-mono bg-white text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-slate-900/15 cursor-pointer"
            />

            <Button
              variant="primary"
              size="sm"
              onClick={() => openCreateDrawer()}
            >
              <svg className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Create Job
            </Button>
          </div>
        }
      />

      {/* KPI Overview Bar */}
      <section aria-label="Dispatch Summary">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard
            label="Total Technicians"
            value={technicians.length}
            unit="Staff"
            subtext="Registered roster"
            status="Roster"
            statusTone="neutral"
          />
          <MetricCard
            label="On-Duty Dispatch"
            value={assignedTechIds.size}
            unit="Assigned"
            subtext={`${technicians.length - assignedTechIds.size} available`}
            status="Active"
            statusTone="active"
          />
          <MetricCard
            label="Daily Work Orders"
            value={tasks.length}
            unit="Scheduled"
            subtext={`On ${formatDayHeader(date)}`}
            status="Today"
            statusTone="pending"
          />
          <MetricCard
            label="Shop Manuals"
            value={manuals.length}
            unit="Indexed"
            subtext="AI Assistant ready"
            status="Ready"
            statusTone="info"
          />
        </div>
      </section>

      {/* View Switcher Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-md text-xs font-medium">
          <button
            type="button"
            onClick={() => setViewTab('timeline')}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${viewTab === 'timeline' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
          >
            📊 Visual Timeline Board
          </button>
          <button
            type="button"
            onClick={() => setViewTab('table')}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${viewTab === 'table' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
          >
            📋 Work Orders List ({tasks.length})
          </button>
          <button
            type="button"
            onClick={() => setViewTab('manuals')}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${viewTab === 'manuals' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
          >
            📖 Shop Manuals Library ({manuals.length})
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing: <span className="text-slate-900 font-semibold">{formatDayHeader(date)}</span>
        </div>
      </div>

      {/* VIEW 1: Interactive 24-Hour Visual Dispatch Timeline */}
      {viewTab === 'timeline' && (
        <Card className="overflow-hidden border border-slate-200/80">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Shift Timeline Schedule</h3>
              <p className="text-xs text-slate-500">Click any empty time slot on a technician row to quickly create a job assignment</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Completed</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> Active / Confirmed</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> Urgent / Critical</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[840px]">
              {/* Timeline Header Ruler */}
              <div className="grid grid-cols-[220px_1fr] border-b border-slate-200 bg-slate-100/70 text-[11px] font-mono text-slate-500 font-medium select-none">
                <div className="p-2.5 pl-4 border-r border-slate-200">Technician</div>
                <div className="grid grid-cols-7 divide-x divide-slate-200 text-center py-2">
                  <div>06:00</div>
                  <div>08:00</div>
                  <div>10:00</div>
                  <div>12:00</div>
                  <div>14:00</div>
                  <div>16:00</div>
                  <div>18:00</div>
                </div>
              </div>

              {/* Technician Timeline Rows */}
              <div className="divide-y divide-slate-100">
                {technicians.length === 0 ? (
                  <div className="p-12 text-center text-xs text-slate-500">No technicians registered.</div>
                ) : (
                  technicians.map((tech) => {
                    const techTasks = tasks.filter((t) =>
                      (t.technicians || []).some((tt) => tt.id === tech.id)
                    );
                    const isAvailable = isTechnicianSchedulable(tech);

                    return (
                      <div key={tech.id} className="grid grid-cols-[220px_1fr] min-h-[52px] group hover:bg-slate-50/50 transition-colors">
                        {/* Technician Profile Card Column */}
                        <div className="p-2.5 pl-4 border-r border-slate-200 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900 truncate">
                              {technicianName(tech)}
                            </p>
                            <div className="flex items-center gap-1 text-[10px] text-slate-500">
                              <span>{tech.employeeCode || 'TECH'}</span>
                              <span>•</span>
                              <span className="truncate">{tech.region || 'Kuwait Central'}</span>
                            </div>
                          </div>
                          <Badge tone={isAvailable ? 'active' : 'neutral'} className="text-[9px] px-1.5 py-0">
                            {isAvailable ? 'Ready' : 'Off'}
                          </Badge>
                        </div>

                        {/* Interactive Timeline Track */}
                        <div
                          className="relative flex items-center p-1 cursor-crosshair"
                          onClick={(e) => {
                            if (e.target === e.currentTarget) {
                              openCreateDrawer(tech.id, '08:00');
                            }
                          }}
                          title="Click to schedule job for this technician"
                        >
                          {/* Grid Background Lines */}
                          <div className="absolute inset-0 grid grid-cols-7 divide-x divide-slate-100 pointer-events-none" />

                          {/* Work Order Blocks */}
                          {techTasks.map((t) => {
                            const startMin = parseTimeToMinutes(t.startsAt);
                            const endMin = parseTimeToMinutes(t.endsAt);
                            const windowStart = TIMELINE_START_HOUR * 60;
                            const windowEnd = TIMELINE_END_HOUR * 60;
                            const totalMins = windowEnd - windowStart;

                            const leftPct = Math.max(0, Math.min(100, ((startMin - windowStart) / totalMins) * 100));
                            const rightPct = Math.max(0, Math.min(100, ((endMin - windowStart) / totalMins) * 100));
                            const widthPct = Math.max(8, rightPct - leftPct);

                            const tone = statusTone(t.status);
                            const bgStyle =
                              tone === 'completed'
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                                : tone === 'critical'
                                ? 'bg-red-50 border-red-300 text-red-900'
                                : 'bg-amber-50 border-amber-300 text-amber-950';

                            return (
                              <div
                                key={t.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditDrawer(t);
                                }}
                                className={`absolute h-9 rounded-md border shadow-2xs px-2 py-1 flex items-center justify-between text-xs font-medium cursor-pointer transition-all hover:scale-[1.01] hover:shadow-xs z-10 ${bgStyle}`}
                                style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                                title={`${t.task} (${t.startsAt} - ${t.endsAt})`}
                              >
                                <div className="min-w-0 flex-1 truncate pr-1">
                                  <span className="font-semibold">{t.task}</span>
                                  {t.machineModel && (
                                    <span className="opacity-75 ml-1 text-[10px]">• {t.machineModel}</span>
                                  )}
                                </div>
                                <span className="text-[10px] font-mono opacity-80 shrink-0">
                                  {t.startsAt}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* VIEW 2: Work Orders Table List */}
      {viewTab === 'table' && (
        <Card className="overflow-hidden border border-slate-200/80">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Work Order & Machine</TableHead>
                <TableHead>Assigned Techs</TableHead>
                <TableHead>Site / Location</TableHead>
                <TableHead>Time Window</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-xs text-slate-500">
                    No work orders scheduled for this date. Click &quot;Create Job&quot; to assign one.
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((task) => (
                  <TableRow key={task.id} isClickable onClick={() => openEditDrawer(task)}>
                    <TableCell>
                      <p className="font-semibold text-slate-900">{task.task}</p>
                      <p className="text-xs text-slate-500">{task.machineModel || 'General Machinery'}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(task.technicians || []).map((tech) => (
                          <Badge key={tech.id} tone="neutral" className="text-[10px]">
                            {technicianName(tech)}
                          </Badge>
                        ))}
                        {(!task.technicians || task.technicians.length === 0) && (
                          <span className="text-xs text-slate-400">Unassigned</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600 text-xs">{task.location || 'Central Site'}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-700">
                      {task.startsAt} - {task.endsAt}
                    </TableCell>
                    <TableCell>
                      <Badge tone={statusTone(task.status)}>{task.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDrawer(task)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => deleteTask(task)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* VIEW 3: Komatsu Shop Manuals Library */}
      {viewTab === 'manuals' && (
        <div className="space-y-4">
          <SectionHeader
            title="Komatsu Shop Manuals Master Library"
            description="Official OEM shop manuals and disassembly guides parsed by AI Assistant"
            actions={
              <Button
                variant="secondary"
                size="sm"
                onClick={loadManuals}
                disabled={manualBusy}
              >
                Refresh Index
              </Button>
            }
          />

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model / Title</TableHead>
                  <TableHead>Manual Type</TableHead>
                  <TableHead>Serial Range</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Indexed Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {manuals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-xs text-slate-500">
                      No manuals uploaded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  manuals.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-semibold text-slate-900">
                        {m.title || m.machineModel}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">{m.manualType || 'Shop Manual'}</TableCell>
                      <TableCell className="text-xs font-mono text-slate-600">{m.serialRange || 'All Serials'}</TableCell>
                      <TableCell className="text-xs uppercase text-slate-500">{m.language || 'EN'}</TableCell>
                      <TableCell>
                        <Badge tone="ready">Indexed (AI Ready)</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* Slide-over Drawer for Creating / Editing Work Orders */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/40 backdrop-blur-xs flex justify-end animate-[ds-toast-in_140ms_ease]">
          <div
            className="w-full max-w-xl bg-white shadow-2xl flex flex-col h-full border-l border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900 tracking-tight">
                  {editingTaskId ? 'Edit Work Order' : 'Create New Work Order'}
                </h3>
                <p className="text-xs text-slate-500">
                  {formatDayHeader(taskForm.workDate || date)} • Assign technicians and inspection points
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                aria-label="Close drawer"
              >
                ✕
              </button>
            </div>

            {/* Drawer Form Body */}
            <form onSubmit={saveDailyTask} className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs sm:text-sm">
              {/* 1. Machinery & Task Identity */}
              <div className="space-y-3 pb-4 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900 uppercase tracking-wider">1. Work Order Details</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Machine Model" required>
                    <Select
                      value={taskForm.machineModel}
                      onChange={(e) => setTaskForm({ ...taskForm, machineModel: e.target.value })}
                    >
                      <option value="PC400-8R">Komatsu PC400-8R Excavator</option>
                      <option value="PC400LC-8R">Komatsu PC400LC-8R</option>
                      <option value="HM400-3R">Komatsu HM400-3R Articulated Truck</option>
                      <option value="D155A-6R">Komatsu D155A-6R Bulldozer</option>
                      <option value="WA470-6R">Komatsu WA470-6R Wheel Loader</option>
                      <option value="GD655-5">Komatsu GD655-5 Motor Grader</option>
                    </Select>
                  </Field>

                  <Field label="Location / Job Site" required>
                    <Input
                      value={taskForm.location}
                      onChange={(e) => setTaskForm({ ...taskForm, location: e.target.value })}
                      placeholder="e.g. Desire Site, Sabah Al-Ahmad"
                    />
                  </Field>
                </div>

                <Field label="Task Name / Operation" required>
                  <div className="flex gap-2">
                    <Input
                      value={taskForm.task}
                      onChange={(e) => setTaskForm({ ...taskForm, task: e.target.value })}
                      placeholder="e.g. 500h Periodic PM & Fan Pump Teardown"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={runManualTaskHelper}
                      disabled={manualBusy}
                      title="Auto-suggest steps from Komatsu Shop Manual"
                    >
                      {manualBusy ? 'Parsing...' : 'Manual Guide'}
                    </Button>
                  </div>
                </Field>

                <Field label="Scope Description">
                  <Textarea
                    rows={2}
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    placeholder="Brief scope description or safety warnings..."
                  />
                </Field>
              </div>

              {/* 2. Schedule & Time Window with Shift Presets */}
              <div className="space-y-3 pb-4 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-900 uppercase tracking-wider">2. Time Window & Status</p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setTaskForm({ ...taskForm, startsAt: '08:00', endsAt: '16:00' })}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[10px] font-medium text-slate-700 cursor-pointer"
                    >
                      Morning (08-16)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaskForm({ ...taskForm, startsAt: '16:00', endsAt: '00:00' })}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[10px] font-medium text-slate-700 cursor-pointer"
                    >
                      Evening (16-00)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Field label="Work Date" required>
                    <Input
                      type="date"
                      value={taskForm.workDate}
                      onChange={(e) => setTaskForm({ ...taskForm, workDate: e.target.value })}
                    />
                  </Field>
                  <Field label="Start Time" required>
                    <Input
                      type="time"
                      value={taskForm.startsAt}
                      onChange={(e) => setTaskForm({ ...taskForm, startsAt: e.target.value })}
                    />
                  </Field>
                  <Field label="End Time" required>
                    <Input
                      type="time"
                      value={taskForm.endsAt}
                      onChange={(e) => setTaskForm({ ...taskForm, endsAt: e.target.value })}
                    />
                  </Field>
                </div>

                <Field label="Status">
                  <Select
                    value={taskForm.status}
                    onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                  >
                    <option value="CONFIRMED">CONFIRMED (Ready)</option>
                    <option value="PLANNED">PLANNED (Pending)</option>
                    <option value="ON_DUTY">ON_DUTY (In Progress)</option>
                    <option value="COMPLETED">COMPLETED (Done)</option>
                  </Select>
                </Field>
              </div>

              {/* 3. Assigned Technicians */}
              <div className="space-y-2.5 pb-4 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                    3. Assigned Technicians ({taskForm.technicianIds.length} selected)
                  </p>
                  {taskForm.technicianIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setTaskForm({ ...taskForm, technicianIds: [] })}
                      className="text-[10px] text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <Input
                  value={techSearch}
                  onChange={(e) => setTechSearch(e.target.value)}
                  placeholder="Filter technician by name or code..."
                  className="text-xs py-1.5"
                />

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-32 overflow-y-auto p-1 bg-slate-50 rounded-md border border-slate-200/80">
                  {technicians
                    .filter((t) => {
                      if (!techSearch.trim()) return true;
                      const name = technicianName(t).toLowerCase();
                      const code = (t.employeeCode || '').toLowerCase();
                      const q = techSearch.trim().toLowerCase();
                      return name.includes(q) || code.includes(q);
                    })
                    .map((t) => {
                      const isSelected = taskForm.technicianIds.includes(t.id);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setTaskForm((curr) => ({
                              ...curr,
                              technicianIds: isSelected
                                ? curr.technicianIds.filter((id) => id !== t.id)
                                : [...curr.technicianIds, t.id],
                            }));
                          }}
                          className={`p-1.5 rounded text-left flex items-center justify-between transition-all cursor-pointer text-xs ${
                            isSelected
                              ? 'bg-amber-100 text-amber-950 font-semibold border border-amber-300'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span className="truncate">{technicianName(t)}</span>
                          {isSelected && <span className="text-amber-700 ml-1">✓</span>}
                        </button>
                      );
                    })}
                </div>
              </div>


              {/* 4. Inspection Checklist Points */}
              <div className="space-y-3 pb-4 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-900 uppercase tracking-wider">4. Work Points Checklist</p>
                  <Button type="button" variant="ghost" size="sm" onClick={addChecklistPoint}>
                    + Add Point
                  </Button>
                </div>

                <div className="space-y-2">
                  {taskForm.checklist.map((item, idx) => (
                    <div key={item.id || idx} className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-400 w-4">{idx + 1}.</span>
                      <Input
                        value={item.text}
                        onChange={(e) => updateChecklistPoint(idx, 'text', e.target.value)}
                        placeholder={`Checklist item ${idx + 1}...`}
                        className="flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => removeChecklistPoint(idx)}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                        title="Remove point"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. Notes */}
              <Field label="Supervisor Dispatch Notes">
                <Textarea
                  rows={2}
                  value={taskForm.notes}
                  onChange={(e) => setTaskForm({ ...taskForm, notes: e.target.value })}
                  placeholder="Special instructions, required PPE, or access clearance..."
                />
              </Field>

            </form>

            {/* Sticky Drawer Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <Button
                variant="secondary"
                onClick={() => setIsDrawerOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={saveDailyTask}
                disabled={loading}
              >
                {loading ? 'Saving...' : editingTaskId ? 'Update Work Order' : 'Schedule Work Order'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </SystemShell>
  );
}
