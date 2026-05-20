'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SystemShell from '../SystemShell';

const workspaceNav = [
  { href: '/workspace', label: 'Home', code: 'HM' },
  { href: '/workspace/planner', label: 'My Day', code: 'DY' },
  { href: '/workspace/notes', label: 'Notes', code: 'NT' },
  { href: '/workspace/tasks', label: 'Tasks', code: 'TS' },
  { href: '/workspace/knowledge', label: 'Knowledge Base', code: 'KB' },
  { href: '/workspace/templates', label: 'Templates', code: 'TP' },
  { href: '/workspace/archived', label: 'Archived', code: 'AR' },
];

function isActive(pathname, href) {
  if (href === '/workspace') return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function WorkspaceShell({ title, description, actions, children }) {
  const pathname = usePathname();

  return (
    <SystemShell
      activePath="/workspace"
      eyebrow="Engineering Workspace"
      title={title}
      description={description}
      actions={actions}
      contentClassName="workspace-content-frame"
    >
      <div className="workspace-layout">
        <aside className="workspace-sidebar">
          <div>
            <p className="workspace-sidebar-label">Workspace</p>
            <nav className="workspace-nav" aria-label="Engineering workspace navigation">
              {workspaceNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`workspace-nav-link ${isActive(pathname, item.href) ? 'workspace-nav-link-active' : ''}`}
                >
                  <span>{item.code}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="workspace-sidebar-note">
            <p>Shared engineering memory</p>
            <span>Ideas, plans, checklists, and lessons learned stay connected to maintenance work.</span>
          </div>
        </aside>
        <section className="workspace-main">
          {children}
        </section>
      </div>
    </SystemShell>
  );
}
