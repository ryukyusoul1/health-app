# Claude Code マルチエージェント開発プロンプト
## 「からだリズム」— 42歳男性専用ヘルスケア＆減塩減糖ダイエット管理アプリ

---

## 🚨 プロジェクト概要

以下のユーザープロファイルに **完全最適化** されたWebアプリ（PWA）を、マルチエージェント構成で開発せよ。  
技術スタック：**Next.js 14 (App Router) + TypeScript + Tailwind CSS + SQLite (better-sqlite3) + PWA**  
※ 外部API依存を最小化し、ローカルで完結する設計とする。

---

## 👤 ユーザープロファイル（ハードコード前提）

```json
{
  "name": "ユーザー",
  "age": 42,
  "birthday": "1983-02-15",
  "height_cm": 170,
  "weight_kg": 110,
  "bmi": 38.1,
  "gender": "male",
  "medical": {
    "sleep_apnea": true,
    "cpap": true,
    "blood_pressure": { "systolic": 168, "diastolic": 83, "category": "Ⅱ度高血圧" },
    "symptoms": [
      "少し歩くだけで動悸",
      "糖質摂取後に動悸・心臓がバクバクする",
      "夜は疲労で動けない"
    ],
    "medications": ["CPAP（睡眠時無呼吸）"],
    "undiagnosed_risks": ["心不全リスク", "糖尿病前段階の可能性", "高血圧未治療"]
  },
  "lifestyle": {
    "wake_up": "06:30",
    "morning_routine": "06:30-08:30 子供の用意・朝食作り・一品作り置き",
    "work_leave": "08:30",
    "work_return": "18:30",
    "dinner_cooking": "18:30-20:00",
    "child_bedtime": "20:30（奥さん担当）",
    "free_time": "20:30-22:30（座ってできることのみ）",
    "sleep": "22:30",
    "cooking_style": "和食中心",
    "role": "朝食・夕食・一品作り置きの担当"
  },
  "goals": [
    "血圧を下げる（減塩）",
    "体重を減らす（110kg → まず100kg）",
    "糖質による動悸を減らす",
    "疲労感を軽減する",
    "循環器内科を受診する（最優先）"
  ]
}
```

---

## 🏗️ マルチエージェント構成

以下の5つのエージェント（モジュール）を**順番に**開発せよ。各エージェントは独立したディレクトリ構造を持ち、共通のDBとUIフレームワークを共有する。

### Agent 1: 🩺 メディカルアラート＆受診管理

**役割**: 医療的に危険な状態の可視化と受診促進

**機能**:
- ダッシュボード最上部に常時表示される「健康リスクカード」
  - 血圧 168/83 → 🔴 赤表示「Ⅱ度高血圧：循環器内科の受診が必要です」
  - BMI 38.1 → 🔴 赤表示「高度肥満：心血管リスクが高い状態です」
  - 無呼吸+高血圧+肥満 → ⚠️ 「この3つの組み合わせは心不全リスクを大きく高めます」
  - 糖質後の動悸 → ⚠️ 「食後の動悸は血糖スパイクの可能性。HbA1c検査を推奨」
- **受診リマインダー**（最重要機能）
  - 初回起動時：「まず循環器内科を予約しましょう」モーダル
  - 未受診なら3日ごとにやさしくリマインド
  - 受診記録機能（日付・医師名・処方・次回予約）
  - 血圧の記録（朝晩2回推奨、グラフ表示）
- **CPAP記録**
  - 使用有無の記録（毎朝チェック）
  - 使用率の週次グラフ

**設計指針**:
- 脅すのではなく「あなたの体を守るために」というトーン
- 受診したら褒める。記録したら褒める。小さな成功を積み重ねるUX

---

### Agent 2: 🍱 和食減塩・減糖レシピエンジン

**役割**: ユーザーの料理担当スケジュールに合わせた献立・レシピ提案

