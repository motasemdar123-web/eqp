'use client';

import React, { useState, useEffect, useRef } from 'react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { FORMAT_TYPES, PIPELINE_STAGES } from '../../lib/mediaMonthlyData';
import { uploadMediaAsset, deleteMediaAsset } from '../../lib/api';
import { downloadSingleAsset, downloadPostAssetsZip } from '../../lib/mediaZipUtils';
import { getStoredPlatformSession, getStoredUser } from '../../lib/auth';

const TOV_PRESETS = [
  'Authoritative Industrial & Fleet Economics',
  'Japanese Precision & Quality',
  'Desert Heat Resilience & Toughness',
  'Behind-The-Scenes Workshop & Engineering',
  'Direct Inquiries & Spare Parts Offer',
];

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getAssetBadge(type = '', name = '') {
  const lower = (name || '').toLowerCase();
  if (type.startsWith('video/') || /\.(mp4|mov|webm|avi|mkv)$/i.test(lower)) {
    return { icon: '🎬', label: 'Video', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
  }
  if (type.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(lower)) {
    return { icon: '🖼️', label: 'Image', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  }
  if (type === 'application/pdf' || /\.pdf$/i.test(lower)) {
    return { icon: '📄', label: 'PDF', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
  }
  if (/\.(psd|ai|fig)$/i.test(lower)) {
    return { icon: '🎨', label: 'Design', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
  }
  if (/\.(zip|rar|7z)$/i.test(lower)) {
    return { icon: '📦', label: 'Archive', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
  }
  return { icon: '📎', label: 'File', bg: 'bg-slate-50 text-slate-700 border-slate-200' };
}

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
    attachments: [],
  });

  const [copiedEn, setCopiedEn] = useState(false);
  const [copiedAr, setCopiedAr] = useState(false);

  // Asset upload states
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [zipProgress, setZipProgress] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

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
        attachments: post.attachments || [],
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
        attachments: [],
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

  const handleFilesSelect = async (filesList) => {
    if (!filesList || filesList.length === 0) return;
    setUploading(true);
    setUploadError(null);

    const session = getStoredPlatformSession() || {};
    const user = session?.user || getStoredUser();
    const uploaderName = user?.fullName || user?.full_name || 'Jessica Fawzy';

    const newAssets = [];
    const filesArray = Array.from(filesList);

    for (let i = 0; i < filesArray.length; i++) {
      const file = filesArray[i];
      setUploadProgress(`Uploading ${file.name} (${i + 1}/${filesArray.length})...`);
      try {
        const res = await uploadMediaAsset(file, {
          conceptId: formData.id,
          publishDate: formData.publishDate,
          uploadedBy: uploaderName,
        });
        if (res && res.asset) {
          newAssets.push(res.asset);
        }
      } catch (err) {
        console.error('File upload error:', err);
        setUploadError(`Failed to upload "${file.name}": ${err.message}`);
      }
    }

    if (newAssets.length > 0) {
      setFormData((prev) => ({
        ...prev,
        attachments: [...(prev.attachments || []), ...newAssets],
      }));
    }

    setUploading(false);
    setUploadProgress(null);
  };

  const handleRemoveAsset = async (assetId) => {
    if (!window.confirm('Remove this asset file from the post?')) return;
    setFormData((prev) => ({
      ...prev,
      attachments: (prev.attachments || []).filter((a) => a.id !== assetId),
    }));
    try {
      await deleteMediaAsset(assetId);
    } catch {}
  };

  const handleDownloadAllZip = async () => {
    if (!formData.attachments || formData.attachments.length === 0) return;
    setZipProgress('Packaging ZIP archive...');
    try {
      await downloadPostAssetsZip(formData, (p) => {
        if (p.stage === 'downloading') {
          setZipProgress(`Downloading ${p.current}/${p.total}: ${p.fileName}...`);
        } else if (p.stage === 'zipping') {
          setZipProgress(`Compressing deliverables into ZIP...`);
        }
      });
    } catch (err) {
      alert('Failed to package ZIP: ' + err.message);
    } finally {
      setZipProgress(null);
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/40 backdrop-blur-xs animate-[ds-fade-in_150ms_ease]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] animate-[ds-scale-in_150ms_ease]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-white text-slate-900 px-7 py-5 flex items-center justify-between border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-amber-400 shrink-0" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {isEdit ? `Edit Post Idea ${formData.conceptNumber ? `#${formData.conceptNumber}` : ''}` : 'New Post Idea'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEdit ? 'Update core concept, tone of voice, and platform copy' : 'Schedule a new content release on the monthly calendar'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Status Quick Select */}
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer"
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
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer text-sm font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Form Body */}
        <form id="post-form" onSubmit={handleSubmit} className="p-7 space-y-6 overflow-y-auto flex-1">
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

          {/* Row 6: Creative Deliverables & Assets */}
          <div className="border-t border-slate-200 pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Creative Deliverables & Assets
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {formData.attachments?.length || 0} files
                </span>
              </div>

              {formData.attachments?.length > 0 && (
                <button
                  type="button"
                  onClick={handleDownloadAllZip}
                  disabled={Boolean(zipProgress)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  title="Download all files for this day as a ZIP archive"
                >
                  <span>📦</span>
                  <span>{zipProgress ? 'Packaging ZIP...' : 'Download Day Assets (.zip)'}</span>
                </button>
              )}
            </div>

            {/* ZIP Progress / Toast message */}
            {zipProgress && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span className="font-semibold">{zipProgress}</span>
              </div>
            )}

            {/* Upload Error banner */}
            {uploadError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between">
                <span>⚠️ {uploadError}</span>
                <button
                  type="button"
                  onClick={() => setUploadError(null)}
                  className="text-rose-500 hover:text-rose-800 font-bold ml-2 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Drag & Drop Upload Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files) {
                  handleFilesSelect(e.dataTransfer.files);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-150 ${
                isDragging
                  ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-300/50'
                  : 'border-slate-300 hover:border-amber-400 bg-slate-50/60 hover:bg-amber-50/20'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    handleFilesSelect(e.target.files);
                  }
                  e.target.value = '';
                }}
              />

              {uploading ? (
                <div className="py-2 flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-semibold text-slate-700">
                    {uploadProgress || 'Uploading creative deliverables...'}
                  </span>
                </div>
              ) : (
                <div className="py-1 flex flex-col items-center justify-center gap-1.5">
                  <div className="w-9 h-9 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center text-base">
                    📁
                  </div>
                  <div className="text-xs text-slate-700">
                    <span className="font-bold text-amber-700 hover:underline">Click to upload</span> or drag and drop
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Supports Reels & Videos (MP4, MOV), Images (PNG, JPG, WEBP), PDFs, PSD, AI, ZIP (up to 100MB)
                  </p>
                </div>
              )}
            </div>

            {/* Uploaded Attachments List */}
            {formData.attachments && formData.attachments.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Uploaded Deliverables ({formData.attachments.length})
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {formData.attachments.map((asset) => {
                    const badge = getAssetBadge(asset.type, asset.name);
                    return (
                      <div
                        key={asset.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-2xs group"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
                          <span
                            className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm shrink-0 border ${badge.bg}`}
                          >
                            {badge.icon}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-slate-800 truncate" title={asset.name}>
                              {asset.name}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span className="font-medium text-slate-600">{formatFileSize(asset.size)}</span>
                              <span>•</span>
                              <span>By {asset.uploadedBy || 'Designer'}</span>
                              {asset.uploadedAt && (
                                <>
                                  <span>•</span>
                                  <span>{new Date(asset.uploadedAt).toLocaleDateString()}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Preview in new tab */}
                          <button
                            type="button"
                            onClick={() => window.open(asset.url, '_blank')}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer text-xs font-medium"
                            title="Preview / Open in new tab"
                          >
                            👁️ Open
                          </button>

                          {/* Direct download single file */}
                          <button
                            type="button"
                            onClick={() => downloadSingleAsset(asset)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                            title="Download this file individually"
                          >
                            <span>⬇️</span>
                            <span>Download</span>
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleRemoveAsset(asset.id)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer text-xs"
                            title="Remove file"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Modal Footer */}
        <div className="bg-slate-50/80 border-t border-slate-200 px-7 py-4 flex items-center justify-between shrink-0">
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

          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              form="post-form"
              variant="primary"
              size="sm"
            >
              {isEdit ? 'Save Changes' : 'Create Post'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
