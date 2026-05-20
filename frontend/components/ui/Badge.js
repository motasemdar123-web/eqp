export default function Badge({ children, tone = 'neutral', className = '' }) {
  const tones = {
    neutral: 'ds-badge-neutral',
    yellow: 'ds-badge-yellow',
    green: 'ds-badge-green',
    red: 'ds-badge-red',
    dark: 'ds-badge-dark',
  };

  return (
    <span className={`ds-badge ${tones[tone] || tones.neutral} ${className}`}>
      {children}
    </span>
  );
}
