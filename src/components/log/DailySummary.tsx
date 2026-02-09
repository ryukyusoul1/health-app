'use client';

import React from 'react';
import Card from '../ui/Card';
import ProgressBar from '../ui/ProgressBar';
import { NUTRITION_TARGETS } from '@/lib/constants';
import { DailyNutritionSummary } from '@/types';

interface DailySummaryProps {
  summary: DailyNutritionSummary;
}

export default function DailySummary({ summary }: DailySummaryProps) {
  const targets = NUTRITION_TARGETS;

  // 塩分が目標以下かチェック
  const saltOk = summary.salt_g <= targets.salt_g;
  const remainingSalt = targets.salt_g - summary.salt_g;

  return (
    <Card className="mb-4">
      <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
        <span>📊</span>
        今日の栄養バランス
      </h3>

      <div className="space-y-4">
        {/* 塩分（最重要） */}
        <div>
          <ProgressBar
            value={summary.salt_g}
            max={targets.salt_g}
            label="塩分"
            unit="g"
            color={saltOk ? 'primary' : 'danger'}
          />
          {saltOk && remainingSalt > 0 && (
            <p className="text-xs text-green-600 mt-1">
              あと {remainingSalt.toFixed(1)}g まで OK
            </p>
          )}
        </div>

        {/* 糖質 */}
        <ProgressBar
          value={summary.carbs_g}
          max={targets.carbs_g}
          label="糖質"
          unit="g"
        />

        {/* カロリー */}
        <ProgressBar
          value={summary.calories}
          max={targets.calories}
          label="カロリー"
          unit="kcal"
        />

        {/* たんぱく質（目標は下限） */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-600">たんぱく質</span>
            <span className={`text-sm font-medium ${
              summary.protein_g >= targets.protein_g ? 'text-green-600' : 'text-gray-700'
            }`}>
              {summary.protein_g.toFixed(1)}g / {targets.protein_g}g以上
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                summary.protein_g >= targets.protein_g ? 'bg-green-500' : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min((summary.protein_g / targets.protein_g) * 100, 100)}%` }}
            />
          </div>
          {summary.protein_g < targets.protein_g && (
            <p className="text-xs text-amber-600 mt-1">
              あと {(targets.protein_g - summary.protein_g).toFixed(1)}g 摂りましょう
            </p>
          )}
        </div>

        {/* 食物繊維 */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-600">食物繊維</span>
            <span className={`text-sm font-medium ${
              summary.fiber_g >= targets.fiber_g ? 'text-green-600' : 'text-gray-700'
            }`}>
              {summary.fiber_g.toFixed(1)}g / {targets.fiber_g}g以上
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                summary.fiber_g >= targets.fiber_g ? 'bg-green-500' : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min((summary.fiber_g / targets.fiber_g) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
