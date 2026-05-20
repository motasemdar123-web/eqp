'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Button from './ui/Button';
import Card from './ui/Card';
import { getMicrosoftLoginUrl } from '../lib/api';

export default function UnifiedLogin({ preferredModule = 'auto' }) {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  function startMicrosoftLogin() {
    setLoading(true);
    const returnTo = searchParams.get('returnTo') || (preferredModule === 'eqp' ? '/eqp' : undefined);
    window.location.href = getMicrosoftLoginUrl(returnTo);
  }

  return (
    <main className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-ink)]">
      <section className="grid min-h-screen place-items-center px-5 py-8">
        <Card className="w-full max-w-5xl overflow-hidden">
          <div className="grid min-h-[34rem] lg:grid-cols-[1.05fr_0.95fr]">
            <div className="ds-blue-header flex flex-col justify-between p-8">
              <div>
                <div className="ds-brand-mark h-14 w-14 text-xl">DH</div>
                <p className="mt-8 text-xs font-black uppercase tracking-[0.18em] text-[var(--color-sidebar-muted)]">Dar Al Hai</p>
                <h1 className="mt-3 max-w-xl text-4xl font-black leading-tight text-white">Maintenance command center</h1>
                <p className="mt-4 max-w-lg text-sm font-semibold leading-6 text-white/75">
                  Unified access for operations, technician work, scheduling, machine tracking, and EQP reporting.
                </p>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-3 text-center text-white">
                {['RBAC', 'Audit', 'Reports'].map((item) => (
                  <div key={item} className="rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-xs font-black uppercase tracking-[0.12em]">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center p-8">
              <div className="w-full">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--color-accent-hover)]">Secure Sign In</p>
                <h2 className="mt-3 text-3xl font-black text-[var(--color-ink)]">Welcome back</h2>
                <p className="mt-3 text-sm font-semibold leading-6 text-[var(--color-muted)]">
                  Continue with your Microsoft account to enter the Dar Al Hai Maintenance System.
                </p>
                <Button type="button" onClick={startMicrosoftLogin} disabled={loading} fullWidth className="mt-8 py-4 text-base">
                  {loading ? 'Redirecting...' : 'Continue with Microsoft'}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}
