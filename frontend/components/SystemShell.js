'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Button from './ui/Button';
import { clearStoredUser, getStoredPlatformSession, getStoredUser } from '../lib/auth';

const navItems = [
  { href: '/management', label: 'Dashboard' },
  { href: '/management/technicians', label: 'Technicians' },
  { href: '/management/scheduling', label: 'Scheduling' },
  { href: '/eqp/generate-reports', label: 'EQP Reports' },
  { href: '/eqp/machines', label: 'Machines' },
  { href: '/eqp/reports', label: 'PDF Archive' },
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
  eyebrow = 'Dar Al Hai',
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
    <div className="ds-shell">
      <header className="ds-blue-header">
        <div className="mx-auto max-w-[96rem] px-4 sm:px-6">
          <div className="ds-top-nav">
            <Link href="/management" className="ds-brand-link">
              <div className="ds-brand-mark h-11 w-11 shrink-0 text-lg">
                DH
              </div>
              <div className="min-w-0">
                <div className="truncate text-lg font-black">Dar Al Hai</div>
                <p className="truncate text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-sidebar-muted)]">
                  Maintenance System
                </p>
              </div>
            </Link>

            <nav className="ds-nav-scroll" aria-label="Primary navigation">
              {navItems.map((item) => {
                const active = isActivePath(pathname, item.href, activePath);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`ds-nav-link ${active ? 'ds-nav-link-active' : ''}`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="ds-top-actions">
              <div className="ds-session-chip px-2.5 py-1.5 text-sm">
                <span className="block max-w-40 truncate font-semibold">
                  {hasHydrated ? (user?.fullName || user?.email || 'Not signed in') : 'Loading session'}
                </span>
                <span className="block max-w-40 truncate text-xs">
                  {user ? roleLabel : hasHydrated ? 'Authentication required' : 'Checking authentication'}
                </span>
              </div>
              {user && <Button type="button" variant="ghost" size="sm" onClick={logout}>Logout</Button>}
            </div>
          </div>

          <div className="ds-hero-row">
            <div className="min-w-0">
              <p className="ds-hero-eyebrow">{eyebrow}</p>
              <h1 className="ds-hero-title">{title}</h1>
              {description && <p className="ds-hero-description">{description}</p>}
            </div>
            {actions && <div className="ds-hero-actions">{actions}</div>}
          </div>
        </div>
      </header>

      <main className={`ds-content-frame mx-auto max-w-[96rem] px-4 pb-10 sm:px-6 ${contentClassName}`}>
        {children}
      </main>
    </div>
  );
}
