'use client';

import React, { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import ConditionInput from '@/components/self-care/ConditionInput';
import Toast from '@/components/ui/Toast';
import { ConditionLog } from '@/types';
import { CONDITION_EMOJIS } from '@/lib/constants';

export default function ConditionPage() {
  const [todayCondition, setTodayCondition] = useState<ConditionLog | null>(null);
  const [records, setRecords] = useState<ConditionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [todayRes, historyRes] = await Promise.all([
        fetch(`/api/condition?date=${today}`),
        fetch('/api/condition?limit=14'),
      ]);

      const todayData = await todayRes.json();
      const historyData = await historyRes.json();

      if (todayData.success && todayData.data) {
        setTodayCondition(todayData.data);
      }
      if (historyData.success) {
        setRecords(historyData.data);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSubmit = async (data: {
    overall_score: number;
    palpitation: boolean;
    edema: boolean;
    fatigue_level: number;
    cpap_used: boolean;
    note?: string;
  }) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/condition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logged_date: today,
          ...data,
        }),
      });

      const result = await res.json();
      if (result.success) {
        setToast({ message: '記録しました！今日もお疲れさまでした', type: 'success' });
        fetchData();
      } else {
        setToast({ message: result.error || 'エラーが発生しました', type: 'error' });
      }
    } catch (error) {
      console.error('Save error:', error);
      setToast({ message: 'エラーが発生しました', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

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
        <h1 className="text-2xl font-bold text-gray-800">体調記録</h1>
        <p className="text-gray-600">今日の体調を記録しましょう</p>
      </header>

      {/* 入力フォーム */}
      <Card className="mb-6">
        <ConditionInput
          onSubmit={handleSubmit}
          isLoading={isSaving}
          initialData={todayCondition ? {
            overall_score: todayCondition.overall_score,
            palpitation: todayCondition.palpitation,
            edema: todayCondition.edema,
            fatigue_level: todayCondition.fatigue_level,
            cpap_used: todayCondition.cpap_used,
            note: todayCondition.note,
          } : undefined}
        />
      </Card>

      {/* 過去2週間の記録 */}
      <Card>
        <h2 className="font-bold text-gray-800 mb-4">過去2週間の記録</h2>
        {records.length === 0 ? (
          <p className="text-gray-500 text-center py-4">まだ記録がありません</p>
        ) : (
          <div className="space-y-2">
            {records.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {CONDITION_EMOJIS[record.overall_score]}
                  </span>
                  <div>
                    <p className="text-sm text-gray-500">
                      {new Date(record.logged_date).toLocaleDateString('ja-JP')}
                    </p>
                    <div className="flex gap-2 text-xs">
                      {record.palpitation && <span className="text-red-500">動悸</span>}
                      {record.edema && <span className="text-amber-500">むくみ</span>}
                      {record.cpap_used && <span className="text-green-500">CPAP✓</span>}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">疲労度</p>
                  <p className="font-medium">{record.fatigue_level}/5</p>
                </div>
              </div>
            ))}
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
