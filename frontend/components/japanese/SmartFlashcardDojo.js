'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

function speakJapanese(text) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP';
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
}

// SM-2 Spaced Repetition calculation
function calculateSM2(currentSrs, rating) {
  const { interval = 0, repetitions = 0, easeFactor = 2.5, status = 'new' } = currentSrs || {};

  let nextInterval = 1;
  let nextRepetitions = repetitions;
  let nextEaseFactor = easeFactor;
  let nextStatus = status;

  if (rating === 'again') {
    nextRepetitions = 0;
    nextInterval = 1;
    nextEaseFactor = Math.max(1.3, easeFactor - 0.2);
    nextStatus = 'learning';
  } else if (rating === 'hard') {
    nextRepetitions = Math.max(1, repetitions + 1);
    nextInterval = interval === 0 ? 1 : Math.max(1, Math.round(interval * 1.2));
    nextEaseFactor = Math.max(1.3, easeFactor - 0.15);
    nextStatus = 'learning';
  } else if (rating === 'good') {
    nextRepetitions = repetitions + 1;
    if (nextRepetitions === 1) nextInterval = 2;
    else if (nextRepetitions === 2) nextInterval = 4;
    else nextInterval = Math.round(interval * easeFactor);
    nextStatus = nextInterval >= 6 ? 'mastered' : 'review';
  } else if (rating === 'easy') {
    nextRepetitions = repetitions + 1;
    if (nextRepetitions === 1) nextInterval = 4;
    else nextInterval = Math.round((interval || 1) * easeFactor * 1.3);
    nextEaseFactor = easeFactor + 0.15;
    nextStatus = 'mastered';
  }

  const now = new Date();
  const nextDueDate = new Date(now.getTime() + nextInterval * 24 * 60 * 60 * 1000).toISOString();

  return {
    interval: nextInterval,
    repetitions: nextRepetitions,
    easeFactor: parseFloat(nextEaseFactor.toFixed(2)),
    status: nextStatus,
    dueDate: nextDueDate,
    lastReviewed: now.toISOString(),
  };
}

