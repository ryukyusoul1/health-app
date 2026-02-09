import { NextRequest, NextResponse } from 'next/server';
import { getDb, getToday } from '@/db/connection';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '30');
    const date = searchParams.get('date');

    let query = 'SELECT * FROM blood_pressure';
    const params: (string | number)[] = [];

    if (date) {
      query += ' WHERE DATE(measured_at) = ?';
      params.push(date);
    }

    query += ' ORDER BY measured_at DESC LIMIT ?';
    params.push(limit);

    const records = db.prepare(query).all(...params);

    return NextResponse.json({ success: true, data: records });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();

    const { systolic, diastolic, pulse, timing, note } = body;

    if (!systolic || !diastolic) {
      return NextResponse.json(
        { success: false, error: '血圧値を入力してください' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const result = db.prepare(`
      INSERT INTO blood_pressure (measured_at, systolic, diastolic, pulse, timing, note)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(now, systolic, diastolic, pulse || null, timing || null, note || null);

    // ストリークを更新
    const today = getToday();
    const streak = db.prepare('SELECT * FROM streaks WHERE streak_type = ?').get('bp_record') as {
      current_count: number;
      best_count: number;
      last_date: string | null;
    } | undefined;

    if (streak) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newCount = 1;
      if (streak.last_date === yesterdayStr) {
        newCount = streak.current_count + 1;
      } else if (streak.last_date === today) {
        newCount = streak.current_count;
      }

      const newBest = Math.max(newCount, streak.best_count);

      db.prepare(`
        UPDATE streaks SET current_count = ?, best_count = ?, last_date = ?
        WHERE streak_type = ?
      `).run(newCount, newBest, today, 'bp_record');
    }

    return NextResponse.json({
      success: true,
      id: result.lastInsertRowid,
      message: '血圧を記録しました',
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
