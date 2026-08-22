'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { clearStoredUser, getStoredPlatformSession, getStoredUser } from '../lib/auth';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../lib/api';

const navItems = [
  { href: '/management', label: 'Dashboard', icon: 'dashboard' },
  { href: '/management/technicians', label: 'Technicians', icon: 'users' },
  { href: '/management/scheduling', label: 'Scheduling', icon: 'calendar' },
  { href: '/management/daily-planner', label: 'Daily Planner', icon: 'planner' },
  { href: '/management/parts-inquiry', label: 'Spare Parts', icon: 'parts' },
  { href: '/workspace', label: 'Workspace', icon: 'workspace' },
  { href: '/eqp', label: 'EQP Module', icon: 'hub' },
  { href: '/japanese', label: 'Japanese Corner', icon: 'japanese' },
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
  japanese: (
    <>
      <path d="M4 6h16M7 6v14M17 6v14M2 10h20M9 14h6" />
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

const COMMAND_ITEMS = [
  // Navigation
  { id: 'nav-dashboard', title: 'Management Dashboard', subtitle: 'Operations overview, KPIs, and live roster', href: '/management', category: 'Navigation', badge: 'Overview' },
  { id: 'nav-technicians', title: 'Technicians Management', subtitle: 'Staff records, shifts, regions, skills & dispatch', href: '/management/technicians', category: 'Navigation', badge: 'Staff' },
  { id: 'nav-scheduling', title: 'Scheduling & Work Windows', subtitle: 'Gantt timeline, work windows, shop manuals AI', href: '/management/scheduling', category: 'Navigation', badge: 'Schedule' },
  { id: 'nav-daily-planner', title: 'Daily Schedule Planner', subtitle: 'Shift task sequencing and supervisor dispatch', href: '/management/daily-planner', category: 'Navigation', badge: 'Planner' },
  { id: 'nav-parts-inquiry', title: 'Spare Parts Hub & Emergency Orders', subtitle: 'Komatsu PDX bulk stock inquiry, Emergency Orders (EO) batching, machine fleet matching', href: '/management/parts-inquiry', category: 'Navigation', badge: 'Spare Parts' },
  { id: 'nav-workspace', title: 'Engineering Whiteboard', subtitle: 'Miro-grade canvas, 5-whys, maintenance templates', href: '/workspace', category: 'Navigation', badge: 'Canvas' },
  { id: 'nav-eqp', title: 'EQP Module Hub', subtitle: 'Certified reports, machines register & lifecycle', href: '/eqp', category: 'Navigation', badge: 'EQP' },
  { id: 'nav-japanese', title: 'Japanese Learning Hub', subtitle: 'JLPT N5 & N4 active recall, kanji dojo & audio exams', href: '/japanese', category: 'Navigation', badge: 'Language' },
  { id: 'nav-eqp-reports', title: 'EQP PDF Archive', subtitle: 'Search, batch download & manage certified PDFs', href: '/eqp/reports', category: 'Navigation', badge: 'Archive' },
  { id: 'nav-eqp-gen', title: 'Report Builder', subtitle: 'Generate certified preventive maintenance reports', href: '/eqp/generate-reports', category: 'Navigation', badge: 'Builder' },
  { id: 'nav-eqp-machines', title: 'Machines Register', subtitle: 'Fleet counter progression, SMR & report readiness', href: '/eqp/machines', category: 'Navigation', badge: 'Fleet' },
  { id: 'nav-technician-app', title: 'Field Technician Mobile App', subtitle: 'Voice transcription, audio tasks, weather advice', href: '/technician', category: 'Navigation', badge: 'Mobile' },
  
  // Quick Actions
  { id: 'act-new-eo', title: 'Create Emergency Order (EO) Batch', subtitle: 'Automate multi-order dispatch for high-quantity parts', href: '/management/parts-inquiry', category: 'Quick Action', badge: 'EO Batch' },
  { id: 'act-new-task', title: 'Add Daily Schedule Task', subtitle: 'Create timed task block for today', href: '/management/daily-planner', category: 'Quick Action', badge: 'Action' },
  { id: 'act-search-parts', title: 'Run Komatsu PDX Inquiry', subtitle: 'Batch inquiry for parts stock & pricing', href: '/management/parts-inquiry', category: 'Quick Action', badge: 'Action' },
  { id: 'act-japanese', title: 'Practice Japanese SRS Flashcards', subtitle: 'Open JLPT N5/N4 flashcard dojo', href: '/japanese', category: 'Quick Action', badge: 'Learn' },
  { id: 'act-new-report', title: 'Draft EQP Inspection Report', subtitle: 'Launch report builder wizard', href: '/eqp/generate-reports', category: 'Quick Action', badge: 'Action' },
  { id: 'act-add-tech', title: 'Register New Technician', subtitle: 'Add technician to company fleet roster', href: '/management/technicians', category: 'Quick Action', badge: 'Action' },
];

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

  // Command Palette & Quick Menu
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState('');
  const [cmdIndex, setCmdIndex] = useState(0);
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const cmdInputRef = useRef(null);

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

  // Global Keyboard Shortcuts (Ctrl+K / Cmd+K)
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setCmdOpen(false);
        setQuickMenuOpen(false);
        setNotificationsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (cmdOpen) {
      setTimeout(() => cmdInputRef.current?.focus(), 50);
      setCmdQuery('');
      setCmdIndex(0);
    }
  }, [cmdOpen]);

  // Close mobile drawer on route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setQuickMenuOpen(false);
  }, [pathname]);

  const roleLabel = useMemo(() => {
    if (userLabel) return userLabel;
    if (user?.roles?.length) return user.roles.map(formatRoleLabel).join(', ');
    if (user?.userNumber) return `User ${user.userNumber}`;
    return hasHydrated ? 'Signed in' : 'Loading session';
  }, [hasHydrated, user, userLabel]);

  // Filtered Command Items
  const filteredCmdItems = useMemo(() => {
    const q = cmdQuery.trim().toLowerCase();
    if (!q) return COMMAND_ITEMS;
    return COMMAND_ITEMS.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.badge.toLowerCase().includes(q)
    );
  }, [cmdQuery]);

  function handleCmdKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCmdIndex((prev) => (prev + 1) % Math.max(1, filteredCmdItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCmdIndex((prev) => (prev - 1 + filteredCmdItems.length) % Math.max(1, filteredCmdItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredCmdItems[cmdIndex];
      if (selected) {
        setCmdOpen(false);
        router.push(selected.href);
      }
    }
  }

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

  // Breadcrumbs computation
  const pathSegments = (pathname || '').split('/').filter(Boolean);
  const breadcrumbSection = pathSegments[0] === 'management' ? 'Operations' : pathSegments[0] === 'eqp' ? 'EQP Module' : 'Workspace';

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
      <aside className={`ds-app-sidebar ${mobileMenuOpen ? 'ds-sidebar-mobile-open' : ''}`}>
        <div className="ds-sidebar-header">
          <Link
            href="/management"
            className="ds-sidebar-brand"
            aria-label="Dar Al Hai Home"
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="ds-sidebar-brand-mark">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            </span>
            <span className="ds-sidebar-brand-text">
              <span className="block text-sm font-bold leading-none text-white">Dar Al Hai</span>
              <span className="mt-1 block text-[0.6875rem] font-medium uppercase tracking-wider text-slate-400">Maintenance</span>
            </span>
          </Link>
          {mobileMenuOpen && (
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Close mobile menu"
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
                onClick={() => setMobileMenuOpen(false)}
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
                onClick={() => setMobileMenuOpen(false)}
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

            {/* Breadcrumbs */}
            <div className="ds-breadcrumbs hidden md:flex items-center">
              <Link href="/management" className="ds-breadcrumb-item">Dar Al Hai</Link>
              <span className="ds-breadcrumb-sep">/</span>
              <span className="ds-breadcrumb-item">{breadcrumbSection}</span>
              <span className="ds-breadcrumb-sep">/</span>
              <span className="ds-breadcrumb-active truncate max-w-[200px]">{title}</span>
            </div>
          </div>

          <div className="ds-topbar-actions flex items-center gap-2.5">
            {/* Command Palette Trigger */}
            <button
              type="button"
              className="ds-cmd-trigger-btn"
              onClick={() => setCmdOpen(true)}
              title="Search and jump anywhere (Ctrl+K)"
            >
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="hidden sm:inline">Quick Search</span>
              <kbd className="ds-cmd-trigger-kbd">⌘K</kbd>
            </button>

            {/* + New Quick Action Dropdown */}
            <div className="ds-quick-menu-anchor">
              <button
                type="button"
                className="ds-button ds-button-primary ds-button-small shadow-xs flex items-center gap-1"
                onClick={() => setQuickMenuOpen((prev) => !prev)}
              >
                <span>+ New</span>
                <svg className="w-3 h-3 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {quickMenuOpen && (
                <div className="ds-quick-menu">
                  <Link
                    href="/eqp/generate-reports"
                    className="ds-quick-menu-item"
                    onClick={() => setQuickMenuOpen(false)}
                  >
                    <span>📄</span> Draft EQP Report
                  </Link>
                  <Link
                    href="/management/daily-planner"
                    className="ds-quick-menu-item"
                    onClick={() => setQuickMenuOpen(false)}
                  >
                    <span>⏱</span> Schedule Shift Task
                  </Link>
                  <Link
                    href="/management/parts-inquiry"
                    className="ds-quick-menu-item"
                    onClick={() => setQuickMenuOpen(false)}
                  >
                    <span>🔍</span> Komatsu Parts Inquiry
                  </Link>
                  <Link
                    href="/management/technicians"
                    className="ds-quick-menu-item"
                    onClick={() => setQuickMenuOpen(false)}
                  >
                    <span>👤</span> Register Technician
                  </Link>
                  <Link
                    href="/workspace"
                    className="ds-quick-menu-item"
                    onClick={() => setQuickMenuOpen(false)}
                  >
                    <span>🎨</span> Open Whiteboard
                  </Link>
                  <Link
                    href="/japanese"
                    className="ds-quick-menu-item"
                    onClick={() => setQuickMenuOpen(false)}
                  >
                    <span>🌸</span> Japanese Learning Hub
                  </Link>
                </div>
              )}
            </div>

            {/* System Status Pill */}
            <div className="ds-plan-chip hidden xl:inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Operational
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
            <div className="flex items-center gap-2.5 pl-1 border-l border-slate-200 ml-1">
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

      {/* Global Command Palette Modal */}
      {cmdOpen && (
        <div className="cmd-palette-backdrop" onClick={() => setCmdOpen(false)}>
          <div className="cmd-palette-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cmd-palette-search-wrap">
              <svg className="cmd-palette-search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={cmdInputRef}
                type="text"
                className="cmd-palette-input"
                placeholder="Type a command, module, or task name..."
                value={cmdQuery}
                onChange={(e) => {
                  setCmdQuery(e.target.value);
                  setCmdIndex(0);
                }}
                onKeyDown={handleCmdKeyDown}
              />
              <kbd className="ds-cmd-trigger-kbd">ESC</kbd>
            </div>

            <div className="cmd-palette-list">
              {filteredCmdItems.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  No matching modules or actions found for &ldquo;{cmdQuery}&rdquo;
                </div>
              ) : (
                filteredCmdItems.map((item, idx) => {
                  const isSelected = idx === cmdIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`cmd-palette-item ${isSelected ? 'cmd-palette-item-active' : ''}`}
                      onClick={() => {
                        setCmdOpen(false);
                        router.push(item.href);
                      }}
                      onMouseEnter={() => setCmdIndex(idx)}
                    >
                      <div className="cmd-palette-item-left">
                        <span className="text-sm">
                          {item.category === 'Navigation' ? '📌' : '⚡'}
                        </span>
                        <div>
                          <p className="cmd-palette-item-title">{item.title}</p>
                          <p className="cmd-palette-item-subtitle">{item.subtitle}</p>
                        </div>
                      </div>
                      <span className="cmd-palette-badge">{item.badge}</span>
                    </button>
                  );
                })
              )}
            </div>

            <div className="cmd-palette-footer">
              <span>Dar Al Hai Machinery Operations</span>
              <div className="cmd-palette-footer-keys">
                <span><kbd className="ds-cmd-trigger-kbd">↑</kbd> <kbd className="ds-cmd-trigger-kbd">↓</kbd> to navigate</span>
                <span><kbd className="ds-cmd-trigger-kbd">↵</kbd> to select</span>
                <span><kbd className="ds-cmd-trigger-kbd">ESC</kbd> to close</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
