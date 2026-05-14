'use client';

import { useState } from 'react';
import Button from './ui/Button';
import { getMicrosoftLoginUrl } from '../lib/api';

export default function UnifiedLogin({ preferredModule = 'auto' }) {
  const [loading, setLoading] = useState(false);

  function startMicrosoftLogin() {
    setLoading(true);
    const returnTo = preferredModule === 'eqp' ? '/eqp' : '/management';
    window.location.href = getMicrosoftLoginUrl(returnTo);
  }

  return (
    <main className="min-h-screen bg-[#edf1ea] text-zinc-950">
      <section className="grid min-h-screen place-items-center px-5 py-8">
        <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-7 shadow-xl shadow-zinc-900/8">
          <div className="text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-md bg-yellow-400 text-xl font-black text-zinc-950">
              DH
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Dar Al HAI</p>
            <h1 className="mt-2 text-3xl font-black text-zinc-950">Sign In</h1>
          </div>

          <Button type="button" onClick={startMicrosoftLogin} disabled={loading} className="mt-7 w-full py-4 text-base">
            {loading ? 'Redirecting...' : 'Continue with Microsoft'}
          </Button>
        </div>
      </section>
    </main>
  );
}
