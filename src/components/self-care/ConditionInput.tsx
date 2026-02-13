'use client';

import React, { useState } from 'react';
import Button from '../ui/Button';
import { CONDITION_EMOJIS } from '@/lib/constants';

interface ConditionInputProps {
  onSubmit: (data: {
    overall_score: number;
    palpitation: boolean;
    edema: boolean;
    fatigue_level: number;
    cpap_used: boolean;
    note?: string;
  }) => void;
  isLoading?: boolean;
  initialData?: {
    overall_score?: number;
    palpitation?: boolean;
    edema?: boolean;
    fatigue_level?: number;
    cpap_used?: boolean;
    note?: string;
  };
}

export default function ConditionInput({
  onSubmit,
  isLoading,
  initialData,
}: ConditionInputProps) {
  const [overallScore, setOverallScore] = useState(initialData?.overall_score || 3);
  const [palpitation, setPalpitation] = useState(initialData?.palpitation || false);
  const [edema, setEdema] = useState(initialData?.edema || false);
  const [fatigueLevel, setFatigueLevel] = useState(initialData?.fatigue_level || 3);
  const [cpapUsed, setCpapUsed] = useState(initialData?.cpap_used !== false);
  const [note, setNote] = useState(initialData?.note || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      overall_score: overallScore,
      palpitation,
      edema,
      fatigue_level: fatigueLevel,
      cpap_used: cpapUsed,
      note: note || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 全体的な体調 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          今日の体調は？
        </label>
        <div className="flex justify-between">
          {[1, 2, 3, 4, 5].map((score) => (
            <button
              key={score}
              type="button"
              onClick={() => setOverallScore(score)}
              style={{ touchAction: 'manipulation' }}
              className={`
                w-14 h-14 rounded-2xl text-3xl select-none
                transition-all duration-150
                ${overallScore === score
                  ? 'bg-primary/10 ring-2 ring-primary scale-110'
                  : 'bg-gray-100 hover:bg-gray-200'
                }
              `}
            >
              {CONDITION_EMOJIS[score]}
            </button>
          ))}
        </div>
      </div>

      {/* 症状チェック */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          今日の症状（あてはまるものをタップ）
        </label>

        <button
          type="button"
          onClick={() => setPalpitation(!palpitation)}
          style={{ touchAction: 'manipulation' }}
          className={`
            w-full p-3 rounded-xl text-left flex items-center gap-3 select-none
            transition-colors
            ${palpitation
              ? 'bg-red-50 border-2 border-red-300'
              : 'bg-gray-50 border-2 border-transparent'
            }
          `}
        >
          <span className="text-2xl">{palpitation ? '💓' : '🤍'}</span>
          <span className={palpitation ? 'text-red-700 font-medium' : 'text-gray-700'}>
            動悸があった
          </span>
        </button>

        <button
          type="button"
          onClick={() => setEdema(!edema)}
          style={{ touchAction: 'manipulation' }}
          className={`
            w-full p-3 rounded-xl text-left flex items-center gap-3 select-none
            transition-colors
            ${edema
              ? 'bg-amber-50 border-2 border-amber-300'
              : 'bg-gray-50 border-2 border-transparent'
            }
          `}
        >
          <span className="text-2xl">{edema ? '🦶' : '👣'}</span>
          <span className={edema ? 'text-amber-700 font-medium' : 'text-gray-700'}>
            むくみがあった
          </span>
        </button>
      </div>

      {/* 疲労度 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          疲労度（5が最も疲れている）
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setFatigueLevel(level)}
              style={{ touchAction: 'manipulation' }}
              className={`
                flex-1 py-3 rounded-xl font-medium select-none
                transition-colors
                ${fatigueLevel === level
                  ? level >= 4
                    ? 'bg-red-500 text-white'
                    : level >= 3
                    ? 'bg-amber-500 text-white'
                    : 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-600'
                }
              `}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* CPAP使用 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          CPAP（シーパップ）
        </label>
        <button
          type="button"
          onClick={() => setCpapUsed(!cpapUsed)}
          style={{ touchAction: 'manipulation' }}
          className={`
            w-full p-4 rounded-xl text-center select-none
            transition-colors
            ${cpapUsed
              ? 'bg-green-50 border-2 border-green-300'
              : 'bg-gray-50 border-2 border-gray-200'
            }
          `}
        >
          <span className="text-3xl mb-2 block">{cpapUsed ? '😴✓' : '😴'}</span>
          <span className={`font-medium ${cpapUsed ? 'text-green-700' : 'text-gray-500'}`}>
            {cpapUsed ? '使用しました' : '使用していません'}
          </span>
        </button>
      </div>

      {/* メモ */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          メモ（任意）
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="気になることがあれば..."
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none"
          rows={3}
        />
      </div>

      <Button type="submit" fullWidth disabled={isLoading}>
        {isLoading ? '記録中...' : '記録する'}
      </Button>
    </form>
  );
}
