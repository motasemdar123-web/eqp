import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '').trim();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required.' }, { status: 400 });
    }

    // The backend is the only authority on credentials; never mint a session here.
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://eqp-1.onrender.com';
    let response;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      response = await fetch(`${backendUrl}/api/auth/unified-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Sign-in service is unavailable. Please try again in a moment.' },
        { status: 503 }
      );
    }

    const data = await response.json().catch(() => ({}));
    if (response.ok && data && (data.success || data.token)) {
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { success: false, error: data?.error || data?.message || 'Invalid email or password.' },
      { status: response.ok ? 401 : response.status }
    );
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message || 'Authentication error' }, { status: 500 });
  }
}
