'use client';

import { useState } from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import {
  TECHNICAL_JAPANESE_CATEGORIES,
  TECHNICAL_JAPANESE_TERMS,
  TECHNICAL_QUIZ_QUESTIONS
} from '../../lib/japanese/technicalJapaneseData';

function speak(text) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP';
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
}

export default function TechnicalJapaneseHub({ onToast }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [quizMode, setQuizMode] = useState(false);
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  const filteredTerms = TECHNICAL_JAPANESE_TERMS.filter((term) => {
    const matchesCat = selectedCategory === 'all' || term.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      term.reading.toLowerCase().includes(searchQuery.toLowerCase()) ||
      term.english.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleQuizAnswer = (idx) => {
    if (showExplanation) return;
    setSelectedOption(idx);
    setShowExplanation(true);
    if (idx === TECHNICAL_QUIZ_QUESTIONS[currentQuizIdx].correct) {
      setQuizScore((prev) => prev + 1);
      onToast?.('✨ 正解！ Correct answer!', 'success');
    } else {
      onToast?.('❌ 不正解 - Check the explanation below', 'error');
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setShowExplanation(false);
    if (currentQuizIdx + 1 < TECHNICAL_QUIZ_QUESTIONS.length) {
      setCurrentQuizIdx((prev) => prev + 1);
    } else {
      onToast?.(`🎉 Factory Quiz Complete! Score: ${quizScore + (selectedOption === TECHNICAL_QUIZ_QUESTIONS[currentQuizIdx].correct ? 1 : 0)}/${TECHNICAL_QUIZ_QUESTIONS.length}`, 'success');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-indigo-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none text-9xl font-bold font-mono">
          5S
        </div>
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              Workplace & Technical Japanese
            </span>
            <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold px-2.5 py-1 rounded-full">
              工場・現場・5S
            </span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Factory, Equipment & Business Japanese (現場・保全・5S日本語)
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Master the essential Japanese vocabulary and protocols used across manufacturing floors, maintenance workshops, 5S audits, equipment inspections, and professional engineering reporting.
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              variant={!quizMode ? 'primary' : 'outline'}
              className={!quizMode ? 'bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold' : 'text-white border-slate-600'}
              onClick={() => setQuizMode(false)}
            >
              📖 Technical Glossary ({TECHNICAL_JAPANESE_TERMS.length} Terms)
            </Button>
            <Button
              variant={quizMode ? 'primary' : 'outline'}
              className={quizMode ? 'bg-indigo-600 hover:bg-indigo-700 text-white font-bold' : 'text-white border-slate-600'}
              onClick={() => {
                setQuizMode(true);
                setCurrentQuizIdx(0);
                setSelectedOption(null);
                setShowExplanation(false);
                setQuizScore(0);
              }}
            >
              🎯 Factory Protocol Quiz (5S & Safety)
            </Button>
          </div>
        </div>
      </div>

      {!quizMode ? (
        <>
          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2 items-center">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              All Categories ({TECHNICAL_JAPANESE_TERMS.length})
            </button>
            {TECHNICAL_JAPANESE_CATEGORIES.map((cat) => {
              const count = TECHNICAL_JAPANESE_TERMS.filter((t) => t.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    selectedCategory === cat.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedCategory === cat.id ? 'bg-indigo-800' : 'bg-slate-100'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by Kanji (点検), Reading (てんけん), or English (Inspection)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white shadow-xs"
            />
            <span className="absolute left-3.5 top-3 text-slate-400">🔍</span>
          </div>

          {/* Term Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTerms.map((t) => (
              <Card key={t.id} className="p-5 hover:shadow-md transition-all border border-slate-200/80 bg-white flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900 tracking-tight">{t.term}</span>
                        <button
                          type="button"
                          onClick={() => speak(t.term)}
                          className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Listen pronunciation"
                        >
                          🔊
                        </button>
                      </div>
                      <div className="text-xs font-semibold text-indigo-600 mt-0.5">{t.reading}</div>
                    </div>
                    <Badge variant="neutral" className="text-[10px] font-bold">
                      {t.badge}
                    </Badge>
                  </div>

                  <div className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
                    {t.english}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {t.definition}
                  </p>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 space-y-1">
                    <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                      <span>{t.example}</span>
                      <button
                        type="button"
                        onClick={() => speak(t.example)}
                        className="text-slate-400 hover:text-indigo-600 text-xs ml-1"
                        title="Listen example"
                      >
                        🔊
                      </button>
                    </div>
                    <div className="text-[11px] text-slate-500 italic">{t.exampleRomaji}</div>
                    <div className="text-[11px] text-slate-700 font-medium">{t.exampleEnglish}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : (
        /* Quiz Mode */
        <Card className="p-6 max-w-2xl mx-auto space-y-6 bg-white shadow-lg border border-indigo-100">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                Question {currentQuizIdx + 1} of {TECHNICAL_QUIZ_QUESTIONS.length}
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-1">
                Factory & Safety Japanese Quiz
              </h3>
            </div>
            <Badge variant="primary" className="text-sm px-3 py-1 font-bold">
              Score: {quizScore} / {TECHNICAL_QUIZ_QUESTIONS.length}
            </Badge>
          </div>

          <div className="text-base font-bold text-slate-900 bg-slate-50 p-4 rounded-xl border border-slate-200">
            {TECHNICAL_QUIZ_QUESTIONS[currentQuizIdx].question}
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {TECHNICAL_QUIZ_QUESTIONS[currentQuizIdx].options.map((opt, idx) => {
              const isCorrect = idx === TECHNICAL_QUIZ_QUESTIONS[currentQuizIdx].correct;
              const isSelected = selectedOption === idx;

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
                  key={idx}
                  type="button"
                  disabled={showExplanation}
                  onClick={() => handleQuizAnswer(idx)}
                  className={`p-3.5 rounded-xl border-2 text-left text-sm font-medium transition-all flex items-center justify-between ${btnStyle}`}
                >
                  <span>{opt}</span>
                  {showExplanation && isCorrect && <span className="text-emerald-600 font-bold">✓ Correct</span>}
                  {showExplanation && isSelected && !isCorrect && <span className="text-rose-600 font-bold">✗ Incorrect</span>}
                </button>
              );
            })}
          </div>

          {showExplanation && (
            <div className="bg-indigo-50/80 p-4 rounded-xl border border-indigo-200 text-xs text-indigo-950 space-y-2">
              <div className="font-bold text-indigo-900 flex items-center gap-1.5">
                <span>💡 Explanation:</span>
              </div>
              <p className="leading-relaxed">
                {TECHNICAL_QUIZ_QUESTIONS[currentQuizIdx].explanation}
              </p>
              <div className="pt-2 flex justify-end">
                <Button
                  variant="primary"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                  onClick={handleNextQuestion}
                >
                  {currentQuizIdx + 1 < TECHNICAL_QUIZ_QUESTIONS.length ? 'Next Question →' : 'Finish Quiz 🎉'}
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
