import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db/connection';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDb();
    const { id } = await params;

    const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(id) as Record<string, unknown> | undefined;

    if (!recipe) {
      return NextResponse.json(
        { success: false, error: 'レシピが見つかりません' },
        { status: 404 }
      );
    }

    const parsedRecipe = {
      ...recipe,
      ingredients: JSON.parse(recipe.ingredients_json as string),
      steps: JSON.parse(recipe.steps_json as string),
      salt_tips: recipe.salt_tips_json ? JSON.parse(recipe.salt_tips_json as string) : [],
      sugar_tips: recipe.sugar_tips_json ? JSON.parse(recipe.sugar_tips_json as string) : [],
      is_favorite: recipe.is_favorite === 1,
    };

    return NextResponse.json({ success: true, data: parsedRecipe });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDb();
    const { id } = await params;
    const body = await request.json();

    if (body.is_favorite !== undefined) {
      db.prepare('UPDATE recipes SET is_favorite = ? WHERE id = ?')
        .run(body.is_favorite ? 1 : 0, id);
    }

    return NextResponse.json({ success: true, message: '更新しました' });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
