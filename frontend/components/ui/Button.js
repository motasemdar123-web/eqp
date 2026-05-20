export default function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}) {
  const variants = {
    primary: 'ds-button-primary',
    secondary: 'ds-button-secondary',
    danger: 'ds-button-danger',
    ghost: 'ds-button-ghost',
  };

  return (
    <button
      className={`ds-button ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
