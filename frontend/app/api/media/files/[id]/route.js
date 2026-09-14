import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://eqp-1.onrender.com';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;
    if (!id) {
      return new NextResponse('Asset ID required', { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const download = searchParams.get('download');

    const backendUrl = `${BACKEND_URL}/api/media/files/${id}${download ? `?download=${download}` : ''}`;
    const backendRes = await fetch(backendUrl, {
      headers: {
        ...(request.headers.get('authorization') ? { Authorization: request.headers.get('authorization') } : {}),
      },
    });

    if (!backendRes.ok) {
      return new NextResponse('Asset not found', { status: backendRes.status });
    }

    const contentType = backendRes.headers.get('content-type') || 'application/octet-stream';
    const contentDisposition = backendRes.headers.get('content-disposition');
    const blob = await backendRes.blob();

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    if (contentDisposition) {
      headers.set('Content-Disposition', contentDisposition);
    }
    headers.set('Cache-Control', 'public, max-age=86400');

    return new NextResponse(blob, {
      status: 200,
      headers,
    });
  } catch (err) {
    console.error('[Next API GET /api/media/files/[id]] Error:', err);
    return new NextResponse('Internal error fetching file', { status: 500 });
  }
}
