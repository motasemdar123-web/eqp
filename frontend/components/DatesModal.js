import Button from './ui/Button';

export default function DatesModal({ dates, onChange, onCancel, onSubmit, disabled }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(7,27,51,0.62)] p-4 backdrop-blur-sm">
      <div className="ds-card w-full max-w-2xl p-6 text-[var(--color-ink)] shadow-[var(--shadow-overlay)]">
        <h2 className="text-2xl font-black">Select Report Dates</h2>
        <p className="mt-2 text-sm font-semibold text-[var(--color-muted)]">Each date creates one PDF per selected machine.</p>

        <div className="mt-6 grid gap-3">
          {dates.map((date, index) => (
            <label key={index} className="grid gap-2 sm:grid-cols-[120px_1fr] sm:items-center">
              <span className="text-sm font-bold text-[var(--color-ink-soft)]">Report {index + 1}</span>
              <input
                type="date"
                value={date}
                onChange={(event) => onChange(index, event.target.value)}
                className="ds-input"
              />
            </label>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel} disabled={disabled}>Cancel</Button>
          <Button onClick={onSubmit} disabled={disabled}>Generate PDFs</Button>
        </div>
      </div>
    </div>
  );
}
