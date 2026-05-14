import Link from 'next/link';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

const modules = [
  { href: '/eqp/generate-reports', title: 'Generate Reports', description: 'Create preventive maintenance Excel files using the preserved templates and numbering flow.' },
  { href: '/eqp/reports', title: 'Reports Archive', description: 'Search, download, rename, and delete generated reports from Supabase storage.' },
  { href: '/eqp/machines', title: 'Machines', description: 'Review machine counters, SMR state, type, engine number, and report readiness.' },
];

export default function EqpModulePage() {
  return (
    <main className="min-h-screen bg-[#edf1ea] px-6 py-8 text-zinc-900">
      <div className="mx-auto grid max-w-6xl gap-6">
        <header className="rounded-lg bg-zinc-950 p-7 text-white shadow-xl shadow-zinc-950/10">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <Badge tone="yellow">Dar Al HAI Module</Badge>
              <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">Equipment Preventive Maintenance Reports</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300">
                Existing EQP Excel generation, report history, machine history, and Supabase storage are preserved as a dedicated module.
              </p>
            </div>
            <Link href="/management" className="rounded-md border border-white/15 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10">
              Command Center
            </Link>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          {modules.map((module) => (
            <Card key={module.title} className="p-5 transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md">
              <h2 className="text-xl font-bold text-zinc-950">{module.title}</h2>
              <p className="mt-3 min-h-20 text-sm leading-6 text-zinc-600">{module.description}</p>
              <Link href={module.href} className="mt-5 inline-flex rounded-md bg-yellow-400 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-yellow-300">
                Open
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
