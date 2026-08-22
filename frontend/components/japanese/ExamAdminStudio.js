'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { EXAM_PAPERS_CATALOG } from '../../lib/japanese/examQuestionsData';

function formatSeconds(secs) {
  if (isNaN(secs) || secs < 0) return '00:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const MONDAI_TYPES = [
  // Listening
  { id: 'Mondai 1 (課題理解)', label: '🎧 Mondai 1: 課題理解 (Task Comprehension)', section: 'listening' },
  { id: 'Mondai 2 (ポイント理解)', label: '🎧 Mondai 2: ポイント理解 (Key Points)', section: 'listening' },
  { id: 'Mondai 3 (発話表現)', label: '🎧 Mondai 3: 発話表現 (Verbal Expression)', section: 'listening' },
  { id: 'Mondai 4 (即時応答)', label: '🎧 Mondai 4: 即時応答 (Quick Response)', section: 'listening' },
  // Language Knowledge
  { id: 'Mondai 1 (漢字読み)', label: '📖 Mondai 1: 漢字読み (Kanji Reading)', section: 'vocab' },
  { id: 'Mondai 2 (表記)', label: '📖 Mondai 2: 表記 (Orthography/Writing)', section: 'vocab' },
  { id: 'Mondai 3 (文脈規定)', label: '📖 Mondai 3: 文脈規定 (Context Definition)', section: 'vocab' },
  { id: 'Mondai 4 (類義語・言換)', label: '📖 Mondai 4: 類義語 (Paraphrases/Synonyms)', section: 'vocab' },
  // Grammar & Reading
  { id: 'Mondai 1 (文法形式の判断)', label: '⛩️ Mondai 1: 文法形式 (Grammar Form)', section: 'grammar' },
  { id: 'Mondai 2 (文の組み立て)', label: '⛩️ Mondai 2: 文の組み立て (Sentence Scramble ★)', section: 'grammar' },
  { id: 'Mondai 3 (文章の文法)', label: '⛩️ Mondai 3: 文章の文法 (Text Grammar)', section: 'grammar' },
  { id: 'Mondai 4 (内容理解 - 短文)', label: '📄 Mondai 4: 内容理解 - 短文 (Short Passage Reading)', section: 'reading' },
  { id: 'Mondai 5 (内容理解 - 中文)', label: '📄 Mondai 5: 内容理解 - 中文 (Medium Passage Reading)', section: 'reading' },
  { id: 'Mondai 6 (情報検索)', label: '📄 Mondai 6: 情報検索 (Information Retrieval)', section: 'reading' },
];

