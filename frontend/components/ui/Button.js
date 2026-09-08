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
  const baseStyles = 'inline-flex items-center justify-center font-medium whitespace-nowrap shrink-0 transition-all duration-120 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.99] select-none cursor-pointer';

  const variants = {
    primary: 'bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold shadow-xs border border-amber-500/80 active:scale-[0.98]',
    secondary: 'bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-slate-300 font-semibold shadow-2xs active:scale-[0.98]',
    accent: 'bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold shadow-xs border border-amber-500',
    outline: 'border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-medium shadow-2xs',
    ghost: 'hover:bg-slate-100 text-slate-600 hover:text-slate-900 font-medium',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-2xs border border-red-600 font-semibold',
    destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-2xs border border-red-600 font-semibold',
    subtle: 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-transparent font-medium',
  };

  const sizes = {
    xs: 'h-7 px-2.5 text-xs rounded-md gap-1',
    sm: 'h-8 px-3 text-xs rounded-md gap-1.5',
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

