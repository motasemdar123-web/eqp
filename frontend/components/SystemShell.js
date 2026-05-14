'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';
import Button from './ui/Button';
import { clearStoredUser, getStoredPlatformSession, getStoredUser } from '../lib/auth';

const navSections = [
  {
    label: 'Operations',
    items: [
      { href: '/management', label: 'Command Center', code: 'CC' },
      { href: '/engineer', label: 'Engineer Approvals', code: 'EA' },
      { href: '/management/technicians', label: 'Technicians Management', code: 'TM' },
      { href: '/management/scheduling', label: 'Scheduling', code: 'SC' },
      { href: '/management/requests', label: 'Requests', code: 'RQ' },
      { href: '/management/work-orders', label: 'Work Orders', code: 'WO' },
      { href: '/management/assets', label: 'Assets', code: 'AS' },
      { href: '/management/inventory', label: 'Inventory', code: 'IN' },
    ],
  },
  {
    label: 'EQP',
    items: [
      { href: '/eqp', label: 'EQP Overview', code: 'EQ' },
      { href: '/eqp/generate-reports', label: 'Report Builder', code: 'RB' },
      { href: '/eqp/machines', label: 'Machines', code: 'MA' },
      { href: '/eqp/reports', label: 'PDF Archive', code: 'PA' },
    ],
  },
];

function getSessionUser() {
  const platformSession = getStoredPlatformSession();
  if (platformSession?.user) return platformSession.user;

  return getStoredUser();
}

function isActivePath(pathname, href, activePath) {
  const target = activePath || pathname;

  if (href === '/management') return target === href;
  if (href === '/eqp') return target === href;

  return target === href || target.startsWith(`${href}/`);
}

export default function SystemShell({
  title,
  eyebrow = 'Dar Al HAI',
  description,
  activePath,
  actions,
  children,
  onLogout,
  userLabel,
  contentClassName = '',
}) {
  const pathname = usePathname();
  const [user] = useState(() => getSessionUser());

  const roleLabel = useMemo(() => {
    if (userLabel) return userLabel;
    if (user?.roles?.length) return user.roles.join(', ');
    if (user?.userNumber) return `User ${user.userNumber}`;
    return 'Signed in';
  }, [user, userLabel]);

  function logout() {
    if (onLogout) {
      onLogout();
      return;
    }

    clearStoredUser();
    window.location.href = '/';
  }

  return (
    <div className="min-h-screen bg-[#edf1ea] text-zinc-900 lg:flex">
      <aside className="border-b border-zinc-200 bg-zinc-950 text-white lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:shrink-0 lg:border-b-0 lg:border-r lg:border-zinc-900">
        <div className="border-b border-white/10 p-5">
          <Link href="/management" className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-yellow-400 text-lg font-black text-zinc-950">
              DH
            </div>
            <div className="min-w-0">
              <div className="truncate text-lg font-black text-white">Dar Al HAI</div>
              <p className="truncate text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">Maintenance System</p>
            </div>
          </Link>
        </div>

        <nav className="flex gap-3 overflow-x-auto p-3 lg:grid lg:gap-5 lg:overflow-visible lg:p-4">
          {navSections.map((section) => (
            <div key={section.label} className="grid min-w-max gap-2 lg:min-w-0">
              <p className="px-2 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                {section.label}
              </p>
              <div className="flex gap-2 lg:grid">
                {section.items.map((item) => {
                  const active = isActivePath(pathname, item.href, activePath);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition ${
                        active
                          ? 'bg-yellow-400 text-zinc-950 shadow-sm shadow-yellow-950/20'
                          : 'text-zinc-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded text-[11px] font-black ${
                        active ? 'bg-zinc-950 text-yellow-300' : 'bg-white/10 text-zinc-200'
                      }`}>
                        {item.code}
                      </span>
                      <span className="hidden lg:inline">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="border-b border-zinc-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 sm:px-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{eyebrow}</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">{title}</h1>
              {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">{description}</p>}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {actions}
              <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                <span className="block max-w-52 truncate font-semibold">{user?.fullName || user?.email || 'Not signed in'}</span>
                <span className="block max-w-52 truncate text-xs text-zinc-500">{user ? roleLabel : 'Authentication required'}</span>
              </div>
              {user && <Button type="button" variant="ghost" onClick={logout}>Logout</Button>}
            </div>
          </div>
        </header>

        <main className={`mx-auto max-w-7xl px-4 py-6 sm:px-6 ${contentClassName}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
