export default function Toast({ message, type = 'success', onClose }) {
  if (!message) return null;

  let displayMessage = message;
  let displayType = type;

  if (typeof message === 'object' && message !== null) {
    displayMessage = message.message || message.text || JSON.stringify(message);
    displayType = message.type || type;
  }

  const styles = {
    success: 'ds-toast-success',
    error: 'ds-toast-error',
    warning: 'ds-toast-warning bg-amber-50 border border-amber-300 text-amber-900',
    info: 'ds-toast-info',
  };

  const icons = {
    success: (
      <svg className="h-5 w-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    error: (
      <svg className="h-5 w-5 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <span className="text-base shrink-0">⚠️</span>
    ),
    info: (
      <svg className="h-5 w-5 text-sky-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div className={`ds-toast fixed right-5 top-5 z-[80] flex max-w-md items-center gap-3 px-4 py-3 rounded-xl shadow-lg border ${styles[displayType] || styles.info}`}>
      {icons[displayType] || icons.info}
      <p className="text-sm font-medium flex-1">{String(displayMessage)}</p>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-slate-400 hover:text-slate-700 hover:bg-black/5 transition"
          aria-label="Dismiss notification"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
