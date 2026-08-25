'use client';

import React, { useMemo } from 'react';
import Card from '../../ui/Card';
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

  // Production pipeline stats
  const pipelineStats = useMemo(() => {
    const counts = { idea: 0, scripted: 0, production: 0, review: 0, ready: 0, published: 0 };
    concepts.forEach((c) => {
      const st = c.status || 'idea';
      if (counts[st] !== undefined) counts[st]++;
      else counts.idea++;
    });
    return counts;
  }, [concepts]);

  // Format distribution stats
  const formatStats = useMemo(() => {
    const counts = {};
    FORMAT_TYPES.forEach((f) => { counts[f.id] = 0; });
    concepts.forEach((c) => {
      if (counts[c.format] !== undefined) counts[c.format]++;
      else counts.reel = (counts.reel || 0) + 1;
    });
    return counts;
  }, [concepts]);

  const totalConcepts = concepts.length || 1;

  return (
    <div className="space-y-6 animate-[ds-toast-in_180ms_ease]">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
            Step 2 of 5
          </span>
          <h2 className="text-xl font-black text-slate-900 mt-1">4-Week Content Plan & Publishing Schedule</h2>
          <p className="text-xs text-slate-500">
            Cadence: 3 Posts / Week (Sundays, Tuesdays & Thursdays). Click any card to edit its director script or delete.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge tone="active">{concepts.length} Planned Releases</Badge>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onAddNewConcept && onAddNewConcept()}
            className="text-xs !bg-white hover:!bg-slate-50 font-bold border border-slate-200"
          >
            + Add New Post
          </Button>
        </div>
      </div>

      {/* Production Pipeline & Format Distribution Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: 6-Stage Pipeline Progress Strip */}
        <div className="lg:col-span-8 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>📊</span> Production Pipeline Status
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {concepts.filter((c) => c.status === 'ready' || c.status === 'published').length} / {concepts.length} Completed
            </span>
          </div>

          {/* Multi-stage progress bar */}
          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            <div style={{ width: `${(pipelineStats.idea / totalConcepts) * 100}%` }} className="bg-slate-400" title={`Idea: ${pipelineStats.idea}`} />
            <div style={{ width: `${(pipelineStats.scripted / totalConcepts) * 100}%` }} className="bg-blue-500" title={`Scripted: ${pipelineStats.scripted}`} />
            <div style={{ width: `${(pipelineStats.production / totalConcepts) * 100}%` }} className="bg-amber-500" title={`Production: ${pipelineStats.production}`} />
            <div style={{ width: `${(pipelineStats.review / totalConcepts) * 100}%` }} className="bg-purple-500" title={`Review: ${pipelineStats.review}`} />
            <div style={{ width: `${(pipelineStats.ready / totalConcepts) * 100}%` }} className="bg-emerald-400" title={`Ready: ${pipelineStats.ready}`} />
            <div style={{ width: `${(pipelineStats.published / totalConcepts) * 100}%` }} className="bg-emerald-600" title={`Published: ${pipelineStats.published}`} />
          </div>

          {/* Pipeline Legend Pills */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-[10px] pt-1 font-semibold">
            {PIPELINE_STAGES.map((st) => (
              <div key={st.id} className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                <span className="text-xs">{st.icon}</span>
                <span className="text-slate-600 truncate">{st.label.replace(/^\d+\.\s*/, '')}</span>
                <span className="font-mono font-bold text-slate-900 ml-auto">{pipelineStats[st.id] || 0}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Format Mix Mini-Chart */}
        <div className="lg:col-span-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>🎬</span> Format Allocation
            </span>
            <span className="text-[10px] font-mono text-slate-400">{concepts.length} Total</span>
          </div>

          <div className="space-y-1.5 pt-0.5">
            {FORMAT_TYPES.slice(0, 3).map((fmt) => {
              const count = formatStats[fmt.id] || 0;
              const pct = Math.round((count / totalConcepts) * 100);
              return (
                <div key={fmt.id} className="space-y-0.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-700 font-semibold flex items-center gap-1">
                      <span>{fmt.icon}</span> {fmt.label}
                    </span>
                    <span className="font-mono font-bold text-slate-900">{count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        fmt.id === 'reel' ? 'bg-purple-500' : fmt.id === 'carousel' ? 'bg-indigo-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4-Week Spacious Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {weeks.map((week) => (
          <div
            key={week.name}
            className="border border-slate-200 rounded-2xl bg-slate-50/70 overflow-hidden flex flex-col shadow-xs"
          >
            {/* Week Header */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-850 text-white p-3.5 flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="text-xs font-black tracking-wide uppercase">{week.name}</h3>
                <p className="text-[10px] text-slate-400">Scheduled Releases</p>
              </div>
              <span className="font-mono text-xs font-bold bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-lg border border-amber-500/30">
                {week.items.length} Posts
              </span>
            </div>

            {/* Posts inside Week */}
            <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[620px]">
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
                      {/* Top Day & Format Badges + Delete Button */}
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
                          {stageMeta.icon} {stageMeta.label.replace(/^\d+\.\s*/, '')}
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
                          {isScripted ? '✓ Scripted' : '⚡ Click to Script'} →
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
