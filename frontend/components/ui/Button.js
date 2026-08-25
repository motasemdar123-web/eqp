'use client';

import React from 'react';

export default function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger' | 'destructive' | 'subtle'
  size = 'md',        // 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm'
  fullWidth = false,
  icon = false,
  className = '',
  type = 'button',
  disabled = false,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-120 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.99] select-none cursor-pointer';

  const variants = {
    primary: 'bg-slate-900 text-white hover:bg-slate-800 shadow-2xs border border-slate-900 font-semibold',
    secondary: 'bg-white text-slate-800 hover:bg-slate-50 hover:text-slate-900 border border-slate-300 shadow-2xs',
    accent: 'bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold shadow-2xs border border-amber-500',
    outline: 'border border-slate-300 bg-transparent hover:bg-slate-100/70 text-slate-700 hover:text-slate-900',
    ghost: 'hover:bg-slate-100/80 text-slate-600 hover:text-slate-900',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-2xs border border-red-600 font-semibold',
    destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-2xs border border-red-600 font-semibold',
    subtle: 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-transparent',
  };

  const sizes = {
    sm: 'h-8 px-2.5 text-xs rounded-md gap-1.5',
    md: 'h-9 px-3.5 text-xs sm:text-sm rounded-md gap-2',
    lg: 'h-10 px-4 text-sm rounded-md gap-2.5',
    icon: 'h-9 w-9 p-0 rounded-md',
    'icon-sm': 'h-8 w-8 p-0 rounded-md',
  };

  const resolvedSize = icon ? sizes.icon : (sizes[size] || sizes.md);
  const resolvedVariant = variants[variant] || variants.primary;

  return (
    <button
      type={type}
      disabled={disabled}
      className={`${baseStyles} ${resolvedVariant} ${resolvedSize} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

