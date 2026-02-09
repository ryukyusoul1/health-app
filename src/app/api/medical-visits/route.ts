import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db/connection';

export async function GET() {
  try {
    const db = getDb();

    const visits = db.prepare(`
      SELECT * FROM medical_visits ORDER BY visit_date DESC
    `).all();

    // 次回予約日を確認
    const nextVisit = db.prepare(`
      SELECT * FROM medical_visits
      WHERE next_visit IS NOT NULL AND next_visit >= DATE('now')
      ORDER BY next_visit ASC LIMIT 1
    `).get();

    return NextResponse.json({
      success: true,
      data: visits,
      nextVisit,
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
      visit_date,
      department,
      doctor_name,
      diagnosis,
      prescription,
      next_visit,
      note,
    } = body;

    if (!visit_date) {
      return NextResponse.json(
        { success: false, error: '受診日を入力してください' },
        { status: 400 }
      );
    }

    const result = db.prepare(`
      INSERT INTO medical_visits
      (visit_date, department, doctor_name, diagnosis, prescription, next_visit, note)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      visit_date,
      department || null,
      doctor_name || null,
      diagnosis || null,
      prescription || null,
      next_visit || null,
      note || null
    );

    return NextResponse.json({
      success: true,
      id: result.lastInsertRowid,
      message: '受診記録を保存しました',
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
