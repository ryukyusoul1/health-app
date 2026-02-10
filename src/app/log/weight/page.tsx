'use client';

import React, { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import { WeightLog } from '@/types';
import { USER_PROFILE } from '@/lib/constants';
import * as storage from '@/lib/storage';

export default function WeightPage() {
  const [records, setRecords] = useState<WeightLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [weight, setWeight] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!storage.isInitialized()) {
      storage.initializeData();
    }
    fetchRecords();
  }, []);

  function fetchRecords() {
    try {
      const data = storage.getWeightRecords(30);
      setRecords(data);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight) return;

    setIsSaving(true);
    try {
      storage.addWeight({
        weight_kg: parseFloat(weight),
        logged_at: new Date().toISOString(),
        measured_at: new Date().toISOString(),
      });
      setToast({ message: '記録しました！', type: 'success' });
      setWeight('');
      fetchRecords();
    } catch (error) {
      console.error('Save error:', error);
      setToast({ message: 'エラーが発生しました', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const latestWeight = records[0]?.weight_kg || USER_PROFILE.weight_kg;
  const startWeight = USER_PROFILE.weight_kg;
  const goalWeight = 100;
  const weightLoss = startWeight - latestWeight;
  const remainingToGoal = latestWeight - goalWeight;

  return (
    <div className="p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">体重記録</h1>
        <p className="text-gray-600">週に1回の記録を目標に</p>
      </header>

      {/* 進捗カード */}
      <Card className="mb-6 bg-primary/5">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">現在の体重</p>
          <p className="text-4xl font-bold text-gray-800 mb-4">
            {latestWeight.toFixed(1)} <span className="text-lg">kg</span>
          </p>
          <div className="flex justify-around text-sm">
            <div>
              <p className="text-gray-500">スタート時</p>
              <p className="font-bold">{startWeight} kg</p>
            </div>
            <div>
              <p className="text-gray-500">減量</p>
              <p className={`font-bold ${weightLoss > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                {weightLoss > 0 ? '-' : ''}{weightLoss.toFixed(1)} kg
              </p>
            </div>
            <div>
              <p className="text-gray-500">目標まで</p>
              <p className="font-bold text-primary">
                あと {remainingToGoal.toFixed(1)} kg
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* 入力フォーム */}
      <Card className="mb-6">
        <h2 className="font-bold text-gray-800 mb-4">体重を記録する</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">体重（kg）</label>
            <input
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="例: 108.5"
              className="w-full px-4 py-3 text-xl font-bold text-center rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
              required
            />
          </div>
          <Button type="submit" fullWidth disabled={isSaving || !weight}>
            {isSaving ? '記録中...' : '記録する'}
          </Button>
        </form>
      </Card>

      {/* 記録履歴 */}
      <Card>
        <h2 className="font-bold text-gray-800 mb-4">記録履歴</h2>
        {isLoading ? (
          <div className="text-center py-4">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : records.length === 0 ? (
          <p className="text-gray-500 text-center py-4">まだ記録がありません</p>
        ) : (
          <div className="space-y-2">
            {records.map((record, index) => {
              const prev = records[index + 1];
              const diff = prev ? record.weight_kg - prev.weight_kg : 0;

              return (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                >
                  <div>
                    <p className="text-sm text-gray-500">
                      {new Date(record.measured_at).toLocaleDateString('ja-JP')}
                    </p>
                    <p className="text-xl font-bold text-gray-800">
                      {record.weight_kg.toFixed(1)} kg
                    </p>
                  </div>
                  {prev && (
                    <span className={`text-sm font-medium ${
                      diff < 0 ? 'text-green-600' : diff > 0 ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {diff > 0 ? '+' : ''}{diff.toFixed(1)} kg
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* トースト */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
