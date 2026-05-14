import Link from 'next/link';
import Card from '../../components/ui/Card';

export default function EqpModulePage() {
  return (
    <main className="min-h-screen bg-[#f4f6f3] px-6 py-8 text-zinc-900">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Dar Al HAI Module</p>
        <h1 className="mt-2 text-3xl font-black text-zinc-950">Equipment Preventive Maintenance Reports</h1>
        <p className="mt-2 text-sm text-zinc-600">Existing EQP Excel generation, report history, machine history, and Supabase storage are preserved here.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <ModuleLink href="/eqp/generate-reports" title="Generate Reports" />
          <ModuleLink href="/eqp/reports" title="Reports Archive" />
          <ModuleLink href="/eqp/machines" title="Machines" />
        </div>
      </div>
    </main>
  );
}

function ModuleLink({ href, title }) {
  return (
    <Card className="p-5">
      <h2 className="text-xl font-bold text-zinc-950">{title}</h2>
      <Link href={href} className="mt-5 inline-flex rounded-md bg-yellow-400 px-4 py-2 text-sm font-semibold text-zinc-950">
        Open
      </Link>
    </Card>
  );
}
