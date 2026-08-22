'use client';

import { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { WORKSHOP_SCENARIOS } from '../../lib/japanese/roleplayDialogData';

function speak(text) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP';
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
}

export default function WorkshopRoleplayCoach({ onToast }) {
  const [activeScenario, setActiveScenario] = useState(WORKSHOP_SCENARIOS[0]);
  const [currentTurnIdx, setCurrentTurnIdx] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Initialize scenario
  const startScenario = (scenario) => {
    setActiveScenario(scenario);
    setCurrentTurnIdx(0);
    setSelectedOptionId(null);
    setIsCompleted(false);
    setScore(0);

    const firstTurn = scenario.turns[0];
    const initialHistory = [
      {
        speaker: firstTurn.speaker,
        isUser: false,
        japanese: firstTurn.japanese,
        reading: firstTurn.reading,
        romaji: firstTurn.romaji,
        english: firstTurn.english
      }
    ];
    setChatHistory(initialHistory);
    speak(firstTurn.japanese);
  };

  useEffect(() => {
    startScenario(activeScenario);
  }, []);

  const currentTurn = activeScenario.turns[currentTurnIdx];

  const handleSelectOption = (option) => {
    if (selectedOptionId) return; // already selected for this turn
    setSelectedOptionId(option.id);

    // Append user response to chat
    const updatedHistory = [
      ...chatHistory,
      {
        speaker: 'You (あなた)',
        isUser: true,
        japanese: option.japanese,
        reading: option.reading,
        english: option.english,
        feedback: option.feedback,
        keigoLevel: option.keigoLevel,
        isBest: option.isBest
      }
    ];

    speak(option.japanese);

    if (option.isBest) {
      setScore((s) => s + 100);
      onToast?.('🌟 素晴らしい！ (Flawless Keigo & Technical Phrasing)', 'success');
    } else {
      setScore((s) => s + 40);
      onToast?.('💡 Good try! Check the Keigo coaching tip below.', 'info');
    }

    setChatHistory(updatedHistory);
  };

  const handleNextTurn = () => {
    setSelectedOptionId(null);
    const nextIdx = currentTurnIdx + 1;

    if (nextIdx < activeScenario.turns.length) {
      setCurrentTurnIdx(nextIdx);
      const nextTurn = activeScenario.turns[nextIdx];

      // Add partner response to chat
      setChatHistory((prev) => [
        ...prev,
        {
          speaker: nextTurn.speaker,
          isUser: false,
          japanese: nextTurn.japanese,
          reading: nextTurn.reading,
          romaji: nextTurn.romaji,
          english: nextTurn.english
        }
      ]);
      speak(nextTurn.japanese);
    } else {
      setIsCompleted(true);
      onToast?.(`🎉 Roleplay Scenario Complete! Final Score: ${score}`, 'success');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-indigo-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none text-9xl font-bold font-mono">
          会話
        </div>
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              AI Technical Dialogue & Roleplay
            </span>
            <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold px-2.5 py-1 rounded-full">
              現場シミュレーター
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Komatsu Engineering & Workshop Dialogue Coach
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Practice real spoken Japanese roleplays for reporting heavy machinery breakdowns, handling urgent parts inquiries, and leading 5S morning briefings with instant Keigo analysis.
          </p>

          {/* Scenario Selector Pills (Scrollable on mobile) */}
          <div className="flex items-center gap-2 pt-2 overflow-x-auto scrollbar-none flex-nowrap -mx-3 px-3 sm:mx-0 sm:px-0">
            {WORKSHOP_SCENARIOS.map((scen) => (
              <button
                key={scen.id}
                onClick={() => startScenario(scen)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                  activeScenario.id === scen.id
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md scale-102'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <span>{scen.icon}</span>
                <span>{scen.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Conversation Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Chat Simulator Arena (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-4 sm:p-6 space-y-4 border-slate-200 bg-slate-50/50 shadow-xs">
            {/* Setting bar */}
            <div className="flex items-center justify-between border-b pb-3 text-xs">
              <span className="font-bold text-slate-600 flex items-center gap-1.5">
                <span>📍 Setting:</span>
                <span className="text-slate-900 font-semibold">{activeScenario.setting}</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-mono font-bold">
                  Score: {score} XP
                </span>
                <Button size="xs" variant="ghost" onClick={() => startScenario(activeScenario)}>
                  🔄 Restart
                </Button>
              </div>
            </div>

            {/* Message Stream */}
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {chatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${msg.isUser ? 'items-end' : 'items-start'} space-y-1 animate-fadeIn`}
                >
                  <span className="text-[10px] font-bold text-slate-400 px-1">
                    {msg.speaker}
                  </span>
                  <div
                    className={`max-w-[90%] sm:max-w-[85%] p-4 rounded-2xl border text-xs space-y-2 shadow-2xs ${
                      msg.isUser
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-sans rounded-tr-xs'
                        : 'bg-white text-slate-900 border-slate-200 rounded-tl-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm sm:text-base font-black leading-snug">{msg.japanese}</p>
                      <Button
                        size="xs"
                        variant="ghost"
                        className={`p-1 h-auto ${msg.isUser ? 'text-slate-900 hover:bg-amber-600' : 'text-slate-400 hover:text-amber-600'}`}
                        onClick={() => speak(msg.japanese)}
                        title="Listen to Japanese audio"
                      >
                        🔊
                      </Button>
                    </div>
                    {msg.reading && (
                      <p className={`text-[11px] font-mono ${msg.isUser ? 'text-amber-950 font-medium' : 'text-slate-500'}`}>
                        {msg.reading}
                      </p>
                    )}
                    {msg.english && (
                      <p className={`text-xs ${msg.isUser ? 'text-amber-950 font-medium border-t border-amber-400/60 pt-1' : 'text-slate-600 border-t border-slate-100 pt-1'}`}>
                        {msg.english}
                      </p>
                    )}

                    {/* Keigo Coaching Badge on User turns */}
                    {msg.isUser && msg.keigoLevel && (
                      <div className="bg-amber-600/30 p-2 rounded-lg text-[11px] text-slate-950 font-medium space-y-0.5 mt-2">
                        <div className="flex items-center gap-1 font-bold">
                          <span>{msg.isBest ? '⭐' : '💡'}</span>
                          <span>{msg.keigoLevel}</span>
                        </div>
                        <p className="text-[10px] opacity-90">{msg.feedback}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Active Turn Options */}
            {!isCompleted && currentTurn && (
              <div className="border-t pt-4 space-y-3 bg-white p-4 rounded-xl shadow-xs border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                    <span>🎯 Your Turn:</span>
                    <span className="text-slate-600 font-normal">Choose the most polite and technically accurate response</span>
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    Step {currentTurnIdx + 1} of {activeScenario.turns.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {currentTurn.options.map((opt) => {
                    const isSelected = selectedOptionId === opt.id;
                    let cardStyle = 'p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ';
                    if (!selectedOptionId) {
                      cardStyle += 'bg-slate-50 hover:bg-amber-50/60 hover:border-amber-400 hover:shadow-xs cursor-pointer border-slate-200';
                    } else if (isSelected) {
                      cardStyle += opt.isBest
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20 font-bold'
                        : 'bg-amber-50 border-amber-500 text-amber-950';
                    } else {
                      cardStyle += 'bg-slate-50 border-slate-200 opacity-50';
                    }

                    return (
                      <button
                        key={opt.id}
                        disabled={Boolean(selectedOptionId)}
                        onClick={() => handleSelectOption(opt)}
                        className={cardStyle}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1 w-full">
                          <span className="text-sm font-black text-slate-900">{opt.japanese}</span>
                          <Button
                            size="xs"
                            variant="ghost"
                            className="p-1 h-auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              speak(opt.japanese);
                            }}
                          >
                            🔊
                          </Button>
                        </div>
                        <span className="text-xs text-slate-500 font-mono block">{opt.reading}</span>
                        <span className="text-xs text-slate-700 mt-1 block">{opt.english}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Continue button after answering */}
                {selectedOptionId && (
                  <div className="flex justify-end pt-2 animate-fadeIn">
                    <Button
                      variant="primary"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6"
                      onClick={handleNextTurn}
                    >
                      {currentTurnIdx + 1 < activeScenario.turns.length ? 'Continue Dialogue ➔' : 'Complete Scenario 🎉'}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Scenario Completion Screen */}
            {isCompleted && (
              <div className="bg-linear-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-xl text-center space-y-4 shadow-lg animate-fadeIn border border-indigo-500/30">
                <span className="text-4xl">🎉</span>
                <h3 className="text-2xl font-black">Scenario Completed Successfully!</h3>
                <p className="text-xs text-indigo-200 max-w-md mx-auto">
                  You have completed the <strong className="text-amber-300">{activeScenario.title}</strong> roleplay simulation with a score of <strong className="text-white font-mono">{score} XP</strong>.
                </p>
                <div className="flex justify-center gap-3 pt-2">
                  <Button
                    variant="primary"
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                    onClick={() => startScenario(activeScenario)}
                  >
                    🔄 Repeat Scenario
                  </Button>
                  <Button
                    variant="outline"
                    className="text-white border-slate-600 hover:bg-white/10"
                    onClick={() => {
                      const nextScenIdx = (WORKSHOP_SCENARIOS.findIndex((s) => s.id === activeScenario.id) + 1) % WORKSHOP_SCENARIOS.length;
                      startScenario(WORKSHOP_SCENARIOS[nextScenIdx]);
                    }}
                  >
                    Next Scenario ➔
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right: Technical Vocabulary & Keigo Guide Drawer (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Active Keywords Card */}
          <Card className="p-5 space-y-4 border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                📚 Essential Technical Keywords
              </span>
              <Badge variant="neutral" className="text-[10px]">
                {currentTurn?.keywords?.length || 0} Terms
              </Badge>
            </div>

            <div className="space-y-2.5">
              {currentTurn?.keywords?.map((kw, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between gap-3 hover:border-amber-300 transition-all cursor-pointer"
                  onClick={() => speak(kw.kanji)}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-slate-900">{kw.kanji}</span>
                      <span className="text-xs text-amber-700 font-mono font-medium">{kw.reading}</span>
                    </div>
                    <span className="text-xs text-slate-600 font-semibold">{kw.english}</span>
                  </div>
                  <Button
                    size="xs"
                    variant="ghost"
                    className="text-slate-400 hover:text-amber-600 p-1"
                    title="Pronounce"
                  >
                    🔊
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Keigo Protocol Card */}
          <Card className="p-5 space-y-3 border-indigo-100 bg-indigo-50/30">
            <span className="text-xs font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
              🛡️ Professional Japanese Hotline Rules
            </span>
            <ul className="text-xs text-slate-700 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">1.</span>
                <span><strong>Always state your identity first:</strong> Start calls with <em>「いつもお世話になっております。ダル・アルハイのモタセムでございます。」</em></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">2.</span>
                <span><strong>Use Precise Error Codes:</strong> Quote the exact EMMS fault code (e.g. <em>E02・CA441</em>) and operating hours (<em>稼働時間</em>).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">3.</span>
                <span><strong>Polite Humble Closings:</strong> End formal requests with <em>「ご手配のほどよろしくお願い申し上げます。」</em></span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