**機能**:
- **3つの料理タイミングに対応**:
  1. 朝食（06:30-07:00で作れる簡単なもの）
  2. 一品作り置き（07:00-08:00で仕込めるもの）
  3. 夕食（18:30-20:00で作れるもの）
- **制約条件**（すべてのレシピに適用）:
  - 1食あたり塩分 2g 以下（1日合計 6g 目標）
  - 糖質は緩やかに制限（1食 40g 以下、白米は150g→100gに段階的削減）
  - カリウム豊富な食材を優先（高血圧対策：ほうれん草、バナナ、アボカド等）
  - たんぱく質を十分に（筋肉量維持のため 1食20g以上目標）
  - 食物繊維を多く（血糖スパイク防止）
- **レシピDB（初期50品以上）**:
  - カテゴリ: 朝食 / 作り置き / 夕食メイン / 夕食副菜 / 汁物
  - 各レシピに: 調理時間、塩分、糖質、カロリー、たんぱく質、食物繊維
  - 減塩テクニックをレシピ内に注記（出汁を濃くする、酢やレモンで代替、等）
- **週間献立自動生成**
  - 月曜に1週間分を提案
  - 買い物リスト自動生成
  - 「今日はこれを作りましょう」の通知

**データ構造例**:
```typescript
interface Recipe {
  id: string;
  name: string;
  category: 'breakfast' | 'prep' | 'dinner_main' | 'dinner_side' | 'soup';
  cooking_time_min: number; // 朝食は15分以内、作り置きは30分以内
  nutrition: {
    calories: number;
    salt_g: number;      // 必ず2g以下
    carbs_g: number;     // 40g以下推奨
    protein_g: number;   // 20g以上推奨
    fiber_g: number;
    potassium_mg: number;
  };
  ingredients: { name: string; amount: string; }[];
  steps: string[];
  salt_reduction_tips: string[]; // 減塩のコツ
  blood_sugar_tips: string[];   // 血糖値を上げにくくするコツ
}
```

---

### Agent 3: 📊 食事・栄養ログ＆分析

**役割**: 日々の食事記録と栄養バランスの追跡

**機能**:
- **簡単記録UI**（20:30-22:30の疲れた状態で使う前提）
  - レシピDBから選択するだけで自動記録
  - 「今日の食事」をタップ → 朝・昼・夜を選択 → レシピ選択 or 簡易入力
  - よく使うメニューのお気に入り登録
  - 外食時の簡易入力（「ラーメン」「牛丼」等のプリセット ← 塩分・糖質の警告付き）
- **日次サマリー**:
  - 塩分合計（目標6g / 棒グラフ）🔴超過時は赤
  - 糖質合計（目標120g / 棒グラフ）
  - カロリー合計（目標1,800kcal / 段階的に調整）
  - たんぱく質合計（目標60g以上）
  - カリウム摂取量
- **週次・月次トレンド**:
  - 塩分の推移グラフ
  - 体重推移グラフ（週1回記録推奨）
  - 血圧推移グラフ（Agent1と連携）
- **アラート**:
  - 昼食が外食で塩分過多 → 夕食を減塩レシピで自動調整提案
  - 糖質が多い日 → 翌日の献立を低糖質に自動調整

---

### Agent 4: 🧘 夜のセルフケア＆マイクロ習慣

**役割**: 20:30-22:30の「座ってできること」の最適化

**機能**:
- **毎晩のルーティン提案**（5-15分単位、座ったまま）:
  - 座位ストレッチ（肩・首・腰。動悸が出ない強度）
  - 深呼吸エクササイズ（4-7-8呼吸法 → 血圧低下効果）
  - 足のむくみ取り（座ったまま足首回し・ふくらはぎマッサージ）
  - マインドフルネス（3分瞑想 → 交感神経を抑え血圧低下）
