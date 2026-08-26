'use client';

import { useState } from 'react';
import { Dialog, DialogHeader, DialogContent, DialogFooter } from '../ui/Dialog';

export default function MissingToolModal({
  isOpen,
  tool,
  technician,
  onClose,
  onSubmitMissing,
}) {
  const [reason, setReason] = useState('job_site');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !tool) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (onSubmitMissing) {
      onSubmitMissing({
        toolId: tool.id,
        reason,
        location,
        notes,
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
        title="Mark Tool as Missing"
        description={`Record asset loss for ${tool.name} (${technician?.name})`}
        onClose={onClose}
      />

      <form onSubmit={handleSubmit} className="flex flex-col flex-1">
        <DialogContent className="space-y-4 p-5 bg-slate-900">
          {/* Tool Card */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">
                {tool.categoryEn || tool.categoryAr}
              </span>
              <h4 className="text-sm font-black text-white">{tool.name}</h4>
              <p className="text-xs text-slate-400">{tool.nameEn}</p>
            </div>
            <span className="px-2.5 py-1 bg-slate-800 text-red-300 rounded-lg text-xs font-mono font-bold">
              {tool.specification ? `${tool.specification}mm` : 'Standard'}
            </span>
          </div>

          {/* Reason Dropdown */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
              Loss Circumstance / Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
            >
              <option value="job_site">Left / Lost at Field Job Site</option>
              <option value="misplaced_workshop">Misplaced in Workshop / Common Bay</option>
              <option value="loaned_unreturned">Loaned to Colleague / Unreturned</option>
              <option value="stolen_lost">Suspected Loss / In Transit</option>
              <option value="other">Other Unaccounted Reason</option>
            </select>
          </div>

          {/* Last Known Location */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Last Known Physical Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Field Rig 07, Maintenance Bay 3, Client Generator Site"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              required
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Additional Investigation Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide any details that could assist in locating or reordering this tool..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
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
            className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-all shadow-md shadow-red-600/20 disabled:opacity-50"
          >
            {isSubmitting ? 'Recording...' : 'Confirm Tool Missing'}
          </button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
