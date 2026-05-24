'use client';

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { clearStoredUser, getStoredPlatformSession, setStoredPlatformSession, setStoredUser } from '../../lib/auth';
import {
  formatArabicDate,
  getTaskActionLabel,
  getTaskDisplayStatus,
  isTaskCompleted,
  isTaskInProgress,
  isTaskOverdue,
} from '../../lib/taskDisplay';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'https://eqp-1.onrender.com';
const CACHE_KEY = 'technicianTasksCache';
const DRAFT_KEY = 'technicianTaskDrafts';
const WEATHER_CACHE_KEY = 'technicianWeatherCache';

function today() {
  const value = new Date();
  if (value.getHours() >= 18) value.setDate(value.getDate() + 1);
  return [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, '0'),
    String(value.getDate()).padStart(2, '0'),
  ].join('-');
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

function getTaskChecklist(task) {
  const items = Array.isArray(task?.checklist) ? task.checklist : [];
  const normalized = items
    .map((item, index) => ({
      id: String(item?.id || `point-${index + 1}`),
      text: String(item?.text || item?.title || item || '').trim(),
      required: item?.required === false ? false : true,
    }))
    .filter((item) => item.text);

  if (normalized.length) return normalized;
  const fallbackText = String(task?.description || task?.task || '').trim();
  return fallbackText ? [{ id: 'point-1', text: fallbackText, required: true }] : [];
}

function buildChecklistReports(task, draft) {
  const reports = Array.isArray(draft?.checklistReports) ? draft.checklistReports : [];
  return getTaskChecklist(task).map((item) => ({
    id: item.id,
    done: Boolean(reports.find((report) => report.id === item.id)?.done),
    notes: reports.find((report) => report.id === item.id)?.notes || '',
    photos: reports.find((report) => report.id === item.id)?.photos || [],
  }));
}

