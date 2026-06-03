'use client';

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
const APP_TIME_ZONE = 'Asia/Riyadh';

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

function compressImageFile(file, maxSize = 1280, quality = 0.72) {
  if (typeof window === 'undefined' || !file?.type?.startsWith('image/')) {
    return readFileAsDataUrl(file);
  }

  return new Promise((resolve) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(objectUrl);

      resolve({
        fileName: file.name.replace(/\.[^.]+$/, '.jpg'),
        mimeType: 'image/jpeg',
        dataUrl: canvas.toDataURL('image/jpeg', quality),
      });
    };

    image.onerror = async () => {
      URL.revokeObjectURL(objectUrl);
      resolve(await readFileAsDataUrl(file));
    };

    image.src = objectUrl;
  });
}

function supportedAudioRecordingType() {
  if (typeof MediaRecorder === 'undefined') return '';

  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/mp4;codecs=mp4a.40.2',
    'audio/aac',
    'audio/ogg;codecs=opus',
    'audio/ogg',
  ];

  return candidates.find((type) => {
    try {
      return MediaRecorder.isTypeSupported(type);
    } catch {
      return false;
    }
  }) || '';
}

function audioExtensionForType(type) {
  const cleanType = String(type || '').toLowerCase();
  if (cleanType.includes('mp4')) return 'm4a';
  if (cleanType.includes('aac')) return 'aac';
  if (cleanType.includes('ogg')) return 'ogg';
  if (cleanType.includes('mpeg') || cleanType.includes('mp3')) return 'mp3';
  return 'webm';
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
  const [submittingTaskId, setSubmittingTaskId] = useState('');
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [weatherExpanded, setWeatherExpanded] = useState(false);
  const [recordingKey, setRecordingKey] = useState('');
  const [transcribingKey, setTranscribingKey] = useState('');
  const [message, setMessage] = useState('');
  const [online, setOnline] = useState(true);
  const mediaRecorderRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const recordingMetaRef = useRef(null);

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
  const selectedTask = useMemo(() => tasks.find((task) => task.id === selectedTaskId) || null, [selectedTaskId, tasks]);
  const selectedDraft = selectedTask ? drafts[selectedTask.id] || { summary: '', notes: '', photos: [], checklistReports: [] } : { summary: '', notes: '', photos: [], checklistReports: [] };
  const selectedChecklistReports = selectedTask ? buildChecklistReports(selectedTask, selectedDraft) : [];
  const pendingCount = Object.values(drafts).filter((draft) => draft.pending).length;
  const completedCount = tasks.filter((task) => isTaskCompleted(task)).length;
  const overdueCount = tasks.filter((task) => isTaskOverdue(task)).length;
  const activeCount = tasks.filter((task) => isTaskInProgress(task)).length;

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
      setSelectedTaskId((current) => (nextTasks.some((task) => task.id === current) ? current : ''));
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
    setSelectedTaskId('');
    setMessage('');
    window.location.replace('/technician');
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

  async function transcribeAudio(blob, meta) {
    const form = new FormData();
    const extension = audioExtensionForType(blob.type || meta?.mimeType);
    form.append('audio', blob, `technician-note.${extension}`);
    form.append('target', meta?.target || '');
    form.append('taskTitle', meta?.taskTitle || selectedTask?.task || '');
    form.append('pointText', meta?.pointText || '');

    const response = await fetch(`${API_BASE}/api/technician/transcribe`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || data.message || 'تعذر تحويل الصوت إلى نص.');
    return String(data.text || '').trim();
  }

  function appendText(current, addition) {
    const nextText = String(addition || '').trim();
    if (!nextText) return current || '';
    const currentText = String(current || '').trim();
    return currentText ? `${currentText}\n${nextText}` : nextText;
  }

  async function startRecording(key, meta) {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setMessage('التسجيل الصوتي غير مدعوم على هذا الجهاز.');
      return;
    }
    if (recordingKey) stopRecording();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      const mimeType = supportedAudioRecordingType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recordingChunksRef.current = [];
      recordingMetaRef.current = { key, mimeType: recorder.mimeType || mimeType, ...meta };

      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) recordingChunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const activeMeta = recordingMetaRef.current;
        const blobType = recorder.mimeType || activeMeta?.mimeType || 'audio/webm';
        const audioBlob = new Blob(recordingChunksRef.current, { type: blobType });
        recordingChunksRef.current = [];
        recordingMetaRef.current = null;
        setRecordingKey('');
        if (!audioBlob.size || !activeMeta?.taskId) return;

        setTranscribingKey(activeMeta.key);
        setMessage('');
        try {
          const text = await transcribeAudio(audioBlob, activeMeta);
          if (activeMeta.pointId) {
            const currentReport = buildChecklistReports(selectedTask, drafts[activeMeta.taskId] || {})
              .find((report) => report.id === activeMeta.pointId);
            updateChecklistReport(activeMeta.taskId, activeMeta.pointId, {
              notes: appendText(currentReport?.notes, text),
            });
          } else {
            const currentDraft = drafts[activeMeta.taskId] || {};
            updateDraft(activeMeta.taskId, {
              [activeMeta.field]: appendText(currentDraft[activeMeta.field], text),
            });
          }
        } catch (error) {
          setMessage(error.message || 'تعذر تحويل الصوت إلى نص.');
        } finally {
          setTranscribingKey('');
        }
      };

      mediaRecorderRef.current = recorder;
      setRecordingKey(key);
      recorder.start(1000);
    } catch {
      setMessage('تعذر الوصول إلى الميكروفون. تأكد من صلاحيات المتصفح.');
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      try {
        recorder.requestData();
      } catch {
        // Some mobile browsers do not support requestData after short recordings.
      }
      recorder.stop();
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
    const photos = await Promise.all(selected.map((file) => compressImageFile(file)));
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
    if (submittingTaskId) return;

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

    setSubmittingTaskId(taskId);
    setMessage('');
    try {
      await request(`/api/technician/tasks/${taskId}/complete`, {
        method: 'POST',
        body: JSON.stringify({
          summary: nextDraft.summary,
          notes: nextDraft.notes,
          photos: nextDraft.photos || [],
          checklistReports: nextDraft.checklistReports || [],
        }),
      });
      const nextDrafts = { ...drafts };
      delete nextDrafts[taskId];
      setDrafts(nextDrafts);
      writeJson(DRAFT_KEY, nextDrafts);
      setMessage('تم إرسال المهمة.');
      await loadTasks(date);
    } catch (error) {
      updateDraft(taskId, nextDraft);
      setMessage(online
        ? (error.message || 'تعذر إرسال المهمة. تحقق من نقاط العمل والصور.')
        : 'تم الحفظ بدون اتصال. سيتم الإرسال عند عودة الاتصال.');
    } finally {
      setSubmittingTaskId('');
    }
  }

  if (!mounted) {
    return <main dir="rtl" className="tech-app" />;
  }

  if (!token) {
    return (
      <main dir="rtl" className="tech-login-shell">
        <Card className="tech-login-card">
          <div className="tech-login-mark">DH</div>
          <p className="tech-login-eyebrow">Dar Al Hai Maintenance</p>
          <h1>بوابة الفني</h1>
          <p>تسجيل دخول سريع لعرض مهام اليوم وتوثيق العمل من الموقع.</p>
          {message && <div className="ds-alert ds-alert-error mt-4 text-right">{message}</div>}
          <form onSubmit={signIn} className="tech-login-form">
            <input
              type="email"
              inputMode="email"
              value={loginForm.email}
              onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="الإيميل"
              className="ds-input"
            />
            <input
              value={loginForm.employeeCode}
              onChange={(event) => setLoginForm((current) => ({ ...current, employeeCode: event.target.value.toUpperCase() }))}
              placeholder="رقم الفني مثال TEST-1015"
              className="ds-input uppercase"
            />
            <Button type="submit" className="tech-primary-action" disabled={loading}>
              {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
            </Button>
          </form>
        </Card>
      </main>
    );
  }

  return (
    <main dir="rtl" className="tech-app">
      <header className="tech-app-header">
        <div className="tech-app-header-inner">
          <div className="tech-identity">
            <div className="tech-avatar">DH</div>
            <div className="min-w-0">
              <p>بوابة الفني</p>
              <h1>{technician?.user?.fullName || session.user?.fullName || 'فني الصيانة'}</h1>
            </div>
          </div>
          <div className="tech-header-actions">
            <span className={online ? 'tech-connectivity tech-online' : 'tech-connectivity tech-offline'}>
              {online ? 'متصل' : 'بدون اتصال'}
            </span>
            <Button type="button" variant="ghost" onClick={logout}>خروج</Button>
          </div>
        </div>
      </header>

      <section className="tech-app-content">
        {!selectedTask && (
          <>
            <section className="tech-day-panel">
              <div>
                <p className="tech-section-kicker">جدول اليوم</p>
                <h2>{formatArabicDate(date)}</h2>
              </div>
              <div className="tech-date-actions">
                <input type="date" value={date} onChange={(event) => loadTasks(event.target.value)} aria-label="التاريخ" />
                <Button type="button" variant="secondary" onClick={() => loadTasks(date)} disabled={loading}>تحديث</Button>
              </div>
            </section>

            <TechnicianStats
              total={tasks.length}
              active={activeCount}
              completed={completedCount}
              overdue={overdueCount}
              pending={pendingCount}
            />

            {pendingCount > 0 && <div className="tech-sync-banner">{pendingCount} مهمة محفوظة بانتظار الإرسال عند عودة الاتصال.</div>}
            {loading && <TechnicianLoading label="جاري تحميل المهام..." />}
            {message && <div className="ds-alert text-right">{message}</div>}

            <section className="tech-task-section">
              <div className="tech-section-head">
                <div>
                  <p className="tech-section-kicker">الأعمال الميدانية</p>
                  <h2>قائمة المهام</h2>
                </div>
                <Badge tone="info">{tasks.length} مهام</Badge>
              </div>

              {!loading && tasks.length === 0 && (
                <Card className="tech-empty-card">
                  <div className="tech-empty-icon">DH</div>
                  <p>لا توجد مهام لهذا اليوم</p>
                  <span>اختر تاريخاً آخر أو اضغط تحديث للتحقق من المهام الجديدة.</span>
                </Card>
              )}

              <div className="tech-task-list">
                {tasks.map((task) => (
                  <TechnicianTaskCard
                    key={task.id}
                    task={task}
                    loading={loading}
                    onSelect={() => setSelectedTaskId(task.id)}
                    onStart={async () => {
                      await startTask(task.id);
                      setSelectedTaskId(task.id);
                    }}
                  />
                ))}
              </div>
            </section>

            <section className="tech-weather-shell">
              <button
                type="button"
                onClick={() => setWeatherExpanded((current) => !current)}
                className="tech-weather-toggle"
              >
                <span>
                  <strong>الطقس ونصائح السلامة</strong>
                  <small>افتحها عند الحاجة قبل الخروج للموقع.</small>
                </span>
                <Badge tone={weatherExpanded ? 'info' : 'neutral'}>{weatherExpanded ? 'إخفاء' : 'عرض'}</Badge>
              </button>
              {weatherExpanded && <WeatherAdviceCard items={weatherAdvice} loading={weatherLoading} embedded />}
            </section>
          </>
        )}

        {selectedTask && (
          <section className="tech-detail-shell">
            {(() => {
              const canDocument = isTaskInProgress(selectedTask);
              const completed = isTaskCompleted(selectedTask);
              const status = getTaskDisplayStatus(selectedTask);
              return (
                <>
            <div className="tech-detail-hero">
              <div className="tech-detail-topline">
                <Button type="button" variant="ghost" onClick={() => setSelectedTaskId('')}>رجوع</Button>
                <Badge tone={status.tone}>{status.label}</Badge>
              </div>
              <div>
                <p className="tech-section-kicker">تنفيذ المهمة</p>
                <h2>{selectedTask.task}</h2>
                <div className="tech-detail-meta">
                  <span>{selectedTask.startsAt || '-'} - {selectedTask.endsAt || '-'}</span>
                  <span>{selectedTask.machineModel || 'معدة غير محددة'}</span>
                  <span>{selectedTask.location || 'موقع غير محدد'}</span>
                </div>
              </div>
            </div>

            <Card className="tech-audio-card">
              <div>
                <p>استماع سريع</p>
                <span>الصوت مولد بالذكاء الاصطناعي لمساعدة الفني على فهم سياق المهمة ونقاط العمل.</span>
              </div>
              <Button type="button" variant="secondary" onClick={() => speak(selectedTask)} disabled={audioLoading}>
                {audioLoading ? 'جاري تجهيز الصوت...' : 'تشغيل الصوت'}
              </Button>
              {audioUrl && (
                <audio src={audioUrl} controls>
                  <track kind="captions" />
                </audio>
              )}
            </Card>

            <div className="tech-info-grid">
              <Info label="المعدة" value={selectedTask.machineModel || '-'} />
              <Info label="الموقع" value={selectedTask.location || '-'} />
              <Info label="الوصف" value={selectedTask.description || '-'} />
              <Info label="ملاحظات الإدارة" value={selectedTask.notes || '-'} />
            </div>

            {selectedTask.manualAdvice && <TechnicianManualAdvice advice={selectedTask.manualAdvice} />}

            {!completed && !canDocument && (
              <Card className="tech-start-card">
                <h3>جاهز للبدء؟</h3>
                <p>
                  اضغط بدء المهمة أولاً. بعد البدء ستظهر نقاط العمل وحقول الملاحظات والصور.
                </p>
                <Button type="button" onClick={() => startTask(selectedTask.id)} disabled={loading || !online}>
                  بدء المهمة
                </Button>
              </Card>
            )}

            {!completed && canDocument && (
              <div className="tech-execution-flow">
                <div className="tech-section-head">
                  <div>
                    <p className="tech-section-kicker">توثيق التنفيذ</p>
                    <h3>نقاط العمل</h3>
                    <span>علّم كل نقطة، اكتب ملاحظتك، وارفع صورة توثيق واضحة.</span>
                  </div>
                  <Badge tone="info">{getTaskChecklist(selectedTask).length} نقاط</Badge>
                </div>
                <div className="tech-checklist-flow">
                  {getTaskChecklist(selectedTask).map((item, index) => {
                    const report = selectedChecklistReports.find((entry) => entry.id === item.id) || { done: false, notes: '', photos: [] };
                    return (
                      <div key={item.id} className={report.done ? 'tech-work-point tech-work-point-done' : 'tech-work-point'}>
                        <div className="tech-work-point-head">
                          <label className="tech-check-toggle">
                            <input
                              type="checkbox"
                              checked={report.done}
                              onChange={(event) => updateChecklistReport(selectedTask.id, item.id, { done: event.target.checked })}
                            />
                          </label>
                          <div>
                            <span>نقطة {index + 1}</span>
                            <p>{item.text}</p>
                          </div>
                        </div>
                        <VoiceTextarea
                          rows={2}
                          placeholder="ملاحظات هذه النقطة"
                          value={report.notes}
                          onChange={(event) => updateChecklistReport(selectedTask.id, item.id, { notes: event.target.value })}
                          textareaClassName="tech-note-input"
                          recording={recordingKey === `point-${item.id}`}
                          transcribing={transcribingKey === `point-${item.id}`}
                          onStart={() => startRecording(`point-${item.id}`, {
                            taskId: selectedTask.id,
                            pointId: item.id,
                            target: 'checklist point notes',
                            taskTitle: selectedTask.task,
                            pointText: item.text,
                          })}
                          onStop={stopRecording}
                        />
                        <label className="tech-photo-upload">
                          <span>إضافة صور التوثيق</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            multiple
                            onChange={(event) => handlePointPhotos(selectedTask.id, item.id, event.target.files)}
                          />
                        </label>
                        {report.photos.length > 0 && (
                          <div className="tech-photo-grid">
                            {report.photos.map((photo) => (
                              <img key={photo.fileName} src={photo.dataUrl} alt={photo.fileName} />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <VoiceTextarea
                  rows={3}
                  placeholder="ملخص عام اختياري"
                  value={selectedDraft.summary || ''}
                  onChange={(event) => updateDraft(selectedTask.id, { summary: event.target.value })}
                  textareaClassName="tech-note-input"
                  recording={recordingKey === 'summary'}
                  transcribing={transcribingKey === 'summary'}
                  onStart={() => startRecording('summary', {
                    taskId: selectedTask.id,
                    field: 'summary',
                    target: 'task completion summary',
                    taskTitle: selectedTask.task,
                  })}
                  onStop={stopRecording}
                />
                <VoiceTextarea
                  rows={2}
                  placeholder="ملاحظات إضافية"
                  value={selectedDraft.notes || ''}
                  onChange={(event) => updateDraft(selectedTask.id, { notes: event.target.value })}
                  textareaClassName="tech-note-input"
                  recording={recordingKey === 'notes'}
                  transcribing={transcribingKey === 'notes'}
                  onStart={() => startRecording('notes', {
                    taskId: selectedTask.id,
                    field: 'notes',
                    target: 'additional technician notes',
                    taskTitle: selectedTask.task,
                  })}
                  onStop={stopRecording}
                />
                {submittingTaskId === selectedTask.id && (
                  <TechnicianLoading label="جاري إرسال المهمة..." />
                )}
                <div className="tech-submit-bar">
                <Button type="button" onClick={() => completeTask(selectedTask)} disabled={loading || submittingTaskId === selectedTask.id}>
                  {submittingTaskId === selectedTask.id ? 'جاري الإرسال...' : 'إرسال المهمة'}
                </Button>
                </div>
              </div>
            )}

            {isTaskCompleted(selectedTask) && (
              <div className="ds-alert text-right">هذه المهمة مكتملة.</div>
            )}
                </>
              );
            })()}
          </section>
        )}
      </section>
    </main>
  );
}

function TechnicianStats({ total, active, completed, overdue, pending }) {
  const stats = [
    { label: 'مهام اليوم', value: total, tone: 'tech-stat-total' },
    { label: 'قيد العمل', value: active, tone: 'tech-stat-active' },
    { label: 'مكتملة', value: completed, tone: 'tech-stat-complete' },
    { label: 'متأخرة', value: overdue, tone: 'tech-stat-risk' },
  ];

  return (
    <section className="tech-stat-grid" aria-label="ملخص مهام اليوم">
      {stats.map((stat) => (
        <div key={stat.label} className={`tech-stat-card ${stat.tone}`}>
          <span>{stat.label}</span>
          <strong>{stat.value}</strong>
        </div>
      ))}
      {pending > 0 && (
        <div className="tech-stat-card tech-stat-pending">
          <span>بانتظار المزامنة</span>
          <strong>{pending}</strong>
        </div>
      )}
    </section>
  );
}

function WeatherAdviceCard({ items, loading, embedded = false }) {
  const weatherItems = Array.isArray(items) ? items : [];
  const hottest = weatherItems
    .filter((item) => Number.isFinite(Number(item.maxTemperatureC)))
    .sort((a, b) => Number(b.maxTemperatureC) - Number(a.maxTemperatureC))[0] || null;
  const mostHumid = weatherItems
    .filter((item) => Number.isFinite(Number(item.maxHumidityPercent)))
    .sort((a, b) => Number(b.maxHumidityPercent) - Number(a.maxHumidityPercent))[0] || null;
  const primary = hottest || weatherItems[0] || null;

  const content = (
    <div className={embedded ? '' : 'rounded-md border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)]'}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-black">الطقس ونصائح السلامة</h2>
          <p className="mt-1 text-sm font-semibold text-[var(--color-muted)]">مؤشرات سريعة قبل الخروج للموقع.</p>
          {loading && <p className="mt-1 text-sm font-semibold text-[var(--color-muted)]">جاري تحميل الطقس...</p>}
        </div>
        {primary?.generatedBy && <Badge tone="info">{weatherSourceLabel(primary.generatedBy)}</Badge>}
      </div>

      {loading && <div className="tech-loading-bar mt-3" />}

      {!loading && weatherItems.length === 0 && (
        <p className="mt-3 text-sm font-semibold text-[var(--color-muted)]">لا توجد نصائح طقس لهذا اليوم.</p>
      )}

      {weatherItems.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <WeatherMetric label="الحرارة" value={hottest ? `${hottest.maxTemperatureC}°C` : '-'} detail={hottest?.location || ''} tone={Number(hottest?.maxTemperatureC) >= 40 ? 'critical' : 'info'} />
          <WeatherMetric label="الرطوبة" value={mostHumid ? `${mostHumid.maxHumidityPercent}%` : '-'} detail={mostHumid?.location || ''} tone={Number(mostHumid?.maxHumidityPercent) >= 70 ? 'warning' : 'neutral'} />
        </div>
      )}
    </div>
  );

  return content;
}

function WeatherMetric({ label, value, detail, tone = 'neutral' }) {
  return (
    <div className="rounded-md border border-[var(--color-border)] bg-white p-3">
      <p className="text-xs font-bold text-[var(--color-muted)]">{label}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-2xl font-black text-[var(--color-ink)]">{value}</p>
        <Badge tone={tone}>{label}</Badge>
      </div>
      {detail && <p className="mt-1 truncate text-xs font-semibold text-[var(--color-muted)]">{detail}</p>}
    </div>
  );
}

function TechnicianLoading({ label }) {
  return (
    <Card className="p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black text-[var(--color-ink)]">{label}</p>
        <span className="tech-spinner" aria-hidden="true" />
      </div>
      <div className="tech-loading-bar mt-3" />
      <div className="mt-3 grid gap-2">
        <div className="ds-skeleton h-3 w-2/3" />
        <div className="ds-skeleton h-3 w-1/2" />
      </div>
    </Card>
  );
}

function VoiceTextarea({
  rows,
  placeholder,
  value,
  onChange,
  className = '',
  textareaClassName = '',
  recording,
  transcribing,
  onStart,
  onStop,
}) {
  return (
    <div className={`tech-voice-field ${className}`}>
      <textarea
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`ds-input min-w-0 ${textareaClassName}`}
      />
      <VoiceNoteButton
        recording={recording}
        transcribing={transcribing}
        onStart={onStart}
        onStop={onStop}
      />
    </div>
  );
}

function VoiceNoteButton({ recording, transcribing, onStart, onStop, className = '' }) {
  const label = transcribing ? 'جاري تحويل الصوت إلى نص' : recording ? 'إيقاف التسجيل' : 'تسجيل ملاحظة صوتية';

  return (
    <button
      type="button"
      onClick={recording ? onStop : onStart}
      disabled={transcribing}
      aria-label={label}
      title={label}
      className={`tech-voice-button ${recording ? 'tech-voice-button-recording' : ''} ${className}`}
    >
      {transcribing ? (
        <span className="tech-spinner tech-voice-spinner" aria-hidden="true" />
      ) : (
        <svg className="tech-mic-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Z" />
          <path d="M19 11a7 7 0 0 1-14 0" />
          <path d="M12 18v3" />
          <path d="M8 21h8" />
        </svg>
      )}
      <span className={recording ? 'tech-recording-dot' : 'tech-mic-dot'} aria-hidden="true" />
    </button>
  );
}

function weatherSourceLabel(source) {
  if (String(source || '').includes('open-meteo')) return 'تحديث مباشر';
  if (String(source || '').includes('seasonal')) return 'تقدير موسمي';
  return 'إرشادات';
}

function TechnicianTaskCard({ task, loading, onSelect, onStart }) {
  const status = getTaskDisplayStatus(task);
  const actionLabel = getTaskActionLabel(task.status);
  const readOnly = isTaskCompleted(task);
  const checklistCount = getTaskChecklist(task).length;

  return (
    <Card className={`tech-task-card ${isTaskInProgress(task) ? 'tech-task-card-live' : ''}`}>
      <button type="button" onClick={onSelect} className="tech-task-card-main">
        <div className="tech-task-card-top">
          <Badge tone={status.tone}>{status.label}</Badge>
          <span className="tech-task-time">{task.startsAt || '-'} - {task.endsAt || '-'}</span>
        </div>
        <div className="tech-task-title-block">
          <h3>{task.task}</h3>
          <p>{task.machineModel || 'معدة غير محددة'}</p>
        </div>
        <div className="tech-task-meta">
          <span>
            <small>الموقع</small>
            {task.location || 'موقع غير محدد'}
          </span>
          <span>
            <small>نقاط العمل</small>
            {checklistCount || 0}
          </span>
        </div>
        {task.description && <p className="tech-task-description">{task.description}</p>}
      </button>

      <div className="tech-task-actions">
        <Button type="button" onClick={readOnly ? onSelect : onStart} disabled={loading} fullWidth>
          {actionLabel}
        </Button>
        <Button type="button" variant="secondary" onClick={onSelect} fullWidth>عرض التفاصيل</Button>
      </div>
    </Card>
  );
}

function Info({ label, value }) {
  return (
    <div className="tech-info-tile">
      <span>{label}</span>
      <p>{value}</p>
    </div>
  );
}

function TechnicianManualAdvice({ advice }) {
  const steps = advice?.steps || [];
  const warnings = advice?.warnings || [];

  return (
    <section className="tech-manual-card">
      <div className="tech-section-head">
        <div>
          <p className="tech-section-kicker">Shop manual</p>
          <h3>إرشادات الصيانة</h3>
        </div>
        <Badge tone="info">AI</Badge>
      </div>
      {advice?.summary && <p className="tech-manual-summary">{advice.summary}</p>}
      {steps.length > 0 && (
        <ol className="tech-manual-steps">
          {steps.slice(0, 5).map((step, index) => <li key={`${step}-${index}`}>{index + 1}. {step}</li>)}
        </ol>
      )}
      {warnings.length > 0 && (
        <div className="tech-manual-warning">
          {warnings[0]}
        </div>
      )}
    </section>
  );
}
