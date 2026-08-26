'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { clearStoredUser, getStoredPlatformSession, getStoredUser } from '../lib/auth';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../lib/api';

const navigationSections = [
  {
    title: 'Operations',
    items: [
      { href: '/management', label: 'Command Center', icon: 'dashboard' },
      { href: '/management/scheduling', label: 'Dispatch & Scheduling', icon: 'calendar' },
      { href: '/management/fleet-analytics', label: 'Fleet & Workshop', icon: 'analytics' },
    ],
  },
  {
    title: 'Supply',
    items: [
      { href: '/management/parts-inquiry', label: 'Spare Parts & PDX', icon: 'parts' },
    ],
  },
  {
    title: 'Compliance',
    items: [
      { href: '/eqp', label: 'EQP Compliance', icon: 'hub' },
    ],
  },
  {
    title: 'Media & Creative',
    items: [
      { href: '/media', label: 'Media Corner', icon: 'media' },
    ],
  },
  {
    title: 'Administration',
    items: [
      { href: '/management/technicians', label: 'Staff & Technicians', icon: 'users' },
    ],
  },
  {
    title: 'Secondary & Field Apps',
    isLabs: true,
    items: [
      { href: '/technician', label: 'Technician Mobile App', icon: 'mobile', badge: 'RTL' },
      { href: '/management/daily-planner', label: 'Daily Planner', icon: 'planner' },
      { href: '/management/workshop', label: 'Workshop Operations', icon: 'workshop' },
      { href: '/management/sheets-hub', label: 'Master Sheets Database', icon: 'sheets' },
      { href: '/workspace', label: 'Engineering Canvas', icon: 'workspace' },
      { href: '/japanese', label: 'Japanese Learning Hub', icon: 'japanese' },
    ],
  },
];



