export default function LoadingOverlay({ title = 'Loading...', description = 'Please wait' }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[rgba(7,27,51,0.82)] backdrop-blur-sm">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-[var(--color-accent)] border-t-transparent" />
      <h2 className="mt-6 text-2xl font-bold text-white">{title}</h2>
      <p className="mt-2 text-sm font-semibold text-white/70">{description}</p>
    </div>
  );
}
