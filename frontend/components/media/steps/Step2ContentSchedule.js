'use client';

import React, { useState, useMemo } from 'react';
import Badge from '../../ui/Badge';
import Button from '../../ui/Button';
import { FORMAT_TYPES, CONTENT_PILLARS, MEDIA_PLATFORMS, PIPELINE_STAGES } from '../../../lib/mediaMonthlyData';

export default function Step2ContentSchedule({
  campaign,
  onSelectConceptToScript,
  onAddNewConcept,
  onDeleteConcept,
  onPrevStep,
  onNextStep,
}) {
  const concepts = campaign.concepts || [];
  const [viewMode, setViewMode] = useState('board'); // 'board' | 'list'

  // Group into weeks
  const weeks = useMemo(() => {
    return ['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((weekName) => {
      const items = concepts.filter((c) => (c.week || 'Week 1') === weekName);
      return {
        name: weekName,
        items: items.sort((a, b) => new Date(a.publishDate || 0) - new Date(b.publishDate || 0)),
      };
    });
  }, [concepts]);

  // Quick stats
  const stats = useMemo(() => {
    const total = concepts.length;
    const reels = concepts.filter((c) => c.format === 'reel').length;
    const carousels = concepts.filter((c) => c.format === 'carousel').length;
    const photos = concepts.filter((c) => c.format === 'photography' || c.format === 'designed_post').length;
    const scripted = concepts.filter((c) => (c.scenes?.length || 0) > 0 || (c.slides?.length || 0) > 0).length;
    return { total, reels, carousels, photos, scripted };
  }, [concepts]);

  return (
    <div className="space-y-6 animate-[ds-toast-in_180ms_ease]">
      {/* Top Header: Clean, professional, executive title & actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
              Step 2 of 5
            </span>
            <span className="text-xs font-mono font-bold text-slate-400">
              {campaign.monthName}
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1">4-Week Content Plan & Schedule</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadence: 3 Posts / Week (Sundays, Tuesdays & Thursdays). Click any card to edit its script.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode('board')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'board' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>📅</span> 4-Week Board
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>📋</span> Editorial List
            </button>
          </div>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => onAddNewConcept && onAddNewConcept()}
            className="!bg-slate-900 hover:!bg-slate-800 !text-white !font-bold text-xs shadow-xs"
          >
            + Add New Post
          </Button>
        </div>
      </div>

      {/* Clean Single-Line Summary Strip */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4 text-slate-700">
          <span className="font-bold text-slate-900 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            {stats.total} Total Releases
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1">
            <span>🎬</span> {stats.reels} Reels
          </span>
          <span className="flex items-center gap-1">
            <span>📑</span> {stats.carousels} Carousels
          </span>
          <span className="flex items-center gap-1">
            <span>📸</span> {stats.photos} Photos
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 font-semibold">Scripting Status:</span>
          <Badge tone={stats.scripted === stats.total ? 'ready' : 'active'}>
            {stats.scripted} of {stats.total} Scripted
          </Badge>
        </div>
      </div>

      {/* MODE 1: 4-WEEK BOARD VIEW */}
      {viewMode === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {weeks.map((week) => (
            <div
              key={week.name}
              className="border border-slate-200 rounded-2xl bg-slate-50/50 overflow-hidden flex flex-col shadow-xs"
            >
              {/* Clean, High-Contrast Week Header */}
              <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between border-b border-slate-800">
                <div>
                  <h3 className="text-xs font-black tracking-wide uppercase text-white">{week.name}</h3>
                  <p className="text-[10px] text-slate-400">Scheduled Releases</p>
                </div>
                <span className="font-mono text-xs font-bold bg-slate-800 text-amber-300 px-2.5 py-0.5 rounded-lg border border-slate-700">
                  {week.items.length} {week.items.length === 1 ? 'Post' : 'Posts'}
                </span>
              </div>

              {/* Week Posts Container */}
              <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[640px]">
                {week.items.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-300 rounded-xl bg-white space-y-2">
                    <p>No posts planned for {week.name}.</p>
                    <button
                      type="button"
                      onClick={() => onAddNewConcept && onAddNewConcept({ week: week.name })}
                      className="text-xs font-bold text-amber-700 hover:underline inline-block bg-amber-50 px-3 py-1 rounded-lg border border-amber-200"
                    >
                      + Add Post to {week.name}
                    </button>
                  </div>
                ) : (
                  week.items.map((concept) => {
                    const formatMeta = FORMAT_TYPES.find((f) => f.id === concept.format) || FORMAT_TYPES[0];
                    const pillarMeta = CONTENT_PILLARS.find((p) => p.id === concept.pillar) || CONTENT_PILLARS[0];
                    const stageMeta = PIPELINE_STAGES.find((s) => s.id === concept.status) || PIPELINE_STAGES[0];
                    const hookSnippet = typeof concept.hook === 'string' ? concept.hook : concept.hook?.spokenEn;
                    const isScripted = (concept.scenes?.length || 0) > 0 || (concept.slides?.length || 0) > 0;

                    return (
                      <div
                        key={concept.id}
                        onClick={() => onSelectConceptToScript(concept)}
                        className="p-4 bg-white rounded-xl border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer space-y-3 group relative"
                      >
                        {/* Top Meta: Day Pill, Format Pill & Delete */}
                        <div className="flex items-center justify-between gap-1 text-[10px]">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                              {concept.day || 'Release'}
                            </span>
                            <span className={`px-2 py-0.5 rounded font-bold ${formatMeta.color} border`}>
                              {formatMeta.icon} {formatMeta.label}
                            </span>
                          </div>

                          <button
                            type="button"
                            title="Delete this post from calendar"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteConcept && onDeleteConcept(concept.id);
                            }}
                            className="text-slate-400 hover:text-red-600 p-1 hover:bg-red-50 rounded-md transition-colors text-xs font-bold"
                          >
                            ✕
                          </button>
                        </div>

                        {/* Title & Hook */}
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition-colors leading-snug">
                            {concept.title}
                          </h4>
                          {hookSnippet && (
                            <p className="text-[11px] text-slate-500 italic mt-1 line-clamp-2 leading-relaxed">
                              "{hookSnippet}"
                            </p>
                          )}
                        </div>

                        {/* Pillar Chip & Status Badge */}
                        <div className="flex items-center justify-between gap-1">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${pillarMeta.color} border inline-block`}>
                            {pillarMeta.label}
                          </span>
                          <Badge tone={stageMeta.badgeTone}>
                            {stageMeta.label}
                          </Badge>
                        </div>

                        {/* Bottom Footer: Channels & Script Action */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px]">
                          <div className="flex items-center gap-1">
                            {concept.platforms?.map((pid) => (
                              <span key={pid} className="text-xs" title={pid}>
                                {MEDIA_PLATFORMS.find((pl) => pl.id === pid)?.icon}
                              </span>
                            ))}
                          </div>

                          <span className={`font-bold flex items-center gap-1 ${
                            isScripted ? 'text-emerald-700' : 'text-amber-700'
                          }`}>
                            {isScripted ? '✓ Scripted' : '⚡ Script'} →
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODE 2: EDITORIAL LIST VIEW (TABLE) */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="p-3 w-12 text-center">#</th>
                  <th className="p-3">Schedule</th>
                  <th className="p-3">Title & Narrative</th>
                  <th className="p-3">Format</th>
                  <th className="p-3">Content Pillar</th>
                  <th className="p-3">Channels</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {concepts.map((concept) => {
                  const formatMeta = FORMAT_TYPES.find((f) => f.id === concept.format) || FORMAT_TYPES[0];
                  const pillarMeta = CONTENT_PILLARS.find((p) => p.id === concept.pillar) || CONTENT_PILLARS[0];
                  const stageMeta = PIPELINE_STAGES.find((s) => s.id === concept.status) || PIPELINE_STAGES[0];
                  const hookSnippet = typeof concept.hook === 'string' ? concept.hook : concept.hook?.spokenEn;

                  return (
                    <tr
                      key={concept.id}
                      onClick={() => onSelectConceptToScript(concept)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="p-3 text-center font-bold text-slate-900">
                        <span className="w-6 h-6 rounded-md bg-slate-100 inline-flex items-center justify-center">
                          {concept.conceptNumber}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="font-bold text-slate-900 block">{concept.week} • {concept.day}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{concept.publishDate}</span>
                      </td>
                      <td className="p-3 max-w-sm">
                        <p className="font-bold text-slate-900 text-xs">{concept.title}</p>
                        {hookSnippet && (
                          <p className="text-[11px] text-slate-500 italic line-clamp-1 mt-0.5">
                            "{hookSnippet}"
                          </p>
                        )}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded font-bold ${formatMeta.color} border text-[11px]`}>
                          {formatMeta.icon} {formatMeta.label}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded font-bold ${pillarMeta.color} border text-[10px]`}>
                          {pillarMeta.label}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {concept.platforms?.map((pid) => (
                            <span key={pid} className="text-xs" title={pid}>
                              {MEDIA_PLATFORMS.find((pl) => pl.id === pid)?.icon}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <Badge tone={stageMeta.badgeTone}>
                          {stageMeta.label}
                        </Badge>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => onSelectConceptToScript(concept)}
                            className="text-xs !bg-slate-100 font-bold"
                          >
                            Script →
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={() => onDeleteConcept && onDeleteConcept(concept.id)}
                            className="text-xs"
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
        </div>
      )}

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <Button type="button" variant="secondary" onClick={onPrevStep} className="text-xs">
          ← Back to Month Setup
        </Button>

        <Button
          type="button"
          variant="primary"
          onClick={onNextStep}
          className="!bg-slate-900 hover:!bg-slate-800 !text-white !font-bold text-xs shadow-sm"
        >
          Next: Director's Script Studio (Step 3) →
        </Button>
      </div>
    </div>
  );
}
