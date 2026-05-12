'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function VerifyPage() {

    const router = useRouter();

    const [userCode, setUserCode] =
        useState('');

    async function handleVerify() {

    try {

        const response =
            await fetch(
                'https://eqp.onrender.com/verify-user',
                {

                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body: JSON.stringify({

                        userNumber:
                            Number(userCode)

                    })

                }
            );

        const data =
            await response.json();

        if (!data.success) {

            alert(
                'Invalid technician code'
            );

            return;
        }

        localStorage.setItem(
            'user',
            JSON.stringify(
                data.user
            )
        );

        router.push('/dashboard');

    } catch (error) {

        console.error(error);

        alert(
            'Verification failed'
        );
    }
}

    return (

        <div className="flex min-h-screen items-center justify-center bg-black text-white">

            <div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-950 p-12 shadow-2xl">

                <div className="mb-10 text-center">

                    <h1 className="text-4xl font-black">

                        Technician Verification

                    </h1>

                    <p className="mt-4 text-zinc-400">

                        Enter your assigned technician code

                    </p>

                </div>

                <div className="space-y-6">

                    <input
                        type="number"
                        placeholder="1001"
                        value={userCode}
                        onChange={(e) =>
                            setUserCode(
                                e.target.value
                            )
                        }
                        className="w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-6 py-5 text-center text-3xl font-bold outline-none transition focus:border-yellow-500"
                    />

                    <button
                        onClick={handleVerify}
                        className="w-full rounded-2xl bg-yellow-500 px-6 py-5 text-xl font-bold text-black transition hover:bg-yellow-400"
                    >

                        Continue

                    </button>

                </div>

            </div>

        </div>

    );
}