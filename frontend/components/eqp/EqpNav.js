'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const EQP_NAV_ITEMS = [
  { href: '/eqp', label: 'Overview' },
  { href: '/eqp/generate-reports', label: 'Report Builder' },
  { href: '/eqp/reports', label: 'PDF Archive' },
  { href: '/eqp/machines', label: 'Machine Register' },
  { href: '/eqp/lifecycle', label: 'Lifecycle Matrix' },
  { href: '/eqp/comments', label: 'Comments Pool' },
];

export default function EqpNav() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md mb-4 text-xs font-medium border border-slate-200/60 overflow-x-auto">
      {EQP_NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-1.5 rounded transition-all whitespace-nowrap ${
              isActive
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
