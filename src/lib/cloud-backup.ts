'use client';

// ─────────────────────────────────────────────────────────
// Lolipop (core.div-id.jp) のバックアップAPIと連携する。
// 月1回（30日経過 or 未バックアップ）にアプリ起動時 auto-sync。
// 復元はメールアドレス or デバイスIDから可能。
// ─────────────────────────────────────────────────────────

const API_URL = 'https://core.div-id.jp/health-backup.php';
const LS_DEVICE_ID  = 'karada_cloud_device_id';
const LS_EMAIL      = 'karada_cloud_email';
const LS_LAST_SYNC  = 'karada_cloud_last_sync_at'; // ISO 日時
const AUTO_SYNC_DAYS = 30;

// 同期するキー一覧（settings の HEALTH_KEYS と揃える）
const SYNC_KEYS = [
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
  'health_ai_chat_history',
];

export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(LS_DEVICE_ID);
  if (!id) {
    // UUID v4 風（短め 16文字＋ハイフン）
    id = (crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36)).replace(/[^a-z0-9-]/gi, '').slice(0, 36);
    localStorage.setItem(LS_DEVICE_ID, id);
  }
  return id;
}

export function getStoredEmail(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(LS_EMAIL) || '';
}

export function setStoredEmail(email: string): void {
  if (typeof window === 'undefined') return;
  if (email) localStorage.setItem(LS_EMAIL, email);
  else localStorage.removeItem(LS_EMAIL);
}

export function getLastSyncAt(): Date | null {
  if (typeof window === 'undefined') return null;
  const iso = localStorage.getItem(LS_LAST_SYNC);
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

export function setLastSyncAt(date: Date): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LS_LAST_SYNC, date.toISOString());
}

export function shouldAutoBackup(): boolean {
  const last = getLastSyncAt();
  if (!last) return true;
  const ageMs = Date.now() - last.getTime();
  return ageMs >= AUTO_SYNC_DAYS * 86400000;
}

function collectLocalData(): Record<string, unknown> {
  const dump: Record<string, unknown> = {};
  for (const key of SYNC_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw) {
      try { dump[key] = JSON.parse(raw); }
      catch { dump[key] = raw; }
    }
  }
  return dump;
}

export async function syncToCloud(): Promise<{ ok: boolean; size?: number; error?: string }> {
  if (typeof window === 'undefined') return { ok: false, error: 'no_window' };
  const deviceId = getOrCreateDeviceId();
  const email    = getStoredEmail();
  const data     = collectLocalData();
  // ローカルにデータが何もない時は送信しない（空で上書きしないように）
  if (Object.keys(data).length === 0) {
    return { ok: false, error: 'no_local_data' };
  }
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id: deviceId, email, data }),
    });
    const j = await res.json();
    if (!j.ok) return { ok: false, error: String(j.error || 'sync_failed') };
    setLastSyncAt(new Date());
    return { ok: true, size: j.size };
  } catch (e) {
    return { ok: false, error: String((e as Error).message || 'fetch_failed') };
  }
}

export interface CloudBackupInfo {
  id: number;
  device_id: string;
  email: string | null;
  size_bytes: number;
  created_at: string;
  data: Record<string, unknown>;
}

export async function fetchFromCloud(by: { device_id?: string; email?: string }): Promise<CloudBackupInfo | null> {
  const params = new URLSearchParams();
  if (by.device_id) params.set('device_id', by.device_id);
  else if (by.email) params.set('email', by.email);
  else return null;
  try {
    const res = await fetch(`${API_URL}?${params.toString()}`);
    const j = await res.json();
    if (!j.ok || !j.backup) return null;
    return j.backup as CloudBackupInfo;
  } catch {
    return null;
  }
}

export function applyCloudBackup(backup: CloudBackupInfo): number {
  if (typeof window === 'undefined') return 0;
  const data = backup.data;
  if (!data || typeof data !== 'object') return 0;
  let restored = 0;
  for (const key of SYNC_KEYS) {
    if (key in data) {
      localStorage.setItem(key, JSON.stringify((data as Record<string, unknown>)[key]));
      restored++;
    }
  }
  return restored;
}

// アプリ起動時に呼び出す：30日経過してたら裏で自動同期
export async function autoBackupIfNeeded(): Promise<{ ran: boolean; result?: { ok: boolean; error?: string } }> {
  if (typeof window === 'undefined') return { ran: false };
  if (!shouldAutoBackup()) return { ran: false };
  // 同時実行防止のため簡易ロック
  const lockKey = 'karada_cloud_sync_lock';
  const lock = localStorage.getItem(lockKey);
  if (lock && Date.now() - parseInt(lock, 10) < 60_000) return { ran: false };
  localStorage.setItem(lockKey, String(Date.now()));
  try {
    const result = await syncToCloud();
    return { ran: true, result };
  } finally {
    localStorage.removeItem(lockKey);
  }
}
