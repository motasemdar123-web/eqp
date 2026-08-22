'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { EXAM_PAPERS_CATALOG, N5_SECTIONS_DATA, N4_SECTIONS_DATA } from '../../lib/japanese/examQuestionsData';

function speakJapanese(text) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP';
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
}

function toggleFullscreen() {
  if (typeof document === 'undefined') return;
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.().catch((e) => console.error(e));
  } else {
    document.exitFullscreen?.().catch((e) => console.error(e));
  }
}

function formatTimer(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function JLPTExamSimulator({
  level = 'N5',
  customExamPaper = null,
  onToast,
}) {
  const [customPapers, setCustomPapers] = useState([]);

  // Load custom papers from API / localStorage
  useEffect(() => {
    async function fetchCustomPapers() {
      let custom = [];
      try {
        const res = await fetch(`/api/japanese/exams?level=${level}`);
        if (res.ok) {
          const data = await res.json();
          custom = data.exams || [];
        }
      } catch (e) {
        console.warn('Custom exams fetch fallback', e);
      }

      try {
        const localCustom = localStorage.getItem(`jlpt_custom_exams_${level}`);
        if (localCustom) {
          const parsed = JSON.parse(localCustom);
          parsed.forEach((p) => {
            if (!custom.find((c) => c.id === p.id)) custom.push(p);
          });
        }
      } catch (e) {
        console.error('LocalStorage load error', e);
      }

      setCustomPapers(custom);
    }
    fetchCustomPapers();
  }, [level]);

  const availablePapers = useMemo(() => {
    const builtin = EXAM_PAPERS_CATALOG[level] || [];
    if (customExamPaper) {
      return [customExamPaper, ...customPapers, ...builtin];
    }
    return [...customPapers, ...builtin];
  }, [level, customExamPaper, customPapers]);

  const [selectedPaperId, setSelectedPaperId] = useState(
    customExamPaper?.id || availablePapers[0]?.id || (level === 'N5' ? 'n5-vol1' : 'n4-vol1')
  );

  // Sync selected paper if level or customExamPaper changes
  useEffect(() => {
    if (customExamPaper) {
      setSelectedPaperId(customExamPaper.id);
    } else if (availablePapers.length > 0 && !availablePapers.some((p) => p.id === selectedPaperId)) {
      setSelectedPaperId(availablePapers[0].id);
    }
  }, [level, customExamPaper, availablePapers, selectedPaperId]);

  const activePaper = availablePapers.find((p) => p.id === selectedPaperId) || availablePapers[0];
  const sections = activePaper?.sections || (level === 'N5' ? N5_SECTIONS_DATA : N4_SECTIONS_DATA);

  const [paperCategory, setPaperCategory] = useState('ALL');

  const filteredPapers = useMemo(() => {
    if (paperCategory === 'OFFICIAL') return availablePapers.filter((p) => p.badge.includes('Official'));
    if (paperCategory === 'DIAGNOSTIC') return availablePapers.filter((p) => p.badge.includes('Diagnostic') || p.badge.includes('NAT-TEST') || p.badge.includes('Grammar'));
    if (paperCategory === 'SKILLS') return availablePapers.filter((p) => p.badge.includes('Speed') || p.badge.includes('Kanji') || p.badge.includes('Audio') || p.badge.includes('Reading'));
    if (paperCategory === 'SPRINT') return availablePapers.filter((p) => p.badge.includes('Sprint'));
    return availablePapers;
  }, [availablePapers, paperCategory]);

  // Exam Workflow State: 'BRIEFING' | 'EXAM' | 'SECTION_TRANSITION' | 'RESULTS'
  const [examState, setExamState] = useState('BRIEFING');
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { [qId]: optionIndex }
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [filterReview, setFilterReview] = useState('ALL'); // 'ALL' | 'INCORRECT' | 'FLAGGED'

  const currentSection = sections[activeSectionIndex] || sections[0];
  const currentQuestions = currentSection?.questions || [];
  const currentQuestion = currentQuestions[activeQuestionIndex] || currentQuestions[0];
  const allQuestions = useMemo(() => sections.flatMap((s) => s.questions), [sections]);

  const filteredReviewQuestions = useMemo(() => {
    if (filterReview === 'INCORRECT') {
      return allQuestions.filter((q) => userAnswers[q.id] !== q.correct);
    }
    if (filterReview === 'FLAGGED') {
      return allQuestions.filter((q) => flaggedQuestions.has(q.id));
    }
    return allQuestions;
  }, [allQuestions, userAnswers, flaggedQuestions, filterReview]);

  // Audio player ref for listening section
  const audioRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Initialize section timer
  function startSection(sectionIdx) {
    setActiveSectionIndex(sectionIdx);
    setActiveQuestionIndex(0);
    const sec = sections[sectionIdx];
    setTimeRemaining(sec?.timeLimitSeconds || 20 * 60);
    setIsPaused(false);
    setExamState('EXAM');
  }

  // Timer countdown hook
  useEffect(() => {
    if (examState !== 'EXAM' || isPaused) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          handleTimeExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [examState, isPaused, activeSectionIndex]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    if (examState !== 'EXAM') return;

    function handleKeyDown(e) {
      if (['1', '2', '3', '4'].includes(e.key)) {
        const optionIdx = parseInt(e.key, 10) - 1;
        if (currentQuestion && optionIdx < currentQuestion.options.length) {
          handleSelectAnswer(currentQuestion.id, optionIdx);
        }
      } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'k') {
        if (activeQuestionIndex < currentQuestions.length - 1) {
          setActiveQuestionIndex((prev) => prev + 1);
        }
      } else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'j') {
        if (activeQuestionIndex > 0) {
          setActiveQuestionIndex((prev) => prev - 1);
        }
      } else if (e.key.toLowerCase() === 'f') {
        toggleFlag(currentQuestion?.id);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [examState, activeQuestionIndex, currentQuestion, currentQuestions.length]);

  function handleSelectAnswer(qId, optionIdx) {
    setUserAnswers((prev) => ({ ...prev, [qId]: optionIdx }));
  }

  function toggleFlag(qId) {
    if (!qId) return;
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  }

  function handleTimeExpire() {
    if (onToast) onToast({ type: 'warning', message: `Time expired for ${currentSection.title}!` });
    handleNextSection();
  }

  function handleNextSection() {
    if (activeSectionIndex < sections.length - 1) {
      setExamState('SECTION_TRANSITION');
    } else {
      setExamState('RESULTS');
    }
  }

  // Auto-record missed questions to Mistake Bank
  useEffect(() => {
    if (examState !== 'RESULTS') return;
    try {
      const missed = [];
      (allQuestions || []).forEach((q) => {
        if (!q || !q.id) return;
        if (userAnswers[q.id] !== q.correct) {
          missed.push({
            ...q,
            level: level,
            missedAt: new Date().toISOString(),
          });
        }
      });
      if (missed.length > 0) {
        const stored = localStorage.getItem('jlpt_missed_questions');
        let existing = [];
        try {
          existing = stored ? JSON.parse(stored) : [];
        } catch {
          existing = [];
        }
        if (!Array.isArray(existing)) existing = [];
        const existingIds = new Set(existing.map((item) => item?.id).filter(Boolean));
        const combined = [...existing];
        missed.forEach((m) => {
          if (m?.id && !existingIds.has(m.id)) {
            combined.push(m);
            existingIds.add(m.id);
          }
        });
        localStorage.setItem('jlpt_missed_questions', JSON.stringify(combined));
      }
    } catch (e) {
      console.error('Failed to auto-archive missed questions', e);
    }
  }, [examState, allQuestions, userAnswers, level]);

  // Scoring computations
  const scoreReport = useMemo(() => {
    let totalScore = 0;
    const sectionScores = (sections || []).map((sec) => {
      let secCorrect = 0;
      const totalQ = sec?.questions?.length || 0;
      (sec?.questions || []).forEach((q) => {
        if (q?.id && userAnswers[q.id] === q.correct) secCorrect++;
      });
      // Standard JLPT scaled to 60 pts per section
      const scaledScore = totalQ > 0 ? Math.round((secCorrect / totalQ) * 60) : 0;
      totalScore += scaledScore;
      return {
        id: sec?.id || 'section',
        title: sec?.title || 'Section',
        correctCount: secCorrect,
        totalQuestions: totalQ,
        scaledScore: scaledScore,
        passedSection: scaledScore >= 19, // Official 19/60 sectional threshold
      };
    });

    const isOverallPassed = totalScore >= 90 && sectionScores.every((s) => s.passedSection);

    return {
      totalScore: Math.min(180, totalScore),
      isOverallPassed,
      sectionScores,
    };
  }, [sections, userAnswers]);

  // -------------------------------------------------------------------------
  // 1. BRIEFING SCREEN
  // -------------------------------------------------------------------------
  if (examState === 'BRIEFING') {
    return (
      <Card className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto border-2 border-slate-300 shadow-xl bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⛩️</span>
            <div>
              <Badge tone="info">{level} Official Simulation</Badge>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">
                JLPT {level} Examination Hall (日本語能力試験)
              </h2>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
            Standard Exam Mode
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-xs font-bold uppercase text-slate-400">Total Duration</span>
            <p className="text-xl font-bold text-slate-900">
              {level === 'N5' ? '90 Minutes' : '105 Minutes'}
            </p>
            <p className="text-[11px] text-slate-500">3 Timed Test Sections</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-xs font-bold uppercase text-slate-400">Total Points</span>
            <p className="text-xl font-bold text-slate-900">180 Points</p>
            <p className="text-[11px] text-slate-500">Passing Mark: 90 / 180</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-xs font-bold uppercase text-slate-400">Section Threshold</span>
            <p className="text-xl font-bold text-slate-900">19 / 60 Points</p>
            <p className="text-[11px] text-slate-500">Min 19 pts each section</p>
          </div>
        </div>

        {/* Mock Exam Paper Selection Gallery */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <span>📚</span>
              <span>Select Mock Exam Paper (模擬試験の選択):</span>
            </h3>
            <span className="text-xs text-blue-600 font-bold font-mono">
              {filteredPapers.length} of {availablePapers.length} Papers Shown
            </span>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 pb-1">
            {[
              { id: 'ALL', label: 'All 10 Exams' },
              { id: 'OFFICIAL', label: 'Official JLPT (Vol 1 & 2)' },
              { id: 'DIAGNOSTIC', label: 'Diagnostic & Benchmark' },
              { id: 'SKILLS', label: 'Skills & Thematic Focus' },
              { id: 'SPRINT', label: 'Final Sprint 2026' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  paperCategory === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                onClick={() => setPaperCategory(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {filteredPapers.map((paper) => {
              const isSelected = selectedPaperId === paper.id;
              return (
                <div
                  key={paper.id}
                  onClick={() => {
                    setSelectedPaperId(paper.id);
                    setActiveSectionIndex(0);
                    setActiveQuestionIndex(0);
                    setUserAnswers({});
                    setFlaggedQuestions(new Set());
                  }}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer text-left space-y-2.5 ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 shadow-md ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {paper.badge}
                    </span>
                    <span className="text-xs font-bold font-mono text-slate-700 bg-white/80 px-2 py-0.5 rounded border border-slate-200">
                      {paper.totalQuestions} Questions
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 leading-snug">
                    {paper.title}
                  </h4>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {paper.description}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-600 font-medium">
                    <span>⏱ 3 Official Sections</span>
                    <span className={isSelected ? 'text-blue-700 font-bold' : 'text-slate-400'}>
                      {isSelected ? '✓ Selected Paper' : 'Select Paper ➔'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section Schedule */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              {activePaper.shortTitle || activePaper.title} — Schedule:
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              Total: {activePaper.totalQuestions} Questions
            </span>
          </div>
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {sections.map((sec, idx) => (
              <div key={sec.id} className="p-4 flex items-center justify-between bg-white hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{sec.title}</p>
                    <p className="text-xs text-slate-500">{sec.questions.length} Questions</p>
                  </div>
                </div>
                <div className="text-right font-mono text-xs font-bold text-slate-700">
                  ⏱ {Math.round(sec.timeLimitSeconds / 60)} Mins
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Exam Rules Alert */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 space-y-2">
          <span className="font-bold uppercase text-[10px] text-amber-800">Exam Instructions & Rules:</span>
          <ul className="list-disc list-inside space-y-1 text-slate-700">
            <li>Once you start a section, the countdown timer will run continuously.</li>
            <li>You can navigate questions using the Mark Sheet grid on the right or keyboard shortcuts (`1`, `2`, `3`, `4`).</li>
            <li>Flag questions (`F` key) to review before submitting the section.</li>
            <li>The listening section includes real audio tracks. Ensure your sound is enabled.</li>
          </ul>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
            onClick={() => {
              const audio = new Audio('/audio/japanese/n5/captured-media-2-mp3.mp3');
              audio.play();
              if (onToast) onToast({ type: 'info', message: 'Playing audio sound check...' });
            }}
          >
            🔊 Test Audio Output
          </button>
          <Button
            type="button"
            size="lg"
            className="w-full sm:w-auto px-8 font-bold shadow-md cursor-pointer"
            onClick={() => {
              setUserAnswers({});
              setFlaggedQuestions(new Set());
              startSection(0);
            }}
          >
            Begin Examination (試験開始) ➔
          </Button>
        </div>
      </Card>
    );
  }

  // -------------------------------------------------------------------------
  // 2. SECTION TRANSITION SCREEN
  // -------------------------------------------------------------------------
  if (examState === 'SECTION_TRANSITION') {
    const nextIdx = activeSectionIndex + 1;
    const nextSec = sections[nextIdx];

    return (
      <Card className="p-8 text-center max-w-xl mx-auto space-y-6 border-2 border-slate-300 shadow-xl bg-white">
        <div className="space-y-2">
          <span className="text-4xl">⏱️</span>
          <h2 className="text-xl font-bold text-slate-900">Section {activeSectionIndex + 1} Completed</h2>
          <p className="text-xs text-slate-500">
            Take a breath. You are ready to proceed to the next examination section.
          </p>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left space-y-2">
          <span className="text-[10px] font-bold uppercase text-slate-400">Next Section:</span>
          <p className="text-base font-bold text-slate-900">{nextSec?.title}</p>
          <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-200">
            <span>Questions: {nextSec?.questions.length}</span>
            <span className="font-mono font-bold">Time Limit: {Math.round((nextSec?.timeLimitSeconds || 0) / 60)} Mins</span>
          </div>
        </div>

        <Button
          type="button"
          size="lg"
          className="w-full font-bold shadow-md"
          onClick={() => startSection(nextIdx)}
        >
          Start Next Section ➔
        </Button>
      </Card>
    );
  }

  // -------------------------------------------------------------------------
  // 3. EXAM IN-PROGRESS SCREEN
  // -------------------------------------------------------------------------
  if (examState === 'EXAM') {
    const answeredCount = currentQuestions.filter((q) => userAnswers[q.id] !== undefined).length;
    const isWarningTime = timeRemaining < 5 * 60;
    const isCriticalTime = timeRemaining < 60;

    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Top Floating Exam Control Header */}
        <div className="sticky top-0 z-30 p-3 sm:p-4 bg-slate-900 text-white rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold font-mono bg-blue-600 px-2.5 py-1 rounded-lg">
              {level}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Section {activeSectionIndex + 1} of {sections.length}
                </span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-blue-300 border border-slate-700">
                  {activePaper?.shortTitle || 'Official'}
                </span>
              </div>
              <p className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
                {currentSection.shortTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Live Countdown Timer */}
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-base font-bold transition-all ${
                isCriticalTime
                  ? 'bg-red-600 text-white animate-pulse'
                  : isWarningTime
                  ? 'bg-amber-500 text-white'
                  : 'bg-white/10 text-white border border-white/20'
              }`}
            >
              <span>⏱</span>
              <span>{formatTimer(timeRemaining)}</span>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="!bg-white/10 !text-white !border-white/20 hover:!bg-white/20 cursor-pointer text-xs"
              onClick={() => {
                const unanswered = currentQuestions.length - answeredCount;
                if (
                  unanswered > 0 &&
                  !window.confirm(`You still have ${unanswered} unanswered question(s). Finish this section now?`)
                ) {
                  return;
                }
                handleNextSection();
              }}
            >
              Finish Section ➔
            </Button>
          </div>
        </div>

        {/* Main Test Body: Question Card & Mark Sheet */}
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Question Viewer */}
          <Card className="p-6 md:p-8 space-y-6 bg-white border border-slate-200 shadow-md flex flex-col justify-between min-h-[460px]">
            <div className="space-y-6">
              {/* Question Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">
                    Question {activeQuestionIndex + 1} / {currentQuestions.length}
                  </span>
                  <Badge tone="neutral">{currentQuestion.type}</Badge>
                </div>

                <button
                  type="button"
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    flaggedQuestions.has(currentQuestion?.id)
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  onClick={() => toggleFlag(currentQuestion?.id)}
                >
                  <span>🚩</span>
                  <span>{flaggedQuestions.has(currentQuestion?.id) ? 'Flagged' : 'Flag Question (F)'}</span>
                </button>
              </div>

              {/* Listening Audio Player (Only for real official broadcast audio) */}
              {currentQuestion.audioSrc && (
                <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3 shadow-md border border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="font-bold text-white tracking-wide">
                        🎧 Official JLPT Studio Audio Broadcast (実物の公式音声)
                      </span>
                    </div>
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {currentSection?.shortTitle || '聴解'}
                    </span>
                  </div>

                  <audio
                    ref={audioRef}
                    controls
                    className="w-full h-9 rounded-lg"
                    src={currentQuestion.audioSrc || currentSection?.masterAudioUrl}
                    onTimeUpdate={() => {
                      if (!audioRef.current) return;
                      if (
                        currentQuestion?.audioEnd !== null &&
                        currentQuestion?.audioEnd !== undefined &&
                        audioRef.current.currentTime >= currentQuestion.audioEnd
                      ) {
                        audioRef.current.pause();
                      }
                    }}
                    onPlay={() => {
                      if (
                        audioRef.current &&
                        currentQuestion?.audioStart !== null &&
                        currentQuestion?.audioStart !== undefined &&
                        (audioRef.current.currentTime < currentQuestion.audioStart ||
                          audioRef.current.currentTime > currentQuestion.audioEnd)
                      ) {
                        audioRef.current.currentTime = currentQuestion.audioStart;
                      }
                    }}
                    autoPlay={false}
                  />

                  <p className="text-[11px] text-slate-400">
                    💡 Listen to the broadcast recording carefully, then select the best matching answer below.
                  </p>
                </div>
              )}

              {/* Question Illustration Image (If present) */}
              {currentQuestion.image && (
                <div className="flex justify-center p-3 bg-slate-50 border border-slate-200 rounded-2xl my-2 shadow-inner">
                  <img
                    src={currentQuestion.image}
                    alt="Question Illustration"
                    className="max-h-80 object-contain rounded-lg shadow-sm"
                  />
                </div>
              )}

              {/* Question Text (Only for text questions without an image) */}
              {!currentQuestion.image && (currentQuestion.question || currentQuestion.prompt) && (
                <div className="text-lg font-bold text-slate-900 whitespace-pre-line leading-relaxed">
                  <span
                    dangerouslySetInnerHTML={{ __html: currentQuestion.question || currentQuestion.prompt }}
                  />
                </div>
              )}

              {/* 4 Interactive Option Radio Cards (Supports Picture & Text Choices) */}
              <div className="grid gap-2.5 sm:gap-3 sm:grid-cols-2 pt-2">
                {currentQuestion.options.map((optionText, optIdx) => {
                  const isSelected = userAnswers[currentQuestion.id] === optIdx;
                  const optionImage = currentQuestion.optionImages?.[optIdx];

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      className={`p-3 sm:p-4 min-h-[54px] rounded-2xl border-2 text-left text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-start gap-3 active:scale-[0.99] ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 text-blue-950 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                      }`}
                      onClick={() => handleSelectAnswer(currentQuestion.id, optIdx)}
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold mt-0.5 ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {optIdx + 1}
                      </span>
                      <div className="flex-1 flex flex-col gap-2">
                        {optionImage && (
                          <div className="p-1 bg-white rounded-lg border border-slate-200 inline-block w-fit">
                            <img
                              src={optionImage}
                              alt={`Choice ${optIdx + 1}`}
                              className="max-h-24 sm:max-h-32 object-contain rounded"
                            />
                          </div>
                        )}
                        {optionText && <span className="leading-snug">{optionText}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Question Step Bar */}
            <div className="flex items-center justify-between pt-4 sm:pt-6 border-t border-slate-100 gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={activeQuestionIndex === 0}
                onClick={() => setActiveQuestionIndex((prev) => prev - 1)}
                className="text-xs"
              >
                ← Prev
              </Button>

              <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                Keyboard: 1, 2, 3, 4 to answer • ← / → to navigate
              </span>

              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={activeQuestionIndex === currentQuestions.length - 1}
                onClick={() => setActiveQuestionIndex((prev) => prev + 1)}
                className="text-xs"
              >
                Next →
              </Button>
            </div>
          </Card>

          {/* Official Mark Sheet Sidebar (マークシート) */}
          <Card className="p-5 space-y-4 h-fit bg-slate-50/80 border border-slate-200">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Mark Sheet (解答用紙)</h3>
              <p className="text-xs text-slate-500">
                Answered: {answeredCount} / {currentQuestions.length}
              </p>
            </div>

            {/* Questions Numbers Matrix */}
            <div className="grid grid-cols-5 gap-2">
              {currentQuestions.map((q, idx) => {
                const isAnswered = userAnswers[q.id] !== undefined;
                const isFlagged = flaggedQuestions.has(q.id);
                const isCurrent = idx === activeQuestionIndex;

                return (
                  <button
                    key={q.id}
                    type="button"
                    className={`relative p-2 text-center rounded-lg border font-mono text-xs font-bold transition-all cursor-pointer ${
                      isCurrent
                        ? 'ring-2 ring-blue-600 border-blue-600 bg-white shadow-xs'
                        : isAnswered
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
                    }`}
                    onClick={() => setActiveQuestionIndex(idx)}
                  >
                    <span>{idx + 1}</span>
                    {isAnswered && (
                      <span className="block text-[10px] opacity-75 font-normal">
                        ({userAnswers[q.id] + 1})
                      </span>
                    )}
                    {isFlagged && (
                      <span className="absolute -top-1.5 -right-1 text-[10px]">🚩</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-200 space-y-1.5 text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-slate-900 inline-block" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-white border border-slate-300 inline-block" />
                <span>Unanswered</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🚩</span>
                <span>Flagged for review</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // 4. RESULTS & SCORE REPORT SCREEN (合否結果通知書)
  // -------------------------------------------------------------------------
  const isPassed = scoreReport.isOverallPassed;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Official JLPT Certificate of Result */}
      <Card className="p-6 md:p-8 space-y-6 border-2 border-slate-300 shadow-2xl bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Official JLPT Simulation Result
              </span>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200">
                {activePaper?.shortTitle || 'Official Paper'}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-0.5">
              {activePaper?.title || `JLPT ${level} Examination Score Report`} (合否結果通知書)
            </h2>
          </div>
          <div
            className={`px-5 py-2 rounded-xl text-center font-bold text-base shadow-sm ${
              isPassed ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-red-100 text-red-900 border border-red-300'
            }`}
          >
            {isPassed ? '🎉 合格 PASS' : '✕ 不合格 FAIL'}
          </div>
        </div>

        {/* Overall Score Meter */}
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Score</span>
            <p className="text-3xl font-bold font-mono">
              {scoreReport.totalScore} <span className="text-base text-slate-400 font-normal">/ 180</span>
            </p>
            <span className="text-xs text-slate-300">Passing Mark: 90 / 180</span>
          </div>

          {(scoreReport?.sectionScores || []).map((secScore) => (
            <div key={secScore.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-xs font-bold uppercase text-slate-500 truncate block">
                {secScore.title?.split(':')?.[1] || secScore.title || 'Section'}
              </span>
              <p className="text-2xl font-bold font-mono text-slate-900">
                {secScore.scaledScore} <span className="text-xs text-slate-400 font-normal">/ 60</span>
              </p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Correct: {secScore.correctCount}/{secScore.totalQuestions}</span>
                <span className={secScore.passedSection ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>
                  {secScore.passedSection ? '✓ Pass' : '✕ Fail'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Retake / Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterReview === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}
              onClick={() => setFilterReview('ALL')}
            >
              All Questions ({(allQuestions || []).length})
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterReview === 'INCORRECT' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700'}`}
              onClick={() => setFilterReview('INCORRECT')}
            >
              Incorrect Only ({(allQuestions || []).filter((q) => q && userAnswers[q.id] !== q.correct).length})
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterReview === 'FLAGGED' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700'}`}
              onClick={() => setFilterReview('FLAGGED')}
            >
              Flagged ({flaggedQuestions.size})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => window.print()}
            >
              🖨️ Print Score Report
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => setExamState('BRIEFING')}
            >
              Retake Examination ➔
            </Button>
          </div>
        </div>
      </Card>

      {/* Detailed Question Review List */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900">
          Detailed Question Breakdown & Explanations ({(filteredReviewQuestions || []).length} Items):
        </h3>

        {(filteredReviewQuestions || []).map((q, idx) => {
          if (!q) return null;
          const chosen = userAnswers[q.id];
          const isCorrect = chosen !== undefined && chosen === q.correct;
          const isAnswered = chosen !== undefined;

          return (
            <Card
              key={q.id || idx}
              className={`p-5 space-y-4 border-2 transition-all ${
                isCorrect ? 'border-emerald-200 bg-emerald-50/20' : 'border-red-200 bg-red-50/20'
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-500 uppercase">Question {idx + 1}</span>
                  <Badge tone={isCorrect ? 'completed' : 'critical'}>
                    {isCorrect ? '✓ Correct' : isAnswered ? '✕ Incorrect' : '⚪ Unanswered'}
                  </Badge>
                  {flaggedQuestions.has(q.id) && <span className="text-xs">🚩 Flagged</span>}
                </div>
                <span className="text-xs font-mono text-slate-400">{typeof q.type === 'string' ? q.type : ''}</span>
              </div>

              {/* Question Illustration (If present) */}
              {q.image && (
                <div className="flex justify-start p-2 bg-slate-50 border border-slate-200 rounded-xl my-2 max-w-sm">
                  <img
                    src={q.image}
                    alt="Illustration"
                    className="max-h-56 object-contain rounded"
                  />
                </div>
              )}

              <div
                className="text-base font-bold text-slate-900 whitespace-pre-line"
                dangerouslySetInnerHTML={{ __html: q.question || q.prompt || '' }}
              />

              {/* Options */}
              <div className="grid gap-2 sm:grid-cols-2">
                {(q.options || []).map((opt, optIdx) => {
                  const isUserChoice = chosen === optIdx;
                  const isAnswerKey = optIdx === q.correct;

                  let style = 'bg-white border-slate-200 text-slate-700';
                  if (isAnswerKey) style = 'bg-emerald-100 border-emerald-500 text-emerald-950 font-bold';
                  else if (isUserChoice) style = 'bg-red-100 border-red-500 text-red-950';

                  return (
                    <div key={optIdx} className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${style}`}>
                      <span className="font-mono font-bold">{optIdx + 1}.</span>
                      <span className="flex-1">{opt}</span>
                      {isAnswerKey && <span className="text-emerald-700 font-bold">✓ Correct Answer</span>}
                      {isUserChoice && !isAnswerKey && <span className="text-red-700 font-bold">✕ Your Choice</span>}
                    </div>
                  );
                })}
              </div>

              {/* Audio Transcript & Real Audio Broadcast (For listening questions) */}
              {(q.audioSrc || q.transcript) && (
                <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-lg text-xs text-amber-950 space-y-2 font-mono">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800 uppercase tracking-wide">
                      <span>🎧</span>
                      <span>Official Broadcast Audio & Transcript:</span>
                    </div>
                    {q.audioSrc && (
                      <audio controls className="h-7 w-52 rounded" src={q.audioSrc} />
                    )}
                  </div>
                  {q.transcript && (
                    <p className="whitespace-pre-line leading-relaxed">{q.transcript}</p>
                  )}
                </div>
              )}

              {/* Explanation */}
              {q.explanation && (
                <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-lg text-xs text-blue-950 space-y-1">
                  <span className="font-bold uppercase text-[10px] text-blue-700">Detailed Explanation:</span>
                  <p>{typeof q.explanation === 'string' ? q.explanation : JSON.stringify(q.explanation)}</p>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
