'use client';

import Link from 'next/link';
import Button from '../../../components/ui/Button';

export default function TechnicianLoginPage() {
  return (
    <main dir="rtl" className="grid min-h-screen place-items-center bg-[#f4f6f3] px-4 text-zinc-900">
      <section className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-8 shadow-xl shadow-zinc-900/5">
        <h1 className="text-3xl font-black text-zinc-950">دخول الفني</h1>
        <p className="mt-3 text-sm text-zinc-500">واجهة عربية لإدارة المهام الميدانية.</p>
        <input className="mt-6 w-full rounded-md border border-zinc-300 px-4 py-3 text-right" placeholder="رقم الموظف" />
        <input className="mt-3 w-full rounded-md border border-zinc-300 px-4 py-3 text-right" placeholder="كلمة المرور" type="password" />
        <Link href="/technician/tasks">
          <Button className="mt-6 w-full">دخول</Button>
        </Link>
      </section>
    </main>
  );
}
