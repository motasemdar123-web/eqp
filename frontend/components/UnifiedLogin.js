'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Card from './ui/Card';
import { directLogin, getMicrosoftLoginUrl } from '../lib/api';
import { setStoredPlatformSession, setStoredUser } from '../lib/auth';

export default function UnifiedLogin({ preferredModule = 'auto' }) {
  const [authMode, setAuthMode] = useState('direct'); // 'direct' | 'microsoft'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  function startMicrosoftLogin() {
    setLoading(true);
    setError('');
    const returnTo = searchParams.get('returnTo') || (preferredModule === 'eqp' ? '/eqp' : undefined);
    window.location.href = getMicrosoftLoginUrl(returnTo);
  }

  async function handleDirectLogin(e) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const returnTo = searchParams.get('returnTo') || (preferredModule === 'eqp' ? '/eqp' : undefined);
      const result = await directLogin({
        email: email.trim(),
        password: password.trim(),
        preferredModule,
      });

      setStoredPlatformSession(result.token, result.user);
      if (result.user?.sessionToken) {
        setStoredUser(result.user);
      }

      router.replace(returnTo || result.redirectTo || '/management');
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-4xl overflow-hidden shadow-2xl border-slate-800 bg-white">
        <div className="grid min-h-[34rem] lg:grid-cols-[1.1fr_0.9fr]">
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
                  Unified enterprise portal for field dispatch, spare parts inquiry, technical scheduling, machinery registers, and certified EQP reporting.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-slate-900/80 p-3 border border-slate-800">
                <span className="block text-xs font-bold text-amber-400 uppercase tracking-wider">Parts</span>
                <span className="text-[0.6875rem] text-slate-400">Inquiry & EO</span>
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
            <div className="w-full space-y-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Enterprise Access</span>
                <h2 className="mt-1 text-2xl font-bold text-slate-900">Sign in to Dar Al Hai</h2>
                <p className="mt-1 text-xs text-slate-500">Choose your preferred sign-in method below.</p>
              </div>

              {/* Auth Mode Toggle */}
              <div className="flex rounded-lg bg-slate-100 p-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => { setAuthMode('direct'); setError(''); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-md transition ${
                    authMode === 'direct'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Direct Sign-in
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('microsoft'); setError(''); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-md transition ${
                    authMode === 'microsoft'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Microsoft SSO
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-lg bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200">
                  {error}
                </div>
              )}

              {/* Direct Credentials Login */}
              {authMode === 'direct' && (
                <form onSubmit={handleDirectLogin} className="space-y-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Organization Email</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. mohammad.qraein@daralhai.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                    <input
                      type="password"
                      required
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-5 py-3 text-sm font-bold text-slate-950 shadow-sm hover:bg-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-500/20 disabled:opacity-60 transition"
                  >
                    {loading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                        <span>Authenticating...</span>
                      </>
                    ) : (
                      <span>Sign In</span>
                    )}
                  </button>
                </form>
              )}

              {/* Microsoft SSO Login */}
              {authMode === 'microsoft' && (
                <div className="pt-2 space-y-4">
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
                  <p className="text-[0.6875rem] text-slate-400 text-center">
                    Requires your Dar Al Hai Microsoft Entra account.
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 text-center">
                <p className="text-[0.6875rem] text-slate-400">
                  Protected by Role-Based Access Control (RBAC).
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </main>
  );
}
