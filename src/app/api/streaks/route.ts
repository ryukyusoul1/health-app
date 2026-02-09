import { NextResponse } from 'next/server';
import { getDb } from '@/db/connection';

export async function GET() {
  try {
    const db = getDb();

    const streaks = db.prepare(`
      SELECT * FROM streaks
    `).all();

    return NextResponse.json({ success: true, data: streaks });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