const iconPaths = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </>
  ),
  analytics: (
    <>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <line x1="3" y1="20" x2="21" y2="20" />
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
  workshop: (
    <>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </>
  ),
  parts: (
    <>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </>
  ),
  sheets: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </>
  ),
  hub: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </>
  ),
  builder: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="18" x2="12" y2="12" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </>
  ),
  archive: (
    <>
      <polyline points="21 8 21 21 3 21 3 8" />
      <rect x="1" y="3" width="22" height="5" />
      <line x1="10" y1="12" x2="14" y2="12" />
    </>
  ),
  machines: (
    <>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="6" cy="12" r="2" />
      <circle cx="18" cy="12" r="2" />
      <line x1="10" y1="12" x2="14" y2="12" />
    </>
  ),
  lifecycle: (
    <>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </>
  ),
  comments: (
    <>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
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
  mobile: (
    <>
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
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
  media: (
    <>
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </>
  ),
  japanese: (
    <>
      <path d="M4 6h16M7 6v14M17 6v14M2 10h20M9 14h6" />
    </>
  ),
};

function NavIcon({ name }) {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

export function isMediaOnlyUser(user) {
  if (!user) return false;
  const email = String(user.email || '').trim().toLowerCase();
  if (email === 'jessicaafawzyy80@gmail.com') return true;
  const roles = Array.isArray(user.roles) ? user.roles : [];
  if (roles.includes('MEDIA_SPECIALIST') || roles.includes('MEDIA')) {
    const hasAdminOrOps = roles.some((r) =>
      ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'GENERAL_MANAGER', 'OPERATIONS_MANAGER', 'SERVICE_ENGINEER', 'MAINTENANCE_SUPERVISOR', 'WAREHOUSE_OFFICER', 'FIELD_TECHNICIAN', 'TECHNICIAN'].includes(r)
    );
    return !hasAdminOrOps;
  }
  return false;
}

function formatRoleLabel(role) {
  const labels = {
    SERVICE_ENGINEER: 'Service Engineer',
    TECHNICIAN: 'Technician',
    FIELD_TECHNICIAN: 'Technician',
    MAINTENANCE_SUPERVISOR: 'Maintenance Supervisor',
    WAREHOUSE_OFFICER: 'Spare Parts Officer',
    MEDIA_SPECIALIST: 'Media Specialist',
  };

  return labels[role] || String(role || '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}


const COMMAND_ITEMS = [
  { id: 'nav-dashboard', title: 'Command Center', subtitle: 'Operations overview, attention queue & dispatch roster', href: '/management', category: 'Navigation', badge: 'Operations' },
  { id: 'nav-fleet-analytics', title: 'Fleet Intelligence', subtitle: 'Greasing compliance matrix, component lifecycles & wear benchmarks', href: '/management/fleet-analytics', category: 'Navigation', badge: 'Fleet' },
  { id: 'nav-scheduling', title: 'Dispatch & Scheduling', subtitle: 'Daily work orders, technician assignments & shop manuals', href: '/management/scheduling', category: 'Navigation', badge: 'Schedule' },
  { id: 'nav-daily-planner', title: 'Daily Planner', subtitle: 'Shift task sequencing and supervisor inbox', href: '/management/daily-planner', category: 'Navigation', badge: 'Planner' },
  { id: 'nav-workshop', title: 'Workshop Operations', subtitle: 'Service vehicles, fuel consumption & tools master', href: '/management/workshop', category: 'Navigation', badge: 'Workshop' },
  { id: 'nav-parts-inquiry', title: 'Spare Parts & PDX', subtitle: 'Komatsu PDX parts inquiry, Emergency Orders (EO) automation & quotes', href: '/management/parts-inquiry', category: 'Navigation', badge: 'Parts' },
  { id: 'nav-sheets-hub', title: 'Master Sheets Hub', subtitle: 'Raw 34-sheet operations database', href: '/management/sheets-hub', category: 'Navigation', badge: 'Database' },
  { id: 'nav-eqp', title: 'EQP Hub', subtitle: 'Equipment preventive maintenance command center', href: '/eqp', category: 'Navigation', badge: 'EQP' },
  { id: 'nav-eqp-gen', title: 'EQP Report Builder', subtitle: 'Generate certified Komatsu inspection PDFs', href: '/eqp/generate-reports', category: 'Navigation', badge: 'Reports' },
  { id: 'nav-eqp-reports', title: 'PDF Report Archive', subtitle: 'Search, download batch ZIP archives & manage PDFs', href: '/eqp/reports', category: 'Navigation', badge: 'Archive' },
  { id: 'nav-eqp-machines', title: 'Machine Register', subtitle: 'Fleet assets, SMR hour meters & counters', href: '/eqp/machines', category: 'Navigation', badge: 'Assets' },
  { id: 'nav-eqp-lifecycle', title: 'Lifecycle Matrix', subtitle: 'Delivery milestones & monthly gap verification', href: '/eqp/lifecycle', category: 'Navigation', badge: 'Compliance' },
  { id: 'nav-technicians', title: 'Technicians Management', subtitle: 'Staff records, shifts, regions & skills', href: '/management/technicians', category: 'Navigation', badge: 'Staff' },
  { id: 'nav-technician-app', title: 'Field Technician Mobile App', subtitle: 'Arabic mobile execution, checklists & evidence', href: '/technician', category: 'Navigation', badge: 'Field' },
  { id: 'nav-workspace', title: 'Engineering Canvas', subtitle: 'Miro-grade whiteboard & failure root-cause analysis', href: '/workspace', category: 'Labs', badge: 'Labs' },
  { id: 'nav-media', title: 'Media Corner', subtitle: 'Campaign scripts, monthly calendar, director studio & videographer sheets', href: '/media', category: 'Navigation', badge: 'Media' },
  { id: 'nav-japanese', title: 'Japanese Learning Hub', subtitle: 'JLPT N5/N4 flashcard dojo & technical terminology', href: '/japanese', category: 'Labs', badge: 'Labs' },

];

export default function SystemShell({
  title,
  eyebrow = 'Dar Al Hai Operations',
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
  const [labsOpen, setLabsOpen] = useState(false);

  // Command Palette
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState('');
  const [cmdIndex, setCmdIndex] = useState(0);
  const cmdInputRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setUser(getSessionUser());
      setSidebarCollapsed(localStorage.getItem('darAlHaiSidebarCollapsed') === 'true');
      setLabsOpen(localStorage.getItem('darAlHaiLabsOpen') === 'true');
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
  }, [pathname]);

  const roleLabel = useMemo(() => {
    if (userLabel) return userLabel;
    if (user?.roles?.length) return user.roles.map(formatRoleLabel).join(', ');
    if (user?.userNumber) return `User ${user.userNumber}`;
    return hasHydrated ? 'Operations Officer' : 'Loading session';
  }, [hasHydrated, user, userLabel]);

  const toggleSidebar = () => {
    const nextState = !sidebarCollapsed;
    setSidebarCollapsed(nextState);
    localStorage.setItem('darAlHaiSidebarCollapsed', String(nextState));
  };

  const toggleLabs = () => {
    const nextState = !labsOpen;
    setLabsOpen(nextState);
    localStorage.setItem('darAlHaiLabsOpen', String(nextState));
  };

  const isMediaOnly = useMemo(() => isMediaOnlyUser(user), [user]);

  // Route Guard: Protect other modules from media-only users
  useEffect(() => {
    if (!hasHydrated || !user) return;
    if (isMediaOnly && pathname && !pathname.startsWith('/media')) {
      router.replace('/media');
    }
  }, [hasHydrated, isMediaOnly, pathname, router, user]);

  // Restrict navigation sections for Media-Only users
  const visibleNavSections = useMemo(() => {
    if (isMediaOnly) {
      return [
        {
          title: 'Media & Creative',
          items: [
            { href: '/media', label: 'Media Corner', icon: 'media' },
          ],
        },
      ];
    }
    return navigationSections;
  }, [isMediaOnly]);

  // Filtered Command Items
  const filteredCmdItems = useMemo(() => {
    const baseItems = isMediaOnly
      ? COMMAND_ITEMS.filter((item) => item.href === '/media')
      : COMMAND_ITEMS;
    const q = cmdQuery.trim().toLowerCase();
    if (!q) return baseItems;
    return baseItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.badge.toLowerCase().includes(q)
    );
  }, [cmdQuery, isMediaOnly]);


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
        <div className="flex items-center gap-3 px-5 py-3.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 shadow-sm">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          Authenticating session...
        </div>
      </main>
    );
  }

  // Breadcrumbs computation
  const pathSegments = (pathname || '').split('/').filter(Boolean);
  const breadcrumbSection = isMediaOnly ? 'Media & Creative' : pathSegments[0] === 'management' ? 'Operations' : pathSegments[0] === 'eqp' ? 'Reporting' : 'Platform';

  return (
    <div className={`ds-shell ds-reference-shell ${sidebarCollapsed ? 'ds-sidebar-collapsed' : ''}`}>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`ds-app-sidebar ${mobileMenuOpen ? 'ds-sidebar-mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="ds-sidebar-header">
          <Link
            href={isMediaOnly ? '/media' : '/management'}
            className="ds-sidebar-brand"
            aria-label="Dar Al Hai Home"
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="ds-sidebar-brand-mark">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
            </span>
            <span className="ds-sidebar-brand-text">
              <span className="block text-sm font-semibold leading-none text-white tracking-tight">Dar Al Hai</span>
              <span className="mt-1 block text-[10px] font-medium uppercase tracking-wider text-slate-400">
                {isMediaOnly ? 'Media Studio' : 'Fleet Operations'}
              </span>
            </span>
          </Link>
          {mobileMenuOpen && (
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden rounded-md p-1 text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              aria-label="Close mobile menu"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Categorized Navigation */}
        <nav className="ds-sidebar-nav" aria-label="Primary navigation">
          {visibleNavSections.map((section) => {
            if (section.isLabs) {
              return (
                <div key={section.title} className="mt-4 pt-3 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={toggleLabs}
                    className="w-full flex items-center justify-between px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors select-none cursor-pointer"
                  >
                    <span>{section.title}</span>
                    <span className="text-slate-600 font-mono text-[9px]">{labsOpen ? '▲' : '▼'}</span>
                  </button>
                  {labsOpen && (
                    <div className="mt-1 space-y-0.5 animate-[ds-toast-in_100ms_ease]">
                      {section.items.map((item) => {
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
                            <span className="ds-nav-label truncate flex-1">{item.label}</span>
                            {item.badge && (
                              <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div key={section.title} className="mb-3">
                <p className="ds-sidebar-section-label">{section.title}</p>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
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
                        <span className="ds-nav-label truncate flex-1">{item.label}</span>
                        {item.badge && (
                          <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="ds-sidebar-footer">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
            <span className="text-[11px] font-medium text-slate-400">System Live</span>
          </div>
          {user && (
            <button
              type="button"
              onClick={logout}
              className="text-[11px] font-medium text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
              aria-label="Logout"
            >
              Sign out
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="ds-app-main">
        {/* Topbar */}
        <header className="ds-app-topbar">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="lg:hidden ds-icon-button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Breadcrumbs */}
            <nav aria-label="Breadcrumb navigation" className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-normal">
              <Link href={isMediaOnly ? '/media' : '/management'} className="hover:text-slate-800 transition-colors">Dar Al Hai</Link>
              <span className="text-slate-300 select-none">/</span>
              <span className="text-slate-500">{breadcrumbSection}</span>
              <span className="text-slate-300 select-none">/</span>
              <span className="text-slate-900 font-medium truncate max-w-[220px]">{title}</span>
            </nav>
          </div>


          <div className="flex items-center gap-2.5">
            {/* Quick Command Trigger */}
            <button
              type="button"
              className="ds-cmd-trigger-btn"
              onClick={() => setCmdOpen(true)}
              title="Search and jump anywhere (Ctrl+K)"
            >
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="hidden sm:inline">Search modules</span>
              <kbd className="ds-cmd-trigger-kbd">⌘K</kbd>
            </button>

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
                      <p className="text-xs font-semibold text-slate-900">Notifications</p>
                      <p className="text-[11px] text-slate-500">{unreadCount} unread alerts</p>
                    </div>
                    {unreadCount > 0 && (
                      <button type="button" onClick={handleMarkAllRead} className="text-[11px] font-medium text-amber-600 hover:text-amber-700 cursor-pointer">
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="ds-notification-list">
                    {notifications.length === 0 ? (
                      <div className="p-5 text-center text-xs text-slate-500">No new notifications.</div>
                    ) : (
                      notifications.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          className={`ds-notification-item ${notification.readAt ? '' : 'ds-notification-item-unread'}`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <span className={`ds-notification-dot ${notification.readAt ? '!bg-slate-300' : '!bg-amber-500'}`} />
                          <span className="min-w-0">
                            <span className="block truncate text-xs font-semibold text-slate-900">{notification.title}</span>
                            <span className="mt-0.5 block line-clamp-2 text-[11px] text-slate-500">{notification.message}</span>
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Info */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="ds-avatar" aria-hidden="true">
                {(hasHydrated ? (user?.fullName || user?.email || 'D') : 'D').slice(0, 1).toUpperCase()}
              </div>
              <div className="hidden md:block text-left leading-tight">
                <span className="block text-xs font-semibold text-slate-900 truncate max-w-[130px]">
                  {hasHydrated ? (user?.fullName || user?.email || 'Engineer') : 'User'}
                </span>
                <span className="block text-[10px] text-slate-500 truncate max-w-[130px]">
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className={`ds-reference-content ${contentClassName}`}>
          <div className="space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* Global Command Palette (Ctrl+K / Cmd+K) */}
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
                placeholder="Search modules, work orders, assets..."
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
                  No matching modules found for &ldquo;{cmdQuery}&rdquo;
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
                        <svg className="h-3.5 w-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
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
              <span>Dar Al Hai Operations</span>
              <div className="cmd-palette-footer-keys">
                <span><kbd className="ds-cmd-trigger-kbd">↑</kbd> <kbd className="ds-cmd-trigger-kbd">↓</kbd> navigate</span>
                <span><kbd className="ds-cmd-trigger-kbd">↵</kbd> select</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
