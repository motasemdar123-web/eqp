'use client';

import React, { useState, useEffect } from 'react';
import Card from '../../ui/Card';
import Badge from '../../ui/Badge';
import Button from '../../ui/Button';
import { FORMAT_TYPES, CONTENT_PILLARS, MEDIA_PLATFORMS } from '../../../lib/mediaMonthlyData';

export default function Step3DirectorScriptStudio({
  campaign,
  selectedConceptId,
  onSelectConcept,
  onSaveConceptScript,
  onPrevStep,
  onNextStep,
  onJumpToCallSheet,
}) {
  const concepts = campaign.concepts || [];
  const currentConcept = concepts.find((c) => c.id === selectedConceptId) || concepts[0] || null;

  const [scriptData, setScriptData] = useState(currentConcept || {});
  const [activeTab, setActiveTab] = useState('scenes'); // 'scenes' | 'hook' | 'broll' | 'carousel'

  useEffect(() => {
    if (currentConcept) {
      setScriptData(currentConcept);
    }
  }, [currentConcept?.id]);

  if (!currentConcept) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-xs text-slate-500">No content concepts found in this campaign.</p>
      </div>
    );
  }

  const formatMeta = FORMAT_TYPES.find((f) => f.id === scriptData.format) || FORMAT_TYPES[0];
  const pillarMeta = CONTENT_PILLARS.find((p) => p.id === scriptData.pillar) || CONTENT_PILLARS[0];

  const handleFieldChange = (field, value) => {
    const updated = { ...scriptData, [field]: value };
    setScriptData(updated);
    onSaveConceptScript(updated);
  };

  const handleHookChange = (field, value) => {
    const currentHook = typeof scriptData.hook === 'object' ? scriptData.hook : { spokenEn: scriptData.hook || '', spokenAr: '', visualHook: '' };
    const updatedHook = { ...currentHook, [field]: value };
    handleFieldChange('hook', updatedHook);
  };

  const handleAddScene = () => {
    const currentScenes = scriptData.scenes || [];
    const newScene = {
      sceneNo: currentScenes.length + 1,
      time: '0:04 - 0:10',
      visual: '',
      talentAction: '',
      audioVoiceoverEn: '',
      audioVoiceoverAr: '',
      onScreenTextEn: '',
      onScreenTextAr: '',
      sfxMusic: '',
    };
    handleFieldChange('scenes', [...currentScenes, newScene]);
  };

  const handleSceneChange = (index, field, value) => {
    const updatedScenes = [...(scriptData.scenes || [])];
    if (updatedScenes[index]) {
      updatedScenes[index] = { ...updatedScenes[index], [field]: value };
    }
    handleFieldChange('scenes', updatedScenes);
  };

  const handleDeleteScene = (index) => {
    const updatedScenes = (scriptData.scenes || []).filter((_, i) => i !== index);
    handleFieldChange('scenes', updatedScenes);
  };

  const handleAddBrollItem = (itemText) => {
    if (!itemText?.trim()) return;
    const currentList = scriptData.brollChecklist || [];
    handleFieldChange('brollChecklist', [...currentList, itemText.trim()]);
  };

  const handleDeleteBrollItem = (index) => {
    const updated = (scriptData.brollChecklist || []).filter((_, i) => i !== index);
    handleFieldChange('brollChecklist', updated);
  };

  const handleSlideChange = (index, field, value) => {
    const updatedSlides = [...(scriptData.slides || [])];
    if (updatedSlides[index]) {
      updatedSlides[index] = { ...updatedSlides[index], [field]: value };
    }
    handleFieldChange('slides', updatedSlides);
  };

  return (
    <div className="space-y-6 animate-[ds-toast-in_180ms_ease]">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
            Step 3 of 5
          </span>
          <h2 className="text-xl font-black text-slate-900 mt-1">Director's Script & Scene Studio</h2>
          <p className="text-xs text-slate-500">
            Script the 3-second hook, timecoded shot breakdown, and B-roll checklist for your videographer.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onJumpToCallSheet}
            className="text-xs font-bold !bg-white"
          >
            📄 Jump to Call Sheet →
          </Button>
        </div>
      </div>

      {/* Main Studio 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar: Concept Selector */}
        <div className="lg:col-span-4 space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs max-h-[750px] overflow-y-auto">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Posts in {campaign.monthName}</span>
            <Badge tone="neutral">{concepts.length}</Badge>
          </div>

          <div className="space-y-2">
            {concepts.map((c) => {
              const isSelected = c.id === scriptData.id;
              const fMeta = FORMAT_TYPES.find((f) => f.id === c.format) || FORMAT_TYPES[0];
              const isScripted = (c.scenes?.length || 0) > 0 || (c.slides?.length || 0) > 0;

              return (
                <div
                  key={c.id}
                  onClick={() => onSelectConcept(c.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold opacity-80">{c.week} • {c.day}</span>
                    <span className={`px-1.5 py-0.2 rounded font-bold ${isSelected ? 'bg-slate-800 text-amber-300' : fMeta.color}`}>
                      {fMeta.label}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold leading-snug line-clamp-1">{c.title}</h4>
                  <div className="flex items-center justify-between text-[10px] pt-1 opacity-75">
                    <span>#{c.conceptNumber}</span>
                    <span>{isScripted ? '✓ Scripted' : 'Pending'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Main Stage: The Director's Scripting Form */}
        <div className="lg:col-span-8 space-y-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          {/* Post Header Meta */}
          <div className="border-b border-slate-200 pb-4 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                #{scriptData.conceptNumber}
              </span>
              <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${formatMeta.color} border`}>
                {formatMeta.icon} {formatMeta.label}
              </span>
              <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${pillarMeta.color} border`}>
                {pillarMeta.label}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                📅 {scriptData.publishDate} ({scriptData.day})
              </span>
            </div>

            <input
              type="text"
              value={scriptData.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              className="ds-input text-base font-black text-slate-900 mt-1"
              placeholder="Content Concept Title..."
            />
          </div>

          {/* Form Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('scenes')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'scenes' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              🎬 Scene-by-Scene Shot List ({scriptData.scenes?.length || 0})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('hook')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'hook' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              ⚡ The 3-Second Hook
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('broll')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'broll' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              🎥 Videographer B-Roll Checklist ({scriptData.brollChecklist?.length || 0})
            </button>

            {scriptData.format === 'carousel' && (
              <button
                type="button"
                onClick={() => setActiveTab('carousel')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'carousel' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                📑 Carousel Storyboard ({scriptData.slides?.length || 0} Slides)
              </button>
            )}
          </div>

          {/* TAB 1: SCENE-BY-SCENE SCRIPT */}
          {activeTab === 'scenes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Scene-by-Scene Shot & Voiceover Script</h4>
                  <p className="text-[11px] text-slate-500">Provide direct instructions for the camera operator and talent</p>
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={handleAddScene} className="text-xs !bg-slate-100">
                  + Add Scene
                </Button>
              </div>

              <div className="space-y-4">
                {(scriptData.scenes || []).map((scene, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                    <div className="flex items-center justify-between border-b pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={scene.time}
                          onChange={(e) => handleSceneChange(idx, 'time', e.target.value)}
                          placeholder="0:00 - 0:04"
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
                        <label className="font-bold text-slate-700 block text-[10px] uppercase mb-0.5">🎥 Camera Framing & Shot Type</label>
                        <textarea
                          rows={2}
                          value={scene.visual}
                          onChange={(e) => handleSceneChange(idx, 'visual', e.target.value)}
                          placeholder="e.g. 16mm ultra-wide low angle, drone flyby, macro close-up..."
                          className="ds-input text-xs"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block text-[10px] uppercase mb-0.5">👷 Talent / Machine Action</label>
                        <textarea
                          rows={2}
                          value={scene.talentAction}
                          onChange={(e) => handleSceneChange(idx, 'talentAction', e.target.value)}
                          placeholder="e.g. Engineer walks up to machine pointing to radiator fan..."
                          className="ds-input text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="font-bold text-sky-800 block text-[10px] uppercase mb-0.5">🎙️ Voiceover Dialogue (English)</label>
                        <textarea
                          rows={2}
                          value={scene.audioVoiceoverEn}
                          onChange={(e) => handleSceneChange(idx, 'audioVoiceoverEn', e.target.value)}
                          placeholder="Spoken words in English..."
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
                        <label className="font-bold text-amber-800 block text-[10px] uppercase mb-0.5">📺 On-Screen Typography (Lower Third)</label>
                        <input
                          type="text"
                          value={scene.onScreenTextEn}
                          onChange={(e) => handleSceneChange(idx, 'onScreenTextEn', e.target.value)}
                          placeholder="e.g. HIGH-AMBIENT DESERT COOLING RADIATOR"
                          className="ds-input text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block text-[10px] uppercase mb-0.5">🎵 Audio & SFX Foley</label>
                        <input
                          type="text"
                          value={scene.sfxMusic}
                          onChange={(e) => handleSceneChange(idx, 'sfxMusic', e.target.value)}
                          placeholder="e.g. Deep engine rev + air purge sound effect"
                          className="ds-input text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: HOOK */}
          {activeTab === 'hook' && (
            <div className="space-y-4">
              <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 text-xs text-amber-900">
                <span className="font-bold">⚡ Hook Formula (0:00 - 0:03):</span> Grab attention in the first 3 seconds with an intense machine visual, unexpected sound, and clear promise.
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Spoken Hook (English)</label>
                <input
                  type="text"
                  value={typeof scriptData.hook === 'string' ? scriptData.hook : scriptData.hook?.spokenEn || ''}
                  onChange={(e) => handleHookChange('spokenEn', e.target.value)}
                  placeholder="e.g. When Kuwait reaches 52°C, these machines don’t stop. Here is why..."
                  className="ds-input text-xs font-bold"
                />
              </div>

              <div dir="rtl">
                <label className="text-xs font-bold text-slate-700 mb-1 block text-right">النص الصوتي للثواني الأولى (عربي)</label>
                <input
                  type="text"
                  value={typeof scriptData.hook === 'object' ? scriptData.hook?.spokenAr || '' : ''}
                  onChange={(e) => handleHookChange('spokenAr', e.target.value)}
                  placeholder="مثال: عندما تتجاوز حرارة الكويت 50 درجة مئوية.. كيف تواصل هذه الآليات العمل دون توقف؟"
                  className="ds-input text-xs font-bold text-right"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Visual Action Grabber (Camera movement)</label>
                <input
                  type="text"
                  value={typeof scriptData.hook === 'object' ? scriptData.hook?.visualHook || '' : ''}
                  onChange={(e) => handleHookChange('visualHook', e.target.value)}
                  placeholder="e.g. Fast crash zoom into bucket cutting through rock with dust explosion..."
                  className="ds-input text-xs"
                />
              </div>
            </div>
          )}

          {/* TAB 3: B-ROLL CHECKLIST */}
          {activeTab === 'broll' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Videographer B-Roll Shot Checklist</h4>
                <p className="text-[11px] text-slate-500">Specific mandatory cutaways and close-ups the camera crew must film</p>
              </div>

              <div className="space-y-2">
                {(scriptData.brollChecklist || []).map((shot, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <span className="font-semibold text-slate-800">📸 {shot}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteBrollItem(idx)}
                      className="text-xs text-red-600 hover:underline font-bold ml-2"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>

              {/* Add B-Roll input */}
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  id="newBrollInput"
                  placeholder="e.g. Macro close-up of hydraulic hoses flexing under 350 bar..."
                  className="ds-input text-xs flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddBrollItem(e.target.value);
                      e.target.value = '';
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const input = document.getElementById('newBrollInput');
                    handleAddBrollItem(input.value);
                    input.value = '';
                  }}
                  className="text-xs"
                >
                  + Add B-Roll Shot
                </Button>
              </div>
            </div>
          )}

          {/* TAB 4: CAROUSEL STORYBOARD */}
          {activeTab === 'carousel' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-900">5-Slide Carousel Deck Storyboard</h4>
                <p className="text-[11px] text-slate-500">Draft card-by-card text for LinkedIn and Instagram swipe decks</p>
              </div>

              <div className="space-y-3">
                {(scriptData.slides || []).map((slide, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">Slide {slide.slideNo || idx + 1}</span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {idx === 0 ? 'Cover Hook' : idx === (scriptData.slides?.length || 5) - 1 ? 'Final CTA' : 'Value Spec'}
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
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <Button type="button" variant="secondary" onClick={onPrevStep} className="text-xs">
          ← Back to 4-Week Plan
        </Button>

        <Button
          type="button"
          variant="primary"
          onClick={onNextStep}
          className="!bg-slate-900 hover:!bg-slate-800 !text-white !font-bold text-xs shadow-sm"
        >
          Next: Multi-Platform Copy (Step 4) →
        </Button>
      </div>
    </div>
  );
}
