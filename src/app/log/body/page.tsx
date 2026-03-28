'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import { BodyComposition } from '@/types';
import * as storage from '@/lib/storage';
import { WEEKDAYS } from '@/lib/constants';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

type GraphMetric = 'weight_kg' | 'body_fat_pct' | 'visceral_fat_level' | 'skeletal_muscle_pct' | 'body_age' | 'basal_metabolism' | 'bmi';

const METRIC_LABELS: Record<GraphMetric, string> = {
  weight_kg: '体重 (kg)',
  body_fat_pct: '体脂肪率 (%)',
  visceral_fat_level: '内臓脂肪レベル',
  skeletal_muscle_pct: '骨格筋率 (%)',
  body_age: '体年齢 (歳)',
  basal_metabolism: '基礎代謝 (kcal)',
  bmi: 'BMI',
};

const METRIC_COLORS: Record<GraphMetric, string> = {
  weight_kg: '#5B8C5A',
  body_fat_pct: '#E57373',
  visceral_fat_level: '#FF9800',
  skeletal_muscle_pct: '#42A5F5',
  body_age: '#AB47BC',
  basal_metabolism: '#26A69A',
  bmi: '#78909C',
};

export default function BodyCompositionPage() {
  const [records, setRecords] = useState<BodyComposition[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState<GraphMetric[]>(['weight_kg', 'body_fat_pct']);
  const [graphPeriod, setGraphPeriod] = useState<'1m' | '3m' | '6m' | '1y'>('1m');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [tab, setTab] = useState<'input' | 'graph'>('input');

  // フォーム
  const [weightKg, setWeightKg] = useState('');
  const [bodyFatPct, setBodyFatPct] = useState('');
  const [visceralFatLevel, setVisceralFatLevel] = useState('');
  const [skeletalMusclePct, setSkeletalMusclePct] = useState('');
  const [bodyAge, setBodyAge] = useState('');
  const [basalMetabolism, setBasalMetabolism] = useState('');
  const [bmi, setBmi] = useState('');

  useEffect(() => {
    loadRecords();
  }, []);

  useEffect(() => {
    const existing = storage.getBodyCompositionByDate(selectedDate);
    if (existing) {
      setWeightKg(String(existing.weight_kg));
      setBodyFatPct(existing.body_fat_pct != null ? String(existing.body_fat_pct) : '');
      setVisceralFatLevel(existing.visceral_fat_level != null ? String(existing.visceral_fat_level) : '');
      setSkeletalMusclePct(existing.skeletal_muscle_pct != null ? String(existing.skeletal_muscle_pct) : '');
      setBodyAge(existing.body_age != null ? String(existing.body_age) : '');
      setBasalMetabolism(existing.basal_metabolism != null ? String(existing.basal_metabolism) : '');
      setBmi(existing.bmi != null ? String(existing.bmi) : '');
    } else {
      setWeightKg('');
      setBodyFatPct('');
      setVisceralFatLevel('');
      setSkeletalMusclePct('');
      setBodyAge('');
      setBasalMetabolism('');
      setBmi('');
    }
  }, [selectedDate]);

  function loadRecords() {
    setRecords(storage.getBodyCompositions());
  }

  function handleSave() {
    if (!weightKg) {
      setToast({ message: '体重を入力してください', type: 'error' });
      return;
    }

    storage.saveBodyComposition({
      measured_date: selectedDate,
      weight_kg: parseFloat(weightKg),
      body_fat_pct: bodyFatPct ? parseFloat(bodyFatPct) : null,
      visceral_fat_level: visceralFatLevel ? parseFloat(visceralFatLevel) : null,
      skeletal_muscle_pct: skeletalMusclePct ? parseFloat(skeletalMusclePct) : null,
      body_age: bodyAge ? parseInt(bodyAge) : null,
      basal_metabolism: basalMetabolism ? parseInt(basalMetabolism) : null,
      bmi: bmi ? parseFloat(bmi) : null,
    });

    setToast({ message: `${selectedDate} のデータを保存しました`, type: 'success' });
    loadRecords();
  }

  function handleDelete(id: string) {
    storage.deleteBodyComposition(id);
    setToast({ message: '削除しました', type: 'success' });
    loadRecords();
  }

  // カレンダー生成
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

  const recordDates = useMemo(() => new Set(records.map(r => r.measured_date)), [records]);

  function selectCalendarDate(day: number) {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    setShowCalendar(false);
  }

  // グラフデータ
  const graphData = useMemo(() => {
    const now = new Date();
    const periodDays = { '1m': 30, '3m': 90, '6m': 180, '1y': 365 }[graphPeriod];
    const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

    return records
      .filter(r => new Date(r.measured_date) >= startDate)
      .sort((a, b) => new Date(a.measured_date).getTime() - new Date(b.measured_date).getTime())
      .map(r => ({
        date: r.measured_date.slice(5),
        weight_kg: r.weight_kg,
        body_fat_pct: r.body_fat_pct,
        visceral_fat_level: r.visceral_fat_level,
        skeletal_muscle_pct: r.skeletal_muscle_pct,
        body_age: r.body_age,
        basal_metabolism: r.basal_metabolism,
        bmi: r.bmi,
      }));
  }, [records, graphPeriod]);

  function toggleMetric(m: GraphMetric) {
    setSelectedMetrics(prev =>
      prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
    );
  }

  const selectedDateObj = new Date(selectedDate + 'T00:00:00');
  const dateLabel = `${selectedDateObj.getMonth() + 1}月${selectedDateObj.getDate()}日（${WEEKDAYS[selectedDateObj.getDay()]}）`;
  const isExisting = records.some(r => r.measured_date === selectedDate);

  return (
    <div className="p-4 pb-24">
      <header className="mb-4">
        <h1 className="text-xl font-bold text-gray-800">体組成記録</h1>
        <p className="text-sm text-gray-500">体重計のデータを毎日記録</p>
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

            {/* カレンダー */}
            {showCalendar && (
              <div className="mt-4 border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}
                    className="p-1 text-gray-500"
                  >
                    ◀
                  </button>
                  <span className="font-medium text-gray-800">
                    {calendarMonth.getFullYear()}年{calendarMonth.getMonth() + 1}月
                  </span>
                  <button
                    onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}
                    className="p-1 text-gray-500"
                  >
                    ▶
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs">
                  {WEEKDAYS.map(d => (
                    <div key={d} className="text-gray-400 py-1">{d}</div>
                  ))}
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
                        onClick={() => selectCalendarDate(day)}
                        className={`py-1.5 rounded-lg text-sm relative ${
                          isSelected
                            ? 'bg-primary text-white font-bold'
                            : isToday
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'hover:bg-gray-100'
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
            <h3 className="font-bold text-gray-800 mb-3">
              {isExisting ? '記録を更新' : '新規記録'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 block mb-1">体重 (kg) *</label>
                <input
                  type="number"
                  step="0.1"
                  value={weightKg}
                  onChange={e => setWeightKg(e.target.value)}
                  placeholder="例: 85.5"
                  className="w-full p-3 border rounded-xl text-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">体脂肪率 (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={bodyFatPct}
                    onChange={e => setBodyFatPct(e.target.value)}
                    placeholder="例: 25.0"
                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">内臓脂肪レベル</label>
                  <input
                    type="number"
                    step="0.5"
                    value={visceralFatLevel}
                    onChange={e => setVisceralFatLevel(e.target.value)}
                    placeholder="例: 12"
                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">骨格筋率 (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={skeletalMusclePct}
                    onChange={e => setSkeletalMusclePct(e.target.value)}
                    placeholder="例: 30.0"
                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">体年齢 (歳)</label>
                  <input
                    type="number"
                    value={bodyAge}
                    onChange={e => setBodyAge(e.target.value)}
                    placeholder="例: 45"
                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">基礎代謝 (kcal)</label>
                  <input
                    type="number"
                    value={basalMetabolism}
                    onChange={e => setBasalMetabolism(e.target.value)}
                    placeholder="例: 1600"
                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">BMI</label>
                  <input
                    type="number"
                    step="0.1"
                    value={bmi}
                    onChange={e => setBmi(e.target.value)}
                    placeholder="例: 28.5"
                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                  />
                </div>
              </div>
            </div>
            <Button className="w-full mt-4" onClick={handleSave}>
              {isExisting ? '更新する' : '保存する'}
            </Button>
          </Card>

          {/* 最近の記録 */}
          <Card>
            <h3 className="font-bold text-gray-800 mb-3">最近の記録</h3>
            {records.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">まだ記録がありません</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {records.slice(0, 14).map(r => (
                  <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{r.measured_date}</p>
                      <p className="text-xs text-gray-500">
                        {r.weight_kg}kg
                        {r.body_fat_pct != null && ` / 体脂肪${r.body_fat_pct}%`}
                        {r.bmi != null && ` / BMI${r.bmi}`}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="text-xs text-red-400 hover:text-red-600"
                    >
                      削除
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      ) : (
        /* グラフタブ */
        <>
          {/* 期間選択 */}
          <div className="flex gap-2 mb-4">
            {(['1m', '3m', '6m', '1y'] as const).map(p => (
              <button
                key={p}
                onClick={() => setGraphPeriod(p)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${
                  graphPeriod === p ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {p === '1m' ? '1ヶ月' : p === '3m' ? '3ヶ月' : p === '6m' ? '6ヶ月' : '1年'}
              </button>
            ))}
          </div>

          {/* 指標選択 */}
          <Card className="mb-4">
            <p className="text-sm text-gray-600 mb-2">表示する項目（複数選択可）</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(METRIC_LABELS) as GraphMetric[]).map(m => (
                <button
                  key={m}
                  onClick={() => toggleMetric(m)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selectedMetrics.includes(m)
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                  style={selectedMetrics.includes(m) ? { backgroundColor: METRIC_COLORS[m] } : {}}
                >
                  {METRIC_LABELS[m]}
                </button>
              ))}
            </div>
          </Card>

          {/* グラフ */}
          <Card className="mb-4">
            {graphData.length < 2 ? (
              <p className="text-gray-400 text-sm text-center py-8">
                グラフ表示には2日分以上のデータが必要です
              </p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={graphData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    {selectedMetrics.map(m => (
                      <Line
                        key={m}
                        type="monotone"
                        dataKey={m}
                        name={METRIC_LABELS[m]}
                        stroke={METRIC_COLORS[m]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* 最新値サマリー */}
          {records.length > 0 && (
            <Card>
              <h3 className="font-bold text-gray-800 mb-3">最新データ</h3>
              <div className="grid grid-cols-2 gap-3">
                {records[0].weight_kg && (
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500">体重</p>
                    <p className="text-lg font-bold text-gray-800">{records[0].weight_kg} kg</p>
                  </div>
                )}
                {records[0].body_fat_pct != null && (
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500">体脂肪率</p>
                    <p className="text-lg font-bold text-gray-800">{records[0].body_fat_pct} %</p>
                  </div>
                )}
                {records[0].visceral_fat_level != null && (
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500">内臓脂肪</p>
                    <p className="text-lg font-bold text-gray-800">Lv.{records[0].visceral_fat_level}</p>
                  </div>
                )}
                {records[0].skeletal_muscle_pct != null && (
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500">骨格筋率</p>
                    <p className="text-lg font-bold text-gray-800">{records[0].skeletal_muscle_pct} %</p>
                  </div>
                )}
                {records[0].body_age != null && (
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500">体年齢</p>
                    <p className="text-lg font-bold text-gray-800">{records[0].body_age} 歳</p>
                  </div>
                )}
                {records[0].basal_metabolism != null && (
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500">基礎代謝</p>
                    <p className="text-lg font-bold text-gray-800">{records[0].basal_metabolism} kcal</p>
                  </div>
                )}
                {records[0].bmi != null && (
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500">BMI</p>
                    <p className="text-lg font-bold text-gray-800">{records[0].bmi}</p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </>
      )}

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
