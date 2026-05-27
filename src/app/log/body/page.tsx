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
  const [selectedDate, setSelectedDate] = useState(storage.toLocalDateString());
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

  // 単純線形回帰: { slope: 1日あたりの変化量, intercept }
  function linearTrend(points: { x: number; y: number }[]): { slope: number; intercept: number } | null {
    if (points.length < 2) return null;
    const n = points.length;
    const sumX = points.reduce((s, p) => s + p.x, 0);
    const sumY = points.reduce((s, p) => s + p.y, 0);
    const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
    const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
    const denom = n * sumX2 - sumX * sumX;
    if (denom === 0) return null;
    const slope = (n * sumXY - sumX * sumY) / denom;
    const intercept = (sumY - slope * sumX) / n;
    return { slope, intercept };
  }

  // 5日ごとの予測点数（30日先まで）
  const PREDICT_INTERVAL = 5;
  const PREDICT_STEPS = 6;

  // グラフデータ（実データ + 5日ごとの予測点）
  const graphData = useMemo(() => {
    const now = new Date();
    const periodDays = { '1m': 30, '3m': 90, '6m': 180, '1y': 365 }[graphPeriod];
    const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

    const inPeriod = records
      .filter(r => new Date(r.measured_date) >= startDate)
      .sort((a, b) => new Date(a.measured_date).getTime() - new Date(b.measured_date).getTime());

    type Row = {
      date: string;
      weight_kg?: number | null; body_fat_pct?: number | null; visceral_fat_level?: number | null;
      skeletal_muscle_pct?: number | null; body_age?: number | null; basal_metabolism?: number | null; bmi?: number | null;
      weight_kg_pred?: number | null; body_fat_pct_pred?: number | null; visceral_fat_level_pred?: number | null;
      skeletal_muscle_pct_pred?: number | null; body_age_pred?: number | null; basal_metabolism_pred?: number | null; bmi_pred?: number | null;
    };

    const actual: Row[] = inPeriod.map(r => ({
      date: r.measured_date.slice(5),
      weight_kg: r.weight_kg,
      body_fat_pct: r.body_fat_pct,
      visceral_fat_level: r.visceral_fat_level,
      skeletal_muscle_pct: r.skeletal_muscle_pct,
      body_age: r.body_age,
      basal_metabolism: r.basal_metabolism,
      bmi: r.bmi,
    }));

    if (inPeriod.length < 2) return actual;

    // 期間内データから各指標のトレンドを計算
    const baseTime = new Date(inPeriod[0].measured_date).getTime();
    const dayIdx = (dateStr: string) => Math.round((new Date(dateStr).getTime() - baseTime) / 86400000);
    const lastDayIdx = dayIdx(inPeriod[inPeriod.length - 1].measured_date);

    const metrics: GraphMetric[] = ['weight_kg', 'body_fat_pct', 'visceral_fat_level', 'skeletal_muscle_pct', 'body_age', 'basal_metabolism', 'bmi'];
    const trends: Partial<Record<GraphMetric, { slope: number; intercept: number }>> = {};
    metrics.forEach(m => {
      const pts: { x: number; y: number }[] = [];
      inPeriod.forEach(r => {
        const v = r[m];
        if (v != null) pts.push({ x: dayIdx(r.measured_date), y: v });
      });
      const t = linearTrend(pts);
      if (t) trends[m] = t;
    });

    // 最後の実データに予測ラインの始点をくっつける（連続表示）
    const lastActual = actual[actual.length - 1];
    metrics.forEach(m => {
      const v = lastActual[m];
      if (v != null) (lastActual as Row)[`${m}_pred` as keyof Row] = v as never;
    });

    // 5日ごとの予測点を生成
    const lastDate = new Date(inPeriod[inPeriod.length - 1].measured_date);
    const future: Row[] = [];
    for (let i = 1; i <= PREDICT_STEPS; i++) {
      const d = new Date(lastDate.getTime() + i * PREDICT_INTERVAL * 86400000);
      const row: Row = { date: d.toISOString().slice(5, 10) };
      metrics.forEach(m => {
        const t = trends[m];
        if (t) {
          const x = lastDayIdx + i * PREDICT_INTERVAL;
          (row as Row)[`${m}_pred` as keyof Row] = (t.intercept + t.slope * x) as never;
        }
      });
      future.push(row);
    }

    return [...actual, ...future];
  }, [records, graphPeriod]);

  // 予測サマリー（選択中メトリクスの 5/10/.../30日後の値）
  const predictionSummary = useMemo(() => {
    if (graphData.length < 2) return null;
    const futurePoints = graphData.slice(-PREDICT_STEPS);
    if (futurePoints.length === 0) return null;
    return selectedMetrics.map(m => {
      const points = futurePoints.map((p, i) => {
        const raw = (p as unknown as Record<string, unknown>)[`${m}_pred`];
        const value = typeof raw === 'number' ? raw : null;
        return { days: (i + 1) * PREDICT_INTERVAL, value };
      });
      const latestActual = records[0]?.[m];
      const finalPredicted = points[points.length - 1].value;
      const totalChange = (latestActual != null && finalPredicted != null) ? (finalPredicted - latestActual) : null;
      return { metric: m, points, latestActual, totalChange };
    });
  }, [graphData, selectedMetrics, records]);

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
                  onClick={() => setSelectedDate(storage.toLocalDateString())}
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
                    const isToday = dateStr === storage.toLocalDateString();
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

          {/* グラフ（指標ごとに個別表示） */}
          {graphData.length < 2 ? (
            <Card className="mb-4">
              <p className="text-gray-400 text-sm text-center py-8">
                グラフ表示には2日分以上のデータが必要です
              </p>
            </Card>
          ) : (
            selectedMetrics.map(m => {
              const values = graphData.map(d => d[m]).filter((v): v is number => v != null);
              if (values.length < 2) return null;
              const min = Math.min(...values);
              const max = Math.max(...values);
              const padding = Math.max((max - min) * 0.2, 0.5);
              const yMin = Math.floor((min - padding) * 10) / 10;
              const yMax = Math.ceil((max + padding) * 10) / 10;
              return (
                <Card key={m} className="mb-4">
                  <h4 className="text-sm font-bold mb-2" style={{ color: METRIC_COLORS[m] }}>
                    {METRIC_LABELS[m]}
                  </h4>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={graphData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis domain={[yMin, yMax]} tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey={m}
                          name={METRIC_LABELS[m]}
                          stroke={METRIC_COLORS[m]}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          connectNulls
                        />
                        <Line
                          type="monotone"
                          dataKey={`${m}_pred`}
                          name={`${METRIC_LABELS[m]}（予測）`}
                          stroke={METRIC_COLORS[m]}
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          strokeOpacity={0.6}
                          dot={{ r: 3, strokeWidth: 1, fill: '#fff' }}
                          connectNulls
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              );
            })
          )}
          {graphData.length >= 2 && (
            <Card className="mb-4">
              <p className="text-gray-400 text-xs text-center">
                ※ 実線＝実データ、点線＝今のペースで進んだ場合の予測（5日ごと、30日先まで）
              </p>
            </Card>
          )}

          {/* 5日ごと予測サマリー */}
          {predictionSummary && predictionSummary.some(p => p.points.some(pt => pt.value != null)) && (
            <Card className="mb-4 bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200">
              <h3 className="font-bold text-rose-900 mb-3 flex items-center gap-2">
                <span>🔮</span>
                <span>このペースだと…（5日ごとの予測）</span>
              </h3>
              <div className="space-y-3">
                {predictionSummary.map(({ metric, points, latestActual, totalChange }) => {
                  const validPoints = points.filter(p => p.value != null);
                  if (validPoints.length === 0) return null;
                  return (
                    <div key={metric} className="bg-white/60 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold" style={{ color: METRIC_COLORS[metric] }}>
                          {METRIC_LABELS[metric]}
                        </span>
                        {latestActual != null && totalChange != null && (
                          <span className={`text-xs font-bold ${totalChange < 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                            30日後: {totalChange > 0 ? '+' : ''}{totalChange.toFixed(metric === 'body_age' || metric === 'visceral_fat_level' || metric === 'basal_metabolism' ? 0 : 2)}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-6 gap-1 text-center">
                        {points.map((p, i) => (
                          <div key={i} className="text-[10px]">
                            <div className="text-gray-500">+{p.days}日</div>
                            <div className="font-bold text-gray-800">
                              {p.value != null
                                ? (metric === 'body_age' || metric === 'visceral_fat_level' || metric === 'basal_metabolism'
                                    ? Math.round(p.value)
                                    : p.value.toFixed(1))
                                : '—'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-rose-700/70 mt-3 text-center">
                ※ 表示中の期間（{graphPeriod === '1m' ? '1ヶ月' : graphPeriod === '3m' ? '3ヶ月' : graphPeriod === '6m' ? '6ヶ月' : '1年'}）の傾向から線形回帰で算出
              </p>
            </Card>
          )}
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

      {/* 4/23以前の旧データ補正（体重計の表示異常分） */}
      <Card className="mt-6 bg-amber-50 border border-amber-200">
        <details>
          <summary className="cursor-pointer text-sm font-medium text-amber-900 select-none">
            ⚙️ 4/23以前の内臓脂肪・体年齢を補正する
          </summary>
          <div className="mt-3 text-xs text-amber-900 space-y-2">
            <p>
              体重計の表示異常で誤って低めに入っていた 2026/04/23 以前の
              「内臓脂肪レベル」「体年齢」を、現在値を基準にやんわり高めに
              （最古 +3、4/23 +1）線形補正します。1回限り。
            </p>
            <p className="text-amber-700">
              実行前のデータは内部にバックアップされます（後で取消可能）。
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (storage.isOldBodyCompMigrated()) {
                    setToast({ message: 'すでに補正済みです', type: 'error' });
                    return;
                  }
                  if (!confirm('4/23以前の内臓脂肪レベルと体年齢を補正します。よろしいですか？')) return;
                  const r = storage.migrateOldBodyComposition();
                  if (r.migrated > 0) {
                    setToast({ message: `${r.migrated}件を補正しました（基準: 内臓脂肪${r.baselineVisceral}・体年齢${r.baselineBodyAge}）`, type: 'success' });
                    loadRecords();
                  } else {
                    setToast({ message: '補正対象が見つかりませんでした', type: 'error' });
                  }
                }}
                className="px-3 py-2 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700"
              >
                補正を実行
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!confirm('補正前のデータに戻します。よろしいですか？')) return;
                  if (storage.restoreOldBodyCompositionBackup()) {
                    setToast({ message: '補正前のデータに戻しました', type: 'success' });
                    loadRecords();
                  } else {
                    setToast({ message: 'バックアップがありません', type: 'error' });
                  }
                }}
                className="px-3 py-2 bg-white text-amber-700 border border-amber-300 rounded-lg text-xs font-medium hover:bg-amber-100"
              >
                取り消す
              </button>
            </div>
          </div>
        </details>
      </Card>

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
