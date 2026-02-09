import { NextRequest, NextResponse } from 'next/server';
import { getDb, getToday } from '@/db/connection';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '30');

    const records = db.prepare(`
      SELECT * FROM weight_log ORDER BY measured_at DESC LIMIT ?
    `).all(limit);

    return NextResponse.json({ success: true, data: records });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();

    const { weight_kg, measured_at } = body;

    if (!weight_kg) {
      return NextResponse.json(
        { success: false, error: '体重を入力してください' },
        { status: 400 }
      );
    }

    const date = measured_at || getToday();

    // 同じ日の記録があれば更新、なければ挿入
    const existing = db.prepare('SELECT id FROM weight_log WHERE measured_at = ?').get(date);

    if (existing) {
      db.prepare('UPDATE weight_log SET weight_kg = ? WHERE measured_at = ?')
        .run(weight_kg, date);
    } else {
      db.prepare('INSERT INTO weight_log (measured_at, weight_kg) VALUES (?, ?)')
        .run(date, weight_kg);
    }

    return NextResponse.json({
      success: true,
      message: '体重を記録しました',
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
