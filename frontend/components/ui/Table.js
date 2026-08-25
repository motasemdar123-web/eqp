'use client';

import React from 'react';

export function Table({ children, className = '', ...props }) {
  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
      <table className={`w-full caption-bottom text-xs text-left ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className = '', ...props }) {
  return (
    <thead className={`bg-slate-900 text-white text-[11px] uppercase tracking-wider font-bold ${className}`} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '', ...props }) {
  return (
    <tbody className={`divide-y divide-slate-100 ${className}`} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = '', isClickable = false, ...props }) {
  return (
    <tr
      className={`transition-colors hover:bg-slate-50/80 ${isClickable ? 'cursor-pointer' : ''} ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({ children, className = '', ...props }) {
  return (
    <th className={`h-10 px-4 text-left align-middle font-bold text-white whitespace-nowrap ${className}`} {...props}>
      {children}
    </th>
  );
}

export function TableCell({ children, className = '', ...props }) {
  return (
    <td className={`p-4 align-middle text-slate-800 leading-normal ${className}`} {...props}>
      {children}
    </td>
  );
}

export default Table;
