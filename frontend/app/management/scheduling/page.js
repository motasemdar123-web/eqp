'use client';

/* eslint-disable @next/next/no-img-element */

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

function addDays(dateText, amount) {
  const value = new Date(`${dateText}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toISOString().slice(0, 10);
}

function formatDayLabel(value) {
  return new Intl.DateTimeFormat('en', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function technicianName(technician) {
  return technician?.user?.fullName || technician?.user?.full_name || technician?.employeeCode || 'Technician';
}

function emptyTaskForm(workDate = today()) {
  return {
    technicianIds: [],
    workDate,
    task: '',
    description: '',
    machineModel: '',
    manualAdvice: null,
    location: '',
    startsAt: '08:00',
    endsAt: '16:00',
    notes: '',
    status: 'CONFIRMED',
  };
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
  const [editingTaskId, setEditingTaskId] = useState('');
  const [taskForm, setTaskForm] = useState(() => emptyTaskForm());
  const [viewingTask, setViewingTask] = useState(null);
  const [manualUpload, setManualUpload] = useState({ machineModel: '', title: '', file: null });
  const [manualBusy, setManualBusy] = useState(false);
  const [manualAssistant, setManualAssistant] = useState(emptyManualAssistant);

  const headers = useMemo(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }), [token]);

  async function request(path, options = {}) {
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...(isFormData ? { Authorization: headers.Authorization } : headers),
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
      const nextBoard = data.board || emptyBoard;
      if ((nextBoard.technicians || []).length === 0) {
        const technicianData = await request('/api/technicians');
        nextBoard.technicians = technicianData.technicians || [];
        nextBoard.kpis = {
          ...(nextBoard.kpis || {}),
          technicians: nextBoard.technicians.length,
        };
      }
      setBoard(nextBoard);
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

  function addTechnician(technicianId) {
    setTaskForm((current) => {
      if (current.technicianIds.includes(technicianId)) return current;
      return {
        ...current,
        technicianIds: [...current.technicianIds, technicianId],
      };
    });
  }

  function removeTechnician(technicianId) {
    setTaskForm((current) => {
      return {
        ...current,
        technicianIds: current.technicianIds.filter((id) => id !== technicianId),
      };
    });
  }

  function resetTaskForm(workDate = date) {
    setEditingTaskId('');
    setTaskForm(emptyTaskForm(workDate));
    setManualAssistant(emptyManualAssistant);
  }

  function editTask(task) {
    setEditingTaskId(task.id);
    setManualAssistant(emptyManualAssistant);
    setTaskForm({
      technicianIds: (task.technicians || []).map((technician) => technician.id),
      workDate: formatDate(task.workDate),
      task: task.task || '',
      description: task.description || '',
      machineModel: task.machineModel || '',
      manualAdvice: task.manualAdvice || null,
      location: task.location || '',
      startsAt: task.startsAt || '08:00',
      endsAt: task.endsAt || '16:00',
      notes: task.notes || '',
      status: task.status || 'CONFIRMED',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function deleteTask(task) {
    const confirmed = window.confirm(`Delete "${task.task}" from ${formatDate(task.workDate)}?`);
    if (!confirmed) return;

    setLoading(true);
    setMessage('');
    try {
      await request(`/api/scheduling/tasks/${task.id}`, { method: 'DELETE' });
      setMessage('Daily schedule task deleted');
      if (editingTaskId === task.id) resetTaskForm(date);
      await loadBoard(date, historyFrom, historyTo);
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
      await request(editingTaskId ? `/api/scheduling/tasks/${editingTaskId}` : '/api/scheduling/tasks', {
        method: editingTaskId ? 'PATCH' : 'POST',
        body: JSON.stringify(taskForm),
      });
      setMessage(editingTaskId ? 'Daily schedule task updated' : 'Daily schedule task saved');
      resetTaskForm(taskForm.workDate);
      await loadBoard(taskForm.workDate, historyFrom, historyTo);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  function handleManualFile(file) {
    if (!file) return;
    setManualUpload((current) => ({
      ...current,
      title: current.title || file.name.replace(/\.pdf$/i, ''),
      file,
    }));
  }

  async function uploadManual() {
    setManualBusy(true);
    setMessage('');
    try {
      const form = new FormData();
      form.set('machineModel', manualUpload.machineModel);
      form.set('title', manualUpload.title);
      form.set('manual', manualUpload.file);

      await request('/api/shop-manuals/upload', {
        method: 'POST',
        headers: {},
        body: form,
      });
      setMessage('Shop manual uploaded and indexed');
      setManualUpload({ machineModel: manualUpload.machineModel, title: '', file: null });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setManualBusy(false);
    }
  }

  async function findManualOptions() {
    setManualBusy(true);
    setMessage('');
    setManualAssistant({
      ...emptyManualAssistant,
      phase: 'searching',
    });
    try {
      const data = await request('/api/shop-manuals/suggest-options', {
        method: 'POST',
        body: JSON.stringify({
          machineModel: taskForm.machineModel,
          task: taskForm.task,
          description: taskForm.description,
          notes: taskForm.notes,
        }),
      });
      const options = data.options || [];
      setManualAssistant({
        phase: 'options',
        options,
        selectedIds: options[0]?.id ? [options[0].id] : [],
        context: {
          interpretedTask: data.interpretedTask,
          interpretationNotes: data.interpretationNotes || [],
          searchPhrases: data.searchPhrases || [],
          confidence: data.confidence,
          generatedBy: data.generatedBy,
        },
        error: options.length ? '' : 'No close manual matches were found. Refine the task wording or upload a more specific manual.',
      });
      if (!options.length) {
        setMessage('No close manual matches were found. Refine the task wording or upload a more specific manual.');
      }
    } catch (error) {
      setMessage(error.message);
      setManualAssistant({
        ...emptyManualAssistant,
        phase: 'idle',
        error: error.message,
      });
    } finally {
      setManualBusy(false);
    }
  }

  async function generateManualAdvice() {
    if (manualAssistant.selectedIds.length === 0) {
      setMessage('Choose the closest manual section before generating suggestions.');
      return;
    }

    setManualBusy(true);
    setMessage('');
    setManualAssistant((current) => ({
      ...current,
      phase: 'generating',
      error: '',
    }));
    try {
      const data = await request('/api/shop-manuals/suggest-tools', {
        method: 'POST',
        body: JSON.stringify({
          machineModel: taskForm.machineModel,
          task: taskForm.task,
          description: taskForm.description,
          notes: taskForm.notes,
          selectedManualCandidateIds: manualAssistant.selectedIds,
          manualOptions: manualAssistant.options,
          interpretedTask: manualAssistant.context?.interpretedTask,
          interpretationNotes: manualAssistant.context?.interpretationNotes,
          searchPhrases: manualAssistant.context?.searchPhrases,
        }),
      });
      setTaskForm((current) => ({ ...current, manualAdvice: data.suggestion }));
      setManualAssistant((current) => ({
        ...current,
        phase: 'done',
      }));
      setMessage('Manual suggestions generated from the selected manual section. Review them before saving the task.');
    } catch (error) {
      setMessage(error.message);
      setManualAssistant((current) => ({
        ...current,
        phase: 'options',
        error: error.message,
      }));
    } finally {
      setManualBusy(false);
    }
  }

  async function openManualSource(source, mode = 'open') {
    const pageUrl = source?.pagePdfUrl
      || (source?.manualId && source?.page ? `/api/shop-manuals/${source.manualId}/pages/${source.page}/pdf` : '');
    const manualUrl = source?.manualPdfUrl
      || (source?.manualId ? `/api/shop-manuals/${source.manualId}/file` : '');
    const requestUrl = mode === 'manual' && manualUrl ? manualUrl : pageUrl;
    if (!pageUrl) {
      setMessage('No manual page link is available for this source.');
      return;
    }

    try {
      let response = await fetch(`${API_BASE}${requestUrl}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      let openMode = mode;
      if (!response.ok && mode === 'manual' && requestUrl !== pageUrl) {
        response = await fetch(`${API_BASE}${pageUrl}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        openMode = 'open';
      }
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || data.error || 'Could not open manual page.');
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const fileName = `${source.manual || source.machineModel || 'shop-manual'}${openMode === 'manual' ? '' : `-p${source.page || 'page'}`}.pdf`
        .replace(/[^a-z0-9._-]+/gi, '-');

      if (openMode === 'download') {
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        window.open(openMode === 'manual' && source.page ? `${blobUrl}#page=${source.page}` : blobUrl, '_blank', 'noopener,noreferrer');
      }

      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    if (!token) return undefined;
    const timer = setTimeout(() => loadBoard(date), 0);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const technicians = board.technicians || [];
  const tasks = board.tasks || [];
  const historyTasks = board.history?.tasks || [];
  const dayWindow = Array.from({ length: 11 }, (_, index) => addDays(date, index - 5));
  const assignedTechnicianIds = new Set(
    tasks
      .filter((task) => task.id !== editingTaskId)
      .flatMap((task) => (task.technicians || []).map((technician) => technician.id)),
  );
  const selectedTechnicians = technicians.filter((technician) => taskForm.technicianIds.includes(technician.id));
  const availableTechnicians = technicians.filter((technician) => (
    !assignedTechnicianIds.has(technician.id) && !taskForm.technicianIds.includes(technician.id)
  ));

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

        <div className="grid gap-5">
          <Card className="p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-bold text-zinc-950">{editingTaskId ? 'Edit Daily Schedule Task' : 'Add Daily Schedule Task'}</h2>
              {editingTaskId && (
                <Button type="button" variant="secondary" onClick={() => resetTaskForm(date)}>
                  Cancel Edit
                </Button>
              )}
            </div>
            <form onSubmit={saveDailyTask} className="mt-4 grid gap-3">
              <div className="grid gap-3 md:grid-cols-2">
                <input type="date" className="h-11 rounded-md border border-zinc-300 px-3" value={taskForm.workDate} onChange={(event) => loadBoard(event.target.value, historyFrom, historyTo)} />
                <input className="h-11 rounded-md border border-zinc-300 px-3" placeholder="Location" value={taskForm.location} onChange={(event) => setTaskForm((current) => ({ ...current, location: event.target.value }))} />
              </div>
              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <input className="h-11 rounded-md border border-zinc-300 px-3 uppercase" placeholder="Machine model, e.g. D155A-6" value={taskForm.machineModel} onChange={(event) => setTaskForm((current) => ({ ...current, machineModel: event.target.value.toUpperCase() }))} />
                <Button type="button" variant="secondary" onClick={findManualOptions} disabled={manualBusy || !taskForm.machineModel || !taskForm.task}>
                  Find Manual Matches
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="time" className="h-11 rounded-md border border-zinc-300 px-3" value={taskForm.startsAt} onChange={(event) => setTaskForm((current) => ({ ...current, startsAt: event.target.value }))} />
                <input type="time" className="h-11 rounded-md border border-zinc-300 px-3" value={taskForm.endsAt} onChange={(event) => setTaskForm((current) => ({ ...current, endsAt: event.target.value }))} />
              </div>
              <input className="h-11 rounded-md border border-zinc-300 px-3" placeholder="Task" value={taskForm.task} onChange={(event) => setTaskForm((current) => ({ ...current, task: event.target.value }))} />
              <textarea rows={3} className="rounded-md border border-zinc-300 px-3 py-2" placeholder="Description" value={taskForm.description} onChange={(event) => setTaskForm((current) => ({ ...current, description: event.target.value }))} />
              <ManualOptionChooser
                state={manualAssistant}
                busy={manualBusy}
                onSelect={(id) => setManualAssistant((current) => ({ ...current, selectedIds: [id] }))}
                onGenerate={generateManualAdvice}
                onRestart={findManualOptions}
              />
              {taskForm.manualAdvice && (
                <ManualAdvicePanel advice={taskForm.manualAdvice} onClear={() => setTaskForm((current) => ({ ...current, manualAdvice: null }))} onOpenSource={openManualSource} />
              )}
              <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-sm font-bold text-zinc-950">Technicians</p>
                {technicians.length === 0 && (
                  <p className="mt-3 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm font-semibold text-yellow-800">
                    No technicians found. Add technicians in Technicians Management or run the seed script on the backend.
                  </p>
                )}
                {selectedTechnicians.length > 0 && (
                  <div className="mt-3 rounded-md border border-zinc-200 bg-white p-3">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">Selected</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedTechnicians.map((technician) => (
                        <button
                          key={technician.id}
                          type="button"
                          onClick={() => removeTechnician(technician.id)}
                          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 hover:border-zinc-500"
                        >
                          {technicianName(technician)} x
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-3 rounded-md border border-zinc-200 bg-white p-3">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">Available for {taskForm.workDate}</p>
                  {availableTechnicians.length === 0 ? (
                    <p className="mt-2 text-sm font-semibold text-zinc-500">
                      All technicians are already selected or assigned for this day.
                    </p>
                  ) : (
                    <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {availableTechnicians.map((technician) => (
                        <button
                          key={technician.id}
                          type="button"
                          onClick={() => addTechnician(technician.id)}
                          className="flex items-center justify-between gap-3 rounded-md border border-zinc-200 px-3 py-2 text-left text-sm font-semibold text-zinc-700 hover:border-yellow-400 hover:bg-yellow-50"
                        >
                          <span>
                            {technicianName(technician)}
                            {technician.employeeCode && <span className="ml-2 font-mono text-xs text-zinc-400">{technician.employeeCode}</span>}
                          </span>
                          <span className="text-lg font-black text-zinc-950">+</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <textarea rows={2} className="rounded-md border border-zinc-300 px-3 py-2" placeholder="Notes" value={taskForm.notes} onChange={(event) => setTaskForm((current) => ({ ...current, notes: event.target.value }))} />
              <Button type="submit" disabled={!token || loading || taskForm.technicianIds.length === 0}>
                {editingTaskId ? 'Update Daily Task' : 'Save Daily Task'}
              </Button>
            </form>
          </Card>

          <Card className="p-5">
            <h2 className="text-xl font-bold text-zinc-950">Shop Manual Library</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input className="h-11 rounded-md border border-zinc-300 px-3 uppercase" placeholder="Machine model" value={manualUpload.machineModel} onChange={(event) => setManualUpload((current) => ({ ...current, machineModel: event.target.value.toUpperCase() }))} />
              <input className="h-11 rounded-md border border-zinc-300 px-3" placeholder="Manual title" value={manualUpload.title} onChange={(event) => setManualUpload((current) => ({ ...current, title: event.target.value }))} />
              <input type="file" accept="application/pdf" className="rounded-md border border-zinc-300 bg-white p-3 text-sm md:col-span-2" onChange={(event) => handleManualFile(event.target.files?.[0])} />
            </div>
            <Button type="button" className="mt-3" onClick={uploadManual} disabled={manualBusy || !manualUpload.machineModel || !manualUpload.title || !manualUpload.file}>
              {manualBusy ? 'Indexing Manual...' : 'Upload and Index Manual'}
            </Button>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <div className="border-b border-zinc-100 px-5 py-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <h2 className="text-xl font-bold text-zinc-950">Daily Schedule</h2>
              <div className="flex items-center gap-2">
                <Button type="button" variant="secondary" onClick={() => loadBoard(addDays(date, -1), historyFrom, historyTo)} disabled={!token || loading}>
                  Previous
                </Button>
                <Button type="button" variant="secondary" onClick={() => loadBoard(addDays(date, 1), historyFrom, historyTo)} disabled={!token || loading}>
                  Next
                </Button>
              </div>
            </div>
            <div className="mt-4 overflow-x-auto pb-2">
              <div className="flex min-w-max gap-2">
                {dayWindow.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => loadBoard(day, historyFrom, historyTo)}
                    className={`min-w-32 rounded-md border px-4 py-3 text-left text-sm font-bold ${
                      day === date
                        ? 'border-zinc-950 bg-zinc-950 text-white'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:border-yellow-400 hover:bg-yellow-50'
                    }`}
                  >
                    <span className="block">{formatDayLabel(day)}</span>
                    <span className={`mt-1 block font-mono text-xs ${day === date ? 'text-zinc-300' : 'text-zinc-400'}`}>{day}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <ScheduleTable tasks={tasks} emptyText="No tasks scheduled for this day." onView={setViewingTask} onEdit={editTask} onDelete={deleteTask} />
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
          <ScheduleTable tasks={historyTasks} showDate emptyText="No schedule history found for this range." onView={setViewingTask} />
        </Card>
      </section>
      {viewingTask && (
        <ScheduleSlotModal task={viewingTask} onClose={() => setViewingTask(null)} onOpenManualSource={openManualSource} />
      )}
      <ManualProgressOverlay phase={manualAssistant.phase} visible={manualBusy && ['searching', 'generating'].includes(manualAssistant.phase)} />
    </SystemShell>
  );
}

function ScheduleTable({ tasks, showDate = false, emptyText, onView, onEdit, onDelete }) {
  const hasActions = Boolean(onView || onEdit || onDelete);

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
            {hasActions && <th className="px-5 py-4 text-left">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 && (
            <tr>
              <td colSpan={(showDate ? 7 : 6) + (hasActions ? 1 : 0)} className="px-5 py-8 text-center text-sm font-semibold text-zinc-500">{emptyText}</td>
            </tr>
          )}
          {tasks.map((task) => (
            <tr key={task.id} className="border-t border-zinc-100 align-top">
              {showDate && <td className="px-5 py-4 text-sm font-semibold text-zinc-700">{formatDate(task.workDate)}</td>}
              <td className="px-5 py-4 text-sm font-semibold text-zinc-700">{task.startsAt} - {task.endsAt}</td>
                <td className="px-5 py-4">
                {onView ? (
                  <button
                    type="button"
                    onClick={() => onView(task)}
                    className="text-left font-bold text-zinc-950 underline-offset-4 hover:text-yellow-700 hover:underline"
                  >
                    {task.task}
                  </button>
                ) : (
                  <p className="font-bold text-zinc-950">{task.task}</p>
                )}
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
              {hasActions && (
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    {onView && (
                      <button type="button" onClick={() => onView(task)} className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 hover:border-zinc-500">
                        Details
                      </button>
                    )}
                    {onEdit && (
                      <button type="button" onClick={() => onEdit(task)} className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 hover:border-zinc-500">
                        Edit
                      </button>
                    )}
                    {onDelete && (
                      <button type="button" onClick={() => onDelete(task)} className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:border-red-400">
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ManualOptionChooser({ state, busy, onSelect, onGenerate, onRestart }) {
  if (!['options', 'generating', 'done'].includes(state.phase) && !state.error) return null;

  return (
    <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-black text-zinc-950">Manual Match Confirmation</p>
          <p className="mt-1 text-sm font-semibold text-zinc-700">
            Choose the closest manual section first. Suggestions will be generated only from your selected section.
          </p>
          {state.context?.interpretedTask && (
            <p className="mt-2 text-sm font-bold text-zinc-800">Interpreted as: {state.context.interpretedTask}</p>
          )}
        </div>
        <Button type="button" variant="secondary" onClick={onRestart} disabled={busy}>
          Search Again
        </Button>
      </div>

      {state.error && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
          {state.error}
        </div>
      )}

      {state.options.length > 0 && (
        <div className="mt-4 grid gap-2">
          {state.options.map((option, index) => {
            const selected = state.selectedIds.includes(option.id);
            return (
              <button
                key={option.id || `${option.title}-${index}`}
                type="button"
                onClick={() => onSelect(option.id)}
                className={`group relative overflow-hidden rounded-md border px-4 py-3 text-left transition duration-200 ${
                  selected
                    ? 'border-yellow-500 bg-white shadow-sm ring-2 ring-yellow-200'
                    : 'border-yellow-100 bg-white/80 hover:border-yellow-400 hover:bg-white'
                }`}
              >
                {selected && <span className="absolute inset-y-0 left-0 w-1 animate-pulse bg-yellow-400" />}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-zinc-950">{option.title || 'Untitled section'}</p>
                    <p className="mt-1 text-xs font-semibold text-zinc-500">
                      {option.manual || 'Manual'}{option.page ? ` - p.${option.page}` : ''}{option.sourceType ? ` - ${option.sourceType}` : ''}
                    </p>
                    {option.reason && <p className="mt-2 text-sm font-semibold leading-6 text-zinc-700">{option.reason}</p>}
                  </div>
                  <span className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-black ${selected ? 'bg-yellow-400 text-zinc-950' : 'bg-zinc-100 text-zinc-600'}`}>
                    {selected ? 'Selected' : option.confidence || 'Option'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {state.options.length > 0 && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-semibold text-zinc-600">
            This confirmation step improves accuracy by anchoring the advice to a specific manual section.
          </p>
          <Button type="button" onClick={onGenerate} disabled={busy || state.selectedIds.length === 0}>
            Generate From Selected Section
          </Button>
        </div>
      )}
    </div>
  );
}

function ManualProgressOverlay({ phase, visible }) {
  if (!visible) return null;

  const steps = [
    {
      id: 'searching',
      title: 'Matching manual sections',
      description: 'Reading index headings and ranking possible maintenance sections.',
    },
    {
      id: 'generating',
      title: 'Generating verified suggestions',
      description: 'Building a selected-section PDF and extracting a structured answer from it.',
    },
  ];
  const activeIndex = Math.max(0, steps.findIndex((step) => step.id === phase));

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border-4 border-yellow-100 border-t-yellow-400">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-950" />
        </div>
        <p className="mt-5 text-center text-lg font-black text-zinc-950">{steps[activeIndex]?.title || 'Working'}</p>
        <p className="mt-2 text-center text-sm font-semibold leading-6 text-zinc-600">{steps[activeIndex]?.description}</p>
        <div className="mt-5 grid gap-3">
          {steps.map((step, index) => {
            const active = index === activeIndex;
            const done = index < activeIndex;
            return (
              <div key={step.id} className="flex items-center gap-3">
                <span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-black ${
                  done ? 'bg-green-600 text-white' : active ? 'animate-pulse bg-yellow-400 text-zinc-950' : 'bg-zinc-100 text-zinc-400'
                }`}
                >
                  {index + 1}
                </span>
                <div>
                  <p className={`text-sm font-black ${active || done ? 'text-zinc-950' : 'text-zinc-400'}`}>{step.title}</p>
                  <p className="text-xs font-semibold text-zinc-500">{done ? 'Complete' : active ? 'In progress' : 'Waiting'}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ManualAdvicePanel({ advice, onClear, onOpenSource }) {
  const sections = [
    ['Tools', advice.requiredTools],
    ['PPE', advice.ppe],
    ['Consumables', advice.consumables],
    ['Warnings', advice.warnings],
    ['Procedure', advice.procedureSummary],
  ];
  const alternatives = advice.alternatives || advice.manualAlternatives || [];
  const evidenceItems = Object.entries(advice.evidence || {})
    .flatMap(([category, items]) => (items || []).map((item) => ({
      category,
      text: item.text,
      source: item.source,
    })))
    .filter((item) => item.text && item.source)
    .slice(0, 8);

  return (
    <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-zinc-950">Manual Suggestions</p>
          <p className="mt-1 text-xs font-semibold text-zinc-600">Confidence: {advice.confidence || 'unknown'} · Source: {advice.generatedBy || 'manual search'}</p>
          {advice.interpretedTask && (
            <p className="mt-2 text-sm font-bold text-zinc-800">Interpreted as: {advice.interpretedTask}</p>
          )}
          {advice.matchedSectionTitle ? (
            <div className="mt-2 text-sm font-semibold text-zinc-700">
              <span className="font-black text-zinc-900">Matched section:</span> {advice.matchedSectionTitle}
            </div>
          ) : (advice.selectedManualTitles || []).length > 0 && (
            <div className="mt-2 text-sm font-semibold text-zinc-700">
              <span className="font-black text-zinc-900">Manual match:</span>{' '}
              {advice.selectedManualTitles.map((item) => `${item.title || 'Untitled'}${item.page ? ` (p.${item.page})` : ''}`).join(', ')}
            </div>
          )}
          {alternatives.length > 1 && (
            <div className="mt-2 text-sm font-semibold text-zinc-700">
              <span className="font-black text-zinc-900">Alternatives:</span>{' '}
              {alternatives.slice(1, 5).map((item) => `${item.title || 'Untitled'}${item.page ? ` (p.${item.page})` : ''}${item.confidence ? ` - ${item.confidence}` : ''}`).join(', ')}
            </div>
          )}
        </div>
        {onClear && (
          <button type="button" onClick={onClear} className="rounded-md border border-yellow-300 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700">
            Clear
          </button>
        )}
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {sections.map(([label, values]) => (
          <div key={label} className="rounded-md bg-white p-3">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">{label}</p>
            {(values || []).length === 0 ? (
              <p className="mt-2 text-sm text-zinc-500">-</p>
            ) : (
              <ul className="mt-2 grid gap-1 text-sm font-semibold text-zinc-700">
                {values.map((value) => <li key={value}>- {value}</li>)}
              </ul>
            )}
          </div>
        ))}
      </div>
      {(advice.interpretationNotes || []).length > 0 && (
        <div className="mt-3 rounded-md bg-white p-3">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">Interpretation Notes</p>
          <ul className="mt-2 grid gap-1 text-sm font-semibold text-zinc-700">
            {advice.interpretationNotes.map((note) => <li key={note}>- {note}</li>)}
          </ul>
        </div>
      )}
      {(advice.sources || []).length > 0 && (
        <div className="mt-3 rounded-md bg-white p-3">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">Sources</p>
          <div className="mt-2 grid gap-2">
            {advice.sources.map((source, index) => (
              <ManualSourceRow
                key={`${source.manualId || source.manual || 'manual'}-${source.page || index}-${source.section || index}`}
                source={source}
                onOpenSource={onOpenSource}
              />
            ))}
          </div>
        </div>
      )}
      {evidenceItems.length > 0 && (
        <div className="mt-3 rounded-md bg-white p-3">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">Evidence</p>
          <ul className="mt-2 grid gap-2 text-sm font-semibold text-zinc-700">
            {evidenceItems.map((item) => (
              <li key={`${item.category}-${item.text}`}>
                <span className="font-black text-zinc-900">{item.category}:</span> {item.text}
                <span className="block text-xs font-semibold text-zinc-500">
                  {item.source.manual || item.source.machineModel || 'Manual'}
                  {item.source.page ? ` p.${item.source.page}` : ''}
                  {item.source.section ? ` - ${item.source.section}` : ''}
                  {item.source.excerpt ? ` - "${item.source.excerpt}"` : ''}
                </span>
                {item.source.pagePdfUrl && onOpenSource && (
                  <button
                    type="button"
                    onClick={() => onOpenSource(item.source, 'open')}
                    className="mt-1 rounded-md border border-yellow-300 bg-yellow-50 px-2.5 py-1 text-xs font-black text-zinc-800 hover:border-yellow-500"
                  >
                    Open page
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ManualSourceRow({ source, onOpenSource }) {
  const label = `${source.manual || source.machineModel || 'Manual'}${source.matchedSectionTitle || source.section ? ` - ${source.matchedSectionTitle || source.section}` : ''} p.${source.page || '-'}`;
  const canOpen = Boolean(onOpenSource && (source.pagePdfUrl || (source.manualId && source.page)));

  return (
    <div className="flex flex-col gap-2 rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-semibold text-zinc-700">{label}</p>
      {canOpen && (
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => onOpenSource(source, 'open')}
            className="rounded-md border border-yellow-300 bg-white px-2.5 py-1 text-xs font-black text-zinc-800 hover:border-yellow-500"
          >
            Open page
          </button>
          <button
            type="button"
            onClick={() => onOpenSource(source, 'manual')}
            className="rounded-md border border-yellow-300 bg-yellow-50 px-2.5 py-1 text-xs font-black text-zinc-800 hover:border-yellow-500"
          >
            Open manual
          </button>
          <button
            type="button"
            onClick={() => onOpenSource(source, 'download')}
            className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-black text-zinc-700 hover:border-zinc-500"
          >
            Download
          </button>
        </div>
      )}
    </div>
  );
}

function formatDateTime(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function ScheduleSlotModal({ task, onClose, onOpenManualSource }) {
  const photos = Array.isArray(task.photos) ? task.photos : [];
  const hasCompletion = task.status === 'COMPLETED' || task.summary || task.completedAt || photos.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-zinc-100 bg-white px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">Schedule Slot</p>
            <h3 className="mt-1 text-2xl font-black text-zinc-950">{task.task || 'Scheduled task'}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-bold text-zinc-700 hover:border-zinc-500"
          >
            Close
          </button>
        </div>

        <div className="grid gap-5 p-5">
          <div className="grid gap-3 md:grid-cols-4">
            <SlotDetail label="Date" value={formatDate(task.workDate)} />
            <SlotDetail label="Time" value={`${task.startsAt || '-'} - ${task.endsAt || '-'}`} />
            <SlotDetail label="Location" value={task.location || '-'} />
            <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">Status</p>
              <div className="mt-2">
                <Badge tone={statusTone[task.status] || 'neutral'}>{task.status || 'PLANNED'}</Badge>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-md border border-zinc-200 p-4">
              <p className="text-sm font-black text-zinc-950">Description</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700">{task.description || '-'}</p>
            </div>
            <div className="rounded-md border border-zinc-200 p-4">
              <p className="text-sm font-black text-zinc-950">Technicians</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(task.technicians || []).length === 0 && <p className="text-sm text-zinc-500">No technicians assigned.</p>}
                {(task.technicians || []).map((technician) => (
                  <Badge key={technician.id} tone="neutral">{technicianName(technician)}</Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-md border border-zinc-200 p-4">
            <p className="text-sm font-black text-zinc-950">Task Notes</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700">{task.notes || '-'}</p>
          </div>

          {task.manualAdvice && <ManualAdvicePanel advice={task.manualAdvice} onOpenSource={onOpenManualSource} />}

          <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-black text-zinc-950">Technician Completion</p>
              <p className="text-xs font-semibold text-zinc-500">Completed: {formatDateTime(task.completedAt)}</p>
            </div>
            {hasCompletion ? (
              <div className="mt-3 grid gap-4">
                <div className="rounded-md border border-zinc-200 bg-white p-3">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">Summary</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700">{task.summary || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">Photos</p>
                  {photos.length === 0 ? (
                    <p className="mt-2 text-sm font-semibold text-zinc-500">No photos uploaded.</p>
                  ) : (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {photos.map((photo, index) => (
                        <a
                          key={`${photo.fileName || 'photo'}-${index}`}
                          href={photo.dataUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="overflow-hidden rounded-md border border-zinc-200 bg-white"
                        >
                          <img
                            src={photo.dataUrl}
                            alt={photo.fileName || `Task photo ${index + 1}`}
                            className="h-44 w-full object-cover"
                          />
                          <span className="block truncate px-3 py-2 text-xs font-semibold text-zinc-600">
                            {photo.fileName || `Photo ${index + 1}`}
                          </span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="mt-3 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm font-semibold text-yellow-800">
                No technician completion has been submitted for this slot yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SlotDetail({ label, value }) {
  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">{label}</p>
      <p className="mt-2 text-sm font-bold text-zinc-900">{value}</p>
    </div>
  );
}
