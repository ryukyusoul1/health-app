'use client';

import React from 'react';
import Card from '../ui/Card';
import { USER_PROFILE } from '@/lib/constants';

interface RiskCardProps {
  latestBP?: { systolic: number; diastolic: number } | null;
  latestWeight?: number | null;
  hasVisited?: boolean;
}

export default function RiskCard({ latestBP, latestWeight, hasVisited }: RiskCardProps) {
  const profile = USER_PROFILE;

  // 血圧の状態を判定
  const systolic = latestBP?.systolic || profile.medical.blood_pressure.systolic;
  const diastolic = latestBP?.diastolic || profile.medical.blood_pressure.diastolic;

  let bpCategory = '';
  let bpColor = '';

  if (systolic >= 160 || diastolic >= 100) {
    bpCategory = 'Ⅱ度高血圧';
    bpColor = 'text-red-600';
  } else if (systolic >= 140 || diastolic >= 90) {
    bpCategory = 'Ⅰ度高血圧';
    bpColor = 'text-orange-600';
  } else if (systolic >= 130 || diastolic >= 85) {
    bpCategory = '高値血圧';
    bpColor = 'text-amber-600';
  } else {
    bpCategory = '正常';
    bpColor = 'text-green-600';
  }

  // BMIを計算
  const weight = latestWeight || profile.weight_kg;
  const bmi = weight / ((profile.height_cm / 100) ** 2);

  return (
    <Card variant={!hasVisited ? 'danger' : 'warning'} className="mb-4">
      <div className="space-y-3">
        {/* 受診促進メッセージ */}
        {!hasVisited && (
          <div className="bg-red-100 rounded-xl p-3 border border-red-200">
            <p className="text-red-700 font-bold text-sm flex items-center gap-2">
              <span className="text-lg">🏥</span>
              循環器内科の受診をおすすめします
            </p>
            <p className="text-red-600 text-xs mt-1">
              高血圧・肥満・睡眠時無呼吸の組み合わせは心血管リスクを高めます
            </p>
          </div>
        )}

        {/* 血圧 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💓</span>
            <div>
              <p className="text-sm text-gray-600">血圧</p>
              <p className={`font-bold ${bpColor}`}>
                {systolic}/{diastolic} mmHg
              </p>
            </div>
          </div>
          <span className={`text-sm font-medium px-2 py-1 rounded-lg ${
            bpCategory === 'Ⅱ度高血圧' ? 'bg-red-100 text-red-700' :
            bpCategory === 'Ⅰ度高血圧' ? 'bg-orange-100 text-orange-700' :
            bpCategory === '高値血圧' ? 'bg-amber-100 text-amber-700' :
            'bg-green-100 text-green-700'
          }`}>
            {bpCategory}
          </span>
        </div>

        {/* BMI */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚖️</span>
            <div>
              <p className="text-sm text-gray-600">体重・BMI</p>
              <p className={`font-bold ${bmi >= 35 ? 'text-red-600' : bmi >= 30 ? 'text-orange-600' : bmi >= 25 ? 'text-amber-600' : 'text-green-600'}`}>
                {weight.toFixed(1)} kg（BMI {bmi.toFixed(1)}）
              </p>
            </div>
          </div>
          <span className={`text-sm font-medium px-2 py-1 rounded-lg ${
            bmi >= 35 ? 'bg-red-100 text-red-700' :
            bmi >= 30 ? 'bg-orange-100 text-orange-700' :
            bmi >= 25 ? 'bg-amber-100 text-amber-700' :
            'bg-green-100 text-green-700'
          }`}>
            {bmi >= 35 ? '高度肥満' : bmi >= 30 ? '肥満(2度)' : bmi >= 25 ? '肥満(1度)' : '標準'}
          </span>
        </div>

        {/* 症状リマインダー */}
        {profile.medical.symptoms.length > 0 && (
          <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
            <p className="text-amber-700 text-sm font-medium mb-1">気になる症状</p>
            <ul className="text-amber-600 text-xs space-y-1">
              {profile.medical.symptoms.map((symptom, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span>•</span>
                  <span>{symptom}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}
