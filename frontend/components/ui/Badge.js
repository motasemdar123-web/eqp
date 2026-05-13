export default function Badge({ children, tone = 'neutral', className = '' }) {
  const tones = {
    neutral: 'border-zinc-200 bg-zinc-100 text-zinc-700',
    yellow: 'border-yellow-200 bg-yellow-50 text-yellow-800',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    red: 'border-red-200 bg-red-50 text-red-700',
    dark: 'border-zinc-800 bg-zinc-950 text-white',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}
