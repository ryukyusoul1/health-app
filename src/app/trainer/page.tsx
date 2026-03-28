'use client';

import React, { useEffect, useState, useRef } from 'react';
import * as storage from '@/lib/storage';

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

export default function TrainerPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [healthSummary, setHealthSummary] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bodyRecords = storage.getBodyCompositions(5);
    const bpRecords = storage.getBloodPressureRecords(5);
    const todayStr = new Date().toISOString().split('T')[0];
    const { summary } = storage.getFoodLogs(todayStr);
    const condition = storage.getConditionLog(todayStr);

    let data = '';

    if (bodyRecords.length > 0) {
      const latest = bodyRecords[0];
      data += `【体組成（最新: ${latest.measured_date}）】\n`;
      data += `体重: ${latest.weight_kg}kg`;
      if (latest.body_fat_pct != null) data += ` / 体脂肪率: ${latest.body_fat_pct}%`;
      if (latest.visceral_fat_level != null) data += ` / 内臓脂肪: Lv.${latest.visceral_fat_level}`;
      if (latest.skeletal_muscle_pct != null) data += ` / 骨格筋率: ${latest.skeletal_muscle_pct}%`;
      if (latest.body_age != null) data += ` / 体年齢: ${latest.body_age}歳`;
      if (latest.basal_metabolism != null) data += ` / 基礎代謝: ${latest.basal_metabolism}kcal`;
      if (latest.bmi != null) data += ` / BMI: ${latest.bmi}`;
      data += '\n';

      if (bodyRecords.length > 1) {
        const oldest = bodyRecords[bodyRecords.length - 1];
        const diff = latest.weight_kg - oldest.weight_kg;
        data += `体重推移: ${oldest.weight_kg}kg → ${latest.weight_kg}kg（${diff > 0 ? '+' : ''}${diff.toFixed(1)}kg）\n`;
      }
    }

    if (bpRecords.length > 0) {
      const latest = bpRecords[0];
      data += `【血圧（最新）】${latest.systolic}/${latest.diastolic}`;
      if (latest.pulse) data += ` 脈拍${latest.pulse}`;
      data += '\n';

      if (bpRecords.length > 1) {
        const avg_sys = Math.round(bpRecords.reduce((s, r) => s + r.systolic, 0) / bpRecords.length);
        const avg_dia = Math.round(bpRecords.reduce((s, r) => s + r.diastolic, 0) / bpRecords.length);
        data += `血圧平均（直近${bpRecords.length}回）: ${avg_sys}/${avg_dia}\n`;
      }
    }

    if (summary.calories > 0) {
      data += `【今日の食事】カロリー: ${summary.calories}kcal / 塩分: ${summary.salt_g}g / 糖質: ${summary.carbs_g}g / たんぱく質: ${summary.protein_g}g\n`;
    }

    if (condition) {
      data += `【今日の体調】スコア: ${condition.overall_score}/5 / 疲労: ${condition.fatigue_level}/5\n`;
    }

    if (!data) {
      data = 'まだ健康データがありません。';
    }

    setHealthSummary(data);

    setMessages([{
      role: 'ai',
      text: 'こんにちは！健康データをもとにアドバイスします。何でも聞いてください。\n例：「最近の体重の傾向は？」「血圧を下げるには？」「食事のアドバイスをして」',
    }]);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const quickQuestions = [
    '体重の傾向を教えて',
    '血圧を下げるアドバイス',
    '食事の改善点は？',
    '運動のおすすめは？',
  ];

  async function handleSend(text?: string) {
    const msg = text || input.trim();
    if (!msg || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          healthData: healthSummary,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessages(prev => [...prev, { role: 'ai', text: data.message }]);
      } else {
        setMessages(prev => [...prev, { role: 'ai', text: data.error || 'エラーが発生しました。しばらく経ってからお試しください。' }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: '通信エラーが発生しました。' }]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] pb-16">
      <header className="p-4 pb-2">
        <h1 className="text-xl font-bold text-gray-800">AI健康相談</h1>
        <p className="text-sm text-gray-500">Geminiがあなたのデータを見てアドバイス</p>
      </header>

      {/* チャット */}
      <div className="flex-1 overflow-y-auto px-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] p-3 rounded-2xl text-sm whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-800 rounded-bl-sm'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* クイック質問 */}
      {messages.length <= 1 && (
        <div className="px-4 py-2">
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map(q => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                className="px-3 py-1.5 bg-primary/10 text-primary text-xs rounded-full font-medium hover:bg-primary/20"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 入力 */}
      <div className="p-4 pt-2 border-t bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleSend(); }}
            placeholder="質問を入力..."
            className="flex-1 p-3 border rounded-xl text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="px-4 py-3 bg-primary text-white rounded-xl font-medium text-sm disabled:opacity-50"
          >
            送信
          </button>
        </div>
      </div>
    </div>
  );
}
