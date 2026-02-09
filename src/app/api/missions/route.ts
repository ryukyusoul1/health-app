import { NextRequest, NextResponse } from 'next/server';
import { getDb, getToday } from '@/db/connection';
import { missionTemplates } from '@/db/seed-recipes';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date') || getToday();

    let mission = db.prepare('SELECT * FROM daily_missions WHERE mission_date = ?').get(date) as {
      id: number;
      mission_date: string;
      mission_text: string;
      completed: number;
    } | undefined;

    // 今日のミッションがなければ作成
    if (!mission) {
      const randomIndex = Math.floor(Math.random() * missionTemplates.length);
      const missionText = missionTemplates[randomIndex];

      db.prepare(`
        INSERT INTO daily_missions (mission_date, mission_text)
        VALUES (?, ?)
      `).run(date, missionText);

      mission = db.prepare('SELECT * FROM daily_missions WHERE mission_date = ?').get(date) as typeof mission;
    }

    // ストリーク情報も取得
    const streak = db.prepare('SELECT * FROM streaks WHERE streak_type = ?').get('mission');

    return NextResponse.json({
      success: true,
      data: {
        ...mission,
        completed: mission!.completed === 1,
      },
      streak,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { date, completed } = body;

    const missionDate = date || getToday();

    db.prepare(`
      UPDATE daily_missions SET completed = ? WHERE mission_date = ?
    `).run(completed ? 1 : 0, missionDate);

    // ストリークを更新
    if (completed) {
      const streak = db.prepare('SELECT * FROM streaks WHERE streak_type = ?').get('mission') as {
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
        } else if (streak.last_date === missionDate) {
          newCount = streak.current_count;
        }

        const newBest = Math.max(newCount, streak.best_count);

        db.prepare(`
          UPDATE streaks SET current_count = ?, best_count = ?, last_date = ?
          WHERE streak_type = ?
        `).run(newCount, newBest, missionDate, 'mission');
      }
    }

    return NextResponse.json({
      success: true,
      message: completed ? 'ミッション達成！' : 'ミッションを取り消しました',
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
