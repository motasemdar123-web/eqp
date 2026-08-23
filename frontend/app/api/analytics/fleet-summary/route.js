import { NextResponse } from 'next/server';
import { getFleetAnalyticsSummary } from '../../../../lib/sheetsService';

export async function GET() {
  const data = getFleetAnalyticsSummary();
  return NextResponse.json({ success: true, data });
}
