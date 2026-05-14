'use client';

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { clearStoredUser, getStoredPlatformSession } from '../../lib/auth';
import { getMicrosoftLoginUrl, getTechnicianSchedule, submitTechnicianCompletion } from '../../lib/api';

const statusLabels = {
  OPEN: 'مفتوحة',
  ASSIGNED: 'مجدولة',
  IN_PROGRESS: 'قيد التنفيذ',
  WAITING_PARTS: 'بانتظار قطع',
  PENDING_APPROVAL: 'بانتظار اعتماد المهندس',
  COMPLETED: 'معتمدة',
  CLOSED: 'مغلقة',
  CANCELLED: 'ملغاة',
};

const priorityLabels = {
  LOW: 'منخفضة',
  MEDIUM: 'متوسطة',
  HIGH: 'عالية',
  CRITICAL: 'حرجة',
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatTime(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('ar-SA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

function toneForStatus(status) {
  if (status === 'PENDING_APPROVAL') return 'yellow';
  if (status === 'COMPLETED' || status === 'CLOSED') return 'green';
  if (status === 'WAITING_PARTS' || status === 'CANCELLED') return 'red';
  return 'dark';
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

export default function TechnicianPage() {
  const [session] = useState(() => getStoredPlatformSession());
  const [date, setDate] = useState(today());
  const [data, setData] = useState({ technician: null, schedule: null, workOrders: [] });
  const [forms, setForms] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const isSignedIn = Boolean(session?.token);
  const workOrders = useMemo(() => data.workOrders || [], [data.workOrders]);
  const counts = useMemo(() => ({
    total: workOrders.length,
    pending: workOrders.filter((workOrder) => workOrder.status === 'PENDING_APPROVAL').length,
    active: workOrders.filter((workOrder) => ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_PARTS'].includes(workOrder.status)).length,
  }), [workOrders]);

  const loadSchedule = useCallback(async (nextDate = date) => {
    if (!isSignedIn) return;

    setLoading(true);
    setMessage('');
    try {
      const response = await getTechnicianSchedule(nextDate);
      setData({
        technician: response.technician,
        schedule: response.schedule,
        workOrders: response.workOrders || [],
      });
      setDate(nextDate);
    } catch (error) {
      setMessage(error.message || 'تعذر تحميل الجدول.');
    } finally {
      setLoading(false);
    }
  }, [date, isSignedIn]);

  useEffect(() => {
    const timer = setTimeout(() => loadSchedule(date), 0);
    return () => clearTimeout(timer);
  }, [date, loadSchedule]);

  function updateForm(workOrderId, patch) {
    setForms((current) => ({
      ...current,
      [workOrderId]: {
        notes: '',
        photos: [],
        submitting: false,
        ...(current[workOrderId] || {}),
        ...patch,
      },
    }));
  }

  async function handleFiles(workOrderId, files) {
    const selectedFiles = Array.from(files || []).slice(0, 6);
    const photos = await Promise.all(selectedFiles.map(readFileAsDataUrl));
    updateForm(workOrderId, { photos });
  }

  async function submitCompletion(workOrderId) {
    const form = forms[workOrderId] || {};
    updateForm(workOrderId, { submitting: true });
    setMessage('');

    try {
      await submitTechnicianCompletion(workOrderId, {
        completionNotes: form.notes || '',
        photos: form.photos || [],
      });
      updateForm(workOrderId, { notes: '', photos: [], submitting: false });
      setMessage('تم إرسال طلب إنهاء المهمة إلى المهندس المسؤول للاعتماد.');
      await loadSchedule(date);
    } catch (error) {
      updateForm(workOrderId, { submitting: false });
      setMessage(error.message || 'تعذر إرسال الطلب.');
    }
  }

  function logout() {
    clearStoredUser();
    window.location.href = '/';
  }

  if (!isSignedIn) {
    return (
      <main dir="rtl" className="grid min-h-screen place-items-center bg-[#edf1ea] px-5 text-zinc-950">
        <Card className="w-full max-w-md p-7 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-md bg-yellow-400 text-xl font-black text-zinc-950">DH</div>
          <h1 className="mt-5 text-3xl font-black">دخول الفني</h1>
          <Button type="button" className="mt-7 w-full py-4 text-base" onClick={() => { window.location.href = getMicrosoftLoginUrl('/technician'); }}>
            الدخول باستخدام Microsoft
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#edf1ea] text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Dar Al HAI</p>
            <h1 className="mt-1 text-3xl font-black text-zinc-950">جدول الفني</h1>
            <p className="mt-2 text-sm text-zinc-600">{data.technician?.user?.fullName || session.user?.fullName}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={date}
              onChange={(event) => loadSchedule(event.target.value)}
              className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-800"
            />
            <Button type="button" variant="secondary" onClick={() => loadSchedule(date)} disabled={loading}>تحديث</Button>
            <Button type="button" variant="ghost" onClick={logout}>خروج</Button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-5 px-5 py-6">
        {message && (
          <div className="rounded-md border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700">
            {message}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-zinc-900 bg-zinc-950 p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">المهام</p>
            <p className="mt-2 text-3xl font-black text-yellow-400">{counts.total}</p>
          </Card>
          <Card className="p-5">
            <p className="text-xs font-semibold text-zinc-500">قيد العمل</p>
            <p className="mt-2 text-3xl font-black text-zinc-950">{counts.active}</p>
          </Card>
          <Card className="p-5">
            <p className="text-xs font-semibold text-zinc-500">بانتظار الاعتماد</p>
            <p className="mt-2 text-3xl font-black text-zinc-950">{counts.pending}</p>
          </Card>
          <Card className="p-5">
            <p className="text-xs font-semibold text-zinc-500">الدوام</p>
            <p className="mt-2 text-lg font-black text-zinc-950">
              {data.schedule ? `${data.schedule.startsAt} - ${data.schedule.endsAt}` : 'غير مجدول'}
            </p>
          </Card>
        </div>

        <div className="grid gap-4">
          {workOrders.length === 0 && (
            <Card className="p-7 text-center">
              <h2 className="text-2xl font-black text-zinc-950">لا توجد مهام لهذا اليوم</h2>
              <p className="mt-2 text-sm text-zinc-600">راجع المشرف إذا كان لديك عمل غير ظاهر في الجدول.</p>
            </Card>
          )}

          {workOrders.map((workOrder) => {
            const form = forms[workOrder.id] || {};
            const canSubmit = !['PENDING_APPROVAL', 'COMPLETED', 'CLOSED', 'CANCELLED'].includes(workOrder.status);
            const photos = form.photos || [];

            return (
              <Card key={workOrder.id} className="overflow-hidden">
                <div className="grid gap-5 p-5 lg:grid-cols-[1fr_0.85fr]">
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-xs text-zinc-500">{workOrder.workOrderNumber}</p>
                        <h2 className="mt-1 text-2xl font-black text-zinc-950">{workOrder.title}</h2>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge tone={toneForStatus(workOrder.status)}>{statusLabels[workOrder.status] || workOrder.status}</Badge>
                        <Badge tone={workOrder.priority === 'CRITICAL' ? 'red' : 'yellow'}>{priorityLabels[workOrder.priority] || workOrder.priority}</Badge>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm text-zinc-700 md:grid-cols-2">
                      <Info label="الوقت" value={`${formatTime(workOrder.scheduledStartAt)} - ${formatTime(workOrder.scheduledEndAt)}`} />
                      <Info label="الأصل" value={workOrder.asset?.name || '-'} />
                      <Info label="نوع العمل" value={workOrder.jobType || '-'} />
                      <Info label="التصريح" value={workOrder.permitRequired ? 'مطلوب' : 'غير مطلوب'} />
                    </div>

                    <div className="mt-4 rounded-md bg-zinc-50 p-4">
                      <p className="text-sm font-bold text-zinc-950">شرح المهمة</p>
                      <p className="mt-2 text-sm leading-7 text-zinc-600">{workOrder.workScope || workOrder.description || 'لا يوجد وصف إضافي.'}</p>
                    </div>
                  </div>

                  <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
                    {canSubmit ? (
                      <div className="grid gap-3">
                        <label className="grid gap-2 text-sm font-bold text-zinc-700">
                          ملاحظات الإنهاء
                          <textarea
                            value={form.notes || ''}
                            onChange={(event) => updateForm(workOrder.id, { notes: event.target.value })}
                            className="min-h-28 rounded-md border border-zinc-300 bg-white p-3 text-right outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                            placeholder="اكتب ماذا تم عمله، وأي ملاحظات مهمة..."
                          />
                        </label>
                        <label className="grid gap-2 text-sm font-bold text-zinc-700">
                          صور قبل/بعد أو صور الإنجاز
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(event) => handleFiles(workOrder.id, event.target.files)}
                            className="rounded-md border border-zinc-300 bg-white p-3 text-sm"
                          />
                        </label>
                        {photos.length > 0 && (
                          <div className="grid grid-cols-3 gap-2">
                            {photos.map((photo) => (
                              <img key={photo.fileName} src={photo.dataUrl} alt={photo.fileName} className="h-20 w-full rounded-md object-cover" />
                            ))}
                          </div>
                        )}
                        <Button type="button" onClick={() => submitCompletion(workOrder.id)} disabled={form.submitting}>
                          {form.submitting ? 'جاري الإرسال...' : 'إرسال للمهندس للاعتماد'}
                        </Button>
                      </div>
                    ) : (
                      <div className="rounded-md bg-white p-4 text-sm font-semibold text-zinc-700">
                        {workOrder.status === 'PENDING_APPROVAL'
                          ? 'تم إرسال طلب الإنهاء. بانتظار اعتماد المهندس المسؤول.'
                          : 'لا يمكن تعديل هذه المهمة من صفحة الفني.'}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-md bg-white p-3">
      <p className="text-xs font-semibold text-zinc-500">{label}</p>
      <p className="mt-1 font-bold text-zinc-950">{value}</p>
    </div>
  );
}
