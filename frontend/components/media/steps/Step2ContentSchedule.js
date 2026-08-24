'use client';

import React from 'react';
import Card from '../../ui/Card';
import Badge from '../../ui/Badge';
import Button from '../../ui/Button';
import { FORMAT_TYPES, CONTENT_PILLARS, MEDIA_PLATFORMS } from '../../../lib/mediaMonthlyData';

export default function Step2ContentSchedule({
  campaign,
  onSelectConceptToScript,
  onAddNewConcept,
  onPrevStep,
  onNextStep,
}) {
  const concepts = campaign.concepts || [];

  const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((weekName) => {
    const items = concepts.filter((c) => (c.week || 'Week 1') === weekName);
    return {
      name: weekName,
      items: items.sort((a, b) => new Date(a.publishDate || 0) - new Date(b.publishDate || 0)),
    };
  });

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
            Cadence: 3 Posts / Week (Sundays, Tuesdays & Thursdays). Click any card to open its Director's Script.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge tone="active">{concepts.length} Planned Releases</Badge>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onAddNewConcept && onAddNewConcept()}
            className="text-xs !bg-white"
          >
            + Add New Post
          </Button>
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
            <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black tracking-wide uppercase">{week.name}</h3>
                <p className="text-[10px] text-slate-400">Scheduled Production</p>
              </div>
              <span className="font-mono text-xs font-bold bg-slate-800 text-amber-300 px-2.5 py-0.5 rounded-lg border border-slate-700">
                {week.items.length} Posts
              </span>
            </div>

            {/* Posts inside Week */}
            <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[620px]">
              {week.items.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-300 rounded-xl bg-white">
                  <p>No posts planned for {week.name}.</p>
                  <button
                    type="button"
                    onClick={() => onAddNewConcept && onAddNewConcept({ week: week.name })}
                    className="text-xs font-bold text-amber-700 hover:underline mt-2 inline-block"
                  >
                    + Add Post
                  </button>
                </div>
              ) : (
                week.items.map((concept) => {
                  const formatMeta = FORMAT_TYPES.find((f) => f.id === concept.format) || FORMAT_TYPES[0];
                  const pillarMeta = CONTENT_PILLARS.find((p) => p.id === concept.pillar) || CONTENT_PILLARS[0];
                  const hookSnippet = typeof concept.hook === 'string' ? concept.hook : concept.hook?.spokenEn;
                  const isScripted = (concept.scenes?.length || 0) > 0 || (concept.slides?.length || 0) > 0;

                  return (
                    <div
                      key={concept.id}
                      onClick={() => onSelectConceptToScript(concept)}
                      className="p-4 bg-white rounded-xl border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer space-y-3 group"
                    >
                      {/* Top Day & Format Badges */}
                      <div className="flex items-center justify-between gap-1 text-[10px]">
                        <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {concept.day || 'Release'}
                        </span>
                        <span className={`px-2 py-0.5 rounded font-bold ${formatMeta.color} border`}>
                          {formatMeta.icon} {formatMeta.label}
                        </span>
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

                      {/* Pillar Chip */}
                      <div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${pillarMeta.color} border inline-block`}>
                          {pillarMeta.label}
                        </span>
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
