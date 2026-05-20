export default function EmptyState({ title, description }) {
  return (
    <div className="ds-empty-state">
      <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-[var(--color-brand-soft)] text-sm font-black text-[var(--color-brand)]">
        DH
      </div>
      <h3 className="text-lg font-black text-[var(--color-ink)]">{title}</h3>
      {description && <p className="mt-2 text-sm font-semibold text-[var(--color-muted)]">{description}</p>}
    </div>
  );
}
