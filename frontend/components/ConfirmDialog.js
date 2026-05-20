import Button from './ui/Button';

export default function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  onConfirm,
  onCancel,
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[rgba(7,27,51,0.62)] p-4 backdrop-blur-sm">
      <section className="ds-card w-full max-w-md p-6 text-[var(--color-ink)] shadow-[var(--shadow-overlay)]">
        <h2 className="text-xl font-black">{title}</h2>
        {description && <p className="mt-2 text-sm font-semibold leading-6 text-[var(--color-muted)]">{description}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel}>{cancelLabel}</Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </section>
    </div>
  );
}