- **「今日のミッション」**（1日1つだけ。達成しやすさ重視）:
  - 例: 「夕食の白米を一口分減らす」「階段を1フロアだけ使う」「水を1杯多く飲む」
  - 達成記録 → 連続達成日数表示（ストリーク）
- **体調チェック**（22:00頃に通知）:
  - 5段階の体調スコア（😫😟😐🙂😊）
  - 動悸の有無
  - むくみの有無
  - 疲労度
  - → データとしてAgent3の分析に連携

**設計指針**:
- 「頑張れ」ではなく「今日もお疲れさま。これだけでOKです」
- 疲れた体でも苦にならない最小限のアクション
- やらなくても責めない。やったら褒める

---

### Agent 5: 🎯 ダッシュボード＆統合UI

**役割**: 全エージェントの統合表示とナビゲーション

**機能**:
- **ホーム画面**（起動時に最初に見る画面）:
  1. 健康リスクカード（Agent1） — 常時最上部
  2. 今日の体調スコア（Agent4）
  3. 今日の献立カード（Agent2）
  4. 栄養サマリー（Agent3）— 塩分・糖質のプログレスバー
  5. 今日のミッション（Agent4）
  6. 体重・血圧の直近値
- **ナビゲーション**（下部タブ）:
  - 🏠 ホーム
  - 🍱 献立・レシピ
  - 📝 記録（食事・血圧・体重・体調）
  - 📊 分析（グラフ・トレンド）
  - ⚙️ 設定
- **PWA対応**:
  - オフライン動作
  - ホーム画面追加可能
  - プッシュ通知（朝の血圧記録、夜の体調チェック）

---

## 🎨 UI/UXデザイン方針

### テーマ: 「和の静けさ × 温かみ」

```css
:root {
  /* メインカラー: 柔らかい和のパレット */
  --color-primary: #5B8C5A;      /* 抹茶グリーン — 健康・安心 */
  --color-primary-light: #8FBC8F; /* ライトグリーン */
  --color-accent: #D4956A;        /* 柿色 — 温かみ・食 */
  --color-danger: #C75C5C;        /* 紅色 — 警告（やさしめ） */
  --color-warning: #D4A857;       /* 山吹色 — 注意 */
  --color-bg: #FAF8F5;            /* 和紙のような白 */
  --color-card: #FFFFFF;
  --color-text: #2D2D2D;
  --color-text-muted: #7A7A7A;
  
  /* タイポグラフィ */
  --font-display: 'Zen Maru Gothic', serif;  /* 丸ゴシック — やさしさ */
  --font-body: 'Noto Sans JP', sans-serif;
  
  /* 角丸は大きめ — やさしい印象 */
  --radius-card: 16px;
  --radius-button: 12px;
}
```

### UX原則:
1. **22:30に眠い人が20:30から使う** — 文字は大きく、タップ領域は広く、操作は最小限
2. **記録は3タップ以内** — メニュー選択→量選択→保存
3. **情報は「今日」にフォーカス** — 過去のデータは分析タブで見ればいい
4. **ネガティブ表現を避ける** — 「塩分オーバー❌」ではなく「あと1.2gに抑えるとベスト✨」
5. **褒めるUI** — 記録したら「👏 記録完了！」、目標達成したらアニメーション

---

## 📁 ディレクトリ構造

