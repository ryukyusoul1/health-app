'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Card from '@/components/ui/Card';
import BPInput from '@/components/medical/BPInput';
import Toast from '@/components/ui/Toast';
import { BloodPressure } from '@/types';
import { WEEKDAYS } from '@/lib/constants';
import * as storage from '@/lib/storage';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';

export default function BloodPressurePage() {
  const [records, setRecords] = useState<BloodPressure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [tab, setTab] = useState<'input' | 'graph'>('input');
  const [graphPeriod, setGraphPeriod] = useState<'1w' | '1m' | '3m'>('1m');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  useEffect(() => {
    if (!storage.isInitialized()) {
      storage.initializeData();
    }
    fetchRecords();
  }, []);

  function fetchRecords() {
    try {
      const data = storage.getBloodPressureRecords();
      setRecords(data);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSubmit = (data: {
    systolic: number;
    diastolic: number;
    pulse?: number;
    timing: 'morning' | 'evening';
  }) => {
    setIsSaving(true);
    try {
      const dateObj = new Date(selectedDate + 'T' + new Date().toTimeString().slice(0, 8));
      storage.addBloodPressure({
        systolic: data.systolic,
        diastolic: data.diastolic,
        pulse: data.pulse,
        timing: data.timing,
        measured_at: dateObj.toISOString(),
      });
      setToast({ message: '記録しました！', type: 'success' });
      fetchRecords();
    } catch (error) {
      console.error('Save error:', error);
      setToast({ message: 'エラーが発生しました', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    storage.deleteBloodPressure(id);
    setToast({ message: '削除しました', type: 'success' });
    fetchRecords();
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

  // カレンダー
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [calendarMonth]);

  const recordDates = useMemo(() => {
    const dates = new Set<string>();
    records.forEach(r => {
      dates.add(new Date(r.measured_at).toISOString().split('T')[0]);
    });
    return dates;
  }, [records]);

  // グラフデータ
  const graphData = useMemo(() => {
    const now = new Date();
    const periodDays = { '1w': 7, '1m': 30, '3m': 90 }[graphPeriod];
    const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

    return records
      .filter(r => new Date(r.measured_at) >= startDate)
      .sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime())
      .map(r => ({
        date: formatDate(r.measured_at),
        systolic: r.systolic,
        diastolic: r.diastolic,
        pulse: r.pulse || null,
      }));
  }, [records, graphPeriod]);

  const selectedDateObj = new Date(selectedDate + 'T00:00:00');
  const dateLabel = `${selectedDateObj.getMonth() + 1}月${selectedDateObj.getDate()}日（${WEEKDAYS[selectedDateObj.getDay()]}）`;

  return (
    <div className="p-4 pb-24">
      <header className="mb-4">
        <h1 className="text-xl font-bold text-gray-800">血圧記録</h1>
        <p className="text-sm text-gray-500">朝と夜、2回測定を目標に</p>
      </header>

      {/* タブ */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('input')}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
            tab === 'input' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          入力
        </button>
        <button
          onClick={() => setTab('graph')}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
            tab === 'graph' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          グラフ
        </button>
      </div>

      {tab === 'input' ? (
        <>
          {/* 日付選択 */}
          <Card className="mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">記録日</p>
                <p className="text-lg font-bold text-gray-800">{dateLabel}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                  className="px-3 py-1.5 text-xs bg-primary/10 text-primary rounded-lg font-medium"
                >
                  今日
                </button>
                <button
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-lg font-medium"
                >
                  カレンダー
                </button>
              </div>
            </div>

            {showCalendar && (
              <div className="mt-4 border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))} className="p-1 text-gray-500">◀</button>
                  <span className="font-medium text-gray-800">{calendarMonth.getFullYear()}年{calendarMonth.getMonth() + 1}月</span>
                  <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))} className="p-1 text-gray-500">▶</button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs">
                  {WEEKDAYS.map(d => <div key={d} className="text-gray-400 py-1">{d}</div>)}
                  {calendarDays.map((day, i) => {
                    if (day === null) return <div key={`e${i}`} />;
                    const y = calendarMonth.getFullYear();
                    const m = calendarMonth.getMonth();
                    const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isSelected = dateStr === selectedDate;
                    const hasRecord = recordDates.has(dateStr);
                    const isToday = dateStr === new Date().toISOString().split('T')[0];
                    return (
                      <button
                        key={dateStr}
                        onClick={() => { setSelectedDate(dateStr); setShowCalendar(false); }}
                        className={`py-1.5 rounded-lg text-sm relative ${
                          isSelected ? 'bg-primary text-white font-bold' : isToday ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-gray-100'
                        }`}
                      >
                        {day}
                        {hasRecord && !isSelected && (
                          <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>

          {/* 入力フォーム */}
          <Card className="mb-4">
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
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {records.slice(0, 30).map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm text-gray-500">
                        {formatDate(record.measured_at)}
                        {record.timing && (
                          <span className="ml-2">{record.timing === 'morning' ? '朝' : '夜'}</span>
                        )}
                      </p>
                      <p className={`text-xl font-bold ${getBPColor(record.systolic, record.diastolic)}`}>
                        {record.systolic}/{record.diastolic}
                        {record.pulse && <span className="text-sm text-gray-500 ml-2">脈拍 {record.pulse}</span>}
                      </p>
                    </div>
                    <button onClick={() => handleDelete(record.id)} className="text-xs text-red-400 hover:text-red-600">削除</button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      ) : (
        /* グラフタブ */
        <>
          <div className="flex gap-2 mb-4">
            {(['1w', '1m', '3m'] as const).map(p => (
              <button
                key={p}
                onClick={() => setGraphPeriod(p)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${
                  graphPeriod === p ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {p === '1w' ? '1週間' : p === '1m' ? '1ヶ月' : '3ヶ月'}
              </button>
            ))}
          </div>

          <Card className="mb-4">
            <h3 className="font-bold text-gray-800 mb-3">血圧推移</h3>
            {graphData.length < 2 ? (
              <p className="text-gray-400 text-sm text-center py-8">グラフ表示には2件以上のデータが必要です</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={graphData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis domain={[(min: number) => Math.floor(min - 10), (max: number) => Math.ceil(max + 10)]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <ReferenceLine y={140} stroke="#EF4444" strokeDasharray="3 3" label={{ value: '高血圧', fontSize: 10 }} />
                    <ReferenceLine y={90} stroke="#F59E0B" strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="systolic" name="収縮期" stroke="#EF4444" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="diastolic" name="拡張期" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="pulse" name="脈拍" stroke="#8B5CF6" strokeWidth={1} dot={{ r: 2 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* 統計 */}
          {graphData.length > 0 && (
            <Card>
              <h3 className="font-bold text-gray-800 mb-3">統計</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-red-50 rounded-xl">
                  <p className="text-xs text-gray-500">収縮期 平均</p>
                  <p className="text-lg font-bold text-red-600">
                    {Math.round(graphData.reduce((s, d) => s + d.systolic, 0) / graphData.length)}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl">
                  <p className="text-xs text-gray-500">拡張期 平均</p>
                  <p className="text-lg font-bold text-blue-600">
                    {Math.round(graphData.reduce((s, d) => s + d.diastolic, 0) / graphData.length)}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500">最高値</p>
                  <p className="text-lg font-bold text-gray-800">
                    {Math.max(...graphData.map(d => d.systolic))}/{Math.max(...graphData.map(d => d.diastolic))}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500">最低値</p>
                  <p className="text-lg font-bold text-gray-800">
                    {Math.min(...graphData.map(d => d.systolic))}/{Math.min(...graphData.map(d => d.diastolic))}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
