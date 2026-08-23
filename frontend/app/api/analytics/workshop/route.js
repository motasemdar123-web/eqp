import { NextResponse } from 'next/server';
import { getWorkshopData } from '../../../../lib/sheetsService';

export async function GET() {
  const data = getWorkshopData();
  return NextResponse.json({ success: true, data });
}
