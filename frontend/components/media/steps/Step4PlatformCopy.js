'use client';

import React, { useState, useEffect } from 'react';
import Card from '../../ui/Card';
import Badge from '../../ui/Badge';
import Button from '../../ui/Button';
import PlatformPostSimulator from '../PlatformPostSimulator';
import { FORMAT_TYPES, CONTENT_PILLARS, TOV_GUIDELINES } from '../../../lib/mediaMonthlyData';

const PLATFORM_LIMITS = {
  linkedin: { maxChars: 3000, label: 'LinkedIn', icon: '💼', color: 'bg-blue-600', gradient: 'from-blue-600 to-blue-800', toneLabel: 'B2B Authority & Fleet Economics' },
  instagram: { maxChars: 2200, label: 'Instagram', icon: '📸', color: 'bg-pink-600', gradient: 'from-pink-500 to-purple-600', toneLabel: 'Cinematic, Visual & Operator Culture' },
  facebook: { maxChars: 63206, label: 'Facebook', icon: '👥', color: 'bg-blue-500', gradient: 'from-blue-500 to-indigo-600', toneLabel: 'Community-First, Bilingual (Arabic Priority)' },
};

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
  const [activeTab, setActiveTab] = useState('linkedin');
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

  const enLen = (copyData.captionEn || '').length;
  const arLen = (copyData.captionAr || '').length;
  const platformInfo = PLATFORM_LIMITS[activeTab] || PLATFORM_LIMITS.linkedin;
  const tovPlatform = TOV_GUIDELINES?.platforms?.[activeTab];
  const hasCopyEn = enLen > 0;
  const hasCopyAr = arLen > 0;
  const hasHashtags = (copyData.hashtags || '').length > 0;
  const hasCta = (copyData.ctaText || '').length > 0;
  const completionPct = Math.round(([hasCopyEn, hasCopyAr, hasHashtags, hasCta].filter(Boolean).length / 4) * 100);

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

        {/* Copy Completion Ring */}
        <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <svg width="44" height="44" viewBox="0 0 44 44" className="shrink-0">
            <circle cx="22" cy="22" r="18" fill="none" stroke="#e2e8f0" strokeWidth="3" />
            <circle
              cx="22" cy="22" r="18"
              fill="none" stroke="#f59e0b" strokeWidth="3"
              strokeDasharray={`${(completionPct / 100) * 113.1} 113.1`}
              strokeDashoffset="0"
              strokeLinecap="round"
              transform="rotate(-90 22 22)"
            />
            <text x="22" y="26" textAnchor="middle" className="fill-slate-900 text-[11px] font-black">{completionPct}%</text>
          </svg>
          <div>
            <p className="text-xs font-bold text-slate-900">Copy Completion</p>
            <p className="text-[10px] text-slate-500">{[hasCopyEn, hasCopyAr, hasHashtags, hasCta].filter(Boolean).length}/4 sections filled</p>
          </div>
        </div>
      </div>

      {/* 2-Column Copy Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar: Concept Selector + Copy Status */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs max-h-[700px] overflow-y-auto space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Posts in {campaign.monthName}</span>
              <Badge tone="neutral">{concepts.length}</Badge>
            </div>

            <div className="space-y-2">
              {concepts.map((c) => {
                const isSelected = c.id === copyData.id;
                const fMeta = FORMAT_TYPES.find((f) => f.id === c.format) || FORMAT_TYPES[0];
                const hasCopy = (c.captionEn || '').length > 10 || (c.captionAr || '').length > 10;

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
                      <div className="flex items-center gap-1.5">
                        {hasCopy && (
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSelected ? 'bg-emerald-400' : 'bg-emerald-500'}`} />
                        )}
                        <span className={`px-1.5 py-0.2 rounded font-bold ${isSelected ? 'bg-slate-800 text-amber-300' : fMeta.color}`}>
                          {fMeta.label}
                        </span>
                      </div>
                    </div>
                    <h4 className="text-xs font-bold leading-snug line-clamp-1">{c.title}</h4>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TOV Quick-Reference Card */}
          {tovPlatform && activeTab !== 'hashtags' && (
            <div className={`rounded-2xl overflow-hidden border border-slate-200 shadow-xs`}>
              <div className={`bg-gradient-to-r ${platformInfo.gradient} text-white p-3.5`}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{platformInfo.icon}</span>
                  <div>
                    <h4 className="text-xs font-bold">{tovPlatform.platform} TOV Guide</h4>
                    <p className="text-[10px] opacity-80">{platformInfo.toneLabel}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-3.5 space-y-2 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Target Audience:</span>
                  <p className="text-slate-800 font-medium mt-0.5">{tovPlatform.target}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Writing Style:</span>
                  <p className="text-slate-600 leading-relaxed mt-0.5">{tovPlatform.guidelines}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Main Stage: Copywriting Tabs & Live Mockup */}
        <div className="lg:col-span-8 space-y-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            {/* Platform Copy Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 text-xs font-bold">
              {['linkedin', 'instagram', 'facebook'].map((platId) => {
                const pi = PLATFORM_LIMITS[platId];
                const isActive = activeTab === platId;

                return (
                  <button
                    key={platId}
                    type="button"
                    onClick={() => setActiveTab(platId)}
                    className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 border ${
                      isActive
                        ? `bg-gradient-to-r ${pi.gradient} text-white border-transparent shadow-md`
                        : 'text-slate-600 bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-sm">{pi.icon}</span>
                    <span>{pi.label}</span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setActiveTab('hashtags')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 border ${
                  activeTab === 'hashtags'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                    : 'text-slate-600 bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <span className="text-sm">#</span>
                <span>Hashtags & CTA</span>
              </button>
            </div>

            {/* TAB CONTENT: ENGLISH & ARABIC PROSE */}
            {(activeTab === 'linkedin' || activeTab === 'instagram' || activeTab === 'facebook') && (
              <div className="space-y-5">
                {/* English Box */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      🇬🇧 English Caption
                      <span className="text-[10px] font-mono text-slate-400 lowercase">({platformInfo.label})</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-mono font-bold ${enLen > platformInfo.maxChars ? 'text-red-600' : 'text-slate-400'}`}>
                        {enLen.toLocaleString()} / {platformInfo.maxChars.toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(copyData.captionEn || '', 'en')}
                        className="text-xs font-bold text-sky-600 hover:underline"
                      >
                        {copiedSection === 'en' ? '✓ Copied!' : '📋 Copy'}
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={5}
                    value={copyData.captionEn || ''}
                    onChange={(e) => handleFieldChange('captionEn', e.target.value)}
                    placeholder="Write structured B2B prose with clear value proposition and Kuwait context..."
                    className="ds-input text-xs font-sans leading-relaxed"
                  />
                  {/* Character progress bar */}
                  <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${enLen > platformInfo.maxChars ? 'bg-red-500' : enLen > platformInfo.maxChars * 0.8 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(100, (enLen / platformInfo.maxChars) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Arabic Box */}
                <div className="space-y-1.5" dir="rtl">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider text-right flex items-center gap-1.5">
                      🇰🇼 النص العربي
                      <span className="text-[10px] font-mono text-slate-400 lowercase">({platformInfo.label})</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        {arLen.toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(copyData.captionAr || '', 'ar')}
                        className="text-xs font-bold text-sky-600 hover:underline"
                      >
                        {copiedSection === 'ar' ? '✓ تم النسخ!' : '📋 نسخ'}
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={5}
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
              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
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
                  {/* Hashtag count */}
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">
                    {(copyData.hashtags || '').split('#').filter(Boolean).length} hashtags
                    {(copyData.hashtags || '').split('#').filter(Boolean).length > 30 && (
                      <span className="text-red-500 ml-1">— Instagram recommends max 30</span>
                    )}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 block">🎯 Call to Action (CTA)</label>
                  <input
                    type="text"
                    value={copyData.ctaText || ''}
                    onChange={(e) => handleFieldChange('ctaText', e.target.value)}
                    className="ds-input text-xs"
                    placeholder="e.g. Visit our showroom in Shuwaikh or WhatsApp our sales desk..."
                  />
                </div>

                {/* Brand Do's & Don'ts Quick Card */}
                {TOV_GUIDELINES?.doAndDont && (
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Brand Writing Rules:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {TOV_GUIDELINES.doAndDont.slice(0, 2).map((rule, idx) => (
                        <div key={idx} className="text-[11px]">
                          <div className="flex items-start gap-1.5 text-emerald-800 bg-emerald-50/70 p-2 rounded-lg border border-emerald-200">
                            <span className="font-bold shrink-0">✅</span>
                            <span className="leading-relaxed">{rule.do}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