export default function ExamAdminStudio({
  level = 'N5',
  onToast,
  onLaunchSimulator,
  onClose,
}) {
  const [selectedLevel, setSelectedLevel] = useState(level);
  const [papersList, setPapersList] = useState([]);
  const [selectedPaperId, setSelectedPaperId] = useState(null);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);

  // Active Exam Paper under edit
  const [currentPaper, setCurrentPaper] = useState(null);

  // Master Listening Audio & Splitter State
  const [masterAudioSrc, setMasterAudioSrc] = useState('');
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [markerStart, setMarkerStart] = useState(0);
  const [markerEnd, setMarkerEnd] = useState(30);
  const [isUploading, setIsUploading] = useState(false);

  // Question Editor Modal
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);

  const audioRef = useRef(null);

  // 1. Load All Papers (Built-in + Custom Saved)
  useEffect(() => {
    async function loadPapers() {
      const builtin = EXAM_PAPERS_CATALOG[selectedLevel] || [];
      let custom = [];

      try {
        const res = await fetch(`/api/japanese/exams?level=${selectedLevel}`);
        if (res.ok) {
          const data = await res.json();
          custom = data.exams || [];
        }
      } catch (e) {
        console.warn('API load failed, trying localStorage fallback', e);
      }

      // LocalStorage fallback
      try {
        const localCustom = localStorage.getItem(`jlpt_custom_exams_${selectedLevel}`);
        if (localCustom) {
          const parsed = JSON.parse(localCustom);
          // Merge avoiding ID duplicates
          parsed.forEach((p) => {
            if (!custom.find((c) => c.id === p.id)) {
              custom.push(p);
            }
          });
        }
      } catch (e) {
        console.error('LocalStorage error:', e);
      }

      const combined = [...custom, ...builtin];
      setPapersList(combined);
      if (combined.length > 0) {
        const initialId = combined[0].id;
        setSelectedPaperId(initialId);
        setCurrentPaper(JSON.parse(JSON.stringify(combined[0])));
      }
    }

    loadPapers();
  }, [selectedLevel]);

  // Handle Paper Selection
  const handleSelectPaper = (paperId) => {
    setSelectedPaperId(paperId);
    const target = papersList.find((p) => p.id === paperId);
    if (target) {
      setCurrentPaper(JSON.parse(JSON.stringify(target)));
      setActiveSectionIndex(0);
    }
  };

  // Create New Blank Custom Paper
  const handleCreateNewPaper = () => {
    const newId = `custom-exam-${selectedLevel.toLowerCase()}-${Date.now()}`;
    const newPaper = {
      id: newId,
      title: `JLPT ${selectedLevel} Custom Mock Exam ${papersList.length + 1}`,
      shortTitle: `Custom Exam ${papersList.length + 1}`,
      badge: 'Custom Studio Exam',
      year: new Date().getFullYear().toString(),
      description: `User-created custom JLPT ${selectedLevel} examination paper with customized audio and visual questions.`,
      isCustom: true,
      totalQuestions: 0,
      sections: [
        {
          id: `${newId}-sec-1`,
          title: 'Section 1: Language Knowledge (文字・語彙)',
          shortTitle: '文字・語彙 (Kanji & Vocab)',
          timeLimitSeconds: selectedLevel === 'N5' ? 1200 : 1500,
          questions: [],
        },
        {
          id: `${newId}-sec-2`,
          title: 'Section 2: Grammar & Reading (文法・読解)',
          shortTitle: '文法・読解 (Grammar & Reading)',
          timeLimitSeconds: selectedLevel === 'N5' ? 2400 : 3000,
          questions: [],
        },
        {
          id: `${newId}-sec-3`,
          title: 'Section 3: Listening (聴解)',
          shortTitle: '聴解 (Listening Comprehension)',
          timeLimitSeconds: selectedLevel === 'N5' ? 1800 : 2100,
          masterAudioUrl: '',
          questions: [],
        },
      ],
    };

    setPapersList((prev) => [newPaper, ...prev]);
    setSelectedPaperId(newId);
    setCurrentPaper(newPaper);
    setActiveSectionIndex(0);
    onToast?.({ message: `New ${selectedLevel} Exam Draft created!`, type: 'success' });
  };

  // Duplicate Current Paper
  const handleDuplicateCurrentPaper = () => {
    if (!currentPaper) return;
    const dupId = `custom-exam-${selectedLevel.toLowerCase()}-${Date.now()}`;
    const duplicated = {
      ...JSON.parse(JSON.stringify(currentPaper)),
      id: dupId,
      title: `${currentPaper.title} (Copy)`,
      shortTitle: `${currentPaper.shortTitle || 'Exam'} (Copy)`,
      isCustom: true,
    };
    setPapersList((prev) => [duplicated, ...prev]);
    setSelectedPaperId(dupId);
    setCurrentPaper(duplicated);
    onToast?.({ message: 'Exam duplicated as a custom editable paper!', type: 'success' });
  };

  // Active Section
  const currentSection = currentPaper?.sections?.[activeSectionIndex] || null;

  // Master Audio Sync
  useEffect(() => {
    if (currentSection && currentSection.masterAudioUrl) {
      setMasterAudioSrc(currentSection.masterAudioUrl);
    } else {
      setMasterAudioSrc('');
    }
  }, [currentSection]);

  // Audio Upload Handler
  const handleUploadMasterAudio = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'audio');

      const res = await fetch('/api/japanese/upload', {
        method: 'POST',
        body: formData,
      });

      let audioUrl = '';
      if (res.ok) {
        const data = await res.json();
        audioUrl = data.url;
      } else {
        // Fallback to object URL
        audioUrl = URL.createObjectURL(file);
      }

      setMasterAudioSrc(audioUrl);

      // Save to active section
      if (currentPaper && currentSection) {
        const updated = JSON.parse(JSON.stringify(currentPaper));
        updated.sections[activeSectionIndex].masterAudioUrl = audioUrl;
        setCurrentPaper(updated);
      }

      onToast?.({ message: 'Master listening audio uploaded successfully!', type: 'success' });
    } catch (err) {
      console.error('Audio upload error:', err);
      const fallbackUrl = URL.createObjectURL(file);
      setMasterAudioSrc(fallbackUrl);
      onToast?.({ message: 'Loaded audio locally.', type: 'info' });
    } finally {
      setIsUploading(false);
    }
  };

  // Image Upload Handler (General Helper)
  const uploadImageFile = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'image');

      const res = await fetch('/api/japanese/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        return data.url;
      }
    } catch (e) {
      console.error('Image upload server error, using Blob URL', e);
    }
    return URL.createObjectURL(file);
  };

  // Save Exam to Server & LocalStorage
  const handleSaveExam = async () => {
    if (!currentPaper) return;

    // Recalculate total questions
    const totalQ = (currentPaper.sections || []).reduce(
      (acc, s) => acc + (s.questions?.length || 0),
      0
    );
    const paperToSave = {
      ...currentPaper,
      totalQuestions: totalQ,
      isCustom: true,
      lastModified: new Date().toISOString(),
    };

    // 1. Save to API
    try {
      await fetch('/api/japanese/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: selectedLevel, exam: paperToSave }),
      });
    } catch (e) {
      console.warn('API save failed:', e);
    }

    // 2. Save to LocalStorage
    try {
      const localCustom = localStorage.getItem(`jlpt_custom_exams_${selectedLevel}`);
      let parsed = localCustom ? JSON.parse(localCustom) : [];
      const idx = parsed.findIndex((p) => p.id === paperToSave.id);
      if (idx >= 0) {
        parsed[idx] = paperToSave;
      } else {
        parsed.unshift(paperToSave);
      }
      localStorage.setItem(`jlpt_custom_exams_${selectedLevel}`, JSON.stringify(parsed));
    } catch (e) {
      console.error('LocalStorage save error:', e);
    }

    // Update local state
    setCurrentPaper(paperToSave);
    setPapersList((prev) =>
      prev.map((p) => (p.id === paperToSave.id ? paperToSave : p))
    );

    onToast?.({
      message: `Exam "${paperToSave.shortTitle || paperToSave.title}" saved successfully!`,
      type: 'success',
    });
  };

  // Export JSON
  const handleExportJSON = () => {
    if (!currentPaper) return;
    const blob = new Blob([JSON.stringify(currentPaper, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentPaper.id || 'jlpt-exam'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onToast?.({ message: 'Exam JSON exported successfully!', type: 'info' });
  };

  // Import JSON
  const handleImportJSON = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (!imported.sections || !Array.isArray(imported.sections)) {
          throw new Error('Invalid JLPT Exam JSON structure');
        }
        imported.id = `imported-${Date.now()}`;
        imported.isCustom = true;
        setPapersList((prev) => [imported, ...prev]);
        setSelectedPaperId(imported.id);
        setCurrentPaper(imported);
        onToast?.({ message: 'Exam JSON imported successfully!', type: 'success' });
      } catch (err) {
        alert('Failed to parse exam JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  // -------------------------------------------------------------------------
  // QUESTION MANAGEMENT
  // -------------------------------------------------------------------------
  const openNewQuestionModal = (defaultAudioSlice = null) => {
    const isListeningSec = activeSectionIndex === 2;
    const newQ = {
      id: `q-${Date.now()}`,
      type: isListeningSec ? 'Mondai 1 (課題理解)' : 'Mondai 1 (漢字読み)',
      question: isListeningSec
        ? '質問を聞いて、正しい答えを1つ選んでください。'
        : '下線の言葉はどう読みますか。',
      image: null,
      audioSrc: defaultAudioSlice ? masterAudioSrc : '',
      audioStart: defaultAudioSlice ? defaultAudioSlice.start : null,
      audioEnd: defaultAudioSlice ? defaultAudioSlice.end : null,
      options: ['選択肢 1', '選択肢 2', '選択肢 3', '選択肢 4'],
      optionImages: [null, null, null, null],
      optionTypes: ['text', 'text', 'text', 'text'], // 'text' | 'image' | 'both'
      correct: 0,
      explanation: '正解の解説を入力してください。',
      script: isListeningSec ? '男の人と女の人が話しています...' : '',
    };
    setEditingQuestion(newQ);
    setEditingQuestionIndex(null);
    setIsQuestionModalOpen(true);
  };

  const openEditQuestionModal = (question, index) => {
    setEditingQuestion(JSON.parse(JSON.stringify(question)));
    setEditingQuestionIndex(index);
    setIsQuestionModalOpen(true);
  };

  const handleSaveQuestion = () => {
    if (!editingQuestion || !currentPaper || !currentSection) return;

    const updated = JSON.parse(JSON.stringify(currentPaper));
    const secQuestions = updated.sections[activeSectionIndex].questions || [];

    if (editingQuestionIndex !== null && editingQuestionIndex >= 0) {
      secQuestions[editingQuestionIndex] = editingQuestion;
    } else {
      secQuestions.push(editingQuestion);
    }

    updated.sections[activeSectionIndex].questions = secQuestions;
    setCurrentPaper(updated);
    setIsQuestionModalOpen(false);
    onToast?.({ message: 'Question updated in draft!', type: 'success' });
  };

  const handleDeleteQuestion = (index) => {
    if (!window.confirm(`Delete question #${index + 1}?`)) return;
    const updated = JSON.parse(JSON.stringify(currentPaper));
    updated.sections[activeSectionIndex].questions.splice(index, 1);
    setCurrentPaper(updated);
    onToast?.({ message: 'Question removed from section', type: 'info' });
  };

  const handleMoveQuestion = (index, direction) => {
    const updated = JSON.parse(JSON.stringify(currentPaper));
    const list = updated.sections[activeSectionIndex].questions;
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const [item] = list.splice(index, 1);
    list.splice(targetIdx, 0, item);
    setCurrentPaper(updated);
  };

  // Add Question directly from Audio Slicer Markers
  const handleAddQuestionFromAudioSlice = () => {
    openNewQuestionModal({
      start: markerStart,
      end: markerEnd,
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-fadeIn">
      {/* Top Header & Exam Paper Selector Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🛠️</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900">
                  JLPT Exam Admin Studio (試験作成・管理)
                </h2>
                <Badge tone="info">Admin Panel</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Create official & custom exams, upload audio master tracks, split audio into question slices, and build visual picture questions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-bold border-slate-300 cursor-pointer"
              onClick={handleExportJSON}
            >
              📥 Export JSON
            </Button>
            <label className="ds-btn ds-btn-secondary text-xs font-bold cursor-pointer py-1.5 px-3 rounded-xl border border-slate-300 hover:bg-slate-50">
              📤 Import JSON
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportJSON}
              />
            </label>
            <Button
              variant="primary"
              size="sm"
              className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md cursor-pointer"
              onClick={handleSaveExam}
            >
              💾 Save Exam
            </Button>
            {onLaunchSimulator && currentPaper && (
              <Button
                variant="primary"
                size="sm"
                className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md cursor-pointer"
                onClick={() => onLaunchSimulator(currentPaper)}
              >
                ▶ Test Simulator
              </Button>
            )}
          </div>
        </div>

        {/* Paper & Level Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* Level Switcher */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600">Level:</span>
            {['N5', 'N4'].map((lvl) => (
              <button
                key={lvl}
                type="button"
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedLevel === lvl
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                onClick={() => setSelectedLevel(lvl)}
              >
                JLPT {lvl}
              </button>
            ))}
          </div>

          {/* Exam Paper Dropdown */}
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <span className="font-bold text-slate-600 shrink-0">Select Paper:</span>
            <select
              value={selectedPaperId || ''}
              onChange={(e) => handleSelectPaper(e.target.value)}
              className="ds-input text-xs font-semibold py-1 px-3 w-full bg-slate-50 border-slate-300 rounded-xl"
            >
              {papersList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.isCustom ? '⭐ ' : '📘 '}
                  {p.shortTitle || p.title} ({p.sections?.reduce((a, s) => a + (s.questions?.length || 0), 0) || 0} Qs)
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-bold hover:bg-amber-100 transition-all cursor-pointer flex items-center gap-1"
              onClick={handleCreateNewPaper}
            >
              <span>+</span> New Custom Exam
            </button>
            <button
              type="button"
              className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-bold hover:bg-slate-200 transition-all cursor-pointer flex items-center gap-1"
              onClick={handleDuplicateCurrentPaper}
            >
              <span>📋</span> Duplicate Paper
            </button>
          </div>
        </div>
      </div>

      {/* Main Studio Body: Paper Metadata + Sections & Question Studio */}
      {currentPaper ? (
        <div className="space-y-6">
          {/* Paper Metadata Edit Card */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase text-amber-700 tracking-wider">
                Exam Paper Properties
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ID: {currentPaper.id}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Full Exam Title:</label>
                <input
                  type="text"
                  className="ds-input text-xs w-full"
                  value={currentPaper.title || ''}
                  onChange={(e) =>
                    setCurrentPaper({ ...currentPaper, title: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Short Title / Pill:</label>
                <input
                  type="text"
                  className="ds-input text-xs w-full"
                  value={currentPaper.shortTitle || ''}
                  onChange={(e) =>
                    setCurrentPaper({ ...currentPaper, shortTitle: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Badge / Edition:</label>
                <input
                  type="text"
                  className="ds-input text-xs w-full"
                  value={currentPaper.badge || ''}
                  onChange={(e) =>
                    setCurrentPaper({ ...currentPaper, badge: e.target.value })
                  }
                />
              </div>

              <div className="md:col-span-3 space-y-1">
                <label className="font-bold text-slate-700">Description & Notes:</label>
                <input
                  type="text"
                  className="ds-input text-xs w-full"
                  value={currentPaper.description || ''}
                  onChange={(e) =>
                    setCurrentPaper({ ...currentPaper, description: e.target.value })
                  }
                />
              </div>
            </div>
          </Card>

          {/* Section Selector Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
            {currentPaper.sections?.map((sec, idx) => (
              <button
                key={sec.id || idx}
                type="button"
                className={`px-4 py-2 rounded-2xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                  activeSectionIndex === idx
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
                onClick={() => setActiveSectionIndex(idx)}
              >
                <span>{idx === 2 ? '🎧' : idx === 1 ? '📖' : '⛩️'}</span>
                <span>{sec.shortTitle || sec.title}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                    activeSectionIndex === idx ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {sec.questions?.length || 0} Qs
                </span>
              </button>
            ))}
          </div>

          {/* Section 3 Special: Master Listening Audio & Splitter Hub */}
          {activeSectionIndex === 2 && (
            <Card className="p-5 space-y-4 bg-slate-900 text-white border-slate-800 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🎧</span>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Listening Master Audio & Waveform Splitter (リスニング音声分割)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Upload the complete exam broadcast MP3, scrub to markers, and automatically split into question clips.
                    </p>
                  </div>
                </div>

                <label className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition-all active:scale-95 flex items-center gap-2 shrink-0">
                  <span>{isUploading ? '⏳ Uploading...' : '📁 Upload Master MP3'}</span>
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    disabled={isUploading}
                    onChange={handleUploadMasterAudio}
                  />
                </label>
              </div>

              {/* Master Audio Player & Timecode Controls */}
              {masterAudioSrc ? (
                <div className="space-y-4 pt-2">
                  <audio
                    ref={audioRef}
                    src={masterAudioSrc}
                    onTimeUpdate={() => setAudioCurrentTime(audioRef.current?.currentTime || 0)}
                    onLoadedMetadata={() => setAudioDuration(audioRef.current?.duration || 0)}
                    onPlay={() => setAudioPlaying(true)}
                    onPause={() => setAudioPlaying(false)}
                    controls
                    className="w-full h-10 rounded-xl"
                  />

                  {/* Scrubber & Marker Visualizer */}
                  <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">
                        Position: <strong className="text-white">{formatSeconds(audioCurrentTime)}</strong> / {formatSeconds(audioDuration)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400">
                          Slice Range: [{formatSeconds(markerStart)} ➔ {formatSeconds(markerEnd)}]
                        </span>
                        <span className="text-slate-500">
                          Duration: {formatSeconds(Math.max(0, markerEnd - markerStart))}
                        </span>
                      </div>
                    </div>

                    {/* Timeline Range Bar */}
                    <div className="relative w-full h-4 bg-slate-800 rounded-full overflow-hidden cursor-pointer">
                      {/* Current Audio Head */}
                      <div
                        className="absolute top-0 bottom-0 bg-blue-500/40"
                        style={{
                          width: `${audioDuration ? (audioCurrentTime / audioDuration) * 100 : 0}%`,
                        }}
                      />
                      {/* Active Marker Highlight */}
                      <div
                        className="absolute top-0 bottom-0 bg-amber-500/50 border-l-2 border-r-2 border-amber-400"
                        style={{
                          left: `${audioDuration ? (markerStart / audioDuration) * 100 : 0}%`,
                          width: `${audioDuration ? ((markerEnd - markerStart) / audioDuration) * 100 : 0}%`,
                        }}
                      />
                    </div>

                    {/* Marker Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="!bg-slate-800 !text-white !border-slate-700 hover:!bg-slate-700 text-xs font-mono"
                          onClick={() => setMarkerStart(Math.floor(audioCurrentTime))}
                        >
                          [ Set Start ({formatSeconds(audioCurrentTime)})
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="!bg-slate-800 !text-white !border-slate-700 hover:!bg-slate-700 text-xs font-mono"
                          onClick={() => setMarkerEnd(Math.ceil(audioCurrentTime))}
                        >
                          ] Set End ({formatSeconds(audioCurrentTime)})
                        </Button>
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
                          onClick={() => {
                            if (audioRef.current) {
                              audioRef.current.currentTime = markerStart;
                              audioRef.current.play();
                            }
                          }}
                        >
                          ▶ Preview Slice
                        </button>
                      </div>

                      <Button
                        size="sm"
                        variant="primary"
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-md text-xs cursor-pointer"
                        onClick={handleAddQuestionFromAudioSlice}
                      >
                        + Create Question from this Audio Slice ➔
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center border-2 border-dashed border-slate-700 rounded-2xl space-y-2">
                  <span className="text-3xl">🎙️</span>
                  <p className="text-sm font-bold text-slate-300">
                    No Master Audio uploaded for this section yet.
                  </p>
                  <p className="text-xs text-slate-500">
                    Upload an MP3/WAV file above to enable timeline scrubbing and instant question slicing.
                  </p>
                </div>
              )}
            </Card>
          )}

          {/* Section Question List */}
          <Card className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Questions in Section ({currentSection.questions?.length || 0})
                </h3>
                <p className="text-xs text-slate-500">
                  Add, edit, reorder, or attach picture diagrams and custom audio to questions.
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                className="text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs cursor-pointer"
                onClick={() => openNewQuestionModal()}
              >
                + Add Question
              </Button>
            </div>

            {/* Questions Table / List */}
            {currentSection.questions?.length > 0 ? (
              <div className="space-y-3">
                {currentSection.questions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="p-4 bg-slate-50/80 hover:bg-slate-50 rounded-2xl border border-slate-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Question Info */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-slate-200 text-slate-800 px-2 py-0.5 rounded-md">
                          #{idx + 1}
                        </span>
                        <Badge tone="neutral">{q.type || 'Question'}</Badge>
                        {q.image && (
                          <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            🖼️ Image Attached
                          </span>
                        )}
                        {(q.audioSrc || q.audioStart !== undefined) && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            🎧 Audio Slice ({formatSeconds(q.audioStart || 0)} - {formatSeconds(q.audioEnd || 0)})
                          </span>
                        )}
                      </div>

                      <p
                        className="text-sm font-bold text-slate-900 truncate"
                        dangerouslySetInnerHTML={{ __html: q.question || q.prompt || 'No question prompt' }}
                      />

                      {/* Options Preview */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1 text-xs">
                        {(q.options || []).map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className={`p-1.5 rounded-lg border text-xs truncate ${
                              q.correct === oIdx
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                                : 'bg-white border-slate-200 text-slate-600'
                            }`}
                          >
                            <span className="font-mono mr-1">({oIdx + 1})</span>
                            {q.optionImages?.[oIdx] ? '🖼️ [Image Choice]' : opt}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-xs text-slate-600 disabled:opacity-30 cursor-pointer"
                        disabled={idx === 0}
                        onClick={() => handleMoveQuestion(idx, -1)}
                        title="Move Up"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-xs text-slate-600 disabled:opacity-30 cursor-pointer"
                        disabled={idx === currentSection.questions.length - 1}
                        onClick={() => handleMoveQuestion(idx, 1)}
                        title="Move Down"
                      >
                        ▼
                      </button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="text-xs font-bold"
                        onClick={() => openEditQuestionModal(q, idx)}
                      >
                        ✏️ Edit
                      </Button>
                      <button
                        type="button"
                        className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100 text-xs text-rose-700 font-bold cursor-pointer"
                        onClick={() => handleDeleteQuestion(idx)}
                        title="Delete Question"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl space-y-2">
                <span className="text-3xl">📝</span>
                <p className="text-sm font-bold text-slate-700">No questions in this section yet.</p>
                <p className="text-xs text-slate-500">
                  Click &ldquo;+ Add Question&rdquo; above to create your first question.
                </p>
              </div>
            )}
          </Card>
        </div>
      ) : null}

      {/* ------------------------------------------------------------------- */}
      {/* RICH QUESTION EDITOR MODAL (Images, Audio Slices, Picture Choices)  */}
      {/* ------------------------------------------------------------------- */}
      {isQuestionModalOpen && editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <Card className="max-w-3xl w-full p-6 space-y-5 bg-white shadow-2xl rounded-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">✏️</span>
                <h3 className="text-base font-black text-slate-900">
                  {editingQuestionIndex !== null ? `Edit Question #${editingQuestionIndex + 1}` : 'New Question'}
                </h3>
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
                onClick={() => setIsQuestionModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Question Type & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Question Format / Type:</label>
                  <select
                    className="ds-input text-xs w-full"
                    value={editingQuestion.type || ''}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, type: e.target.value })
                    }
                  >
                    {MONDAI_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Correct Answer Key:</label>
                  <div className="flex items-center gap-2 pt-1">
                    {[0, 1, 2, 3].map((optIdx) => (
                      <label
                        key={optIdx}
                        className={`flex-1 py-2 px-3 rounded-xl border text-center font-bold cursor-pointer transition-all ${
                          editingQuestion.correct === optIdx
                            ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="correct_answer"
                          className="hidden"
                          checked={editingQuestion.correct === optIdx}
                          onChange={() =>
                            setEditingQuestion({ ...editingQuestion, correct: optIdx })
                          }
                        />
                        Option {optIdx + 1}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Question Prompt / Instruction */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Question Prompt / Text (Japanese HTML supported):</label>
                <textarea
                  rows={2}
                  className="ds-input text-xs w-full font-mono"
                  placeholder="例: 1. <u>明日</u>へ 行きます。"
                  value={editingQuestion.question || ''}
                  onChange={(e) =>
                    setEditingQuestion({ ...editingQuestion, question: e.target.value })
                  }
                />
              </div>

              {/* Question Diagram / Main Image Upload */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">🖼️ Question Diagram / Illustration Image:</span>
                  {editingQuestion.image && (
                    <button
                      type="button"
                      className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                      onClick={() => setEditingQuestion({ ...editingQuestion, image: null })}
                    >
                      Remove Image
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Paste image URL (e.g. /images/japanese/n5/map.png) or upload file ➔"
                    className="ds-input text-xs flex-1"
                    value={editingQuestion.image || ''}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, image: e.target.value })
                    }
                  />
                  <label className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold cursor-pointer shrink-0">
                    Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = await uploadImageFile(file);
                          setEditingQuestion({ ...editingQuestion, image: url });
                        }
                      }}
                    />
                  </label>
                </div>

                {editingQuestion.image && (
                  <div className="p-2 bg-white rounded-xl border border-slate-200 flex justify-center max-h-48 overflow-hidden">
                    <img
                      src={editingQuestion.image}
                      alt="Question preview"
                      className="max-h-44 object-contain rounded-lg"
                    />
                  </div>
                )}
              </div>

              {/* Question Audio Binding & Slicing */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-700">🎧 Question Audio / Listening Slice:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      placeholder="Audio Source URL (e.g. /audio/japanese/slices/n5_v1/m1/q1.mp3)"
                      className="ds-input text-xs w-full"
                      value={editingQuestion.audioSrc || masterAudioSrc || ''}
                      onChange={(e) =>
                        setEditingQuestion({ ...editingQuestion, audioSrc: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 block text-[11px]">Start Time (seconds):</label>
                    <input
                      type="number"
                      className="ds-input text-xs w-full"
                      value={editingQuestion.audioStart ?? ''}
                      onChange={(e) =>
                        setEditingQuestion({
                          ...editingQuestion,
                          audioStart: e.target.value ? parseFloat(e.target.value) : null,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 block text-[11px]">End Time (seconds):</label>
                    <input
                      type="number"
                      className="ds-input text-xs w-full"
                      value={editingQuestion.audioEnd ?? ''}
                      onChange={(e) =>
                        setEditingQuestion({
                          ...editingQuestion,
                          audioEnd: e.target.value ? parseFloat(e.target.value) : null,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      className="w-full py-1.5 px-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-bold hover:bg-blue-100 cursor-pointer"
                      onClick={() => {
                        const src = editingQuestion.audioSrc || masterAudioSrc;
                        if (!src) return alert('No audio source specified');
                        const a = new Audio(src);
                        if (editingQuestion.audioStart) a.currentTime = editingQuestion.audioStart;
                        a.play();
                      }}
                    >
                      ▶ Test Audio
                    </button>
                  </div>
                </div>
              </div>

              {/* 4 Choices Editor (Supports Text only, Picture only, or Both) */}
              <div className="space-y-2">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
                  Option Choices (1 - 4):
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[0, 1, 2, 3].map((optIdx) => {
                    const optText = editingQuestion.options?.[optIdx] || '';
                    const optImg = editingQuestion.optionImages?.[optIdx] || null;

                    return (
                      <div
                        key={optIdx}
                        className={`p-3 rounded-2xl border space-y-2 ${
                          editingQuestion.correct === optIdx
                            ? 'bg-emerald-50/50 border-emerald-300'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 font-mono">
                            Option #{optIdx + 1} {editingQuestion.correct === optIdx && '✓ Correct'}
                          </span>
                          <label className="text-[10px] text-blue-600 font-bold cursor-pointer hover:underline">
                            + Add Choice Image
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const url = await uploadImageFile(file);
                                  const newImgs = [...(editingQuestion.optionImages || [null, null, null, null])];
                                  newImgs[optIdx] = url;
                                  setEditingQuestion({ ...editingQuestion, optionImages: newImgs });
                                }
                              }}
                            />
                          </label>
                        </div>

                        {/* Text input */}
                        <input
                          type="text"
                          className="ds-input text-xs w-full bg-white"
                          placeholder={`Option ${optIdx + 1} text...`}
                          value={optText}
                          onChange={(e) => {
                            const newOpts = [...(editingQuestion.options || ['', '', '', ''])];
                            newOpts[optIdx] = e.target.value;
                            setEditingQuestion({ ...editingQuestion, options: newOpts });
                          }}
                        />

                        {/* Choice Image Preview */}
                        {optImg && (
                          <div className="relative p-1 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                            <img src={optImg} alt={`Choice ${optIdx + 1}`} className="h-14 object-contain rounded" />
                            <button
                              type="button"
                              className="text-rose-600 text-xs font-bold px-2 py-1 hover:underline cursor-pointer"
                              onClick={() => {
                                const newImgs = [...(editingQuestion.optionImages || [null, null, null, null])];
                                newImgs[optIdx] = null;
                                setEditingQuestion({ ...editingQuestion, optionImages: newImgs });
                              }}
                            >
                              ✕ Remove
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Script / Explanation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Dialogue Script / Transcript (台本):</label>
                  <textarea
                    rows={2}
                    className="ds-input text-xs w-full font-mono"
                    placeholder="Japanese dialogue transcription..."
                    value={editingQuestion.script || ''}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, script: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Explanation & Notes (解説):</label>
                  <textarea
                    rows={2}
                    className="ds-input text-xs w-full"
                    placeholder="English explanation for review..."
                    value={editingQuestion.explanation || ''}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, explanation: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-bold"
                onClick={() => setIsQuestionModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-md cursor-pointer"
                onClick={handleSaveQuestion}
              >
                ✓ Save Question
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
