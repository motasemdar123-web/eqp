'use client';

import React from 'react';

export default function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`animate-pulse bg-slate-200/75 rounded-md ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
}

