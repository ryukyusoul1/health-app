// 血圧記録
export interface BloodPressure {
  id: string;
  measured_at: string;
  systolic: number;
  diastolic: number;
  pulse?: number;
  timing?: 'morning' | 'evening';
  note?: string;
  created_at: string;
}

// 体重記録
export interface WeightLog {
  id: string;
  measured_at: string;
  logged_at: string;
  weight_kg: number;
  created_at: string;
}

// レシピ
export interface Recipe {
  id: string;
  name: string;
  category: string;
  cook_time_min: number;
  servings: number;
  calories?: number;
  salt_g: number;
  carbs_g?: number;
  protein_g?: number;
  fiber_g?: number;
  potassium_mg?: number;
  ingredients: { name: string; amount: string }[];
  steps: string[];
  salt_tips?: string[];
  sugar_tips?: string[];
  is_favorite: boolean;
  created_at?: string;
}

// 食事記録
export interface FoodLog {
  id: number;
  logged_date: string;
  meal_type: string;
  recipe_id?: string;
  recipe?: Recipe;
  custom_name?: string;
  portion: number;
  calories?: number;
  salt_g?: number;
  carbs_g?: number;
  protein_g?: number;
  fiber_g?: number;
  note?: string;
  created_at?: string;
}

// 外食プリセット
export interface EatingOutPreset {
  id: string;
  name: string;
  category?: string;
  calories?: number;
  salt_g?: number;
  carbs_g?: number;
  protein_g?: number;
  warning?: string | null;
}

// 週間献立
export interface MealPlan {
  id: number;
  plan_date: string;
  meal_type: string;
  recipe_id: string;
  recipe?: Recipe;
  created_at: string;
}

// 体調記録
export interface ConditionLog {
  id: string;
  logged_date: string;
  overall_score: number;
  palpitation: boolean;
  edema: boolean;
  fatigue_level: number;
  cpap_used: boolean;
  note?: string;
  created_at?: string;
}

// 受診記録
export interface MedicalVisit {
  id: string;
  visit_date: string;
  department: string;
  doctor_name?: string;
  diagnosis?: string;
  prescription?: string;
  next_visit?: string;
  note?: string;
  created_at?: string;
}

// ミッション
export interface Mission {
  id: string;
  title: string;
  description: string;
  category: string;
  points: number;
}

// 日次ミッション
export interface DailyMission {
  id: number;
  mission_date: string;
  mission_text: string;
  completed: boolean;
  created_at: string;
}

// ストリーク
export interface Streak {
  id: number;
  streak_type: 'mission' | 'bp_record' | 'food_log' | 'cpap';
  current_count: number;
  best_count: number;
  last_date?: string;
}

// 買い物リスト
export interface ShoppingItem {
  id: number;
  week_start: string;
  item_name: string;
  amount?: string;
  checked: boolean;
  category?: string;
}

// ユーザープロファイル
export interface UserProfile {
  name: string;
  age: number;
  birthday: string;
  height_cm: number;
  weight_kg: number;
  bmi: number;
  gender: 'male' | 'female';
  medical: {
    sleep_apnea: boolean;
    cpap: boolean;
    blood_pressure: {
      systolic: number;
      diastolic: number;
      category: string;
    };
    symptoms: string[];
    medications: string[];
    undiagnosed_risks: string[];
  };
  lifestyle: {
    wake_up: string;
    morning_routine: string;
    work_leave: string;
    work_return: string;
    dinner_cooking: string;
    child_bedtime: string;
    free_time: string;
    sleep: string;
    cooking_style: string;
    role: string;
  };
  goals: string[];
}

// 栄養目標
export interface NutritionTargets {
  salt_g: number;
  carbs_g: number;
  calories: number;
  protein_g: number;
  fiber_g: number;
}

// 日次栄養サマリー
export interface DailyNutritionSummary {
  date: string;
  salt_g: number;
  carbs_g: number;
  calories: number;
  protein_g: number;
  fiber_g: number;
}
