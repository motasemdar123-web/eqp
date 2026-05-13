'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setStoredUser } from '../../lib/auth';
import { verifyUser } from '../../lib/api';
import Button from '../../components/ui/Button';

export default function VerifyPage() {
  const router = useRouter();
  const [userCode, setUserCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleVerify(event) {
    event.preventDefault();
    setError('');

    if (!userCode) {
      setError('Enter your technician code');
      return;
    }

    try {
      setLoading(true);
      const data = await verifyUser(userCode);

      setStoredUser(data.user);
      router.push('/dashboard');
    } catch (verifyError) {
      setError(verifyError.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f6f3] px-4 text-zinc-900">
      <form onSubmit={handleVerify} className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-8 shadow-xl shadow-zinc-900/5">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black text-zinc-950">Technician Verification</h1>
          <p className="mt-3 text-sm text-zinc-500">Enter your assigned technician code</p>
        </div>

        <input
          type="number"
          placeholder="1001"
          value={userCode}
          onChange={(event) => setUserCode(event.target.value)}
          className="w-full rounded-md border border-zinc-300 bg-white px-5 py-4 text-center text-3xl font-bold text-zinc-950 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
        />

        {error && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        <Button type="submit" disabled={loading} className="mt-6 w-full py-4 text-lg">
          {loading ? 'Checking...' : 'Continue'}
        </Button>
      </form>
    </main>
  );
}
