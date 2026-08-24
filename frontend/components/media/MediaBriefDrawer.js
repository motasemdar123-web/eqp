'use client';

import React, { useState } from 'react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { FORMAT_TYPES, GOAL_TYPES, PIPELINE_STAGES, MEDIA_PLATFORMS, CONTENT_PILLARS } from '../../lib/mediaContentData';
import PlatformPostSimulator from './PlatformPostSimulator';

export default function MediaBriefDrawer({ concept, onClose, onUpdateStatus, onEdit }) {
  const [activeTab, setActiveTab] = useState('script'); // 'script' | 'storyboard' | 'broll' | 'tov' | 'captions' | 'simulator'
  const [copiedSection, setCopiedSection] = useState(null);

  if (!concept) return null;

  const formatMeta = FORMAT_TYPES.find((f) => f.id === concept.format) || FORMAT_TYPES[0];
  const goalMeta = GOAL_TYPES.find((g) => g.id === concept.goal) || GOAL_TYPES[0];
  const stageMeta = PIPELINE_STAGES.find((s) => s.id === concept.status) || PIPELINE_STAGES[0];
  const pillarMeta = CONTENT_PILLARS.find((p) => p.id === concept.pillar) || CONTENT_PILLARS[0];

  const handleCopy = (text, sectionName) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionName);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Drawer Header */}
        <div className="bg-slate-900 text-white p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xl font-black text-amber-400 shrink-0">
              #{concept.conceptNumber}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-bold">
                  {concept.week || 'Week 1'} • {concept.day || 'Sunday'}
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${formatMeta.color} border`}>
                  {formatMeta.icon} {formatMeta.label}
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${pillarMeta.color} border`}>
                  {pillarMeta.label}
                </span>
                <Badge tone={stageMeta.badgeTone}>
                  {stageMeta.icon} {stageMeta.label}
                </Badge>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">{concept.title}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Status Quick Switcher */}
            <select
              value={concept.status}
              onChange={(e) => onUpdateStatus && onUpdateStatus(concept.id, e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              {PIPELINE_STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.icon} {s.label}
                </option>
              ))}
            </select>

            {onEdit && (
              <Button type="button" variant="secondary" size="sm" onClick={() => onEdit(concept)}>
                Edit
              </Button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white rounded-lg p-1.5 hover:bg-slate-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tab Navigation Strip */}
        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-5 py-2 overflow-x-auto">
          {concept.scenes?.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('script')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'script' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              🎬 Scene-by-Scene Script ({concept.scenes.length} Scenes)
            </button>
          )}

          {concept.format === 'carousel' && (
            <button
              type="button"
              onClick={() => setActiveTab('storyboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'storyboard' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              📑 Carousel Storyboard ({concept.slides?.length || 0} Slides)
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('broll')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'broll' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            🎥 B-Roll & Production Notes
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tov')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'tov' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            🎯 TOV & Target Audience
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('captions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'captions' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            📝 Copy & Hashtags (EN/AR)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('simulator')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'simulator' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            📱 Multi-Channel Simulator
          </button>
        </div>

        {/* Drawer Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: SCENE-BY-SCENE DIRECTOR'S SCRIPT */}
          {activeTab === 'script' && concept.scenes?.length > 0 && (
            <div className="space-y-6">
              {/* 3-Second Hook Banner */}
              <div className="border border-amber-300 bg-amber-50/70 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-amber-900">
                    ⚡ The 3-Second Director Hook (0:00 - 0:03)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(concept.hook?.spokenEn || concept.hook, 'hook')}
                    className="text-xs font-bold text-amber-800 hover:underline"
                  >
                    {copiedSection === 'hook' ? '✓ Copied' : '📋 Copy Hook'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200 text-xs">
                    <span className="font-bold text-slate-500 block text-[10px] uppercase">Spoken Voiceover (EN):</span>
                    <p className="font-extrabold text-slate-900 mt-0.5 italic">
                      "{concept.hook?.spokenEn || concept.hook}"
                    </p>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200 text-xs" dir="rtl">
                    <span className="font-bold text-slate-500 block text-[10px] uppercase text-right">النص الصوتي (عربي):</span>
                    <p className="font-extrabold text-slate-900 mt-0.5 italic text-right">
                      "{concept.hook?.spokenAr || 'صُنعت لتقهر أصعب تضاريس الصحراء في الكويت..'}"
                    </p>
                  </div>
                </div>

                {concept.hook?.visualHook && (
                  <div className="text-[11px] text-amber-950 font-medium pt-1">
                    <span className="font-bold">🎬 Visual Hook Action:</span> {concept.hook.visualHook}
                  </div>
                )}
              </div>

              {/* Scene Breakdown Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="bg-slate-900 text-white p-3 flex items-center justify-between text-xs font-bold">
                  <span>Director's Scene-by-Scene Shot List</span>
                  <span className="text-slate-400 font-normal">Pacing: 25-30 Seconds Total</span>
                </div>
                <div className="divide-y divide-slate-200">
                  {concept.scenes.map((scene) => (
                    <div key={scene.sceneNo} className="p-4 bg-white hover:bg-slate-50/60 transition-colors space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center">
                            {scene.sceneNo}
                          </span>
                          <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            ⏱️ {scene.time}
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {scene.sfxMusic}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        {/* Visual & Talent Action */}
                        <div className="space-y-1.5">
                          <div>
                            <span className="font-bold text-slate-700 uppercase text-[10px] block">🎥 Camera Shot & Framing:</span>
                            <p className="text-slate-800 mt-0.5">{scene.visual}</p>
                          </div>
                          <div>
                            <span className="font-bold text-slate-700 uppercase text-[10px] block">👷 Talent / Machine Action:</span>
                            <p className="text-slate-600 mt-0.5">{scene.talentAction}</p>
                          </div>
                        </div>

                        {/* Audio & On-Screen Graphic */}
                        <div className="space-y-1.5 bg-slate-50/80 p-3 rounded-lg border border-slate-200/80">
                          <div>
                            <span className="font-bold text-sky-800 uppercase text-[10px] block">🎙️ Voiceover Script (EN / AR):</span>
                            <p className="text-slate-900 font-semibold mt-0.5">{scene.audioVoiceoverEn}</p>
                            <p className="text-slate-800 font-semibold mt-0.5 text-right" dir="rtl">{scene.audioVoiceoverAr}</p>
                          </div>
                          <div className="pt-1 border-t border-slate-200">
                            <span className="font-bold text-amber-800 uppercase text-[10px] block">📺 On-Screen Graphic Text:</span>
                            <p className="font-mono text-[11px] text-slate-900 font-bold">{scene.onScreenTextEn}</p>
                            <p className="font-mono text-[11px] text-slate-900 font-bold text-right" dir="rtl">{scene.onScreenTextAr}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CAROUSEL STORYBOARD */}
          {activeTab === 'storyboard' && concept.slides && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">5-Slide Carousel Deck Storyboard</h3>
                  <p className="text-xs text-slate-500">Structured swipe deck layout for educational and case study posts</p>
                </div>
                <Badge tone="yellow">{concept.slides.length} Slides</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {concept.slides.map((slide, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/50 shadow-2xs space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-extrabold">
                          SLIDE {slide.slideNo || idx + 1}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {idx === 0 ? 'Cover Hook' : idx === concept.slides.length - 1 ? 'Final CTA' : 'Value Slide'}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">{slide.title}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed mt-1">{slide.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: B-ROLL & PRODUCTION NOTES */}
          {activeTab === 'broll' && (
            <div className="space-y-5">
              {/* B-Roll Shot Checklist */}
              <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-2xs space-y-3">
                <div className="flex items-center gap-2 border-b pb-2">
                  <span className="text-lg">🎥</span>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Camera Crew B-Roll Shot Checklist
                  </h4>
                </div>
                <div className="space-y-2">
                  {concept.brollChecklist?.map((shot, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="text-emerald-600 font-bold shrink-0">✓</span>
                      <span>{shot}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Post-Production & Color Grading Notes */}
              <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-2xs space-y-2">
                <div className="flex items-center gap-2 border-b pb-2">
                  <span className="text-lg">🎨</span>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Post-Production, Color Grade & Export Specs
                  </h4>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {concept.postProductionNotes || 'Export in 9:16 vertical video at 4K 60fps for Reels and 16:9 4K for LinkedIn/YouTube. Maintain true Komatsu yellow (#FFD100) and Dar Al Hay deep navy tones.'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: TONE OF VOICE & AUDIENCE */}
          {activeTab === 'tov' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    🎯 Target Audience Persona
                  </span>
                  <p className="text-xs font-bold text-slate-900">{concept.targetAudience}</p>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    🗣️ Specific Tone of Voice (TOV)
                  </span>
                  <p className="text-xs font-bold text-slate-900">{concept.tov}</p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Brand TOV Checklist for this Piece:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600">✓</span> Authoritative engineering terminology
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600">✓</span> Focus on uptime, heat resilience, and ROI
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600">✓</span> Natural bilingual phrasing for Kuwait market
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600">✓</span> Direct contact CTA with WhatsApp/showroom info
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CAPTIONS & HASHTAGS */}
          {activeTab === 'captions' && (
            <div className="space-y-5">
              {/* English Caption Box */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    🇬🇧 English Post Caption
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(concept.captionEn, 'en')}
                    className="text-xs font-bold text-sky-600 hover:underline flex items-center gap-1"
                  >
                    {copiedSection === 'en' ? '✓ Copied' : '📋 Copy Caption'}
                  </button>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-line font-sans">
                  {concept.captionEn}
                </div>
              </div>

              {/* Arabic Caption Box */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    🇰🇼 Arabic Post Caption (النسخة العربية)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(concept.captionAr, 'ar')}
                    className="text-xs font-bold text-sky-600 hover:underline flex items-center gap-1"
                  >
                    {copiedSection === 'ar' ? '✓ تم النسخ' : '📋 نسخ النص'}
                  </button>
                </div>
                <div
                  className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-line font-sans"
                  dir="rtl"
                >
                  {concept.captionAr}
                </div>
              </div>

              {/* Hashtag Pack */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    # Smart Hashtags Pack
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(concept.hashtags, 'tags')}
                    className="text-xs font-bold text-sky-600 hover:underline flex items-center gap-1"
                  >
                    {copiedSection === 'tags' ? '✓ Copied' : '📋 Copy Hashtags'}
                  </button>
                </div>
                <p className="font-mono text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200/80">
                  {concept.hashtags}
                </p>
              </div>
            </div>
          )}

          {/* TAB 6: LIVE SIMULATOR */}
          {activeTab === 'simulator' && (
            <PlatformPostSimulator concept={concept} />
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close Brief
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleCopy(JSON.stringify(concept, null, 2), 'json')}
            >
              {copiedSection === 'json' ? '✓ Data Copied' : '📋 Copy Full JSON'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
