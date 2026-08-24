'use client';

import { useState, useEffect, useMemo } from 'react';
import SystemShell from '../../components/SystemShell';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import {
  DEFAULT_MEDIA_CONCEPTS,
  FORMAT_TYPES,
  GOAL_TYPES,
  PIPELINE_STAGES,
  MEDIA_PLATFORMS,
} from '../../lib/mediaContentData';
import MediaBriefDrawer from '../../components/media/MediaBriefDrawer';
import NewConceptModal from '../../components/media/NewConceptModal';

const STORAGE_KEY = 'daralhay.social_media_concepts';

export default function MediaCornerPage() {
  const [concepts, setConcepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('ALL');
  const [selectedFormat, setSelectedFormat] = useState('ALL');
  const [selectedGoal, setSelectedGoal] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Drawers / Modals
  const [inspectConcept, setInspectConcept] = useState(null);
  const [editingConcept, setEditingConcept] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [printViewOpen, setPrintViewOpen] = useState(false);

  // Load from LocalStorage or default
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setConcepts(JSON.parse(stored));
      } else {
        setConcepts(DEFAULT_MEDIA_CONCEPTS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MEDIA_CONCEPTS));
      }
    } catch {
      setConcepts(DEFAULT_MEDIA_CONCEPTS);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveConcepts = (newConcepts) => {
    setConcepts(newConcepts);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConcepts));
  };

  const handleUpdateStatus = (id, newStatus) => {
    const updated = concepts.map((c) => (c.id === id ? { ...c, status: newStatus } : c));
    saveConcepts(updated);
    if (inspectConcept?.id === id) {
      setInspectConcept({ ...inspectConcept, status: newStatus });
    }
  };

  const handleSaveConcept = (formData) => {
    if (editingConcept) {
      const updated = concepts.map((c) => (c.id === editingConcept.id ? { ...formData, id: editingConcept.id } : c));
      saveConcepts(updated);
      setEditingConcept(null);
    } else {
      const newId = Date.now();
      const newConceptNumber = concepts.length + 1;
      const newConcept = { ...formData, id: newId, conceptNumber: newConceptNumber };
      saveConcepts([...concepts, newConcept]);
      setIsAddModalOpen(false);
    }
  };

  const handleDeleteConcept = (id) => {
    if (window.confirm('Delete this content concept?')) {
      const updated = concepts.filter((c) => c.id !== id);
      saveConcepts(updated);
      if (inspectConcept?.id === id) setInspectConcept(null);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset content plan to default 15 Komatsu concepts?')) {
      saveConcepts(DEFAULT_MEDIA_CONCEPTS);
    }
  };

  // Filtered List
  const filteredConcepts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return concepts.filter((c) => {
      const matchesSearch =
        !q ||
        c.title?.toLowerCase().includes(q) ||
        c.summary?.toLowerCase().includes(q) ||
        c.hook?.toLowerCase().includes(q);

      const matchesPlatform =
        selectedPlatform === 'ALL' || c.platforms?.includes(selectedPlatform);

      const matchesFormat =
        selectedFormat === 'ALL' || c.format === selectedFormat;

      const matchesGoal =
        selectedGoal === 'ALL' || c.goal === selectedGoal;

      const matchesStatus =
        selectedStatus === 'ALL' || c.status === selectedStatus;

      return matchesSearch && matchesPlatform && matchesFormat && matchesGoal && matchesStatus;
    });
  }, [concepts, searchTerm, selectedPlatform, selectedFormat, selectedGoal, selectedStatus]);

  // Statistics
  const stats = useMemo(() => {
    const total = concepts.length;
    const reels = concepts.filter((c) => c.format === 'reel').length;
    const carousels = concepts.filter((c) => c.format === 'carousel').length;
    const photos = concepts.filter((c) => c.format === 'photography' || c.format === 'designed_post').length;
    const ready = concepts.filter((c) => c.status === 'ready' || c.status === 'published').length;

    return { total, reels, carousels, photos, ready };
  }, [concepts]);

  return (
    <SystemShell
      activePath="/media"
      eyebrow="Dar Al Hay Media & Creative"
      title="Social Media Studio & Content Matrix"
      description="Plan, script, and direct high-impact content for Facebook, LinkedIn, and Instagram across Komatsu heavy machinery in Kuwait."
      actions={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setPrintViewOpen(true)}
            className="text-xs"
          >
            🖨️ Presentation View
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleResetDefaults}
            className="text-xs text-slate-600"
          >
            ↺ Reset Matrix
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => setIsAddModalOpen(true)}
            className="!bg-amber-500 hover:!bg-amber-400 !text-slate-950 !font-bold text-xs"
          >
            + Add Concept
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* KPI Metrics Bar */}
        <section className="ds-kpi-grid">
          <article className="ds-kpi-card">
            <div className="ds-icon-tile">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ds-kpi-content">
              <div className="ds-kpi-head">
                <p className="ds-kpi-label">Content Pipeline</p>
                <Badge tone="active">Active Plan</Badge>
              </div>
              <p className="ds-kpi-main">{stats.total}</p>
              <p className="ds-kpi-descriptor">Production Briefs</p>
            </div>
          </article>

          <article className="ds-kpi-card">
            <div className="ds-icon-tile ds-icon-tile-accent">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </div>
            <div className="ds-kpi-content">
              <div className="ds-kpi-head">
                <p className="ds-kpi-label">Reels & Motion</p>
                <Badge tone="ready">Motion</Badge>
              </div>
              <p className="ds-kpi-main">{stats.reels}</p>
              <p className="ds-kpi-descriptor">BTS & Walkarounds</p>
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
                <p className="ds-kpi-label">Carousels</p>
                <Badge tone="live">Education</Badge>
              </div>
              <p className="ds-kpi-main">{stats.carousels}</p>
              <p className="ds-kpi-descriptor">Multi-Slide Guides</p>
            </div>
          </article>

          <article className="ds-kpi-card">
            <div className="ds-icon-tile ds-icon-tile-accent">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="ds-kpi-content">
              <div className="ds-kpi-head">
                <p className="ds-kpi-label">Ready / Published</p>
                <Badge tone="ready">Scheduled</Badge>
              </div>
              <p className="ds-kpi-main">{stats.ready}</p>
              <p className="ds-kpi-descriptor">Ready for Broadcast</p>
            </div>
          </article>
        </section>

        {/* 3-Step Production Guide Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/70 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-800 bg-sky-100 px-2 py-0.5 rounded">
              1. PLAN
            </span>
            <p className="text-xs font-bold text-slate-900 mt-1">Select Idea & Goal</p>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Choose the content idea, main goal, and required visual assets for each target platform.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
              2. SHOOT / DESIGN
            </span>
            <p className="text-xs font-bold text-slate-900 mt-1">Use Production Brief</p>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Follow the detailed director brief, 3-second hook, shot list, and carousel slide breakdown.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
              3. PUBLISH & UPDATE
            </span>
            <p className="text-xs font-bold text-slate-900 mt-1">Confirm & Broadcast</p>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Confirm machine models, client permissions, contact details, and bilingual copy before posting.
            </p>
          </div>
        </div>

        {/* Format Legend & Channels Strip */}
        <Card className="p-4 bg-slate-50/50 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200/60 pb-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Format Legend & Creative Styles</span>
            <span className="text-xs text-slate-400">Click any format to filter matrix</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedFormat('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedFormat === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Formats ({concepts.length})
            </button>

            {FORMAT_TYPES.map((fmt) => {
              const isSelected = selectedFormat === fmt.id;
              const count = concepts.filter((c) => c.format === fmt.id).length;
              return (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => setSelectedFormat(fmt.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    isSelected
                      ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
                      : `${fmt.color} hover:shadow-xs`
                  }`}
                >
                  <span className="mr-1">{fmt.icon}</span>
                  <span>{fmt.label}</span>
                  <span className="ml-1 opacity-75 font-mono text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Content Matrix Table Card */}
        <Card className="overflow-hidden">
          {/* Table Header & Multi-tier Filters */}
          <div className="border-b border-slate-200 p-5 bg-slate-50/70 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Content Matrix & Production Schedule</h3>
                <p className="text-xs text-slate-500">15 concepts with expanded production briefs for Facebook, LinkedIn & Instagram</p>
              </div>
              <Badge tone="neutral">{filteredConcepts.length} Concepts Listed</Badge>
            </div>

            {/* Target Social Platform Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200/60">
              <span className="text-xs font-bold text-slate-500 mr-1">Target Channel:</span>
              <button
                type="button"
                onClick={() => setSelectedPlatform('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedPlatform === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                All Channels
              </button>

              {MEDIA_PLATFORMS.map((p) => {
                const isSelected = selectedPlatform === p.id;
                const count = concepts.filter((c) => c.platforms?.includes(p.id)).length;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPlatform(p.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                      isSelected
                        ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="mr-1">{p.icon}</span>
                    {p.label} ({count})
                  </button>
                );
              })}
            </div>

            {/* Search & Secondary Filter Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <input
                type="text"
                placeholder="Search concepts, hooks, or topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ds-input text-xs"
              />

              <select
                value={selectedGoal}
                onChange={(e) => setSelectedGoal(e.target.value)}
                className="ds-input text-xs"
              >
                <option value="ALL">All Strategic Goals</option>
                {GOAL_TYPES.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="ds-input text-xs"
              >
                <option value="ALL">All Pipeline Stages</option>
                {PIPELINE_STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.icon} {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Matrix Table */}
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading Content Matrix...</div>
          ) : filteredConcepts.length === 0 ? (
            <div className="p-8">
              <EmptyState title="No content concepts match filters" description="Try clearing filters or search query." />
            </div>
          ) : (
            <div className="ds-table-wrap">
              <table className="ds-table">
                <thead>
                  <tr>
                    <th className="w-12 text-center">#</th>
                    <th>Content Idea</th>
                    <th>Format</th>
                    <th>Concept / What to Shoot or Design</th>
                    <th>Main Goal</th>
                    <th>Channels</th>
                    <th>Pipeline Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredConcepts.map((concept) => {
                    const formatMeta = FORMAT_TYPES.find((f) => f.id === concept.format) || FORMAT_TYPES[0];
                    const goalMeta = GOAL_TYPES.find((g) => g.id === concept.goal) || GOAL_TYPES[0];
                    const stageMeta = PIPELINE_STAGES.find((s) => s.id === concept.status) || PIPELINE_STAGES[0];

                    return (
                      <tr
                        key={concept.id}
                        onClick={() => setInspectConcept(concept)}
                        className="cursor-pointer hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="text-center font-extrabold text-slate-900">
                          <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 inline-flex items-center justify-center font-bold text-xs">
                            {concept.conceptNumber}
                          </span>
                        </td>
                        <td className="min-w-[180px]">
                          <p className="font-bold text-slate-900 text-xs leading-snug">{concept.title}</p>
                          {concept.hook && (
                            <p className="text-[11px] text-slate-500 italic mt-0.5 truncate max-w-xs">
                              "{concept.hook}"
                            </p>
                          )}
                        </td>
                        <td>
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${formatMeta.color} border inline-block whitespace-nowrap`}>
                            {formatMeta.icon} {formatMeta.label}
                          </span>
                        </td>
                        <td className="max-w-xs text-xs text-slate-700 leading-relaxed">
                          {concept.summary}
                        </td>
                        <td>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${goalMeta.color} border inline-block whitespace-nowrap`}>
                            {goalMeta.label}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-1">
                            {concept.platforms?.map((pid) => {
                              const p = MEDIA_PLATFORMS.find((pl) => pl.id === pid);
                              return (
                                <span key={pid} className="text-sm" title={p?.label}>
                                  {p?.icon}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <select
                            value={concept.status}
                            onChange={(e) => handleUpdateStatus(concept.id, e.target.value)}
                            className="text-[11px] font-bold rounded-md bg-white border border-slate-300 px-2 py-1 focus:outline-none"
                          >
                            {PIPELINE_STAGES.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.icon} {s.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex items-center gap-1">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => setInspectConcept(concept)}
                            >
                              Brief →
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingConcept(concept)}
                            >
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteConcept(concept.id)}
                            >
                              ✕
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Production Brief Drawer */}
      {inspectConcept && (
        <MediaBriefDrawer
          concept={inspectConcept}
          onClose={() => setInspectConcept(null)}
          onUpdateStatus={handleUpdateStatus}
          onEdit={(c) => {
            setEditingConcept(c);
            setInspectConcept(null);
          }}
        />
      )}

      {/* Add / Edit Concept Modal */}
      {(isAddModalOpen || editingConcept) && (
        <NewConceptModal
          initialData={editingConcept}
          onSave={handleSaveConcept}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingConcept(null);
          }}
        />
      )}

      {/* Printable Presentation View Modal */}
      {printViewOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 p-4 sm:p-8 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 max-w-5xl w-full text-slate-900 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Dar Al Hay | Social Media Content Plan</p>
                <h2 className="text-2xl font-black text-slate-900 mt-1">Social Media Content Plan Matrix</h2>
                <p className="text-xs text-slate-500">15 concepts | Expanded production briefs for Facebook, LinkedIn & Instagram</p>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="primary" onClick={() => window.print()}>
                  🖨️ Print / PDF
                </Button>
                <Button type="button" variant="secondary" onClick={() => setPrintViewOpen(false)}>
                  Close
                </Button>
              </div>
            </div>

            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="p-2.5 border-r border-slate-700 text-center w-10">#</th>
                    <th className="p-2.5 border-r border-slate-700">Content Idea</th>
                    <th className="p-2.5 border-r border-slate-700">Format</th>
                    <th className="p-2.5 border-r border-slate-700">Concept / What to Shoot or Design</th>
                    <th className="p-2.5">Main Goal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {concepts.map((c) => {
                    const formatMeta = FORMAT_TYPES.find((f) => f.id === c.format) || FORMAT_TYPES[0];
                    const goalMeta = GOAL_TYPES.find((g) => g.id === c.goal) || GOAL_TYPES[0];
                    return (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="p-2.5 text-center font-bold border-r border-slate-200">{c.conceptNumber}</td>
                        <td className="p-2.5 font-bold border-r border-slate-200">{c.title}</td>
                        <td className="p-2.5 border-r border-slate-200">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${formatMeta.color}`}>
                            {formatMeta.label}
                          </span>
                        </td>
                        <td className="p-2.5 border-r border-slate-200 text-slate-700">{c.summary}</td>
                        <td className="p-2.5 font-semibold text-slate-800">{goalMeta.label}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </SystemShell>
  );
}
