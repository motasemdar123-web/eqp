'use client';

import { useState, useMemo } from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import {
  MACHINE_MODELS,
  MACHINE_SYSTEM_CATEGORIES,
  MACHINE_COMPONENTS,
  WORKSHOP_5S_EQUIPMENT_RULES
} from '../../lib/japanese/machinePartsData';

function speak(text) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP';
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
}

export default function MachinePartsExplorer({ onToast }) {
  const [selectedSystem, setSelectedSystem] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeComponent, setActiveComponent] = useState(MACHINE_COMPONENTS[0]);
  const [quizMode, setQuizMode] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);

  // Filtered components
  const filteredComponents = useMemo(() => {
    return MACHINE_COMPONENTS.filter((comp) => {
      const matchesSystem = selectedSystem === 'all' || comp.system === selectedSystem;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        comp.kanji.toLowerCase().includes(q) ||
        comp.reading.toLowerCase().includes(q) ||
        comp.english.toLowerCase().includes(q) ||
        (comp.arabic && comp.arabic.includes(q)) ||
        comp.komatsuCategory.toLowerCase().includes(q);
      return matchesSystem && matchesSearch;
    });
  }, [selectedSystem, searchQuery]);

  // Quiz questions generated from components
  const quizQuestions = useMemo(() => {
    const questions = [];
    for (let i = 0; i < MACHINE_COMPONENTS.length; i++) {
      const correct = MACHINE_COMPONENTS[i];
      // pick 3 wrong options
      const wrong = MACHINE_COMPONENTS.filter((c) => c.id !== correct.id)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      const options = [correct, ...wrong].sort(() => 0.5 - Math.random());
      questions.push({
        prompt: correct.english,
        arabic: correct.arabic,
        description: correct.description,
        correctId: correct.id,
        options,
        correct
      });
    }
    return questions;
  }, []);

  const handleSelectAnswer = (opt) => {
    if (answered) return;
    setSelectedAnswer(opt.id);
    setAnswered(true);
    const isCorrect = opt.id === quizQuestions[quizIndex].correctId;
    if (isCorrect) {
      setScore((s) => s + 1);
      speak(opt.kanji);
      onToast?.(`✨ 正解 (Seikai)! ${opt.kanji} - ${opt.reading}`, 'success');
    } else {
      onToast?.(`❌ 不正解 - Correct: ${quizQuestions[quizIndex].correct.kanji}`, 'error');
    }
  };

  const handleNextQuiz = () => {
    setSelectedAnswer(null);
    setAnswered(false);
    if (quizIndex + 1 < quizQuestions.length) {
      setQuizIndex((prev) => prev + 1);
    } else {
      onToast?.(`🎉 Parts Identification Quiz Finished! Final Score: ${score + (selectedAnswer === quizQuestions[quizIndex]?.correctId ? 1 : 0)}/${quizQuestions.length}`, 'success');
      setQuizMode(false);
      setQuizIndex(0);
      setScore(0);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-slate-900 via-amber-950/70 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-amber-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none text-9xl font-bold font-mono">
          KOMATSU
        </div>
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              Komatsu Heavy Machinery Anatomy
            </span>
            <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold px-2.5 py-1 rounded-full">
              建機部位・部品図鑑
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Komatsu Excavator & Heavy Equipment Parts Explorer
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Master the exact Japanese names, Kana readings, English & Arabic terminology, and workshop inspection routines for Komatsu hydraulic excavators, wheel loaders, and bulldozers.
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              variant={!quizMode ? 'primary' : 'outline'}
              className={!quizMode ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold' : 'text-white border-slate-600'}
              onClick={() => setQuizMode(false)}
            >
              🔍 Parts Visual Dictionary ({MACHINE_COMPONENTS.length} Parts)
            </Button>
            <Button
              variant={quizMode ? 'primary' : 'outline'}
              className={quizMode ? 'bg-indigo-600 hover:bg-indigo-700 text-white font-bold' : 'text-white border-slate-600'}
              onClick={() => {
                setQuizMode(true);
                setQuizIndex(0);
                setSelectedAnswer(null);
                setAnswered(false);
                setScore(0);
              }}
            >
              ⚡ Part Identification Quiz
            </Button>
          </div>
        </div>
      </div>

      {/* QUIZ MODE */}
      {quizMode ? (
        <Card className="p-6 space-y-6 border-indigo-200 bg-indigo-50/20">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                Part Recognition Challenge
              </span>
              <h3 className="text-lg font-black text-slate-900">
                Question {quizIndex + 1} of {quizQuestions.length}
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="neutral" className="font-mono font-bold text-sm bg-white border shadow-2xs">
                Score: {score}
              </Badge>
              <Button size="sm" variant="ghost" onClick={() => setQuizMode(false)}>
                Exit Quiz
              </Button>
            </div>
          </div>

          <div className="space-y-3 bg-white p-6 rounded-xl border shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase">Identify the Japanese technical term for:</span>
            <div className="flex items-baseline gap-3 flex-wrap">
              <h2 className="text-2xl font-black text-slate-900">{quizQuestions[quizIndex].prompt}</h2>
              {quizQuestions[quizIndex].arabic && (
                <span className="text-base font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                  {quizQuestions[quizIndex].arabic}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 italic">{quizQuestions[quizIndex].description}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quizQuestions[quizIndex].options.map((opt) => {
              const isSelected = selectedAnswer === opt.id;
              const isCorrect = opt.id === quizQuestions[quizIndex].correctId;

              let btnClass = 'p-4 rounded-xl border text-left transition-all flex flex-col justify-between ';
              if (!answered) {
                btnClass += 'bg-white hover:border-amber-400 hover:shadow-md cursor-pointer border-slate-200';
              } else if (isCorrect) {
                btnClass += 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20 font-bold';
              } else if (isSelected) {
                btnClass += 'bg-rose-50 border-rose-500 text-rose-950';
              } else {
                btnClass += 'bg-slate-50 border-slate-200 opacity-60';
              }

              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelectAnswer(opt)}
                  disabled={answered}
                  className={btnClass}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-lg font-black">{opt.kanji}</span>
                    <Button
                      size="xs"
                      variant="ghost"
                      className="p-1 h-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        speak(opt.kanji);
                      }}
                    >
                      🔊
                    </Button>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">{opt.reading}</span>
                  <span className="text-xs font-semibold text-slate-700 mt-1">{opt.english}</span>
                </button>
              );
            })}
          </div>

          {answered && (
            <div className="flex justify-end pt-2 animate-fadeIn">
              <Button
                variant="primary"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6"
                onClick={handleNextQuiz}
              >
                {quizIndex + 1 < quizQuestions.length ? 'Next Component ➔' : 'Finish Quiz 🎉'}
              </Button>
            </div>
          )}
        </Card>
      ) : (
        /* EXPLORER MODE */
        <div className="space-y-6">
          {/* Category Tabs & Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-4 rounded-2xl border shadow-xs">
            {/* Search Input */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search part name (e.g. ブーム, cylinder, مضخة, 708)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
              <span className="absolute left-3 top-2.5 text-xs text-slate-400">🔍</span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            <span className="text-xs font-bold text-slate-500 self-center">
              Showing <strong className="text-slate-900">{filteredComponents.length}</strong> components
            </span>
          </div>

          {/* System Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {MACHINE_SYSTEM_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedSystem(cat.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  selectedSystem === cat.id
                    ? 'bg-slate-900 text-amber-400 border-slate-900 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Main Grid: Left List + Right Inspection Focus Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Component Cards */}
            <div className="lg:col-span-7 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredComponents.map((comp) => {
                  const isSelected = activeComponent?.id === comp.id;
                  return (
                    <div
                      key={comp.id}
                      onClick={() => setActiveComponent(comp)}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-amber-50/50 border-amber-400 ring-2 ring-amber-400/20 shadow-md'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-base font-black text-slate-900 block">{comp.kanji}</span>
                            <span className="text-xs text-amber-700 font-mono font-medium block">{comp.reading}</span>
                          </div>
                          <Button
                            size="xs"
                            variant="ghost"
                            className="p-1 h-auto text-slate-400 hover:text-amber-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              speak(comp.kanji);
                            }}
                            title="Pronounce Japanese"
                          >
                            🔊
                          </Button>
                        </div>
                        <p className="text-xs font-bold text-slate-700 mt-1">{comp.english}</p>
                        {comp.arabic && (
                          <p className="text-xs text-slate-500 font-medium">{comp.arabic}</p>
                        )}
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-semibold text-slate-500">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded">{comp.komatsuCategory}</span>
                        <span className="text-amber-600 font-bold">Details ➔</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredComponents.length === 0 && (
                <div className="p-8 text-center bg-white rounded-xl border text-slate-500 space-y-2">
                  <p className="text-2xl">🔍</p>
                  <p className="text-sm font-bold">No Komatsu components found</p>
                  <p className="text-xs">Try clearing the search filter or selecting another system category.</p>
                </div>
              )}
            </div>

            {/* Right: Component Detail & Inspection Checklist Card */}
            <div className="lg:col-span-5">
              {activeComponent ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5 sticky top-6">
                  {/* Top Badge & Header */}
                  <div className="flex items-start justify-between gap-2 border-b pb-4">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-700 uppercase bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                        {activeComponent.komatsuCategory}
                      </span>
                      <h3 className="text-2xl font-black text-slate-900 mt-1.5 flex items-center gap-2">
                        {activeComponent.kanji}
                        <Button
                          size="xs"
                          variant="outline"
                          className="text-amber-600 border-amber-300 hover:bg-amber-50"
                          onClick={() => speak(activeComponent.kanji)}
                        >
                          🔊 Play
                        </Button>
                      </h3>
                      <p className="text-xs font-mono font-bold text-amber-700 mt-0.5">
                        {activeComponent.reading}
                      </p>
                      <p className="text-sm font-bold text-slate-800 mt-1">{activeComponent.english}</p>
                      {activeComponent.arabic && (
                        <p className="text-xs font-bold text-slate-600">{activeComponent.arabic}</p>
                      )}
                    </div>
                  </div>

                  {/* Component Description */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Function & Role</span>
                    <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border">
                      {activeComponent.description}
                    </p>
                  </div>

                  {/* Workshop Inspection Routine */}
                  <div className="space-y-2 bg-amber-50/60 border border-amber-200 p-4 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                        🛠️ Workshop Inspection Phrase (日常点検フレーズ)
                      </span>
                      <Button
                        size="xs"
                        variant="ghost"
                        className="text-amber-800 p-0 h-auto font-bold text-xs"
                        onClick={() => speak(activeComponent.inspectionPhrase)}
                      >
                        🔊 Listen
                      </Button>
                    </div>
                    <p className="text-xs font-bold text-slate-900 font-sans leading-relaxed">
                      {activeComponent.inspectionPhrase}
                    </p>
                    <p className="text-[11px] text-slate-600 italic">
                      "{activeComponent.inspectionEnglish}"
                    </p>
                  </div>

                  {/* Typical Failure Modes */}
                  {activeComponent.typicalFailures && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Typical Faults / Failure Modes (主な故障・摩耗)
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {activeComponent.typicalFailures.map((fail, i) => (
                          <span
                            key={i}
                            className="bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-semibold px-2 py-0.5 rounded-lg"
                          >
                            ⚠️ {fail}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border text-slate-400">
                  Select a component on the left to view its inspection routine and failure analysis.
                </div>
              )}
            </div>
          </div>

          {/* 5S Workshop Safety Banner */}
          <div className="bg-slate-900 rounded-2xl p-6 text-white space-y-4 border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 text-xs font-bold px-2.5 py-1 rounded-full">
                5S Workshop Safety Standard
              </span>
              <span className="text-xs text-slate-400 font-mono">整備工場・5S指差呼称の原則</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {WORKSHOP_5S_EQUIPMENT_RULES.map((r, i) => (
                <div key={i} className="bg-slate-800/80 border border-slate-700/80 p-3.5 rounded-xl space-y-1.5">
                  <span className="text-xs font-black text-amber-400 block">{r.rule}</span>
                  <p className="text-[11px] text-slate-200 leading-tight">{r.japanese}</p>
                  <p className="text-[10px] text-slate-400 leading-tight pt-1">{r.english}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