export default function SmartFlashcardDojo({ grammarList = [], level = 'N5', onToast }) {
  const [flipped, setFlipped] = useState(false);
  const [srsState, setSrsState] = useState({});
  const [sessionQueue, setSessionQueue] = useState([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState(0);
  const [cardsReviewedThisSession, setCardsReviewedThisSession] = useState(0);
  const [deckFilter, setDeckFilter] = useState('smart'); // 'smart' (due/new) | 'all' | 'learning'
  const [streak, setStreak] = useState(1);

  // 1. Load persistent SRS state & streak
  useEffect(() => {
    try {
      const storedSrs = localStorage.getItem(`jlpt_srs_${level}`);
      const parsedSrs = storedSrs ? JSON.parse(storedSrs) : {};
      setSrsState(parsedSrs);

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

  // 2. Build smart queue based on filter and due dates
  const initQueue = useCallback(
    (filterMode, currentSrsData = srsState) => {
      if (!grammarList || grammarList.length === 0) return;
      const now = new Date().getTime();

      let queue = [];
      if (filterMode === 'smart') {
        // Smart mode: Cards due for review (dueDate <= now) or never studied
        const dueOrNew = grammarList.filter((card) => {
          const cardKey = card.id || card.title;
          const srs = currentSrsData[cardKey];
          if (!srs) return true; // new card
          const dueTime = new Date(srs.dueDate).getTime();
          return dueTime <= now || srs.status === 'learning';
        });

        // If nothing is due today, pick 15 unmastered/random cards
        queue = dueOrNew.length > 0 ? dueOrNew : grammarList.slice(0, 15);
      } else if (filterMode === 'learning') {
        // Only cards marked learning/again
        const learningCards = grammarList.filter((card) => {
          const cardKey = card.id || card.title;
          const srs = currentSrsData[cardKey];
          return srs && (srs.status === 'learning' || srs.interval <= 1);
        });
        queue = learningCards.length > 0 ? learningCards : grammarList.slice(0, 10);
      } else {
        // All cards
        queue = [...grammarList];
      }

      // Shuffle queue for varied practice
      const shuffled = [...queue].sort(() => Math.random() - 0.5);
      setSessionQueue(shuffled);
      setCurrentQueueIndex(0);
      setFlipped(false);
    },
    [grammarList, srsState]
  );

  // Initialize queue once grammarList / srsState are ready
  useEffect(() => {
    initQueue(deckFilter);
  }, [grammarList, deckFilter, initQueue]);

  // Keyboard shortcut listener: Space to flip, 1-4 to rate
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (flipped) {
        if (e.key === '1') handleRateCard('again');
        else if (e.key === '2') handleRateCard('hard');
        else if (e.key === '3') handleRateCard('good');
        else if (e.key === '4') handleRateCard('easy');
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flipped, currentQueueIndex, sessionQueue]);

  const currentCard = sessionQueue[currentQueueIndex];
  const cardKey = currentCard?.id || currentCard?.title || `card_${currentQueueIndex}`;
  const cardSrs = srsState[cardKey] || { interval: 0, repetitions: 0, status: 'new' };

  const masteredCount = useMemo(() => {
    return Object.values(srsState).filter((c) => c.status === 'mastered').length;
  }, [srsState]);

  const learningCount = useMemo(() => {
    return Object.values(srsState).filter((c) => c.status === 'learning').length;
  }, [srsState]);

  // Handle rating a card with Smart SM-2 Re-Queueing
  function handleRateCard(rating) {
    if (!currentCard) return;
    setFlipped(false);

    // 1. Calculate updated SM-2 parameters
    const updatedCardSrs = calculateSM2(cardSrs, rating);
    const newSrsState = {
      ...srsState,
      [cardKey]: updatedCardSrs,
    };

    setSrsState(newSrsState);
    try {
      localStorage.setItem(`jlpt_srs_${level}`, JSON.stringify(newSrsState));
    } catch (e) {
      console.error('Failed to save SRS state', e);
    }

    setCardsReviewedThisSession((c) => c + 1);

    // 2. SMART QUEUE RE-INSERTION (Anki-style behavior)
    let nextQueue = [...sessionQueue];

    if (rating === 'again') {
      // Re-insert 3 positions later so user is forced to recall it again in this session
      const cardToReinsert = nextQueue[currentQueueIndex];
      nextQueue.splice(currentQueueIndex, 1);
      const reinsertPos = Math.min(nextQueue.length, currentQueueIndex + 3);
      nextQueue.splice(reinsertPos, 0, cardToReinsert);

      onToast?.({
        message: `Card marked for re-study. It will reappear in 3 cards!`,
        type: 'info',
      });
      setSessionQueue(nextQueue);
    } else if (rating === 'hard') {
      // Re-insert at the end of the session for one last check
      const cardToReinsert = nextQueue[currentQueueIndex];
      nextQueue.splice(currentQueueIndex, 1);
      nextQueue.push(cardToReinsert);

      onToast?.({
        message: `Marked Hard (1d). Queued at end of session.`,
        type: 'info',
      });
      setSessionQueue(nextQueue);
    } else {
      // 'good' or 'easy' -> Graduate card out of today's queue!
      nextQueue.splice(currentQueueIndex, 1);
      onToast?.({
        message: `✓ Graduated! Next review in ${updatedCardSrs.interval} days.`,
        type: 'success',
      });
      setSessionQueue(nextQueue);
      if (currentQueueIndex >= nextQueue.length && nextQueue.length > 0) {
        setCurrentQueueIndex(0);
      }
    }
  }

  // -------------------------------------------------------------------------
  // SESSION COMPLETED STATE
  // -------------------------------------------------------------------------
  if (sessionQueue.length === 0) {
    return (
      <div className="p-8 sm:p-12 text-center max-w-xl mx-auto space-y-6 bg-white border-2 border-slate-200 rounded-3xl shadow-xl animate-fadeIn">
        <div className="space-y-3">
          <span className="text-6xl animate-bounce inline-block">🎉</span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Daily Dojo Completed! (学習完了)
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Outstanding! You have reviewed and graduated all due cards for this session. Your memory retention is actively strengthening.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Reviews Done</span>
            <p className="text-2xl font-black text-slate-900 font-mono">{cardsReviewedThisSession}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Mastered</span>
            <p className="text-2xl font-black text-emerald-600 font-mono">{masteredCount}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Streak</span>
            <p className="text-2xl font-black text-amber-600 font-mono">🔥 {streak}d</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            className="w-full sm:w-auto text-xs font-bold border-slate-300 cursor-pointer"
            onClick={() => initQueue('learning')}
          >
            🎯 Drill Weak Cards ({learningCount})
          </Button>
          <Button
            variant="primary"
            className="w-full sm:w-auto text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 cursor-pointer shadow-md"
            onClick={() => initQueue('all')}
          >
            ⚡ Practice 15 More Cards
          </Button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // ACTIVE FLASHCARD STAGE
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Sleek Deck Control & Mode Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white border border-slate-200/80 rounded-2xl shadow-xs text-xs font-bold">
        {/* Left: Level & Progress */}
        <div className="flex items-center gap-2">
          <span className="bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-lg">
            JLPT {level}
          </span>
          <span className="text-slate-500 font-mono">
            Remaining: <strong className="text-slate-900">{sessionQueue.length}</strong> cards
          </span>
        </div>

        {/* Center: Smart Deck Mode Filter */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setDeckFilter('smart')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              deckFilter === 'smart' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🧠 Smart Due
          </button>
          <button
            onClick={() => setDeckFilter('learning')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              deckFilter === 'learning' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🎯 Weak Only
          </button>
          <button
            onClick={() => setDeckFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              deckFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🔁 All ({grammarList.length})
          </button>
        </div>

        {/* Right: Mastered Count */}
        <div className="flex items-center gap-2">
          <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg">
            ✓ {masteredCount} Mastered
          </span>
        </div>
      </div>

      {/* Fixed-Height Contained Flip Card (No Layout Shift or Page Scrolling) */}
      <div className="flex flex-col items-center justify-center p-2 sm:p-4 bg-slate-900/5 rounded-3xl border border-slate-200/80">
        <div
          className={`w-full p-6 sm:p-8 bg-white border-2 ${
            flipped ? 'border-amber-400 bg-amber-50/20' : 'border-slate-300'
          } rounded-3xl shadow-lg cursor-pointer transition-all duration-200 flex flex-col justify-between min-h-[390px] sm:min-h-[430px] select-none`}
          onClick={() => setFlipped(!flipped)}
        >
          {/* Card Top Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
            <div className="flex items-center gap-2">
              <Badge tone="info">{currentCard?.category || 'Grammar'}</Badge>
              {cardSrs.status === 'mastered' && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  ✓ Mastered
                </span>
              )}
              {cardSrs.status === 'learning' && (
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                  ⏳ Learning
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1 cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-xl transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  speakJapanese(currentCard?.title || '');
                }}
              >
                <span>🔊</span> Listen
              </button>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">Click to Flip</span>
            </div>
          </div>

          {/* Card Body */}
          <div className="flex-1 overflow-y-auto scrollbar-none flex flex-col justify-center py-2">
            {!flipped ? (
              <div className="text-center space-y-4 my-auto">
                <h3 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-wide font-sans">
                  {currentCard?.title}
                </h3>
                <p className="text-xs font-mono text-slate-600 bg-slate-100 inline-block px-4 py-1.5 rounded-full border border-slate-200">
                  Formula: {currentCard?.formula}
                </p>
              </div>
            ) : (
              <div className="space-y-3.5 my-auto">
                {/* Meaning Header Card */}
                <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200/80">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase text-amber-800 tracking-widest">
                      Meaning
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 font-medium">
                      {currentCard?.formula}
                    </span>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-slate-950 mt-1">
                    {currentCard?.meaning}
                  </p>
                  {currentCard?.description && (
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {currentCard?.description}
                    </p>
                  )}
                </div>

                {/* Example Sentences (Large, High Contrast, Crystal Clear) */}
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-widest block px-1">
                    Example Sentence
                  </span>
                  {(currentCard?.examples || []).slice(0, 1).map((ex, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 sm:p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-2"
                    >
                      {/* Japanese Line (Large font) */}
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-base sm:text-lg font-bold text-slate-950 font-sans leading-relaxed">
                          {ex.jp}
                        </p>
                        <button
                          type="button"
                          className="text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 p-1.5 rounded-xl text-sm cursor-pointer shrink-0 transition-all active:scale-95"
                          onClick={(e) => {
                            e.stopPropagation();
                            speakJapanese(ex.jp);
                          }}
                          title="Listen to Japanese"
                        >
                          🔊
                        </button>
                      </div>

                      {/* Romaji Reading */}
                      <p className="text-xs font-mono font-semibold text-indigo-700 bg-indigo-50 inline-block px-2 py-0.5 rounded-md border border-indigo-100">
                        {ex.romaji}
                      </p>

                      {/* English Translation */}
                      <p className="text-sm font-semibold text-slate-700 border-t border-slate-200/80 pt-1.5 leading-normal">
                        {ex.en}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Card Footer */}
          <div className="pt-2.5 border-t border-slate-100 text-center text-xs text-slate-400 font-medium shrink-0">
            {flipped ? 'Rate recall memory below (1 - 4):' : '💡 Click card or press Space to flip.'}
          </div>
        </div>

        {/* SRS Rating Action Bar */}
        <div className="w-full mt-3 h-[52px] flex items-center">
          {flipped ? (
            <div className="flex items-center gap-2 sm:gap-3 w-full animate-fadeIn">
              <button
                type="button"
                className="flex-1 py-2.5 rounded-2xl bg-rose-100 text-rose-900 font-bold text-xs hover:bg-rose-200 transition-all cursor-pointer shadow-xs active:scale-95 text-center"
                onClick={() => handleRateCard('again')}
                title="Failed - Re-learn in 3 cards"
              >
                Again (1)
                <span className="block text-[10px] font-normal opacity-75">Re-queue</span>
              </button>
              <button
                type="button"
                className="flex-1 py-2.5 rounded-2xl bg-amber-100 text-amber-900 font-bold text-xs hover:bg-amber-200 transition-all cursor-pointer shadow-xs active:scale-95 text-center"
                onClick={() => handleRateCard('hard')}
                title="Difficult - Review at end of session"
              >
                Hard (2)
                <span className="block text-[10px] font-normal opacity-75">End queue</span>
              </button>
              <button
                type="button"
                className="flex-1 py-2.5 rounded-2xl bg-indigo-100 text-indigo-900 font-bold text-xs hover:bg-indigo-200 transition-all cursor-pointer shadow-xs active:scale-95 text-center"
                onClick={() => handleRateCard('good')}
                title="Good - Next review in 2-4 days"
              >
                Good (3)
                <span className="block text-[10px] font-normal opacity-75">Graduate</span>
              </button>
              <button
                type="button"
                className="flex-1 py-2.5 rounded-2xl bg-emerald-100 text-emerald-900 font-bold text-xs hover:bg-emerald-200 transition-all cursor-pointer shadow-xs active:scale-95 text-center"
                onClick={() => handleRateCard('easy')}
                title="Easy - Next review in 7+ days"
              >
                Easy (4)
                <span className="block text-[10px] font-normal opacity-75">Mastered</span>
              </button>
            </div>
          ) : (
            <div className="text-center w-full text-xs text-slate-400 font-mono">
              Press <kbd className="px-1.5 py-0.5 bg-slate-200 rounded font-semibold text-slate-700">Space</kbd> or click card to flip
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
