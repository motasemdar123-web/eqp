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
    <div className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/60 p-4 backdrop-blur-sm">
      <section className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 text-zinc-900 shadow-2xl">
        <h2 className="text-xl font-bold text-zinc-950">{title}</h2>
        {description && <p className="mt-2 text-sm leading-6 text-zinc-600">{description}</p>}

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
