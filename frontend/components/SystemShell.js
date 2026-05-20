'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { clearStoredUser, getStoredPlatformSession, getStoredUser } from '../lib/auth';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../lib/api';

const navItems = [
  { href: '/management', label: 'Dashboard', icon: 'dashboard' },
  { href: '/management/technicians', label: 'Technicians', icon: 'users' },
  { href: '/management/scheduling', label: 'Scheduling', icon: 'calendar' },
  { href: '/workspace', label: 'Workspace', icon: 'workspace' },
  { href: '/eqp/generate-reports', label: 'EQP Reports', icon: 'report' },
  { href: '/eqp/machines', label: 'Machines', icon: 'machine' },
  { href: '/eqp/reports', label: 'PDF Archive', icon: 'archive' },
];

const supportItems = [
  { href: '/eqp', label: 'EQP Hub', icon: 'hub' },
  { href: '/technician', label: 'Technician App', icon: 'mobile' },
];

const iconPaths = {
  dashboard: (
    <>
      <path d="M4 5.5h6v5H4z" />
      <path d="M14 5.5h6v3.5h-6z" />
      <path d="M14 13h6v5.5h-6z" />
      <path d="M4 14.5h6v4H4z" />
    </>
  ),
  users: (
    <>
      <path d="M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
      <path d="M3.5 20a6 6 0 0 1 12 0" />
      <path d="M16 11.5a3 3 0 1 0-.5-5.95" />
      <path d="M17 15.5a5 5 0 0 1 3.5 4.5" />
    </>
  ),
  calendar: (
    <>
      <path d="M6 4v3" />
      <path d="M18 4v3" />
      <path d="M4.5 8h15" />
      <path d="M5 6h14v14H5z" />
      <path d="M8 12h2" />
      <path d="M14 12h2" />
      <path d="M8 16h2" />
    </>
  ),
  workspace: (
    <>
      <path d="M5 5h14v14H5z" />
      <path d="M8 9h4" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
      <path d="M15.5 7.5l1 1 2-2" />
    </>
  ),
  report: (
    <>
      <path d="M7 4.5h7l3 3V20H7z" />
      <path d="M14 4.5V8h3.5" />
      <path d="M9.5 12h5" />
      <path d="M9.5 15h5" />
      <path d="M9.5 18h3" />
    </>
  ),
  machine: (
    <>
      <path d="M4 15h12l2-5h-5l-2 3H8" />
      <path d="M6 18.5h11" />
      <path d="M7 18.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
      <path d="M16 18.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
      <path d="M12 10V6h4" />
    </>
  ),
  archive: (
    <>
      <path d="M4 6h16v4H4z" />
      <path d="M6 10h12v10H6z" />
      <path d="M9 14h6" />
    </>
  ),
  hub: (
    <>
      <path d="M12 12m-3 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0" />
      <path d="M12 4v5" />
      <path d="M12 15v5" />
      <path d="M4 12h5" />
      <path d="M15 12h5" />
    </>
  ),
  mobile: (
    <>
      <path d="M8 3.5h8v17H8z" />
      <path d="M11 17.5h2" />
      <path d="M10 6.5h4" />
    </>
  ),
};

function NavIcon({ name }) {
  return (
    <svg className="ds-nav-svg" viewBox="0 0 24 24" aria-hidden="true">
      {iconPaths[name] || iconPaths.dashboard}
    </svg>
  );
}

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setUser(getSessionUser());
      setSidebarCollapsed(localStorage.getItem('darAlHaiSidebarCollapsed') === 'true');
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

  function toggleSidebar() {
    setSidebarCollapsed((current) => {
      const next = !current;
      localStorage.setItem('darAlHaiSidebarCollapsed', String(next));
      return next;
    });
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
    <div className={`ds-shell ds-reference-shell ${sidebarCollapsed ? 'ds-sidebar-collapsed' : ''}`}>
      <aside className="ds-app-sidebar">
        <button
          type="button"
          className="ds-sidebar-toggle"
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className="ds-sidebar-toggle-lines" aria-hidden="true" />
        </button>
        <div className="ds-sidebar-top">
          <Link href="/management" className="ds-sidebar-brand" aria-label="Dar Al Hai dashboard">
            <span className="ds-sidebar-mark">DH</span>
            <span className="ds-sidebar-brand-text">
              <span className="block text-lg font-black leading-none text-[var(--color-ink)]">Dar Al Hai</span>
              <span className="mt-1 block text-[0.64rem] font-black uppercase tracking-[0.18em] text-[var(--color-muted)]">Maintenance</span>
            </span>
          </Link>
        </div>

        <nav className="ds-sidebar-nav" aria-label="Primary navigation">
          <p className="ds-sidebar-section-label">Main menu</p>
          {navItems.map((item) => {
            const active = isActivePath(pathname, item.href, activePath);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`ds-side-nav-link ${active ? 'ds-side-nav-link-active' : ''}`}
                title={item.label}
              >
                <span className="ds-side-nav-icon"><NavIcon name={item.icon} /></span>
                <span className="ds-nav-label truncate">{item.label}</span>
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
                title={item.label}
              >
                <span className="ds-side-nav-icon"><NavIcon name={item.icon} /></span>
                <span className="ds-nav-label truncate">{item.label}</span>
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
          <span className="ds-footer-label text-xs font-black text-[var(--color-muted)]">Live system</span>
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