export default function TechnicianAppPage() {
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState(null);
  const [date, setDate] = useState(today());
  const [tasks, setTasks] = useState([]);
  const [technician, setTechnician] = useState(null);
  const [weatherAdvice, setWeatherAdvice] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [loginForm, setLoginForm] = useState({ email: '', employeeCode: '' });
  const [loading, setLoading] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [message, setMessage] = useState('');
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      setSession(getStoredPlatformSession());
      setDrafts(readJson(DRAFT_KEY, {}));
      setOnline(typeof navigator === 'undefined' ? true : navigator.onLine);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const token = session?.token || '';
  const selectedTask = useMemo(() => tasks.find((task) => task.id === selectedTaskId) || tasks[0] || null, [selectedTaskId, tasks]);
  const selectedDraft = selectedTask ? drafts[selectedTask.id] || { summary: '', notes: '', photos: [], checklistReports: [] } : { summary: '', notes: '', photos: [], checklistReports: [] };
  const selectedChecklistReports = selectedTask ? buildChecklistReports(selectedTask, selectedDraft) : [];
  const pendingCount = Object.values(drafts).filter((draft) => draft.pending).length;
  const completedCount = tasks.filter((task) => isTaskCompleted(task)).length;
  const overdueCount = tasks.filter((task) => isTaskOverdue(task)).length;

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
    if (!response.ok) throw new Error(data.error || data.message || 'تعذر تنفيذ الطلب');
    return data;
  }, [token]);

  const loadWeatherAdvice = useCallback(async (nextDate = date) => {
    if (!token) return;
    setWeatherLoading(true);
    try {
      const data = await request(`/api/technician/weather?date=${encodeURIComponent(nextDate)}`);
      setWeatherAdvice(data.items || []);
      writeJson(WEATHER_CACHE_KEY, { date: nextDate, items: data.items || [] });
    } catch {
      const cached = readJson(WEATHER_CACHE_KEY, null);
      setWeatherAdvice(cached?.date === nextDate ? cached.items || [] : []);
    } finally {
      setWeatherLoading(false);
    }
  }, [date, request, token]);

  const loadTasks = useCallback(async (nextDate = date) => {
    if (!token) return;
    setLoading(true);
    setMessage('');
    try {
      const data = await request(`/api/technician/tasks?date=${encodeURIComponent(nextDate)}`);
      const nextTasks = data.tasks || [];
      setDate(nextDate);
      setTasks(nextTasks);
      setTechnician(data.technician || null);
      setSelectedTaskId((current) => (nextTasks.some((task) => task.id === current) ? current : nextTasks[0]?.id || ''));
      writeJson(CACHE_KEY, { date: nextDate, tasks: nextTasks, technician: data.technician || null });
      await loadWeatherAdvice(nextDate);
    } catch (error) {
      const cached = readJson(CACHE_KEY, null);
      if (cached?.tasks) {
        setDate(cached.date || nextDate);
        setTasks(cached.tasks);
        setTechnician(cached.technician || null);
        setMessage('وضع بدون اتصال: يتم عرض آخر جدول محفوظ على الجهاز.');
      } else {
        setMessage(error.message || 'تعذر تحميل المهام. حاول مرة أخرى.');
      }
    } finally {
      setLoading(false);
    }
  }, [date, loadWeatherAdvice, request, token]);

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
          checklistReports: draft.checklistReports || [],
        }),
      });
      delete currentDrafts[taskId];
    }

    writeJson(DRAFT_KEY, currentDrafts);
    setDrafts(currentDrafts);
    await loadTasks(date);
    setMessage('تم إرسال المهام المحفوظة بعد عودة الاتصال.');
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

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  async function signIn(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(`${API_BASE}/api/auth/technician-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || data.message || 'تعذر تسجيل الدخول');
      setStoredPlatformSession(data.token, data.user);
      if (data.user?.sessionToken) setStoredUser(data.user);
      window.location.reload();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    clearStoredUser();
    setSession(null);
    setTasks([]);
    setTechnician(null);
  }

  async function speak(task) {
    if (!task) return;
    setAudioLoading(true);
    setMessage('');
    try {
      const response = await fetch(`${API_BASE}/api/technician/tasks/${task.id}/audio`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'تعذر إنشاء الصوت بالذكاء الاصطناعي.');
      }

      const blob = await response.blob();
      const nextUrl = URL.createObjectURL(blob);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(nextUrl);

      const audio = new Audio(nextUrl);
      await audio.play();
    } catch (error) {
      setMessage(error.message || 'تعذر تشغيل الصوت بالذكاء الاصطناعي. تحقق من إعدادات OpenAI في الخادم.');
    } finally {
      setAudioLoading(false);
    }
  }

  function updateDraft(taskId, patch) {
    const nextDrafts = {
      ...drafts,
      [taskId]: {
        summary: '',
        notes: '',
        photos: [],
        checklistReports: [],
        ...(drafts[taskId] || {}),
        ...patch,
      },
    };
    setDrafts(nextDrafts);
    writeJson(DRAFT_KEY, nextDrafts);
  }

  async function handlePointPhotos(taskId, pointId, files) {
    const selected = Array.from(files || []).slice(0, 6);
    const photos = await Promise.all(selected.map(readFileAsDataUrl));
    updateChecklistReport(taskId, pointId, { photos });
  }

  function updateChecklistReport(taskId, pointId, patch) {
    const currentDraft = drafts[taskId] || {};
    const currentReports = Array.isArray(currentDraft.checklistReports) ? currentDraft.checklistReports : [];
    const nextReports = currentReports.some((report) => report.id === pointId)
      ? currentReports.map((report) => (report.id === pointId ? { ...report, ...patch } : report))
      : [...currentReports, { id: pointId, done: false, notes: '', photos: [], ...patch }];
    updateDraft(taskId, { checklistReports: nextReports });
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

  async function completeTask(task) {
    const taskId = task.id;
    const draft = drafts[taskId] || {};
    const reports = buildChecklistReports(task, draft);
    const incompletePoint = reports.find((report) => !report.done);
    const missingEvidence = reports.find((report) => report.done && (!report.notes?.trim() || report.photos.length === 0));

    if (incompletePoint) {
      setMessage('أكمل كل نقطة في المهمة قبل الإرسال.');
      return;
    }
    if (missingEvidence) {
      setMessage('كل نقطة تحتاج ملاحظة وصورة واحدة على الأقل.');
      return;
    }

    const nextDraft = {
      ...draft,
      checklistReports: reports,
      summary: draft.summary?.trim() || reports.map((report, index) => `${index + 1}. ${getTaskChecklist(task)[index]?.text}`).join('\n'),
      pending: true,
    };
    updateDraft(taskId, nextDraft);

    if (!online) {
      setMessage('تم الحفظ بدون اتصال. سيتم الإرسال عند عودة الاتصال.');
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
    } catch {
      updateDraft(taskId, nextDraft);
      setMessage('تم الحفظ بدون اتصال. سيتم الإرسال عند عودة الاتصال.');
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) {
    return <main dir="rtl" className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-ink)]" />;
  }

  if (!token) {
    return (
      <main dir="rtl" className="grid min-h-screen place-items-center bg-[var(--color-canvas)] px-5 text-[var(--color-ink)]">
        <Card className="w-full max-w-sm p-6 text-center">
          <div className="ds-brand-mark mx-auto h-14 w-14 text-xl">DH</div>
          <h1 className="mt-5 text-2xl font-black">تطبيق الفني</h1>
          <p className="mt-2 text-sm font-semibold text-zinc-600">ادخل بالإيميل ورقم الفني</p>
          {message && <div className="ds-alert ds-alert-error mt-4 text-right">{message}</div>}
          <form onSubmit={signIn} className="mt-5 grid gap-3 text-right">
            <input
              type="email"
              inputMode="email"
              value={loginForm.email}
              onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="الإيميل"
              className="ds-input h-12 text-base font-semibold"
            />
            <input
              value={loginForm.employeeCode}
              onChange={(event) => setLoginForm((current) => ({ ...current, employeeCode: event.target.value.toUpperCase() }))}
              placeholder="رقم الفني مثال TEST-1015"
              className="ds-input h-12 text-base font-semibold uppercase"
            />
            <Button type="submit" className="w-full py-4 text-base" disabled={loading}>تسجيل الدخول</Button>
          </form>
        </Card>
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-ink)]">
      <header className="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[rgba(252,252,252,0.94)] px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-[0.12em] text-[var(--color-muted)]">تطبيق الفني</p>
            <h1 className="mt-1 text-2xl font-black">مهام الفني</h1>
            <p className="mt-1 text-sm font-semibold text-[var(--color-muted)]">
              {technician?.user?.fullName || session.user?.fullName || 'جدول اليوم'}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
            <Badge tone={online ? 'green' : 'red'}>{online ? 'متصل' : 'غير متصل'}</Badge>
            <Button type="button" variant="ghost" onClick={logout}>خروج</Button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-4xl gap-4 px-4 py-4">
        <Card className="p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <label className="text-xs font-bold text-[var(--color-muted)]">التاريخ</label>
              <input type="date" value={date} onChange={(event) => loadTasks(event.target.value)} className="ds-input mt-1 h-11 w-full text-sm font-bold" />
              <p className="mt-2 text-sm font-semibold text-[var(--color-muted)]">{formatArabicDate(date)}</p>
            </div>
            <Button type="button" variant="secondary" onClick={() => loadTasks(date)} disabled={loading}>تحديث</Button>
          </div>
        </Card>

        <div className="grid gap-3 sm:grid-cols-3">
          <TaskSummaryCard label="مهام اليوم" value={tasks.length} />
          <TaskSummaryCard label="متأخرة" value={overdueCount} tone={overdueCount ? 'critical' : 'neutral'} />
          <TaskSummaryCard label="مكتملة" value={completedCount} tone={completedCount ? 'completed' : 'neutral'} />
        </div>

        {pendingCount > 0 && <Badge tone="yellow">{pendingCount} بانتظار الإرسال</Badge>}
        {loading && <div className="ds-alert text-right">جاري تحميل المهام...</div>}
        {message && <div className="ds-alert text-right">{message}</div>}

        <WeatherAdviceCard items={weatherAdvice} loading={weatherLoading} />

        <section className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black">قائمة المهام</h2>
            <span className="text-sm font-semibold text-[var(--color-muted)]">{tasks.length} مهمة</span>
          </div>

          {!loading && tasks.length === 0 && (
            <Card className="p-5 text-center">
              <p className="text-lg font-black">لا توجد مهام لهذا اليوم</p>
              <p className="mt-2 text-sm font-semibold text-[var(--color-muted)]">اختر تاريخاً آخر أو اضغط تحديث للتحقق من المهام الجديدة.</p>
            </Card>
          )}

          {tasks.map((task) => (
            <TechnicianTaskCard
              key={task.id}
              task={task}
              selected={selectedTask?.id === task.id}
              loading={loading}
              onSelect={() => setSelectedTaskId(task.id)}
              onStart={() => startTask(task.id)}
            />
          ))}
        </section>

        {selectedTask && (
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black">{selectedTask.task}</h2>
                <p className="mt-1 text-sm font-bold text-[var(--color-muted)]">{selectedTask.startsAt} - {selectedTask.endsAt}</p>
              </div>
              <Button type="button" variant="secondary" onClick={() => speak(selectedTask)} disabled={audioLoading}>
                {audioLoading ? 'جاري تجهيز الصوت...' : 'استماع بالذكاء الاصطناعي'}
              </Button>
            </div>
            <p className="mt-3 text-xs font-semibold text-[var(--color-muted)]">
              الصوت مولد بالذكاء الاصطناعي لمساعدة الفني على فهم سياق المهمة ونقاط العمل.
            </p>
            {audioUrl && (
              <audio src={audioUrl} controls className="mt-3 w-full">
                <track kind="captions" />
              </audio>
            )}

            <div className="mt-4 grid gap-3 text-sm text-zinc-700 sm:grid-cols-2">
              <Info label="المعدة" value={selectedTask.machineModel || '-'} />
              <Info label="الموقع" value={selectedTask.location || '-'} />
              <Info label="الوصف" value={selectedTask.description || '-'} />
              <Info label="الملاحظات" value={selectedTask.notes || '-'} />
            </div>

            {selectedTask.manualAdvice && <TechnicianManualAdvice advice={selectedTask.manualAdvice} />}

            {!isTaskCompleted(selectedTask) && (
              <div className="mt-5 grid gap-3">
                {!isTaskInProgress(selectedTask) && (
                  <Button type="button" variant="secondary" onClick={() => startTask(selectedTask.id)} disabled={loading || !online}>
                    بدء المهمة
                  </Button>
                )}
                <div className="grid gap-3">
                  <div>
                    <h3 className="text-lg font-black">نقاط العمل</h3>
                    <p className="mt-1 text-sm font-semibold text-[var(--color-muted)]">علّم كل نقطة، اكتب ملاحظتك، وارفع صورة توثيق واضحة.</p>
                  </div>
                  {getTaskChecklist(selectedTask).map((item, index) => {
                    const report = selectedChecklistReports.find((entry) => entry.id === item.id) || { done: false, notes: '', photos: [] };
                    return (
                      <div key={item.id} className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3">
                        <div className="flex items-start gap-3">
                          <label className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white">
                            <input
                              type="checkbox"
                              checked={report.done}
                              onChange={(event) => updateChecklistReport(selectedTask.id, item.id, { done: event.target.checked })}
                            />
                          </label>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-black text-[var(--color-ink)]">{index + 1}. {item.text}</p>
                            <textarea
                              rows={2}
                              placeholder="ملاحظات هذه النقطة"
                              value={report.notes}
                              onChange={(event) => updateChecklistReport(selectedTask.id, item.id, { notes: event.target.value })}
                              className="ds-input mt-3 px-3 py-2 text-sm"
                            />
                            <label className="mt-3 grid gap-2 text-sm font-bold text-zinc-700">
                              صورة النقطة
                              <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                multiple
                                onChange={(event) => handlePointPhotos(selectedTask.id, item.id, event.target.files)}
                                className="rounded-md border border-[var(--color-border-strong)] bg-white p-3 text-sm"
                              />
                            </label>
                            {report.photos.length > 0 && (
                              <div className="mt-3 grid grid-cols-3 gap-2">
                                {report.photos.map((photo) => (
                                  <img key={photo.fileName} src={photo.dataUrl} alt={photo.fileName} className="h-24 w-full rounded-md object-cover" />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <textarea
                  rows={3}
                  placeholder="ملخص عام اختياري"
                  value={selectedDraft.summary || ''}
                  onChange={(event) => updateDraft(selectedTask.id, { summary: event.target.value })}
                  className="ds-input px-3 py-3 text-base"
                />
                <textarea
                  rows={2}
                  placeholder="ملاحظات إضافية"
                  value={selectedDraft.notes || ''}
                  onChange={(event) => updateDraft(selectedTask.id, { notes: event.target.value })}
                  className="ds-input px-3 py-3 text-base"
                />
                <Button type="button" onClick={() => completeTask(selectedTask)} disabled={loading}>
                  إرسال المهمة
                </Button>
              </div>
            )}

            {isTaskCompleted(selectedTask) && (
              <div className="ds-alert mt-5 text-right">هذه المهمة مكتملة.</div>
            )}
          </Card>
        )}
      </section>
    </main>
  );
}

function TaskSummaryCard({ label, value, tone = 'neutral' }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-bold text-[var(--color-muted)]">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="text-3xl font-black text-[var(--color-ink)]">{value}</p>
        <Badge tone={tone}>{label}</Badge>
      </div>
    </Card>
  );
}

function WeatherAdviceCard({ items, loading }) {
  const first = items?.[0] || null;
  const advice = (items || []).flatMap((item) => item.advice || []).slice(0, 2);

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black">الطقس ونصائح السلامة</h2>
          {loading && <p className="mt-1 text-sm font-semibold text-[var(--color-muted)]">جاري تحميل النصائح...</p>}
        </div>
        {first?.weather?.maxTempC && <Badge tone="info">{first.weather.maxTempC}°C</Badge>}
      </div>

      {!loading && !first && (
        <p className="mt-3 text-sm font-semibold text-[var(--color-muted)]">لا توجد نصائح طقس لهذا اليوم.</p>
      )}

      {first && (
        <div className="mt-3 grid gap-2 text-sm font-semibold text-zinc-700">
          {first.weather?.condition && <p>{first.weather.condition}</p>}
          {advice.length === 0 ? (
            <p className="text-[var(--color-muted)]">لا توجد نصائح طقس لهذا اليوم.</p>
          ) : (
            advice.map((item, index) => <p key={`${item}-${index}`}>{item}</p>)
          )}
        </div>
      )}
    </Card>
  );
}

function TechnicianTaskCard({ task, selected, loading, onSelect, onStart }) {
  const status = getTaskDisplayStatus(task);
  const actionLabel = getTaskActionLabel(task.status);
  const readOnly = isTaskCompleted(task);

  return (
    <Card className={`p-4 transition ${selected ? 'ring-2 ring-[var(--ring)]' : ''}`}>
      <div className="flex flex-col gap-3">
        <button type="button" onClick={onSelect} className="text-right">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-[var(--color-ink)]">{task.task}</h3>
              <p className="mt-1 text-sm font-bold text-[var(--color-muted)]">{task.machineModel || 'معدة غير محددة'}</p>
            </div>
            <Badge tone={status.tone}>{status.label}</Badge>
          </div>
          <div className="mt-3 grid gap-2 text-sm font-semibold text-zinc-700 sm:grid-cols-2">
            <span>{task.location || 'موقع غير محدد'}</span>
            <span>{task.startsAt || '-'} - {task.endsAt || '-'}</span>
          </div>
          {task.description && <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-600">{task.description}</p>}
        </button>

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={readOnly ? onSelect : onStart} disabled={loading}>
            {actionLabel}
          </Button>
          <Button type="button" variant="secondary" onClick={onSelect}>تفاصيل</Button>
        </div>
      </div>
    </Card>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3">
      <p className="text-xs font-bold text-[var(--color-muted)]">{label}</p>
      <p className="mt-1 whitespace-pre-wrap font-semibold text-[var(--color-ink)]">{value}</p>
    </div>
  );
}

function TechnicianManualAdvice({ advice }) {
  const steps = advice?.steps || [];
  const warnings = advice?.warnings || [];

  return (
    <div className="mt-5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
      <h3 className="text-base font-black">إرشادات الصيانة</h3>
      {advice?.summary && <p className="mt-2 text-sm leading-6 text-zinc-700">{advice.summary}</p>}
      {steps.length > 0 && (
        <ol className="mt-3 grid gap-2 text-sm font-semibold leading-6 text-zinc-700">
          {steps.slice(0, 5).map((step, index) => <li key={`${step}-${index}`}>{index + 1}. {step}</li>)}
        </ol>
      )}
      {warnings.length > 0 && (
        <div className="mt-3 rounded-md border border-[var(--color-warning)] bg-[var(--color-warning-soft)] p-3 text-sm font-bold text-[var(--color-warning)]">
          {warnings[0]}
        </div>
      )}
    </div>
  );
}
