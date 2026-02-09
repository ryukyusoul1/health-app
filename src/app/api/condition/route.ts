import { NextRequest, NextResponse } from 'next/server';
import { getDb, getToday } from '@/db/connection';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    const limit = parseInt(searchParams.get('limit') || '30');

    if (date) {
      const record = db.prepare('SELECT * FROM condition_log WHERE logged_date = ?').get(date);
      return NextResponse.json({ success: true, data: record || null });
    }

    const records = db.prepare(`
      SELECT * FROM condition_log ORDER BY logged_date DESC LIMIT ?
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

    const {
      logged_date,
      overall_score,
      palpitation,
      edema,
      fatigue_level,
      cpap_used,
      note,
    } = body;

    const date = logged_date || getToday();

    // 同じ日の記録があれば更新
    const existing = db.prepare('SELECT id FROM condition_log WHERE logged_date = ?').get(date);

    if (existing) {
      db.prepare(`
        UPDATE condition_log SET
          overall_score = ?,
          palpitation = ?,
          edema = ?,
          fatigue_level = ?,
          cpap_used = ?,
          note = ?
        WHERE logged_date = ?
      `).run(
        overall_score || 3,
        palpitation ? 1 : 0,
        edema ? 1 : 0,
        fatigue_level || 3,
        cpap_used !== false ? 1 : 0,
        note || null,
        date
      );
    } else {
      db.prepare(`
        INSERT INTO condition_log
        (logged_date, overall_score, palpitation, edema, fatigue_level, cpap_used, note)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        date,
        overall_score || 3,
        palpitation ? 1 : 0,
        edema ? 1 : 0,
        fatigue_level || 3,
        cpap_used !== false ? 1 : 0,
        note || null
      );
    }

    // CPAPストリークを更新
    if (cpap_used !== false) {
      const streak = db.prepare('SELECT * FROM streaks WHERE streak_type = ?').get('cpap') as {
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
        } else if (streak.last_date === date) {
          newCount = streak.current_count;
        }

        const newBest = Math.max(newCount, streak.best_count);

        db.prepare(`
          UPDATE streaks SET current_count = ?, best_count = ?, last_date = ?
          WHERE streak_type = ?
        `).run(newCount, newBest, date, 'cpap');
      }
    }

    return NextResponse.json({
      success: true,
      message: '体調を記録しました',
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
