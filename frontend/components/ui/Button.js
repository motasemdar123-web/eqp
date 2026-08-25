'use client';

import React from 'react';

export default function Button({
  children,
  variant = 'primary', // 'primary' | 'accent' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'destructive'
  size = 'md',        // 'sm' | 'md' | 'lg' | 'icon'
  fullWidth = false,
  icon = false,
  className = '',
  type = 'button',
  disabled = false,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none';

  const variants = {
    primary: 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm border border-slate-900',
    accent: 'bg-amber-500 text-slate-950 hover:bg-amber-400 font-extrabold shadow-sm border border-amber-500',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-200/80',
    outline: 'border border-slate-300 bg-transparent hover:bg-slate-100 text-slate-800',
    ghost: 'hover:bg-slate-100 text-slate-700 hover:text-slate-900',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm border border-red-600',
    destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-sm border border-red-600',
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
    md: 'h-9 px-4 text-xs sm:text-sm rounded-xl gap-2',
    lg: 'h-11 px-6 text-sm sm:text-base rounded-xl gap-2.5',
    icon: 'h-9 w-9 p-0 rounded-xl',
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
