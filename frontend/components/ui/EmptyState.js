export default function EmptyState({ title, description }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
      <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
      {description && <p className="mt-2 text-sm text-zinc-500">{description}</p>}
    </div>
  );
}
