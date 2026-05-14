'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Card from '../../../../components/ui/Card';
import { setStoredPlatformSession, setStoredUser } from '../../../../lib/auth';
import { completeMicrosoftLogin } from '../../../../lib/api';

export default function MicrosoftCallbackPage() {
  return (
    <Suspense>
      <MicrosoftCallbackContent />
    </Suspense>
  );
}

function MicrosoftCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const microsoftError = searchParams.get('error');
  const initialError = microsoftError || (!code ? 'Microsoft sign-in did not return a valid login code.' : '');
  const [message, setMessage] = useState('Completing Microsoft sign-in...');
  const [error, setError] = useState(initialError);

  useEffect(() => {
    if (microsoftError || !code) {
      return;
    }

    let isMounted = true;

    async function completeLogin() {
      try {
        const result = await completeMicrosoftLogin(code);

        if (!isMounted) return;

        setStoredPlatformSession(result.token, result.user);

        if (result.user?.sessionToken) {
          setStoredUser(result.user);
        }

        setMessage('Signed in successfully. Redirecting...');
        router.replace(result.redirectTo || '/management');
      } catch (loginError) {
        if (!isMounted) return;
        setError(loginError.message || 'Microsoft sign-in failed.');
      }
    }

    completeLogin();

    return () => {
      isMounted = false;
    };
  }, [code, microsoftError, router]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#edf1ea] px-5 text-zinc-950">
      <Card className="w-full max-w-md p-7 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-md bg-yellow-400 text-xl font-black text-zinc-950">
          DH
        </div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Dar Al HAI</p>
        <h1 className="mt-2 text-2xl font-black text-zinc-950">Microsoft Sign-In</h1>
        <p className={`mt-5 rounded-md px-4 py-3 text-sm font-semibold ${error ? 'border border-red-200 bg-red-50 text-red-700' : 'border border-zinc-200 bg-zinc-50 text-zinc-700'}`}>
          {error || message}
        </p>
      </Card>
    </main>
  );
}
