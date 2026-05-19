'use client';

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { clearStoredUser, getStoredPlatformSession, setStoredPlatformSession, setStoredUser } from '../../lib/auth';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'https://eqp-1.onrender.com';
const CACHE_KEY = 'technicianTasksCache';
const DRAFT_KEY = 'technicianTaskDrafts';
const WEATHER_CACHE_KEY = 'technicianWeatherCache';

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
  const value = new Date();
  if (value.getHours() >= 18) {
    value.setDate(value.getDate() + 1);
  }
  return [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, '0'),
    String(value.getDate()).padStart(2, '0'),
  ].join('-');
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
  const [weatherAdvice, setWeatherAdvice] = useState([]);
  const [drafts, setDrafts] = useState(() => readJson(DRAFT_KEY, {}));
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [loginForm, setLoginForm] = useState({ email: '', employeeCode: '' });
  const [loading, setLoading] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState('');
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

  const loadWeatherAdvice = useCallback(async (nextDate = date) => {
    if (!token) return;
    setWeatherLoading(true);
    setWeatherError('');
    try {
      const data = await request(`/api/technician/weather?date=${encodeURIComponent(nextDate)}`);
      setWeatherAdvice(data.items || []);
      writeJson(WEATHER_CACHE_KEY, { date: nextDate, items: data.items || [] });
    } catch (error) {
      const cached = readJson(WEATHER_CACHE_KEY, null);
      setWeatherAdvice(cached?.date === nextDate ? cached.items || [] : []);
      setWeatherError(error.message || 'Weather advice is currently unavailable.');
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
      setDate(nextDate);
      setTasks(data.tasks || []);
      setTechnician(data.technician || null);
      writeJson(CACHE_KEY, { date: nextDate, tasks: data.tasks || [], technician: data.technician || null });
      await loadWeatherAdvice(nextDate);
    } catch (error) {
      const cached = readJson(CACHE_KEY, null);
      if (cached?.tasks) {
        setDate(cached.date || nextDate);
        setTasks(cached.tasks);
        setTechnician(cached.technician || null);
        const cachedWeather = readJson(WEATHER_CACHE_KEY, null);
        setWeatherAdvice(cachedWeather?.date === (cached.date || nextDate) ? cachedWeather.items || [] : []);
        setMessage('وضع بدون إنترنت: يتم عرض آخر جدول محفوظ على الجهاز.');
      } else {
        setMessage(error.message);
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
          <p className="mt-2 text-sm font-semibold text-zinc-600">ادخل بالإيميل ورقم الفني</p>
          {message && <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{message}</div>}
          <form onSubmit={signIn} className="mt-5 grid gap-3 text-right">
            <input
              type="email"
              inputMode="email"
              value={loginForm.email}
              onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="الإيميل"
              className="h-12 rounded-md border border-zinc-300 bg-white px-3 text-base font-semibold outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
            />
            <input
              value={loginForm.employeeCode}
              onChange={(event) => setLoginForm((current) => ({ ...current, employeeCode: event.target.value.toUpperCase() }))}
              placeholder="رقم الفني مثال TECH-1005"
              className="h-12 rounded-md border border-zinc-300 bg-white px-3 text-base font-semibold uppercase outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
            />
            <Button type="submit" className="w-full py-4 text-base" disabled={loading}>تسجيل الدخول</Button>
          </form>
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

        <WeatherAdviceCard items={weatherAdvice} loading={weatherLoading} error={weatherError} />

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

            {selectedTask.manualAdvice && <TechnicianManualAdvice advice={selectedTask.manualAdvice} />}

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

function WeatherAdviceCard({ items, loading, error }) {
  if (loading && items.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-sm font-black text-zinc-950">الطقس ونصائح السلامة</p>
        <p className="mt-2 text-sm font-semibold text-zinc-500">جاري تحميل توقعات الطقس للموقع...</p>
      </Card>
    );
  }

  if (error && items.length === 0) {
    return (
      <Card className="border-yellow-200 bg-yellow-50 p-4">
        <p className="text-sm font-black text-zinc-950">Ø§Ù„Ø·Ù‚Ø³ ÙˆÙ†ØµØ§Ø¦Ø­ Ø§Ù„Ø³Ù„Ø§Ù…Ø©</p>
        <p className="mt-2 text-sm font-semibold text-zinc-700">{error}</p>
      </Card>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <Card className="border-yellow-200 bg-yellow-50 p-4">
        <p className="text-sm font-black text-zinc-950">Ø§Ù„Ø·Ù‚Ø³ ÙˆÙ†ØµØ§Ø¦Ø­ Ø§Ù„Ø³Ù„Ø§Ù…Ø©</p>
        <p className="mt-2 text-sm font-semibold text-zinc-700">No weather advice for the selected day.</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-yellow-200 bg-yellow-50">
      <div className="border-b border-yellow-200 px-4 py-3">
        <p className="text-sm font-black text-zinc-950">الطقس ونصائح السلامة</p>
        <p className="mt-1 text-xs font-semibold text-zinc-600">حسب موقع ووقت كل مهمة</p>
      </div>
      <div className="grid gap-3 p-4">
        {items.map((item) => (
          <div key={item.taskId} className="rounded-md border border-yellow-200 bg-white p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black text-zinc-950">{item.task}</p>
                <p className="mt-1 text-xs font-semibold text-zinc-500">{item.location || item.resolvedLocation}</p>
              </div>
              <div className="rounded-md bg-zinc-950 px-3 py-2 text-center text-white">
                <p className="text-xl font-black">{item.maxTemperatureC ?? '-'}</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-300">MAX C</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-bold text-zinc-700">
              <span className="rounded bg-zinc-50 px-2 py-2">{item.condition || '-'}</span>
              <span className="rounded bg-zinc-50 px-2 py-2">مطر {item.maxRainChance ?? '-'}%</span>
              <span className="rounded bg-zinc-50 px-2 py-2">رياح {item.maxWindKph ?? '-'} كم/س</span>
            </div>
            <ul className="mt-3 grid gap-2 text-sm font-semibold leading-6 text-zinc-800">
              {(item.advice || []).map((line) => (
                <li key={line} className="rounded-md bg-yellow-50 px-3 py-2">{line}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
}

function TechnicianManualAdvice({ advice }) {
  const rows = [
    ['Ø§Ù„Ø£Ø¯ÙˆØ§Øª', advice.requiredTools],
    ['Ù…Ø¹Ø¯Ø§Øª Ø§Ù„Ø³Ù„Ø§Ù…Ø©', advice.ppe],
    ['ØªØ­Ø°ÙŠØ±Ø§Øª', advice.warnings],
  ];

  return (
    <div className="mt-4 rounded-md border border-yellow-200 bg-yellow-50 p-4">
      <p className="text-sm font-black text-zinc-950">Ø£Ø¯ÙˆØ§Øª ÙˆØªØ­Ø°ÙŠØ±Ø§Øª Ù…Ù† Ø§Ù„ÙƒØªØ§Ù„ÙˆØ¬</p>
      <div className="mt-3 grid gap-3">
        {rows.map(([label, values]) => (
          <div key={label} className="rounded-md bg-white p-3">
            <p className="text-xs font-bold text-zinc-500">{label}</p>
            <ul className="mt-2 grid gap-1 text-sm font-bold text-zinc-800">
              {(values || ['-']).map((value) => <li key={value}>- {value}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
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
