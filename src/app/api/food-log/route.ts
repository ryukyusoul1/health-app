import { NextRequest, NextResponse } from 'next/server';
import { getDb, getToday } from '@/db/connection';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date') || getToday();

    const logs = db.prepare(`
      SELECT fl.*, r.name as recipe_name, r.calories as recipe_calories,
             r.salt_g as recipe_salt_g, r.carbs_g as recipe_carbs_g,
             r.protein_g as recipe_protein_g, r.fiber_g as recipe_fiber_g
      FROM food_log fl
      LEFT JOIN recipes r ON fl.recipe_id = r.id
      WHERE fl.logged_date = ?
      ORDER BY
        CASE fl.meal_type
          WHEN 'breakfast' THEN 1
          WHEN 'lunch' THEN 2
          WHEN 'dinner' THEN 3
          WHEN 'snack' THEN 4
        END
    `).all(date);

    // 日次サマリーを計算
    const summary = {
      date,
      calories: 0,
      salt_g: 0,
      carbs_g: 0,
      protein_g: 0,
      fiber_g: 0,
    };

    for (const log of logs as Record<string, number | null>[]) {
      const portion = (log.portion as number) || 1;
      summary.calories += ((log.calories as number) || (log.recipe_calories as number) || 0) * portion;
      summary.salt_g += ((log.salt_g as number) || (log.recipe_salt_g as number) || 0) * portion;
      summary.carbs_g += ((log.carbs_g as number) || (log.recipe_carbs_g as number) || 0) * portion;
      summary.protein_g += ((log.protein_g as number) || (log.recipe_protein_g as number) || 0) * portion;
      summary.fiber_g += ((log.fiber_g as number) || (log.recipe_fiber_g as number) || 0) * portion;
    }

    return NextResponse.json({
      success: true,
      data: logs,
      summary,
    });
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
      meal_type,
      recipe_id,
      custom_name,
      portion,
      calories,
      salt_g,
      carbs_g,
      protein_g,
      fiber_g,
      note,
    } = body;

    if (!logged_date || !meal_type) {
      return NextResponse.json(
        { success: false, error: '日付と食事タイプを入力してください' },
        { status: 400 }
      );
    }

    const result = db.prepare(`
      INSERT INTO food_log
      (logged_date, meal_type, recipe_id, custom_name, portion, calories, salt_g, carbs_g, protein_g, fiber_g, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      logged_date,
      meal_type,
      recipe_id || null,
      custom_name || null,
      portion || 1.0,
      calories || null,
      salt_g || null,
      carbs_g || null,
      protein_g || null,
      fiber_g || null,
      note || null
    );

    // ストリークを更新
    const today = getToday();
    const streak = db.prepare('SELECT * FROM streaks WHERE streak_type = ?').get('food_log') as {
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
      `).run(newCount, newBest, today, 'food_log');
    }

    return NextResponse.json({
      success: true,
      id: result.lastInsertRowid,
      message: '食事を記録しました',
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const db = getDb();
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'IDが必要です' }, { status: 400 });
    }

    db.prepare('DELETE FROM food_log WHERE id = ?').run(id);

    return NextResponse.json({ success: true, message: '削除しました' });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
