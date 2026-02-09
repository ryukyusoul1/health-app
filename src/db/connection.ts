import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// データベースファイルのパス
const DB_PATH = path.join(process.cwd(), 'data', 'health.db');

// データディレクトリを作成
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// データベース接続（シングルトン）
let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');

    // スキーマを初期化
    initializeSchema();
  }
  return db;
}

function initializeSchema() {
  const schemaPath = path.join(process.cwd(), 'src', 'db', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  // 複数のステートメントを分割して実行
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const statement of statements) {
    try {
      db!.exec(statement);
    } catch (error) {
      // 既存のテーブルなどのエラーは無視
      console.log('Schema statement skipped:', error);
    }
  }
}

// 日付フォーマット用ユーティリティ
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function formatDateTime(date: Date): string {
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

// 今日の日付を取得
export function getToday(): string {
  const now = new Date();
  // 日本時間に調整
  const jstOffset = 9 * 60;
  const utcOffset = now.getTimezoneOffset();
  const jstDate = new Date(now.getTime() + (jstOffset + utcOffset) * 60 * 1000);
  return formatDate(jstDate);
}
