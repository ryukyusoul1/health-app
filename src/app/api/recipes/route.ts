import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db/connection';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const favorite = searchParams.get('favorite');
    const search = searchParams.get('search');

    let query = 'SELECT * FROM recipes WHERE 1=1';
    const params: (string | number)[] = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (favorite === 'true') {
      query += ' AND is_favorite = 1';
    }

    if (search) {
      query += ' AND name LIKE ?';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY category, name';

    const recipes = db.prepare(query).all(...params) as Record<string, unknown>[];

    // JSON文字列をパースして返す
    const parsedRecipes = recipes.map((r) => ({
      ...r,
      ingredients: JSON.parse(r.ingredients_json as string),
      steps: JSON.parse(r.steps_json as string),
      salt_tips: r.salt_tips_json ? JSON.parse(r.salt_tips_json as string) : [],
      sugar_tips: r.sugar_tips_json ? JSON.parse(r.sugar_tips_json as string) : [],
      is_favorite: r.is_favorite === 1,
    }));

    return NextResponse.json({ success: true, data: parsedRecipes });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
