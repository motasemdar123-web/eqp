'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Card from '../../ui/Card';
import Badge from '../../ui/Badge';
import Button from '../../ui/Button';
import { FORMAT_TYPES, CONTENT_PILLARS, MEDIA_PLATFORMS, PIPELINE_STAGES } from '../../../lib/mediaMonthlyData';

// Default smart shot templates for photography posts
const DEFAULT_PHOTO_SHOTS = [
  {
    id: 1,
    title: '3/4 Low-Angle Front Hero',
    framing: 'Camera 30–40cm off ground, 24mm wide angle, looking up at boom and blade to convey massive power and scale.',
    lighting: 'Golden hour low sun (4:30–5:30 PM), backlit sand dust flare, circular polarizer filter to kill window glare.',
    aspectRatio: '4:5 Portrait (IG & LinkedIn)',
    staging: 'Machine washed, blade tilted at 30°, amber roof hazard beacons illuminated, clean jobsite background.',
  },
  {
    id: 2,
    title: 'Side Elevation Full Profile',
    framing: '50mm eye-level profile capturing the complete machine balance, track ground pressure, and boom geometry.',
    lighting: 'Even directional side-light, crisp desert sunlight.',
    aspectRatio: '16:9 Landscape (Web & Banner)',
    staging: 'Active working posture, bucket curled cutting into gravel trench.',
  },
  {
    id: 3,
    title: 'Macro Engineering Close-Up',
    framing: '85mm macro shot focusing on chrome hydraulic cylinder rod and genuine Komatsu logo badge.',
    lighting: 'Subtle metallic reflections, high contrast highlights.',
    aspectRatio: '1:1 Square (Detail Carousel)',
    staging: 'Gleaming polished chrome with zero oil smudges.',
  },
];

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
  const [activeTab, setActiveTab] = useState('main'); // dynamic tab based on format

  // Sync state when selected concept changes
  useEffect(() => {
    if (currentConcept) {
      setScriptData(currentConcept);
      // Automatically pick the primary tab for this content format
      if (currentConcept.format === 'photography') {
        setActiveTab('photoShots');
      } else if (currentConcept.format === 'carousel') {
        setActiveTab('carousel');
      } else if (currentConcept.format === 'designed_post') {
        setActiveTab('infographic');
      } else if (currentConcept.format === 'cta_post') {
        setActiveTab('offer');
      } else {
        setActiveTab('scenes');
      }
    }
  }, [currentConcept?.id, currentConcept?.format]);

  // Overall scripting / planning progress calculation across all formats
  const scriptingProgress = useMemo(() => {
    const total = concepts.length || 1;
    const scripted = concepts.filter((c) => {
      if (c.format === 'photography') {
        return (c.photoShots?.length || 0) > 0 || (c.brollChecklist?.length || 0) > 0 || (c.scenes?.length || 0) > 0;
      }
      if (c.format === 'carousel') {
        return (c.slides?.length || 0) > 0;
      }
      if (c.format === 'designed_post') {
        return (c.dataCallouts?.length || 0) > 0 || (c.summary?.length || 0) > 0;
      }
      if (c.format === 'cta_post') {
        return (c.offerDetails?.headline?.length || 0) > 0 || (c.summary?.length || 0) > 0;
      }
      // default video/reel
      return (c.scenes?.length || 0) > 0;
    }).length;
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

  // --- PHOTOGRAPHY HANDLERS ---
  const handleAddPhotoShot = () => {
    const currentShots = scriptData.photoShots || (scriptData.scenes?.length > 0 ? scriptData.scenes.map((s, i) => ({
      id: i + 1,
      title: s.visual ? `Shot ${i + 1}: ${s.visual.slice(0, 30)}` : `Angle #${i + 1}`,
      framing: s.visual || '',
      lighting: 'Natural golden hour desert sunlight',
      aspectRatio: '4:5 Portrait',
      staging: s.talentAction || '',
    })) : DEFAULT_PHOTO_SHOTS);

    const newShot = {
      id: currentShots.length + 1,
      title: `Shot ${currentShots.length + 1}: Framing Angle`,
      framing: 'Camera position, focal length, and distance...',
      lighting: 'Golden hour sunset with polarizer filter',
      aspectRatio: '4:5 Portrait (IG & LinkedIn)',
      staging: 'Machine clean, beacon lights ON',
    };
    handleFieldChange('photoShots', [...currentShots, newShot]);
  };

  const handlePhotoShotChange = (index, field, value) => {
    const currentShots = scriptData.photoShots || DEFAULT_PHOTO_SHOTS;
    const updated = [...currentShots];
    if (updated[index]) {
      updated[index] = { ...updated[index], [field]: value };
    }
    handleFieldChange('photoShots', updated);
  };

  const handleDeletePhotoShot = (index) => {
    const currentShots = scriptData.photoShots || DEFAULT_PHOTO_SHOTS;
    const updated = currentShots.filter((_, i) => i !== index);
    handleFieldChange('photoShots', updated);
  };

  // --- VIDEO SCENE HANDLERS ---
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

  // --- B-ROLL / CHECKLIST HANDLERS ---
  const handleAddBrollItem = (itemText) => {
    if (!itemText?.trim()) return;
    const currentList = scriptData.brollChecklist || [];
    handleFieldChange('brollChecklist', [...currentList, itemText.trim()]);
  };

  const handleDeleteBrollItem = (index) => {
    const updated = (scriptData.brollChecklist || []).filter((_, i) => i !== index);
    handleFieldChange('brollChecklist', updated);
  };

  // --- CAROUSEL SLIDE HANDLERS ---
  const handleSlideChange = (index, field, value) => {
    const updatedSlides = [...(scriptData.slides || [])];
    if (updatedSlides[index]) {
      updatedSlides[index] = { ...updatedSlides[index], [field]: value };
    }
    handleFieldChange('slides', updatedSlides);
  };

  const handleAddSlide = () => {
    const currentSlides = scriptData.slides || [];
    const newSlide = {
      slideNo: currentSlides.length + 1,
      title: `Slide ${currentSlides.length + 1} Headline`,
      body: 'Key technical point or bullet proof...',
    };
    handleFieldChange('slides', [...currentSlides, newSlide]);
  };

  const handleDeleteSlide = (index) => {
    const currentSlides = scriptData.slides || [];
    handleFieldChange('slides', currentSlides.filter((_, i) => i !== index));
  };

  // Effective photo shots list with fallback
  const activePhotoShots = scriptData.photoShots || (scriptData.format === 'photography' ? DEFAULT_PHOTO_SHOTS : []);

  // Dynamic Studio Title & Description based on format
  const studioHeaderInfo = useMemo(() => {
    switch (scriptData.format) {
      case 'photography':
        return {
          title: '📸 Photo Director & Shot List Studio',
          desc: 'Plan composition angles, lighting directives, machine staging, and on-site photo checklist for your photographer.',
          pill: 'Hero Photography Blueprint',
        };
      case 'carousel':
        return {
          title: '📑 Carousel Storyboard & Deck Studio',
          desc: 'Architect the slide-by-slide visual layout, headlines, technical specifications, and swipe hook.',
          pill: 'Multi-Slide Deck Blueprint',
        };
      case 'designed_post':
        return {
          title: '📐 Technical Infographic & Data Blueprint',
          desc: 'Plan key technical metrics, callout points, and visual blueprint for your graphic designer.',
          pill: 'Graphic & Infographic Blueprint',
        };
      case 'cta_post':
        return {
          title: '🎯 Conversion & Offer Creative Studio',
          desc: 'Structure the core value proposition, proof points, and visual call-to-action.',
          pill: 'Inquiry & Offer Blueprint',
        };
      case 'reel':
      default:
        return {
          title: "🎬 Director's Script & Scene Studio",
          desc: 'Script the 3-second hook, timecoded shot breakdown, and B-roll checklist for your videographer.',
          pill: 'Video & Motion Blueprint',
        };
    }
  }, [scriptData.format]);

  return (
    <div className="space-y-6 animate-[ds-toast-in_180ms_ease]">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">{studioHeaderInfo.title}</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
              {studioHeaderInfo.pill}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {studioHeaderInfo.desc}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onJumpToCallSheet}
            className="text-xs font-semibold !bg-white hover:!bg-slate-50 border border-slate-200 cursor-pointer"
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
              <p className="text-xs font-bold text-slate-900">Creative Planning Progress</p>
              <p className="text-[11px] text-slate-500">{scriptingProgress.scripted} of {scriptingProgress.total} posts planned</p>
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
                
                // Dynamic post status description
                let statusDesc = 'Pending Plan';
                let isPlanned = false;
                if (c.format === 'photography') {
                  const shotCount = c.photoShots?.length || (c.brollChecklist?.length > 0 ? c.brollChecklist.length : 3);
                  statusDesc = `${shotCount} photo angles`;
                  isPlanned = true;
                } else if (c.format === 'carousel') {
                  const slideCount = c.slides?.length || 5;
                  statusDesc = `${slideCount} slides deck`;
                  isPlanned = (c.slides?.length || 0) > 0;
                } else if (c.format === 'designed_post') {
                  statusDesc = 'Infographic specs';
                  isPlanned = Boolean(c.summary || c.dataCallouts?.length);
                } else if (c.format === 'cta_post') {
                  statusDesc = 'Offer structure';
                  isPlanned = Boolean(c.summary || c.offerDetails);
                } else {
                  const sceneCount = c.scenes?.length || 0;
                  statusDesc = sceneCount > 0 ? `${sceneCount} video scenes` : 'Pending Script';
                  isPlanned = sceneCount > 0;
                }

                return (
                  <div
                    key={c.id}
                    onClick={() => onSelectConcept(c.id)}
                    className={`p-2.5 rounded-lg border transition-all cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className={`font-semibold ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>
                        {c.week} • {c.day}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {isPlanned && (
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSelected ? 'bg-emerald-400' : 'bg-emerald-500'}`} />
                        )}
                        <span className={`px-1.5 py-0.5 rounded font-semibold text-[10px] whitespace-nowrap ${isSelected ? 'bg-slate-800 text-amber-300' : fMeta.color}`}>
                          {fMeta.shortLabel || fMeta.label}
                        </span>
                      </div>
                    </div>

                    <h4 className={`text-xs font-bold leading-snug line-clamp-1 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      {c.title || 'Untitled Post'}
                    </h4>

                    <div className={`flex items-center justify-between text-[10px] pt-0.5 ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                      <span className="font-mono">#{c.conceptNumber}</span>
                      <span className="font-medium text-slate-400">{statusDesc}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Main Stage: Dynamic Creative Studio Form */}
        <div className="lg:col-span-8 space-y-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          {/* Post Header Meta */}
          <div className="border-b border-slate-200 pb-3.5 space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold bg-slate-900 text-amber-400 px-2 py-0.5 rounded">
                #{scriptData.conceptNumber}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${formatMeta.color} border`}>
                {formatMeta.shortLabel || formatMeta.label}
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">
                {pillarMeta.shortLabel || pillarMeta.label}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {scriptData.publishDate} ({scriptData.day})
              </span>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteConcept) onDeleteConcept(scriptData.id);
                }}
                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 font-semibold px-2 py-1 rounded ml-auto transition-colors border border-red-200 cursor-pointer"
              >
                Delete Post
              </button>
            </div>

            <input
              type="text"
              value={scriptData.title || ''}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              className="ds-input text-sm font-bold text-slate-900"
              placeholder="Content Concept Title..."
            />
          </div>

          {/* DYNAMIC SUB-TABS BASED ON FORMAT */}
          <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-2.5 text-xs font-medium">
            {/* 1. PHOTOGRAPHY TABS */}
            {scriptData.format === 'photography' && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('photoShots')}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    activeTab === 'photoShots'
                      ? 'bg-slate-900 text-white font-bold shadow-xs'
                      : 'text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  📸 Shot List & Angles ({activePhotoShots.length})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('visualDirectives')}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    activeTab === 'visualDirectives'
                      ? 'bg-slate-900 text-white font-bold shadow-xs'
                      : 'text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  🎨 Visual Mood & Staging
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('broll')}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    activeTab === 'broll'
                      ? 'bg-slate-900 text-white font-bold shadow-xs'
                      : 'text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  📋 On-Site Photo Checklist ({scriptData.brollChecklist?.length || 0})
                </button>
              </>
            )}

            {/* 2. CAROUSEL TABS */}
            {scriptData.format === 'carousel' && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('carousel')}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    activeTab === 'carousel'
                      ? 'bg-slate-900 text-white font-bold shadow-xs'
                      : 'text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  📑 Slide Storyboard ({scriptData.slides?.length || 5} Slides)
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('hook')}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    activeTab === 'hook'
                      ? 'bg-slate-900 text-white font-bold shadow-xs'
                      : 'text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  ⚡ Cover Slide Hook
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('broll')}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    activeTab === 'broll'
                      ? 'bg-slate-900 text-white font-bold shadow-xs'
                      : 'text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  🎨 Visual Asset Assets Checklist ({scriptData.brollChecklist?.length || 0})
                </button>
              </>
            )}

            {/* 3. TECHNICAL INFOGRAPHIC TABS */}
            {scriptData.format === 'designed_post' && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('infographic')}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    activeTab === 'infographic'
                      ? 'bg-slate-900 text-white font-bold shadow-xs'
                      : 'text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  📊 Data Points & Blueprint
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('hook')}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    activeTab === 'hook'
                      ? 'bg-slate-900 text-white font-bold shadow-xs'
                      : 'text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  ⚡ Primary Headline Hook
                </button>
              </>
            )}

            {/* 4. CONVERSION / OFFER TABS */}
            {scriptData.format === 'cta_post' && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('offer')}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    activeTab === 'offer'
                      ? 'bg-slate-900 text-white font-bold shadow-xs'
                      : 'text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  🎯 Offer & Conversion Architecture
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('broll')}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    activeTab === 'broll'
                      ? 'bg-slate-900 text-white font-bold shadow-xs'
                      : 'text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  🖼️ Visual Asset Guidance
                </button>
              </>
            )}

            {/* 5. VIDEO / REEL TABS */}
            {scriptData.format === 'reel' && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('scenes')}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    activeTab === 'scenes'
                      ? 'bg-slate-900 text-white font-bold shadow-xs'
                      : 'text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  🎬 Scene Breakdown ({scriptData.scenes?.length || 0})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('hook')}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    activeTab === 'hook'
                      ? 'bg-slate-900 text-white font-bold shadow-xs'
                      : 'text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  ⚡ 3-Second Video Hook
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('broll')}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    activeTab === 'broll'
                      ? 'bg-slate-900 text-white font-bold shadow-xs'
                      : 'text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  🎥 Videographer B-Roll ({scriptData.brollChecklist?.length || 0})
                </button>
              </>
            )}
          </div>

          {/* ========================================================= */}
          {/* SECTION A: PHOTOGRAPHY STUDIO PANELS                      */}
          {/* ========================================================= */}

          {/* TAB: PHOTOGRAPHY SHOT LIST & ANGLES */}
          {activeTab === 'photoShots' && scriptData.format === 'photography' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">📸 Camera Angles & Composition Shot List</h4>
                  <p className="text-[11px] text-slate-500">Provide direct camera framing, focal length, aspect ratio, and lighting setup for your photographer.</p>
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={handleAddPhotoShot} className="text-xs !bg-slate-100 font-semibold cursor-pointer">
                  + Add Camera Angle
                </Button>
              </div>

              <div className="space-y-3.5">
                {activePhotoShots.map((shot, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-emerald-600 text-white font-mono font-bold text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={shot.title || ''}
                          onChange={(e) => handlePhotoShotChange(idx, 'title', e.target.value)}
                          placeholder="e.g. 3/4 Low-Angle Hero Shot"
                          className="font-bold text-xs bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-900 w-64"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={shot.aspectRatio || '4:5 Portrait (IG & LinkedIn)'}
                          onChange={(e) => handlePhotoShotChange(idx, 'aspectRatio', e.target.value)}
                          className="text-[11px] font-semibold bg-white border border-slate-300 rounded px-2 py-0.5 text-slate-700"
                        >
                          <option value="4:5 Portrait (IG & LinkedIn)">4:5 Portrait (IG & LinkedIn)</option>
                          <option value="16:9 Landscape (Web & Banner)">16:9 Landscape (Web/Banner)</option>
                          <option value="1:1 Square (Detail)">1:1 Square (Detail)</option>
                          <option value="9:16 Story / Full Screen">9:16 Full Screen Vertical</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => handleDeletePhotoShot(idx)}
                          className="text-xs text-red-600 hover:underline font-semibold cursor-pointer ml-1"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="font-semibold text-slate-700 block text-[10px] uppercase mb-1">
                          📐 Framing, Lens & Camera Position
                        </label>
                        <textarea
                          rows={2}
                          value={shot.framing || ''}
                          onChange={(e) => handlePhotoShotChange(idx, 'framing', e.target.value)}
                          placeholder="e.g. 24mm wide angle, 30cm off gravel, looking up to emphasize blade..."
                          className="ds-input text-xs"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block text-[10px] uppercase mb-1">
                          ☀️ Lighting & Filter Directive
                        </label>
                        <textarea
                          rows={2}
                          value={shot.lighting || ''}
                          onChange={(e) => handlePhotoShotChange(idx, 'lighting', e.target.value)}
                          placeholder="e.g. Golden hour low sun, polarizer filter to cut windshield reflections..."
                          className="ds-input text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block text-[10px] uppercase mb-1">
                        🚜 Machine Staging & Prep Directive
                      </label>
                      <input
                        type="text"
                        value={shot.staging || ''}
                        onChange={(e) => handlePhotoShotChange(idx, 'staging', e.target.value)}
                        placeholder="e.g. Machine washed, bucket curled down in earth, amber roof beacon ON..."
                        className="ds-input text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: PHOTOGRAPHY VISUAL DIRECTIVES & MOOD */}
          {activeTab === 'visualDirectives' && scriptData.format === 'photography' && (
            <div className="space-y-4">
              <div className="bg-emerald-50/70 p-3.5 rounded-lg border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <span className="font-bold uppercase tracking-wider block text-[11px]">🎨 Art Direction & Visual Identity:</span>
                <p className="leading-relaxed text-emerald-800 text-[11px]">
                  Heavy equipment photography must look powerful, authentic, and industrial-grade. Avoid over-sanitized studio renders; capture real Kuwait desert worksite grit combined with pristine Japanese engineering.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Visual Mood & Atmosphere</label>
                <textarea
                  rows={2}
                  value={scriptData.summary || ''}
                  onChange={(e) => handleFieldChange('summary', e.target.value)}
                  placeholder="e.g. High-contrast industrial aesthetic, golden hour sunset, active dust particles glowing in warm desert sunlight..."
                  className="ds-input text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Post-Production & Color Grading Directive</label>
                <textarea
                  rows={2}
                  value={scriptData.postProductionNotes || ''}
                  onChange={(e) => handleFieldChange('postProductionNotes', e.target.value)}
                  placeholder="e.g. Enhance warm desert golden tones, sharpen steel blade textures, recover specular highlights on Komatsu yellow paint..."
                  className="ds-input text-xs"
                />
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION B: CAROUSEL STUDIO PANELS                         */}
          {/* ========================================================= */}
          {activeTab === 'carousel' && scriptData.format === 'carousel' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">📑 Multi-Slide Deck Storyboard</h4>
                  <p className="text-[11px] text-slate-500">Draft card-by-card headlines, technical breakdown points, and final call-to-action.</p>
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={handleAddSlide} className="text-xs !bg-slate-100 font-semibold cursor-pointer">
                  + Add Slide
                </Button>
              </div>

              <div className="space-y-3">
                {(scriptData.slides || []).map((slide, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-indigo-600 text-white text-xs flex items-center justify-center font-mono">
                          {idx + 1}
                        </span>
                        Slide {slide.slideNo || idx + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {idx === 0 ? 'Cover Hook' : idx === (scriptData.slides?.length || 5) - 1 ? 'Final CTA' : 'Value Spec'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteSlide(idx)}
                          className="text-xs text-red-600 hover:underline font-semibold cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={slide.title || ''}
                      onChange={(e) => handleSlideChange(idx, 'title', e.target.value)}
                      placeholder="Slide Headline..."
                      className="ds-input text-xs font-bold"
                    />

                    <textarea
                      rows={2}
                      value={slide.body || ''}
                      onChange={(e) => handleSlideChange(idx, 'body', e.target.value)}
                      placeholder="Slide bullet points or technical copy..."
                      className="ds-input text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION C: TECHNICAL INFOGRAPHIC BLUEPRINT                */}
          {/* ========================================================= */}
          {activeTab === 'infographic' && scriptData.format === 'designed_post' && (
            <div className="space-y-4">
              <div className="bg-amber-50/70 p-3.5 rounded-lg border border-amber-200 text-xs text-amber-900 space-y-1">
                <span className="font-bold uppercase tracking-wider block text-[11px]">📐 Technical Data Blueprint:</span>
                <p className="leading-relaxed text-amber-800 text-[11px]">
                  Provide precise engineering data, comparison badges, and visual cutaway directives for your graphic artist.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Key Data Metrics / Spec Badges</label>
                <textarea
                  rows={2}
                  value={scriptData.summary || ''}
                  onChange={(e) => handleFieldChange('summary', e.target.value)}
                  placeholder="e.g. Fuel Efficiency: +18% • Operating Weight: 35,000 kg • Desert Ambient Rating: 52°C..."
                  className="ds-input text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Visual Diagram & Layout Directive</label>
                <textarea
                  rows={2}
                  value={scriptData.postProductionNotes || ''}
                  onChange={(e) => handleFieldChange('postProductionNotes', e.target.value)}
                  placeholder="e.g. 3D isometric cutaway rendering of Komatsu hydraulic pump with 4 numbered technical callout callouts..."
                  className="ds-input text-xs"
                />
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION D: CONVERSION & OFFER ARCHITECTURE                */}
          {/* ========================================================= */}
          {activeTab === 'offer' && scriptData.format === 'cta_post' && (
            <div className="space-y-4">
              <div className="bg-rose-50/70 p-3.5 rounded-lg border border-rose-200 text-xs text-rose-900 space-y-1">
                <span className="font-bold uppercase tracking-wider block text-[11px]">🎯 Conversion Architecture:</span>
                <p className="leading-relaxed text-rose-800 text-[11px]">
                  Define the core value proposition, key package inclusions, urgency triggers, and primary conversion channel.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Primary Offer Headline</label>
                <input
                  type="text"
                  value={scriptData.ctaText || ''}
                  onChange={(e) => handleFieldChange('ctaText', e.target.value)}
                  placeholder="e.g. Inquire today to receive a complimentary 500-hour preventive maintenance package..."
                  className="ds-input text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Offer Details & Inclusions</label>
                <textarea
                  rows={3}
                  value={scriptData.summary || ''}
                  onChange={(e) => handleFieldChange('summary', e.target.value)}
                  placeholder="e.g. 1. Genuine Komatsu Filters included • 2. Certified Shuwaikh engineer on-site inspection • 3. KOMTRAX telematics setup..."
                  className="ds-input text-xs"
                />
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION E: VIDEO SCENES (REELS / MOTION)                  */}
          {/* ========================================================= */}
          {activeTab === 'scenes' && scriptData.format === 'reel' && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">🎬 Scene Breakdown & Voiceover</h4>
                  <p className="text-[11px] text-slate-500">Provide direct camera framing, talent cues, and bilingual dialogue for the videographer</p>
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={handleAddScene} className="text-xs !bg-slate-100 font-semibold cursor-pointer">
                  + Add Scene
                </Button>
              </div>

              <div className="space-y-3">
                {(scriptData.scenes || []).map((scene, idx) => {
                  return (
                    <div key={idx} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2.5 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-800">Scene {idx + 1}</span>
                          <input
                            type="text"
                            value={scene.time || ''}
                            onChange={(e) => handleSceneChange(idx, 'time', e.target.value)}
                            placeholder="0:00 - 0:04"
                            className="font-mono text-xs font-semibold bg-white border border-slate-300 rounded px-2 py-0.5 w-24 text-center"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteScene(idx)}
                          className="text-xs text-red-600 hover:underline font-semibold cursor-pointer"
                        >
                          Delete Scene
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                        <div>
                          <label className="font-semibold text-slate-700 block text-[10px] uppercase mb-1">Camera Framing & Shot Type</label>
                          <textarea
                            rows={2}
                            value={scene.visual || ''}
                            onChange={(e) => handleSceneChange(idx, 'visual', e.target.value)}
                            placeholder="e.g. 16mm ultra-wide low angle, drone flyby, macro close-up..."
                            className="ds-input text-xs"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block text-[10px] uppercase mb-1">Talent / Machine Action</label>
                          <textarea
                            rows={2}
                            value={scene.talentAction || ''}
                            onChange={(e) => handleSceneChange(idx, 'talentAction', e.target.value)}
                            placeholder="e.g. Engineer walks up to machine pointing to radiator fan..."
                            className="ds-input text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                        <div>
                          <label className="font-semibold text-slate-700 block text-[10px] uppercase mb-1">Voiceover Dialogue (English)</label>
                          <textarea
                            rows={2}
                            value={scene.audioVoiceoverEn || ''}
                            onChange={(e) => handleSceneChange(idx, 'audioVoiceoverEn', e.target.value)}
                            placeholder="Spoken words in English..."
                            className="ds-input text-xs"
                          />
                        </div>

                        <div dir="rtl">
                          <label className="font-semibold text-slate-700 block text-[10px] uppercase mb-1 text-right">النص الصوتي (عربي)</label>
                          <textarea
                            rows={2}
                            value={scene.audioVoiceoverAr || ''}
                            onChange={(e) => handleSceneChange(idx, 'audioVoiceoverAr', e.target.value)}
                            placeholder="النص المنطوق بالعربية..."
                            className="ds-input text-xs text-right"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                        <div>
                          <label className="font-semibold text-slate-700 block text-[10px] uppercase mb-1">On-Screen Typography (Lower Third)</label>
                          <input
                            type="text"
                            value={scene.onScreenTextEn || ''}
                            onChange={(e) => handleSceneChange(idx, 'onScreenTextEn', e.target.value)}
                            placeholder="e.g. HIGH-AMBIENT DESERT COOLING RADIATOR"
                            className="ds-input text-xs font-mono"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block text-[10px] uppercase mb-1">Audio & SFX Foley</label>
                          <input
                            type="text"
                            value={scene.sfxMusic || ''}
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

          {/* ========================================================= */}
          {/* SECTION F: SHARED HOOK TAB                                */}
          {/* ========================================================= */}
          {activeTab === 'hook' && (
            <div className="space-y-4">
              <div className="bg-amber-50/70 p-3.5 rounded-lg border border-amber-200 text-xs text-amber-900 space-y-1">
                <span className="font-bold uppercase tracking-wider block text-[11px]">⚡ Headline & Hook Formula:</span>
                <p className="leading-relaxed text-amber-800 text-[11px]">
                  In heavy machinery B2B media, viewers decide in under 3 seconds. Combine a powerful visual grab, bold engineering proof, and a provocative headline statement.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Headline / Spoken Hook (English)</label>
                <input
                  type="text"
                  value={typeof scriptData.hook === 'string' ? scriptData.hook : scriptData.hook?.spokenEn || ''}
                  onChange={(e) => handleHookChange('spokenEn', e.target.value)}
                  placeholder="e.g. When Kuwait reaches 52°C, these machines don’t stop. Here is why..."
                  className="ds-input text-xs font-semibold"
                />
              </div>

              <div dir="rtl">
                <label className="text-xs font-semibold text-slate-700 mb-1 block text-right">عنوان الجذب / النص الافتتاحي (عربي)</label>
                <input
                  type="text"
                  value={typeof scriptData.hook === 'object' ? scriptData.hook?.spokenAr || '' : ''}
                  onChange={(e) => handleHookChange('spokenAr', e.target.value)}
                  placeholder="مثال: عندما تتجاوز حرارة الكويت 50 درجة مئوية.. كيف تواصل هذه الآليات العمل دون توقف؟"
                  className="ds-input text-xs font-semibold text-right"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Visual Graphic / Camera Action Grabber</label>
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

          {/* ========================================================= */}
          {/* SECTION G: SHARED B-ROLL / ON-SITE CHECKLIST TAB          */}
          {/* ========================================================= */}
          {activeTab === 'broll' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  {scriptData.format === 'photography'
                    ? '📸 On-Site Photography Shot Checklist'
                    : scriptData.format === 'reel'
                    ? '🎥 Videographer B-Roll Shot Checklist'
                    : '📋 Production & Asset Checklist'}
                </h4>
                <p className="text-[11px] text-slate-500">
                  {scriptData.format === 'photography'
                    ? 'Specific mandatory photos and angle details the photographer must deliver from location'
                    : 'Specific mandatory cutaways and close-ups the camera crew must film on location'}
                </p>
              </div>

              <div className="space-y-1.5">
                {(scriptData.brollChecklist || []).map((shot, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                    <span className="font-medium text-slate-800 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" /> {shot}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteBrollItem(idx)}
                      className="text-xs text-red-600 hover:underline font-semibold ml-2 cursor-pointer"
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
                  placeholder={
                    scriptData.format === 'photography'
                      ? 'e.g. Macro photo of hydraulic hose under desert sun, golden hour dust backlighting...'
                      : 'e.g. Macro close-up of hydraulic hoses flexing under 350 bar...'
                  }
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
                  className="text-xs font-bold cursor-pointer"
                >
                  + Add Item
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <Button type="button" variant="secondary" onClick={onPrevStep} className="text-xs cursor-pointer">
          ← Back to 4-Week Plan
        </Button>

        <Button
          type="button"
          variant="primary"
          onClick={onNextStep}
          className="!bg-slate-900 hover:!bg-slate-800 !text-white !font-bold text-xs shadow-sm cursor-pointer"
        >
          Next: Multi-Platform Copy (Step 4) →
        </Button>
      </div>
    </div>
  );
}
