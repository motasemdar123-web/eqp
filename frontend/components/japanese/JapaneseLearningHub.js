'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SystemShell from '../SystemShell';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Toast from '../ui/Toast';
import {
  N5_GRAMMAR,
  N4_GRAMMAR,
  N5_KANJI,
  N4_KANJI,
  N5_VOCABULARY,
  N4_VOCABULARY,
  N5_MOCK_EXAM,
  N4_MOCK_EXAM,
} from '../../lib/japaneseData';

import JLPTExamSimulator from './JLPTExamSimulator';
import TechnicalJapaneseHub from './TechnicalJapaneseHub';
import SentenceScramblerGame from './SentenceScramblerGame';
import MistakeBankModal from './MistakeBankModal';

function speakJapanese(text) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP';
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
}

export default function JapaneseLearningHub() {
  const [level, setLevel] = useState('N5'); // 'N5' | 'N4'
  const [activeTab, setActiveTab] = useState('flashcards'); // 'flashcards' | 'kanji' | 'grammar' | 'vocab' | 'scramble' | 'technical' | 'mistakes' | 'exam'
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  // Active level data
  const currentGrammar = level === 'N5' ? N5_GRAMMAR : N4_GRAMMAR;
  const currentKanji = level === 'N5' ? N5_KANJI : N4_KANJI;
  const currentVocab = level === 'N5' ? N5_VOCABULARY : N4_VOCABULARY;
  const currentExam = level === 'N5' ? N5_MOCK_EXAM : N4_MOCK_EXAM;

  return (
    <SystemShell
      activePath="/japanese"
      eyebrow="LANGUAGE & EXCELLENCE"
      title="Japanese Active Learning Hub (日本語コーナー)"
      description="Interactive mastery hub for Japanese proficiency (JLPT N5 & N4) and Factory 5S Operations. Practice active recall flashcards, sentence unscrambler, stroke-order kanji, engineering Japanese, error vault notebook, and full timed mock listening exams."
      actions={
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-xs">
          <button
            type="button"
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${level === 'N5' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'}`}
            onClick={() => setLevel('N5')}
          >
            🌸 JLPT N5 Foundation
          </button>
          <button
            type="button"
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${level === 'N4' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'}`}
            onClick={() => setLevel('N4')}
          >
            ⛩️ JLPT N4 Elementary
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Navigation Tabs for all Products */}
        <div className="flex gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
          <button
            type="button"
            className={`px-3.5 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${activeTab === 'flashcards' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            onClick={() => setActiveTab('flashcards')}
          >
            📇 Flashcard Dojo (SRS)
          </button>
          <button
            type="button"
            className={`px-3.5 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${activeTab === 'scramble' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            onClick={() => setActiveTab('scramble')}
          >
            🧩 Sentence Builder (並び替え)
          </button>
          <button
            type="button"
            className={`px-3.5 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${activeTab === 'technical' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            onClick={() => setActiveTab('technical')}
          >
            🏭 Factory & 5S (現場日本語)
          </button>
          <button
            type="button"
            className={`px-3.5 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${activeTab === 'mistakes' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            onClick={() => setActiveTab('mistakes')}
          >
            🎯 Error Vault (弱点復習)
          </button>
          <button
            type="button"
            className={`px-3.5 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${activeTab === 'kanji' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            onClick={() => setActiveTab('kanji')}
          >
            ⛩️ Kanji Dojo & Canvas
          </button>
          <button
            type="button"
            className={`px-3.5 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${activeTab === 'grammar' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            onClick={() => setActiveTab('grammar')}
          >
            📖 Grammar Master
          </button>
          <button
            type="button"
            className={`px-3.5 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${activeTab === 'vocab' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            onClick={() => setActiveTab('vocab')}
          >
            📚 Vocabulary Vault
          </button>
          <button
            type="button"
            className={`px-3.5 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${activeTab === 'exam' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            onClick={() => setActiveTab('exam')}
          >
            ⏱️ JLPT Exam Simulator
          </button>
        </div>

        {/* Product 1: Flashcard Dojo */}
        {activeTab === 'flashcards' && (
          <FlashcardDojo grammarList={currentGrammar} level={level} onToast={showToast} />
        )}

        {/* Product: Sentence Builder Game */}
        {activeTab === 'scramble' && (
          <SentenceScramblerGame level={level} onToast={showToast} />
        )}

        {/* Product: Factory & 5S Technical Japanese */}
        {activeTab === 'technical' && (
          <TechnicalJapaneseHub onToast={showToast} />
        )}

        {/* Product: Mistake Bank Notebook */}
        {activeTab === 'mistakes' && (
          <MistakeBankModal onToast={showToast} />
        )}

        {/* Product 2: Kanji Dojo & Scratchpad */}
        {activeTab === 'kanji' && (
          <KanjiDojo kanjiList={currentKanji} level={level} onToast={setToast} />
        )}

        {/* Product 3: Grammar Master */}
        {activeTab === 'grammar' && (
          <GrammarMaster grammarList={currentGrammar} level={level} onToast={setToast} />
        )}

        {/* Product 4: Vocabulary Vault */}
        {activeTab === 'vocab' && (
          <VocabularyVault vocabList={currentVocab} level={level} onToast={setToast} />
        )}

        {/* Product 5: JLPT Exam Simulator */}
        {activeTab === 'exam' && (
          <JLPTExamSimulator level={level} onToast={setToast} />
        )}
      </div>

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </SystemShell>
  );
}

// ----------------------------------------------------------------------
// PRODUCT 1: FLASHCARD DOJO (SRS)
// ----------------------------------------------------------------------
function FlashcardDojo({ grammarList, level, onToast }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [srsState, setSrsState] = useState({});
  const [streak, setStreak] = useState(1);

  // Load persistent SRS state & streak
  useEffect(() => {
    try {
      const storedSrs = localStorage.getItem(`jlpt_srs_${level}`);
      if (storedSrs) setSrsState(JSON.parse(storedSrs));

      const storedStreak = localStorage.getItem('jlpt_study_streak');
      const lastStudyDate = localStorage.getItem('jlpt_last_study_date');
      const today = new Date().toDateString();

      if (lastStudyDate) {
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        if (lastStudyDate === today) {
          setStreak(storedStreak ? parseInt(storedStreak, 10) : 1);
        } else if (lastStudyDate === yesterday) {
          const newStreak = (storedStreak ? parseInt(storedStreak, 10) : 0) + 1;
          setStreak(newStreak);
          localStorage.setItem('jlpt_study_streak', newStreak.toString());
          localStorage.setItem('jlpt_last_study_date', today);
        } else {
          setStreak(1);
          localStorage.setItem('jlpt_study_streak', '1');
          localStorage.setItem('jlpt_last_study_date', today);
        }
      } else {
        localStorage.setItem('jlpt_study_streak', '1');
        localStorage.setItem('jlpt_last_study_date', today);
      }
    } catch (e) {
      console.error('Failed to load SRS state', e);
    }
  }, [level]);

  const currentCard = grammarList[currentIndex] || grammarList[0];
  const cardKey = currentCard?.id || `card_${currentIndex}`;
  const cardData = srsState[cardKey] || { interval: 0, repetitions: 0, status: 'new' };

  const masteredCount = Object.values(srsState).filter((c) => c.status === 'mastered').length;
  const learningCount = Object.values(srsState).filter((c) => c.status === 'learning').length;

  function handleNext(rating) {
    setFlipped(false);
    let newInterval = 1;
    let newStatus = 'learning';

    if (rating === 'again') {
      newInterval = 1;
      newStatus = 'learning';
    } else if (rating === 'hard') {
      newInterval = Math.max(2, (cardData.interval || 1) * 1.2);
      newStatus = 'learning';
    } else if (rating === 'good') {
      newInterval = Math.max(4, (cardData.interval || 1) * 2.0);
      newStatus = 'mastered';
    } else if (rating === 'easy') {
      newInterval = Math.max(7, (cardData.interval || 1) * 2.5);
      newStatus = 'mastered';
    }

    const updatedSrs = {
      ...srsState,
      [cardKey]: {
        interval: Math.round(newInterval),
        repetitions: (cardData.repetitions || 0) + 1,
        status: newStatus,
        lastReviewed: new Date().toISOString(),
      },
    };

    setSrsState(updatedSrs);
    try {
      localStorage.setItem(`jlpt_srs_${level}`, JSON.stringify(updatedSrs));
    } catch (e) {
      console.error('Failed to save SRS state', e);
    }

    setCurrentIndex((prev) => (prev + 1) % grammarList.length);
    onToast({
      message: `Card rated "${rating.toUpperCase()}". Next review in ${Math.round(newInterval)} days.`,
      type: rating === 'easy' || rating === 'good' ? 'success' : 'info',
    });
  }

  return (
    <div className="space-y-6">
      {/* Top progress metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-400">Current Deck</span>
          <p className="text-lg font-black text-slate-900 mt-0.5">{level} Mastery</p>
        </div>
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-400">Deck Progress</span>
          <p className="text-lg font-black text-slate-900 mt-0.5">
            {currentIndex + 1} / {grammarList.length}
          </p>
        </div>
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-400">SRS Mastered</span>
          <p className="text-lg font-black text-emerald-600 mt-0.5">
            {masteredCount} Cards
          </p>
        </div>
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-400">Active Streak</span>
          <p className="text-lg font-black text-amber-600 mt-0.5">
            🔥 {streak} {streak === 1 ? 'Day' : 'Days'}
          </p>
        </div>
      </div>

      {/* Interactive 3D Flip Card */}
      <div className="flex flex-col items-center justify-center p-6 bg-slate-900/5 rounded-2xl border border-slate-200 min-h-[380px]">
        <div
          className={`w-full max-w-xl p-8 bg-white border-2 ${
            flipped ? 'border-amber-400 bg-amber-50/20' : 'border-slate-300'
          } rounded-2xl shadow-lg cursor-pointer transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between min-h-[300px]`}
          onClick={() => setFlipped(!flipped)}
        >
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Badge tone="info">{currentCard?.category || 'Grammar'}</Badge>
                {cardData.status === 'mastered' && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    ✓ Mastered
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    speakJapanese(currentCard?.title || '');
                  }}
                >
                  <span>🔊</span> Listen
                </button>
                <span className="text-xs text-slate-400 font-mono">Click to Flip</span>
              </div>
            </div>

            {!flipped ? (
              <div className="py-8 text-center space-y-3">
                <h3 className="text-3xl font-black text-slate-900 font-sans tracking-wide">
                  {currentCard?.title}
                </h3>
                <p className="text-xs font-mono text-slate-500 bg-slate-100 inline-block px-3 py-1 rounded-full border border-slate-200">
                  Formula: {currentCard?.formula}
                </p>
              </div>
            ) : (
              <div className="py-4 space-y-4">
                <div>
                  <span className="text-xs font-bold uppercase text-amber-600">English Meaning</span>
                  <p className="text-xl font-black text-slate-900 mt-0.5">{currentCard?.meaning}</p>
                  <p className="text-xs text-slate-600 mt-1">{currentCard?.description}</p>
                </div>
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <span className="text-xs font-bold uppercase text-slate-400">Example Dialogues</span>
                  {(currentCard?.examples || []).map((ex, idx) => (
                    <div key={idx} className="p-2.5 bg-white rounded-lg border border-slate-200/80 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{ex.jp}</span>
                        <button
                          type="button"
                          className="text-indigo-600 hover:opacity-80 text-xs ml-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            speakJapanese(ex.jp);
                          }}
                        >
                          🔊
                        </button>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono block">{ex.romaji}</span>
                      <span className="text-slate-700 block mt-0.5 font-medium">{ex.en}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-400 font-medium">
            {flipped ? 'Rate your recall memory using the SM-2 buttons below:' : '💡 Think of the meaning and formula, then click to flip.'}
          </div>
        </div>

        {/* SRS Rating Bar */}
        {flipped && (
          <div className="flex items-center gap-2 mt-4 max-w-xl w-full">
            <button
              type="button"
              className="flex-1 py-2.5 rounded-xl bg-rose-100 text-rose-800 font-bold text-xs hover:bg-rose-200 transition-all cursor-pointer shadow-xs"
              onClick={() => handleNext('again')}
            >
              Again (1d)
            </button>
            <button
              type="button"
              className="flex-1 py-2.5 rounded-xl bg-amber-100 text-amber-800 font-bold text-xs hover:bg-amber-200 transition-all cursor-pointer shadow-xs"
              onClick={() => handleNext('hard')}
            >
              Hard (2d)
            </button>
            <button
              type="button"
              className="flex-1 py-2.5 rounded-xl bg-indigo-100 text-indigo-800 font-bold text-xs hover:bg-indigo-200 transition-all cursor-pointer shadow-xs"
              onClick={() => handleNext('good')}
            >
              Good (4d)
            </button>
            <button
              type="button"
              className="flex-1 py-2.5 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs hover:bg-emerald-200 transition-all cursor-pointer shadow-xs"
              onClick={() => handleNext('easy')}
            >
              Easy (7d)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// PRODUCT 2: KANJI DOJO & STROKE CANVAS
// ----------------------------------------------------------------------
function KanjiDojo({ kanjiList, level }) {
  const [selectedKanji, setSelectedKanji] = useState(kanjiList[0]);
  const [search, setSearch] = useState('');
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);

  const filteredKanji = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return kanjiList;
    return kanjiList.filter(
      (k) =>
        k.char.includes(q) ||
        k.meaning.toLowerCase().includes(q) ||
        k.onyomi.toLowerCase().includes(q) ||
        k.kunyomi.toLowerCase().includes(q)
    );
  }, [kanjiList, search]);

  useEffect(() => {
    clearCanvas();
  }, [selectedKanji]);

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw guide grid
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function handleCanvasPointerDown(e) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    isDrawingRef.current = true;
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  }

  function handleCanvasPointerMove(e) {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  }

  function handleCanvasPointerUp() {
    isDrawingRef.current = false;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      {/* Kanji Selection Grid */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">{level} Kanji Matrix</h3>
            <p className="text-xs text-slate-500">Click any character to inspect readings and practice writing.</p>
          </div>
          <input
            type="text"
            placeholder="Search character, meaning, reading..."
            className="ds-input text-xs w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5 max-h-[500px] overflow-y-auto p-1">
          {filteredKanji.map((kanji) => {
            const isSelected = selectedKanji?.char === kanji.char;
            return (
              <div
                key={kanji.char}
                className={`p-3 text-center rounded-xl border transition-all cursor-pointer ${isSelected ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-400'}`}
                onClick={() => setSelectedKanji(kanji)}
              >
                <span className="text-3xl font-bold text-slate-900 block">{kanji.char}</span>
                <span className="text-[10px] text-slate-500 truncate block mt-1 font-medium">{kanji.meaning.split('/')[0]}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Selected Kanji & Drawing Scratchpad */}
      {selectedKanji && (
        <Card className="p-5 space-y-4 h-fit">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-xs font-bold uppercase text-amber-600">Kanji Inspector</span>
              <h2 className="text-xl font-bold text-slate-900">{selectedKanji.meaning}</h2>
            </div>
            <button
              type="button"
              className="text-xs font-bold text-blue-600 hover:underline"
              onClick={() => speakJapanese(selectedKanji.char)}
            >
              🔊 Pronounce
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-400 font-bold block uppercase text-[10px]">On&apos;yomi (音読み - Chinese Reading)</span>
              <span className="font-mono font-bold text-slate-800 text-sm">{selectedKanji.onyomi}</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-400 font-bold block uppercase text-[10px]">Kun&apos;yomi (訓読み - Japanese Reading)</span>
              <span className="font-mono font-bold text-slate-800 text-sm">{selectedKanji.kunyomi}</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-400 font-bold block uppercase text-[10px]">Stroke Count</span>
              <span className="font-mono font-bold text-slate-800">{selectedKanji.strokes} Strokes</span>
            </div>
          </div>

          {/* Interactive Writing Canvas */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Practice Stroke Writing:</span>
              <Button type="button" size="sm" variant="secondary" onClick={clearCanvas}>
                Clear
              </Button>
            </div>
            <div className="relative border-2 border-dashed border-slate-300 rounded-xl overflow-hidden bg-white flex justify-center">
              <canvas
                ref={canvasRef}
                width={260}
                height={200}
                className="cursor-crosshair touch-none"
                onPointerDown={handleCanvasPointerDown}
                onPointerMove={handleCanvasPointerMove}
                onPointerUp={handleCanvasPointerUp}
              />
            </div>
          </div>

          {/* Compound Examples */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-400 uppercase">Compound Words:</span>
            {(selectedKanji.examples || []).map((ex, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs p-1.5 bg-slate-50 rounded border border-slate-200/80 cursor-pointer hover:bg-slate-100"
                onClick={() => speakJapanese(ex.split('(')[0].trim())}
              >
                <span className="font-bold text-slate-900">{ex}</span>
                <span className="text-blue-600">🔊</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// PRODUCT 3: GRAMMAR MASTER ENCYCLOPEDIA
// ----------------------------------------------------------------------
function GrammarMaster({ grammarList, level }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const categories = useMemo(() => {
    return ['ALL', ...new Set(grammarList.map((g) => g.category))];
  }, [grammarList]);

  const filteredGrammar = useMemo(() => {
    const q = search.trim().toLowerCase();
    return grammarList.filter((item) => {
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.meaning.toLowerCase().includes(q) ||
        item.formula.toLowerCase().includes(q);
      const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [grammarList, search, selectedCategory]);

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-slate-50/70">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <input
            type="text"
            placeholder="Search grammar point (e.g., te kudasai, tai, kara)..."
            className="ds-input text-xs w-full max-w-md"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-slate-900 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {filteredGrammar.map((item) => (
          <Card key={item.id} className="p-5 space-y-3">
            <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
              <div>
                <Badge tone="info">{item.category}</Badge>
                <h3 className="text-base font-bold text-slate-900 mt-1">{item.title}</h3>
              </div>
              <button
                type="button"
                className="text-xs font-bold text-blue-600 hover:underline"
                onClick={() => speakJapanese(item.title)}
              >
                🔊 Audio
              </button>
            </div>

            <div className="p-2.5 bg-amber-50/50 border border-amber-200 rounded-lg text-xs">
              <span className="font-bold text-amber-900 block uppercase text-[10px]">Formula:</span>
              <span className="font-mono font-bold text-slate-800">{item.formula}</span>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-900">{item.meaning}</p>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{item.description}</p>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-400">Real-World Examples:</span>
              {(item.examples || []).map((ex, idx) => (
                <div key={idx} className="p-2 bg-slate-50 rounded border border-slate-200/80 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{ex.jp}</span>
                    <button
                      type="button"
                      className="text-blue-600 hover:opacity-80"
                      onClick={() => speakJapanese(ex.jp)}
                    >
                      🔊
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">{ex.romaji}</span>
                  <span className="text-slate-700 block mt-0.5">{ex.en}</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// PRODUCT 4: VOCABULARY VAULT
// ----------------------------------------------------------------------
function VocabularyVault({ vocabList, level }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const categories = useMemo(() => {
    return ['ALL', ...new Set(vocabList.map((v) => v.category))];
  }, [vocabList]);

  const filteredVocab = useMemo(() => {
    const q = search.trim().toLowerCase();
    return vocabList.filter((item) => {
      const matchesSearch =
        !q ||
        item.jp.toLowerCase().includes(q) ||
        item.kana.toLowerCase().includes(q) ||
        item.romaji.toLowerCase().includes(q) ||
        item.en.toLowerCase().includes(q);
      const matchesCat = selectedCategory === 'ALL' || item.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [vocabList, search, selectedCategory]);

  return (
    <Card className="overflow-hidden space-y-4">
      <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <input
          type="text"
          placeholder="Search vocabulary by Japanese, romaji, or English..."
          className="ds-input text-xs w-full max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-slate-900 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="ds-table-wrap p-2">
        <table className="ds-table">
          <thead>
            <tr>
              <th>Japanese</th>
              <th>Reading (Kana)</th>
              <th>Romaji</th>
              <th>English Meaning</th>
              <th>Category</th>
              <th className="text-right">Audio</th>
            </tr>
          </thead>
          <tbody>
            {filteredVocab.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/60">
                <td className="font-bold text-base text-slate-900 font-sans">{item.jp}</td>
                <td className="font-bold text-slate-700 font-mono text-xs">{item.kana}</td>
                <td className="font-mono text-slate-500 text-xs">{item.romaji}</td>
                <td className="font-semibold text-slate-800 text-xs">{item.en}</td>
                <td><Badge tone="neutral">{item.category}</Badge></td>
                <td className="text-right">
                  <button
                    type="button"
                    className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold cursor-pointer"
                    onClick={() => speakJapanese(item.jp || item.kana)}
                    title="Play Audio"
                  >
                    🔊 Play
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ----------------------------------------------------------------------
// PRODUCT 5: JLPT SIMULATION EXAM HALL & AUDIO LISTENING CENTER
// ----------------------------------------------------------------------
function ExamHall({ examData, level, onToast }) {
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [activeAudioTrack, setActiveAudioTrack] = useState(examData.audioTracks[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  function handleAnswer(qId, optionIdx) {
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optionIdx }));
  }

  const score = useMemo(() => {
    let correct = 0;
    (examData.questions || []).forEach((q) => {
      if (selectedAnswers[q.id] === q.correct) correct++;
    });
    return correct;
  }, [examData.questions, selectedAnswers]);

  return (
    <div className="space-y-6">
      {/* Audio Listening Player Station */}
      <Card className="p-6 bg-linear-to-r from-slate-900 to-blue-950 text-white border-none shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <Badge tone="info">{level} Listening Section (聴解)</Badge>
            <h2 className="text-lg font-bold text-white mt-1">Official JLPT Audio Examination Player</h2>
          </div>
          <span className="text-xs text-slate-300 font-mono">Real Test Audio Tracks</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {examData.audioTracks.map((track) => {
            const isSelected = activeAudioTrack?.id === track.id;
            return (
              <button
                key={track.id}
                type="button"
                className={`p-3.5 rounded-xl text-left border transition-all ${isSelected ? 'bg-blue-600/30 border-blue-400 text-white shadow-md' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}`}
                onClick={() => {
                  setActiveAudioTrack(track);
                  setIsPlaying(true);
                  if (audioRef.current) {
                    audioRef.current.src = track.src;
                    audioRef.current.play();
                  }
                }}
              >
                <span className="text-xs font-bold block truncate">{track.title}</span>
                <span className="text-[10px] text-slate-400 font-mono mt-1 block">⏱ {track.duration}</span>
              </button>
            );
          })}
        </div>

        {/* Embedded HTML5 Audio Player */}
        <div className="p-4 bg-black/40 rounded-xl border border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xl">🎧</span>
            <div>
              <p className="text-xs font-bold text-white">{activeAudioTrack?.title}</p>
              <p className="text-[10px] text-slate-400 font-mono">Direct Listening Stream</p>
            </div>
          </div>
          <audio
            ref={audioRef}
            controls
            className="w-full sm:w-80 h-9"
            src={activeAudioTrack?.src}
          />
        </div>
      </Card>

      {/* Interactive Mock Exam Questions */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">{examData.title}</h3>
            <p className="text-xs text-slate-500">Test your language knowledge and reading comprehension.</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-slate-500 uppercase">Score</span>
            <p className="text-lg font-bold text-emerald-600">
              {score} / {examData.questions.length} Correct
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {examData.questions.map((q, qIdx) => {
            const chosen = selectedAnswers[q.id];
            const isAnswered = chosen !== undefined;
            const isCorrect = chosen === q.correct;

            return (
              <div key={q.id} className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">Question {qIdx + 1} ({q.section})</span>
                  {isAnswered && (
                    <Badge tone={isCorrect ? 'completed' : 'critical'}>
                      {isCorrect ? '✓ Correct' : '✕ Incorrect'}
                    </Badge>
                  )}
                </div>

                <p
                  className="text-base font-bold text-slate-900 whitespace-pre-line"
                  dangerouslySetInnerHTML={{ __html: q.question }}
                />

                <div className="grid gap-2 sm:grid-cols-2">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = chosen === optIdx;
                    let btnStyle = 'bg-white border-slate-200 text-slate-800 hover:border-slate-400';
                    if (isAnswered) {
                      if (optIdx === q.correct) btnStyle = 'bg-emerald-100 border-emerald-500 text-emerald-900 font-bold';
                      else if (isSelected) btnStyle = 'bg-red-100 border-red-500 text-red-900';
                    }

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        className={`p-3 rounded-lg border text-left text-xs font-semibold transition-all cursor-pointer ${btnStyle}`}
                        onClick={() => handleAnswer(q.id, optIdx)}
                      >
                        <span className="font-mono mr-2 text-slate-400">{optIdx + 1}.</span>
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {isAnswered && (
                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-950 space-y-0.5">
                    <span className="font-bold uppercase text-[10px] text-blue-700">Explanation:</span>
                    <p>{q.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
