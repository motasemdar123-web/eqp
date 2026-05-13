export default function LoadingOverlay({ title = 'Loading...', description = 'Please wait' }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-sm">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-yellow-400 border-t-transparent" />
      <h2 className="mt-6 text-2xl font-bold text-white">{title}</h2>
      <p className="mt-2 text-sm text-zinc-300">{description}</p>
    </div>
  );
}
