export default function LoadingOverlay({ title = 'Loading...', description = 'Please wait' }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/75 backdrop-blur-md">
      <div className="flex flex-col items-center rounded-2xl bg-white p-8 shadow-2xl animate-[ds-toast-in_180ms_ease] max-w-sm text-center">
        <div className="relative flex h-14 w-14 items-center justify-center">
          <div className="absolute h-full w-full animate-spin rounded-full border-4 border-amber-200 border-t-amber-500" />
          <span className="text-xs font-black text-slate-800">DH</span>
        </div>
        <h2 className="mt-4 text-base font-bold text-slate-900">{title}</h2>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>
    </div>
  );
}
