export default function Toast({ message, type = 'success', onClose }) {
  const styles = {
    success: 'ds-toast-success',
    error: 'ds-toast-error',
    info: 'ds-toast-info',
  };

  if (!message) return null;

  return (
    <div className={`ds-toast fixed right-4 top-4 z-[60] flex max-w-md items-start gap-4 px-4 py-3 ${styles[type] || styles.info}`}>
      <p className="text-sm font-bold">{message}</p>
      <button
        type="button"
        onClick={onClose}
        className="rounded px-1 text-sm font-black opacity-70 transition hover:opacity-100"
        aria-label="Dismiss notification"
      >
        x
      </button>
    </div>
  );
}