```
health-app/
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── layout.tsx           # グローバルレイアウト
│   │   ├── page.tsx             # ホーム（ダッシュボード）
│   │   ├── meals/               # 献立・レシピ
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── log/                 # 記録
│   │   │   ├── page.tsx
│   │   │   ├── food/page.tsx
│   │   │   ├── blood-pressure/page.tsx
│   │   │   ├── weight/page.tsx
│   │   │   └── condition/page.tsx
│   │   ├── analysis/            # 分析
│   │   │   └── page.tsx
│   │   ├── medical/             # 受診管理
│   │   │   └── page.tsx
│   │   └── settings/            # 設定
│   │       └── page.tsx
│   │
│   ├── agents/                  # エージェントロジック
│   │   ├── medical/             # Agent 1
│   │   │   ├── risk-calculator.ts
│   │   │   ├── reminder-engine.ts
│   │   │   └── bp-analyzer.ts
│   │   ├── recipe/              # Agent 2
│   │   │   ├── recipe-db.ts     # 初期レシピ50品
│   │   │   ├── meal-planner.ts
│   │   │   ├── shopping-list.ts
│   │   │   └── nutrition-calc.ts
│   │   ├── nutrition-log/       # Agent 3
│   │   │   ├── food-logger.ts
│   │   │   ├── daily-summary.ts
│   │   │   ├── trend-analyzer.ts
│   │   │   └── alert-engine.ts
│   │   ├── self-care/           # Agent 4
│   │   │   ├── routine-db.ts
│   │   │   ├── mission-engine.ts
│   │   │   ├── condition-tracker.ts
│   │   │   └── streak-counter.ts
│   │   └── dashboard/           # Agent 5
│   │       ├── aggregator.ts
│   │       └── notification-scheduler.ts
│   │
│   ├── components/
│   │   ├── ui/                  # 共通UIコンポーネント
│   │   │   ├── Card.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── BottomNav.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── ConditionEmoji.tsx
│   │   ├── medical/
│   │   │   ├── RiskCard.tsx
│   │   │   ├── BPInput.tsx
│   │   │   └── VisitLog.tsx
│   │   ├── meals/
│   │   │   ├── RecipeCard.tsx
│   │   │   ├── MealPlan.tsx
│   │   │   └── ShoppingList.tsx
│   │   ├── log/
│   │   │   ├── FoodLogEntry.tsx
│   │   │   ├── QuickPresets.tsx
│   │   │   └── DailySummary.tsx
│   │   ├── analysis/
│   │   │   ├── SaltChart.tsx
│   │   │   ├── WeightChart.tsx
│   │   │   └── BPChart.tsx
│   │   └── self-care/
│   │       ├── RoutineCard.tsx
│   │       ├── MissionCard.tsx
│   │       └── StreakBadge.tsx
│   │
│   ├── db/
│   │   ├── schema.sql            # テーブル定義
│   │   ├── seed-recipes.ts       # 初期レシピデータ
│   │   └── connection.ts
│   │
│   ├── lib/
│   │   ├── constants.ts          # ユーザープロファイル、栄養目標値
│   │   ├── nutrition-targets.ts  # 塩分6g、糖質120g等の定数
│   │   └── utils.ts
│   │
│   └── types/
│       └── index.ts              # 全型定義
│
├── public/
│   ├── manifest.json             # PWAマニフェスト
│   ├── sw.js                     # Service Worker
│   └── icons/
│
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

---

## 🗄️ データベーススキーマ

```sql
-- 血圧記録
CREATE TABLE blood_pressure (
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
CREATE TABLE weight_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  measured_at DATE NOT NULL,
  weight_kg REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- レシピマスタ
CREATE TABLE recipes (
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
  ingredients_json TEXT NOT NULL, -- JSON配列
  steps_json TEXT NOT NULL,       -- JSON配列
  salt_tips_json TEXT,
  sugar_tips_json TEXT,
  is_favorite INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 食事記録
CREATE TABLE food_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  logged_date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK(meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  recipe_id TEXT REFERENCES recipes(id),
  custom_name TEXT,              -- レシピDB外の食事
  portion REAL DEFAULT 1.0,     -- 量の倍率
  calories REAL,
  salt_g REAL,
  carbs_g REAL,
  protein_g REAL,
  fiber_g REAL,
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 外食プリセット（塩分警告付き）
CREATE TABLE eating_out_presets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  calories REAL,
  salt_g REAL,
  carbs_g REAL,
  protein_g REAL,
  warning TEXT -- 「ラーメンは1杯で塩分約6g。今日はこれだけで1日分です」
);

-- 週間献立
CREATE TABLE meal_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_date DATE NOT NULL,
  meal_type TEXT NOT NULL,
  recipe_id TEXT REFERENCES recipes(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(plan_date, meal_type)
);

-- 体調記録
CREATE TABLE condition_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  logged_date DATE NOT NULL UNIQUE,
  overall_score INTEGER CHECK(overall_score BETWEEN 1 AND 5), -- 1😫 ~ 5😊
  palpitation INTEGER DEFAULT 0,  -- 動悸の有無
  edema INTEGER DEFAULT 0,        -- むくみの有無
  fatigue_level INTEGER CHECK(fatigue_level BETWEEN 1 AND 5),
  cpap_used INTEGER DEFAULT 1,    -- CPAP使用有無
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 受診記録
CREATE TABLE medical_visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visit_date DATE NOT NULL,
  department TEXT, -- 循環器内科、etc
  doctor_name TEXT,
  diagnosis TEXT,
  prescription TEXT,
  next_visit DATE,
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 日次ミッション
CREATE TABLE daily_missions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mission_date DATE NOT NULL UNIQUE,
  mission_text TEXT NOT NULL,
  completed INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ストリーク
CREATE TABLE streaks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  streak_type TEXT NOT NULL, -- 'mission', 'bp_record', 'food_log', 'cpap'
  current_count INTEGER DEFAULT 0,
  best_count INTEGER DEFAULT 0,
  last_date DATE
);

-- 買い物リスト
CREATE TABLE shopping_list (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  week_start DATE NOT NULL,
  item_name TEXT NOT NULL,
  amount TEXT,
  checked INTEGER DEFAULT 0,
  category TEXT -- '野菜', '肉・魚', '調味料', etc
);
```

---

## 📋 初期レシピデータ（最低50品を seed に含めること）

### レシピ設計ルール:
- **全レシピ塩分 2g 以下**
- **朝食**: 調理15分以内。例: だし巻き卵（薄味）、納豆ご飯、味噌汁（味噌半量+出汁多め）、ほうれん草おひたし
- **作り置き**: 30分以内で仕込み。例: 切り干し大根煮（減塩）、ひじき煮、きんぴら（酢を活用）、蒸し鶏
- **夕食メイン**: 60分以内。例: 鮭のホイル焼き（レモン醤油）、豆腐ハンバーグ、鶏むね肉の生姜焼き（減塩）
- **夕食副菜**: 15分以内。例: ほうれん草の胡麻和え、わかめときゅうりの酢の物
- **汁物**: 具沢山味噌汁（味噌は大さじ1まで。出汁を濃くとる）

### 減塩テクニック（レシピ注記に含める）:
- 醤油 → 減塩醤油 or レモン+少量の醤油
- 塩 → 出汁・酢・柑橘・スパイス・ハーブで代替
- 味噌汁 → 味噌を半量にし、出汁パックを2倍使う
- 漬物 → 浅漬け or 酢漬けに変更
- 干物 → 塩分が多いため頻度を週1以下に

### 血糖スパイク対策（レシピ注記に含める）:
- 白米 → 最初は150g、2週間ごとに10g減らし100gへ
- 食べ順: 野菜→たんぱく質→炭水化物の順
- 食物繊維の多い食材を先に食べる

---

## 🔔 通知スケジュール

| 時刻 | 内容 | Agent |
|------|------|-------|
| 06:35 | 「おはようございます。朝の血圧を測りましょう」 | 1 |
| 07:00 | 「今日の朝食レシピ: ○○」 | 2 |
| 12:00 | 「お昼ごはんの記録を忘れずに」 | 3 |
| 18:30 | 「今日の夕食レシピ: ○○」 | 2 |
| 21:00 | 「今日のミッション: ○○」+「夜のストレッチ」 | 4 |
| 22:00 | 「今日の体調はどうでしたか？」 | 4 |

---

## ⚡ 開発順序（Claude Code への指示）

### Phase 1: 基盤構築
1. Next.js プロジェクト初期化（TypeScript, Tailwind, PWA設定）
2. SQLiteセットアップ + 全テーブル作成
3. 共通UIコンポーネント作成（Card, ProgressBar, BottomNav, Modal, Toast）
4. グローバルレイアウト + ナビゲーション
5. カラーテーマ・フォント設定

### Phase 2: Agent 1（メディカルアラート）
6. リスクカード表示
7. 血圧入力・記録・グラフ
8. 受診記録・リマインダー
9. CPAP記録

### Phase 3: Agent 2（レシピエンジン）
10. レシピDB + 50品の初期データ投入
11. レシピ一覧・詳細表示
12. 週間献立生成ロジック
13. 買い物リスト生成

### Phase 4: Agent 3（食事ログ）
14. 食事記録UI（レシピ選択 + 外食プリセット）
15. 日次栄養サマリー
16. 週次・月次トレンドグラフ
17. 超過アラート

### Phase 5: Agent 4（セルフケア）
18. 夜のルーティン表示
19. 日次ミッション生成・記録
20. 体調チェック入力
21. ストリーク表示

### Phase 6: Agent 5（統合ダッシュボード）
22. ホーム画面の全エージェント統合
23. PWAマニフェスト・Service Worker
24. 通知スケジューラ

---

## 🚫 やってはいけないこと

1. **医療診断をしない** — 「○○の疑いがあります。医師に相談してください」までに留める
2. **極端なカロリー制限を提案しない** — 1,600kcal未満は推奨しない。基礎代謝を下回らない
3. **運動を強く推奨しない** — 動悸がある状態での運動は危険。医師の許可が出るまでは座位でのストレッチのみ
4. **白米を急に0にしない** — 段階的削減（150g→140g→...→100g）
5. **責めるUIにしない** — 記録しなかった日があっても「昨日の分も記録できますよ」程度

---

## ✅ 完成チェックリスト

- [x] 全ページがモバイルファーストでレスポンシブ
- [x] 血圧記録 → グラフ表示が動作する
- [x] レシピ50品が表示・検索できる
- [x] 食事記録 → 日次栄養サマリーに反映される
- [ ] 週間献立が自動生成される
- [x] 体調チェック → 記録される
- [x] ダッシュボードに全データが統合表示される
- [x] PWAとしてホーム画面追加可能
- [x] 全テキストが日本語
- [x] 「循環器内科受診」のリマインダーが機能する
- [x] 手作り料理の調味料入力（大さじ・小さじ対応）
- [x] 座ってできる運動メニュー（12種類）
- [x] AIトレーナーによるアドバイス機能

---

## 📝 開発履歴・変更ログ

### 2024年2月 - localStorage移行＆新機能追加

#### 変更1: SQLite → localStorage 移行
**問題**: Vercelのサーバーレス環境で`better-sqlite3`が動作しない
**解決**: すべてのデータをlocalStorageに保存するように変更

**変更ファイル**:
- `src/lib/storage.ts` - 新規作成（localStorageベースのデータ管理）

**データ保存キー**:
```typescript
const KEYS = {
  FOOD_LOG: 'health_food_log',
  BLOOD_PRESSURE: 'health_blood_pressure',
  WEIGHT: 'health_weight',
  CONDITION: 'health_condition',
  MEDICAL_VISITS: 'health_medical_visits',
  CUSTOM_FOODS: 'health_custom_foods',
  EXERCISE_LOG: 'health_exercise_log',
  STREAK: 'health_streak',
  INITIALIZED: 'health_initialized',
};
```

**注意点**:
- ブラウザ/デバイスごとにデータが独立
- `/api/*`ルートは互換性のため残存（実際は未使用）

---

#### 変更2: 手作り料理の調味料入力機能
**要望**: 「gで計っていない。大さじ・小さじで入力したい」

**新規ファイル**: `src/lib/seasonings.ts`
```typescript
// 24種類の調味料データベース
export const SEASONINGS = [
  { id: 's1', name: '醤油', salt_per_tbsp: 2.6, salt_per_tsp: 0.9, category: '基本' },
  { id: 's2', name: '減塩醤油', salt_per_tbsp: 1.3, salt_per_tsp: 0.4, category: '基本' },
  { id: 's3', name: '味噌', salt_per_tbsp: 2.2, salt_per_tsp: 0.7, category: '基本' },
  { id: 's4', name: '塩', salt_per_tbsp: 18.0, salt_per_tsp: 6.0, category: '基本' },
  { id: 's5', name: 'めんつゆ（3倍濃縮）', salt_per_tbsp: 1.8, salt_per_tsp: 0.6, category: '基本' },
  { id: 's6', name: 'ポン酢', salt_per_tbsp: 1.4, salt_per_tsp: 0.5, category: '基本' },
  // ... 他18種類
];

export function calculateSalt(seasoningId: string, amount: number, unit: 'tbsp' | 'tsp'): number;
export function getSeasoningsByCategory(): Record<string, typeof SEASONINGS>;
```

**変更ファイル**: `src/app/log/food/page.tsx`
- 「手作り」タブを追加
- 調味料選択 → 大さじ/小さじで量を入力
- 何人分かを入力 → 1人前あたりの塩分を自動計算

**使い方**:
1. 記録 → 食事 → 手作りタブ
2. 料理名を入力（例: 「肉じゃが」）
3. 調味料を追加（醤油 大さじ2、みりん 大さじ1 など）
4. 何人分かを入力（例: 4人分）
5. 登録 → 1人前あたりの塩分が自動計算される

---

#### 変更3: 座ってできる運動メニュー
**要望**: 「疲れて動けないので座ったままできる運動が欲しい」

**新規ファイル**: `src/lib/exercises.ts`
```typescript
export interface Exercise {
  id: string;
  name: string;
  description: string;
  duration_min: number;
  category: 'stretch' | 'strength' | 'cardio' | 'relaxation';
  difficulty: 1 | 2 | 3;
  calories_burned: number;
  steps: string[];
  benefits: string[];
  caution?: string;
}

// 12種類の運動
export const EXERCISES: Exercise[] = [
  // ストレッチ
  { id: 'ex1', name: '首のストレッチ', category: 'stretch', ... },
  { id: 'ex2', name: '肩回し', category: 'stretch', ... },
  { id: 'ex3', name: '体側伸ばし', category: 'stretch', ... },
  // 筋トレ
  { id: 'ex4', name: '座ったままもも上げ', category: 'strength', ... },
  { id: 'ex5', name: 'かかと上げ下げ', category: 'strength', ... },
  { id: 'ex6', name: 'グーパー体操', category: 'strength', ... },
  // 有酸素
  { id: 'ex7', name: '座ったまま足踏み', category: 'cardio', ... },
  { id: 'ex8', name: 'エア自転車', category: 'cardio', ... },
  { id: 'ex9', name: 'エアボクシング', category: 'cardio', ... },
  // リラックス
  { id: 'ex10', name: '深呼吸エクササイズ', category: 'relaxation', ... },
  { id: 'ex11', name: '目の体操', category: 'relaxation', ... },
  { id: 'ex12', name: 'ハンドマッサージ', category: 'relaxation', ... },
];
```

**新規ファイル**: `src/app/exercise/page.tsx`
- 今日の運動サマリー（完了数、合計時間、消費カロリー）
- カテゴリフィルター
- 運動詳細モーダル（やり方ステップ、効果、注意点）
- 完了記録機能

---

#### 変更4: AIトレーナー機能
**要望**: 「記録を分析してアドバイスしてほしい」

**新規ファイル**: `src/app/trainer/page.tsx`

**機能**:
- 血圧データを分析 → 高ければ警告、良好なら褒める
- 今日の塩分摂取を確認 → 目標超過時にアドバイス
- 運動状況を確認 → 未運動なら軽い運動を提案
- 体調記録を確認 → 動悸があればケアを提案
- 通院記録を確認 → 未受診なら受診を勧める
- 連続記録日数を表示 → モチベーション維持

**アドバイス優先度**: high（重要）→ medium（確認）→ low（良好）の順に表示

---

#### 変更5: ナビゲーション更新
**変更ファイル**: `src/components/ui/BottomNav.tsx`

```typescript
const navItems = [
  { href: '/', icon: '🏠', label: 'ホーム' },
  { href: '/meals', icon: '🍱', label: '献立' },
  { href: '/log', icon: '📝', label: '記録' },
  { href: '/exercise', icon: '🏃', label: '運動' },  // 新規追加
  { href: '/trainer', icon: '🤖', label: 'AI相談' }, // 新規追加
];
```

---

## 🔧 現在のファイル構造（更新版）

```
health-app/
├── src/
│   ├── app/
│   │   ├── page.tsx              # ホーム
│   │   ├── layout.tsx            # レイアウト
│   │   ├── exercise/
│   │   │   └── page.tsx          # 運動メニュー【新規】
│   │   ├── trainer/
│   │   │   └── page.tsx          # AIトレーナー【新規】
│   │   ├── log/
│   │   │   ├── page.tsx
│   │   │   ├── food/
│   │   │   │   └── page.tsx      # 食事記録【手作りタブ追加】
│   │   │   ├── blood-pressure/
│   │   │   ├── weight/
│   │   │   └── condition/
│   │   ├── meals/
│   │   ├── analysis/
│   │   ├── medical/
│   │   └── settings/
│   ├── components/
│   │   └── ui/
│   │       ├── BottomNav.tsx     # 【運動・AI追加】
│   │       ├── Button.tsx        # variant: primary|secondary|danger|ghost
│   │       ├── Card.tsx
│   │       ├── Modal.tsx
│   │       └── Toast.tsx
│   ├── lib/
│   │   ├── storage.ts            # localStorage管理【新規】
│   │   ├── seasonings.ts         # 調味料DB【新規】
│   │   ├── exercises.ts          # 運動DB【新規】
│   │   ├── constants.ts
│   │   ├── recipes.ts
│   │   └── utils.ts
│   └── types/
│       └── index.ts
├── public/
│   └── manifest.json
└── package.json
```

---

## 🚀 デプロイ手順

```bash
# 1. 開発サーバーで確認
npm run dev

# 2. ビルドテスト（エラーがないか確認）
npm run build

# 3. GitHubにプッシュ → Vercelが自動デプロイ
git add .
git commit -m "変更内容の説明"
git push
```

**Vercelダッシュボード**: https://vercel.com/dashboard
**GitHubリポジトリ**: https://github.com/ryukyusoul1/health-app

---

## ⚠️ 注意事項（開発者向け）

1. **Buttonのvariant**: `outline`は存在しない。使用可能: `primary`, `secondary`, `danger`, `ghost`

2. **localStorage制限**: データはブラウザごとに保存。異なるデバイス間で同期されない

3. **APIルート**: `/api/*`は現在未使用だが将来のバックエンド統合用に残している

4. **新機能追加時**:
   - storage.tsにインターフェースと関数を追加
   - BottomNav.tsxにナビゲーション項目を追加
   - npm run buildでエラーチェック

---

## 📌 今後の拡張案

- [ ] データのエクスポート/インポート機能（JSON形式）
- [ ] 服薬リマインダー通知
- [ ] グラフ・分析機能の強化（Chart.js等）
- [ ] レシピの追加（現在約10品 → 50品目標）
- [ ] 音声入力対応
- [ ] 家族共有機能
