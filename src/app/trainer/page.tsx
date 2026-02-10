'use client';

import React, { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import * as storage from '@/lib/storage';
import { NUTRITION_TARGETS, USER_PROFILE } from '@/lib/constants';

interface Advice {
  id: string;
  category: 'blood_pressure' | 'diet' | 'exercise' | 'sleep' | 'general';
  icon: string;
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
}

export default function TrainerPage() {
  const [advices, setAdvices] = useState<Advice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    if (!storage.isInitialized()) {
      storage.initializeData();
    }
    generateAdvice();
  }, []);

  function generateAdvice() {
    setIsLoading(true);
    const newAdvices: Advice[] = [];
    const today = new Date().toISOString().split('T')[0];
    const hour = new Date().getHours();

    // 時間帯に応じた挨拶
    if (hour < 12) {
      setGreeting('おはようございます！');
    } else if (hour < 18) {
      setGreeting('こんにちは！');
    } else {
      setGreeting('お疲れさまです！');
    }

    // 1. 血圧データを確認
    const bpRecords = storage.getBloodPressureRecords(7);
    if (bpRecords.length === 0) {
      newAdvices.push({
        id: 'bp1',
        category: 'blood_pressure',
        icon: '💓',
        title: '血圧を記録しましょう',
        message: '高血圧の管理には毎日の血圧測定が大切です。朝起きてから1時間以内と、夜寝る前の2回測定がおすすめです。',
        priority: 'high',
      });
    } else {
      const latestBP = bpRecords[0];
      if (latestBP.systolic >= 160 || latestBP.diastolic >= 100) {
        newAdvices.push({
          id: 'bp2',
          category: 'blood_pressure',
          icon: '⚠️',
          title: '血圧が高めです',
          message: `最新の血圧は ${latestBP.systolic}/${latestBP.diastolic} です。塩分を控えめにし、深呼吸でリラックスしましょう。改善が見られない場合は医師に相談を。`,
          priority: 'high',
        });
      } else if (latestBP.systolic >= 140 || latestBP.diastolic >= 90) {
        newAdvices.push({
          id: 'bp3',
          category: 'blood_pressure',
          icon: '📊',
          title: '血圧の経過を見守っています',
          message: '引き続き減塩と適度な運動を心がけましょう。少しずつでも数値が下がってきたら、とても良い傾向です！',
          priority: 'medium',
        });
      } else {
        newAdvices.push({
          id: 'bp4',
          category: 'blood_pressure',
          icon: '👍',
          title: '血圧は良好です！',
          message: '素晴らしいですね！この調子で続けていきましょう。',
          priority: 'low',
        });
      }
    }

    // 2. 今日の食事を確認
    const { summary } = storage.getFoodLogs(today);
    if (summary.salt_g > NUTRITION_TARGETS.salt_g) {
      newAdvices.push({
        id: 'diet1',
        category: 'diet',
        icon: '🧂',
        title: '今日の塩分が目標を超えています',
        message: `今日は ${summary.salt_g.toFixed(1)}g の塩分を摂取しています（目標: ${NUTRITION_TARGETS.salt_g}g）。次の食事は薄味を心がけましょう。酢やレモン、香味野菜で風味をつけると満足感が上がります。`,
        priority: 'high',
      });
    } else if (summary.salt_g > NUTRITION_TARGETS.salt_g * 0.8) {
      newAdvices.push({
        id: 'diet2',
        category: 'diet',
        icon: '🍽️',
        title: '塩分は目標内ですが注意',
        message: `今日の塩分は ${summary.salt_g.toFixed(1)}g です。あと少し余裕があります。夕食は減塩レシピで調整しましょう。`,
        priority: 'medium',
      });
    } else if (summary.salt_g === 0) {
      newAdvices.push({
        id: 'diet3',
        category: 'diet',
        icon: '📝',
        title: '食事を記録しましょう',
        message: '食事を記録すると、塩分摂取量が見えてきます。まずは今日食べたものを記録してみましょう。',
        priority: 'medium',
      });
    }

    // 3. 運動を確認
    const exerciseSummary = storage.getTodayExerciseSummary();
    if (exerciseSummary.completed_count === 0) {
      if (hour >= 20) {
        newAdvices.push({
          id: 'ex1',
          category: 'exercise',
          icon: '🧘',
          title: '寝る前のリラックス運動',
          message: 'お疲れの夜は、座ったままできる深呼吸や首のストレッチがおすすめです。5分でも効果がありますよ。',
          priority: 'medium',
        });
      } else {
        newAdvices.push({
          id: 'ex2',
          category: 'exercise',
          icon: '🏃',
          title: '今日も軽く体を動かしましょう',
          message: '座ったままできる運動を用意しています。疲れていても、首や肩のストレッチだけでも血行が良くなります。',
          priority: 'medium',
        });
      }
    } else {
      newAdvices.push({
        id: 'ex3',
        category: 'exercise',
        icon: '🎉',
        title: `今日は${exerciseSummary.completed_count}つの運動を完了！`,
        message: `合計${exerciseSummary.total_duration}分、${exerciseSummary.total_calories}kcal消費しました。素晴らしい！`,
        priority: 'low',
      });
    }

    // 4. 体調を確認
    const todayCondition = storage.getConditionLog(today);
    if (!todayCondition) {
      newAdvices.push({
        id: 'cond1',
        category: 'general',
        icon: '📋',
        title: '今日の体調を記録しましょう',
        message: '毎日の体調記録は、自分の健康パターンを知るのに役立ちます。動悸やむくみの有無も記録しておきましょう。',
        priority: 'medium',
      });
    } else if (todayCondition.palpitation) {
      newAdvices.push({
        id: 'cond2',
        category: 'general',
        icon: '💗',
        title: '動悸があるんですね',
        message: '動悸がある時は無理せず休息を。糖質の多い食事の後に動悸が出やすい場合は、糖質を控えめにしてみましょう。続く場合は医師に相談を。',
        priority: 'high',
      });
    }

    // 5. 通院を確認
    const visits = storage.getMedicalVisits();
    if (visits.length === 0) {
      newAdvices.push({
        id: 'med1',
        category: 'general',
        icon: '🏥',
        title: '循環器内科の受診をおすすめします',
        message: `血圧が ${USER_PROFILE.medical.blood_pressure.systolic}/${USER_PROFILE.medical.blood_pressure.diastolic} と高い状態です。専門医に相談して、適切な治療を受けることが大切です。`,
        priority: 'high',
      });
    }

    // 6. 励ましのメッセージ
    const streak = storage.getStreakDays();
    if (streak >= 3) {
      newAdvices.push({
        id: 'gen1',
        category: 'general',
        icon: '🔥',
        title: `${streak}日連続で記録中！`,
        message: '継続は力なり！毎日の積み重ねが健康につながります。この調子で頑張りましょう！',
        priority: 'low',
      });
    }

    // 優先度でソート
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    newAdvices.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    setAdvices(newAdvices);
    setIsLoading(false);
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'blood_pressure': return 'bg-red-50 border-red-200';
      case 'diet': return 'bg-green-50 border-green-200';
      case 'exercise': return 'bg-blue-50 border-blue-200';
      case 'sleep': return 'bg-purple-50 border-purple-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-amber-100 text-amber-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">アドバイスを考え中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">AIトレーナー</h1>
        <p className="text-gray-600">{greeting}今日のアドバイスです</p>
      </header>

      {/* トレーナーカード */}
      <Card className="mb-6 bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="flex items-center gap-4">
          <span className="text-5xl">🤖</span>
          <div>
            <p className="font-bold text-gray-800">からだリズム トレーナー</p>
            <p className="text-sm text-gray-600">
              あなたの記録を分析して、今日やるべきことをお伝えします
            </p>
          </div>
        </div>
      </Card>

      {/* アドバイス一覧 */}
      <div className="space-y-3">
        {advices.map((advice) => (
          <Card
            key={advice.id}
            className={`border ${getCategoryColor(advice.category)}`}
          >
            <div className="flex gap-3">
              <span className="text-3xl">{advice.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-800">{advice.title}</h3>
                  {advice.priority !== 'low' && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityBadge(advice.priority)}`}>
                      {advice.priority === 'high' ? '重要' : '確認'}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{advice.message}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 更新ボタン */}
      <div className="mt-6">
        <Button onClick={generateAdvice} fullWidth variant="secondary">
          🔄 アドバイスを更新
        </Button>
      </div>

      {/* 免責事項 */}
      <p className="text-xs text-gray-400 text-center mt-6">
        ※このアドバイスは参考情報です。
        <br />
        医療的な判断は必ず医師にご相談ください。
      </p>
    </div>
  );
}
