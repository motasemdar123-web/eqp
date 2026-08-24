'use client';

import { useState, useEffect, useMemo } from 'react';
import SystemShell from '../../components/SystemShell';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import {
  MASTER_MONTHLY_PLAN,
  FORMAT_TYPES,
  GOAL_TYPES,
  PIPELINE_STAGES,
  MEDIA_PLATFORMS,
  CONTENT_PILLARS,
  TOV_GUIDELINES,
  PRE_PRODUCTION_CHECKLIST,
} from '../../lib/mediaContentData';
import MediaBriefDrawer from '../../components/media/MediaBriefDrawer';
import NewConceptModal from '../../components/media/NewConceptModal';

const STORAGE_KEY = 'daralhay.social_media_concepts';

export default function MediaCornerPage() {
  const [concepts, setConcepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMainTab, setActiveMainTab] = useState('matrix'); // 'matrix' | 'calendar' | 'tov' | 'checklist'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('ALL');
  const [selectedFormat, setSelectedFormat] = useState('ALL');
  const [selectedGoal, setSelectedGoal] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPillar, setSelectedPillar] = useState('ALL');

  // Modals & Drawers
  const [inspectConcept, setInspectConcept] = useState(null);
  const [editingConcept, setEditingConcept] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [printBookOpen, setPrintBookOpen] = useState(false);

  // Pre-production live checklist state
  const [checkedItems, setCheckedItems] = useState({});

  // Load from LocalStorage or default
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setConcepts(JSON.parse(stored));
      } else {
        setConcepts(MASTER_MONTHLY_PLAN);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(MASTER_MONTHLY_PLAN));
      }
    } catch {
      setConcepts(MASTER_MONTHLY_PLAN);
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
    if (window.confirm('Reset content plan to default 12+ master Komatsu monthly packages?')) {
      saveConcepts(MASTER_MONTHLY_PLAN);
    }
  };

  const toggleChecklistItem = (id) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtered List
  const filteredConcepts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return concepts.filter((c) => {
      const matchesSearch =
        !q ||
        c.title?.toLowerCase().includes(q) ||
        c.summary?.toLowerCase().includes(q) ||
        (typeof c.hook === 'string' ? c.hook.toLowerCase().includes(q) : c.hook?.spokenEn?.toLowerCase().includes(q));

      const matchesPlatform =
        selectedPlatform === 'ALL' || c.platforms?.includes(selectedPlatform);

      const matchesFormat =
        selectedFormat === 'ALL' || c.format === selectedFormat;

      const matchesGoal =
        selectedGoal === 'ALL' || c.goal === selectedGoal;

      const matchesStatus =
        selectedStatus === 'ALL' || c.status === selectedStatus;

      const matchesPillar =
        selectedPillar === 'ALL' || c.pillar === selectedPillar;

      return matchesSearch && matchesPlatform && matchesFormat && matchesGoal && matchesStatus && matchesPillar;
    });
  }, [concepts, searchTerm, selectedPlatform, selectedFormat, selectedGoal, selectedStatus, selectedPillar]);

  // Group by Weeks for Calendar
  const weeks = useMemo(() => {
    const grouped = { 'Week 1': [], 'Week 2': [], 'Week 3': [], 'Week 4': [] };
    concepts.forEach((c) => {
      const w = c.week || 'Week 1';
      if (!grouped[w]) grouped[w] = [];
      grouped[w].push(c);
    });
    return grouped;
  }, [concepts]);

  // Statistics
  const stats = useMemo(() => {
    const total = concepts.length;
    const reels = concepts.filter((c) => c.format === 'reel').length;
    const carousels = concepts.filter((c) => c.format === 'carousel').length;
    const scripted = concepts.filter((c) => c.scenes?.length > 0 || c.slides?.length > 0).length;
    const ready = concepts.filter((c) => c.status === 'ready' || c.status === 'published').length;

    return { total, reels, carousels, scripted, ready };
  }, [concepts]);

  return (
    <SystemShell
      activePath="/media"
      eyebrow="Dar Al Hay Media & Creative"
      title="Monthly Social Media Production Studio"
      description="End-to-end social media publishing process: monthly calendar, director scripts, scene lists, TOV guidelines & multi-channel simulation."
      actions={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setPrintBookOpen(true)}
            className="text-xs font-bold"
          >
            📖 Master Production Book
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleResetDefaults}
            className="text-xs text-slate-600"
          >
            ↺ Reset Plan
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => setIsAddModalOpen(true)}
            className="!bg-amber-500 hover:!bg-amber-400 !text-slate-950 !font-bold text-xs"
          >
            + New Concept
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ds-kpi-content">
              <div className="ds-kpi-head">
                <p className="ds-kpi-label">Monthly Plan</p>
                <Badge tone="active">4 Weeks</Badge>
              </div>
              <p className="ds-kpi-main">{stats.total} Posts</p>
              <p className="ds-kpi-descriptor">Full Master Packages</p>
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
                <p className="ds-kpi-label">Reels & Walkarounds</p>
                <Badge tone="ready">Motion</Badge>
              </div>
              <p className="ds-kpi-main">{stats.reels}</p>
              <p className="ds-kpi-descriptor">Video Packages</p>
            </div>
          </article>

          <article className="ds-kpi-card">
            <div className="ds-icon-tile">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ds-kpi-content">
              <div className="ds-kpi-head">
                <p className="ds-kpi-label">Director Scripted</p>
                <Badge tone="live">Scene Lists</Badge>
              </div>
              <p className="ds-kpi-main">{stats.scripted}</p>
              <p className="ds-kpi-descriptor">With Shot Breakdowns</p>
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
                <p className="ds-kpi-label">Ready / Broadcast</p>
                <Badge tone="ready">Scheduled</Badge>
              </div>
              <p className="ds-kpi-main">{stats.ready}</p>
              <p className="ds-kpi-descriptor">Approved Assets</p>
            </div>
          </article>
        </section>

        {/* Studio Primary Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 bg-white p-1.5 rounded-xl shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveMainTab('matrix')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeMainTab === 'matrix' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            📊 Content Matrix & Pipeline
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('calendar')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeMainTab === 'calendar' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            📅 Monthly Calendar View (4 Weeks)
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('tov')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeMainTab === 'tov' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            🎯 Tone of Voice (TOV) & Rules
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('checklist')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeMainTab === 'checklist' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            📋 Pre-Production & Shooting Checklist
          </button>
        </div>

        {/* TAB 1: CONTENT MATRIX & PIPELINE */}
        {activeMainTab === 'matrix' && (
          <div className="space-y-6">
            {/* 3-Step Process Guide */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/70 space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-800 bg-sky-100 px-2 py-0.5 rounded">
                  1. PLAN & STRATEGY
                </span>
                <p className="text-xs font-bold text-slate-900 mt-1">Select Pillar & Audience</p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Map each post to strategic pillars (Brand Authority, Product Specs, Workshop BTS, Case Studies).
                </p>
              </div>

              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                  2. SCRIPT & SHOOT
                </span>
                <p className="text-xs font-bold text-slate-900 mt-1">Follow Director's Scene List</p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Execute the 3-second hook, shot lists, audio foley, and B-roll checklist for videographers.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  3. REVIEW & PUBLISH
                </span>
                <p className="text-xs font-bold text-slate-900 mt-1">Verify TOV & Bilingual Copy</p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Validate Kuwait permissions, Arabic terminology, hashtags, and schedule across IG, FB, and LinkedIn.
                </p>
              </div>
            </div>

            {/* Matrix Filters */}
            <Card className="p-4 bg-slate-50/50 space-y-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500 mr-1">Content Pillar:</span>
                <button
                  type="button"
                  onClick={() => setSelectedPillar('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedPillar === 'ALL'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  All Pillars
                </button>
                {CONTENT_PILLARS.map((p) => {
                  const isSelected = selectedPillar === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPillar(p.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                        isSelected
                          ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
                          : `${p.color} hover:shadow-xs`
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-200/60">
                <input
                  type="text"
                  placeholder="Search concepts, hooks, machines..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="ds-input text-xs"
                />

                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="ds-input text-xs"
                >
                  <option value="ALL">All Platforms (FB, IG, LinkedIn)</option>
                  {MEDIA_PLATFORMS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.icon} {p.label}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="ds-input text-xs"
                >
                  <option value="ALL">All Formats</option>
                  {FORMAT_TYPES.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.icon} {f.label}
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
            </Card>

            {/* Master Matrix Table */}
            <Card className="overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-xs text-slate-500">Loading Master Production Plan...</div>
              ) : filteredConcepts.length === 0 ? (
                <div className="p-8">
                  <EmptyState title="No concepts match filters" description="Try clearing filters or search query." />
                </div>
              ) : (
                <div className="ds-table-wrap">
                  <table className="ds-table">
                    <thead>
                      <tr>
                        <th className="w-12 text-center">#</th>
                        <th>Schedule</th>
                        <th>Content Concept</th>
                        <th>Format</th>
                        <th>Pillar</th>
                        <th>Director Hook / Summary</th>
                        <th>Channels</th>
                        <th>Stage</th>
                        <th className="text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredConcepts.map((concept) => {
                        const formatMeta = FORMAT_TYPES.find((f) => f.id === concept.format) || FORMAT_TYPES[0];
                        const pillarMeta = CONTENT_PILLARS.find((p) => p.id === concept.pillar) || CONTENT_PILLARS[0];
                        const stageMeta = PIPELINE_STAGES.find((s) => s.id === concept.status) || PIPELINE_STAGES[0];
                        const hookText = typeof concept.hook === 'string' ? concept.hook : concept.hook?.spokenEn;

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
                            <td className="whitespace-nowrap">
                              <span className="text-xs font-bold text-slate-900 block">{concept.week}</span>
                              <span className="text-[11px] text-slate-500">{concept.day || 'Scheduled'}</span>
                            </td>
                            <td className="min-w-[180px]">
                              <p className="font-bold text-slate-900 text-xs leading-snug">{concept.title}</p>
                              <span className="text-[10px] text-slate-500 mt-0.5 block font-mono">{concept.publishDate}</span>
                            </td>
                            <td>
                              <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${formatMeta.color} border inline-block whitespace-nowrap`}>
                                {formatMeta.icon} {formatMeta.label}
                              </span>
                            </td>
                            <td>
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${pillarMeta.color} border inline-block whitespace-nowrap`}>
                                {pillarMeta.label}
                              </span>
                            </td>
                            <td className="max-w-xs text-xs text-slate-700 leading-relaxed">
                              {hookText && (
                                <p className="font-semibold text-slate-900 italic mb-0.5">"{hookText}"</p>
                              )}
                              <p className="text-slate-500 truncate">{concept.summary}</p>
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
                                  Script →
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingConcept(concept)}
                                >
                                  Edit
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
        )}

        {/* TAB 2: MONTHLY CALENDAR VIEW */}
        {activeMainTab === 'calendar' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">4-Week Publishing Calendar</h3>
                <p className="text-xs text-slate-500">Cadence: 3 High-Impact Posts per week across Instagram, LinkedIn & Facebook</p>
              </div>
              <Badge tone="active">12 Master Releases</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((weekName) => {
                const weekConcepts = weeks[weekName] || [];
                return (
                  <div key={weekName} className="border border-slate-200 rounded-2xl bg-slate-50 overflow-hidden flex flex-col">
                    <div className="bg-slate-900 text-white p-3 flex items-center justify-between">
                      <h4 className="text-xs font-bold">{weekName}</h4>
                      <span className="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded text-amber-400">
                        {weekConcepts.length} Releases
                      </span>
                    </div>

                    <div className="p-3 space-y-3 flex-1 overflow-y-auto">
                      {weekConcepts.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">No posts planned for this week.</p>
                      ) : (
                        weekConcepts.map((c) => {
                          const formatMeta = FORMAT_TYPES.find((f) => f.id === c.format) || FORMAT_TYPES[0];
                          const stageMeta = PIPELINE_STAGES.find((s) => s.id === c.status) || PIPELINE_STAGES[0];

                          return (
                            <div
                              key={c.id}
                              onClick={() => setInspectConcept(c)}
                              className="p-3 bg-white rounded-xl border border-slate-200 hover:border-amber-400 hover:shadow-xs transition-all cursor-pointer space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">{c.day}</span>
                                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${formatMeta.color}`}>
                                  {formatMeta.icon} {formatMeta.label}
                                </span>
                              </div>

                              <h5 className="text-xs font-bold text-slate-900 leading-snug">{c.title}</h5>

                              <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                                <div className="flex gap-1">
                                  {c.platforms?.map((pid) => (
                                    <span key={pid}>{MEDIA_PLATFORMS.find((pl) => pl.id === pid)?.icon}</span>
                                  ))}
                                </div>
                                <Badge tone={stageMeta.badgeTone}>{stageMeta.label}</Badge>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: TONE OF VOICE (TOV) & BRAND RULES */}
        {activeMainTab === 'tov' && (
          <div className="space-y-6">
            {/* Brand Core Voice */}
            <Card className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white space-y-4">
              <div>
                <span className="text-amber-400 font-bold uppercase tracking-wider text-xs">
                  Official Brand Guide
                </span>
                <h3 className="text-xl font-extrabold text-white mt-1">
                  {TOV_GUIDELINES.overall.title}
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  {TOV_GUIDELINES.overall.summary}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                {TOV_GUIDELINES.overall.traits.map((t, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
                    <h4 className="text-xs font-bold text-amber-300">{t.name}</h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{t.desc}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Platform Specific Guidelines */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.values(TOV_GUIDELINES.platforms).map((p, idx) => (
                <div key={idx} className="p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <span className="text-xl">
                      {p.platform === 'LinkedIn' ? '💼' : p.platform === 'Instagram' ? '📸' : '👥'}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{p.platform} Strategy</h4>
                      <p className="text-[10px] text-slate-500 font-semibold">{p.tone}</p>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Audience:</span>
                    <p className="text-xs text-slate-800 font-medium mt-0.5">{p.target}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Content Rules:</span>
                    <p className="text-xs text-slate-600 leading-relaxed mt-0.5">{p.guidelines}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Dos and Don'ts Matrix */}
            <Card className="p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900">Brand Dos & Don'ts</h3>
              <div className="divide-y divide-slate-100">
                {TOV_GUIDELINES.doAndDont.map((rule, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4 py-3 text-xs">
                    <div className="flex items-start gap-2 text-emerald-800 bg-emerald-50/70 p-3 rounded-lg border border-emerald-200">
                      <span className="font-bold shrink-0">✅ DO:</span>
                      <span>{rule.do}</span>
                    </div>
                    <div className="flex items-start gap-2 text-rose-800 bg-rose-50/70 p-3 rounded-lg border border-rose-200">
                      <span className="font-bold shrink-0">❌ DON'T:</span>
                      <span>{rule.dont}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* TAB 4: PRE-PRODUCTION CHECKLIST */}
        {activeMainTab === 'checklist' && (
          <div className="space-y-6">
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Pre-Production & Filming Crew Checklist</h3>
                  <p className="text-xs text-slate-500">Ensure all safety, gear, and filming permits are verified before rolling cameras</p>
                </div>
                <Badge tone="yellow">
                  {Object.values(checkedItems).filter(Boolean).length} of {PRE_PRODUCTION_CHECKLIST.length} Completed
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PRE_PRODUCTION_CHECKLIST.map((item) => {
                  const isChecked = Boolean(checkedItems[item.id]);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleChecklistItem(item.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                        isChecked
                          ? 'bg-emerald-50/70 border-emerald-300'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-0.5 rounded accent-emerald-600"
                      />
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          {item.category}
                        </span>
                        <p className={`text-xs font-semibold ${isChecked ? 'text-emerald-900 line-through' : 'text-slate-800'}`}>
                          {item.task}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}
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

      {/* Master Production Book (Print / Export View) */}
      {printBookOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/85 p-4 sm:p-8 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 max-w-5xl w-full text-slate-900 space-y-8 max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Dar Al Hay Commercial Co. (Komatsu Kuwait)</p>
                <h2 className="text-2xl font-black text-slate-900 mt-1">Master Monthly Social Media Production Book</h2>
                <p className="text-xs text-slate-500">Complete Director Scripts, Scene Lists, TOV Guidelines & Shot Checklists</p>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="primary" onClick={() => window.print()}>
                  🖨️ Print / Save PDF
                </Button>
                <Button type="button" variant="secondary" onClick={() => setPrintBookOpen(false)}>
                  Close
                </Button>
              </div>
            </div>

            {/* Print Book Content */}
            <div className="space-y-8">
              {concepts.map((c) => {
                const hookText = typeof c.hook === 'string' ? c.hook : c.hook?.spokenEn;
                const hookAr = typeof c.hook === 'string' ? '' : c.hook?.spokenAr;

                return (
                  <div key={c.id} className="border border-slate-300 rounded-xl p-5 space-y-4 page-break-inside-avoid">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-slate-900 text-white font-extrabold text-sm flex items-center justify-center">
                          #{c.conceptNumber}
                        </span>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">{c.title}</h3>
                          <p className="text-[11px] text-slate-500">{c.week} • {c.day} • {c.format.toUpperCase()}</p>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {c.publishDate}
                      </span>
                    </div>

                    <div className="bg-amber-50/70 p-3 rounded-lg border border-amber-200 text-xs space-y-1">
                      <span className="font-extrabold text-amber-900 text-[10px] uppercase block">⚡ 3-Second Hook:</span>
                      <p className="font-bold text-slate-900 italic">"{hookText}"</p>
                      {hookAr && <p className="font-bold text-slate-800 italic" dir="rtl">"{hookAr}"</p>}
                    </div>

                    {c.scenes?.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-800 uppercase">Scene-by-Scene Shot List:</h4>
                        <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                          <table className="w-full text-left">
                            <thead className="bg-slate-100 text-slate-700">
                              <tr>
                                <th className="p-2 w-16">Time</th>
                                <th className="p-2">Visual & Action</th>
                                <th className="p-2">Voiceover (EN/AR)</th>
                                <th className="p-2">On-Screen Graphic</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {c.scenes.map((s) => (
                                <tr key={s.sceneNo}>
                                  <td className="p-2 font-mono font-bold">{s.time}</td>
                                  <td className="p-2">
                                    <p className="font-semibold text-slate-900">{s.visual}</p>
                                    <p className="text-slate-500 text-[11px] mt-0.5">{s.talentAction}</p>
                                  </td>
                                  <td className="p-2">
                                    <p className="text-slate-800">{s.audioVoiceoverEn}</p>
                                    <p className="text-slate-600 text-[11px] mt-0.5" dir="rtl">{s.audioVoiceoverAr}</p>
                                  </td>
                                  <td className="p-2 font-mono text-[11px] text-slate-700">{s.onScreenTextEn}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {c.slides?.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-800 uppercase">Carousel Storyboard:</h4>
                        <div className="grid grid-cols-5 gap-2 text-xs">
                          {c.slides.map((sl, idx) => (
                            <div key={idx} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                              <span className="font-bold text-[10px] text-slate-500">Slide {sl.slideNo}</span>
                              <p className="font-bold text-slate-900 text-[11px]">{sl.title}</p>
                              <p className="text-[10px] text-slate-600">{sl.body}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-200">
                      <div>
                        <span className="font-bold text-slate-500 text-[10px] uppercase block">English Caption:</span>
                        <p className="text-slate-800 text-[11px] whitespace-pre-line mt-1">{c.captionEn}</p>
                      </div>
                      <div dir="rtl">
                        <span className="font-bold text-slate-500 text-[10px] uppercase block">النص العربي:</span>
                        <p className="text-slate-800 text-[11px] whitespace-pre-line mt-1">{c.captionAr}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </SystemShell>
  );
}
