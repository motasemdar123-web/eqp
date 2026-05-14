'use client';

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { clearStoredUser, getStoredPlatformSession } from '../../lib/auth';
import { getEngineerCompletionRequests, getMicrosoftLoginUrl, reviewCompletionRequest } from '../../lib/api';

function formatDateTime(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function technicianNames(workOrder) {
  return (workOrder.assignments || [])
    .map((assignment) => assignment.technician?.user?.fullName || assignment.technician?.employeeCode)
    .filter(Boolean)
    .join(', ') || '-';
}

export default function EngineerApprovalsPage() {
  const [session] = useState(() => getStoredPlatformSession());
  const [workOrders, setWorkOrders] = useState([]);
  const [reviewNotes, setReviewNotes] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const isSignedIn = Boolean(session?.token);

  const kpis = useMemo(() => ({
    pending: workOrders.length,
    withPhotos: workOrders.filter((workOrder) => (workOrder.attachments || []).length > 0).length,
    highPriority: workOrders.filter((workOrder) => ['HIGH', 'CRITICAL'].includes(workOrder.priority)).length,
  }), [workOrders]);

  const loadRequests = useCallback(async () => {
    if (!isSignedIn) return;

    setLoading(true);
    setMessage('');
    try {
      const response = await getEngineerCompletionRequests();
      setWorkOrders(response.workOrders || []);
    } catch (error) {
      setMessage(error.message || 'Failed to load completion requests.');
    } finally {
      setLoading(false);
    }
  }, [isSignedIn]);

  useEffect(() => {
    const timer = setTimeout(loadRequests, 0);
    return () => clearTimeout(timer);
  }, [loadRequests]);

  async function review(id, decision) {
    setLoading(true);
    setMessage('');
    try {
      await reviewCompletionRequest(id, {
        decision,
        reviewNotes: reviewNotes[id] || '',
      });
      setMessage(decision === 'APPROVED' ? 'Completion approved.' : 'Completion returned to technician.');
      setReviewNotes((current) => ({ ...current, [id]: '' }));
      await loadRequests();
    } catch (error) {
      setMessage(error.message || 'Review failed.');
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    clearStoredUser();
    window.location.href = '/';
  }

  if (!isSignedIn) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#edf1ea] px-5 text-zinc-950">
        <Card className="w-full max-w-md p-7 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-md bg-yellow-400 text-xl font-black text-zinc-950">DH</div>
          <h1 className="mt-5 text-3xl font-black">Engineer Portal</h1>
          <Button type="button" className="mt-7 w-full py-4 text-base" onClick={() => { window.location.href = getMicrosoftLoginUrl('/engineer'); }}>
            Continue with Microsoft
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#edf1ea] text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Dar Al HAI</p>
            <h1 className="mt-1 text-3xl font-black text-zinc-950">Engineer Approvals</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-600">
              Review technician completion evidence, approve completed work, or return jobs for correction.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/management" className="rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
              Command Center
            </Link>
            <Button type="button" variant="secondary" onClick={loadRequests} disabled={loading}>Refresh</Button>
            <Button type="button" variant="ghost" onClick={logout}>Logout</Button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-5 px-6 py-6">
        {message && (
          <div className="rounded-md border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700">
            {message}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-zinc-900 bg-zinc-950 p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">Pending Approval</p>
            <p className="mt-2 text-3xl font-black text-yellow-400">{kpis.pending}</p>
          </Card>
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">With Photos</p>
            <p className="mt-2 text-3xl font-black text-zinc-950">{kpis.withPhotos}</p>
          </Card>
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">High Priority</p>
            <p className="mt-2 text-3xl font-black text-zinc-950">{kpis.highPriority}</p>
          </Card>
        </div>

        {workOrders.length === 0 && (
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-black text-zinc-950">No pending completion requests</h2>
            <p className="mt-2 text-sm text-zinc-600">Technician submissions will appear here when they finish a job.</p>
          </Card>
        )}

        <div className="grid gap-5">
          {workOrders.map((workOrder) => {
            const technicianComments = (workOrder.comments || []).filter((comment) => comment.visibility === 'TECHNICIAN');
            const photos = (workOrder.attachments || []).filter((attachment) => attachment.category === 'TECHNICIAN_COMPLETION_PHOTO');

            return (
              <Card key={workOrder.id} className="overflow-hidden">
                <div className="grid gap-0 xl:grid-cols-[1fr_0.75fr]">
                  <div className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-xs text-zinc-500">{workOrder.workOrderNumber}</p>
                        <h2 className="mt-1 text-2xl font-black text-zinc-950">{workOrder.title}</h2>
                        <p className="mt-2 text-sm text-zinc-600">{technicianNames(workOrder)}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge tone="yellow">{workOrder.status}</Badge>
                        <Badge tone={workOrder.priority === 'CRITICAL' ? 'red' : 'dark'}>{workOrder.priority}</Badge>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                      <Info label="Submitted At" value={formatDateTime(workOrder.completedAt || workOrder.updatedAt)} />
                      <Info label="Asset" value={workOrder.asset?.name || '-'} />
                      <Info label="Window" value={`${formatDateTime(workOrder.scheduledStartAt)} - ${formatDateTime(workOrder.scheduledEndAt)}`} />
                    </div>

                    <div className="mt-4 rounded-md bg-zinc-50 p-4">
                      <p className="text-sm font-bold text-zinc-950">Technician Notes</p>
                      {technicianComments.length === 0 ? (
                        <p className="mt-2 text-sm text-zinc-500">No technician notes submitted.</p>
                      ) : technicianComments.map((comment) => (
                        <p key={comment.id} className="mt-2 rounded-md bg-white p-3 text-sm leading-6 text-zinc-700">
                          {comment.body}
                        </p>
                      ))}
                    </div>

                    {photos.length > 0 && (
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        {photos.map((photo) => (
                          <a key={photo.id} href={photo.fileUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-md border border-zinc-200 bg-white">
                            <img src={photo.fileUrl} alt={photo.fileName} className="h-36 w-full object-cover" />
                            <span className="block truncate px-3 py-2 text-xs font-semibold text-zinc-600">{photo.fileName}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-zinc-100 bg-zinc-50 p-5 xl:border-l xl:border-t-0">
                    <label className="grid gap-2 text-sm font-bold text-zinc-700">
                      Engineer Review Notes
                      <textarea
                        value={reviewNotes[workOrder.id] || ''}
                        onChange={(event) => setReviewNotes((current) => ({ ...current, [workOrder.id]: event.target.value }))}
                        className="min-h-32 rounded-md border border-zinc-300 bg-white p-3 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                        placeholder="Add approval note or explain what needs correction..."
                      />
                    </label>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <Button type="button" onClick={() => review(workOrder.id, 'APPROVED')} disabled={loading}>
                        Approve
                      </Button>
                      <Button type="button" variant="secondary" onClick={() => review(workOrder.id, 'REJECTED')} disabled={loading}>
                        Return
                      </Button>
                    </div>
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
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">{label}</p>
      <p className="mt-1 font-bold text-zinc-950">{value}</p>
    </div>
  );
}
