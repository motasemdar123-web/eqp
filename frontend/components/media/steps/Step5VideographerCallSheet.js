'use client';

import React, { useState } from 'react';
import Card from '../../ui/Card';
import Badge from '../../ui/Badge';
import Button from '../../ui/Button';
import { FORMAT_TYPES, CONTENT_PILLARS, PRE_PRODUCTION_CHECKLIST } from '../../../lib/mediaMonthlyData';

export default function Step5VideographerCallSheet({
  campaign,
  selectedConceptId,
  onSelectConcept,
  onPrevStep,
}) {
  const concepts = campaign.concepts || [];
  const [viewMode, setViewMode] = useState('single'); // 'single' | 'month_book'
  const [copied, setCopied] = useState(false);

  const currentConcept = concepts.find((c) => c.id === selectedConceptId) || concepts[0] || {};
  const formatMeta = FORMAT_TYPES.find((f) => f.id === currentConcept.format) || FORMAT_TYPES[0];
  const pillarMeta = CONTENT_PILLARS.find((p) => p.id === currentConcept.pillar) || CONTENT_PILLARS[0];

  const handleCopySingleBrief = () => {
    let specificContent = '';

    if (currentConcept.format === 'photography') {
      const shots = currentConcept.photoShots || [
        { title: '3/4 Low-Angle Front Hero', framing: '24mm wide angle, 30cm off ground', lighting: 'Golden hour sunset', aspectRatio: '4:5 Portrait' },
        { title: 'Side Elevation Profile', framing: '50mm eye-level full balance', lighting: 'Crisp desert side-light', aspectRatio: '16:9 Landscape' },
        { title: 'Macro Detail Close-Up', framing: '85mm macro on hydraulic cylinder', lighting: 'Metallic highlight contrast', aspectRatio: '1:1 Square' },
      ];

      specificContent = `📸 PHOTOGRAPHY SHOT LIST & ANGLES:
${shots.map((s, idx) => `[ANGLE #${idx + 1}] ${s.title}
  * FRAMING/LENS: ${s.framing}
  * LIGHTING: ${s.lighting}
  * RATIO: ${s.aspectRatio}
  * STAGING: ${s.staging || 'Clean washed machine'}`).join('\n\n')}

🎨 ART DIRECTION:
${currentConcept.summary || 'Industrial high-contrast, golden hour desert warmth, vivid Komatsu yellow.'}

📋 MANDATORY PHOTO CHECKLIST:
${(currentConcept.brollChecklist || ['Wide establishing hero shot', 'Macro engine/hydraulic details', 'Operator cabin view']).map((b) => `- [ ] ${b}`).join('\n')}`;
    } else if (currentConcept.format === 'carousel') {
      const slides = currentConcept.slides || [];
      specificContent = `📑 CAROUSEL DECK STORYBOARD (${slides.length} SLIDES):
${slides.map((s, idx) => `SLIDE ${s.slideNo || idx + 1}: ${s.title}
  * BODY: ${s.body}`).join('\n\n')}`;
    } else if (currentConcept.format === 'designed_post') {
      specificContent = `📐 TECHNICAL INFOGRAPHIC BLUEPRINT:
* METRICS & DATA: ${currentConcept.summary || 'Key engineering specifications and comparison points'}
* VISUAL DIRECTIVE: ${currentConcept.postProductionNotes || '3D isometric cutaway graphic with technical callouts'}`;
    } else if (currentConcept.format === 'cta_post') {
      specificContent = `🎯 CONVERSION & OFFER BLUEPRINT:
* PRIMARY OFFER: ${currentConcept.ctaText || 'Direct inquiry package'}
* INCLUSIONS: ${currentConcept.summary || 'Certified parts and inspection package'}`;
    } else {
      // Video / Reel
      specificContent = `⚡ 3-SECOND HOOK (0:00 - 0:03):
- Spoken (EN): "${typeof currentConcept.hook === 'string' ? currentConcept.hook : currentConcept.hook?.spokenEn}"
- Spoken (AR): "${typeof currentConcept.hook === 'object' ? currentConcept.hook?.spokenAr : ''}"
- Visual Action: ${typeof currentConcept.hook === 'object' ? currentConcept.hook?.visualHook : ''}

🎬 SCENE-BY-SCENE SHOT LIST:
${(currentConcept.scenes || []).map((s) => `[${s.time}] SCENE ${s.sceneNo}
  * CAMERA: ${s.visual}
  * ACTION: ${s.talentAction}
  * VOICEOVER (EN): ${s.audioVoiceoverEn}
  * VOICEOVER (AR): ${s.audioVoiceoverAr}
  * GRAPHIC: ${s.onScreenTextEn}
  * SFX: ${s.sfxMusic}`).join('\n\n')}

🎥 MANDATORY B-ROLL SHOTS:
${(currentConcept.brollChecklist || []).map((b) => `- [ ] ${b}`).join('\n')}`;
    }

    const text = `🎬 PRODUCTION BRIEF - DAR AL HAY (KOMATSU KUWAIT)
===================================================
POST #${currentConcept.conceptNumber}: ${currentConcept.title}
SCHEDULE: ${currentConcept.week} (${currentConcept.day} - ${currentConcept.publishDate})
FORMAT: ${formatMeta.label} | PILLAR: ${pillarMeta.label}

${specificContent}

SAFETY & PPE: Safety vest, hardhat, steel-toe boots required on all Kuwait worksites.`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6 animate-[ds-toast-in_180ms_ease]">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Production Call Sheet & Creative Brief</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Print or copy clean shot lists, photography angles, and scripts directly for your camera crew and graphic designers.
          </p>
        </div>

        {/* View Switcher & Print Controls */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-medium">
            <button
              type="button"
              onClick={() => setViewMode('single')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'single' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Single Shoot Sheet
            </button>
            <button
              type="button"
              onClick={() => setViewMode('month_book')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'month_book' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Full Monthly Book ({concepts.length})
            </button>
          </div>

          <Button
            type="button"
            variant="primary"
            onClick={() => window.print()}
            className="!bg-slate-900 hover:!bg-slate-800 !text-white !font-bold text-xs shadow-xs cursor-pointer"
          >
            Print / Save PDF
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={handleCopySingleBrief}
            className="text-xs !bg-white cursor-pointer"
          >
            {copied ? '✓ Copied to Clipboard!' : 'Copy for WhatsApp'}
          </Button>
        </div>
      </div>

      {/* MODE 1: SINGLE CONCEPT CALL SHEET */}
      {viewMode === 'single' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Concept Selector */}
          <div className="lg:col-span-4 space-y-2 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs max-h-[700px] overflow-y-auto">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">Select Shoot to Review:</span>
            <div className="space-y-1.5">
              {concepts.map((c) => {
                const isSelected = c.id === currentConcept.id;
                const fMeta = FORMAT_TYPES.find((f) => f.id === c.format) || FORMAT_TYPES[0];

                return (
                  <div
                    key={c.id}
                    onClick={() => onSelectConcept(c.id)}
                    className={`p-2.5 rounded-lg border transition-all cursor-pointer space-y-1 ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className={`font-semibold ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>
                        {c.week} • {c.day}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded font-semibold text-[10px] whitespace-nowrap ${isSelected ? 'bg-slate-800 text-amber-300' : fMeta.color}`}>
                        {fMeta.shortLabel || fMeta.label}
                      </span>
                    </div>
                    <h4 className={`text-xs font-bold leading-snug line-clamp-1 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      {c.title || 'Untitled Shoot'}
                    </h4>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Sheet Document Card */}
          <div className="lg:col-span-8 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-5 print:p-0 print:border-none print:shadow-none">
            {/* Sheet Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b-2 border-slate-900 pb-3.5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Dar Al Hay Commercial Co. | Komatsu Kuwait
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  Production Call Sheet: #{currentConcept.conceptNumber} {currentConcept.title}
                </h3>
              </div>

              <div className="text-right sm:text-right">
                <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded border border-slate-200 inline-block">
                  {currentConcept.publishDate} ({currentConcept.day})
                </span>
              </div>
            </div>

            {/* Quick Meta Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">Format:</span>
                <span className="font-semibold text-slate-900">{formatMeta.shortLabel || formatMeta.label}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">Pillar:</span>
                <span className="font-semibold text-slate-900 truncate block" title={pillarMeta.label}>
                  {pillarMeta.shortLabel || pillarMeta.label}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">Location:</span>
                <span className="font-semibold text-slate-900">Kuwait Jobsite / Showroom</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">Safety PPE:</span>
                <span className="font-semibold text-slate-900">Vest + Hardhat + Boots</span>
              </div>
            </div>

            {/* DYNAMIC CONTENT PER FORMAT */}

            {/* 1. PHOTOGRAPHY FORMAT */}
            {currentConcept.format === 'photography' && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  📸 Photographer Camera Angles & Shot List
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-900 text-white text-[11px]">
                      <tr>
                        <th className="p-2.5 w-12">#</th>
                        <th className="p-2.5 w-44">Shot & Angle</th>
                        <th className="p-2.5">Framing & Lens Setup</th>
                        <th className="p-2.5 w-36">Lighting & Ratio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(currentConcept.photoShots || [
                        { title: '3/4 Low-Angle Hero', framing: '24mm wide angle, 30cm off ground looking up at blade', lighting: 'Golden hour sunset', aspectRatio: '4:5 Portrait' },
                        { title: 'Side Elevation Profile', framing: '50mm eye-level full balance and boom geometry', lighting: 'Crisp desert side-light', aspectRatio: '16:9 Landscape' },
                        { title: 'Macro Detail Close-Up', framing: '85mm macro on cylinder rod and Komatsu badge', lighting: 'Metallic highlight contrast', aspectRatio: '1:1 Square' },
                      ]).map((shot, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold font-mono text-emerald-600 align-top">{idx + 1}</td>
                          <td className="p-2.5 font-bold text-slate-900 align-top">{shot.title}</td>
                          <td className="p-2.5 text-slate-700 align-top space-y-1">
                            <p>{shot.framing}</p>
                            {shot.staging && <p className="text-[11px] text-slate-500 italic">🚜 Staging: {shot.staging}</p>}
                          </td>
                          <td className="p-2.5 text-slate-700 align-top space-y-1">
                            <p className="text-[11px] font-semibold">{shot.lighting}</p>
                            <span className="text-[10px] font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 inline-block">
                              {shot.aspectRatio || '4:5 Portrait'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {currentConcept.summary && (
                  <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-200 text-xs text-emerald-900 space-y-1">
                    <span className="font-bold text-[10px] uppercase block">🎨 Art Direction & Visual Mood:</span>
                    <p className="text-slate-800 leading-relaxed">{currentConcept.summary}</p>
                  </div>
                )}
              </div>
            )}

            {/* 2. CAROUSEL FORMAT */}
            {currentConcept.format === 'carousel' && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  📑 Multi-Slide Deck Storyboard
                </h4>
                <div className="space-y-2">
                  {(currentConcept.slides || []).map((s, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">Slide {s.slideNo || idx + 1}: {s.title}</span>
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                          {idx === 0 ? 'Cover Hook' : idx === (currentConcept.slides?.length || 5) - 1 ? 'Final CTA' : 'Spec Point'}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">{s.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. VIDEO / REEL FORMAT */}
            {currentConcept.format === 'reel' && (
              <>
                {/* 3-Second Hook */}
                <div className="bg-amber-50/70 p-3.5 rounded-lg border border-amber-200 space-y-1.5 text-xs">
                  <span className="font-bold uppercase tracking-wider text-amber-900 text-[10px] block">
                    ⚡ 3-Second Spoken Hook & Camera Grabber (0:00 - 0:03)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase block">Spoken (EN):</span>
                      <p className="font-semibold text-slate-900 italic mt-0.5">
                        &ldquo;{typeof currentConcept.hook === 'string' ? currentConcept.hook : currentConcept.hook?.spokenEn}&rdquo;
                      </p>
                    </div>
                    {typeof currentConcept.hook === 'object' && currentConcept.hook?.spokenAr && (
                      <div dir="rtl">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase block text-right">النص الصوتي (عربي):</span>
                        <p className="font-semibold text-slate-900 italic mt-0.5 text-right">
                          &ldquo;{currentConcept.hook?.spokenAr}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Scene-by-Scene Table */}
                {(currentConcept.scenes?.length || 0) > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      🎬 Scene-by-Scene Shot Table for Videographer
                    </h4>
                    <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-slate-900 text-white text-[11px]">
                          <tr>
                            <th className="p-2.5 w-20">Time</th>
                            <th className="p-2.5">Camera Framing & Action</th>
                            <th className="p-2.5">Spoken Dialogue (EN / AR)</th>
                            <th className="p-2.5">On-Screen Text & SFX</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {currentConcept.scenes.map((s) => (
                            <tr key={s.sceneNo} className="hover:bg-slate-50">
                              <td className="p-2.5 font-mono font-bold text-slate-900 align-top">{s.time}</td>
                              <td className="p-2.5 align-top space-y-1">
                                <p className="font-bold text-slate-900">{s.visual}</p>
                                <p className="text-[11px] text-slate-600">{s.talentAction}</p>
                              </td>
                              <td className="p-2.5 align-top space-y-1">
                                <p className="font-semibold text-slate-900">{s.audioVoiceoverEn}</p>
                                <p className="text-[11px] text-slate-700 font-semibold" dir="rtl">{s.audioVoiceoverAr}</p>
                              </td>
                              <td className="p-2.5 align-top space-y-1">
                                <span className="font-mono text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-block">
                                  {s.onScreenTextEn}
                                </span>
                                <p className="text-[10px] text-slate-500 italic block">{s.sfxMusic}</p>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Checklist */}
            {(currentConcept.brollChecklist?.length || 0) > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  📋 Mandatory On-Site Checklist
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {currentConcept.brollChecklist.map((shot, idx) => (
                    <label key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded border border-slate-200 cursor-pointer hover:bg-slate-100">
                      <input type="checkbox" className="rounded text-amber-500 focus:ring-amber-400" />
                      <span className="text-slate-800">{shot}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODE 2: FULL MONTHLY BOOK VIEW */}
      {viewMode === 'month_book' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-6 print:p-0 print:border-none print:shadow-none">
          <div className="border-b-2 border-slate-900 pb-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Dar Al Hay Commercial Co. | Komatsu Kuwait
            </span>
            <h3 className="text-xl font-bold text-slate-900 mt-1">
              Monthly Production Master Book — {campaign.monthName} ({concepts.length} Releases)
            </h3>
          </div>

          <div className="space-y-6 divide-y divide-slate-200">
            {concepts.map((c) => {
              const fM = FORMAT_TYPES.find((f) => f.id === c.format) || FORMAT_TYPES[0];
              const pM = CONTENT_PILLARS.find((p) => p.id === c.pillar) || CONTENT_PILLARS[0];

              return (
                <div key={c.id} className="pt-6 first:pt-0 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-slate-900 text-amber-400 font-mono font-bold text-xs flex items-center justify-center">
                        #{c.conceptNumber}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{c.title}</h4>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border">
                        {c.publishDate} ({c.day})
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${fM.color} border`}>
                        {fM.shortLabel || fM.label}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-50 border text-slate-700">
                        {pM.shortLabel || pM.label}
                      </span>
                    </div>
                  </div>

                  {c.format === 'photography' ? (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                      <span className="font-bold text-emerald-800 text-[10px] uppercase block">📸 Photography Focus:</span>
                      <p className="text-slate-800">{c.summary || 'Hero Machine Photography on site'}</p>
                    </div>
                  ) : c.format === 'carousel' ? (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                      <span className="font-bold text-indigo-800 text-[10px] uppercase block">📑 Carousel Storyboard:</span>
                      <p className="text-slate-800">{c.summary || `${c.slides?.length || 5} Slide Swipe Deck`}</p>
                    </div>
                  ) : (
                    c.scenes?.length > 0 && (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                        <span className="font-bold text-slate-800 text-[10px] uppercase block">🎬 Video Script:</span>
                        <p className="text-slate-700 italic">&ldquo;{typeof c.hook === 'string' ? c.hook : c.hook?.spokenEn}&rdquo;</p>
                      </div>
                    )
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <Button type="button" variant="secondary" onClick={onPrevStep} className="text-xs cursor-pointer">
          ← Back to Platform Copy (Step 4)
        </Button>
      </div>
    </div>
  );
}
