'use client';

import { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { SENTENCE_SCRAMBLER_DATA } from '../../lib/japanese/sentenceBuilderData';

function speak(text) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP';
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
}

export default function SentenceScramblerGame({ level = 'N5', onToast }) {
  const puzzles = SENTENCE_SCRAMBLER_DATA[level] || SENTENCE_SCRAMBLER_DATA.N5;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [placedTokens, setPlacedTokens] = useState([]);
  const [availableTokens, setAvailableTokens] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);

  const currentPuzzle = puzzles[currentIdx];

  // Initialize and shuffle tokens for current puzzle
  useEffect(() => {
    if (!currentPuzzle) return;
    // Shuffle copy of tokens
    const shuffled = [...currentPuzzle.tokens].sort(() => Math.random() - 0.5);
    setAvailableTokens(shuffled);
    setPlacedTokens([]);
    setIsSubmitted(false);
    setIsCorrect(false);
  }, [currentIdx, level, currentPuzzle]);

  const handleSelectToken = (token, fromIdx) => {
    if (isSubmitted) return;
    setPlacedTokens((prev) => [...prev, token]);
    setAvailableTokens((prev) => prev.filter((_, idx) => idx !== fromIdx));
  };

  const handleRemoveToken = (token, fromIdx) => {
    if (isSubmitted) return;
    setPlacedTokens((prev) => prev.filter((_, idx) => idx !== fromIdx));
    setAvailableTokens((prev) => [...prev, token]);
  };

  const handleCheckAnswer = () => {
    if (placedTokens.length !== currentPuzzle.correctOrder.length) {
      onToast?.('Please place all word blocks into the slots first.', 'warning');
      return;
    }

    const assembled = placedTokens.join('');
    const correctStr = currentPuzzle.correctOrder.join('');
    const matches = assembled === correctStr;

    setIsSubmitted(true);
    setIsCorrect(matches);

    if (matches) {
      setScore((prev) => prev + 1);
      onToast?.('🎉 正解！ Correct sentence structure!', 'success');
      speak(correctStr);
    } else {
      onToast?.('❌ Not quite right. Review the grammar explanation below.', 'error');
    }
  };

  const handleNext = () => {
    if (currentIdx + 1 < puzzles.length) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      onToast?.(`🏆 All ${level} Sentence Puzzles Completed! Score: ${score + (isCorrect ? 1 : 0)} / ${puzzles.length}`, 'success');
      setCurrentIdx(0);
      setScore(0);
    }
  };

  const handleReset = () => {
    const shuffled = [...currentPuzzle.tokens].sort(() => Math.random() - 0.5);
    setAvailableTokens(shuffled);
    setPlacedTokens([]);
    setIsSubmitted(false);
    setIsCorrect(false);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header Info */}
      <div className="bg-linear-to-r from-amber-500/10 via-indigo-500/10 to-amber-500/10 border border-amber-200/80 rounded-2xl p-6 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="primary" className="bg-amber-600 text-white font-bold">
              JLPT {level} Grammar (星マーク問題)
            </Badge>
            <span className="text-xs text-slate-500 font-semibold">
              Mondai 2 Sentence Composition Drill
            </span>
          </div>
          <span className="text-xs font-bold text-slate-700 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-xs">
            Puzzle {currentIdx + 1} of {puzzles.length}
          </span>
        </div>
        <h3 className="text-lg font-black text-slate-900">
          Sentence Builder & Particle Scrambler (並び替えゲーム)
        </h3>
        <p className="text-xs text-slate-600">
          Click the words below in the correct grammatical order to complete the sentence. In the official JLPT exam, finding which word goes into the <strong className="text-amber-600">★ Star slot</strong> is the key to earning full marks!
        </p>
      </div>

      {/* Main Puzzle Card */}
      <Card className="p-6 space-y-6 bg-white shadow-md border border-slate-200">
        {/* Target English Meaning */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Target Meaning
          </div>
          <div className="text-base font-bold text-slate-800">
            "{currentPuzzle.promptEnglish}"
          </div>
        </div>

        {/* Sentence Assembly Slots */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Constructed Sentence (Click words to remove):</span>
            <span className="text-amber-600 font-bold">★ = JLPT Key Target Slot</span>
          </div>

          <div className="min-h-16 p-4 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/30 flex flex-wrap items-center gap-3 justify-center">
            {placedTokens.length === 0 ? (
              <span className="text-sm text-slate-400 italic">
                (Click the word blocks below to place them here...)
              </span>
            ) : (
              placedTokens.map((tok, idx) => {
                const isStar = idx === currentPuzzle.starPosition;
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isSubmitted}
                    onClick={() => handleRemoveToken(tok, idx)}
                    className={`relative px-4 py-2.5 rounded-xl font-medium text-sm shadow-xs transition-all flex items-center gap-1.5 ${
                      isStar
                        ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400 font-semibold scale-105'
                        : 'bg-white text-slate-900 border border-slate-300 hover:border-rose-400 hover:bg-rose-50'
                    }`}
                  >
                    {isStar && <span className="text-xs">★</span>}
                    <span>{tok}</span>
                    <span className="text-[10px] text-slate-400 ml-1">✕</span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Available Word Blocks */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Available Words / Particles (Click to add):
          </div>

          <div className="flex flex-wrap gap-2.5 justify-center min-h-12 p-3 bg-slate-50 rounded-xl border border-slate-200">
            {availableTokens.length === 0 ? (
              <span className="text-xs text-slate-400 italic self-center">
                All words have been placed. Ready to check!
              </span>
            ) : (
              availableTokens.map((tok, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectToken(tok, idx)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium shadow-xs hover:scale-105 transition-all"
                >
                  {tok}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={placedTokens.length === 0}
            className="text-xs font-bold text-slate-600"
          >
            🔄 Clear & Reset
          </Button>

          <div className="flex items-center gap-2">
            {!isSubmitted ? (
              <Button
                variant="primary"
                onClick={handleCheckAnswer}
                disabled={placedTokens.length !== currentPuzzle.correctOrder.length}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2"
              >
                Check Answer ✓
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleNext}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2"
              >
                Next Puzzle →
              </Button>
            )}
          </div>
        </div>

        {/* Feedback and Grammar Explanation */}
        {isSubmitted && (
          <div
            className={`p-5 rounded-2xl border text-sm space-y-3 ${
              isCorrect
                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                : 'bg-rose-50/80 border-rose-300 text-rose-950'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="font-bold text-base flex items-center gap-2">
                <span>{isCorrect ? '✨ 正解！ Excellent syntax!' : '❌ Incorrect word order'}</span>
              </div>
              <button
                type="button"
                onClick={() => speak(currentPuzzle.correctOrder.join(''))}
                className="px-3 py-1 bg-white rounded-lg text-xs font-bold text-indigo-700 border border-indigo-200 shadow-xs flex items-center gap-1 hover:bg-indigo-50"
              >
                <span>🔊 Listen Sentence</span>
              </button>
            </div>

            <div className="bg-white/80 p-3 rounded-xl border border-slate-200 space-y-1">
              <div className="text-xs font-bold text-slate-500 uppercase">Correct Full Sentence:</div>
              <div className="text-base font-semibold text-slate-900">
                {currentPuzzle.correctOrder.join(' ')}
              </div>
              <div className="text-xs text-amber-700 font-bold mt-1">
                ★ Star Slot ({currentPuzzle.starPosition + 1}番): 「{currentPuzzle.correctOrder[currentPuzzle.starPosition]}」
              </div>
            </div>

            <div className="space-y-1 text-xs leading-relaxed">
              <div className="font-bold text-slate-800">Grammar Pattern: {currentPuzzle.grammarRule}</div>
              <p className="text-slate-700">{currentPuzzle.explanation}</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
