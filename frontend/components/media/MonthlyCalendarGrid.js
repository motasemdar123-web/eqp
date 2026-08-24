'use client';

import React from 'react';
import Badge from '../ui/Badge';
import { FORMAT_TYPES, PIPELINE_STAGES, MEDIA_PLATFORMS, CONTENT_PILLARS } from '../../lib/mediaMonthlyData';

export default function MonthlyCalendarGrid({ concepts, onInspectConcept }) {
  // Group concepts into Week 1, Week 2, Week 3, Week 4
  const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((weekName) => {
    const items = concepts.filter((c) => (c.week || 'Week 1') === weekName);
    return {
      name: weekName,
      items: items.sort((a, b) => new Date(a.publishDate || 0) - new Date(b.publishDate || 0)),
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">4-Week Strategic Publishing Calendar</h3>
          <p className="text-xs text-slate-500">
            Publishing Cadence: 3 High-Impact Content Releases Per Week (Sundays, Tuesdays & Thursdays)
          </p>
        </div>
        <Badge tone="active">{concepts.length} Scheduled Releases</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {weeks.map((week) => (
          <div
            key={week.name}
            className="border border-slate-200 rounded-2xl bg-slate-50/70 overflow-hidden flex flex-col shadow-xs"
          >
            {/* Week Header */}
            <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black tracking-wide uppercase">{week.name}</h4>
                <p className="text-[10px] text-slate-400">Scheduled Production</p>
              </div>
              <span className="font-mono text-xs font-bold bg-slate-800 text-amber-300 px-2.5 py-0.5 rounded-lg border border-slate-700">
                {week.items.length} Posts
              </span>
            </div>

            {/* Week Content Cards */}
            <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[600px]">
              {week.items.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-300 rounded-xl">
                  No posts scheduled for {week.name}.
                </div>
              ) : (
                week.items.map((concept) => {
                  const formatMeta = FORMAT_TYPES.find((f) => f.id === concept.format) || FORMAT_TYPES[0];
                  const pillarMeta = CONTENT_PILLARS.find((p) => p.id === concept.pillar) || CONTENT_PILLARS[0];
                  const stageMeta = PIPELINE_STAGES.find((s) => s.id === concept.status) || PIPELINE_STAGES[0];
                  const hookSnippet = typeof concept.hook === 'string' ? concept.hook : concept.hook?.spokenEn;

                  return (
                    <div
                      key={concept.id}
                      onClick={() => onInspectConcept(concept)}
                      className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer space-y-2.5 group"
                    >
                      {/* Top Meta Row */}
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
                        <h5 className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition-colors leading-snug">
                          {concept.title}
                        </h5>
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

                      {/* Bottom Channels & Status */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px]">
                        <div className="flex items-center gap-1">
                          {concept.platforms?.map((pid) => (
                            <span key={pid} className="text-xs" title={pid}>
                              {MEDIA_PLATFORMS.find((pl) => pl.id === pid)?.icon}
                            </span>
                          ))}
                        </div>

                        <Badge tone={stageMeta.badgeTone}>
                          {stageMeta.icon} {stageMeta.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
