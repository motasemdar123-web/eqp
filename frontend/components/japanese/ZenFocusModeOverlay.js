'use client';

import { useState, useEffect, useRef } from 'react';
import Button from '../ui/Button';

// Gentle Zen chime synthesizer via Web Audio API
function playZenChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(528, ctx.currentTime); // 528 Hz (Solffeggio "Miracle / Focus" frequency)
    osc.frequency.exponentialRampToValueAtTime(1056, ctx.currentTime + 1.2);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 2.5);
  } catch (e) {
    console.error('Audio chime error:', e);
  }
}

const STUDY_TOOLS = [
  { id: 'flashcards', label: '📇 Flashcard Dojo (SRS)', pillar: 'foundations' },
  { id: 'kanji', label: '⛩️ Kanji Matrix & Canvas', pillar: 'foundations' },
  { id: 'grammar', label: '📖 Grammar Master', pillar: 'foundations' },
  { id: 'vocab', label: '📚 Vocabulary Vault', pillar: 'foundations' },
  { id: 'exam', label: '⏱️ Full Mock Exams', pillar: 'exams' },
  { id: 'exam_admin', label: '🛠️ Exam Admin Studio (作成・管理)', pillar: 'exams' },
  { id: 'rush', label: '⚡ Speed Kanji Rush (60s)', pillar: 'exams' },
  { id: 'scramble', label: '🧩 Sentence Scrambler', pillar: 'exams' },
  { id: 'mistakes', label: '🎯 Error Vault', pillar: 'exams' },
  { id: 'parts_explorer', label: '🚜 Komatsu Parts Explorer', pillar: 'workplace' },
  { id: 'roleplay', label: '🗣️ Workshop Dialogue Coach', pillar: 'workplace' },
  { id: 'business_email', label: '✉️ Business Email & Keigo', pillar: 'workplace' },
  { id: 'technical', label: '🏭 5S & Safety Glossary', pillar: 'workplace' }
];

const THEMES = [
  { id: 'dark', label: 'Obsidian Night (深黒)', bg: 'bg-slate-950', cardBg: 'bg-slate-900', text: 'text-slate-100', border: 'border-slate-800' },
  { id: 'amber', label: 'Warm Matcha & Amber (和風琥珀)', bg: 'bg-[#181511]', cardBg: 'bg-[#221d17]', text: 'text-amber-100', border: 'border-amber-900/40' },
  { id: 'paper', label: 'Minimalist Paper (和紙白)', bg: 'bg-stone-100', cardBg: 'bg-white', text: 'text-stone-900', border: 'border-stone-200' }
];

