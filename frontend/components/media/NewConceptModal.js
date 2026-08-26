'use client';

import React, { useState } from 'react';
import Button from '../ui/Button';
import { FORMAT_TYPES, GOAL_TYPES, PIPELINE_STAGES, MEDIA_PLATFORMS, CONTENT_PILLARS } from '../../lib/mediaMonthlyData';

const DEFAULT_CONCEPT_DATA = {
  title: '',
  week: 'Week 1',
  day: 'Sunday',
  format: 'reel',
  pillar: 'pillar_engineering',
  platforms: ['instagram', 'linkedin', 'facebook'],
  goal: 'product_education',
  status: 'idea',
  publishDate: new Date().toISOString().slice(0, 10),
  targetAudience: 'Contractors, Fleet Owners, Maintenance Engineers in Kuwait',
  tov: 'Authoritative, Precision Engineering, Industrial Strength',
  summary: '',
  hook: {
    spokenEn: '',
    spokenAr: '',
    visualHook: '',
  },
  scenes: [
    {
      sceneNo: 1,
      time: '0:00 - 0:04',
      visual: '4K low-angle shot of machine in action against Kuwait golden hour...',
      talentAction: 'Certified engineer walks up to machine pointing to key feature...',
      audioVoiceoverEn: 'Opening hook statement in English...',
      audioVoiceoverAr: 'العبارة الافتتاحية بالعربية...',
      onScreenTextEn: 'KEY MACHINE SPECIFICATION',
      onScreenTextAr: 'المواصفات الفنية الرئيسية',
      sfxMusic: 'Cinematic sub drop + engine hum',
    },
  ],
  slides: [
    { slideNo: 1, title: 'Cover Slide Hook', body: 'Engaging value proposition...' },
    { slideNo: 2, title: 'The Problem in Kuwait Worksite', body: 'Desert heat and abrasive sand...' },
    { slideNo: 3, title: 'The Komatsu Engineering Solution', body: 'High-ambient cooling & filtration...' },
    { slideNo: 4, title: 'Real-World Fleet Results', body: '98%+ uptime recorded...' },
    { slideNo: 5, title: 'Partner With Dar Al Hay', body: 'Contact our team for fleet quotation...' },
  ],
  brollChecklist: [
    '4K slow motion shot of hydraulic boom movement',
    'Close-up of genuine Komatsu logo badge and clean filter housing',
  ],
  postProductionNotes: 'Grade with warm desert contrast while preserving true Komatsu yellow.',
  captionEn: '',
  captionAr: '',
  hashtags: '#Komatsu #DarAlHay #KuwaitConstruction #HeavyMachinery #KuwaitContractors',
  ctaText: 'Visit our Shuwaikh showroom or contact our heavy equipment specialists today.',
};

function getMergedFormData(initialData) {
  if (!initialData) return { ...DEFAULT_CONCEPT_DATA };
  return {
    ...DEFAULT_CONCEPT_DATA,
    ...initialData,
    format: initialData.format || DEFAULT_CONCEPT_DATA.format,
    pillar: initialData.pillar || DEFAULT_CONCEPT_DATA.pillar,
    status: initialData.status || DEFAULT_CONCEPT_DATA.status,
    week: initialData.week || DEFAULT_CONCEPT_DATA.week,
    day: initialData.day || DEFAULT_CONCEPT_DATA.day,
    platforms: Array.isArray(initialData.platforms) && initialData.platforms.length > 0
      ? initialData.platforms
      : ['instagram', 'linkedin', 'facebook'],
    hook: typeof initialData.hook === 'object' && initialData.hook !== null
      ? { ...DEFAULT_CONCEPT_DATA.hook, ...initialData.hook }
      : { ...DEFAULT_CONCEPT_DATA.hook, spokenEn: typeof initialData.hook === 'string' ? initialData.hook : '' },
    scenes: Array.isArray(initialData.scenes) && initialData.scenes.length > 0
      ? initialData.scenes
      : DEFAULT_CONCEPT_DATA.scenes,
    slides: Array.isArray(initialData.slides) && initialData.slides.length > 0
      ? initialData.slides
      : DEFAULT_CONCEPT_DATA.slides,
    brollChecklist: Array.isArray(initialData.brollChecklist)
      ? initialData.brollChecklist
      : DEFAULT_CONCEPT_DATA.brollChecklist,
  };
}

