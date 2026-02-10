import { UserProfile, NutritionTargets } from '@/types';

// ユーザープロファイル（ハードコード）
export const USER_PROFILE: UserProfile = {
  name: "ユーザー",
  age: 42,
  birthday: "1983-02-15",
  height_cm: 170,
  weight_kg: 110,
  bmi: 38.1,
  gender: "male",
  medical: {
    sleep_apnea: true,
    cpap: true,
    blood_pressure: {
      systolic: 168,
      diastolic: 83,
      category: "Ⅱ度高血圧"
    },
    symptoms: [
      "少し歩くだけで動悸",
      "糖質摂取後に動悸・心臓がバクバクする",
      "夜は疲労で動けない"
    ],
    medications: ["CPAP（睡眠時無呼吸）"],
    undiagnosed_risks: ["心不全リスク", "糖尿病前段階の可能性", "高血圧未治療"]
  },
  lifestyle: {
    wake_up: "06:30",
    morning_routine: "06:30-08:30 子供の用意・朝食作り・一品作り置き",
    work_leave: "08:30",
    work_return: "18:30",
    dinner_cooking: "18:30-20:00",
    child_bedtime: "20:30（奥さん担当）",
    free_time: "20:30-22:30（座ってできることのみ）",
    sleep: "22:30",
    cooking_style: "和食中心",
    role: "朝食・夕食・一品作り置きの担当"
  },
  goals: [
    "血圧を下げる（減塩）",
    "体重を減らす（110kg → まず100kg）",
    "糖質による動悸を減らす",
    "疲労感を軽減する",
    "循環器内科を受診する（最優先）"
  ]
};

// 栄養目標
export const NUTRITION_TARGETS: NutritionTargets = {
  salt_g: 6,        // 1日の塩分目標（g）
  carbs_g: 120,     // 1日の糖質目標（g）
  calories: 1800,   // 1日のカロリー目標（kcal）
  protein_g: 60,    // 1日のたんぱく質目標（g）
  fiber_g: 20,      // 1日の食物繊維目標（g）
};

// 1食あたりの目標
export const MEAL_TARGETS = {
  salt_g: 2,        // 1食の塩分上限（g）
  carbs_g: 40,      // 1食の糖質目安（g）
  protein_g: 20,    // 1食のたんぱく質目標（g）
};

// 血圧の基準値
export const BP_THRESHOLDS = {
  normal: { systolic: 120, diastolic: 80 },
  elevated: { systolic: 130, diastolic: 85 },
  stage1: { systolic: 140, diastolic: 90 },
  stage2: { systolic: 160, diastolic: 100 },
};

// 体調スコアの絵文字
export const CONDITION_EMOJIS: Record<number, string> = {
  1: '😫',
  2: '😟',
  3: '😐',
  4: '🙂',
  5: '😊',
};

// カテゴリの日本語名
export const CATEGORY_LABELS: Record<string, string> = {
  main: '主菜',
  side: '副菜',
  soup: '汁物',
  rice: 'ごはんもの',
  snack: '間食・デザート',
  breakfast: '朝食',
  prep: '作り置き',
  dinner_main: '夕食メイン',
  dinner_side: '夕食副菜',
};

// 食事タイプの日本語名
export const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: '朝食',
  lunch: '昼食',
  dinner: '夕食',
  snack: '間食',
};

// 曜日
export const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];
