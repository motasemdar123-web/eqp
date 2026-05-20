'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { clearStoredUser, getStoredPlatformSession, getStoredUser } from '../lib/auth';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../lib/api';

const navItems = [
  { href: '/management', label: 'Dashboard', code: 'DB' },
  { href: '/management/technicians', label: 'Technicians', code: 'TM' },
  { href: '/management/scheduling', label: 'Scheduling', code: 'SC' },
  { href: '/eqp/generate-reports', label: 'EQP Reports', code: 'EQ' },
  { href: '/eqp/machines', label: 'Machines', code: 'MA' },
  { href: '/eqp/reports', label: 'PDF Archive', code: 'PA' },
];

const supportItems = [
  { href: '/eqp', label: 'EQP Hub', code: 'EH' },
  { href: '/technician', label: 'Technician App', code: 'TA' },
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
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

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

  useEffect(() => {
    if (!hasHydrated || !user) return undefined;

    let cancelled = false;

    async function loadNotifications() {
      try {
        const data = await getNotifications(12);
        if (cancelled) return;
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } catch {
        if (!cancelled) {
          setNotifications([]);
          setUnreadCount(0);
        }
      }
    }

    loadNotifications();
    const interval = setInterval(loadNotifications, 60000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [hasHydrated, user]);

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

  async function handleNotificationClick(notification) {
    try {
      if (!notification.readAt) {
        const data = await markNotificationRead(notification.id);
        const next = data.notification;
        setNotifications((current) => current.map((item) => (item.id === notification.id ? next : item)));
        setUnreadCount((current) => Math.max(0, current - 1));
      }
    } catch {
      // Notification read state is non-blocking for navigation.
    }

    if (notification.href) {
      setNotificationsOpen(false);
      router.push(notification.href);
    }
  }

  async function handleMarkAllRead() {
    try {
      const data = await markAllNotificationsRead();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      setUnreadCount(0);
      setNotifications((current) => current.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })));
    }
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
    <div className="ds-shell ds-reference-shell">
      <aside className="ds-app-sidebar">
        <Link href="/management" className="ds-sidebar-brand">
          <span className="ds-sidebar-mark">DH</span>
          <span>
            <span className="block text-lg font-black leading-none text-[var(--color-ink)]">Dar Al Hai</span>
            <span className="mt-1 block text-[0.64rem] font-black uppercase tracking-[0.18em] text-[var(--color-muted)]">Maintenance</span>
          </span>
        </Link>

        <nav className="ds-sidebar-nav" aria-label="Primary navigation">
          <p className="ds-sidebar-section-label">Main menu</p>
          {navItems.map((item) => {
            const active = isActivePath(pathname, item.href, activePath);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`ds-side-nav-link ${active ? 'ds-side-nav-link-active' : ''}`}
              >
                <span className="ds-side-nav-icon">{item.code}</span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}

          <p className="ds-sidebar-section-label mt-7">Support</p>
          {supportItems.map((item) => {
            const active = isActivePath(pathname, item.href, activePath);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`ds-side-nav-link ${active ? 'ds-side-nav-link-active' : ''}`}
              >
                <span className="ds-side-nav-icon">{item.code}</span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="ds-sidebar-promo">
          <p className="text-xs font-black text-[var(--color-brand)]">Operations-ready</p>
          <p className="mt-1 text-xs font-bold leading-5 text-[var(--color-muted)]">
            Unified scheduling, technicians, EQP reports, and machine records.
          </p>
          <div className="mt-3 grid gap-1.5">
            <span className="h-1.5 rounded-full bg-[var(--color-brand)]" />
            <span className="h-1.5 w-10/12 rounded-full bg-[var(--color-accent)]" />
            <span className="h-1.5 w-7/12 rounded-full bg-[var(--color-border-strong)]" />
          </div>
        </div>

        <div className="ds-sidebar-footer">
          <span className="ds-status-dot" />
          <span className="text-xs font-black text-[var(--color-muted)]">Live system</span>
          {user && (
            <button type="button" onClick={logout} className="ds-sidebar-logout" aria-label="Logout">
              Logout
            </button>
          )}
        </div>
      </aside>

      <div className="ds-app-main">
        <header className="ds-app-topbar">
          <label className="ds-global-search">
            <span>Search</span>
            <input placeholder="Search modules, tasks, reports..." aria-label="Search modules, tasks, reports" />
          </label>

          <div className="ds-topbar-actions">
            <div className="ds-plan-chip">Business plan</div>
            <div className="ds-notification-anchor">
              <button
                type="button"
                className={`ds-icon-button ${unreadCount > 0 ? 'ds-icon-button-alert' : ''}`}
                aria-label="Notifications"
                onClick={() => setNotificationsOpen((current) => !current)}
              >
                !
                {unreadCount > 0 && <span className="ds-notification-count">{unreadCount > 9 ? '9+' : unreadCount}</span>}
              </button>
              {notificationsOpen && (
                <div className="ds-notification-menu">
                  <div className="ds-notification-head">
                    <div>
                      <p className="text-sm font-black text-[var(--color-ink)]">Notifications</p>
                      <p className="text-xs font-bold text-[var(--color-muted)]">{unreadCount} unread alerts</p>
                    </div>
                    <button type="button" onClick={handleMarkAllRead}>Mark all read</button>
                  </div>
                  <div className="ds-notification-list">
                    {notifications.length === 0 ? (
                      <div className="ds-notification-empty">No notifications yet.</div>
                    ) : notifications.map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        className={`ds-notification-item ${notification.readAt ? '' : 'ds-notification-item-unread'}`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <span className={`ds-notification-dot ds-notification-dot-${notification.severity || 'info'}`} />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-black text-[var(--color-ink)]">{notification.title}</span>
                          <span className="mt-1 block line-clamp-2 text-xs font-bold leading-5 text-[var(--color-muted)]">{notification.message}</span>
                        </span>
                        <span className="text-[0.65rem] font-black uppercase tracking-[0.08em] text-[var(--color-subtle)]">
                          {notification.type}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="ds-avatar" aria-hidden="true">
              {(hasHydrated ? (user?.fullName || user?.email || 'D') : 'D').slice(0, 1).toUpperCase()}
            </div>
          </div>
        </header>

        <main className={`ds-reference-content ${contentClassName}`}>
          <section className="ds-page-heading">
            <div>
              <p className="ds-page-eyebrow">{eyebrow}</p>
              <h1 className="ds-page-title">{title}</h1>
              {description && <p className="ds-page-description">{description}</p>}
              <p className="mt-2 text-xs font-bold text-[var(--color-muted)]">
                {hasHydrated ? (user?.fullName || user?.email || roleLabel) : 'Loading session'}
              </p>
            </div>
            {actions && <div className="ds-page-actions">{actions}</div>}
          </section>

          {children}
        </main>
      </div>
    </div>
  );
}
