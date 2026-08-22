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
import LevelSelectorModal from './LevelSelectorModal';
import MachinePartsExplorer from './MachinePartsExplorer';
import WorkshopRoleplayCoach from './WorkshopRoleplayCoach';
import BusinessEmailStudio from './BusinessEmailStudio';
import SpeedKanjiRush from './SpeedKanjiRush';
import ZenFocusModeOverlay from './ZenFocusModeOverlay';

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
  const [activePillar, setActivePillar] = useState('exams'); // 'exams' | 'foundations' | 'workplace'
  const [activeTab, setActiveTab] = useState('exam'); // 'exam' | 'mistakes' | 'scramble' | 'flashcards' | 'kanji' | 'grammar' | 'vocab' | 'technical'
  const [toast, setToast] = useState(null);
  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Load persistent user level preference on first mount
  useEffect(() => {
    try {
      const savedLevel = localStorage.getItem('jlpt_user_target_level');
      if (savedLevel && (savedLevel === 'N5' || savedLevel === 'N4')) {
        setLevel(savedLevel);
      } else {
        // First time user: show onboarding level selector
        setIsFirstTimeUser(true);
        setIsLevelModalOpen(true);
      }
    } catch (e) {
      console.error('Failed to load level preference', e);
    }
  }, []);

  const handleSelectLevel = (newLevel) => {
    setLevel(newLevel);
    setIsLevelModalOpen(false);
    setIsFirstTimeUser(false);
    try {
      localStorage.setItem('jlpt_user_target_level', newLevel);
    } catch (e) {
      console.error('Failed to save level preference', e);
    }
    showToast(`🎯 Target set to JLPT ${newLevel}. Curriculum updated!`, 'success');
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  // Active level data
  const currentGrammar = level === 'N5' ? N5_GRAMMAR : N4_GRAMMAR;
  const currentKanji = level === 'N5' ? N5_KANJI : N4_KANJI;
  const currentVocab = level === 'N5' ? N5_VOCABULARY : N4_VOCABULARY;
  const currentExam = level === 'N5' ? N5_MOCK_EXAM : N4_MOCK_EXAM;

  // Handle switching pillar
  const handlePillarChange = (pillar) => {
    setActivePillar(pillar);
    if (pillar === 'exams') setActiveTab('exam');
    else if (pillar === 'foundations') setActiveTab('flashcards');
    else if (pillar === 'workplace') setActiveTab('parts_explorer');
  };

  const renderActiveToolContent = () => {
    switch (activeTab) {
      case 'exam':
        return <JLPTExamSimulator level={level} onToast={setToast} />;
      case 'rush':
        return <SpeedKanjiRush level={level} onToast={showToast} />;
      case 'mistakes':
        return <MistakeBankModal onToast={showToast} />;
      case 'scramble':
        return <SentenceScramblerGame level={level} onToast={showToast} />;
      case 'flashcards':
        return <FlashcardDojo grammarList={currentGrammar} level={level} onToast={showToast} />;
      case 'kanji':
        return <KanjiDojo kanjiList={currentKanji} level={level} onToast={setToast} />;
      case 'grammar':
        return <GrammarMaster grammarList={currentGrammar} level={level} onToast={setToast} />;
      case 'vocab':
        return <VocabularyVault vocabList={currentVocab} level={level} onToast={setToast} />;
      case 'parts_explorer':
        return <MachinePartsExplorer onToast={showToast} />;
      case 'roleplay':
        return <WorkshopRoleplayCoach onToast={showToast} />;
      case 'business_email':
        return <BusinessEmailStudio onToast={showToast} />;
      case 'technical':
        return <TechnicalJapaneseHub onToast={showToast} />;
      default:
        return <JLPTExamSimulator level={level} onToast={setToast} />;
    }
  };

  return (
    <SystemShell
      activePath="/japanese"
      eyebrow="LANGUAGE & EXCELLENCE"
      title="Japanese Active Learning Hub (日本語コーナー)"
      description="Streamlined Japanese mastery environment for JLPT proficiency (N5 & N4) and Factory 5S Operations."
      actions={
        <div className="flex items-center gap-2">
          {/* Zen Focus Mode CTA */}
          <Button
            size="sm"
            variant="primary"
            className="bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black shadow-md flex items-center gap-1.5 active:scale-95 text-xs"
            onClick={() => {
              setIsFocusMode(true);
              showToast('🧘 Zen Focus Mode Activated. Press ESC to exit anytime.', 'info');
            }}
          >
            <span>🎯</span>
            <span>Focus Mode (集中)</span>
          </Button>

          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold shadow-xs transition-all ${
              level === 'N5'
                ? 'bg-amber-50 border-amber-300/80 text-amber-900'
                : 'bg-blue-50 border-blue-300/80 text-blue-900'
            }`}
          >
            <span className="text-sm">{level === 'N5' ? '🌸' : '⛩️'}</span>
            <span className="hidden sm:inline">Target:</span>
            <span>JLPT {level}</span>
            <button
              type="button"
              onClick={() => setIsLevelModalOpen(true)}
              className="ml-0.5 text-[11px] text-slate-500 hover:text-slate-900 font-semibold underline cursor-pointer"
              title="Switch between JLPT N5 and N4"
            >
              ▾
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Tier 1: Main Learning Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => handlePillarChange('exams')}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activePillar === 'exams'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <span className="text-base">⛩️</span>
            <span>JLPT Exam Suite (試験対策)</span>
          </button>

          <button
            type="button"
            onClick={() => handlePillarChange('foundations')}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activePillar === 'foundations'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <span className="text-base">📖</span>
            <span>Skills & Foundations (基礎ドリル)</span>
          </button>

          <button
            type="button"
            onClick={() => handlePillarChange('workplace')}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activePillar === 'workplace'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <span className="text-base">🏭</span>
            <span>Factory & Komatsu (現場・建機・敬語)</span>
          </button>
        </div>

        {/* Tier 2: Submodule Pills based on selected Pillar (Scrollable on mobile) */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto scrollbar-none flex-nowrap sm:flex-wrap -mx-3 px-3 sm:mx-0 sm:px-0">
          {activePillar === 'exams' && (
            <>
              <button
                type="button"
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'exam'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
                onClick={() => setActiveTab('exam')}
              >
                ⏱️ Full Mock Exams
              </button>
              <button
                type="button"
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'rush'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
                onClick={() => setActiveTab('rush')}
              >
                ⚡ Speed Kanji Rush
              </button>
              <button
                type="button"
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'mistakes'
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
                onClick={() => setActiveTab('mistakes')}
              >
                🎯 Error Vault
              </button>
              <button
                type="button"
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'scramble'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
                onClick={() => setActiveTab('scramble')}
              >
                🧩 Sentence Scrambler
              </button>
            </>
          )}

          {activePillar === 'foundations' && (
            <>
              <button
                type="button"
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'flashcards'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
                onClick={() => setActiveTab('flashcards')}
              >
                📇 Flashcard Dojo (SRS)
              </button>
              <button
                type="button"
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'kanji'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
                onClick={() => setActiveTab('kanji')}
              >
                ⛩️ Kanji Matrix & Canvas
              </button>
              <button
                type="button"
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'grammar'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
                onClick={() => setActiveTab('grammar')}
              >
                📖 Grammar Master
              </button>
              <button
                type="button"
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'vocab'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
                onClick={() => setActiveTab('vocab')}
              >
                📚 Vocabulary Vault
              </button>
            </>
          )}

          {activePillar === 'workplace' && (
            <>
              <button
                type="button"
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'parts_explorer'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
                onClick={() => setActiveTab('parts_explorer')}
              >
                🚜 Komatsu Parts Explorer
              </button>
              <button
                type="button"
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'roleplay'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
                onClick={() => setActiveTab('roleplay')}
              >
                🗣️ Dialogue Coach
              </button>
              <button
                type="button"
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'business_email'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
                onClick={() => setActiveTab('business_email')}
              >
                ✉️ Business Email & Keigo
              </button>
              <button
                type="button"
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'technical'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
                onClick={() => setActiveTab('technical')}
              >
                🏭 5S & Safety Glossary
              </button>
            </>
          )}
        </div>

        {/* Active Sub-Module View */}
        {renderActiveToolContent()}
      </div>

      {/* Zen Focus Mode Fullscreen Overlay */}
      <ZenFocusModeOverlay
        isOpen={isFocusMode}
        onClose={() => setIsFocusMode(false)}
        level={level}
        activeTab={activeTab}
        onSelectTab={(newTab) => setActiveTab(newTab)}
        onToast={showToast}
      >
        {renderActiveToolContent()}
      </ZenFocusModeOverlay>

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <LevelSelectorModal
        isOpen={isLevelModalOpen}
        isFirstTime={isFirstTimeUser}
        currentLevel={level}
        onClose={() => setIsLevelModalOpen(false)}
        onSelectLevel={handleSelectLevel}
      />
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
                <h3 className="text-3xl font-medium text-slate-800 tracking-wide">
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
                  <p className="text-xl font-bold text-slate-800 mt-0.5">{currentCard?.meaning}</p>
                  <p className="text-xs text-slate-600 mt-1">{currentCard?.description}</p>
                </div>
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <span className="text-xs font-bold uppercase text-slate-400">Example Dialogues</span>
                  {(currentCard?.examples || []).map((ex, idx) => (
                    <div key={idx} className="p-2.5 bg-white rounded-lg border border-slate-200/80 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-800">{ex.jp}</span>
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
    isDrawingRef.current = true;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#1E293B';
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
                <span className="text-3xl font-normal text-slate-900 block">{kanji.char}</span>
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
