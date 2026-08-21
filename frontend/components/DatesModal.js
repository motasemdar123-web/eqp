import Button from './ui/Button';

export default function DatesModal({ dates, onChange, onCancel, onSubmit, disabled }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="ds-card w-full max-w-lg overflow-hidden bg-white shadow-2xl animate-[ds-toast-in_180ms_ease]">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">Select Report Dates</h2>
          <p className="mt-1 text-xs text-slate-500">Each date creates one finalized PDF report per selected machine.</p>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
          <div className="grid gap-3">
            {dates.map((date, index) => (
              <label key={index} className="grid grid-cols-[100px_1fr] items-center gap-3">
                <span className="text-xs font-semibold text-slate-600">Report {index + 1}</span>
                <input
                  type="date"
                  value={date}
                  onChange={(event) => onChange(index, event.target.value)}
                  className="ds-input"
                  required
                />
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-3.5">
          <Button variant="secondary" onClick={onCancel} disabled={disabled}>Cancel</Button>
          <Button onClick={onSubmit} disabled={disabled}>Generate PDFs</Button>
        </div>
      </div>
    </div>
  );
}
