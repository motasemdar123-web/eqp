'use client';

import React, { useState, useEffect } from 'react';
import Card from '../../ui/Card';
import Badge from '../../ui/Badge';
import Button from '../../ui/Button';
import PlatformPostSimulator from '../PlatformPostSimulator';
import { FORMAT_TYPES, CONTENT_PILLARS } from '../../../lib/mediaMonthlyData';

export default function Step4PlatformCopy({
  campaign,
  selectedConceptId,
  onSelectConcept,
  onSaveConceptCopy,
  onPrevStep,
  onNextStep,
}) {
  const concepts = campaign.concepts || [];
  const currentConcept = concepts.find((c) => c.id === selectedConceptId) || concepts[0] || null;

  const [copyData, setCopyData] = useState(currentConcept || {});
  const [activeTab, setActiveTab] = useState('linkedin'); // 'linkedin' | 'instagram' | 'facebook' | 'hashtags'
  const [copiedSection, setCopiedSection] = useState(null);

  useEffect(() => {
    if (currentConcept) {
      setCopyData(currentConcept);
    }
  }, [currentConcept?.id]);

  if (!currentConcept) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-xs text-slate-500">No concepts found to write copy for.</p>
      </div>
    );
  }

  const handleCopyText = (text, name) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(name);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleFieldChange = (field, value) => {
    const updated = { ...copyData, [field]: value };
    setCopyData(updated);
    onSaveConceptCopy(updated);
  };

  return (
    <div className="space-y-6 animate-[ds-toast-in_180ms_ease]">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
            Step 4 of 5
          </span>
          <h2 className="text-xl font-black text-slate-900 mt-1">Multi-Platform Copy & Tone of Voice Studio</h2>
          <p className="text-xs text-slate-500">
            Craft tailored bilingual copy for LinkedIn (B2B Authority), Instagram (Visual Impact), and Facebook (Community/Sales).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge tone="active">{copyData.title}</Badge>
        </div>
      </div>

      {/* 2-Column Copy Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar: Concept Selector */}
        <div className="lg:col-span-4 space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs max-h-[700px] overflow-y-auto">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Posts in {campaign.monthName}</span>
            <Badge tone="neutral">{concepts.length}</Badge>
          </div>

          <div className="space-y-2">
            {concepts.map((c) => {
              const isSelected = c.id === copyData.id;
              const fMeta = FORMAT_TYPES.find((f) => f.id === c.format) || FORMAT_TYPES[0];

              return (
                <div
                  key={c.id}
                  onClick={() => onSelectConcept(c.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1 ${
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
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Main Stage: Copywriting Tabs & Live Mockup */}
        <div className="lg:col-span-8 space-y-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            {/* Platform Copy Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('linkedin')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'linkedin' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                💼 LinkedIn Copy (B2B TCO)
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('instagram')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'instagram' ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                📸 Instagram Copy
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('facebook')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'facebook' ? 'bg-blue-500 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                👥 Facebook Copy (Arabic First)
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('hashtags')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'hashtags' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                # Hashtags & CTA
              </button>
            </div>

            {/* TAB CONTENT: ENGLISH & ARABIC PROSE */}
            {(activeTab === 'linkedin' || activeTab === 'instagram' || activeTab === 'facebook') && (
              <div className="space-y-4">
                {/* English Box */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      🇬🇧 English Caption ({activeTab.toUpperCase()})
                    </label>
                    <button
                      type="button"
                      onClick={() => handleCopyText(copyData.captionEn || '', 'en')}
                      className="text-xs font-bold text-sky-600 hover:underline"
                    >
                      {copiedSection === 'en' ? '✓ Copied!' : '📋 Copy English'}
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={copyData.captionEn || ''}
                    onChange={(e) => handleFieldChange('captionEn', e.target.value)}
                    placeholder="Write structured B2B prose with clear value proposition and Kuwait context..."
                    className="ds-input text-xs font-sans leading-relaxed"
                  />
                </div>

                {/* Arabic Box */}
                <div className="space-y-1.5" dir="rtl">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider text-right">
                      🇰🇼 النص العربي الكامل للمنشور ({activeTab.toUpperCase()})
                    </label>
                    <button
                      type="button"
                      onClick={() => handleCopyText(copyData.captionAr || '', 'ar')}
                      className="text-xs font-bold text-sky-600 hover:underline"
                    >
                      {copiedSection === 'ar' ? '✓ تم النسخ!' : '📋 نسخ النص العربي'}
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={copyData.captionAr || ''}
                    onChange={(e) => handleFieldChange('captionAr', e.target.value)}
                    placeholder="اكتب النص العربي بصياغة خليجية مهنية رصينة..."
                    className="ds-input text-xs font-sans leading-relaxed text-right"
                  />
                </div>
              </div>
            )}

            {/* TAB: HASHTAGS & CTA */}
            {activeTab === 'hashtags' && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider"># Hashtag Cluster</label>
                    <button
                      type="button"
                      onClick={() => handleCopyText(copyData.hashtags || '', 'tags')}
                      className="text-xs font-bold text-sky-600 hover:underline"
                    >
                      {copiedSection === 'tags' ? '✓ Copied!' : '📋 Copy Hashtags'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={copyData.hashtags || ''}
                    onChange={(e) => handleFieldChange('hashtags', e.target.value)}
                    className="ds-input text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1 block">Call to Action (CTA)</label>
                  <input
                    type="text"
                    value={copyData.ctaText || ''}
                    onChange={(e) => handleFieldChange('ctaText', e.target.value)}
                    className="ds-input text-xs"
                    placeholder="e.g. Visit our showroom in Shuwaikh or WhatsApp our sales desk..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Embedded Realistic Post Simulator Preview */}
          <PlatformPostSimulator concept={copyData} />
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <Button type="button" variant="secondary" onClick={onPrevStep} className="text-xs">
          ← Back to Script Studio
        </Button>

        <Button
          type="button"
          variant="primary"
          onClick={onNextStep}
          className="!bg-slate-900 hover:!bg-slate-800 !text-white !font-bold text-xs shadow-sm"
        >
          Next: Videographer Call Sheet (Step 5) →
        </Button>
      </div>
    </div>
  );
}
