'use client';

import { useState } from 'react';
import { Dialog, DialogHeader, DialogContent, DialogFooter } from '../ui/Dialog';

export default function DamageReportModal({
  isOpen,
  tool,
  technician,
  onClose,
  onSubmitDamage,
}) {
  const [damageType, setDamageType] = useState('crack_bend');
  const [severity, setSeverity] = useState('moderate');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !tool) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (onSubmitDamage) {
      onSubmitDamage({
        toolId: tool.id,
        damageType,
        severity,
        description,
        reportedAt: new Date().toISOString(),
      });
    }

    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
    }, 200);
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="max-w-lg bg-slate-900 border border-slate-700 text-white">
      <DialogHeader
        title="Report Tool Damage / Wear"
        description={`Formal maintenance damage report for ${tool.name} (${technician?.name})`}
        onClose={onClose}
      />

      <form onSubmit={handleSubmit} className="flex flex-col flex-1">
        <DialogContent className="space-y-4 p-5 bg-slate-900">
          {/* Tool Quick Summary Card */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                {tool.categoryEn || tool.categoryAr}
              </span>
              <h4 className="text-sm font-black text-white">{tool.name}</h4>
              <p className="text-xs text-slate-400">{tool.nameEn}</p>
            </div>
            <span className="px-2.5 py-1 bg-slate-800 text-cyan-300 rounded-lg text-xs font-mono font-bold">
              {tool.specification ? `${tool.specification}mm` : 'Standard'}
            </span>
          </div>

          {/* Damage Classification Dropdown */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
              Damage Classification
            </label>
            <select
              value={damageType}
              onChange={(e) => setDamageType(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="crack_bend">Structural Crack / Bent Metal</option>
              <option value="worn_drive">Worn / Rounded Drive Square or Socket Teeth</option>
              <option value="stripped_tip">Stripped / Broken Screwdriver Tip</option>
              <option value="ratchet_gear">Stripped Internal Ratchet Pawl / Gear</option>
              <option value="corrosion">Heavy Rust / Chemical Corrosion</option>
              <option value="calibration">Loss of Calibration / Inaccurate Measurement</option>
              <option value="other">Other Mechanical Failure</option>
            </select>
          </div>

          {/* Severity Levels */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
              Severity Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSeverity('minor')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                  severity === 'minor'
                    ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                Minor Wear
              </button>

              <button
                type="button"
                onClick={() => setSeverity('moderate')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                  severity === 'moderate'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                Moderate Damage
              </button>

              <button
                type="button"
                onClick={() => setSeverity('critical')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                  severity === 'critical'
                    ? 'bg-red-500/20 border-red-400 text-red-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                Critical (Unusable)
              </button>
            </div>
          </div>

          {/* Description Textarea */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Failure Details & Context
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe how the damage occurred and whether a replacement is urgently required..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              required
            />
          </div>
        </DialogContent>

        <DialogFooter className="bg-slate-950 border-t border-slate-800 p-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Damage Report'}
          </button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
