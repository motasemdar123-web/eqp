'use client';

import { useRouter } from 'next/navigation';
import Button from '../components/ui/Button';

export default function LoginPage() {
  const router = useRouter();

  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f6f3] px-4 text-zinc-900">
      <section className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-8 shadow-xl shadow-zinc-900/5">
        <div className="text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-lg bg-yellow-400 text-3xl font-black text-zinc-950 shadow-sm">
            K
          </div>
          <h1 className="mt-6 text-4xl font-black tracking-tight text-zinc-950">KOMATSU</h1>
          <p className="mt-3 text-zinc-500">Equipment Fleet Reporting System</p>
        </div>

        <Button onClick={() => router.push('/verify')} className="mt-8 w-full py-4 text-lg">
          Continue with Outlook
        </Button>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Authorized company accounts only
        </p>
      </section>
    </main>
  );
}
