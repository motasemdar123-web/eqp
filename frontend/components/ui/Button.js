export default function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}) {
  const variants = {
    primary: 'bg-yellow-400 text-zinc-950 shadow-sm shadow-yellow-900/10 hover:bg-yellow-300',
    secondary: 'border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50',
    danger: 'bg-red-600 text-white shadow-sm hover:bg-red-500',
    ghost: 'border border-zinc-300 bg-transparent text-zinc-700 hover:bg-white',
  };

  return (
    <button
      className={`rounded-md px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
