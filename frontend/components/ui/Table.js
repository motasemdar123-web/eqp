'use client';

import React, { createContext, useContext } from 'react';

const TableContext = createContext({ density: 'standard' });

export function Table({
  children,
  className = '',
  containerClassName = '',
  density = 'standard', // 'compact' | 'standard' | 'comfortable'
  ...props
}) {
  return (
    <TableContext.Provider value={{ density }}>
      <div className={`w-full overflow-x-auto rounded-lg border border-slate-200/80 bg-white shadow-2xs ${containerClassName}`}>
        <table className={`w-full caption-bottom text-xs sm:text-sm text-left ${className}`} {...props}>
          {children}
        </table>
      </div>
    </TableContext.Provider>
  );
}

export function TableHeader({ children, className = '', sticky = false, ...props }) {
  const stickyStyle = sticky
    ? 'sticky top-0 z-10 bg-slate-50/95 backdrop-blur-xs shadow-[0_1px_0_0_rgba(226,232,240,1)]'
    : 'bg-slate-50/90';

  return (
    <thead
      className={`text-slate-600 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-200 ${stickyStyle} ${className}`}
      {...props}
    >
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

export function TableRow({
  children,
  className = '',
  isClickable = false,
  isSelected = false,
  ...props
}) {
  const selectedStyle = isSelected ? 'bg-amber-50/50' : '';
  const clickableStyle = isClickable ? 'cursor-pointer hover:bg-slate-50/90' : 'hover:bg-slate-50/60';

  return (
    <tr
      className={`transition-colors ${selectedStyle} ${clickableStyle} ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({
  children,
  className = '',
  isNumeric = false,
  sortDirection = null, // 'asc' | 'desc' | null
  onSort = null,
  ...props
}) {
  const { density } = useContext(TableContext);

  const heightStyles = {
    compact: 'h-8 px-3 py-1 text-[10px]',
    standard: 'h-9 px-3.5 py-1.5 text-[11px]',
    comfortable: 'h-11 px-4 py-2.5 text-xs',
  };

  const sortableStyle = onSort ? 'cursor-pointer select-none hover:text-slate-900' : '';

  return (
    <th
      aria-sort={
        sortDirection ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined
      }
      onClick={onSort}
      className={`align-middle font-semibold text-slate-600 whitespace-nowrap ${heightStyles[density] || heightStyles.standard} ${
        isNumeric ? 'text-right' : 'text-left'
      } ${sortableStyle} ${className}`}
      {...props}
    >
      <div className={`inline-flex items-center gap-1 ${isNumeric ? 'justify-end' : 'justify-start'}`}>
        <span>{children}</span>
        {sortDirection && (
          <span className="text-[10px] text-slate-400 font-mono">
            {sortDirection === 'asc' ? '▲' : '▼'}
          </span>
        )}
      </div>
    </th>
  );
}

export function TableCell({ children, className = '', isNumeric = false, ...props }) {
  const { density } = useContext(TableContext);

  const paddingStyles = {
    compact: 'px-3 py-1.5 text-xs',
    standard: 'px-3.5 py-2.5 text-xs sm:text-sm',
    comfortable: 'px-4 py-3.5 text-sm',
  };

  return (
    <td
      className={`align-middle text-slate-800 leading-normal ${paddingStyles[density] || paddingStyles.standard} ${
        isNumeric ? 'text-right font-mono tabular-nums' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </td>
  );
}

export default Table;
