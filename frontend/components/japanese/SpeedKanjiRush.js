'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { N5_KANJI, N4_KANJI } from '../../lib/japaneseData';
import { MACHINE_COMPONENTS } from '../../lib/japanese/machinePartsData';

function speak(text) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP';
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

const GAME_DURATION = 60; // 60 seconds

export default function SpeedKanjiRush({ level = 'N5', onToast }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [currentCard, setCurrentCard] = useState(null);
  const [options, setOptions] = useState([]);
  const [history, setHistory] = useState([]); // tracks correct & wrong for end screen
  const [highScore, setHighScore] = useState(0);

  const timerRef = useRef(null);

  // Load high score from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`kanji_rush_high_score_${level}`);
      if (saved) setHighScore(parseInt(saved, 10));
    } catch {}
  }, [level]);

  // Combine JLPT level kanji + technical parts
  const pool = useMemo(() => {
    const baseKanji = (level === 'N5' ? N5_KANJI : N4_KANJI).map((k) => ({
      kanji: k.kanji,
      reading: `${k.onyomi || ''} / ${k.kunyomi || ''}`.trim(),
      meaning: k.meaning,
      category: 'JLPT'
    }));

    const technical = MACHINE_COMPONENTS.map((m) => ({
      kanji: m.kanji,
      reading: m.reading,
      meaning: m.english,
      category: 'Technical'
    }));

    return [...baseKanji, ...technical];
  }, [level]);

  // Pick next random question
  const generateQuestion = () => {
    if (pool.length === 0) return;
    const correct = pool[Math.floor(Math.random() * pool.length)];

    // 3 wrong answers
    const wrong = pool
      .filter((p) => p.kanji !== correct.kanji && p.meaning !== correct.meaning)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    const allOptions = [correct, ...wrong].sort(() => 0.5 - Math.random());
    setCurrentCard(correct);
    setOptions(allOptions);
  };

  const startGame = () => {
    setIsPlaying(true);
    setTimeLeft(GAME_DURATION);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setHistory([]);
    generateQuestion();

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setIsPlaying(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // When game finishes, check high score
  useEffect(() => {
    if (!isPlaying && timeLeft === 0) {
      if (score > highScore) {
        setHighScore(score);
        try {
          localStorage.setItem(`kanji_rush_high_score_${level}`, String(score));
        } catch {}
        onToast?.(`🏆 NEW HIGH SCORE! ${score} Points!`, 'success');
      }
    }
  }, [isPlaying, timeLeft, score, highScore, level]);

  const handleSelectOption = (opt) => {
    if (!isPlaying || !currentCard) return;

    const isCorrect = opt.kanji === currentCard.kanji;
    if (isCorrect) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      if (newCombo > maxCombo) setMaxCombo(newCombo);
      const points = 100 + newCombo * 20;
      setScore((s) => s + points);
      speak(currentCard.kanji);
      setHistory((prev) => [...prev, { card: currentCard, isCorrect: true }]);
    } else {
      setCombo(0);
      setHistory((prev) => [...prev, { card: currentCard, isCorrect: false, userChoice: opt.meaning }]);
    }

    generateQuestion();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-slate-900 via-rose-950/70 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-rose-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none text-9xl font-bold font-mono">
          RUSH
        </div>
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="bg-rose-500/20 text-rose-300 border border-rose-400/30 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              60-Second Arcade Mode
            </span>
            <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold px-2.5 py-1 rounded-full">
              スピード漢字ラッシュ
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Speed Kanji & Technical Parts Blitz (漢字ラッシュ)
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Test your instant recognition speed under pressure. Match JLPT {level} and Komatsu Technical Kanji before the 60-second clock expires. Build combo streaks for score multipliers!
          </p>

          <div className="flex items-center gap-4 pt-2">
            <div className="bg-slate-800/80 px-3.5 py-1.5 rounded-xl border border-slate-700 text-xs font-bold">
              👑 High Score: <strong className="text-amber-400 font-mono text-sm">{highScore}</strong> pts
            </div>
            {!isPlaying && (
              <Button
                variant="primary"
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-6 shadow-md text-sm"
                onClick={startGame}
              >
                ⚡ Start 60s Rush!
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ACTIVE GAME ARENA */}
      {isPlaying ? (
        <Card className="p-6 space-y-6 border-slate-200 bg-linear-to-b from-slate-50 to-white shadow-md">
          {/* Top Timer & Score Bar */}
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-rose-100 text-rose-900 px-3.5 py-1.5 rounded-xl font-mono font-black text-base border border-rose-200">
                <span>⏱️</span>
                <span>{timeLeft}s</span>
              </div>
              {combo > 1 && (
                <span className="bg-amber-500 text-slate-950 font-black text-xs px-2.5 py-1 rounded-full animate-bounce shadow-xs">
                  🔥 {combo}x COMBO!
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Score:</span>
              <span className="text-2xl font-black text-slate-900 font-mono">{score}</span>
            </div>
          </div>

          {/* Target Kanji Display Card */}
          {currentCard && (
            <div className="text-center py-8 bg-slate-900 rounded-2xl text-white space-y-2 border border-slate-800 shadow-inner">
              <span className="text-6xl sm:text-7xl font-black tracking-widest text-amber-400 block font-serif">
                {currentCard.kanji}
              </span>
              <span className="text-xs font-mono text-slate-400 block">
                {currentCard.reading}
              </span>
              <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-800 px-2 py-0.5 rounded-full inline-block">
                {currentCard.category}
              </span>
            </div>
          )}

          {/* 4 Option Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectOption(opt)}
                className="p-4 bg-white border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 hover:shadow-md rounded-xl text-left transition-all font-bold text-slate-800 cursor-pointer flex items-center justify-between text-sm group"
              >
                <span>{opt.meaning}</span>
                <span className="text-slate-300 group-hover:text-amber-500 text-xs">➔</span>
              </button>
            ))}
          </div>
        </Card>
      ) : (
        /* GAME OVER / IDLE SUMMARY */
        history.length > 0 && (
          <Card className="p-6 space-y-6 border-slate-200">
            <div className="text-center space-y-3 border-b pb-6">
              <span className="text-4xl">🏁</span>
              <h3 className="text-2xl font-black text-slate-900">Time's Up! Game Over</h3>
              <div className="flex justify-center items-center gap-6 pt-2">
                <div className="text-center">
                  <span className="text-xs font-bold text-slate-400 block">Final Score</span>
                  <span className="text-3xl font-black text-amber-600 font-mono">{score}</span>
                </div>
                <div className="text-center">
                  <span className="text-xs font-bold text-slate-400 block">Max Combo</span>
                  <span className="text-3xl font-black text-rose-600 font-mono">{maxCombo}x</span>
                </div>
                <div className="text-center">
                  <span className="text-xs font-bold text-slate-400 block">Accuracy</span>
                  <span className="text-3xl font-black text-emerald-600 font-mono">
                    {Math.round((history.filter((h) => h.isCorrect).length / history.length) * 100) || 0}%
                  </span>
                </div>
              </div>

              <div className="pt-4 flex justify-center gap-3">
                <Button
                  variant="primary"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-8 shadow-md"
                  onClick={startGame}
                >
                  ⚡ Play Again
                </Button>
              </div>
            </div>

            {/* Performance Review List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Session Review ({history.length} Questions Answered)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-80 overflow-y-auto pr-1">
                {history.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                      item.isCorrect
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                        : 'bg-rose-50/60 border-rose-200 text-rose-950'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-sm">{item.card.kanji}</span>
                        <span className="text-[11px] opacity-80 font-mono">({item.card.reading})</span>
                      </div>
                      <span className="text-xs font-medium block">{item.card.meaning}</span>
                    </div>
                    <span className="text-base">{item.isCorrect ? '✅' : '❌'}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )
      )}
    </div>
  );
}
