import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://eqp-1.onrender.com';
const CLOUD_FALLBACK_URL = 'https://eqp-1.onrender.com';

function getTargetUrls() {
  const urls = [BACKEND_URL];
  if (BACKEND_URL !== CLOUD_FALLBACK_URL) {
    urls.push(CLOUD_FALLBACK_URL);
  }
  return urls;
}

export async function GET(request) {
  const urls = getTargetUrls();
  const authHeader = request.headers.get('authorization');

  for (const baseUrl of urls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const backendRes = await fetch(`${baseUrl}/api/media/campaigns`, {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (backendRes && backendRes.ok) {
        const data = await backendRes.json().catch(() => null);
        if (data && data.success && data.campaigns && !data.updatedBy?.includes('Fallback')) {
          return NextResponse.json(data);
        }
      }
    } catch (err) {
      console.warn(`[Next API GET /api/media/campaigns] Error proxying to ${baseUrl}:`, err.message);
    }
  }

  // Never return default template as a "success" response when servers are unreachable.
  // Returning 503 prevents frontend from wiping the user's local edits.
  return NextResponse.json(
    {
      success: false,
      error: 'Backend servers currently unreachable. Preserving local cached campaign.',
      isOffline: true,
    },
    { status: 503 }
  );
}

export async function PUT(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const urls = getTargetUrls();
    const authHeader = request.headers.get('authorization');

    for (const baseUrl of urls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const backendRes = await fetch(`${baseUrl}/api/media/campaigns`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(authHeader ? { Authorization: authHeader } : {}),
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
        console.warn(`[Next API PUT /api/media/campaigns] Error proxying to ${baseUrl}:`, err.message);
      }
    }
  } catch (err) {
    console.warn('[Next API PUT /api/media/campaigns] Error parsing request:', err.message);
  }

  return NextResponse.json(
    {
      success: false,
      error: 'Failed to persist to cloud database. Changes saved locally in browser.',
      isOffline: true,
    },
    { status: 503 }
  );
}

export async function POST(request) {
  return PUT(request);
}
