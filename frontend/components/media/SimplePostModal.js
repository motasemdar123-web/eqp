'use client';

import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { FORMAT_TYPES, PIPELINE_STAGES } from '../../lib/mediaMonthlyData';

const TOV_PRESETS = [
  'Authoritative Industrial & Fleet Economics',
  'Japanese Precision & Quality',
  'Desert Heat Resilience & Toughness',
  'Behind-The-Scenes Workshop & Engineering',
  'Direct Inquiries & Spare Parts Offer',
];

export default function SimplePostModal({
  isOpen,
  post,
  defaultDate,
  onSave,
  onDelete,
  onClose,
}) {
  const isEdit = Boolean(post && post.id);

  const [formData, setFormData] = useState({
    id: null,
    title: '',
    publishDate: '',
    format: 'reel',
    status: 'idea',
    summary: '',
    tov: 'Authoritative Industrial & Fleet Economics',
    captionEn: '',
    captionAr: '',
  });

  const [copiedEn, setCopiedEn] = useState(false);
  const [copiedAr, setCopiedAr] = useState(false);

  useEffect(() => {
    if (post) {
      setFormData({
        id: post.id || null,
        conceptNumber: post.conceptNumber || null,
        title: post.title || '',
        publishDate: post.publishDate || defaultDate || new Date().toISOString().slice(0, 10),
        format: post.format || 'reel',
        status: post.status || 'idea',
        summary: post.summary || post.description || '',
        tov: post.tov || 'Authoritative Industrial & Fleet Economics',
        captionEn: post.captionEn || '',
        captionAr: post.captionAr || '',
        platforms: post.platforms || ['instagram', 'linkedin', 'facebook'],
        pillar: post.pillar || 'pillar_engineering',
        scenes: post.scenes || [],
        slides: post.slides || [],
        photoShots: post.photoShots || [],
      });
    } else {
      setFormData({
        id: null,
        conceptNumber: null,
        title: '',
        publishDate: defaultDate || new Date().toISOString().slice(0, 10),
        format: 'reel',
        status: 'idea',
        summary: '',
        tov: 'Authoritative Industrial & Fleet Economics',
        captionEn: '',
        captionAr: '',
        platforms: ['instagram', 'linkedin', 'facebook'],
        pillar: 'pillar_engineering',
      });
    }
  }, [post, defaultDate, isOpen]);

  if (!isOpen) return null;

  const handleCopy = (text, lang) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (lang === 'en') {
      setCopiedEn(true);
      setTimeout(() => setCopiedEn(false), 2000);
    } else {
      setCopiedAr(true);
      setTimeout(() => setCopiedAr(false), 2000);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Please enter a post idea title.');
      return;
    }

    // Determine day of week from publishDate
    let day = 'Sunday';
    if (formData.publishDate) {
      const d = new Date(formData.publishDate);
      if (!isNaN(d.getTime())) {
        day = d.toLocaleDateString('en-US', { weekday: 'long' });
      }
    }

    onSave({
      ...formData,
      day,
      // Description is mapped to summary for backward compatibility
      description: formData.summary,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-xs animate-[ds-fade-in_150ms_ease]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] animate-[ds-scale-in_150ms_ease]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-amber-400 shrink-0" />
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                {isEdit ? `Edit Post Idea ${formData.conceptNumber ? `#${formData.conceptNumber}` : ''}` : 'New Post Idea'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {isEdit ? 'Update core concept, tone of voice, and platform copy' : 'Schedule a new content release on the monthly calendar'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Status Quick Select */}
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer"
            >
              {PIPELINE_STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Form Body */}
        <form id="post-form" onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Row 1: Title */}
          <div>
            <label className="text-xs font-bold text-slate-900 mb-1.5 block">
              Post Title / Idea Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. PC350LC-8M0 Desert Heat Overheating Test & Radiator Walkthrough"
              className="ds-input text-xs sm:text-sm font-bold text-slate-900"
            />
          </div>

          {/* Row 2: Date & Format */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-900 mb-1.5 block">
                Publish Date
              </label>
              <input
                type="date"
                value={formData.publishDate}
                onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                className="ds-input text-xs font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-900 mb-1.5 block">
                Content Format
              </label>
              <select
                value={formData.format}
                onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                className="ds-input text-xs font-semibold text-slate-800 cursor-pointer"
              >
                {FORMAT_TYPES.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Description */}
          <div>
            <label className="text-xs font-bold text-slate-900 mb-1.5 flex items-center justify-between">
              <span>Post Description & Concept</span>
              <span className="text-[11px] font-normal text-slate-400">Core message, angle, or footage notes</span>
            </label>
            <textarea
              rows={3}
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              placeholder="Explain the idea: What is the focus? What are we showing? (e.g. Demonstrating how Komatsu wide-fin radiators prevent 50°C summer breakdowns on desert highway jobsites)..."
              className="ds-input text-xs leading-relaxed"
            />
          </div>

          {/* Row 4: Tone of Voice (TOV) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-900 flex items-center justify-between">
              <span>Tone of Voice (TOV)</span>
              <span className="text-[11px] font-normal text-slate-400">Brand persona & style</span>
            </label>
            <input
              type="text"
              value={formData.tov}
              onChange={(e) => setFormData({ ...formData, tov: e.target.value })}
              placeholder="e.g. Authoritative Industrial, Japanese Precision, Engineering-first"
              className="ds-input text-xs font-semibold text-slate-800"
            />

            {/* Quick TOV Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[10px] text-slate-400 font-medium">Quick Presets:</span>
              {TOV_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setFormData({ ...formData, tov: preset })}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 transition-colors border border-slate-200 cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Row 5: Captions (Side by Side EN & AR) */}
          <div className="border-t border-slate-200 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Post Captions
              </h3>
              <span className="text-[11px] text-slate-400">Bilingual English & Arabic copy</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* English Caption */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>🇬🇧 English Caption</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleCopy(formData.captionEn, 'en')}
                    className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded transition-colors border border-slate-200 cursor-pointer"
                  >
                    {copiedEn ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={formData.captionEn}
                  onChange={(e) => setFormData({ ...formData, captionEn: e.target.value })}
                  placeholder="Write clear, professional B2B English copy..."
                  className="ds-input text-xs font-sans leading-relaxed"
                />
              </div>

              {/* Arabic Caption */}
              <div className="space-y-1.5" dir="rtl">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 text-right">
                    <span>🇰🇼 النص العربي (الكابشن)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleCopy(formData.captionAr, 'ar')}
                    className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded transition-colors border border-slate-200 cursor-pointer"
                  >
                    {copiedAr ? '✓ تم النسخ' : 'نسخ'}
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={formData.captionAr}
                  onChange={(e) => setFormData({ ...formData, captionAr: e.target.value })}
                  placeholder="اكتب النص العربي بصياغة مهنية رصينة..."
                  className="ds-input text-xs font-sans leading-relaxed text-right"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between shrink-0">
          <div>
            {isEdit && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Delete "${formData.title}"?`)) {
                    onDelete(formData.id);
                  }
                }}
                className="text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded transition-colors cursor-pointer"
              >
                Delete Idea
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="text-xs cursor-pointer"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              form="post-form"
              variant="primary"
              size="sm"
              className="!bg-slate-900 hover:!bg-slate-800 !text-white !font-bold text-xs shadow-xs cursor-pointer"
            >
              {isEdit ? 'Save Changes' : 'Create Post'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
