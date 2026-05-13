import Button from './ui/Button';

export default function DatesModal({ dates, onChange, onCancel, onSubmit, disabled }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-lg border border-zinc-200 bg-white p-6 text-zinc-900 shadow-2xl">
        <h2 className="text-2xl font-bold">Select Report Dates</h2>
        <p className="mt-2 text-sm text-zinc-500">Each date creates one report per selected machine.</p>

        <div className="mt-6 grid gap-3">
          {dates.map((date, index) => (
            <label key={index} className="grid gap-2 sm:grid-cols-[120px_1fr] sm:items-center">
              <span className="text-sm font-semibold text-zinc-700">Report {index + 1}</span>
              <input
                type="date"
                value={date}
                onChange={(event) => onChange(index, event.target.value)}
                className="rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-zinc-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
              />
            </label>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel} disabled={disabled}>Cancel</Button>
          <Button onClick={onSubmit} disabled={disabled}>Generate</Button>
        </div>
      </div>
    </div>
  );
}
