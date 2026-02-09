'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import { USER_PROFILE, NUTRITION_TARGETS } from '@/lib/constants';

export default function SettingsPage() {
  const profile = USER_PROFILE;
  const targets = NUTRITION_TARGETS;

  return (
    <div className="p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">設定</h1>
      </header>

      {/* プロファイル */}
      <Card className="mb-4">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>👤</span>
          プロファイル
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">年齢</span>
            <span className="font-medium">{profile.age}歳</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">身長</span>
            <span className="font-medium">{profile.height_cm}cm</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">目標体重</span>
            <span className="font-medium">100kg（まず10kg減）</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-600">生活スタイル</span>
            <span className="font-medium">{profile.lifestyle.cooking_style}</span>
          </div>
        </div>
      </Card>

      {/* 栄養目標 */}
      <Card className="mb-4">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>🎯</span>
          1日の栄養目標
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">塩分</span>
            <span className="font-medium text-primary">{targets.salt_g}g以下</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">糖質</span>
            <span className="font-medium">{targets.carbs_g}g以下</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">カロリー</span>
            <span className="font-medium">{targets.calories}kcal</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">たんぱく質</span>
            <span className="font-medium">{targets.protein_g}g以上</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-600">食物繊維</span>
            <span className="font-medium">{targets.fiber_g}g以上</span>
          </div>
        </div>
      </Card>

      {/* 健康上の注意点 */}
      <Card className="mb-4 bg-amber-50">
        <h2 className="font-bold text-amber-700 mb-4 flex items-center gap-2">
          <span>⚠️</span>
          健康上の注意点
        </h2>
        <ul className="space-y-2 text-sm text-gray-700">
          {profile.medical.symptoms.map((symptom, i) => (
            <li key={i} className="flex items-start gap-2">
              <span>•</span>
              <span>{symptom}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* 目標 */}
      <Card className="mb-4 bg-primary/5">
        <h2 className="font-bold text-primary mb-4 flex items-center gap-2">
          <span>🎯</span>
          あなたの目標
        </h2>
        <ul className="space-y-2 text-sm text-gray-700">
          {profile.goals.map((goal, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>{goal}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* アプリ情報 */}
      <Card>
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>ℹ️</span>
          アプリ情報
        </h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">アプリ名</span>
            <span className="font-medium">からだリズム</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">バージョン</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <p className="text-gray-500 text-xs pt-2">
            このアプリは医療アドバイスを提供するものではありません。
            健康上の懸念がある場合は、必ず医師にご相談ください。
          </p>
        </div>
      </Card>
    </div>
  );
}
