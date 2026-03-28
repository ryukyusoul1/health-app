import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { description } = await request.json();

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'APIキーが未設定です' }, { status: 500 });
    }

    const prompt = `ユーザーが食べたものの説明から、栄養素を推定してください。
お惣菜・外食・コンビニ食品など、一般的な日本の食事を想定してください。
複数品ある場合はまとめた合計値を出してください。

必ず以下のJSON形式のみで回答してください。説明文は不要です。
{"name":"料理名（まとめた名前）","calories":数値,"salt_g":数値,"carbs_g":数値,"protein_g":数値,"fiber_g":数値}

数値は小数点1桁まで。わからない場合は一般的な値で推定してください。

ユーザーの入力: ${description}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-lite-001',
        messages: [
          { role: 'user', content: prompt },
        ],
        max_tokens: 256,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `AI推定エラー: ${errText.slice(0, 200)}` }, { status: 500 });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';

    // JSONを抽出
    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'AIの回答を解析できませんでした', raw: text }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error('AI food error:', error);
    return NextResponse.json(
      { error: `エラー: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
