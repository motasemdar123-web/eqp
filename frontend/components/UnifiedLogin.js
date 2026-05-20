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
        <Card className="w-full max-w-md p-7">
          <div className="text-center">
            <div className="ds-brand-mark mx-auto h-14 w-14 text-xl">
              DH
            </div>
            <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-[var(--color-accent)]">Dar Al HAI</p>
            <h1 className="mt-2 text-3xl font-black text-[var(--color-ink)]">Sign In</h1>
            <p className="mt-2 text-sm font-semibold text-[var(--color-muted)]">Unified access for operations, technician work, and EQP reporting.</p>
          </div>

          <Button type="button" onClick={startMicrosoftLogin} disabled={loading} className="mt-7 w-full py-4 text-base">
            {loading ? 'Redirecting...' : 'Continue with Microsoft'}
          </Button>
        </Card>
      </section>
    </main>
  );
}
