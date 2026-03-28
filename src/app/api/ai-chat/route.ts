import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message, healthData } = await request.json();

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'APIキーが設定されていません。Vercelの環境変数にOPENROUTER_API_KEYを設定してください。' },
        { status: 500 }
      );
    }

    const systemPrompt = `あなたは健康管理アプリ「からだリズム」のAIアドバイザーです。
ユーザーの健康データを元に、優しく的確なアドバイスをしてください。
医師ではないため、診断はできません。あくまで一般的な健康アドバイスに留めてください。
回答は日本語で、簡潔に（200文字程度で）お願いします。

ユーザーの最新データ:
${healthData}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        max_tokens: 512,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenRouter API error:', errText);
      return NextResponse.json(
        { error: `AIエラー(${response.status}): ${errText.slice(0, 200)}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || 'すみません、回答を生成できませんでした。';

    return NextResponse.json({ message: text });
  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json(
      { error: `エラー: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
