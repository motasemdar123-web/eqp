export default function EmptyState({ title, description }) {
  return (
    <div className="ds-empty-state">
      <h3 className="text-lg font-black text-[var(--color-ink)]">{title}</h3>
      {description && <p className="mt-2 text-sm font-semibold text-[var(--color-muted)]">{description}</p>}
    </div>
  );
}
