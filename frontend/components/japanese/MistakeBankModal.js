'use client';

import { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

function speak(text) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP';
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
}

export default function MistakeBankModal({ onToast }) {
  const [missedQuestions, setMissedQuestions] = useState([]);
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [drillMode, setDrillMode] = useState(false);
  const [drillIdx, setDrillIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('jlpt_missed_questions');
      if (stored) {
        setMissedQuestions(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load missed questions', e);
    }
  }, []);

  const saveMissedQuestions = (list) => {
    setMissedQuestions(list);
    try {
      localStorage.setItem('jlpt_missed_questions', JSON.stringify(list));
    } catch (e) {
      console.error('Failed to save missed questions', e);
    }
  };

  const handleRemoveQuestion = (id) => {
    const updated = missedQuestions.filter((q) => q.id !== id);
    saveMissedQuestions(updated);
    onToast?.('Question removed from error vault.', 'neutral');
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all recorded mistakes?')) {
      saveMissedQuestions([]);
      onToast?.('Error vault cleared.', 'neutral');
    }
  };

  const filtered = missedQuestions.filter((q) => {
    const matchesLevel = filterLevel === 'ALL' || q.level === filterLevel;
    const matchesType = filterType === 'ALL' || (q.type && q.type.includes(filterType));
    return matchesLevel && matchesType;
  });

  // Drill handling
  const handleDrillAnswer = (optIdx) => {
    if (showExplanation) return;
    setSelectedOpt(optIdx);
    setShowExplanation(true);
    const currentQ = filtered[drillIdx];
    if (optIdx === currentQ.correct) {
      onToast?.('✨ 正解！ Mastered and removed from Error Vault!', 'success');
      // Remove from list
      const updated = missedQuestions.filter((q) => q.id !== currentQ.id);
      saveMissedQuestions(updated);
    } else {
      onToast?.('❌ Still incorrect. Check explanation below.', 'error');
    }
  };

  const handleDrillNext = () => {
    setSelectedOpt(null);
    setShowExplanation(false);
    if (drillIdx + 1 < filtered.length) {
      setDrillIdx((prev) => prev + 1);
    } else {
      setDrillMode(false);
      setDrillIdx(0);
      onToast?.('🎉 Weak Point Drill Completed!', 'success');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-rose-950 via-slate-900 to-rose-950 rounded-2xl p-6 text-white shadow-xl border border-rose-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="bg-rose-500/20 text-rose-300 border border-rose-400/30 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              Weak Point Drill & Error Vault
            </span>
            <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold px-2.5 py-1 rounded-full">
              弱点復習ノート
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            Targeted Mistake Bank ({missedQuestions.length} Items Saved)
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Every question you answer incorrectly during full mock exams or practice drills is automatically archived here. Practice targeted drills to eliminate recurring errors and guarantee a passing score.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {filtered.length > 0 && !drillMode && (
            <Button
              variant="primary"
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-5 py-2.5 shadow-lg shadow-rose-900/40"
              onClick={() => {
                setDrillMode(true);
                setDrillIdx(0);
                setSelectedOpt(null);
                setShowExplanation(false);
              }}
            >
              ⚡ Launch Weakness Drill ({filtered.length})
            </Button>
          )}
          {missedQuestions.length > 0 && !drillMode && (
            <Button
              variant="outline"
              onClick={handleClearAll}
              className="border-slate-700 text-slate-400 hover:text-rose-300 text-xs"
            >
              🗑️ Clear All
            </Button>
          )}
        </div>
      </div>

      {!drillMode ? (
        <>
          {/* Filter Bar */}
          <div className="flex flex-wrap gap-2 items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-xs font-bold text-slate-500 mr-1">Level:</span>
              {['ALL', 'N5', 'N4'].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setFilterLevel(lvl)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    filterLevel === lvl
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-xs font-bold text-slate-500 mr-1">Section:</span>
              {['ALL', '言語知識', '読解', '聴解'].map((tp) => (
                <button
                  key={tp}
                  type="button"
                  onClick={() => setFilterType(tp)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    filterType === tp
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tp}
                </button>
              ))}
            </div>
          </div>

          {/* Questions List */}
          {filtered.length === 0 ? (
            <Card className="p-12 text-center space-y-3 bg-white border border-dashed border-slate-300">
              <div className="text-4xl">🎯</div>
              <h3 className="text-base font-bold text-slate-800">
                {missedQuestions.length === 0
                  ? 'Your Error Vault is Clean!'
                  : 'No questions match the selected filters.'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {missedQuestions.length === 0
                  ? 'Take a JLPT Mock Exam or Vocabulary Quiz. Any missed questions will be automatically collected here for targeted review.'
                  : 'Try changing the level or section filter above.'}
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filtered.map((q, idx) => (
                <Card key={q.id || idx} className="p-5 border border-slate-200 bg-white space-y-4 shadow-xs">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="primary" className="text-xs font-bold">
                        {q.level || 'JLPT'}
                      </Badge>
                      <span className="text-xs font-bold text-slate-600">{q.type || 'Question'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(q.id)}
                      className="text-xs text-slate-400 hover:text-rose-600 font-semibold p-1"
                      title="Dismiss from error vault"
                    >
                      ✓ Mark Mastered (Remove)
                    </button>
                  </div>

                  <div className="text-sm font-bold text-slate-900 leading-relaxed flex items-baseline justify-between">
                    <span>{q.question}</span>
                    <button
                      type="button"
                      onClick={() => speak(q.question)}
                      className="text-slate-400 hover:text-indigo-600 text-xs ml-2 shrink-0"
                    >
                      🔊
                    </button>
                  </div>

                  {q.audioSrc && (
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <audio controls src={q.audioSrc} className="w-full h-8" />
                    </div>
                  )}

                  {q.image && (
                    <div className="flex justify-center p-2 bg-slate-50 rounded-xl border border-slate-200">
                      <img src={q.image} alt="Question Illustration" className="max-h-48 object-contain" />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {q.options?.map((opt, oIdx) => {
                      const isCorrect = oIdx === q.correct;
                      return (
                        <div
                          key={oIdx}
                          className={`p-2.5 rounded-lg border flex items-center justify-between font-medium ${
                            isCorrect
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <span>{opt}</span>
                          {isCorrect && <span className="text-emerald-700 font-bold">✓ Correct Key</span>}
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <div className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-100 text-xs text-indigo-950">
                      <span className="font-bold text-indigo-900">💡 Explanation: </span>
                      {q.explanation}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Drill Mode */
        <Card className="p-6 max-w-2xl mx-auto space-y-6 bg-white shadow-xl border border-rose-100">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
                Weak Point Retest: {drillIdx + 1} of {filtered.length}
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-0.5">
                {filtered[drillIdx].type || 'JLPT Question'}
              </h3>
            </div>
            <Button
              variant="outline"
              className="text-xs text-slate-600"
              onClick={() => setDrillMode(false)}
            >
              ✕ Exit Drill
            </Button>
          </div>

          <div className="text-sm font-bold text-slate-900 bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed">
            {filtered[drillIdx].question}
          </div>

          {filtered[drillIdx].audioSrc && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <audio controls src={filtered[drillIdx].audioSrc} className="w-full h-8" />
            </div>
          )}

          {filtered[drillIdx].image && (
            <div className="flex justify-center p-2 bg-slate-50 rounded-xl border border-slate-200">
              <img src={filtered[drillIdx].image} alt="Illustration" className="max-h-48 object-contain" />
            </div>
          )}

          <div className="grid grid-cols-1 gap-2.5">
            {filtered[drillIdx].options?.map((opt, oIdx) => {
              const isCorrect = oIdx === filtered[drillIdx].correct;
              const isSelected = selectedOpt === oIdx;

              let btnStyle = 'border-slate-200 hover:bg-slate-50 text-slate-800 bg-white';
              if (showExplanation) {
                if (isCorrect) {
                  btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold';
                } else if (isSelected) {
                  btnStyle = 'border-rose-500 bg-rose-50 text-rose-900 font-bold';
                } else {
                  btnStyle = 'border-slate-200 opacity-50 bg-white text-slate-500';
                }
              }

              return (
                <button
                  key={oIdx}
                  type="button"
                  disabled={showExplanation}
                  onClick={() => handleDrillAnswer(oIdx)}
                  className={`p-3.5 rounded-xl border-2 text-left text-sm font-medium transition-all flex items-center justify-between ${btnStyle}`}
                >
                  <span>{opt}</span>
                  {showExplanation && isCorrect && <span className="text-emerald-600 font-bold">✓ Mastered!</span>}
                  {showExplanation && isSelected && !isCorrect && <span className="text-rose-600 font-bold">✗ Incorrect</span>}
                </button>
              );
            })}
          </div>

          {showExplanation && (
            <div className="bg-indigo-50/80 p-4 rounded-xl border border-indigo-200 text-xs text-indigo-950 space-y-2">
              <div className="font-bold text-indigo-900">💡 Explanation:</div>
              <p className="leading-relaxed">{filtered[drillIdx].explanation}</p>
              <div className="pt-2 flex justify-end">
                <Button
                  variant="primary"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                  onClick={handleDrillNext}
                >
                  {drillIdx + 1 < filtered.length ? 'Next Question →' : 'Finish Retest 🎉'}
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