export default function NewConceptModal({ initialData, onSave, onClose }) {
  const [formData, setFormData] = useState(() => getMergedFormData(initialData));

  const [activeSubTab, setActiveSubTab] = useState('general'); // 'general' | 'hook' | 'scenes' | 'slides' | 'copy'

  const togglePlatform = (pid) => {
    setFormData((prev) => {
      const currentPlatforms = Array.isArray(prev?.platforms) ? prev.platforms : [];
      const exists = currentPlatforms.includes(pid);
      if (exists) {
        return { ...prev, platforms: currentPlatforms.filter((p) => p !== pid) };
      }
      return { ...prev, platforms: [...currentPlatforms, pid] };
    });
  };


  const handleAddScene = () => {
    setFormData((prev) => ({
      ...prev,
      scenes: [
        ...(prev.scenes || []),
        {
          sceneNo: (prev.scenes?.length || 0) + 1,
          time: '0:04 - 0:10',
          visual: '',
          talentAction: '',
          audioVoiceoverEn: '',
          audioVoiceoverAr: '',
          onScreenTextEn: '',
          onScreenTextAr: '',
          sfxMusic: '',
        },
      ],
    }));
  };

  const handleSceneChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...(prev.scenes || [])];
      if (updated[index]) {
        updated[index] = { ...updated[index], [field]: value };
      }
      return { ...prev, scenes: updated };
    });
  };

  const handleDeleteScene = (index) => {
    setFormData((prev) => ({
      ...prev,
      scenes: prev.scenes.filter((_, i) => i !== index),
    }));
  };

  const handleSlideChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...(prev.slides || [])];
      if (updated[index]) {
        updated[index] = { ...updated[index], [field]: value };
      }
      return { ...prev, slides: updated };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <form
        onSubmit={handleSubmit}
        className="relative bg-white rounded-3xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🎬</span>
            <div>
              <h3 className="text-base font-bold">
                {initialData ? 'Edit Master Production Package' : '+ Create Master Production Package'}
              </h3>
              <p className="text-xs text-slate-400">Complete director script, scene breakdown & multi-channel copy</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-2 bg-slate-50 px-5 py-2 border-b border-slate-200 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveSubTab('general')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'general' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            1. Overview & Schedule
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('hook')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'hook' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            2. 3-Second Hook
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('scenes')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'scenes' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            3. Scene-by-Scene Script ({formData.scenes?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('slides')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'slides' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            4. Carousel Storyboard
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('copy')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'copy' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            5. Bilingual Social Copy
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: GENERAL & SCHEDULE */}
          {activeSubTab === 'general' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Content Concept Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Hero Machine – PC500LC Heavy Marine Earthworks"
                  className="ds-input text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Publish Week</label>
                  <select
                    value={formData.week}
                    onChange={(e) => setFormData({ ...formData, week: e.target.value })}
                    className="ds-input text-xs"
                  >
                    <option value="Week 1">Week 1</option>
                    <option value="Week 2">Week 2</option>
                    <option value="Week 3">Week 3</option>
                    <option value="Week 4">Week 4</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Publish Day</label>
                  <select
                    value={formData.day}
                    onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                    className="ds-input text-xs"
                  >
                    <option value="Sunday">Sunday (Prime Launch)</option>
                    <option value="Tuesday">Tuesday (Tech Deep-Dive)</option>
                    <option value="Thursday">Thursday (Weekend Project/BTS)</option>
                    <option value="Monday">Monday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Saturday">Saturday</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Exact Publish Date</label>
                  <input
                    type="date"
                    value={formData.publishDate}
                    onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                    className="ds-input text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Content Format</label>
                  <select
                    value={formData.format}
                    onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                    className="ds-input text-xs"
                  >
                    {FORMAT_TYPES.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.icon} {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Content Pillar</label>
                  <select
                    value={formData.pillar}
                    onChange={(e) => setFormData({ ...formData, pillar: e.target.value })}
                    className="ds-input text-xs"
                  >
                    {CONTENT_PILLARS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Pipeline Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="ds-input text-xs"
                  >
                    {PIPELINE_STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.icon} {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Target Platforms */}
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Target Social Channels</label>
                <div className="flex gap-2">
                  {MEDIA_PLATFORMS.map((p) => {
                    const isSelected = Array.isArray(formData.platforms) && formData.platforms.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => togglePlatform(p.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>


              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Concept Narrative Summary</label>
                <textarea
                  rows={3}
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="Summary of the video concept, machine actions, customer benefit, and storyline..."
                  className="ds-input text-xs"
                />
              </div>
            </div>
          )}

          {/* TAB 2: HOOK */}
          {activeSubTab === 'hook' && (
            <div className="space-y-4">
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900">
                <span className="font-bold">⚡ Hook Rule (0:00 - 0:03):</span> In the first 3 seconds, grab attention with an unexpected machine sound, extreme close-up, and clear value statement.
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Spoken Hook (English)</label>
                <input
                  type="text"
                  value={typeof formData.hook === 'string' ? formData.hook : formData.hook?.spokenEn || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    hook: {
                      ...(typeof formData.hook === 'object' ? formData.hook : {}),
                      spokenEn: e.target.value,
                    },
                  })}
                  placeholder="e.g. When Kuwait reaches 52°C, these machines don’t stop. Here is why..."
                  className="ds-input text-xs font-semibold"
                />
              </div>

              <div dir="rtl">
                <label className="text-xs font-bold text-slate-700 mb-1 block text-right">النص الصوتي للثواني الأولى (عربي)</label>
                <input
                  type="text"
                  value={typeof formData.hook === 'object' ? formData.hook?.spokenAr || '' : ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    hook: {
                      ...(typeof formData.hook === 'object' ? formData.hook : {}),
                      spokenAr: e.target.value,
                    },
                  })}
                  placeholder="مثال: عندما تتجاوز حرارة الكويت 50 درجة مئوية.. كيف تواصل هذه الآليات العمل دون توقف؟"
                  className="ds-input text-xs font-semibold text-right"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Visual Action Grabber (Camera movement)</label>
                <input
                  type="text"
                  value={typeof formData.hook === 'object' ? formData.hook?.visualHook || '' : ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    hook: {
                      ...(typeof formData.hook === 'object' ? formData.hook : {}),
                      visualHook: e.target.value,
                    },
                  })}
                  placeholder="e.g. Fast crash zoom into bucket cutting through rock with dust explosion..."
                  className="ds-input text-xs"
                />
              </div>
            </div>
          )}

          {/* TAB 3: SCENES */}
          {activeSubTab === 'scenes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Director's Scene-by-Scene Shot List</h4>
                  <p className="text-[11px] text-slate-500">Provide exact camera directions, spoken dialogue, and on-screen text</p>
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={handleAddScene} className="text-xs">
                  + Add Scene
                </Button>
              </div>

              <div className="space-y-4">
                {formData.scenes?.map((scene, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                    <div className="flex items-center justify-between border-b pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={scene.time}
                          onChange={(e) => handleSceneChange(idx, 'time', e.target.value)}
                          placeholder="e.g. 0:00 - 0:04"
                          className="font-mono text-xs font-bold bg-white border border-slate-300 rounded px-2 py-0.5 w-28"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteScene(idx)}
                        className="text-xs text-red-600 hover:underline font-bold"
                      >
                        Delete Scene
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="font-bold text-slate-700 block text-[10px] uppercase mb-0.5">Camera Framing & Action</label>
                        <textarea
                          rows={2}
                          value={scene.visual}
                          onChange={(e) => handleSceneChange(idx, 'visual', e.target.value)}
                          placeholder="Camera angle, lens, drone flyby, movement..."
                          className="ds-input text-xs"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block text-[10px] uppercase mb-0.5">Talent / Machine Action</label>
                        <textarea
                          rows={2}
                          value={scene.talentAction}
                          onChange={(e) => handleSceneChange(idx, 'talentAction', e.target.value)}
                          placeholder="What the engineer/mechanic/operator does..."
                          className="ds-input text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="font-bold text-sky-800 block text-[10px] uppercase mb-0.5">Voiceover Script (EN)</label>
                        <textarea
                          rows={2}
                          value={scene.audioVoiceoverEn}
                          onChange={(e) => handleSceneChange(idx, 'audioVoiceoverEn', e.target.value)}
                          placeholder="English spoken words..."
                          className="ds-input text-xs"
                        />
                      </div>

                      <div dir="rtl">
                        <label className="font-bold text-sky-800 block text-[10px] uppercase mb-0.5 text-right">النص الصوتي (عربي)</label>
                        <textarea
                          rows={2}
                          value={scene.audioVoiceoverAr}
                          onChange={(e) => handleSceneChange(idx, 'audioVoiceoverAr', e.target.value)}
                          placeholder="النص المنطوق بالعربية..."
                          className="ds-input text-xs text-right"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="font-bold text-amber-800 block text-[10px] uppercase mb-0.5">On-Screen Graphic (EN/AR)</label>
                        <input
                          type="text"
                          value={scene.onScreenTextEn}
                          onChange={(e) => handleSceneChange(idx, 'onScreenTextEn', e.target.value)}
                          placeholder="Text callout overlay..."
                          className="ds-input text-xs"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block text-[10px] uppercase mb-0.5">Audio / SFX Foley</label>
                        <input
                          type="text"
                          value={scene.sfxMusic}
                          onChange={(e) => handleSceneChange(idx, 'sfxMusic', e.target.value)}
                          placeholder="Engine rev, air hose, heavy beat..."
                          className="ds-input text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SLIDES */}
          {activeSubTab === 'slides' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">5-Slide Carousel Storyboard Deck</h4>
                  <p className="text-[11px] text-slate-500">Edit slide cards for LinkedIn and Instagram swipe decks</p>
                </div>
              </div>

              <div className="space-y-3">
                {formData.slides?.map((slide, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">Slide {slide.slideNo || idx + 1}</span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {idx === 0 ? 'Cover Hook' : idx === formData.slides.length - 1 ? 'Final CTA' : 'Value Spec'}
                      </span>
                    </div>

                    <input
                      type="text"
                      value={slide.title}
                      onChange={(e) => handleSlideChange(idx, 'title', e.target.value)}
                      placeholder="Slide Headline..."
                      className="ds-input text-xs font-bold"
                    />

                    <textarea
                      rows={2}
                      value={slide.body}
                      onChange={(e) => handleSlideChange(idx, 'body', e.target.value)}
                      placeholder="Slide bullet points or body copy..."
                      className="ds-input text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: COPY */}
          {activeSubTab === 'copy' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">🇬🇧 Full English Social Caption</label>
                <textarea
                  rows={4}
                  value={formData.captionEn}
                  onChange={(e) => setFormData({ ...formData, captionEn: e.target.value })}
                  placeholder="Full English caption with line breaks..."
                  className="ds-input text-xs font-sans"
                />
              </div>

              <div dir="rtl">
                <label className="text-xs font-bold text-slate-700 mb-1 block text-right">🇰🇼 النص العربي الكامل للمنشور</label>
                <textarea
                  rows={4}
                  value={formData.captionAr}
                  onChange={(e) => setFormData({ ...formData, captionAr: e.target.value })}
                  placeholder="النص الكامل باللغة العربية مع الفقرات..."
                  className="ds-input text-xs font-sans text-right"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block"># Hashtags Pack</label>
                <input
                  type="text"
                  value={formData.hashtags}
                  onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })}
                  placeholder="#Komatsu #DarAlHay #KuwaitConstruction"
                  className="ds-input text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Target Call To Action (CTA)</label>
                <input
                  type="text"
                  value={formData.ctaText}
                  onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                  placeholder="e.g. Visit our showroom or WhatsApp our sales desk..."
                  className="ds-input text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>

          <Button type="submit" variant="primary" className="!bg-amber-500 hover:!bg-amber-400 !text-slate-950 !font-bold">
            {initialData ? 'Save Package Updates' : 'Create Concept Package'}
          </Button>
        </div>
      </form>
    </div>
  );
}
