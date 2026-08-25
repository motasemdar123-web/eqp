'use client';

import React from 'react';

export default function Separator({ orientation = 'horizontal', className = '' }) {
  if (orientation === 'vertical') {
    return <div className={`w-[1px] h-full bg-slate-200 ${className}`} />;
  }
  return <div className={`h-[1px] w-full bg-slate-200 ${className}`} />;
}
