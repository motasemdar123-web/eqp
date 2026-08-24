'use client';

import React, { useState } from 'react';
import Button from '../ui/Button';
import { FORMAT_TYPES, GOAL_TYPES, PIPELINE_STAGES, MEDIA_PLATFORMS } from '../../lib/mediaContentData';

export default function NewConceptModal({ initialData, onSave, onClose }) {
  const [formData, setFormData] = useState(
    initialData || {
      title: '',
      format: 'reel',
      platforms: ['instagram', 'linkedin', 'facebook'],
      goal: 'brand_awareness',
      status: 'idea',
      publishDate: new Date().toISOString().slice(0, 10),
      summary: '',
      hook: '',
      visualDirection: '',
      audioBroll: '',
      captionEn: '',
      captionAr: '',
      hashtags: '#Komatsu #DarAlHay #KuwaitConstruction #HeavyMachinery',
      ctaText: 'Contact Dar Al Hay heavy equipment specialists today.',
      slides: [
        { slideNo: 1, title: '', body: '' },
        { slideNo: 2, title: '', body: '' },
        { slideNo: 3, title: '', body: '' },
        { slideNo: 4, title: '', body: '' },
        { slideNo: 5, title: '', body: '' },
      ],
    }
  );

  const togglePlatform = (pid) => {
    setFormData((prev) => {
      const exists = prev.platforms.includes(pid);
      if (exists) {
        return { ...prev, platforms: prev.platforms.filter((p) => p !== pid) };
      }
      return { ...prev, platforms: [...prev.platforms, pid] };
    });
  };

  const handleSlideChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...(prev.slides || [])];
      if (!updated[index]) updated[index] = { slideNo: index + 1, title: '', body: '' };
      updated[index] = { ...updated[index], [field]: value };
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
        className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <h3 className="text-base font-bold">
            {initialData ? 'Edit Content Concept' : '+ Add New Media Concept'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Title & Format */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">Content Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Hero Machine – PC500LC Desert Action"
                className="ds-input text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">Content Format</label>
              <select
                value={formData.format}
                onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                className="ds-input text-xs"
              >
                {FORMAT_TYPES.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.icon} {f.label} ({f.tag})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Goal & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">Main Strategic Goal</label>
              <select
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                className="ds-input text-xs"
              >
                {GOAL_TYPES.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label}
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
            <label className="text-xs font-bold text-slate-700 mb-1 block">Target Social Platforms</label>
            <div className="flex gap-2">
              {MEDIA_PLATFORMS.map((p) => {
                const isSelected = formData.platforms.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePlatform(p.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {p.icon} {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hook */}
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 block">⚡ 3-Second Hook / Opening Line</label>
            <input
              type="text"
              value={formData.hook}
              onChange={(e) => setFormData({ ...formData, hook: e.target.value })}
              placeholder="e.g. Built for the toughest desert terrain on earth..."
              className="ds-input text-xs"
            />
          </div>

          {/* Concept Summary & Visual Direction */}
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 block">Concept Summary / What to Shoot</label>
            <textarea
              rows={2}
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              placeholder="Brief description of the visual scene, machine action, or infographic..."
              className="ds-input text-xs"
            />
          </div>

          {/* Captions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">English Caption</label>
              <textarea
                rows={3}
                value={formData.captionEn}
                onChange={(e) => setFormData({ ...formData, captionEn: e.target.value })}
                className="ds-input text-xs"
                placeholder="English caption text..."
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">Arabic Caption (النص العربي)</label>
              <textarea
                rows={3}
                value={formData.captionAr}
                onChange={(e) => setFormData({ ...formData, captionAr: e.target.value })}
                className="ds-input text-xs"
                dir="rtl"
                placeholder="النص بالعربية..."
              />
            </div>
          </div>

          {/* Hashtags */}
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 block">Hashtags</label>
            <input
              type="text"
              value={formData.hashtags}
              onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })}
              className="ds-input text-xs"
            />
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Save Concept
          </Button>
        </div>
      </form>
    </div>
  );
}
