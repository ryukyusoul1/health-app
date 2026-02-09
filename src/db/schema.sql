-- 血圧記録
CREATE TABLE IF NOT EXISTS blood_pressure (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  measured_at DATETIME NOT NULL,
  systolic INTEGER NOT NULL,
  diastolic INTEGER NOT NULL,
  pulse INTEGER,
  timing TEXT CHECK(timing IN ('morning', 'evening')),
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 体重記録
CREATE TABLE IF NOT EXISTS weight_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  measured_at DATE NOT NULL,
  weight_kg REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- レシピマスタ
CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('breakfast', 'prep', 'dinner_main', 'dinner_side', 'soup')),
  cooking_time_min INTEGER NOT NULL,
  calories REAL,
  salt_g REAL NOT NULL,
  carbs_g REAL,
  protein_g REAL,
  fiber_g REAL,
  potassium_mg REAL,
  ingredients_json TEXT NOT NULL,
  steps_json TEXT NOT NULL,
  salt_tips_json TEXT,
  sugar_tips_json TEXT,
  is_favorite INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 食事記録
CREATE TABLE IF NOT EXISTS food_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  logged_date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK(meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  recipe_id TEXT REFERENCES recipes(id),
  custom_name TEXT,
  portion REAL DEFAULT 1.0,
  calories REAL,
  salt_g REAL,
  carbs_g REAL,
  protein_g REAL,
  fiber_g REAL,
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 外食プリセット（塩分警告付き）
CREATE TABLE IF NOT EXISTS eating_out_presets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  calories REAL,
  salt_g REAL,
  carbs_g REAL,
  protein_g REAL,
  warning TEXT
);

-- 週間献立
CREATE TABLE IF NOT EXISTS meal_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_date DATE NOT NULL,
  meal_type TEXT NOT NULL,
  recipe_id TEXT REFERENCES recipes(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(plan_date, meal_type)
);

-- 体調記録
CREATE TABLE IF NOT EXISTS condition_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  logged_date DATE NOT NULL UNIQUE,
  overall_score INTEGER CHECK(overall_score BETWEEN 1 AND 5),
  palpitation INTEGER DEFAULT 0,
  edema INTEGER DEFAULT 0,
  fatigue_level INTEGER CHECK(fatigue_level BETWEEN 1 AND 5),
  cpap_used INTEGER DEFAULT 1,
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 受診記録
CREATE TABLE IF NOT EXISTS medical_visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visit_date DATE NOT NULL,
  department TEXT,
  doctor_name TEXT,
  diagnosis TEXT,
  prescription TEXT,
  next_visit DATE,
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 日次ミッション
CREATE TABLE IF NOT EXISTS daily_missions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mission_date DATE NOT NULL UNIQUE,
  mission_text TEXT NOT NULL,
  completed INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ストリーク
CREATE TABLE IF NOT EXISTS streaks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  streak_type TEXT NOT NULL UNIQUE,
  current_count INTEGER DEFAULT 0,
  best_count INTEGER DEFAULT 0,
  last_date DATE
);

-- 買い物リスト
CREATE TABLE IF NOT EXISTS shopping_list (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  week_start DATE NOT NULL,
  item_name TEXT NOT NULL,
  amount TEXT,
  checked INTEGER DEFAULT 0,
  category TEXT
);

-- アプリ設定
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- 初期ストリークデータ
INSERT OR IGNORE INTO streaks (streak_type, current_count, best_count) VALUES ('mission', 0, 0);
INSERT OR IGNORE INTO streaks (streak_type, current_count, best_count) VALUES ('bp_record', 0, 0);
INSERT OR IGNORE INTO streaks (streak_type, current_count, best_count) VALUES ('food_log', 0, 0);
INSERT OR IGNORE INTO streaks (streak_type, current_count, best_count) VALUES ('cpap', 0, 0);
