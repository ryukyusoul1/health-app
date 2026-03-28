import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message, healthData } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini APIキーが設定されていません。Vercelの環境変数にGEMINI_API_KEYを設定してください。' },
        { status: 500 }
      );
    }

    const systemPrompt = `あなたは健康管理アプリ「からだリズム」のAIアドバイザーです。
ユーザーの健康データを元に、優しく的確なアドバイスをしてください。
医師ではないため、診断はできません。あくまで一般的な健康アドバイスに留めてください。
回答は日本語で、簡潔に（200文字程度で）お願いします。

ユーザーの最新データ:
${healthData}`;

    // まず gemini-2.0-flash を試し、ダメなら gemini-1.5-flash にフォールバック
    const models = ['gemini-2.0-flash-lite', 'gemini-2.0-flash'];

    const errors: string[] = [];
    for (const model of models) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: systemPrompt + '\n\nユーザーの質問: ' + message }],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 512,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return NextResponse.json({ message: text });
        }
        errors.push(`${model}: AIからの回答が空でした`);
      } else {
        const errText = await response.text();
        errors.push(`${model}(${response.status}): ${errText.slice(0, 150)}`);
        console.error(`Gemini API error (${model}):`, errText);
      }
    }

    return NextResponse.json(
      { error: `AIエラー: ${errors.join(' | ')}` },
      { status: 500 }
    );
  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json(
      { error: `エラー: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
