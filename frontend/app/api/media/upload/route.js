import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://eqp-1.onrender.com';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const formData = await request.formData();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout for uploads

    const backendRes = await fetch(`${BACKEND_URL}/api/media/upload`, {
      method: 'POST',
      headers: {
        ...(request.headers.get('authorization') ? { Authorization: request.headers.get('authorization') } : {}),
      },
      body: formData,
      signal: controller.signal,
    }).catch((err) => {
      throw new Error(`Cannot reach backend upload service: ${err.message}`);
    });

    clearTimeout(timeoutId);

    if (backendRes && backendRes.ok) {
      const data = await backendRes.json().catch(() => null);
      if (data && data.success) {
        return NextResponse.json(data);
      }
    }

    const errData = await backendRes.json().catch(() => ({ error: 'Upload failed on backend' }));
    return NextResponse.json(
      { success: false, error: errData.error || 'Upload failed on backend server' },
      { status: backendRes?.status || 500 }
    );
  } catch (err) {
    console.error('[Next API POST /api/media/upload] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
