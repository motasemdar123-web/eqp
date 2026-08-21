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
  { href: '/management/daily-planner', label: 'Daily Planner', icon: 'planner' },
  { href: '/management/parts-inquiry', label: 'Parts Inquiry', icon: 'parts' },
  { href: '/workspace', label: 'Workspace', icon: 'workspace' },
  { href: '/eqp', label: 'EQP Module', icon: 'hub' },
];

const supportItems = [
  { href: '/technician', label: 'Technician App', icon: 'mobile' },
];

const iconPaths = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </>
  ),
  planner: (
    <>
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </>
  ),
  parts: (
    <>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </>
  ),
  workspace: (
    <>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="12" y1="11" x2="12" y2="17" />
      <line x1="9" y1="14" x2="15" y2="14" />
    </>
  ),
  hub: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </>
  ),
  mobile: (
    <>
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
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
  return target === href || target.startsWith(`${href}/`);
}

function formatRoleLabel(role) {
  const labels = {
    SERVICE_ENGINEER: 'Service Engineer',
    TECHNICIAN: 'Technician',
    FIELD_TECHNICIAN: 'Technician',
    MAINTENANCE_SUPERVISOR: 'Service Engineer',
  };

  return labels[role] || String(role || '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Close mobile drawer on route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const roleLabel = useMemo(() => {
    if (userLabel) return userLabel;
    if (user?.roles?.length) return user.roles.map(formatRoleLabel).join(', ');
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
      // Non-blocking
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
      <main className="grid min-h-screen place-items-center bg-slate-50 px-5 text-slate-900">
        <div className="ds-card flex items-center gap-3 px-6 py-4 text-sm font-semibold text-slate-700 shadow-md">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          Redirecting to sign in...
        </div>
      </main>
    );
  }

  return (
    <div className={`ds-shell ds-reference-shell ${sidebarCollapsed ? 'ds-sidebar-collapsed' : ''}`}>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`ds-app-sidebar ${mobileMenuOpen ? '!flex !fixed !left-0 !top-0 !bottom-0 !w-64 z-50 shadow-2xl' : ''}`}>
        <button
          type="button"
          className="ds-sidebar-toggle hidden lg:grid"
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className="ds-sidebar-chevron" aria-hidden="true" />
        </button>

        <div className="ds-sidebar-top">
          <Link href="/management" className="ds-sidebar-brand" aria-label="Dar Al Hai dashboard">
            <span className="ds-sidebar-mark">DH</span>
            <span className="ds-sidebar-brand-text">
              <span className="block text-sm font-bold leading-none text-white">Dar Al Hai</span>
              <span className="mt-1 block text-[0.6875rem] font-medium uppercase tracking-wider text-slate-400">Maintenance</span>
            </span>
          </Link>
          {mobileMenuOpen && (
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden rounded p-1 text-slate-400 hover:text-white"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
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

          <p className="ds-sidebar-section-label mt-4">Field Support</p>
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
          <p className="text-xs font-bold text-amber-400">Service Operations</p>
          <p className="mt-1 text-xs text-slate-400 leading-relaxed">
            Scheduling, field teams, machine records, and EQP reporting.
          </p>
        </div>

        <div className="ds-sidebar-footer">
          <span className="ds-status-dot" />
          <span className="ds-footer-label text-xs font-medium text-slate-400">Operations Online</span>
          {user && (
            <button type="button" onClick={logout} className="ds-sidebar-logout" aria-label="Logout">
              Logout
            </button>
          )}
        </div>
      </aside>

      {/* Main Area */}
      <div className="ds-app-main">
        <header className="ds-app-topbar">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="lg:hidden ds-icon-button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open mobile menu"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="ds-topbar-brand">
              <span className="ds-topbar-brand-rule" aria-hidden="true" />
              <span>
                <strong>Dar Al Hai Machinery</strong>
                <small>Service Operations</small>
              </span>
            </div>
          </div>

          <div className="ds-topbar-actions">
            <div className="ds-plan-chip hidden sm:inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              System Healthy
            </div>

            {/* Notifications Menu */}
            <div className="ds-notification-anchor">
              <button
                type="button"
                className={`ds-icon-button ${unreadCount > 0 ? 'ds-icon-button-alert' : ''}`}
                aria-label="Notifications"
                onClick={() => setNotificationsOpen((current) => !current)}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && <span className="ds-notification-count">{unreadCount > 9 ? '9+' : unreadCount}</span>}
              </button>

              {notificationsOpen && (
                <div className="ds-notification-menu">
                  <div className="ds-notification-head">
                    <div>
                      <p className="text-sm font-bold text-slate-900">Notifications</p>
                      <p className="text-xs text-slate-500">{unreadCount} unread alerts</p>
                    </div>
                    {unreadCount > 0 && (
                      <button type="button" onClick={handleMarkAllRead}>Mark all read</button>
                    )}
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
                        <span className={`ds-notification-dot ${notification.readAt ? '!bg-slate-300' : '!bg-sky-500'}`} />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-slate-900">{notification.title}</span>
                          <span className="mt-0.5 block line-clamp-2 text-xs text-slate-500">{notification.message}</span>
                        </span>
                        <span className="text-[0.625rem] font-semibold uppercase text-slate-400">
                          {notification.type}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Avatar & User Info */}
            <div className="flex items-center gap-2.5 pl-1">
              <div className="ds-avatar" aria-hidden="true">
                {(hasHydrated ? (user?.fullName || user?.email || 'D') : 'D').slice(0, 1).toUpperCase()}
              </div>
              <div className="hidden md:block text-left leading-tight">
                <span className="block text-xs font-bold text-slate-900 truncate max-w-[120px]">
                  {hasHydrated ? (user?.fullName || user?.email || 'Engineer') : 'User'}
                </span>
                <span className="block text-[0.6875rem] text-slate-500 truncate max-w-[120px]">
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className={`ds-reference-content ${contentClassName}`}>
          <section className="ds-page-heading">
            <div>
              <p className="ds-page-eyebrow">{eyebrow}</p>
              <h1 className="ds-page-title">{title}</h1>
              {description && <p className="ds-page-description">{description}</p>}
            </div>
            {actions && <div className="ds-page-actions">{actions}</div>}
          </section>

          {children}
        </main>
      </div>
    </div>
  );
}
