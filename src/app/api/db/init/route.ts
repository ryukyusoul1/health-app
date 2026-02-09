import { NextResponse } from 'next/server';
import { getDb } from '@/db/connection';
import { seedDatabase } from '@/db/seed-recipes';

export async function POST() {
  try {
    // データベースを初期化
    getDb();

    // シードデータを投入
    seedDatabase();

    return NextResponse.json({ success: true, message: 'Database initialized and seeded' });
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const db = getDb();

    // テーブルの存在確認
    const tables = db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table'
    `).all() as { name: string }[];

    // レシピ数を確認
    const recipeCount = db.prepare('SELECT COUNT(*) as count FROM recipes').get() as { count: number };

    return NextResponse.json({
      success: true,
      tables: tables.map((t) => t.name),
      recipeCount: recipeCount.count,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      initialized: false,
      error: String(error),
    });
  }
}
