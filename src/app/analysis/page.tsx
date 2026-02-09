'use client';

import React, { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import { BloodPressure, WeightLog } from '@/types';

export default function AnalysisPage() {
  const [bpRecords, setBpRecords] = useState<BloodPressure[]>([]);
  const [weightRecords, setWeightRecords] = useState<WeightLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [bpRes, weightRes] = await Promise.all([
          fetch('/api/blood-pressure?limit=30'),
          fetch('/api/weight?limit=30'),
        ]);

        const bpData = await bpRes.json();
        const weightData = await weightRes.json();

        if (bpData.success) setBpRecords(bpData.data.reverse());
        if (weightData.success) setWeightRecords(weightData.data.reverse());
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  // 血圧の統計
  const bpStats = bpRecords.length > 0 ? {
    avgSystolic: Math.round(bpRecords.reduce((sum, r) => sum + r.systolic, 0) / bpRecords.length),
    avgDiastolic: Math.round(bpRecords.reduce((sum, r) => sum + r.diastolic, 0) / bpRecords.length),
    maxSystolic: Math.max(...bpRecords.map(r => r.systolic)),
    minSystolic: Math.min(...bpRecords.map(r => r.systolic)),
    count: bpRecords.length,
  } : null;

  // 体重の統計
  const weightStats = weightRecords.length > 0 ? {
    latest: weightRecords[weightRecords.length - 1].weight_kg,
    oldest: weightRecords[0].weight_kg,
    change: weightRecords[weightRecords.length - 1].weight_kg - weightRecords[0].weight_kg,
    count: weightRecords.length,
  } : null;

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">分析</h1>
        <p className="text-gray-600">過去のデータを振り返りましょう</p>
      </header>

      {/* 血圧統計 */}
      <Card className="mb-4">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>💓</span>
          血圧の推移
        </h2>
        {bpStats ? (
          <>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-gray-50 rounded-xl text-center">
                <p className="text-xs text-gray-500">平均値</p>
                <p className="text-xl font-bold text-gray-800">
                  {bpStats.avgSystolic}/{bpStats.avgDiastolic}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl text-center">
                <p className="text-xs text-gray-500">記録回数</p>
                <p className="text-xl font-bold text-gray-800">{bpStats.count}回</p>
              </div>
            </div>

            {/* 簡易グラフ */}
            <div className="h-40 flex items-end gap-1 overflow-x-auto">
              {bpRecords.slice(-14).map((record, i) => {
                const height = ((record.systolic - 80) / 100) * 100;
                return (
                  <div
                    key={i}
                    className="flex-1 min-w-4 bg-primary/20 rounded-t relative"
                    style={{ height: `${Math.max(height, 10)}%` }}
                  >
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-primary rounded-t"
                      style={{ height: `${((record.diastolic - 80) / 100) * 100}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              最近14回の記録（上: 収縮期、下: 拡張期）
            </p>
          </>
        ) : (
          <p className="text-gray-500 text-center py-4">血圧の記録がありません</p>
        )}
      </Card>

      {/* 体重統計 */}
      <Card className="mb-4">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>⚖️</span>
          体重の推移
        </h2>
        {weightStats ? (
          <>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-3 bg-gray-50 rounded-xl text-center">
                <p className="text-xs text-gray-500">現在</p>
                <p className="text-xl font-bold text-gray-800">
                  {weightStats.latest.toFixed(1)}kg
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl text-center">
                <p className="text-xs text-gray-500">変化</p>
                <p className={`text-xl font-bold ${
                  weightStats.change < 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {weightStats.change > 0 ? '+' : ''}{weightStats.change.toFixed(1)}kg
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl text-center">
                <p className="text-xs text-gray-500">記録回数</p>
                <p className="text-xl font-bold text-gray-800">{weightStats.count}回</p>
              </div>
            </div>

            {/* 簡易グラフ */}
            <div className="h-40 flex items-end gap-1 overflow-x-auto">
              {weightRecords.map((record, i) => {
                const minW = Math.min(...weightRecords.map(r => r.weight_kg)) - 5;
                const maxW = Math.max(...weightRecords.map(r => r.weight_kg)) + 5;
                const height = ((record.weight_kg - minW) / (maxW - minW)) * 100;
                return (
                  <div
                    key={i}
                    className="flex-1 min-w-4 bg-blue-500 rounded-t"
                    style={{ height: `${height}%` }}
                  />
                );
              })}
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              記録期間の体重推移
            </p>
          </>
        ) : (
          <p className="text-gray-500 text-center py-4">体重の記録がありません</p>
        )}
      </Card>

      {/* アドバイス */}
      <Card className="bg-primary/5">
        <h2 className="font-bold text-primary mb-3 flex items-center gap-2">
          <span>💡</span>
          今後のポイント
        </h2>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span>•</span>
            <span>血圧は朝と夜、毎日2回測定するのが理想です</span>
          </li>
          <li className="flex items-start gap-2">
            <span>•</span>
            <span>体重は週に1回、同じ条件で測定しましょう</span>
          </li>
          <li className="flex items-start gap-2">
            <span>•</span>
            <span>減塩を続けると、2〜4週間で血圧に変化が現れることがあります</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
