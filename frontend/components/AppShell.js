import Button from './ui/Button';

export default function AppShell({ activePage, onNavigate, onLogout, userCode, children }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', shortLabel: 'Dash' },
    { id: 'machine-history', label: 'Machine History', shortLabel: 'History' },
    { id: 'reports', label: 'Reports', shortLabel: 'Reports' },
  ];

  return (
    <div className="min-h-screen bg-[#edf1ea] text-zinc-900 lg:flex">
      <aside className="border-b border-zinc-200 bg-zinc-950 text-white lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:border-b-0 lg:border-r lg:border-zinc-900">
        <div className="border-b border-white/10 p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-md bg-yellow-400 text-xl font-black text-zinc-950">
              DH
            </div>
            <div>
              <div className="text-xl font-black text-white">Dar Al HAI</div>
              <p className="text-xs text-zinc-400">EQP Reporting Module</p>
            </div>
          </div>
        </div>

        <nav className="flex gap-2 overflow-x-auto p-3 lg:grid lg:overflow-visible lg:p-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`min-w-max rounded-md px-4 py-3 text-left text-sm font-semibold transition lg:min-w-0 ${
                activePage === item.id
                  ? 'bg-yellow-400 text-zinc-950'
                  : 'text-zinc-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="hidden lg:inline">{item.label}</span>
              <span className="lg:hidden">{item.shortLabel}</span>
            </button>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="border-b border-zinc-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Equipment Preventive Maintenance</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">EQP Reporting Workspace</h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-2.5 font-mono text-sm text-zinc-700">
                User: {userCode}
              </div>
              <Button variant="ghost" onClick={onLogout}>Logout</Button>
            </div>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
