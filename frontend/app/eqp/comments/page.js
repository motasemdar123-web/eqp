'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import SystemShell from '../../../components/SystemShell';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import EmptyState from '../../../components/ui/EmptyState';
import Button from '../../../components/ui/Button';
import EqpNav from '../../../components/eqp/EqpNav';
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
} from '../../../lib/api';

const SERVICE_STAGE_OPTIONS = [
  { value: 'scheduled_service', label: 'Scheduled Service (Periodic PM)' },
  { value: 'storage_service', label: 'Extra Service & Storage (W41X / W30)' },
  { value: 'pre_delivery', label: 'Pre-Delivery Inspection (PDI / W41P)' },
  { value: 'delivery', label: 'New / Used Machine Delivery (W41N / W41U)' },
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
        `Comment ${nextActive ? 'activated' : 'deactivated'} successfully.`,
        'success'
      );
    } catch (err) {
      showToast(err.message || 'Failed to toggle comment status.', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteComment(id);
      setComments((prev) => prev.filter((c) => c.id !== id));
      setDeleteConfirmId(null);
      showToast('Comment deleted from pool.', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to delete comment.', 'error');
    }
  };

  const uniqueModels = useMemo(() => {
    const list = [...new Set(comments.map((c) => c.machine_model).filter(Boolean))];
    return ['ALL', ...list];
  }, [comments]);

  const filteredComments = useMemo(() => {
    return comments.filter((c) => {
      const matchSearch =
        !searchQuery ||
        c.comment_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.machine_model?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchModel = modelFilter === 'ALL' || c.machine_model === modelFilter;
      const matchStage = stageFilter === 'ALL' || c.service_stage === stageFilter;
      const matchStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'ACTIVE'
          ? c.is_active === true
          : c.is_active === false;

      return matchSearch && matchModel && matchStage && matchStatus;
    });
  }, [comments, searchQuery, modelFilter, stageFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = comments.length;
    const active = comments.filter((c) => c.is_active).length;
    const hm400 = comments.filter((c) => c.machine_model === 'HM400').length;
    const pc400 = comments.filter((c) => c.machine_model === 'PC400').length;
    const d155a = comments.filter((c) => c.machine_model === 'D155A').length;

    return { total, active, hm400, pc400, d155a };
  }, [comments]);

  return (
    <SystemShell
      activePath="/eqp/comments"
      eyebrow="Komatsu EQP Platform"
      title="Inspection Comments Pool"
      description="Manage certified inspection remarks and weighted commentary pools picked during automated report generation."
      actions={
        <div className="flex items-center gap-2">
          <Link
            href="/eqp/generate-reports"
            className="ds-button ds-button-secondary text-xs py-1.5 px-3 font-semibold"
          >
            Report Builder
          </Link>
          <Button
            type="button"
            variant="primary"
            onClick={openAddModal}
            size="sm"
          >
            + Add Remark
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <EqpNav />

        {/* Toast Alert */}
        {toast && (
          <div
            className={`fixed top-4 right-4 z-50 rounded-lg p-3.5 shadow-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              toast.tone === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
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
              <p className="ds-kpi-descriptor">Certified Remarks</p>
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
                <p className="ds-kpi-label">HM400 Trucks</p>
                <Badge tone="live">HM400</Badge>
              </div>
              <p className="ds-kpi-main">{stats.hm400}</p>
              <p className="ds-kpi-descriptor">Inspection Pool</p>
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
                <p className="ds-kpi-label">PC400 Excavators</p>
                <Badge tone="active">PC400</Badge>
              </div>
              <p className="ds-kpi-main">{stats.pc400}</p>
              <p className="ds-kpi-descriptor">Inspection Pool</p>
            </div>
          </article>
        </section>

        {/* Filter Controls Card */}
        <Card className="overflow-hidden">
          <div className="border-b border-slate-200 p-5 bg-slate-50/70 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">Certified Inspection Remarks Pool</h3>
                <p className="text-xs text-slate-500">Remarks are randomized and weighted during automated report generation</p>
              </div>
              <Badge tone="neutral">{filteredComments.length} Visible</Badge>
            </div>

            {/* Model Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200/60">
              <span className="text-xs font-bold text-slate-500 mr-1">Machine Model:</span>
              {uniqueModels.map((m) => {
                const isSelected = modelFilter === m;
                const count = m === 'ALL' ? comments.length : comments.filter((c) => c.machine_model === m).length;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setModelFilter(m)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                      isSelected
                        ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {m === 'ALL' ? 'All Models' : m} ({count})
                  </button>
                );
              })}
            </div>

            {/* Filter Input Row */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <input
                type="text"
                placeholder="Search remark keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ds-input text-xs"
              />

              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="ds-input text-xs"
              >
                <option value="ALL">All Service Stages</option>
                {SERVICE_STAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="ds-input text-xs"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active in Rotation</option>
                <option value="INACTIVE">Deactivated</option>
              </select>
            </div>
          </div>

          {/* Comments List */}
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading comments pool...</div>
          ) : filteredComments.length === 0 ? (
            <div className="p-8">
              <EmptyState title="No comments match filters" description="Try clearing filters or search query." />
            </div>
          ) : (
            <div className="ds-table-wrap">
              <table className="ds-table">
                <thead>
                  <tr>
                    <th>Model</th>
                    <th>Service Stage</th>
                    <th>Inspection Remark Text</th>
                    <th>Weight</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComments.map((comment) => (
                    <tr key={comment.id} className="hover:bg-slate-50/70 transition-colors">
                      <td>
                        <span className="font-bold text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                          {comment.machine_model}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs font-medium text-slate-600">
                          {SERVICE_STAGE_OPTIONS.find((s) => s.value === comment.service_stage)?.label || comment.service_stage}
                        </span>
                      </td>
                      <td className="max-w-md">
                        <p className="text-xs font-semibold text-slate-900 leading-relaxed">
                          {comment.comment_text}
                        </p>
                      </td>
                      <td>
                        <span className="font-mono text-xs font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                          ×{comment.frequency || 1}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(comment)}
                          className="cursor-pointer"
                        >
                          <Badge tone={comment.is_active ? 'ready' : 'archived'}>
                            {comment.is_active ? 'Active' : 'Disabled'}
                          </Badge>
                        </button>
                      </td>
                      <td className="text-right">
                        <div className="inline-flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(comment)}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(comment.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <form onSubmit={handleSave} className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">

            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-bold">{editingComment ? 'Edit Inspection Remark' : 'Add Inspection Remark'}</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Machine Model</label>
                  <select
                    value={formData.machine_model}
                    onChange={(e) => setFormData({ ...formData, machine_model: e.target.value })}
                    className="ds-input text-xs"
                  >
                    <option value="HM400">HM400 (Dump Truck)</option>
                    <option value="PC400">PC400 (Excavator)</option>
                    <option value="D155A">D155A (Bulldozer)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Frequency Weight</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: parseInt(e.target.value, 10) || 1 })}
                    className="ds-input text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Service Stage</label>
                <select
                  value={formData.service_stage}
                  onChange={(e) => setFormData({ ...formData, service_stage: e.target.value })}
                  className="ds-input text-xs"
                >
                  {SERVICE_STAGE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Inspection Remark Text</label>
                <textarea
                  rows={4}
                  value={formData.comment_text}
                  onChange={(e) => setFormData({ ...formData, comment_text: e.target.value })}
                  className="ds-input text-xs"
                  placeholder="Enter certified maintenance inspection commentary..."
                  required
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Remark'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </SystemShell>
  );
}