export default function ZenFocusModeOverlay({
  isOpen,
  onClose,
  level,
  activeTab,
  onSelectTab,
  children,
  onToast
}) {
  const [themeId, setThemeId] = useState('dark');
  const [timerMode, setTimerMode] = useState('pomodoro'); // 'pomodoro' (25m) | 'short_break' (5m) | 'stopwatch'
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  const timerRef = useRef(null);
  const currentTheme = THEMES.find((t) => t.id === themeId) || THEMES[0];

  // Timer logic
  useEffect(() => {
    if (!isOpen) return;

    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (timerMode === 'stopwatch') {
            return prev + 1;
          }
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsTimerRunning(false);
            playZenChime();
            if (timerMode === 'pomodoro') {
              setSessionsCompleted((s) => s + 1);
              onToast?.('🔔 Focus interval complete! Take a 5-minute breather (休憩).', 'success');
              setTimerMode('short_break');
              return 5 * 60;
            } else {
              onToast?.('🔔 Break finished! Ready for the next focus session.', 'info');
              setTimerMode('pomodoro');
              return 25 * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, timerMode, isOpen, onToast]);

  // Keyboard shortcut: ESC to exit focus mode
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleSwitchTimerMode = (mode) => {
    setIsTimerRunning(false);
    setTimerMode(mode);
    if (mode === 'pomodoro') setTimerSeconds(25 * 60);
    else if (mode === 'short_break') setTimerSeconds(5 * 60);
    else if (mode === 'stopwatch') setTimerSeconds(0);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col overflow-hidden animate-fadeIn transition-colors duration-300 ${currentTheme.bg} ${currentTheme.text}`}
    >
      {/* Top Floating Zen Control Bar */}
      <header
        className={`shrink-0 px-4 py-3 border-b flex flex-wrap items-center justify-between gap-3 backdrop-blur-md bg-opacity-95 ${currentTheme.cardBg} ${currentTheme.border}`}
      >
        {/* Left: Zen Brand & Study Tool Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-black tracking-widest uppercase opacity-90 hidden sm:inline">
              ZEN FOCUS MODE
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              JLPT {level}
            </span>
          </div>

          {/* Tool Dropdown Switcher */}
          <div className="relative">
            <select
              value={activeTab}
              onChange={(e) => onSelectTab(e.target.value)}
              className={`text-xs font-bold py-1.5 px-3 rounded-xl border appearance-none pr-8 cursor-pointer focus:outline-hidden ${
                themeId === 'paper'
                  ? 'bg-stone-50 border-stone-300 text-stone-900'
                  : 'bg-slate-800 border-slate-700 text-slate-100'
              }`}
            >
              {STUDY_TOOLS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            <span className="absolute right-2.5 top-2 pointer-events-none text-xs opacity-60">▾</span>
          </div>
        </div>

        {/* Center: Pomodoro Focus Timer */}
        <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-xl border border-white/10">
          <div className="flex items-center gap-1 text-[11px] font-bold opacity-75">
            <button
              onClick={() => handleSwitchTimerMode('pomodoro')}
              className={`px-2 py-0.5 rounded ${timerMode === 'pomodoro' ? 'bg-amber-500 text-slate-950 font-black' : 'hover:opacity-100'}`}
            >
              25m
            </button>
            <button
              onClick={() => handleSwitchTimerMode('short_break')}
              className={`px-2 py-0.5 rounded ${timerMode === 'short_break' ? 'bg-emerald-500 text-slate-950 font-black' : 'hover:opacity-100'}`}
            >
              5m Break
            </button>
            <button
              onClick={() => handleSwitchTimerMode('stopwatch')}
              className={`px-2 py-0.5 rounded ${timerMode === 'stopwatch' ? 'bg-blue-500 text-white font-black' : 'hover:opacity-100'}`}
            >
              ⏱
            </button>
          </div>

          <span className="font-mono text-base font-black tracking-wider px-2">
            {formatTime(timerSeconds)}
          </span>

          <button
            type="button"
            onClick={() => setIsTimerRunning((r) => !r)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              isTimerRunning
                ? 'bg-rose-500 hover:bg-rose-600 text-white'
                : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950'
            }`}
          >
            {isTimerRunning ? '⏸ Pause' : '▶ Start'}
          </button>
        </div>

        {/* Right: Theme Selector & Exit Button */}
        <div className="flex items-center gap-2">
          {/* Theme Dropdown */}
          <div className="hidden md:flex items-center gap-1 text-xs">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setThemeId(t.id)}
                className={`px-2 py-1 rounded text-[11px] font-semibold border transition-all ${
                  themeId === t.id
                    ? 'border-amber-400 bg-amber-400/20 text-amber-300'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
                title={t.label}
              >
                {t.id === 'dark' ? '🌙 Dark' : t.id === 'amber' ? '🍵 Warm' : '📜 Paper'}
              </button>
            ))}
          </div>

          {/* Exit Focus Mode Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={onClose}
            className={`font-bold text-xs flex items-center gap-1.5 active:scale-95 ${
              themeId === 'paper'
                ? 'border-stone-400 text-stone-800 hover:bg-stone-200'
                : 'border-slate-700 text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span>✕ Exit Focus</span>
            <kbd className="hidden sm:inline-block text-[10px] opacity-60 font-mono bg-black/20 px-1 rounded">ESC</kbd>
          </Button>
        </div>
      </header>

      {/* Main Focus Canvas with Generous Centered Breathing Area */}
      <main className="flex-1 overflow-y-auto p-3 sm:p-6 max-w-4xl mx-auto w-full flex flex-col justify-center items-center">
        <div className="w-full my-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
