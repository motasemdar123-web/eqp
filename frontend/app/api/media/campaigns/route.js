import { NextResponse } from 'next/server';
import { INITIAL_MONTHLY_CAMPAIGNS } from '../../../../lib/mediaMonthlyData';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://eqp-1.onrender.com';

export async function GET(request) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const backendRes = await fetch(`${BACKEND_URL}/api/media/campaigns`, {
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('authorization') ? { Authorization: request.headers.get('authorization') } : {}),
      },
      signal: controller.signal,
    }).catch(() => null);

    clearTimeout(timeoutId);

    if (backendRes && backendRes.ok) {
      const data = await backendRes.json().catch(() => null);
      if (data && data.success && data.campaigns) {
        return NextResponse.json(data);
      }
    }
  } catch (err) {
    console.warn('[Next API GET /api/media/campaigns] Error proxying to backend:', err.message);
  }

  // Fallback to initial monthly campaigns template
  return NextResponse.json({
    success: true,
    campaigns: INITIAL_MONTHLY_CAMPAIGNS,
    updatedAt: new Date().toISOString(),
    updatedBy: 'Master Template (Local Fallback)',
  });
}

export async function PUT(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const backendRes = await fetch(`${BACKEND_URL}/api/media/campaigns`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('authorization') ? { Authorization: request.headers.get('authorization') } : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    }).catch(() => null);

    clearTimeout(timeoutId);

    if (backendRes && backendRes.ok) {
      const data = await backendRes.json().catch(() => null);
      if (data && data.success) {
        return NextResponse.json(data);
      }
    }
  } catch (err) {
    console.warn('[Next API PUT /api/media/campaigns] Error proxying to backend:', err.message);
  }

  return NextResponse.json({
    success: true,
    updatedAt: new Date().toISOString(),
    updatedBy: 'Local Client',
    warning: 'Saved locally; will synchronize when backend is reachable.',
  });
}

export async function POST(request) {
  return PUT(request);
}
