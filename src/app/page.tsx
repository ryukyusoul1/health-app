'use client';

import React, { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import DailySummary from '@/components/log/DailySummary';
import MissionCard from '@/components/self-care/MissionCard';
import { CONDITION_EMOJIS, WEEKDAYS } from '@/lib/constants';
import { BloodPressure, BodyComposition, DailyNutritionSummary, ConditionLog, Recipe } from '@/types';
import Link from 'next/link';
import * as storage from '@/lib/storage';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [latestBP, setLatestBP] = useState<BloodPressure | null>(null);
  const [latestBody, setLatestBody] = useState<BodyComposition | null>(null);
  const [nutritionSummary, setNutritionSummary] = useState<DailyNutritionSummary>({
    date: new Date().toISOString().split('T')[0],
    salt_g: 0, carbs_g: 0, calories: 0, protein_g: 0, fiber_g: 0,
  });
  const [todayCondition, setTodayCondition] = useState<ConditionLog | null>(null);
  const [missions, setMissions] = useState<{ mission: { id: string; title: string; points: number }; completed: boolean }[]>([]);
  const [streak, setStreak] = useState(0);
  const [todayMeals, setTodayMeals] = useState<Recipe[]>([]);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日（${WEEKDAYS[today.getDay()]}）`;

  useEffect(() => {
    if (!storage.isInitialized()) {
      storage.initializeData();
    }
    loadData();
  }, []);

  function loadData() {
    setIsLoading(true);
    try {
      const bpRecords = storage.getBloodPressureRecords(1);
      if (bpRecords.length > 0) setLatestBP(bpRecords[0]);

      const bodyRecords = storage.getBodyCompositions(1);
      if (bodyRecords.length > 0) setLatestBody(bodyRecords[0]);

      const { summary } = storage.getFoodLogs(todayStr);
      setNutritionSummary(summary);

      const condition = storage.getConditionLog(todayStr);
      setTodayCondition(condition);

      const userMissions = storage.getUserMissions(todayStr);
      setMissions(userMissions.slice(0, 3));

      setStreak(storage.getStreakDays());

      const recipes = storage.getRecipes({ limit: 3 });
      setTodayMeals(recipes);
    } catch (error) {
      console.error('Load error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleMissionComplete = (missionId: string, completed: boolean) => {
    storage.toggleMissionComplete(missionId, todayStr);
    setMissions(prev => prev.map(m => m.mission.id === missionId ? { ...m, completed } : m));
    if (completed) setStreak(prev => prev + 1);
  };

  const firstMission = missions.length > 0 ? {
    mission_text: missions[0].mission.title,
    completed: missions[0].completed,
  } : null;

  if (isLoading) {
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
    <div className="p-4 pb-24">
      {/* ヘッダー */}
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">からだリズム</h1>
        <p className="text-gray-600">{dateStr}</p>
      </header>

      {/* 最新の記録 */}
      <Card className="mb-4">
        <h3 className="font-bold text-gray-800 mb-3">最新の記録</h3>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/log/blood-pressure" className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <p className="text-xs text-gray-500 mb-1">血圧</p>
            {latestBP ? (
              <p className="font-bold text-gray-800">{latestBP.systolic}/{latestBP.diastolic}</p>
            ) : (
              <p className="text-gray-400 text-sm">未記録</p>
            )}
          </Link>
          <Link href="/log/body" className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <p className="text-xs text-gray-500 mb-1">体重</p>
            {latestBody ? (
              <p className="font-bold text-gray-800">{latestBody.weight_kg} kg</p>
            ) : (
              <p className="text-gray-400 text-sm">未記録</p>
            )}
          </Link>
          <Link href="/log/body" className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <p className="text-xs text-gray-500 mb-1">体脂肪率</p>
            {latestBody?.body_fat_pct != null ? (
              <p className="font-bold text-gray-800">{latestBody.body_fat_pct} %</p>
            ) : (
              <p className="text-gray-400 text-sm">未記録</p>
            )}
          </Link>
          <Link href="/log/body" className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <p className="text-xs text-gray-500 mb-1">BMI</p>
            {latestBody?.bmi != null ? (
              <p className="font-bold text-gray-800">{latestBody.bmi}</p>
            ) : (
              <p className="text-gray-400 text-sm">未記録</p>
            )}
          </Link>
        </div>
      </Card>

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
      {firstMission && missions.length > 0 && (
        <div className="mb-4">
          <MissionCard
            mission={firstMission}
            streak={{ current_count: streak, best_count: streak }}
            onComplete={(completed) => handleMissionComplete(missions[0].mission.id, completed)}
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
                  {recipe.salt_g}g塩分 / {recipe.cook_time_min}分
                </p>
              </div>
              <span className="text-gray-400">→</span>
            </Link>
          ))}
        </div>
        <Link href="/meals" className="block mt-3 text-center text-primary font-medium text-sm">
          すべてのレシピを見る
        </Link>
      </Card>

      {/* クイックアクション */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Link
          href="/log/body"
          className="flex flex-col items-center justify-center gap-1 p-4 bg-primary text-white rounded-2xl font-medium hover:bg-primary/90 transition-colors"
        >
          <span className="text-xl">⚖️</span>
          <span className="text-xs">体組成</span>
        </Link>
        <Link
          href="/log/food"
          className="flex flex-col items-center justify-center gap-1 p-4 bg-accent text-white rounded-2xl font-medium hover:bg-accent/90 transition-colors"
        >
          <span className="text-xl">🍽️</span>
          <span className="text-xs">食事記録</span>
        </Link>
        <Link
          href="/log/blood-pressure"
          className="flex flex-col items-center justify-center gap-1 p-4 bg-[#E57373] text-white rounded-2xl font-medium hover:opacity-90 transition-colors"
        >
          <span className="text-xl">💓</span>
          <span className="text-xs">血圧</span>
        </Link>
      </div>
    </div>
  );
}
