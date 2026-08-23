import { NextResponse } from 'next/server';
import { getSheetData } from '../../../../lib/sheetsService';

export async function GET(request, { params }) {
  const { sheetId } = await params;
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const sortField = searchParams.get('sortField') || '';
  const sortOrder = searchParams.get('sortOrder') || 'asc';

  const data = getSheetData(sheetId, { query, page, limit, sortField, sortOrder });
  return NextResponse.json({ success: true, data });
}
