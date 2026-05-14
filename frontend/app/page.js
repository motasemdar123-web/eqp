'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '../components/ui/Button';

export default function LoginPage() {
  const router = useRouter();

  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f6f3] px-4 py-10 text-zinc-900">
      <section className="w-full max-w-3xl rounded-lg border border-zinc-200 bg-white p-8 shadow-xl shadow-zinc-900/5">
        <div className="text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-lg bg-yellow-400 text-3xl font-black text-zinc-950 shadow-sm">
            K
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Dar Al HAI</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-zinc-950">Maintenance Management System</h1>
          <p className="mt-3 text-zinc-500">Operations platform with EQP preventive maintenance reporting as a dedicated module.</p>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-3">
          <Link href="/management" className="rounded-lg border border-zinc-200 p-5 transition hover:bg-zinc-50">
            <h2 className="font-bold text-zinc-950">Management</h2>
            <p className="mt-2 text-sm text-zinc-500">English-first admin dashboard.</p>
          </Link>
          <Link href="/technician/login" className="rounded-lg border border-zinc-200 p-5 text-right transition hover:bg-zinc-50" dir="rtl">
            <h2 className="font-bold text-zinc-950">واجهة الفني</h2>
            <p className="mt-2 text-sm text-zinc-500">مهام ميدانية باللغة العربية.</p>
          </Link>
          <button onClick={() => router.push('/verify')} className="rounded-lg border border-zinc-200 p-5 text-left transition hover:bg-zinc-50">
            <h2 className="font-bold text-zinc-950">EQP Module</h2>
            <p className="mt-2 text-sm text-zinc-500">Existing technician verification and Excel reports.</p>
          </button>
        </div>

        <Button onClick={() => router.push('/verify')} className="mt-8 w-full py-4 text-lg">
          Continue to EQP Verification
        </Button>
      </section>
    </main>
  );
}
