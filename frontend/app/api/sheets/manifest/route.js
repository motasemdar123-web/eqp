import { NextResponse } from 'next/server';
import { getManifest } from '../../../../lib/sheetsService';

export async function GET() {
  const data = getManifest();
  return NextResponse.json({ success: true, data });
}
