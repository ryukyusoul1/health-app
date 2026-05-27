'use client';

import React, { useEffect, useState, useRef } from 'react';
import Card from '@/components/ui/Card';
import Toast from '@/components/ui/Toast';
import { USER_PROFILE, NUTRITION_TARGETS } from '@/lib/constants';
import * as storage from '@/lib/storage';
import * as cloud from '@/lib/cloud-backup';
import type { BodyComposition } from '@/types';

// localStorage に保存されてる health-app 関連キー
const HEALTH_KEYS = [
  'health_blood_pressure',
  'health_weight',
  'health_food_log',
  'health_condition',
  'health_recipes',
  'health_eating_out',
  'health_medical_visits',
  'health_missions',
  'health_user_missions',
  'health_custom_foods',
  'health_exercise_log',
  'health_body_composition',
  'health_initialized',
  'health_ai_chat_history',
  'health_body_comp_backup_v1',
  'health_body_comp_migration_v1',
];

// 私が手元に持ってる 5/25–27 の体組成データ（スクショより）
const SCREENSHOT_RESTORE_DATA: Omit<BodyComposition, 'id' | 'created_at'>[] = [
  { measured_date: '2026-05-25', weight_kg: 99.0, body_fat_pct: 29.5, visceral_fat_level: 23, skeletal_muscle_pct: 29.6, body_age: 62, basal_metabolism: 2028, bmi: 34.3 },
  { measured_date: '2026-05-26', weight_kg: 99.2, body_fat_pct: 29.8, visceral_fat_level: 23, skeletal_muscle_pct: 29.4, body_age: 63, basal_metabolism: 2028, bmi: 34.3 },
  { measured_date: '2026-05-27', weight_kg: 99.7, body_fat_pct: 28.4, visceral_fat_level: 24, skeletal_muscle_pct: 30.2, body_age: 62, basal_metabolism: 2049, bmi: 34.5 },
];

