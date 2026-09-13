import { NextResponse } from 'next/server';
import { INITIAL_MONTHLY_CAMPAIGNS } from '../../../../../lib/mediaMonthlyData';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://eqp-1.onrender.com';

export async function POST(request) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const backendRes = await fetch(`${BACKEND_URL}/api/media/campaigns/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('authorization') ? { Authorization: request.headers.get('authorization') } : {}),
      },
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
    console.warn('[Next API POST /api/media/campaigns/reset] Error proxying to backend:', err.message);
  }

  return NextResponse.json({
    success: true,
    campaigns: INITIAL_MONTHLY_CAMPAIGNS,
    updatedAt: new Date().toISOString(),
    updatedBy: 'Master Template (Reset)',
  });
}
