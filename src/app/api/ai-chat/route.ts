import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message, healthData } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini APIキーが設定されていません' },
        { status: 500 }
      );
    }

    const systemPrompt = `あなたは健康管理アプリ「からだリズム」のAIアドバイザーです。
ユーザーの健康データを元に、優しく的確なアドバイスをしてください。
医師ではないため、診断はできません。あくまで一般的な健康アドバイスに留めてください。
回答は日本語で、簡潔に（200文字程度で）お願いします。

ユーザーの最新データ:
${healthData}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      return NextResponse.json(
        { error: 'AIからの応答取得に失敗しました' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'すみません、回答を生成できませんでした。';

    return NextResponse.json({ message: text });
  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json(
      { error: 'エラーが発生しました' },
      { status: 500 }
    );
  }
}
