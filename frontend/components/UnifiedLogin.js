'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from './ui/Button';
import { setStoredPlatformSession, setStoredUser } from '../lib/auth';
import { unifiedLogin } from '../lib/api';

export default function UnifiedLogin({ preferredModule = 'auto' }) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isEmail = identifier.includes('@');

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
        preferredModule,
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
      <section className="grid min-h-screen place-items-center px-5 py-8">
        <form onSubmit={handleSubmit} className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-7 shadow-xl shadow-zinc-900/8">
          <div className="text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-md bg-yellow-400 text-xl font-black text-zinc-950">
              DH
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Dar Al HAI</p>
            <h1 className="mt-2 text-3xl font-black text-zinc-950">تسجيل الدخول</h1>
          </div>

          <div className="mt-7 grid gap-4">
            <label className="grid gap-2 text-sm font-semibold text-zinc-700">
              الإيميل أو كود الفني
              <input
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="email@daralhai.com / 1001"
                className="h-12 rounded-md border border-zinc-300 bg-white px-4 text-zinc-950 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                autoComplete="username"
              />
            </label>

            {isEmail && (
              <label className="grid gap-2 text-sm font-semibold text-zinc-700">
                كلمة المرور
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
            {loading ? 'جاري الدخول...' : 'دخول'}
          </Button>
        </form>
      </section>
    </main>
  );
}
