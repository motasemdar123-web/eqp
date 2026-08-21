'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
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
    <main className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-4xl overflow-hidden shadow-2xl border-slate-800 bg-white">
        <div className="grid min-h-[32rem] lg:grid-cols-[1.1fr_0.9fr]">
          {/* Left Brand Panel */}
          <div className="flex flex-col justify-between bg-slate-950 p-8 sm:p-10 text-white relative overflow-hidden">
            {/* Background Accent Glow */}
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 font-extrabold text-slate-950 shadow-lg shadow-amber-500/20 text-base">
                DH
              </div>

              <div className="mt-8">
                <span className="inline-block text-xs font-bold uppercase tracking-widest text-amber-400">
                  Dar Al Hai Machinery
                </span>
                <h1 className="mt-2 text-3xl font-extrabold leading-tight text-white sm:text-4xl">
                  Service & Fleet Operations
                </h1>
                <p className="mt-3 text-sm text-slate-400 leading-relaxed max-w-md">
                  Unified enterprise portal for field dispatch, technical scheduling, machinery maintenance registers, and certified EQP reporting.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-slate-900/80 p-3 border border-slate-800">
                <span className="block text-xs font-bold text-amber-400 uppercase tracking-wider">Field</span>
                <span className="text-[0.6875rem] text-slate-400">Technicians</span>
              </div>
              <div className="rounded-lg bg-slate-900/80 p-3 border border-slate-800">
                <span className="block text-xs font-bold text-amber-400 uppercase tracking-wider">Fleet</span>
                <span className="text-[0.6875rem] text-slate-400">Equipment</span>
              </div>
              <div className="rounded-lg bg-slate-900/80 p-3 border border-slate-800">
                <span className="block text-xs font-bold text-amber-400 uppercase tracking-wider">EQP</span>
                <span className="text-[0.6875rem] text-slate-400">PDF Reports</span>
              </div>
            </div>
          </div>

          {/* Right Sign-in Form */}
          <div className="flex items-center p-8 sm:p-12 bg-white">
            <div className="w-full space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Enterprise Access</span>
                <h2 className="mt-1 text-2xl font-bold text-slate-900">Welcome back</h2>
                <p className="mt-1 text-xs text-slate-500">Sign in with your organization Microsoft account.</p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={startMicrosoftLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-5 py-3.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-4 focus:ring-amber-500/20 disabled:opacity-60"
                >
                  <svg className="h-5 w-5 shrink-0" viewBox="0 0 21 21">
                    <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                    <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                    <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                  </svg>
                  <span>{loading ? 'Redirecting to Microsoft...' : 'Sign in with Microsoft SSO'}</span>
                </button>
              </div>

              <div className="pt-4 border-t border-slate-100 text-center">
                <p className="text-[0.6875rem] text-slate-400">
                  Protected by Microsoft Entra SSO and Role-Based Access Control (RBAC).
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </main>
  );
}
