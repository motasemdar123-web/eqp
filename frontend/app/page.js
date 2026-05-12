'use client';

import { useRouter } from 'next/navigation';

export default function LoginPage() {

    const router = useRouter();

    function handleLogin() {

        router.push('/verify');
    }

    return (

        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black text-white">

            {/* Background */}

            <div className="absolute inset-0">

                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-black to-black" />

                <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-yellow-500/10 blur-3xl" />

                <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-yellow-400/10 blur-3xl" />

            </div>

            {/* Content */}

            <div className="relative z-10 w-full max-w-xl rounded-3xl border border-zinc-800 bg-zinc-950/90 p-12 shadow-2xl backdrop-blur">

                <div className="mb-10 text-center">

                    <div className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-3xl bg-yellow-500 text-4xl font-black text-black">

                        K

                    </div>

                    <h1 className="text-5xl font-black tracking-tight">

                        KOMATSU

                    </h1>

                    <p className="mt-4 text-lg text-zinc-400">

                        Equipment Fleet Reporting System

                    </p>

                </div>

                <button
                    onClick={handleLogin}
                    className="w-full rounded-2xl bg-yellow-500 px-6 py-5 text-xl font-bold text-black transition hover:bg-yellow-400"
                >

                    Continue with Outlook

                </button>

                <p className="mt-8 text-center text-sm text-zinc-500">

                    Authorized company accounts only

                </p>

            </div>

        </div>

    );
}