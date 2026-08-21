'use client';

import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export default function LevelSelectorModal({ isOpen, onClose, currentLevel, onSelectLevel, isFirstTime = false }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <Card className="w-full max-w-xl p-6 sm:p-8 space-y-6 bg-white shadow-2xl border border-slate-200 rounded-3xl relative">
        {!isFirstTime && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 text-sm p-1.5 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
          >
            ✕
          </button>
        )}

        <div className="text-center space-y-2 max-w-md mx-auto">
          <div className="text-3xl">🌸 ⛩️</div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isFirstTime ? 'Select Your Japanese Target Goal' : 'Switch Target Proficiency Level'}
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {isFirstTime
              ? 'Choose your primary study level. All mock exams, flashcards, kanji grids, and vocabulary will automatically calibrate to your choice.'
              : 'Switching levels updates your active curriculum, mock exams, and practice dojo.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* N5 Card */}
          <div
            onClick={() => onSelectLevel('N5')}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-4 hover:shadow-lg hover:-translate-y-0.5 ${
              currentLevel === 'N5'
                ? 'border-amber-500 bg-amber-50/40 shadow-md ring-2 ring-amber-400/30'
                : 'border-slate-200 bg-white hover:border-amber-300'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl">🌸</span>
                {currentLevel === 'N5' && (
                  <Badge variant="primary" className="bg-amber-500 text-white text-[10px] font-bold">
                    Active Target
                  </Badge>
                )}
              </div>
              <h3 className="text-lg font-bold text-slate-900">JLPT N5 Foundation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Foundational Japanese: Hiragana, Katakana, ~100 essential Kanji, 800 vocabulary words, and basic everyday dialogue.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100/80 text-[11px] text-slate-500 space-y-1">
              <div className="flex justify-between">
                <span>10 Full Mock Exams:</span>
                <span className="font-bold text-slate-800">892 Total Qs</span>
              </div>
              <div className="flex justify-between">
                <span>Listening Audio:</span>
                <span className="font-bold text-emerald-600">Official Vol 1 & 2</span>
              </div>
            </div>
          </div>

          {/* N4 Card */}
          <div
            onClick={() => onSelectLevel('N4')}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-4 hover:shadow-lg hover:-translate-y-0.5 ${
              currentLevel === 'N4'
                ? 'border-blue-600 bg-blue-50/40 shadow-md ring-2 ring-blue-500/30'
                : 'border-slate-200 bg-white hover:border-blue-300'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl">⛩️</span>
                {currentLevel === 'N4' && (
                  <Badge variant="primary" className="bg-blue-600 text-white text-[10px] font-bold">
                    Active Target
                  </Badge>
                )}
              </div>
              <h3 className="text-lg font-bold text-slate-900">JLPT N4 Elementary</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Elementary & Practical Japanese: Conditional forms (~たら, ~ば), Keigo honorifics, passive/causative, ~300 Kanji, 1,500 vocabulary words.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100/80 text-[11px] text-slate-500 space-y-1">
              <div className="flex justify-between">
                <span>10 Full Mock Exams:</span>
                <span className="font-bold text-slate-800">971 Total Qs</span>
              </div>
              <div className="flex justify-between">
                <span>Listening Audio:</span>
                <span className="font-bold text-emerald-600">Official Vol 1 & 2</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 text-center">
          <p className="text-[11px] text-slate-400">
            💡 You can change your target level at any time from the top header target badge.
          </p>
        </div>
      </Card>
    </div>
  );
}
