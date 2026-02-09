'use client';

import React, { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import BPInput from '@/components/medical/BPInput';
import Toast from '@/components/ui/Toast';
import { BloodPressure } from '@/types';

export default function BloodPressurePage() {
  const [records, setRecords] = useState<BloodPressure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchRecords();
  }, []);

  async function fetchRecords() {
    try {
      const res = await fetch('/api/blood-pressure?limit=30');
      const data = await res.json();
      if (data.success) {
        setRecords(data.data);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSubmit = async (data: {
    systolic: number;
    diastolic: number;
    pulse?: number;
    timing: 'morning' | 'evening';
  }) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/blood-pressure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (result.success) {
        setToast({ message: '記録しました！', type: 'success' });
        fetchRecords();
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

  const getBPColor = (systolic: number, diastolic: number) => {
    if (systolic >= 160 || diastolic >= 100) return 'text-red-600';
    if (systolic >= 140 || diastolic >= 90) return 'text-orange-600';
    if (systolic >= 130 || diastolic >= 85) return 'text-amber-600';
    return 'text-green-600';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">血圧記録</h1>
        <p className="text-gray-600">朝と夜、2回測定を目標に</p>
      </header>

      {/* 入力フォーム */}
      <Card className="mb-6">
        <h2 className="font-bold text-gray-800 mb-4">血圧を記録する</h2>
        <BPInput onSubmit={handleSubmit} isLoading={isSaving} />
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
            {records.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
              >
                <div>
                  <p className="text-sm text-gray-500">
                    {formatDate(record.measured_at)}
                    {record.timing && (
                      <span className="ml-2">
                        {record.timing === 'morning' ? '🌅 朝' : '🌙 夜'}
                      </span>
                    )}
                  </p>
                  <p className={`text-xl font-bold ${getBPColor(record.systolic, record.diastolic)}`}>
                    {record.systolic}/{record.diastolic}
                    {record.pulse && (
                      <span className="text-sm text-gray-500 ml-2">
                        脈拍 {record.pulse}
                      </span>
                    )}
                  </p>
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
