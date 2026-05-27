'use client';

// ─────────────────────────────────────────────────────────
// Google Drive にバックアップ／復元する。
// 月1回（30日経過 or 未バックアップ）にアプリ起動時 auto-sync。
// 初回は Google ログインで許可。以降はアクセストークンを保存して自動実行。
// drive.file スコープ：このアプリが作成したファイルだけ読み書きできる安全な範囲。
// ─────────────────────────────────────────────────────────

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const FOLDER_NAME = 'karada-rhythm-backups';
const FILE_PREFIX = 'karada-rhythm-backup-';

const LS_TOKEN       = 'karada_drive_token';
const LS_TOKEN_EXP   = 'karada_drive_token_exp';
const LS_USER_EMAIL  = 'karada_drive_user_email';
const LS_LAST_SYNC   = 'karada_drive_last_sync_at';
const LS_FOLDER_ID   = 'karada_drive_folder_id';
const AUTO_SYNC_DAYS = 30;

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

// ───────────── GSI ローダー ─────────────
let gsiLoading: Promise<void> | null = null;

function loadGsi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no_window'));
  // @ts-expect-error google global is loaded externally
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gsiLoading) return gsiLoading;
  gsiLoading = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('gsi_load_failed'));
    document.head.appendChild(s);
  });
  return gsiLoading;
}

// ───────────── トークン管理 ─────────────
export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem(LS_TOKEN);
  const expRaw = localStorage.getItem(LS_TOKEN_EXP);
  if (!token || !expRaw) return null;
  const exp = parseInt(expRaw, 10);
  if (!exp || Date.now() > exp - 60_000) return null;
  return token;
}

function storeToken(token: string, expiresInSec: number) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LS_TOKEN, token);
  localStorage.setItem(LS_TOKEN_EXP, String(Date.now() + expiresInSec * 1000));
}

export function clearStoredToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LS_TOKEN);
  localStorage.removeItem(LS_TOKEN_EXP);
  localStorage.removeItem(LS_USER_EMAIL);
  localStorage.removeItem(LS_FOLDER_ID);
}

export function getUserEmail(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(LS_USER_EMAIL) || '';
}

// 初回ログイン or 期限切れ時に呼び出す
export async function requestAccessToken(prompt: 'consent' | '' = ''): Promise<string> {
  if (!CLIENT_ID) throw new Error('NEXT_PUBLIC_GOOGLE_CLIENT_ID が未設定です');
  await loadGsi();
  return new Promise<string>((resolve, reject) => {
    // @ts-expect-error google global
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: DRIVE_SCOPE,
      prompt,
      callback: (resp: { access_token?: string; expires_in?: number; error?: string }) => {
        if (resp.error || !resp.access_token) {
          reject(new Error(resp.error || 'no_token'));
          return;
        }
        storeToken(resp.access_token, resp.expires_in || 3600);
        // ユーザーメールも取りに行く（ベストエフォート）
        fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${resp.access_token}` },
        }).then(r => r.json()).then(info => {
          if (info?.email && typeof window !== 'undefined') {
            localStorage.setItem(LS_USER_EMAIL, info.email);
          }
        }).catch(() => {});
        resolve(resp.access_token);
      },
    });
    client.requestAccessToken();
  });
}

async function getValidToken(interactive: boolean): Promise<string | null> {
  const t = getStoredToken();
  if (t) return t;
  if (!interactive) return null;
  return await requestAccessToken();
}

// ───────────── Drive 操作 ─────────────
async function findOrCreateFolder(token: string): Promise<string> {
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(LS_FOLDER_ID);
    if (cached) {
      // フォルダがまだ存在するか確認（ベストエフォート）
      const r = await fetch(`https://www.googleapis.com/drive/v3/files/${cached}?fields=id,trashed`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) {
        const j = await r.json();
        if (!j.trashed) return cached;
      }
    }
  }
  // 検索
  const q = encodeURIComponent(`name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
  const sr = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)&pageSize=1`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (sr.ok) {
    const sj = await sr.json();
    if (sj.files && sj.files.length > 0) {
      const id = sj.files[0].id;
      if (typeof window !== 'undefined') localStorage.setItem(LS_FOLDER_ID, id);
      return id;
    }
  }
  // 作成
  const cr = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }),
  });
  if (!cr.ok) throw new Error('folder_create_failed:' + cr.status);
  const cj = await cr.json();
  if (typeof window !== 'undefined') localStorage.setItem(LS_FOLDER_ID, cj.id);
  return cj.id;
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

