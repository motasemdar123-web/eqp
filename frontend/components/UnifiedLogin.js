'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from './ui/Button';
import Badge from './ui/Badge';
import { setStoredPlatformSession, setStoredUser } from '../lib/auth';
import { unifiedLogin } from '../lib/api';

const moduleCopy = {
  auto: {
    eyebrow: 'Unified Access',
    title: 'Dar Al HAI Maintenance Platform',
    subtitle: 'One secure entry point for management, technicians, scheduling, and EQP reporting.',
    helper: 'Use your work email or technician code. The system will open the right workspace.',
  },
  eqp: {
    eyebrow: 'EQP Access',
    title: 'Equipment Reports Login',
    subtitle: 'Enter your technician code to open the preserved EQP report generation module.',
    helper: 'Your code signs you into the EQP reporting workspace.',
  },
  technician: {
    eyebrow: 'بوابة الفني',
    title: 'تسجيل دخول الفني',
    subtitle: 'اكتب رقمك الوظيفي وسيتم فتح واجهة المهام المناسبة لك.',
    helper: 'واجهة عربية مبسطة للمهام اليومية والجوب كارد.',
  },
};

function resolveModule(searchParams, preferredModule) {
  const fromQuery = searchParams?.get('module');
  if (['eqp', 'technician', 'auto'].includes(fromQuery)) return fromQuery;
  return preferredModule || 'auto';
}

export default function UnifiedLogin({ preferredModule = 'auto' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeModule = resolveModule(searchParams, preferredModule);
  const copy = moduleCopy[activeModule] || moduleCopy.auto;
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isEmail = identifier.includes('@');

  const quickModes = useMemo(() => ([
    { id: 'auto', label: 'Auto Route', href: '/?module=auto' },
    { id: 'technician', label: 'Technician', href: '/?module=technician' },
    { id: 'eqp', label: 'EQP', href: '/?module=eqp' },
  ]), []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!identifier.trim()) {
      setError('Enter your work email or technician code.');
      return;
    }

    if (isEmail && !password) {
      setError('Enter your password.');
      return;
    }

    try {
      setLoading(true);
      const result = await unifiedLogin({
        identifier: identifier.trim(),
        password,
        preferredModule: activeModule,
      });

      if (result.authType === 'PLATFORM') {
        setStoredPlatformSession(result.token, result.user);
      }

      if (result.user?.sessionToken) {
        setStoredUser(result.user);
      }

      router.push(result.redirectTo || '/management');
    } catch (loginError) {
      setError(loginError.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#edf1ea] text-zinc-950">
      <section className="mx-auto grid min-h-screen max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8">
        <div className="relative min-h-[520px] overflow-hidden rounded-lg bg-zinc-950 p-8 text-white shadow-2xl shadow-zinc-950/20 lg:p-10">
          <div className="absolute inset-x-0 top-0 h-1 bg-yellow-400" />
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-md bg-yellow-400 text-xl font-black text-zinc-950">
                  DH
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">Dar Al HAI</p>
                  <p className="text-lg font-black">Maintenance Management</p>
                </div>
              </div>

              <div className="mt-14 max-w-2xl">
                <Badge tone="yellow">{copy.eyebrow}</Badge>
                <h1 className="mt-5 text-4xl font-black tracking-tight text-white md:text-6xl">
                  {copy.title}
                </h1>
                <p className="mt-5 max-w-xl text-lg leading-8 text-zinc-300">
                  {copy.subtitle}
                </p>
              </div>
            </div>

            <div className="mt-12 grid gap-3 md:grid-cols-3">
              {[
                ['Scheduling', '9 technicians, shifts, and job cards'],
                ['EQP', 'Excel reports and machine history'],
                ['Governance', 'RBAC, audit, SLA, and safety notes'],
              ].map(([title, text]) => (
                <div key={title} className="rounded-md border border-white/10 bg-white/[0.04] p-4">
                  <p className="font-bold text-white">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-lg border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-900/8 md:p-8">
          <div className="flex flex-wrap gap-2">
            {quickModes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => router.push(mode.href)}
                className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
                  activeModule === mode.id
                    ? 'border-zinc-950 bg-zinc-950 text-white'
                    : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          <div className={activeModule === 'technician' ? 'mt-8 text-right' : 'mt-8'} dir={activeModule === 'technician' ? 'rtl' : 'ltr'}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              {activeModule === 'technician' ? 'دخول موحد' : 'Secure Login'}
            </p>
            <h2 className="mt-2 text-3xl font-black text-zinc-950">
              {activeModule === 'technician' ? 'أدخل بياناتك' : 'Sign in to continue'}
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-500">{copy.helper}</p>
          </div>

          <div className="mt-7 grid gap-4">
            <label className="grid gap-2 text-sm font-semibold text-zinc-700">
              Email or technician code
              <input
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="admin@daralhai.com or 1001"
                className="h-12 rounded-md border border-zinc-300 bg-white px-4 text-zinc-950 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                autoComplete="username"
              />
            </label>

            {isEmail && (
              <label className="grid gap-2 text-sm font-semibold text-zinc-700">
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-12 rounded-md border border-zinc-300 bg-white px-4 text-zinc-950 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                  autoComplete="current-password"
                />
              </label>
            )}
          </div>

          {error && (
            <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="mt-6 w-full py-4 text-base">
            {loading ? 'Signing in...' : 'Continue'}
          </Button>

          <div className="mt-6 rounded-md bg-zinc-50 p-4 text-sm leading-6 text-zinc-600">
            Management users sign in with company email. Field technicians can use their assigned code.
          </div>
        </form>
      </section>
    </main>
  );
}
