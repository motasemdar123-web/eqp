'use client';

import React, { useState } from 'react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { TOV_GUIDELINES } from '../../lib/mediaMonthlyData';

export default function DesignerTovGuideModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('rules'); // 'rules' | 'pictures' | 'videos' | 'library'
  const [copiedText, setCopiedText] = useState(null);

  const designerData = TOV_GUIDELINES.designerGuidelines || {};
  const palette = designerData.colorPalette || [];
  const onImageRules = designerData.onImageRules || [];
  const onVideoRules = designerData.onVideoRules || [];
  const doAndDont = designerData.doAndDont || [];
  const headlineTemplates = designerData.headlineTemplates || [];
  const badgePresets = designerData.badgePresets || [];

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 p-3 sm:p-6 flex items-center justify-center backdrop-blur-xs animate-[ds-toast-in_180ms_ease]">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-5xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] shadow-2xl">
        {/* Modal Top Header */}
        <div className="bg-slate-950 text-white p-5 sm:p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center text-xl font-black shrink-0 shadow-xs">
              🎨
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/15 px-2 py-0.5 rounded border border-amber-400/30">
                  Media Corner Master Directive
                </span>
                <span className="text-[10px] text-slate-400 font-mono">v5.0 • Brand Standards</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Designer Tone of Voice (TOV) & Visual Text Guide
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Exact rules on what text, typography, badges, and headlines to write directly on pictures and videos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="text-xs !bg-slate-800 hover:!bg-slate-700 !text-white !border-slate-700 cursor-pointer"
            >
              Close
            </Button>
          </div>
        </div>

        {/* Tab Navigation Strip */}
        <div className="bg-slate-900 px-5 sm:px-6 py-2 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'rules'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            🏛️ Brand Voice & Typography Rules
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pictures')}
            className={`px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'pictures'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            📸 Text on Pictures & Graphics
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('videos')}
            className={`px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'videos'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            🎬 Text on Videos & Motion
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('library')}
            className={`px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'library'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            📋 Ready-to-Use Copy Library ({headlineTemplates.length} Templates)
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {/* ========================================================= */}
          {/* TAB 1: BRAND VOICE, TYPOGRAPHY & COLOR STANDARDS         */}
          {/* ========================================================= */}
          {activeTab === 'rules' && (
            <div className="space-y-6">
              {/* Voice Archetype Intro */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-5 text-white border border-slate-700 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    The Voice Archetype
                  </span>
                  <span className="text-xs text-slate-400">Dar Al Hay Commercial Co. (Komatsu Kuwait)</span>
                </div>
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                  &ldquo;Certified Japanese Precision Engineered for Kuwait&rsquo;s 50°C+ Harsh Desert Reality.&rdquo;
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  When writing on visual assets, speak like a Master Chief Engineer and Fleet Director. Avoid generic, flowery marketing buzzwords (e.g. &lsquo;amazing machine&rsquo; or &lsquo;best digger in town&rsquo;). Every word on an image or video must convey industrial strength, exact machine specs, high uptime, and Japanese reliability.
                </p>
              </div>

              {/* 4 Brand Pillars for Designers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { title: 'Japanese Precision', icon: '🇯🇵', desc: 'Highlight Komatsu factory standards, strict micron tolerances, and hydraulic supremacy.' },
                  { title: 'Kuwait Desert Toughness', icon: '☀️', desc: 'Emphasize 50°C+ ambient cooling, heavy dust filtration, and rock-breaking durability.' },
                  { title: 'Engineering Authority', icon: '⚙️', desc: 'Use exact model numbers (PC350LC-8M0), horsepower, breakout tons, and telemetry.' },
                  { title: 'Customer Partnership', icon: '🤝', desc: 'Position Dar Al Hay as the premier long-term fleet guardian with Shuwaikh central care.' },
                ].map((pillar, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                    <span className="text-xl">{pillar.icon}</span>
                    <h4 className="text-xs font-bold text-slate-900">{pillar.title}</h4>
                    <p className="text-[11px] text-slate-600 leading-snug">{pillar.desc}</p>
                  </div>
                ))}
              </div>

              {/* Brand Visual Color Palette */}
              <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🎨</span> On-Asset Color Standards for Visuals
                  </h4>
                  <span className="text-[11px] text-slate-500">High-contrast readability required on desert photography</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
                  {palette.map((c, i) => (
                    <div key={i} className="p-3 rounded-lg border border-slate-200 space-y-2 bg-slate-50">
                      <div
                        className="w-full h-8 rounded border border-black/10 flex items-center justify-center font-mono font-bold text-[10px] shadow-2xs"
                        style={{ backgroundColor: c.hex, color: c.text }}
                      >
                        {c.hex}
                      </div>
                      <div>
                        <span className="font-bold text-xs text-slate-900 block truncate">{c.name}</span>
                        <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">{c.role}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Safe Margins & Typography Rules */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span>📐</span> Safe Viewport Margins (Keep Text In-Bounds)
                  </h4>
                  <ul className="text-xs space-y-2 text-slate-700">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-amber-600 shrink-0">•</span>
                      <span><strong>9:16 Reels / Stories:</strong> Keep top 15% and bottom 22% free of text (blocked by profile icons, captions, and audio bars). Keep text inside the 1080x1080 center zone.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-amber-600 shrink-0">•</span>
                      <span><strong>4:5 Portrait (IG Feed & LinkedIn):</strong> Maintain at least 10% outer margins on all 4 borders.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-amber-600 shrink-0">•</span>
                      <span><strong>1:1 Square (Carousels & Posts):</strong> 8% padding minimum.</span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🔤</span> Typography & Font Directives
                  </h4>
                  <ul className="text-xs space-y-2 text-slate-700">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-indigo-600 shrink-0">•</span>
                      <span><strong>English Font:</strong> Heavy, condensed industrial sans-serif (e.g., DIN Next, Inter ExtraBold, Impact). All-caps for headlines.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-indigo-600 shrink-0">•</span>
                      <span><strong>Arabic Font:</strong> Clean modern geometric font (e.g., DIN Next Arabic, GE SS Two Bold). Natural Kuwaiti professional phrasing.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-indigo-600 shrink-0">•</span>
                      <span><strong>Contrast Scrim:</strong> Always place text over a 40–60% dark linear gradient scrim or a solid dark container pill. Never place plain text directly over desert sand glare.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: TEXT ON PICTURES & GRAPHICS                       */}
          {/* ========================================================= */}
          {activeTab === 'pictures' && (
            <div className="space-y-6">
              {/* Top Banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-950 space-y-1">
                <span className="font-extrabold uppercase tracking-wider block text-[11px]">
                  📸 The Golden Rule for Pictures & Carousels:
                </span>
                <p className="leading-relaxed">
                  A picture is worth a thousand words. <strong>Do NOT paste the post caption onto the photo.</strong> Viewers scroll past in 0.8 seconds. Write an ultra-punchy 3–5 word headline, 1 technical badge, and 1 subtle CTA. Leave 80%+ of the photo clean so the machine power dominates.
                </p>
              </div>

              {/* Anatomy of an Industrial Post Graphic */}
              <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Anatomy of Text on a Graphic or Photo
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-900 text-white rounded-lg space-y-1 border border-slate-800">
                    <span className="text-[10px] font-mono text-amber-400 uppercase font-bold block">1. Eyebrow Badge</span>
                    <p className="text-xs font-bold">KOMATSU PC350LC-8M0</p>
                    <p className="text-[10px] text-slate-400">Small uppercase chip establishing machine model or series.</p>
                  </div>

                  <div className="p-3 bg-slate-900 text-white rounded-lg space-y-1 border border-slate-800">
                    <span className="text-[10px] font-mono text-amber-400 uppercase font-bold block">2. Primary Headline</span>
                    <p className="text-xs font-black text-white">CONQUERING 52°C DESERT HEAT</p>
                    <p className="text-[10px] text-slate-400">3–5 words max, ultra-bold, high-contrast, active voice.</p>
                  </div>

                  <div className="p-3 bg-slate-900 text-white rounded-lg space-y-1 border border-slate-800">
                    <span className="text-[10px] font-mono text-amber-400 uppercase font-bold block">3. Arabic Subtitle</span>
                    <p className="text-xs font-bold text-amber-300" dir="rtl">قهر حرارة الصحراء القصوى</p>
                    <p className="text-[10px] text-slate-400">Natural professional Gulf translation under headline.</p>
                  </div>

                  <div className="p-3 bg-slate-900 text-white rounded-lg space-y-1 border border-slate-800">
                    <span className="text-[10px] font-mono text-amber-400 uppercase font-bold block">4. Micro-CTA</span>
                    <p className="text-xs font-semibold text-slate-200">Swipe for Specs 👉</p>
                    <p className="text-[10px] text-slate-400">Prompting swipe, showroom visit, or WhatsApp inquiry.</p>
                  </div>
                </div>
              </div>

              {/* Detailed Rules List */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="bg-slate-900 text-white p-3 text-xs font-bold uppercase tracking-wider">
                  5 Mandatory Rules for Writing on Pictures & Graphics
                </div>
                <div className="divide-y divide-slate-200 bg-white">
                  {onImageRules.map((r, i) => (
                    <div key={i} className="p-4 flex items-start gap-3 text-xs">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <div>
                        <h5 className="font-bold text-slate-900">{r.rule}</h5>
                        <p className="text-slate-600 mt-0.5 leading-relaxed">{r.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visual Do's & Don'ts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 space-y-2">
                  <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span>✅</span> DO (Design Best Practices):
                  </h4>
                  <ul className="text-xs space-y-2 text-emerald-900">
                    {doAndDont.map((d, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="font-bold shrink-0">✓</span>
                        <span className="leading-snug">{d.do}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/60 space-y-2">
                  <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span>❌</span> DON&rsquo;T (Avoid on Visuals):
                  </h4>
                  <ul className="text-xs space-y-2 text-rose-900">
                    {doAndDont.map((d, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="font-bold shrink-0">✕</span>
                        <span className="leading-snug">{d.dont}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: TEXT ON VIDEOS & MOTION                           */}
          {/* ========================================================= */}
          {activeTab === 'videos' && (
            <div className="space-y-6">
              {/* Top Banner */}
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-xs text-purple-950 space-y-1">
                <span className="font-extrabold uppercase tracking-wider block text-[11px]">
                  🎬 85% of Viewers Watch Videos on Mute:
                </span>
                <p className="leading-relaxed">
                  On-screen text overlays are essential for stopping the thumb scroll on Instagram Reels and LinkedIn feeds. You must hook viewers visually in the first 2 seconds, support dialogue with lower thirds, and close with a high-impact contact end card.
                </p>
              </div>

              {/* Video Timeline Text Architecture */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-900 text-white p-3 text-xs font-bold uppercase tracking-wider">
                  Chronological Video Typography Blueprint (Reels & Short-Form Video)
                </div>
                <div className="divide-y divide-slate-200 bg-white">
                  {onVideoRules.map((v, i) => (
                    <div key={i} className="p-4 flex items-start gap-3.5 text-xs">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 font-bold flex items-center justify-center shrink-0 text-xs">
                        {i === 0 ? '0:00' : i === 1 ? '0:05' : i === 2 ? '0:15' : 'END'}
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-900 text-xs">{v.rule}</h5>
                        <p className="text-slate-600 mt-0.5 leading-relaxed text-xs">{v.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Overlay Examples for Video Editors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 3-Second Hook Example */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-900 text-white space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-[10px] font-bold text-amber-400 uppercase font-mono">Hook Overlay (0:00–0:03)</span>
                    <span className="text-[10px] text-slate-400">Centered in safe box</span>
                  </div>
                  <div className="bg-amber-400 text-slate-950 font-black text-center p-3 rounded-lg shadow-sm text-sm uppercase leading-tight tracking-tight">
                    CAN YOUR EXCAVATOR SURVIVE 52°C SUMMER HEAT?
                  </div>
                  <p className="text-[11px] text-slate-400 text-center">
                    Rendered in high-contrast yellow pill container with slight drop shadow. Instantly legible on muted mobile screen.
                  </p>
                </div>

                {/* Lower-Third Engineer ID Example */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-900 text-white space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase font-mono">Lower-Third Speaker Card</span>
                    <span className="text-[10px] text-slate-400">Bottom-left 15% safe area</span>
                  </div>
                  <div className="border-l-4 border-amber-400 bg-slate-800/90 p-2.5 rounded-r-lg space-y-0.5">
                    <p className="text-xs font-bold text-white">Eng. Ahmad Al-Kandari</p>
                    <p className="text-[10px] text-slate-300">Certified Komatsu Master Specialist | Dar Al Hay Kuwait</p>
                  </div>
                  <p className="text-[11px] text-slate-400 text-center">
                    Clean 2-line lower third with Komatsu brand accent line. In-screen duration: 3.5 seconds.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: READY-TO-USE COPY & BADGE LIBRARY                 */}
          {/* ========================================================= */}
          {activeTab === 'library' && (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-950 space-y-1">
                <span className="font-extrabold uppercase tracking-wider block text-[11px]">
                  📋 Click-to-Copy Headline & Badge Library:
                </span>
                <p className="leading-relaxed">
                  Need quick copy to put on a graphic or video thumbnail? Click any item below to copy directly into Photoshop, Premiere, Canva, or Figma.
                </p>
              </div>

              {/* Ready Headline Pairs */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Bilingual Headline Pairs for Images & Video Hooks
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {headlineTemplates.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-amber-400 hover:shadow-xs transition-all space-y-2 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">{item.category}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(`${item.en} | ${item.ar}`, `h-${idx}`)}
                          className="text-[11px] font-bold text-amber-700 hover:underline cursor-pointer"
                        >
                          {copiedText === `h-${idx}` ? '✓ Copied' : '📋 Copy'}
                        </button>
                      </div>

                      <p className="text-xs font-black text-slate-900 leading-snug">{item.en}</p>
                      <p className="text-xs font-bold text-slate-700 leading-snug" dir="rtl">{item.ar}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Badge Presets */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Ready-to-Use Technical Badges & Tags
                </h4>

                <div className="flex flex-wrap gap-2">
                  {badgePresets.map((b, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleCopy(b, `b-${idx}`)}
                      title="Click to copy badge text"
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-amber-100 hover:border-amber-400 text-xs font-mono font-bold text-slate-800 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>🏷️</span>
                      <span>{b}</span>
                      {copiedText === `b-${idx}` && <span className="text-emerald-700 text-[10px] font-sans">✓ Copied!</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Dar Al Hay Media & Creative Guidelines • Komatsu Official Kuwait Distributor</span>
          <Button type="button" variant="primary" onClick={onClose} className="!bg-slate-900 !text-white text-xs !font-bold cursor-pointer">
            Got It, Back to Studio
          </Button>
        </div>
      </div>
    </div>
  );
}