async function uploadJson(token: string, folderId: string, filename: string, payload: unknown): Promise<{ id: string; size: number }> {
  const meta = { name: filename, parents: [folderId], mimeType: 'application/json' };
  const body = JSON.stringify(payload);
  const boundary = '-------karada-' + Math.random().toString(36).slice(2);
  const multipart =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
    JSON.stringify(meta) +
    `\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n` +
    body +
    `\r\n--${boundary}--`;
  const r = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,size', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
    body: multipart,
  });
  if (!r.ok) throw new Error('upload_failed:' + r.status);
  const j = await r.json();
  return { id: j.id, size: parseInt(j.size || '0', 10) };
}

// ───────────── パブリック API ─────────────
export function getLastSyncAt(): Date | null {
  if (typeof window === 'undefined') return null;
  const iso = localStorage.getItem(LS_LAST_SYNC);
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

export function shouldAutoBackup(): boolean {
  const last = getLastSyncAt();
  if (!last) return true;
  return Date.now() - last.getTime() >= AUTO_SYNC_DAYS * 86400000;
}

export interface SyncResult {
  ok: boolean;
  fileId?: string;
  size?: number;
  error?: string;
}

export async function syncToDrive(interactive = true): Promise<SyncResult> {
  if (typeof window === 'undefined') return { ok: false, error: 'no_window' };
  const data = collectLocalData();
  if (Object.keys(data).length === 0) return { ok: false, error: 'no_local_data' };
  const token = await getValidToken(interactive);
  if (!token) return { ok: false, error: 'no_token' };
  try {
    const folderId = await findOrCreateFolder(token);
    const yyyymmdd = (() => {
      const d = new Date();
      return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    })();
    const filename = `${FILE_PREFIX}${yyyymmdd}.json`;
    const payload = { app: 'karada-rhythm', version: 1, exported_at: new Date().toISOString(), data };
    const up = await uploadJson(token, folderId, filename, payload);
    localStorage.setItem(LS_LAST_SYNC, new Date().toISOString());
    return { ok: true, fileId: up.id, size: up.size };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export interface DriveFile {
  id: string;
  name: string;
  size: number;
  modifiedTime: string;
}

export async function listDriveBackups(): Promise<DriveFile[]> {
  const token = await getValidToken(true);
  if (!token) return [];
  try {
    const folderId = await findOrCreateFolder(token);
    const q = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
    const r = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,size,modifiedTime)&orderBy=modifiedTime desc&pageSize=20`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!r.ok) return [];
    const j = await r.json();
    return (j.files || []).map((f: { id: string; name: string; size?: string; modifiedTime: string }) => ({
      id: f.id, name: f.name, size: parseInt(f.size || '0', 10), modifiedTime: f.modifiedTime,
    }));
  } catch {
    return [];
  }
}

export async function restoreFromDrive(fileId: string): Promise<{ ok: boolean; restored?: number; error?: string }> {
  const token = await getValidToken(true);
  if (!token) return { ok: false, error: 'no_token' };
  try {
    const r = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return { ok: false, error: 'download_failed:' + r.status };
    const payload = await r.json();
    const data = payload?.data || payload;
    if (!data || typeof data !== 'object') return { ok: false, error: 'invalid_format' };
    let restored = 0;
    for (const key of SYNC_KEYS) {
      if (key in data) {
        localStorage.setItem(key, JSON.stringify(data[key]));
        restored++;
      }
    }
    return { ok: true, restored };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// アプリ起動時に呼ばれる：30日経過 & 既にログイン済みなら裏で同期
export async function autoBackupIfNeeded(): Promise<{ ran: boolean; result?: SyncResult }> {
  if (typeof window === 'undefined') return { ran: false };
  if (!shouldAutoBackup()) return { ran: false };
  if (!getStoredToken()) return { ran: false }; // 未ログインなら裏では何もしない（バナーで促す側）
  const lockKey = 'karada_drive_sync_lock';
  const lock = localStorage.getItem(lockKey);
  if (lock && Date.now() - parseInt(lock, 10) < 60_000) return { ran: false };
  localStorage.setItem(lockKey, String(Date.now()));
  try {
    const result = await syncToDrive(false);
    return { ran: true, result };
  } finally {
    localStorage.removeItem(lockKey);
  }
}

export function isLoggedIn(): boolean {
  return !!getStoredToken();
}
