import { NextResponse } from 'next/server';
import { getDb } from '@/db/connection';

export async function GET() {
  try {
    const db = getDb();

    const presets = db.prepare(`
      SELECT * FROM eating_out_presets ORDER BY name
    `).all();

    return NextResponse.json({ success: true, data: presets });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
