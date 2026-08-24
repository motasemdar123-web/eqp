'use client';

import React from 'react';
import Button from '../ui/Button';
import { FORMAT_TYPES, GOAL_TYPES, PIPELINE_STAGES, CONTENT_PILLARS, PRE_PRODUCTION_CHECKLIST } from '../../lib/mediaMonthlyData';

export default function MasterProductionBookModal({ campaign, onClose }) {
  if (!campaign) return null;

  const concepts = campaign.concepts || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/85 p-3 sm:p-6 flex items-center justify-center backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-6 sm:p-10 max-w-6xl w-full text-slate-900 space-y-8 max-h-[94vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Book Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                Dar Al Hay Commercial Co. (Komatsu Kuwait)
              </span>
              <span className="text-xs font-mono font-bold text-slate-400">
                {campaign.monthName}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Master Social Media Production Book
            </h1>
            <p className="text-xs text-slate-500">
              Complete Director Scripts, Scene Lists, B-Roll Guides, and Bilingual Social Copy
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              type="button"
              variant="primary"
              onClick={() => window.print()}
              className="!bg-slate-900 hover:!bg-slate-800 !text-white !font-bold text-xs shadow-md"
            >
              🖨️ Print / Save PDF
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} className="text-xs">
              Close
            </Button>
          </div>
        </div>

        {/* SECTION 1: MONTHLY STRATEGY & KPIS */}
        <section className="bg-slate-900 text-white rounded-2xl p-6 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <span className="text-amber-400 font-bold uppercase tracking-wider text-[10px]">
              Executive Brief & Campaign Direction
            </span>
            <h2 className="text-xl font-black text-white mt-1">{campaign.themeTitle}</h2>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">{campaign.strategicGoal}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
            <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Monthly KPIs:</span>
              <p className="font-bold text-amber-300">{campaign.targetKpi}</p>
            </div>

            <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Channels:</span>
              <p className="font-bold text-white">📸 Instagram (Reels/Carousels) • 💼 LinkedIn (B2B Authority) • 👥 Facebook (Community)</p>
            </div>
          </div>
        </section>

        {/* SECTION 2: PRE-PRODUCTION CALL SHEET & SAFETY */}
        <section className="border border-slate-200 rounded-2xl p-6 bg-slate-50 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span>📋</span> Pre-Production Crew & Safety Checklist (Kuwait Worksite Protocols)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {PRE_PRODUCTION_CHECKLIST.map((item) => (
              <div key={item.id} className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">{item.category}</span>
                <p className="font-semibold text-slate-800 leading-snug">{item.task}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 3: ALL CONCEPTS & SCENE-BY-SCENE DIRECTOR SCRIPTS */}
        <section className="space-y-8">
          <div className="border-b border-slate-200 pb-2">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Director's Scene-by-Scene Production Scripts ({concepts.length} Concepts)
            </h3>
            <p className="text-xs text-slate-500">
              Detailed technical shot lists, camera framing, foley audio cues, and bilingual voiceover
            </p>
          </div>

          <div className="space-y-8">
            {concepts.map((c) => {
              const formatMeta = FORMAT_TYPES.find((f) => f.id === c.format) || FORMAT_TYPES[0];
              const pillarMeta = CONTENT_PILLARS.find((p) => p.id === c.pillar) || CONTENT_PILLARS[0];
              const hookText = typeof c.hook === 'string' ? c.hook : c.hook?.spokenEn;
              const hookAr = typeof c.hook === 'string' ? '' : c.hook?.spokenAr;

              return (
                <article
                  key={c.id}
                  className="border border-slate-300 rounded-2xl p-6 bg-white shadow-xs space-y-5 page-break-inside-avoid"
                >
                  {/* Item Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-xl bg-slate-900 text-white font-black text-base flex items-center justify-center">
                        #{c.conceptNumber}
                      </span>
                      <div>
                        <h4 className="text-base font-bold text-slate-900">{c.title}</h4>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                          <span className="font-bold text-slate-800">{c.week} • {c.day}</span>
                          <span>•</span>
                          <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${formatMeta.color} border`}>
                            {formatMeta.icon} {formatMeta.label}
                          </span>
                          <span>•</span>
                          <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${pillarMeta.color} border`}>
                            {pillarMeta.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className="font-mono text-xs font-bold text-amber-900 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
                      📅 {c.publishDate}
                    </span>
                  </div>

                  {/* 3-Second Hook */}
                  <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 block">
                      ⚡ 3-Second Director Hook (0:00 - 0:03)
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 block uppercase">Voiceover (EN):</span>
                        <p className="font-extrabold text-slate-900 italic mt-0.5">"{hookText}"</p>
                      </div>
                      {hookAr && (
                        <div dir="rtl">
                          <span className="text-[10px] font-bold text-slate-500 block uppercase text-right">النص الصوتي (عربي):</span>
                          <p className="font-extrabold text-slate-900 italic mt-0.5 text-right">"{hookAr}"</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Scene-by-Scene Table */}
                  {c.scenes?.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        🎬 Scene-by-Scene Camera & Action Breakdown:
                      </h5>
                      <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                        <table className="w-full text-left">
                          <thead className="bg-slate-900 text-white text-[11px]">
                            <tr>
                              <th className="p-2.5 w-20">Time</th>
                              <th className="p-2.5">Camera Framing & Action</th>
                              <th className="p-2.5">Bilingual Voiceover (EN / AR)</th>
                              <th className="p-2.5">On-Screen Graphic & SFX</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {c.scenes.map((s) => (
                              <tr key={s.sceneNo} className="hover:bg-slate-50">
                                <td className="p-2.5 font-mono font-bold text-slate-900 align-top">
                                  {s.time}
                                </td>
                                <td className="p-2.5 align-top space-y-1">
                                  <p className="font-bold text-slate-900">{s.visual}</p>
                                  <p className="text-[11px] text-slate-600">👷 {s.talentAction}</p>
                                </td>
                                <td className="p-2.5 align-top space-y-1">
                                  <p className="font-semibold text-slate-900">{s.audioVoiceoverEn}</p>
                                  <p className="text-[11px] text-slate-700 font-semibold" dir="rtl">{s.audioVoiceoverAr}</p>
                                </td>
                                <td className="p-2.5 align-top space-y-1">
                                  <p className="font-mono text-[11px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-block">
                                    {s.onScreenTextEn}
                                  </p>
                                  <p className="text-[10px] text-slate-500 italic block">🎵 {s.sfxMusic}</p>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Carousel Storyboard Deck */}
                  {c.slides?.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        📑 Carousel Slide-by-Slide Storyboard Deck:
                      </h5>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs">
                        {c.slides.map((sl, idx) => (
                          <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                            <span className="font-black text-[10px] text-slate-500 block uppercase">
                              Slide {sl.slideNo}
                            </span>
                            <h6 className="font-bold text-slate-900 text-xs leading-snug">{sl.title}</h6>
                            <p className="text-[11px] text-slate-600 leading-relaxed mt-1">{sl.body}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Captions (EN / AR) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-200">
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                      <span className="font-bold text-slate-500 text-[10px] uppercase block">
                        🇬🇧 English Social Caption:
                      </span>
                      <p className="text-slate-800 text-xs whitespace-pre-line leading-relaxed">{c.captionEn}</p>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1" dir="rtl">
                      <span className="font-bold text-slate-500 text-[10px] uppercase block text-right">
                        🇰🇼 النص العربي للمنشور:
                      </span>
                      <p className="text-slate-800 text-xs whitespace-pre-line leading-relaxed text-right">{c.captionAr}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