export default function SettingsPage() {
  const profile = USER_PROFILE;
  const targets = NUTRITION_TARGETS;
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [stats, setStats] = useState<{ key: string; count: number; size: number }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // クラウドバックアップ
  const [deviceId, setDeviceId] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [restoreInput, setRestoreInput] = useState('');

  useEffect(() => {
    setDeviceId(cloud.getOrCreateDeviceId());
    setEmailInput(cloud.getStoredEmail());
    setLastSync(cloud.getLastSyncAt());
  }, []);

  async function handleCloudSync() {
    if (isSyncing) return;
    setIsSyncing(true);
    // メールアドレスを先に保存
    if (emailInput.trim()) cloud.setStoredEmail(emailInput.trim());
    const result = await cloud.syncToCloud();
    setIsSyncing(false);
    if (result.ok) {
      setLastSync(cloud.getLastSyncAt());
      setToast({ message: `サーバに保存しました（${((result.size || 0) / 1024).toFixed(1)} KB）`, type: 'success' });
    } else {
      setToast({ message: `同期失敗: ${result.error}`, type: 'error' });
    }
  }

  async function handleCloudRestore(by: 'email' | 'device_id') {
    const key = restoreInput.trim();
    if (!key) {
      setToast({ message: by === 'email' ? 'メールアドレスを入力してください' : 'デバイスIDを入力してください', type: 'error' });
      return;
    }
    if (!confirm(`サーバから ${by === 'email' ? 'メール' : 'デバイスID'} で復元します。現在のローカルデータは上書きされます。よろしいですか？`)) return;
    const backup = await cloud.fetchFromCloud(by === 'email' ? { email: key } : { device_id: key });
    if (!backup) {
      setToast({ message: 'バックアップが見つかりませんでした', type: 'error' });
      return;
    }
    const n = cloud.applyCloudBackup(backup);
    setToast({ message: `${n} 個のデータセットを復元しました（${backup.created_at} 時点）`, type: 'success' });
    loadStats();
  }

  function loadStats() {
    if (typeof window === 'undefined') return;
    const next: { key: string; count: number; size: number }[] = [];
    for (const key of HEALTH_KEYS) {
      const raw = localStorage.getItem(key);
      let count = 0;
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) count = parsed.length;
          else if (parsed && typeof parsed === 'object') count = Object.keys(parsed).length;
        } catch { count = 0; }
      }
      next.push({ key, count, size: raw ? new Blob([raw]).size : 0 });
    }
    setStats(next);
  }

  useEffect(() => { loadStats(); }, []);

  function handleExport() {
    if (typeof window === 'undefined') return;
    const dump: Record<string, unknown> = {};
    for (const key of HEALTH_KEYS) {
      const raw = localStorage.getItem(key);
      if (raw) {
        try { dump[key] = JSON.parse(raw); }
        catch { dump[key] = raw; }
      }
    }
    const payload = {
      app: 'karada-rhythm',
      version: 1,
      exported_at: new Date().toISOString(),
      data: dump,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const yyyymmdd = storage.toLocalDateString().replace(/-/g, '');
    a.href = url;
    a.download = `karada-rhythm-backup-${yyyymmdd}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToast({ message: 'バックアップを書き出しました', type: 'success' });
  }

  function handleImportFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || '');
        const parsed = JSON.parse(text);
        const data = (parsed && parsed.data) || parsed;
        if (!data || typeof data !== 'object') throw new Error('format');
        let restored = 0;
        for (const key of HEALTH_KEYS) {
          if (key in data) {
            localStorage.setItem(key, JSON.stringify(data[key]));
            restored++;
          }
        }
        setToast({ message: `${restored} 個のデータセットを復元しました`, type: 'success' });
        loadStats();
      } catch {
        setToast({ message: 'JSONの読み込みに失敗しました', type: 'error' });
      }
    };
    reader.readAsText(file);
  }

  function handleRestoreScreenshots() {
    if (!confirm('5/25・5/26・5/27 の体組成データを上書き登録します。よろしいですか？')) return;
    SCREENSHOT_RESTORE_DATA.forEach(d => storage.saveBodyComposition(d));
    setToast({ message: '3日分のデータを登録しました', type: 'success' });
    loadStats();
  }

  function totalSize() {
    return stats.reduce((s, x) => s + x.size, 0);
  }
  function totalCount() {
    return stats.reduce((s, x) => s + x.count, 0);
  }

  return (
    <div className="p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">設定</h1>
      </header>

      {/* クラウド自動バックアップ */}
      <Card className="mb-4 bg-sky-50 border border-sky-200">
        <h2 className="font-bold text-sky-900 mb-3 flex items-center gap-2">
          <span>☁️</span>
          自動クラウドバックアップ
        </h2>
        <p className="text-xs text-sky-900/70 mb-3">
          アプリ起動時、前回から 30 日経過していたら自動で divID サーバ（core.div-id.jp）に
          全データをバックアップ送信します。iOS が localStorage を消しても復元可能。
        </p>

        <div className="bg-white/70 rounded-xl p-3 mb-3 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">最終同期</span>
            <span className="font-medium text-gray-800">
              {lastSync ? lastSync.toLocaleString('ja-JP') : '未同期'}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">デバイスID</span>
            <span className="font-mono text-[10px] text-gray-800 break-all">{deviceId}</span>
          </div>
        </div>

        <label className="block text-xs text-sky-900 font-medium mb-1">
          復元用メールアドレス（任意・推奨）
        </label>
        <input
          type="email"
          value={emailInput}
          onChange={e => setEmailInput(e.target.value)}
          placeholder="you@example.com"
          className="w-full px-3 py-2 mb-3 text-sm border border-sky-200 rounded-lg bg-white"
        />

        <button
          type="button"
          onClick={handleCloudSync}
          disabled={isSyncing}
          className="w-full px-3 py-2 mb-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 disabled:opacity-50"
        >
          {isSyncing ? '同期中...' : '☁️ 今すぐサーバに送信'}
        </button>

        <details className="mt-2">
          <summary className="cursor-pointer text-xs text-sky-700 font-medium">サーバから復元する</summary>
          <div className="mt-2 space-y-2">
            <input
              type="text"
              value={restoreInput}
              onChange={e => setRestoreInput(e.target.value)}
              placeholder="メールアドレス または デバイスID"
              className="w-full px-3 py-2 text-sm border border-sky-200 rounded-lg bg-white"
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleCloudRestore('email')}
                className="px-3 py-2 bg-white text-sky-700 border border-sky-300 rounded-lg text-xs font-medium hover:bg-sky-100"
              >
                メールで復元
              </button>
              <button
                type="button"
                onClick={() => handleCloudRestore('device_id')}
                className="px-3 py-2 bg-white text-sky-700 border border-sky-300 rounded-lg text-xs font-medium hover:bg-sky-100"
              >
                デバイスIDで復元
              </button>
            </div>
          </div>
        </details>

        <p className="text-[10px] text-sky-700/60 mt-3 text-center">
          ※ 同一デバイスの過去3件まで保持されます
        </p>
      </Card>

      {/* データ管理（手動エクスポート/インポート） */}
      <Card className="mb-4 bg-rose-50 border border-rose-200">
        <h2 className="font-bold text-rose-900 mb-3 flex items-center gap-2">
          <span>💾</span>
          手動バックアップ（JSON書き出し / 読み込み）
        </h2>
        <p className="text-xs text-rose-900/70 mb-3">
          自動同期と別に、手動で JSON ファイルとして書き出し・読み込みもできます。
        </p>

        {/* 現状の保存量 */}
        <div className="bg-white/70 rounded-xl p-3 mb-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-800">保存中のデータ</span>
            <span className="text-xs text-gray-500">
              {totalCount()} 件 / {(totalSize() / 1024).toFixed(1)} KB
            </span>
          </div>
          <div className="space-y-1 text-xs">
            {stats.filter(s => s.count > 0).map(s => (
              <div key={s.key} className="flex justify-between text-gray-600">
                <span className="font-mono text-[10px]">{s.key.replace('health_', '')}</span>
                <span>{s.count} 件 / {(s.size / 1024).toFixed(1)} KB</span>
              </div>
            ))}
            {stats.every(s => s.count === 0) && (
              <p className="text-rose-700 text-center py-2">⚠️ データが空です</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-2">
          <button
            type="button"
            onClick={handleExport}
            className="px-3 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700"
          >
            📤 書き出し
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 bg-white text-rose-700 border border-rose-300 rounded-lg text-sm font-medium hover:bg-rose-100"
          >
            📥 読み込み
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) handleImportFile(f);
            e.target.value = '';
          }}
        />

        <button
          type="button"
          onClick={handleRestoreScreenshots}
          className="w-full px-3 py-2 bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-medium hover:bg-amber-200"
        >
          🆘 5/25・5/26・5/27 の体組成データを緊急復元
        </button>
        <p className="text-[10px] text-amber-700 mt-1 text-center">
          ※ 過去のスクショから取得した値（体重・体脂肪・内臓脂肪・骨格筋・体年齢・基礎代謝・BMI）を上書きします
        </p>
      </Card>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* プロファイル */}
      <Card className="mb-4">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>👤</span>
          プロファイル
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">年齢</span>
            <span className="font-medium">{profile.age}歳</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">身長</span>
            <span className="font-medium">{profile.height_cm}cm</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">目標体重</span>
            <span className="font-medium">100kg（まず10kg減）</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-600">生活スタイル</span>
            <span className="font-medium">{profile.lifestyle.cooking_style}</span>
          </div>
        </div>
      </Card>

      {/* 栄養目標 */}
      <Card className="mb-4">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>🎯</span>
          1日の栄養目標
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">塩分</span>
            <span className="font-medium text-primary">{targets.salt_g}g以下</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">糖質</span>
            <span className="font-medium">{targets.carbs_g}g以下</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">カロリー</span>
            <span className="font-medium">{targets.calories}kcal</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">たんぱく質</span>
            <span className="font-medium">{targets.protein_g}g以上</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-600">食物繊維</span>
            <span className="font-medium">{targets.fiber_g}g以上</span>
          </div>
        </div>
      </Card>

      {/* 健康上の注意点 */}
      <Card className="mb-4 bg-amber-50">
        <h2 className="font-bold text-amber-700 mb-4 flex items-center gap-2">
          <span>⚠️</span>
          健康上の注意点
        </h2>
        <ul className="space-y-2 text-sm text-gray-700">
          {profile.medical.symptoms.map((symptom, i) => (
            <li key={i} className="flex items-start gap-2">
              <span>•</span>
              <span>{symptom}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* 目標 */}
      <Card className="mb-4 bg-primary/5">
        <h2 className="font-bold text-primary mb-4 flex items-center gap-2">
          <span>🎯</span>
          あなたの目標
        </h2>
        <ul className="space-y-2 text-sm text-gray-700">
          {profile.goals.map((goal, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>{goal}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* アプリ情報 */}
      <Card>
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>ℹ️</span>
          アプリ情報
        </h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">アプリ名</span>
            <span className="font-medium">からだリズム</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">バージョン</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <p className="text-gray-500 text-xs pt-2">
            このアプリは医療アドバイスを提供するものではありません。
            健康上の懸念がある場合は、必ず医師にご相談ください。
          </p>
        </div>
      </Card>
    </div>
  );
}
