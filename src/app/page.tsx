'use client';

import React, { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import RiskCard from '@/components/medical/RiskCard';
import DailySummary from '@/components/log/DailySummary';
import MissionCard from '@/components/self-care/MissionCard';
import { CONDITION_EMOJIS, WEEKDAYS } from '@/lib/constants';
import { BloodPressure, WeightLog, DailyNutritionSummary, ConditionLog, Recipe } from '@/types';
import Link from 'next/link';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [latestBP, setLatestBP] = useState<BloodPressure | null>(null);
  const [latestWeight, setLatestWeight] = useState<WeightLog | null>(null);
  const [nutritionSummary, setNutritionSummary] = useState<DailyNutritionSummary>({
    date: new Date().toISOString().split('T')[0],
    salt_g: 0,
    carbs_g: 0,
    calories: 0,
    protein_g: 0,
    fiber_g: 0,
  });
  const [todayCondition, setTodayCondition] = useState<ConditionLog | null>(null);
  const [mission, setMission] = useState<{ mission_text: string; completed: boolean } | null>(null);
  const [streak, setStreak] = useState<{ current_count: number; best_count: number } | null>(null);
  const [todayMeals, setTodayMeals] = useState<Recipe[]>([]);
  const [hasVisited, setHasVisited] = useState(false);

  const today = new Date();
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日（${WEEKDAYS[today.getDay()]}）`;

  // データベースを初期化
  useEffect(() => {
    async function initDb() {
      try {
        // データベースの状態を確認
        const checkRes = await fetch('/api/db/init');
        const checkData = await checkRes.json();

        if (!checkData.success || checkData.recipeCount === 0) {
          // 初期化が必要
          await fetch('/api/db/init', { method: 'POST' });
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('DB init error:', error);
        setIsInitialized(true); // エラーでも続行
      }
    }
    initDb();
  }, []);

  // データを取得
  useEffect(() => {
    if (!isInitialized) return;

    async function fetchData() {
      setIsLoading(true);
      try {
        const todayStr = new Date().toISOString().split('T')[0];

        // 並列でデータを取得
        const [bpRes, weightRes, foodRes, conditionRes, missionRes, visitsRes, recipesRes] = await Promise.all([
          fetch('/api/blood-pressure?limit=1'),
          fetch('/api/weight?limit=1'),
          fetch(`/api/food-log?date=${todayStr}`),
          fetch(`/api/condition?date=${todayStr}`),
          fetch('/api/missions'),
          fetch('/api/medical-visits'),
          fetch('/api/recipes?limit=3'),
        ]);

        const bpData = await bpRes.json();
        const weightData = await weightRes.json();
        const foodData = await foodRes.json();
        const conditionData = await conditionRes.json();
        const missionData = await missionRes.json();
        const visitsData = await visitsRes.json();
        const recipesData = await recipesRes.json();

        if (bpData.success && bpData.data.length > 0) {
          setLatestBP(bpData.data[0]);
        }

        if (weightData.success && weightData.data.length > 0) {
          setLatestWeight(weightData.data[0]);
        }

        if (foodData.success) {
          setNutritionSummary(foodData.summary);
        }

        if (conditionData.success && conditionData.data) {
          setTodayCondition(conditionData.data);
        }

        if (missionData.success) {
          setMission(missionData.data);
          setStreak(missionData.streak);
        }

        if (visitsData.success && visitsData.data.length > 0) {
          setHasVisited(true);
        }

        if (recipesData.success) {
          setTodayMeals(recipesData.data.slice(0, 3));
        }
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [isInitialized]);

  const handleMissionComplete = async (completed: boolean) => {
    try {
      const res = await fetch('/api/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      });

      if (res.ok) {
        setMission(prev => prev ? { ...prev, completed } : null);
        if (completed && streak) {
          setStreak(prev => prev ? {
            ...prev,
            current_count: prev.current_count + 1,
          } : null);
        }
      }
    } catch (error) {
      console.error('Mission update error:', error);
    }
  };

  if (isLoading || !isInitialized) {
    return (
      <div className="p-4 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* ヘッダー */}
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">からだリズム</h1>
        <p className="text-gray-600">{dateStr}</p>
      </header>

      {/* 健康リスクカード */}
      <RiskCard
        latestBP={latestBP}
        latestWeight={latestWeight?.weight_kg}
        hasVisited={hasVisited}
      />

      {/* 今日の体調 */}
      <Link href="/log/condition">
        <Card className="mb-4 hover:bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">
                {todayCondition ? CONDITION_EMOJIS[todayCondition.overall_score] : '❓'}
              </span>
              <div>
                <p className="text-sm text-gray-500">今日の体調</p>
                <p className="font-medium text-gray-800">
                  {todayCondition ? '記録済み' : 'タップして記録'}
                </p>
              </div>
            </div>
            <span className="text-gray-400">→</span>
          </div>
        </Card>
      </Link>

      {/* 栄養サマリー */}
      <DailySummary summary={nutritionSummary} />

      {/* 今日のミッション */}
      {mission && (
        <div className="mb-4">
          <MissionCard
            mission={mission}
            streak={streak || undefined}
            onComplete={handleMissionComplete}
          />
        </div>
      )}

      {/* 今日のおすすめレシピ */}
      <Card className="mb-4">
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span>🍱</span>
          今日のおすすめ
        </h3>
        <div className="space-y-2">
          {todayMeals.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/meals/${recipe.id}`}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div>
                <p className="font-medium text-gray-800">{recipe.name}</p>
                <p className="text-xs text-gray-500">
                  🧂 {recipe.salt_g}g ⏱ {recipe.cooking_time_min}分
                </p>
              </div>
              <span className="text-gray-400">→</span>
            </Link>
          ))}
        </div>
        <Link
          href="/meals"
          className="block mt-3 text-center text-primary font-medium text-sm"
        >
          すべてのレシピを見る
        </Link>
      </Card>

      {/* 最新の記録 */}
      <Card className="mb-4">
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span>📈</span>
          最新の記録
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/log/blood-pressure"
            className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <p className="text-xs text-gray-500 mb-1">血圧</p>
            {latestBP ? (
              <p className="font-bold text-gray-800">
                {latestBP.systolic}/{latestBP.diastolic}
              </p>
            ) : (
              <p className="text-gray-400 text-sm">未記録</p>
            )}
          </Link>
          <Link
            href="/log/weight"
            className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <p className="text-xs text-gray-500 mb-1">体重</p>
            {latestWeight ? (
              <p className="font-bold text-gray-800">
                {latestWeight.weight_kg} kg
              </p>
            ) : (
              <p className="text-gray-400 text-sm">未記録</p>
            )}
          </Link>
        </div>
      </Card>

      {/* クイックアクション */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Link
          href="/log/food"
          className="flex items-center justify-center gap-2 p-4 bg-primary text-white rounded-2xl font-medium hover:bg-primary/90 transition-colors"
        >
          <span className="text-xl">🍽️</span>
          <span>食事を記録</span>
        </Link>
        <Link
          href="/log/blood-pressure"
          className="flex items-center justify-center gap-2 p-4 bg-accent text-white rounded-2xl font-medium hover:bg-accent/90 transition-colors"
        >
          <span className="text-xl">💓</span>
          <span>血圧を記録</span>
        </Link>
      </div>
    </div>
  );
}
