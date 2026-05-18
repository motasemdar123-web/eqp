'use client';

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { clearStoredUser, getStoredPlatformSession } from '../../lib/auth';
import { getMicrosoftLoginUrl } from '../../lib/api';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'https://eqp-1.onrender.com';
const CACHE_KEY = 'technicianTasksCache';
const DRAFT_KEY = 'technicianTaskDrafts';

const statusTone = {
  CONFIRMED: 'green',
  ON_DUTY: 'yellow',
  COMPLETED: 'dark',
  CANCELLED: 'red',
};

const statusLabels = {
  CONFIRMED: 'مؤكدة',
  ON_DUTY: 'قيد التنفيذ',
  COMPLETED: 'مكتملة',
  CANCELLED: 'ملغاة',
  PLANNED: 'مخططة',
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function taskSpeech(task) {
  return [
    `المهمة: ${task.task}`,
    task.location ? `الموقع: ${task.location}` : '',
    `الوقت: من ${task.startsAt} إلى ${task.endsAt}`,
    task.description ? `الوصف: ${task.description}` : '',
    task.notes ? `الملاحظات: ${task.notes}` : '',
  ].filter(Boolean).join('. ');
}

function readJson(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    return JSON.parse(localStorage.getItem(key) || 'null') || fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({
      fileName: file.name,
      mimeType: file.type || 'image/jpeg',
      dataUrl: String(reader.result || ''),
    });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function TechnicianAppPage() {
  const [session] = useState(() => getStoredPlatformSession());
  const [date, setDate] = useState(today());
  const [tasks, setTasks] = useState([]);
  const [technician, setTechnician] = useState(null);
  const [drafts, setDrafts] = useState(() => readJson(DRAFT_KEY, {}));
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));

  const token = session?.token || '';
  const selectedTask = useMemo(() => tasks.find((task) => task.id === selectedTaskId) || tasks[0] || null, [selectedTaskId, tasks]);
  const selectedDraft = selectedTask ? drafts[selectedTask.id] || { summary: '', notes: '', photos: [] } : { summary: '', notes: '', photos: [] };
  const pendingCount = Object.values(drafts).filter((draft) => draft.pending).length;

  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || data.message || 'فشل الطلب');
    return data;
  }, [token]);

  const loadTasks = useCallback(async (nextDate = date) => {
    if (!token) return;
    setLoading(true);
    setMessage('');
    try {
      const data = await request(`/api/technician/tasks?date=${encodeURIComponent(nextDate)}`);
      setDate(nextDate);
      setTasks(data.tasks || []);
      setTechnician(data.technician || null);
      writeJson(CACHE_KEY, { date: nextDate, tasks: data.tasks || [], technician: data.technician || null });
    } catch (error) {
      const cached = readJson(CACHE_KEY, null);
      if (cached?.tasks) {
        setDate(cached.date || nextDate);
        setTasks(cached.tasks);
        setTechnician(cached.technician || null);
        setMessage('وضع بدون إنترنت: يتم عرض آخر جدول محفوظ على الجهاز.');
      } else {
        setMessage(error.message);
      }
    } finally {
      setLoading(false);
    }
  }, [date, request, token]);

  const syncDrafts = useCallback(async () => {
    if (!token || !online) return;
    const currentDrafts = readJson(DRAFT_KEY, {});
    const pendingEntries = Object.entries(currentDrafts).filter(([, draft]) => draft.pending);
    if (pendingEntries.length === 0) return;

    for (const [taskId, draft] of pendingEntries) {
      await request(`/api/technician/tasks/${taskId}/complete`, {
        method: 'POST',
        body: JSON.stringify({
          summary: draft.summary,
          notes: draft.notes,
          photos: draft.photos || [],
        }),
      });
      delete currentDrafts[taskId];
    }

    writeJson(DRAFT_KEY, currentDrafts);
    setDrafts(currentDrafts);
    await loadTasks(date);
    setMessage('تم إرسال المهام المحفوظة بعد عودة الإنترنت.');
  }, [date, loadTasks, online, request, token]);

  useEffect(() => {
    if (!token) return undefined;
    const timer = setTimeout(() => loadTasks(date), 0);
    return () => clearTimeout(timer);
  }, [date, loadTasks, token]);

  useEffect(() => {
    function handleOnline() {
      setOnline(true);
    }
    function handleOffline() {
      setOnline(false);
    }
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/technician-sw.js').catch(() => {});
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      syncDrafts().catch((error) => setMessage(error.message));
    }, 0);
    return () => clearTimeout(timer);
  }, [syncDrafts]);

  function signIn() {
    window.location.href = getMicrosoftLoginUrl('/technician');
  }

  function logout() {
    clearStoredUser();
    window.location.href = '/';
  }

  function speak(task) {
    if (!task || typeof window === 'undefined' || !window.speechSynthesis) {
      setMessage('قراءة الصوت غير مدعومة على هذا الهاتف.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(taskSpeech(task));
    utterance.lang = 'ar-SA';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }

  function updateDraft(taskId, patch) {
    const nextDrafts = {
      ...drafts,
      [taskId]: {
        summary: '',
        notes: '',
        photos: [],
        ...(drafts[taskId] || {}),
        ...patch,
      },
    };
    setDrafts(nextDrafts);
    writeJson(DRAFT_KEY, nextDrafts);
  }

  async function handlePhotos(taskId, files) {
    const selected = Array.from(files || []).slice(0, 6);
    const photos = await Promise.all(selected.map(readFileAsDataUrl));
    updateDraft(taskId, { photos });
  }

  async function startTask(taskId) {
    setLoading(true);
    setMessage('');
    try {
      await request(`/api/technician/tasks/${taskId}/start`, { method: 'POST' });
      await loadTasks(date);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function completeTask(taskId) {
    const draft = drafts[taskId] || {};
    if (!draft.summary?.trim()) {
      setMessage('اكتب ملخصاً قصيراً قبل الإرسال.');
      return;
    }

    const nextDraft = { ...draft, pending: true };
    updateDraft(taskId, nextDraft);

    if (!online) {
      setMessage('تم الحفظ بدون إنترنت. سيتم الإرسال عند عودة الاتصال.');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      await request(`/api/technician/tasks/${taskId}/complete`, {
        method: 'POST',
        body: JSON.stringify(nextDraft),
      });
      const nextDrafts = { ...drafts };
      delete nextDrafts[taskId];
      setDrafts(nextDrafts);
      writeJson(DRAFT_KEY, nextDrafts);
      setMessage('تم إرسال المهمة.');
      await loadTasks(date);
    } catch (error) {
      updateDraft(taskId, nextDraft);
      setMessage('تم الحفظ بدون إنترنت. سيتم الإرسال عند عودة الاتصال.');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <main dir="rtl" className="grid min-h-screen place-items-center bg-[#edf1ea] px-5 text-zinc-950">
        <Card className="w-full max-w-sm p-6 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-md bg-yellow-400 text-xl font-black text-zinc-950">DH</div>
          <h1 className="mt-5 text-2xl font-black">تطبيق الفني</h1>
          <Button type="button" className="mt-6 w-full py-4 text-base" onClick={signIn}>تسجيل الدخول</Button>
        </Card>
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#edf1ea] text-zinc-950">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 px-4 py-4 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">تطبيق الفني</p>
            <h1 className="text-xl font-black">{technician?.user?.fullName || session.user?.fullName || 'جدول اليوم'}</h1>
          </div>
          <Button type="button" variant="ghost" onClick={logout}>خروج</Button>
        </div>
      </header>

      <section className="mx-auto grid max-w-lg gap-4 px-4 py-4">
        <div className="flex items-center gap-2">
          <input type="date" value={date} onChange={(event) => loadTasks(event.target.value)} className="h-11 flex-1 rounded-md border border-zinc-300 bg-white px-3 text-sm font-bold" />
          <Button type="button" variant="secondary" onClick={() => loadTasks(date)} disabled={loading}>تحديث</Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge tone={online ? 'green' : 'red'}>{online ? 'متصل' : 'بدون إنترنت'}</Badge>
          {pendingCount > 0 && <Badge tone="yellow">{pendingCount} بانتظار الإرسال</Badge>}
        </div>

        {message && <div className="rounded-md border border-zinc-200 bg-white px-4 py-3 text-sm font-bold text-zinc-700">{message}</div>}

        <div className="grid gap-3">
          {tasks.length === 0 && (
            <Card className="p-6 text-center">
              <p className="text-lg font-black">لا توجد مهام لهذا اليوم</p>
            </Card>
          )}
          {tasks.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => setSelectedTaskId(task.id)}
              className={`rounded-md border bg-white p-4 text-right shadow-sm ${selectedTask?.id === task.id ? 'border-zinc-950' : 'border-zinc-200'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-black">{task.task}</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-600">{task.startsAt} - {task.endsAt}</p>
                </div>
                <Badge tone={statusTone[task.status] || 'neutral'}>{statusLabels[task.status] || task.status}</Badge>
              </div>
              {task.location && <p className="mt-2 text-sm font-bold text-zinc-700">{task.location}</p>}
            </button>
          ))}
        </div>

        {selectedTask && (
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black">{selectedTask.task}</h2>
                <p className="mt-1 text-sm font-bold text-zinc-500">{selectedTask.startsAt} - {selectedTask.endsAt}</p>
              </div>
              <Button type="button" variant="secondary" onClick={() => speak(selectedTask)}>استماع</Button>
            </div>

            <div className="mt-4 grid gap-3 text-sm text-zinc-700">
              {selectedTask.location && <Info label="الموقع" value={selectedTask.location} />}
              <Info label="الوصف" value={selectedTask.description || '-'} />
              <Info label="الملاحظات" value={selectedTask.notes || '-'} />
            </div>

            {selectedTask.status !== 'COMPLETED' && (
              <div className="mt-5 grid gap-3">
                {selectedTask.status !== 'ON_DUTY' && (
                  <Button type="button" variant="secondary" onClick={() => startTask(selectedTask.id)} disabled={loading || !online}>
                    بدء المهمة
                  </Button>
                )}
                <textarea
                  rows={4}
                  placeholder="ملخص العمل المنجز"
                  value={selectedDraft.summary || ''}
                  onChange={(event) => updateDraft(selectedTask.id, { summary: event.target.value })}
                  className="rounded-md border border-zinc-300 bg-white px-3 py-3 text-base outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                />
                <textarea
                  rows={2}
                  placeholder="ملاحظات إضافية"
                  value={selectedDraft.notes || ''}
                  onChange={(event) => updateDraft(selectedTask.id, { notes: event.target.value })}
                  className="rounded-md border border-zinc-300 bg-white px-3 py-3 text-base outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                />
                <label className="grid gap-2 text-sm font-bold text-zinc-700">
                  الصور
                  <input type="file" accept="image/*" capture="environment" multiple onChange={(event) => handlePhotos(selectedTask.id, event.target.files)} className="rounded-md border border-zinc-300 bg-white p-3 text-sm" />
                </label>
                {(selectedDraft.photos || []).length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {selectedDraft.photos.map((photo) => (
                      <img key={photo.fileName} src={photo.dataUrl} alt={photo.fileName} className="h-24 w-full rounded-md object-cover" />
                    ))}
                  </div>
                )}
                <Button type="button" onClick={() => completeTask(selectedTask.id)} disabled={loading}>
                  إرسال المهمة
                </Button>
              </div>
            )}

            {selectedTask.status === 'COMPLETED' && (
              <div className="mt-5 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-800">
                مكتملة: {selectedTask.summary || 'تم الإرسال'}
              </div>
            )}
          </Card>
        )}
      </section>
    </main>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">{label}</p>
      <p className="mt-1 font-semibold text-zinc-800">{value}</p>
    </div>
  );
}
