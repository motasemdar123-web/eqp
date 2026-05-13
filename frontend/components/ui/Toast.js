export default function Toast({ message, type = 'success', onClose }) {
  const styles = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    error: 'border-red-200 bg-red-50 text-red-800',
    info: 'border-zinc-200 bg-white text-zinc-800',
  };

  if (!message) return null;

  return (
    <div className={`fixed right-4 top-4 z-[60] flex max-w-md items-start gap-4 rounded-lg border px-4 py-3 shadow-lg ${styles[type]}`}>
      <p className="text-sm font-medium">{message}</p>
      <button
        type="button"
        onClick={onClose}
        className="rounded px-1 text-sm font-bold opacity-70 transition hover:opacity-100"
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
}
