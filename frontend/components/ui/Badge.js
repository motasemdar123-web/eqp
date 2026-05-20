export default function Badge({ children, tone = 'neutral', className = '' }) {
  const tones = {
    neutral: 'ds-badge-neutral',
    yellow: 'ds-badge-yellow',
    amber: 'ds-badge-amber',
    green: 'ds-badge-green',
    red: 'ds-badge-red',
    dark: 'ds-badge-dark',
    blue: 'ds-badge-blue',
    info: 'ds-badge-info',
    cyan: 'ds-badge-cyan',
    live: 'ds-badge-live',
    active: 'ds-badge-green',
    ready: 'ds-badge-ready',
    preserved: 'ds-badge-preserved',
    pending: 'ds-badge-pending',
    warning: 'ds-badge-warning',
    critical: 'ds-badge-critical',
    archived: 'ds-badge-archived',
    completed: 'ds-badge-completed',
  };

  return (
    <span className={`ds-badge ${tones[tone] || tones.neutral} ${className}`}>
      {children}
    </span>
  );
}
