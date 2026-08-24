'use client';

import React, { useState } from 'react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { FORMAT_TYPES, GOAL_TYPES, PIPELINE_STAGES, MEDIA_PLATFORMS } from '../../lib/mediaContentData';
import PlatformPostSimulator from './PlatformPostSimulator';

export default function MediaBriefDrawer({ concept, onClose, onUpdateStatus, onEdit }) {
  const [activeTab, setActiveTab] = useState('brief'); // 'brief' | 'captions' | 'storyboard' | 'simulator'
  const [copiedSection, setCopiedSection] = useState(null);

  if (!concept) return null;

  const formatMeta = FORMAT_TYPES.find((f) => f.id === concept.format) || FORMAT_TYPES[0];
  const goalMeta = GOAL_TYPES.find((g) => g.id === concept.goal) || GOAL_TYPES[0];
  const stageMeta = PIPELINE_STAGES.find((s) => s.id === concept.status) || PIPELINE_STAGES[0];

  const handleCopy = (text, sectionName) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionName);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Drawer Header */}
        <div className="bg-slate-900 text-white p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xl font-black text-amber-400 shrink-0">
              #{concept.conceptNumber}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${formatMeta.color} border`}>
                  {formatMeta.icon} {formatMeta.label}
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${goalMeta.color} border`}>
                  {goalMeta.label}
                </span>
                <Badge tone={stageMeta.badgeTone}>
                  {stageMeta.icon} {stageMeta.label}
                </Badge>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">{concept.title}</h2>
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
          <button
            type="button"
            onClick={() => setActiveTab('brief')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'brief' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            🎬 Shoot & Production Brief
          </button>

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
            📱 Live Platform Simulator
          </button>
        </div>

        {/* Drawer Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: PRODUCTION BRIEF */}
          {activeTab === 'brief' && (
            <div className="space-y-6">
              {/* Target Platforms Strip */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Channels:</span>
                  <div className="flex gap-1.5">
                    {concept.platforms.map((pid) => {
                      const p = MEDIA_PLATFORMS.find((pl) => pl.id === pid);
                      return (
                        <span key={pid} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 text-xs font-bold shadow-2xs">
                          {p?.icon} {p?.label}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Planned Date:</span>
                  <span className="font-mono text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md">
                    {concept.publishDate || 'August / September'}
                  </span>
                </div>
              </div>

              {/* Hook & Concept Overview */}
              <div className="space-y-3">
                <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                      ⚡ The 3-Second Hook / Opening Line
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(concept.hook, 'hook')}
                      className="text-[11px] font-bold text-amber-700 hover:underline"
                    >
                      {copiedSection === 'hook' ? '✓ Copied' : 'Copy Hook'}
                    </button>
                  </div>
                  <p className="text-sm font-extrabold text-slate-900 italic">
                    "{concept.hook}"
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Concept Summary & Angle</h4>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                    {concept.summary}
                  </p>
                </div>
              </div>

              {/* Visual Direction & Camera Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎥</span>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Visual Direction & Framing</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {concept.visualDirection}
                  </p>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎵</span>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Audio, Voiceover & B-Roll</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {concept.audioBroll}
                  </p>
                </div>
              </div>

              {/* Call To Action */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Call to Action (CTA) Objective</h4>
                <p className="text-xs font-semibold text-slate-900">{concept.ctaText}</p>
              </div>
            </div>
          )}

          {/* TAB 2: CAROUSEL STORYBOARD */}
          {activeTab === 'storyboard' && concept.slides && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">5-Slide Carousel Storyboard</h3>
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

          {/* TAB 3: CAPTIONS & HASHTAGS */}
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

          {/* TAB 4: LIVE SIMULATOR */}
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
              onClick={() => handleCopy(`${concept.title}\n\nHOOK:\n${concept.hook}\n\nCAPTION (EN):\n${concept.captionEn}\n\nCAPTION (AR):\n${concept.captionAr}\n\nHASHTAGS:\n${concept.hashtags}`, 'all')}
            >
              {copiedSection === 'all' ? '✓ Full Brief Copied' : '📋 Copy All Brief Data'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
