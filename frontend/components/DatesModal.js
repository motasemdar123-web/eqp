import Button from './ui/Button';

export default function DatesModal({ dates, onChange, onCancel, onSubmit, disabled }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg overflow-hidden bg-white shadow-2xl rounded-xl border border-slate-200 animate-[ds-toast-in_180ms_ease]">
        <div className="border-b border-slate-200 px-6 py-4 bg-slate-50/60">
          <h2 className="text-base font-semibold text-slate-900 tracking-tight">Confirm Batch Report Dates</h2>
          <p className="mt-0.5 text-xs text-slate-500">Each date creates one finalized PDF report per selected machinery asset.</p>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
          <div className="grid gap-2.5">
            {dates.map((date, index) => (
              <label key={index} className="grid grid-cols-[100px_1fr] items-center gap-3">
                <span className="text-xs font-semibold text-slate-700">Report {index + 1}</span>
                <input
                  type="date"
                  value={date}
                  onChange={(event) => onChange(index, event.target.value)}
                  className="ds-input text-xs"
                  required
                />
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-3.5">
          <Button variant="secondary" size="sm" onClick={onCancel} disabled={disabled}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={onSubmit} disabled={disabled}>Generate PDFs</Button>
        </div>
      </div>
    </div>
  );
}

