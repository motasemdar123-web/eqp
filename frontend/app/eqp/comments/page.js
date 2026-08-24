'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import SystemShell from '../../../components/SystemShell';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import EmptyState from '../../../components/ui/EmptyState';
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
} from '../../../lib/api';

const SERVICE_STAGE_OPTIONS = [
  { value: 'scheduled_service', label: 'Scheduled Service (Periodic PM)' },
  { value: 'extra_service', label: 'Extra Service (W41X)' },
  { value: 'pdi_delivery', label: 'PDI & Delivery (W41P / W41N)' },
  { value: 'storage_service', label: 'Storage Operation (W30)' },
];

const DOCUMENT_TYPE_OPTIONS = [
  { value: 'in_operation', label: 'In Operation (Standard)' },
  { value: 'monthly_storage', label: 'Monthly Storage' },
  { value: 'delivery', label: 'Delivery' },
];

export default function EqpCommentsPage() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [modelFilter, setModelFilter] = useState('ALL');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    machine_model: 'HM400',
    document_type: 'in_operation',
    service_stage: 'scheduled_service',
    comment_text: '',
    frequency: 1,
    is_active: true,
  });

  const showToast = (message, tone = 'success') => {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getComments();
      setComments(res.comments || []);
    } catch (err) {
      setError(err.message || 'Failed to load comments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingComment(null);
    setFormData({
      machine_model: 'HM400',
      document_type: 'in_operation',
      service_stage: 'scheduled_service',
      comment_text: '',
      frequency: 1,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (comment) => {
    setEditingComment(comment);
    setFormData({
      machine_model: comment.machine_model || 'HM400',
      document_type: comment.document_type || 'in_operation',
      service_stage: comment.service_stage || 'scheduled_service',
      comment_text: comment.comment_text || '',
      frequency: comment.frequency || 1,
      is_active: comment.is_active !== false,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.comment_text.trim()) {
      showToast('Comment text cannot be empty.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      if (editingComment) {
        const res = await updateComment(editingComment.id, formData);
        setComments((prev) =>
          prev.map((c) => (c.id === editingComment.id ? res.comment : c))
        );
        showToast('Comment updated successfully!', 'success');
      } else {
        const res = await createComment(formData);
        setComments((prev) => [...prev, res.comment]);
        showToast('New comment added to pool!', 'success');
      }
      setIsModalOpen(false);
    } catch (err) {
      showToast(err.message || 'Failed to save comment.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (comment) => {
    try {
      const nextActive = !comment.is_active;
      const res = await updateComment(comment.id, { is_active: nextActive });
      setComments((prev) =>
        prev.map((c) => (c.id === comment.id ? res.comment : c))
      );
      showToast(
        `Comment marked as ${nextActive ? 'Active' : 'Inactive'}.`,
        'success'
      );
    } catch (err) {
      showToast(err.message || 'Failed to update status.', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteComment(id);
      setComments((prev) => prev.filter((c) => c.id !== id));
      setDeleteConfirmId(null);
      showToast('Comment deleted successfully.', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to delete comment.', 'error');
    }
  };

  // Filtered list
  const filteredComments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return comments.filter((c) => {
      const matchSearch =
        !query ||
        c.comment_text?.toLowerCase().includes(query) ||
        c.machine_model?.toLowerCase().includes(query) ||
        c.service_stage?.toLowerCase().includes(query);

      const matchModel = modelFilter === 'ALL' || c.machine_model === modelFilter;
      const matchStage = stageFilter === 'ALL' || c.service_stage === stageFilter;
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && c.is_active) ||
        (statusFilter === 'INACTIVE' && !c.is_active);

      return matchSearch && matchModel && matchStage && matchStatus;
    });
  }, [comments, searchQuery, modelFilter, stageFilter, statusFilter]);

  // KPI Stats
  const stats = useMemo(() => {
    const total = comments.length;
    const active = comments.filter((c) => c.is_active).length;
    const hm400 = comments.filter((c) => c.machine_model === 'HM400').length;
    const pc400 = comments.filter((c) => c.machine_model === 'PC400').length;
    return { total, active, hm400, pc400 };
  }, [comments]);

  const uniqueModels = useMemo(() => {
    const set = new Set(comments.map((c) => c.machine_model).filter(Boolean));
    return ['ALL', ...Array.from(set).sort()];
  }, [comments]);

  return (
    <SystemShell
      activePath="/eqp/comments"
      eyebrow="EQP Module"
      title="Report Comments Pool"
      description="Manage the certified inspection comment templates picked during automated report generation."
      actions={
        <div className="flex items-center gap-2">
          <Link
            href="/eqp/generate-reports"
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
          >
            📄 Report Builder
          </Link>
          <button
            type="button"
            onClick={openAddModal}
            className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-sky-500 flex items-center gap-1"
          >
            <span>+</span> Add Comment
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Toast Alert */}
        {toast && (
          <div
            className={`fixed top-4 right-4 z-50 rounded-lg p-4 shadow-lg text-sm font-medium flex items-center gap-2 transition-all ${
              toast.tone === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <span>{toast.tone === 'success' ? '✅' : '❌'}</span>
            <span>{toast.message}</span>
          </div>
        )}

        {/* KPI Grid */}
        <section className="ds-kpi-grid">
          <article className="ds-kpi-card">
            <div className="ds-icon-tile">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <div className="ds-kpi-content">
              <div className="ds-kpi-head">
                <p className="ds-kpi-label">Total Pool</p>
                <Badge tone="neutral">All</Badge>
              </div>
              <p className="ds-kpi-main">{stats.total}</p>
              <p className="ds-kpi-descriptor">Registered Comments</p>
            </div>
          </article>

          <article className="ds-kpi-card">
            <div className="ds-icon-tile ds-icon-tile-accent">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ds-kpi-content">
              <div className="ds-kpi-head">
                <p className="ds-kpi-label">Active Pool</p>
                <Badge tone="ready">Active</Badge>
              </div>
              <p className="ds-kpi-main">{stats.active}</p>
              <p className="ds-kpi-descriptor">In Rotation</p>
            </div>
          </article>

          <article className="ds-kpi-card">
            <div className="ds-icon-tile">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="ds-kpi-content">
              <div className="ds-kpi-head">
                <p className="ds-kpi-label">HM400 Fleet</p>
                <Badge tone="live">HM400</Badge>
              </div>
              <p className="ds-kpi-main">{stats.hm400}</p>
              <p className="ds-kpi-descriptor">Articulated Dump</p>
            </div>
          </article>

          <article className="ds-kpi-card">
            <div className="ds-icon-tile">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ds-kpi-content">
              <div className="ds-kpi-head">
                <p className="ds-kpi-label">PC400 Fleet</p>
                <Badge tone="active">PC400</Badge>
              </div>
              <p className="ds-kpi-main">{stats.pc400}</p>
              <p className="ds-kpi-descriptor">Excavators</p>
            </div>
          </article>
        </section>

        {/* Filter Controls */}
        <Card className="p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Search Keywords</label>
              <input
                type="text"
                placeholder="Search comment text..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Machine Model</label>
              <select
                value={modelFilter}
                onChange={(e) => setModelFilter(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-none"
              >
                {uniqueModels.map((m) => (
                  <option key={m} value={m}>
                    {m === 'ALL' ? 'All Models' : m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Service Stage</label>
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-none"
              >
                <option value="ALL">All Stages</option>
                {SERVICE_STAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active in Rotation</option>
                <option value="INACTIVE">Inactive / Disabled</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Comments Table */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 bg-slate-50">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Registered Comments ({filteredComments.length})
              </h3>
              <p className="text-[11px] text-slate-500">
                Randomly selected during maintenance report generation based on model and stage.
              </p>
            </div>
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="text-xs text-sky-600 hover:text-sky-800 font-semibold"
            >
              {loading ? 'Refreshing...' : '🔄 Reload'}
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500">
              Loading comments pool...
            </div>
          ) : error ? (
            <div className="py-8 text-center text-xs text-rose-600">
              {error}
            </div>
          ) : filteredComments.length === 0 ? (
            <EmptyState
              title="No comments found"
              description="Try adjusting your filters or click Add Comment to register a new phrase."
              action={
                <button
                  type="button"
                  onClick={openAddModal}
                  className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-sky-500"
                >
                  + Add First Comment
                </button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-3 px-4 w-16">ID</th>
                    <th className="py-3 px-4 w-24">Model</th>
                    <th className="py-3 px-4 w-36">Service Stage</th>
                    <th className="py-3 px-4">Comment Text</th>
                    <th className="py-3 px-4 w-20 text-center">Weight</th>
                    <th className="py-3 px-4 w-24 text-center">Status</th>
                    <th className="py-3 px-4 w-28 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredComments.map((c) => (
                    <tr
                      key={c.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        !c.is_active ? 'opacity-60 bg-slate-50/50' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono text-slate-400">#{c.id}</td>
                      <td className="py-3 px-4">
                        <Badge tone={c.machine_model === 'HM400' ? 'live' : 'active'}>
                          {c.machine_model}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {c.service_stage === 'scheduled_service' && 'Scheduled PM'}
                        {c.service_stage === 'extra_service' && 'Extra PM (W41X)'}
                        {c.service_stage === 'pdi_delivery' && 'PDI / Delivery'}
                        {c.service_stage === 'storage_service' && 'Storage (W30)'}
                        {!['scheduled_service', 'extra_service', 'pdi_delivery', 'storage_service'].includes(c.service_stage) &&
                          c.service_stage}
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-normal leading-relaxed">
                        {c.comment_text}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                          x{c.frequency || 1}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(c)}
                          title="Click to toggle active status"
                          className="focus:outline-none"
                        >
                          <Badge tone={c.is_active ? 'ready' : 'archived'}>
                            {c.is_active ? 'Active' : 'Disabled'}
                          </Badge>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(c)}
                            className="rounded p-1 text-slate-500 hover:text-sky-600 hover:bg-sky-50"
                            title="Edit Comment"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>

                          {deleteConfirmId === c.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleDelete(c.id)}
                                className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded font-bold hover:bg-rose-700"
                              >
                                Delete
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(null)}
                                className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded hover:bg-slate-300"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(c.id)}
                              className="rounded p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              title="Delete Comment"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Add / Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-sm font-bold text-slate-900">
                  {editingComment ? 'Edit Report Comment' : 'Add New Report Comment'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Machine Model
                    </label>
                    <select
                      value={formData.machine_model}
                      onChange={(e) => setFormData({ ...formData, machine_model: e.target.value })}
                      className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-none"
                    >
                      <option value="HM400">HM400</option>
                      <option value="PC400">PC400</option>
                      <option value="D155A">D155A</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Service Stage
                    </label>
                    <select
                      value={formData.service_stage}
                      onChange={(e) => setFormData({ ...formData, service_stage: e.target.value })}
                      className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-none"
                    >
                      {SERVICE_STAGE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Document Type
                    </label>
                    <select
                      value={formData.document_type}
                      onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
                      className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-none"
                    >
                      {DOCUMENT_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Selection Weight (Frequency)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={formData.frequency}
                      onChange={(e) => setFormData({ ...formData, frequency: parseInt(e.target.value, 10) || 1 })}
                      className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Comment Text (English)
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Enter full inspection or maintenance comment..."
                    value={formData.comment_text}
                    onChange={(e) => setFormData({ ...formData, comment_text: e.target.value })}
                    className="w-full rounded-md border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-none leading-relaxed"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    This exact phrase will be placed into cell comments of generated Excel & PDF reports.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isActiveCheck"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 h-4 w-4"
                  />
                  <label htmlFor="isActiveCheck" className="text-xs font-medium text-slate-700">
                    Active in random generation pool
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-md bg-sky-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-sky-500 disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : editingComment ? 'Save Changes' : 'Create Comment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </SystemShell>
  );
}
