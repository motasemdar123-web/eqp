import { NextResponse } from 'next/server';
import { getGovernanceData } from '../../../../lib/sheetsService';

export async function GET() {
  const data = getGovernanceData();
  return NextResponse.json({ success: true, data });
}
