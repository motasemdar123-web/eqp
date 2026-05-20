'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Button from './ui/Button';
import { clearStoredUser, getStoredPlatformSession, getStoredUser } from '../lib/auth';

const navSections = [
  {
    label: 'Operations',
    items: [
      { href: '/management', label: 'Command Center', code: 'CC' },
      { href: '/management/technicians', label: 'Technicians Management', code: 'TM' },
      { href: '/management/scheduling', label: 'Scheduling', code: 'SC' },
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
  requireAuth = true,
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setUser(getSessionUser());
      setHasHydrated(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!requireAuth || !hasHydrated || user) return;

    const returnTo = pathname || '/management';
    router.replace(`/?returnTo=${encodeURIComponent(returnTo)}`);
  }, [hasHydrated, pathname, requireAuth, router, user]);

  const roleLabel = useMemo(() => {
    if (userLabel) return userLabel;
    if (user?.roles?.length) return user.roles.join(', ');
    if (user?.userNumber) return `User ${user.userNumber}`;
    return hasHydrated ? 'Signed in' : 'Loading session';
  }, [hasHydrated, user, userLabel]);

  function logout() {
    if (onLogout) {
      onLogout();
      return;
    }

    clearStoredUser();
    window.location.href = '/';
  }

  if (requireAuth && hasHydrated && !user) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--color-canvas)] px-5 text-[var(--color-ink)]">
        <div className="ds-card px-5 py-4 text-sm font-bold">
          Redirecting to sign in...
        </div>
      </main>
    );
  }

  return (
    <div className="ds-shell lg:flex lg:gap-5 lg:p-5">
      <aside className="ds-sidebar border-b border-[var(--color-border)] shadow-[var(--shadow-card)] lg:sticky lg:top-5 lg:h-[calc(100vh-2.5rem)] lg:w-72 lg:shrink-0 lg:overflow-hidden lg:rounded-[var(--radius-card)] lg:border">
        <div className="border-b border-[var(--color-border)] p-5">
          <Link href="/management" className="flex items-center gap-3">
            <div className="ds-brand-mark h-11 w-11 shrink-0 text-lg">
              DH
            </div>
            <div className="min-w-0">
              <div className="truncate text-lg font-black text-[var(--color-ink)]">Dar Al HAI</div>
              <p className="truncate text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-sidebar-muted)]">Maintenance System</p>
            </div>
          </Link>
        </div>

        <nav className="flex gap-3 overflow-x-auto p-3 lg:grid lg:gap-5 lg:overflow-visible lg:p-4">
          {navSections.map((section) => (
            <div key={section.label} className="grid min-w-max gap-2 lg:min-w-0">
              <p className="px-2 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--color-sidebar-muted)] opacity-70">
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
                          ? 'bg-[var(--color-brand-soft)] text-[var(--color-brand-hover)] shadow-sm shadow-[rgba(99,91,255,0.12)]'
                          : 'text-[var(--color-muted)] hover:bg-[var(--color-sidebar-panel)] hover:text-[var(--color-ink)]'
                      }`}
                    >
                      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded text-[11px] font-black ${
                        active ? 'bg-[var(--color-brand)] text-white' : 'bg-[var(--color-sidebar-panel)] text-[var(--color-muted)]'
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
        <header className="ds-topbar mt-4 lg:mt-0">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 sm:px-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--color-accent)]">{eyebrow}</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-[var(--color-ink)] sm:text-3xl">{title}</h1>
              {description && <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[var(--color-muted)]">{description}</p>}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {actions}
              <div className="ds-session-chip px-3 py-2 text-sm">
                <span className="block max-w-52 truncate font-semibold">
                  {hasHydrated ? (user?.fullName || user?.email || 'Not signed in') : 'Loading session'}
                </span>
                <span className="block max-w-52 truncate text-xs text-[var(--color-muted)]">
                  {user ? roleLabel : hasHydrated ? 'Authentication required' : 'Checking authentication'}
                </span>
              </div>
              {user && <Button type="button" variant="ghost" onClick={logout}>Logout</Button>}
            </div>
          </div>
        </header>

        <main className={`mx-auto max-w-7xl px-4 py-5 sm:px-0 lg:py-5 ${contentClassName}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
