export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon = false,
  className = '',
  ...props
}) {
  const variants = {
    primary: 'ds-button-primary',
    secondary: 'ds-button-secondary',
    danger: 'ds-button-danger',
    ghost: 'ds-button-ghost',
  };
  const sizes = {
    sm: 'ds-button-small',
    md: '',
    icon: 'ds-button-icon',
  };

  return (
    <button
      className={`ds-button ${variants[variant] || variants.primary} ${sizes[icon ? 'icon' : size] || ''} ${fullWidth ? 'ds-button-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
