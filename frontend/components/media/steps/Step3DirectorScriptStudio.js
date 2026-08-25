'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Card from '../../ui/Card';
import Badge from '../../ui/Badge';
import Button from '../../ui/Button';
import { FORMAT_TYPES, CONTENT_PILLARS, MEDIA_PLATFORMS, PIPELINE_STAGES } from '../../../lib/mediaMonthlyData';

export default function Step3DirectorScriptStudio({
  campaign,
  selectedConceptId,
  onSelectConcept,
  onSaveConceptScript,
  onDeleteConcept,
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

  // Overall scripting progress calculation
  const scriptingProgress = useMemo(() => {
    const total = concepts.length || 1;
    const scripted = concepts.filter((c) => (c.scenes?.length || 0) > 0 || (c.slides?.length || 0) > 0).length;
    const pct = Math.round((scripted / total) * 100);
    return { total, scripted, pct };
  }, [concepts]);

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
      time: `0:${String((currentScenes.length) * 5).padStart(2, '0')} - 0:${String((currentScenes.length + 1) * 5).padStart(2, '0')}`,
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Director&apos;s Script & Scene Studio</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Script the 3-second hook, timecoded shot breakdown, and B-roll checklist for your videographer.
          </p>
        </div>


        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onJumpToCallSheet}
            className="text-xs font-semibold !bg-white hover:!bg-slate-50 border border-slate-200"
          >
            Jump to Call Sheet →
          </Button>
        </div>
      </div>

      {/* Main Studio 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar: Concept Selector + Script Progress Ring */}
        <div className="lg:col-span-4 space-y-4">
          {/* Progress Card */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3.5">
            <svg width="44" height="44" viewBox="0 0 48 48" className="shrink-0">
              <circle cx="24" cy="24" r="20" fill="none" stroke="#f1f5f9" strokeWidth="4" />
              <circle
                cx="24" cy="24" r="20"
                fill="none" stroke="#f59e0b" strokeWidth="4"
                strokeDasharray={`${(scriptingProgress.pct / 100) * 125.6} 125.6`}
                strokeDashoffset="0"
                strokeLinecap="round"
                transform="rotate(-90 24 24)"
              />
              <text x="24" y="28" textAnchor="middle" className="fill-slate-900 text-xs font-bold">{scriptingProgress.pct}%</text>
            </svg>
            <div>
              <p className="text-xs font-bold text-slate-900">Scripting Progress</p>
              <p className="text-[11px] text-slate-500">{scriptingProgress.scripted} of {scriptingProgress.total} posts scripted</p>
            </div>
          </div>

          {/* Concepts List */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs max-h-[620px] overflow-y-auto space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Posts in {campaign.monthName}</span>
              <Badge tone="neutral">{concepts.length}</Badge>
            </div>

            <div className="space-y-1.5">
              {concepts.map((c) => {
                const isSelected = c.id === scriptData.id;
                const fMeta = FORMAT_TYPES.find((f) => f.id === c.format) || FORMAT_TYPES[0];
                const isScripted = (c.scenes?.length || 0) > 0 || (c.slides?.length || 0) > 0;

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
                      <span className="font-semibold opacity-80">{c.week} • {c.day}</span>
                      <div className="flex items-center gap-1.5">
                        {isScripted && (
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSelected ? 'bg-emerald-400' : 'bg-emerald-500'}`} />
                        )}
                        <span className={`px-1.5 py-0.5 rounded font-semibold text-[10px] whitespace-nowrap ${isSelected ? 'bg-slate-800 text-amber-300' : fMeta.color}`}>
                          {fMeta.shortLabel || fMeta.label}
                        </span>
                      </div>
                    </div>
                    <h4 className="text-xs font-bold leading-snug line-clamp-1">{c.title}</h4>
                    <div className="flex items-center justify-between text-[10px] pt-0.5 opacity-75">
                      <span className="font-mono">#{c.conceptNumber}</span>
                      <span>{isScripted ? `${c.scenes?.length || c.slides?.length} scenes` : 'Pending'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
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
              <button
                type="button"
                onClick={() => {
                  if (onDeleteConcept) onDeleteConcept(scriptData.id);
                }}
                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 font-bold px-2.5 py-1 rounded-lg ml-auto transition-colors border border-red-200"
              >
                🗑️ Delete Post
              </button>
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
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('scenes')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 border ${
                activeTab === 'scenes'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                  : 'text-slate-600 bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <span>🎬</span>
              <span>Scene-by-Scene Shot List ({scriptData.scenes?.length || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('hook')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 border ${
                activeTab === 'hook'
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md font-extrabold'
                  : 'text-slate-600 bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <span>⚡</span>
              <span>The 3-Second Hook</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('broll')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 border ${
                activeTab === 'broll'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                  : 'text-slate-600 bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <span>🎥</span>
              <span>B-Roll Checklist ({scriptData.brollChecklist?.length || 0})</span>
            </button>

            {scriptData.format === 'carousel' && (
              <button
                type="button"
                onClick={() => setActiveTab('carousel')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 border ${
                  activeTab === 'carousel'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                    : 'text-slate-600 bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <span>📑</span>
                <span>Carousel Storyboard ({scriptData.slides?.length || 0} Slides)</span>
              </button>
            )}
          </div>

          {/* TAB 1: SCENE-BY-SCENE SCRIPT */}
          {activeTab === 'scenes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Scene-by-Scene Shot & Voiceover Script</h4>
                  <p className="text-[11px] text-slate-500">Provide direct camera framing, talent cues, and bilingual dialogue for the videographer</p>
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={handleAddScene} className="text-xs !bg-slate-100 font-bold">
                  + Add Scene
                </Button>
              </div>

              <div className="space-y-4">
                {(scriptData.scenes || []).map((scene, idx) => {
                  const borderColors = ['border-l-sky-500', 'border-l-indigo-500', 'border-l-amber-500', 'border-l-emerald-500', 'border-l-purple-500'];
                  const borderClass = borderColors[idx % borderColors.length];

                  return (
                    <div key={idx} className={`p-4 rounded-xl border border-slate-200 ${borderClass} border-l-4 bg-slate-50/70 space-y-3 shadow-xs`}>
                      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-700">Scene {idx + 1}</span>
                          <input
                            type="text"
                            value={scene.time}
                            onChange={(e) => handleSceneChange(idx, 'time', e.target.value)}
                            placeholder="0:00 - 0:04"
                            className="font-mono text-xs font-bold bg-white border border-slate-300 rounded px-2 py-0.5 w-28 text-center"
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
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: HOOK */}
          {activeTab === 'hook' && (
            <div className="space-y-4">
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <span className="font-extrabold uppercase tracking-wider block">⚡ The 0–3s Director Hook Formula:</span>
                <p className="leading-relaxed text-amber-800">
                  In heavy machinery B2B media, viewers decide in under 3 seconds. Combine a powerful visual shock (e.g. bucket hitting rock at high speed), an intense mechanical sound, and a provocative spoken statement.
                </p>
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
                <p className="text-[11px] text-slate-500">Specific mandatory cutaways and close-ups the camera crew must film on location</p>
              </div>

              <div className="space-y-2">
                {(scriptData.brollChecklist || []).map((shot, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <span className="font-semibold text-slate-800 flex items-center gap-2">
                      <span className="text-amber-500">🎥</span> {shot}
                    </span>
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
                  className="text-xs font-bold"
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
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">Slide {slide.slideNo || idx + 1}</span>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
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
