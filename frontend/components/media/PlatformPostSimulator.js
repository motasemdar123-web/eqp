'use client';

import React, { useState } from 'react';
import Badge from '../ui/Badge';

export default function PlatformPostSimulator({ concept }) {
  const [activePlatform, setActivePlatform] = useState(
    concept?.platforms?.[0] || 'instagram'
  );
  const [activeLang, setActiveLang] = useState('en'); // 'en' | 'ar'
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!concept) return null;

  const isCarousel = concept.format === 'carousel' && concept.slides?.length > 0;
  const caption = activeLang === 'en' ? concept.captionEn : concept.captionAr;

  return (
    <div className="bg-slate-900 rounded-2xl p-5 text-white border border-slate-700 shadow-xl space-y-4">
      {/* Platform Simulator Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Live Mockup Preview:</span>
          <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
            <button
              type="button"
              onClick={() => setActivePlatform('instagram')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                activePlatform === 'instagram' ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              📸 Instagram
            </button>
            <button
              type="button"
              onClick={() => setActivePlatform('linkedin')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                activePlatform === 'linkedin' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              💼 LinkedIn
            </button>
            <button
              type="button"
              onClick={() => setActivePlatform('facebook')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                activePlatform === 'facebook' ? 'bg-blue-500 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              👥 Facebook
            </button>
          </div>
        </div>

        {/* Language Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-800 p-0.5 rounded-lg border border-slate-700 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveLang('en')}
            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
              activeLang === 'en' ? 'bg-amber-500 text-slate-950 font-extrabold' : 'text-slate-400 hover:text-white'
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setActiveLang('ar')}
            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
              activeLang === 'ar' ? 'bg-amber-500 text-slate-950 font-extrabold' : 'text-slate-400 hover:text-white'
            }`}
          >
            العربية
          </button>
        </div>
      </div>

      {/* Render Realistic Mockup based on Platform */}
      <div className="max-w-md mx-auto">
        {activePlatform === 'instagram' && (
          <div className="bg-black text-white rounded-2xl border border-neutral-800 overflow-hidden shadow-2xl">
            {/* IG Header */}
            <div className="p-3 flex items-center justify-between border-b border-neutral-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 p-0.5">
                  <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center text-xs font-bold text-amber-400">
                    DH
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold leading-tight">daralhay_komatsu</p>
                  <p className="text-[10px] text-neutral-400">Kuwait City, Kuwait</p>
                </div>
              </div>
              <span className="text-neutral-400 text-sm">•••</span>
            </div>

            {/* IG Media Frame */}
            <div className="relative aspect-square bg-neutral-900 flex flex-col items-center justify-center text-center p-6 border-b border-neutral-800/60 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 z-10" />
              
              {/* Background Graphic Element */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl" />

              {/* Media Content Body */}
              <div className="relative z-20 space-y-3">
                {isCarousel ? (
                  <div className="space-y-2">
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider border border-amber-500/30">
                      Slide {currentSlide + 1} of {concept.slides.length}
                    </span>
                    <h4 className="text-base font-extrabold text-white">
                      {concept.slides[currentSlide]?.title}
                    </h4>
                    <p className="text-xs text-neutral-300 leading-relaxed max-w-xs mx-auto">
                      {concept.slides[currentSlide]?.body}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <span className="text-3xl">🚜</span>
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider">
                      {concept.format.toUpperCase()}
                    </span>
                    <h4 className="text-sm font-extrabold text-white">
                      {concept.title}
                    </h4>
                    <p className="text-[11px] text-neutral-300 italic max-w-xs mx-auto">
                      "{concept.hook}"
                    </p>
                  </div>
                )}
              </div>

              {/* Carousel Next/Prev Controls */}
              {isCarousel && (
                <div className="absolute inset-x-2 bottom-3 z-30 flex items-center justify-between">
                  <button
                    type="button"
                    disabled={currentSlide === 0}
                    onClick={() => setCurrentSlide((p) => Math.max(0, p - 1))}
                    className="w-7 h-7 rounded-full bg-black/60 text-white disabled:opacity-20 flex items-center justify-center text-xs"
                  >
                    ‹
                  </button>
                  <div className="flex gap-1">
                    {concept.slides.map((_, idx) => (
                      <span
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full ${
                          currentSlide === idx ? 'bg-amber-400 w-3' : 'bg-white/40'
                        } transition-all`}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={currentSlide === concept.slides.length - 1}
                    onClick={() => setCurrentSlide((p) => Math.min(concept.slides.length - 1, p + 1))}
                    className="w-7 h-7 rounded-full bg-black/60 text-white disabled:opacity-20 flex items-center justify-center text-xs"
                  >
                    ›
                  </button>
                </div>
              )}
            </div>

            {/* IG Interaction Bar */}
            <div className="p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between text-base">
                <div className="flex items-center gap-3">
                  <span>❤️</span>
                  <span>💬</span>
                  <span>↗️</span>
                </div>
                <span>🔖</span>
              </div>
              <p className="text-[11px] font-bold">1,428 likes</p>
              
              {/* Caption */}
              <div className="text-[11px] leading-relaxed text-neutral-200">
                <span className="font-bold text-white mr-1.5">daralhay_komatsu</span>
                <span className="whitespace-pre-line" dir={activeLang === 'ar' ? 'rtl' : 'ltr'}>
                  {caption}
                </span>
                <p className="mt-2 text-amber-400 font-mono text-[10px]">{concept.hashtags}</p>
              </div>
            </div>
          </div>
        )}

        {activePlatform === 'linkedin' && (
          <div className="bg-white text-slate-900 rounded-xl border border-slate-200 overflow-hidden shadow-2xl">
            {/* LinkedIn Header */}
            <div className="p-3.5 flex items-start justify-between border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-900 text-white flex items-center justify-center font-bold text-sm">
                  DH
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-bold text-slate-900">Dar Al Hay Commercial Co. (Komatsu Kuwait)</p>
                    <span className="text-[10px] text-blue-600">✓</span>
                  </div>
                  <p className="text-[10px] text-slate-500">24,500 followers • Heavy Machinery & Engineering</p>
                  <p className="text-[10px] text-slate-400">Just now • 🌐</p>
                </div>
              </div>
              <span className="text-slate-400 text-xs font-bold">•••</span>
            </div>

            {/* Post Text */}
            <div className="p-3.5 text-xs text-slate-800 leading-relaxed" dir={activeLang === 'ar' ? 'rtl' : 'ltr'}>
              <p className="font-bold text-slate-900 mb-1">{concept.hook}</p>
              <p className="whitespace-pre-line text-slate-700">{caption}</p>
              <p className="mt-2 text-blue-700 font-semibold">{concept.hashtags}</p>
            </div>

            {/* LinkedIn Visual Attachment */}
            <div className="bg-slate-900 text-white p-6 border-y border-slate-200 text-center space-y-2">
              <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold uppercase">
                {concept.format.toUpperCase()} ATTACHMENT
              </span>
              <h4 className="text-base font-bold text-white">{concept.title}</h4>
              <p className="text-xs text-slate-300 max-w-sm mx-auto">{concept.summary}</p>
            </div>

            {/* LinkedIn Footer Actions */}
            <div className="p-2.5 border-t border-slate-100 flex items-center justify-around text-xs font-semibold text-slate-600">
              <span className="hover:text-blue-600 cursor-pointer">👍 Like</span>
              <span className="hover:text-blue-600 cursor-pointer">💬 Comment</span>
              <span className="hover:text-blue-600 cursor-pointer">🔄 Repost</span>
              <span className="hover:text-blue-600 cursor-pointer">📤 Send</span>
            </div>
          </div>
        )}

        {activePlatform === 'facebook' && (
          <div className="bg-white text-slate-900 rounded-xl border border-slate-200 overflow-hidden shadow-2xl">
            {/* FB Header */}
            <div className="p-3.5 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  DH
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Dar Al Hay - Komatsu Kuwait</p>
                  <p className="text-[10px] text-slate-500">Sponsored / Official • 🌐</p>
                </div>
              </div>
              <span className="text-slate-400 text-sm">•••</span>
            </div>

            {/* FB Caption */}
            <div className="p-3.5 text-xs text-slate-800 leading-relaxed" dir={activeLang === 'ar' ? 'rtl' : 'ltr'}>
              <p className="whitespace-pre-line">{caption}</p>
              <p className="mt-2 text-blue-600 font-semibold">{concept.hashtags}</p>
            </div>

            {/* FB Media Banner */}
            <div className="bg-slate-900 text-white p-5 border-y border-slate-200 space-y-1.5">
              <span className="text-[10px] font-bold text-amber-400 uppercase">Dar Al Hay Heavy Equipment</span>
              <h4 className="text-sm font-bold text-white">{concept.title}</h4>
              <p className="text-[11px] text-slate-300">{concept.ctaText}</p>
            </div>

            {/* FB Action Bar */}
            <div className="p-2.5 flex items-center justify-around text-xs font-semibold text-slate-600 border-t border-slate-100">
              <span>👍 Like</span>
              <span>💬 Comment</span>
              <span>↗️ Share</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
