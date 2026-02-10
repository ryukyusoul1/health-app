'use client';

import { BloodPressure, WeightLog, FoodLog, ConditionLog, Recipe, EatingOutPreset, MedicalVisit, Mission, DailyNutritionSummary } from '@/types';

// ストレージキー
const KEYS = {
  BLOOD_PRESSURE: 'health_blood_pressure',
  WEIGHT: 'health_weight',
  FOOD_LOG: 'health_food_log',
  CONDITION: 'health_condition',
  RECIPES: 'health_recipes',
  EATING_OUT: 'health_eating_out',
  MEDICAL_VISITS: 'health_medical_visits',
  MISSIONS: 'health_missions',
  USER_MISSIONS: 'health_user_missions',
  INITIALIZED: 'health_initialized',
  CUSTOM_FOODS: 'health_custom_foods',
  EXERCISE_LOG: 'health_exercise_log',
};

// 汎用的なlocalStorage操作
function getItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('localStorage save error:', e);
  }
}

// ID生成
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ==================== 血圧 ====================
export function getBloodPressureRecords(limit?: number): BloodPressure[] {
  const records = getItem<BloodPressure[]>(KEYS.BLOOD_PRESSURE, []);
  const sorted = records.sort((a, b) =>
    new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime()
  );
  return limit ? sorted.slice(0, limit) : sorted;
}

export function addBloodPressure(data: Omit<BloodPressure, 'id' | 'created_at'>): BloodPressure {
  const records = getItem<BloodPressure[]>(KEYS.BLOOD_PRESSURE, []);
  const newRecord: BloodPressure = {
    ...data,
    id: generateId(),
    created_at: new Date().toISOString(),
  };
  records.push(newRecord);
  setItem(KEYS.BLOOD_PRESSURE, records);
  return newRecord;
}

export function deleteBloodPressure(id: string): void {
  const records = getItem<BloodPressure[]>(KEYS.BLOOD_PRESSURE, []);
  setItem(KEYS.BLOOD_PRESSURE, records.filter(r => r.id !== id));
}

// ==================== 体重 ====================
export function getWeightRecords(limit?: number): WeightLog[] {
  const records = getItem<WeightLog[]>(KEYS.WEIGHT, []);
  const sorted = records.sort((a, b) =>
    new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()
  );
  return limit ? sorted.slice(0, limit) : sorted;
}

export function addWeight(data: Omit<WeightLog, 'id' | 'created_at'>): WeightLog {
  const records = getItem<WeightLog[]>(KEYS.WEIGHT, []);
  const newRecord: WeightLog = {
    ...data,
    id: generateId(),
    created_at: new Date().toISOString(),
  };
  records.push(newRecord);
  setItem(KEYS.WEIGHT, records);
  return newRecord;
}

export function deleteWeight(id: string): void {
  const records = getItem<WeightLog[]>(KEYS.WEIGHT, []);
  setItem(KEYS.WEIGHT, records.filter(r => r.id !== id));
}

// ==================== 食事記録 ====================
export function getFoodLogs(date?: string): { logs: FoodLog[]; summary: DailyNutritionSummary } {
  const records = getItem<FoodLog[]>(KEYS.FOOD_LOG, []);
  const targetDate = date || new Date().toISOString().split('T')[0];

  const logs = records
    .filter(r => r.logged_date === targetDate)
    .sort((a, b) => {
      const order = { breakfast: 0, lunch: 1, dinner: 2, snack: 3 };
      return (order[a.meal_type as keyof typeof order] || 4) - (order[b.meal_type as keyof typeof order] || 4);
    });

  // サマリー計算
  const summary: DailyNutritionSummary = {
    date: targetDate,
    salt_g: logs.reduce((sum, l) => sum + (l.salt_g || 0), 0),
    carbs_g: logs.reduce((sum, l) => sum + (l.carbs_g || 0), 0),
    calories: logs.reduce((sum, l) => sum + (l.calories || 0), 0),
    protein_g: logs.reduce((sum, l) => sum + (l.protein_g || 0), 0),
    fiber_g: logs.reduce((sum, l) => sum + (l.fiber_g || 0), 0),
  };

  return { logs, summary };
}

export function addFoodLog(data: Omit<FoodLog, 'id' | 'created_at'>): FoodLog {
  const records = getItem<FoodLog[]>(KEYS.FOOD_LOG, []);
  const newRecord: FoodLog = {
    ...data,
    id: parseInt(generateId(), 36),
    created_at: new Date().toISOString(),
  };
  records.push(newRecord);
  setItem(KEYS.FOOD_LOG, records);
  return newRecord;
}

export function deleteFoodLog(id: number): void {
  const records = getItem<FoodLog[]>(KEYS.FOOD_LOG, []);
  setItem(KEYS.FOOD_LOG, records.filter(r => r.id !== id));
}

// ==================== 体調記録 ====================
export function getConditionLog(date: string): ConditionLog | null {
  const records = getItem<ConditionLog[]>(KEYS.CONDITION, []);
  return records.find(r => r.logged_date === date) || null;
}

export function saveConditionLog(data: Omit<ConditionLog, 'id' | 'created_at'>): ConditionLog {
  const records = getItem<ConditionLog[]>(KEYS.CONDITION, []);
  const existing = records.findIndex(r => r.logged_date === data.logged_date);

  const record: ConditionLog = {
    ...data,
    id: existing >= 0 ? records[existing].id : generateId(),
    created_at: new Date().toISOString(),
  };

  if (existing >= 0) {
    records[existing] = record;
  } else {
    records.push(record);
  }

  setItem(KEYS.CONDITION, records);
  return record;
}

// ==================== レシピ ====================
export function getRecipes(options?: { category?: string; favorite?: boolean; search?: string; limit?: number }): Recipe[] {
  const recipes = getItem<Recipe[]>(KEYS.RECIPES, []);

  let filtered = recipes;

  if (options?.category) {
    filtered = filtered.filter(r => r.category === options.category);
  }
  if (options?.favorite) {
    filtered = filtered.filter(r => r.is_favorite);
  }
  if (options?.search) {
    const searchLower = options.search.toLowerCase();
    filtered = filtered.filter(r => r.name.toLowerCase().includes(searchLower));
  }

  filtered.sort((a, b) => a.name.localeCompare(b.name, 'ja'));

  return options?.limit ? filtered.slice(0, options.limit) : filtered;
}

export function getRecipeById(id: string): Recipe | null {
  const recipes = getItem<Recipe[]>(KEYS.RECIPES, []);
  return recipes.find(r => r.id === id) || null;
}

export function toggleRecipeFavorite(id: string): void {
  const recipes = getItem<Recipe[]>(KEYS.RECIPES, []);
  const index = recipes.findIndex(r => r.id === id);
  if (index >= 0) {
    recipes[index].is_favorite = !recipes[index].is_favorite;
    setItem(KEYS.RECIPES, recipes);
  }
}

// ==================== 外食プリセット ====================
export function getEatingOutPresets(): EatingOutPreset[] {
  return getItem<EatingOutPreset[]>(KEYS.EATING_OUT, []);
}

// ==================== 通院記録 ====================
export function getMedicalVisits(): MedicalVisit[] {
  const records = getItem<MedicalVisit[]>(KEYS.MEDICAL_VISITS, []);
  return records.sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime());
}

export function addMedicalVisit(data: Omit<MedicalVisit, 'id' | 'created_at'>): MedicalVisit {
  const records = getItem<MedicalVisit[]>(KEYS.MEDICAL_VISITS, []);
  const newRecord: MedicalVisit = {
    ...data,
    id: generateId(),
    created_at: new Date().toISOString(),
  };
  records.push(newRecord);
  setItem(KEYS.MEDICAL_VISITS, records);
  return newRecord;
}

export function updateMedicalVisit(id: string, data: Partial<MedicalVisit>): void {
  const records = getItem<MedicalVisit[]>(KEYS.MEDICAL_VISITS, []);
  const index = records.findIndex(r => r.id === id);
  if (index >= 0) {
    records[index] = { ...records[index], ...data };
    setItem(KEYS.MEDICAL_VISITS, records);
  }
}

export function deleteMedicalVisit(id: string): void {
  const records = getItem<MedicalVisit[]>(KEYS.MEDICAL_VISITS, []);
  setItem(KEYS.MEDICAL_VISITS, records.filter(r => r.id !== id));
}

// ==================== ミッション ====================
export function getMissions(): Mission[] {
  return getItem<Mission[]>(KEYS.MISSIONS, []);
}

export function getUserMissions(date: string): { mission: Mission; completed: boolean }[] {
  const missions = getMissions();
  const userMissions = getItem<{ date: string; mission_id: string; completed: boolean }[]>(KEYS.USER_MISSIONS, []);

  return missions.map(mission => {
    const userMission = userMissions.find(um => um.date === date && um.mission_id === mission.id);
    return {
      mission,
      completed: userMission?.completed || false,
    };
  });
}

export function toggleMissionComplete(missionId: string, date: string): void {
  const userMissions = getItem<{ date: string; mission_id: string; completed: boolean }[]>(KEYS.USER_MISSIONS, []);
  const index = userMissions.findIndex(um => um.date === date && um.mission_id === missionId);

  if (index >= 0) {
    userMissions[index].completed = !userMissions[index].completed;
  } else {
    userMissions.push({ date, mission_id: missionId, completed: true });
  }

  setItem(KEYS.USER_MISSIONS, userMissions);
}

// ==================== 連続記録 ====================
export function getStreakDays(): number {
  const conditions = getItem<ConditionLog[]>(KEYS.CONDITION, []);
  if (conditions.length === 0) return 0;

  const dates = [...new Set(conditions.map(c => c.logged_date))].sort().reverse();
  const today = new Date().toISOString().split('T')[0];

  let streak = 0;
  let currentDate = new Date(today);

  for (const date of dates) {
    const expectedDate = currentDate.toISOString().split('T')[0];
    if (date === expectedDate) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (date < expectedDate) {
      break;
    }
  }

  return streak;
}

// ==================== 初期データ ====================
export function isInitialized(): boolean {
  return getItem<boolean>(KEYS.INITIALIZED, false);
}

export function initializeData(): void {
  if (isInitialized()) return;

  // レシピデータ
  const recipes: Recipe[] = [
    // 主菜
    { id: 'r1', name: '鶏むね肉の塩麹焼き', category: 'main', salt_g: 1.2, calories: 180, carbs_g: 2, protein_g: 25, fiber_g: 0, cook_time_min: 20, servings: 2, ingredients: [{ name: '鶏むね肉', amount: '300g' }, { name: '塩麹', amount: '大さじ1' }], steps: ['鶏肉に塩麹を揉み込み30分置く', 'フライパンで両面を焼く'], salt_tips: ['塩麹は減塩タイプを使用'], is_favorite: false },
    { id: 'r2', name: 'サバの味噌煮（減塩）', category: 'main', salt_g: 1.5, calories: 220, carbs_g: 8, protein_g: 18, fiber_g: 1, cook_time_min: 25, servings: 2, ingredients: [{ name: 'サバ', amount: '2切れ' }, { name: '減塩味噌', amount: '大さじ1' }, { name: '生姜', amount: '1片' }], steps: ['サバは熱湯をかけて臭みを取る', '調味料で煮込む'], salt_tips: ['減塩味噌を使用', '生姜で風味UP'], is_favorite: true },
    { id: 'r3', name: '豚しゃぶサラダ', category: 'main', salt_g: 0.8, calories: 200, carbs_g: 5, protein_g: 20, fiber_g: 3, cook_time_min: 15, servings: 2, ingredients: [{ name: '豚ロース薄切り', amount: '200g' }, { name: 'レタス', amount: '4枚' }, { name: 'ポン酢', amount: '大さじ1' }], steps: ['豚肉を茹でる', '野菜と盛り付ける'], salt_tips: ['ポン酢は少量で'], is_favorite: false },
    { id: 'r4', name: '鮭のホイル焼き', category: 'main', salt_g: 1.0, calories: 180, carbs_g: 3, protein_g: 22, fiber_g: 2, cook_time_min: 25, servings: 2, ingredients: [{ name: '生鮭', amount: '2切れ' }, { name: 'きのこ類', amount: '100g' }, { name: 'レモン', amount: '1/2個' }], steps: ['アルミホイルに材料を包む', 'オーブンで焼く'], salt_tips: ['レモンで塩分控えめに'], is_favorite: true },
    { id: 'r5', name: '鶏つくね', category: 'main', salt_g: 1.3, calories: 190, carbs_g: 6, protein_g: 18, fiber_g: 1, cook_time_min: 20, servings: 2, ingredients: [{ name: '鶏ひき肉', amount: '250g' }, { name: '長ネギ', amount: '1/2本' }, { name: '卵', amount: '1個' }], steps: ['材料を混ぜて成形', 'フライパンで焼く'], salt_tips: ['タレは控えめに'], is_favorite: false },
    { id: 'r6', name: 'カツオのたたき', category: 'main', salt_g: 0.9, calories: 150, carbs_g: 2, protein_g: 26, fiber_g: 0, cook_time_min: 10, servings: 2, ingredients: [{ name: 'カツオ', amount: '300g' }, { name: 'にんにく', amount: '2片' }, { name: '大葉', amount: '5枚' }], steps: ['カツオの表面を炙る', '薬味と盛り付け'], salt_tips: ['ポン酢は少量で'], is_favorite: false },
    { id: 'r7', name: 'ささみの梅しそ巻き', category: 'main', salt_g: 0.7, calories: 120, carbs_g: 1, protein_g: 24, fiber_g: 0, cook_time_min: 15, servings: 2, ingredients: [{ name: 'ささみ', amount: '4本' }, { name: '梅干し', amount: '2個' }, { name: '大葉', amount: '8枚' }], steps: ['ささみを開いて梅しそを巻く', '蒸し焼きにする'], salt_tips: ['減塩梅干しを使用'], is_favorite: true },
    { id: 'r8', name: 'アジの南蛮漬け', category: 'main', salt_g: 1.1, calories: 200, carbs_g: 12, protein_g: 16, fiber_g: 1, cook_time_min: 30, servings: 2, ingredients: [{ name: 'アジ', amount: '4尾' }, { name: '玉ねぎ', amount: '1個' }, { name: '酢', amount: '大さじ3' }], steps: ['アジを揚げる', '南蛮酢に漬ける'], salt_tips: ['酢で減塩効果'], is_favorite: false },
    { id: 'r9', name: '豆腐ハンバーグ', category: 'main', salt_g: 1.0, calories: 180, carbs_g: 8, protein_g: 15, fiber_g: 2, cook_time_min: 25, servings: 2, ingredients: [{ name: '豆腐', amount: '150g' }, { name: '鶏ひき肉', amount: '150g' }, { name: 'ひじき', amount: '10g' }], steps: ['材料を混ぜて成形', '蒸し焼きにする'], salt_tips: ['ソースは大根おろしで'], is_favorite: false },
    { id: 'r10', name: 'ブリ大根', category: 'main', salt_g: 1.4, calories: 230, carbs_g: 10, protein_g: 20, fiber_g: 2, cook_time_min: 40, servings: 2, ingredients: [{ name: 'ブリ', amount: '2切れ' }, { name: '大根', amount: '1/3本' }, { name: '生姜', amount: '1片' }], steps: ['大根を下茹で', 'ブリと一緒に煮込む'], salt_tips: ['醤油は減塩タイプで'], is_favorite: true },

    // 副菜
    { id: 'r11', name: 'ほうれん草のごま和え', category: 'side', salt_g: 0.5, calories: 50, carbs_g: 3, protein_g: 3, fiber_g: 2, cook_time_min: 10, servings: 2, ingredients: [{ name: 'ほうれん草', amount: '1束' }, { name: 'すりごま', amount: '大さじ2' }], steps: ['ほうれん草を茹でる', 'ごまと和える'], salt_tips: ['醤油は少量で'], is_favorite: true },
    { id: 'r12', name: 'きんぴらごぼう', category: 'side', salt_g: 0.6, calories: 60, carbs_g: 10, protein_g: 1, fiber_g: 3, cook_time_min: 15, servings: 2, ingredients: [{ name: 'ごぼう', amount: '1本' }, { name: 'にんじん', amount: '1/2本' }, { name: 'ごま油', amount: '大さじ1' }], steps: ['野菜を細切り', '炒めて味付け'], salt_tips: ['唐辛子で風味UP'], is_favorite: false },
    { id: 'r13', name: 'ひじきの煮物', category: 'side', salt_g: 0.8, calories: 70, carbs_g: 8, protein_g: 3, fiber_g: 4, cook_time_min: 20, servings: 4, ingredients: [{ name: 'ひじき', amount: '20g' }, { name: '油揚げ', amount: '1枚' }, { name: 'にんじん', amount: '1/2本' }], steps: ['ひじきを戻す', '具材と煮込む'], salt_tips: ['出汁をきかせる'], is_favorite: false },
    { id: 'r14', name: 'なすの煮浸し', category: 'side', salt_g: 0.7, calories: 45, carbs_g: 6, protein_g: 1, fiber_g: 2, cook_time_min: 15, servings: 2, ingredients: [{ name: 'なす', amount: '2本' }, { name: '大葉', amount: '3枚' }, { name: '生姜', amount: '1片' }], steps: ['なすを焼く', '出汁に浸す'], salt_tips: ['生姜で風味付け'], is_favorite: false },
    { id: 'r15', name: 'ブロッコリーの塩昆布和え', category: 'side', salt_g: 0.4, calories: 35, carbs_g: 4, protein_g: 3, fiber_g: 3, cook_time_min: 8, servings: 2, ingredients: [{ name: 'ブロッコリー', amount: '1株' }, { name: '塩昆布', amount: '5g' }, { name: 'ごま油', amount: '小さじ1' }], steps: ['ブロッコリーを茹でる', '塩昆布と和える'], salt_tips: ['塩昆布は少量で十分'], is_favorite: true },
    { id: 'r16', name: 'きゅうりとわかめの酢の物', category: 'side', salt_g: 0.5, calories: 25, carbs_g: 4, protein_g: 1, fiber_g: 1, cook_time_min: 10, servings: 2, ingredients: [{ name: 'きゅうり', amount: '2本' }, { name: 'わかめ', amount: '10g' }, { name: '酢', amount: '大さじ2' }], steps: ['きゅうりを薄切り', '酢で和える'], salt_tips: ['酢で減塩効果'], is_favorite: false },
    { id: 'r17', name: 'かぼちゃの煮物', category: 'side', salt_g: 0.6, calories: 80, carbs_g: 15, protein_g: 2, fiber_g: 3, cook_time_min: 20, servings: 4, ingredients: [{ name: 'かぼちゃ', amount: '1/4個' }, { name: '出汁', amount: '200ml' }], steps: ['かぼちゃを切る', '出汁で煮る'], salt_tips: ['砂糖控えめ、出汁をきかせる'], is_favorite: false },
    { id: 'r18', name: '切り干し大根の煮物', category: 'side', salt_g: 0.7, calories: 55, carbs_g: 10, protein_g: 2, fiber_g: 3, cook_time_min: 20, servings: 4, ingredients: [{ name: '切り干し大根', amount: '30g' }, { name: 'にんじん', amount: '1/2本' }, { name: '油揚げ', amount: '1枚' }], steps: ['切り干し大根を戻す', '具材と煮込む'], salt_tips: ['出汁で旨味を'], is_favorite: false },
    { id: 'r19', name: 'オクラの和え物', category: 'side', salt_g: 0.3, calories: 20, carbs_g: 3, protein_g: 1, fiber_g: 2, cook_time_min: 8, servings: 2, ingredients: [{ name: 'オクラ', amount: '10本' }, { name: 'かつお節', amount: '適量' }], steps: ['オクラを茹でる', 'かつお節と和える'], salt_tips: ['醤油は数滴で'], is_favorite: false },
    { id: 'r20', name: 'もやしのナムル', category: 'side', salt_g: 0.4, calories: 40, carbs_g: 3, protein_g: 2, fiber_g: 1, cook_time_min: 8, servings: 2, ingredients: [{ name: 'もやし', amount: '1袋' }, { name: 'ごま油', amount: '大さじ1' }, { name: 'にんにく', amount: '少々' }], steps: ['もやしを茹でる', '調味料で和える'], salt_tips: ['にんにくで風味UP'], is_favorite: false },

    // 汁物
    { id: 'r21', name: '具だくさん味噌汁', category: 'soup', salt_g: 1.0, calories: 60, carbs_g: 5, protein_g: 4, fiber_g: 2, cook_time_min: 15, servings: 2, ingredients: [{ name: '豆腐', amount: '100g' }, { name: 'わかめ', amount: '5g' }, { name: '減塩味噌', amount: '大さじ1' }], steps: ['具材を切る', '出汁で煮て味噌を溶く'], salt_tips: ['減塩味噌を使用', '具だくさんで満足感UP'], is_favorite: true },
    { id: 'r22', name: 'けんちん汁', category: 'soup', salt_g: 0.9, calories: 80, carbs_g: 8, protein_g: 5, fiber_g: 3, cook_time_min: 25, servings: 4, ingredients: [{ name: '豆腐', amount: '150g' }, { name: '大根', amount: '100g' }, { name: 'ごぼう', amount: '50g' }], steps: ['野菜を炒める', '出汁で煮込む'], salt_tips: ['醤油は仕上げに少量'], is_favorite: false },
    { id: 'r23', name: 'かきたま汁', category: 'soup', salt_g: 0.7, calories: 50, carbs_g: 2, protein_g: 4, fiber_g: 0, cook_time_min: 10, servings: 2, ingredients: [{ name: '卵', amount: '1個' }, { name: '三つ葉', amount: '適量' }, { name: '出汁', amount: '400ml' }], steps: ['出汁を温める', '卵を流し入れる'], salt_tips: ['出汁をきかせて薄味に'], is_favorite: false },
    { id: 'r24', name: '豚汁', category: 'soup', salt_g: 1.1, calories: 120, carbs_g: 10, protein_g: 8, fiber_g: 3, cook_time_min: 30, servings: 4, ingredients: [{ name: '豚バラ', amount: '100g' }, { name: '大根', amount: '100g' }, { name: 'こんにゃく', amount: '50g' }], steps: ['具材を炒める', '煮込んで味噌を溶く'], salt_tips: ['野菜たっぷりで'], is_favorite: true },
    { id: 'r25', name: 'あさりの味噌汁', category: 'soup', salt_g: 1.0, calories: 40, carbs_g: 2, protein_g: 5, fiber_g: 0, cook_time_min: 15, servings: 2, ingredients: [{ name: 'あさり', amount: '150g' }, { name: '減塩味噌', amount: '大さじ1' }, { name: '青ネギ', amount: '適量' }], steps: ['あさりを砂抜き', '煮て味噌を溶く'], salt_tips: ['あさりの旨味で減塩'], is_favorite: false },

    // ごはんもの
    { id: 'r26', name: '玄米ごはん', category: 'rice', salt_g: 0, calories: 165, carbs_g: 35, protein_g: 3, fiber_g: 2, cook_time_min: 60, servings: 4, ingredients: [{ name: '玄米', amount: '2合' }], steps: ['玄米を洗って浸水', '炊飯器で炊く'], salt_tips: ['塩分ゼロ'], is_favorite: true },
    { id: 'r27', name: '雑穀ごはん', category: 'rice', salt_g: 0, calories: 170, carbs_g: 36, protein_g: 4, fiber_g: 3, cook_time_min: 50, servings: 4, ingredients: [{ name: '白米', amount: '1.5合' }, { name: '雑穀', amount: '大さじ2' }], steps: ['米と雑穀を合わせる', '通常通り炊く'], salt_tips: ['食物繊維豊富'], is_favorite: false },
    { id: 'r28', name: '鮭おにぎり（減塩）', category: 'rice', salt_g: 0.6, calories: 180, carbs_g: 30, protein_g: 8, fiber_g: 0, cook_time_min: 10, servings: 2, ingredients: [{ name: 'ごはん', amount: '200g' }, { name: '鮭フレーク', amount: '大さじ2' }, { name: '大葉', amount: '2枚' }], steps: ['ごはんに鮭を混ぜる', 'おにぎりにする'], salt_tips: ['塩は使わず、鮭の塩分のみ'], is_favorite: false },
    { id: 'r29', name: '炊き込みごはん', category: 'rice', salt_g: 0.8, calories: 200, carbs_g: 38, protein_g: 5, fiber_g: 2, cook_time_min: 50, servings: 4, ingredients: [{ name: '米', amount: '2合' }, { name: 'きのこ', amount: '100g' }, { name: '油揚げ', amount: '1枚' }], steps: ['具材を切る', '調味料と一緒に炊く'], salt_tips: ['醤油は控えめに'], is_favorite: true },
    { id: 'r30', name: 'とろろご飯', category: 'rice', salt_g: 0.5, calories: 200, carbs_g: 40, protein_g: 5, fiber_g: 2, cook_time_min: 10, servings: 2, ingredients: [{ name: 'ごはん', amount: '300g' }, { name: '長芋', amount: '150g' }, { name: '卵', amount: '1個' }], steps: ['長芋をすりおろす', 'ごはんにかける'], salt_tips: ['醤油は数滴で'], is_favorite: false },

    // デザート・間食
    { id: 'r31', name: 'フルーツヨーグルト', category: 'snack', salt_g: 0.1, calories: 100, carbs_g: 15, protein_g: 4, fiber_g: 1, cook_time_min: 5, servings: 1, ingredients: [{ name: 'プレーンヨーグルト', amount: '100g' }, { name: 'バナナ', amount: '1/2本' }, { name: 'はちみつ', amount: '小さじ1' }], steps: ['フルーツを切る', 'ヨーグルトと混ぜる'], salt_tips: ['塩分ほぼゼロ'], is_favorite: true },
    { id: 'r32', name: '焼き芋', category: 'snack', salt_g: 0, calories: 130, carbs_g: 30, protein_g: 1, fiber_g: 3, cook_time_min: 60, servings: 1, ingredients: [{ name: 'さつまいも', amount: '1本' }], steps: ['オーブンでじっくり焼く'], salt_tips: ['塩分ゼロ、食物繊維豊富'], is_favorite: false },
    { id: 'r33', name: 'りんごのコンポート', category: 'snack', salt_g: 0, calories: 80, carbs_g: 20, protein_g: 0, fiber_g: 2, cook_time_min: 20, servings: 2, ingredients: [{ name: 'りんご', amount: '1個' }, { name: 'はちみつ', amount: '大さじ1' }, { name: 'シナモン', amount: '少々' }], steps: ['りんごを切って煮る'], salt_tips: ['塩分ゼロ'], is_favorite: false },
    { id: 'r34', name: '寒天ゼリー', category: 'snack', salt_g: 0, calories: 30, carbs_g: 7, protein_g: 0, fiber_g: 1, cook_time_min: 15, servings: 4, ingredients: [{ name: '粉寒天', amount: '2g' }, { name: '100%ジュース', amount: '300ml' }], steps: ['寒天を煮溶かす', '冷やし固める'], salt_tips: ['塩分ゼロ、低カロリー'], is_favorite: false },
    { id: 'r35', name: 'バナナ', category: 'snack', salt_g: 0, calories: 85, carbs_g: 22, protein_g: 1, fiber_g: 1, cook_time_min: 0, servings: 1, ingredients: [{ name: 'バナナ', amount: '1本' }], steps: ['そのまま食べる'], salt_tips: ['カリウム豊富で血圧に良い'], is_favorite: true },

    // その他主菜
    { id: 'r36', name: '麻婆豆腐（減塩）', category: 'main', salt_g: 1.3, calories: 200, carbs_g: 8, protein_g: 14, fiber_g: 1, cook_time_min: 20, servings: 2, ingredients: [{ name: '豆腐', amount: '300g' }, { name: '豚ひき肉', amount: '100g' }, { name: '長ネギ', amount: '1本' }], steps: ['具材を炒める', '豆腐を加えて煮込む'], salt_tips: ['減塩醤油と減塩豆板醤を使用'], is_favorite: false },
    { id: 'r37', name: 'チキンソテー', category: 'main', salt_g: 0.8, calories: 200, carbs_g: 1, protein_g: 25, fiber_g: 0, cook_time_min: 20, servings: 2, ingredients: [{ name: '鶏もも肉', amount: '300g' }, { name: 'にんにく', amount: '1片' }, { name: 'レモン', amount: '1/2個' }], steps: ['鶏肉に下味をつける', '皮目からじっくり焼く'], salt_tips: ['レモンとハーブで風味付け'], is_favorite: true },
    { id: 'r38', name: 'イワシの蒲焼き', category: 'main', salt_g: 1.2, calories: 180, carbs_g: 8, protein_g: 15, fiber_g: 0, cook_time_min: 20, servings: 2, ingredients: [{ name: 'イワシ', amount: '4尾' }, { name: '生姜', amount: '1片' }], steps: ['イワシを開く', 'タレで焼く'], salt_tips: ['タレは控えめに、生姜で風味UP'], is_favorite: false },
    { id: 'r39', name: '蒸し鶏', category: 'main', salt_g: 0.6, calories: 150, carbs_g: 1, protein_g: 28, fiber_g: 0, cook_time_min: 25, servings: 2, ingredients: [{ name: '鶏むね肉', amount: '300g' }, { name: '長ネギ青い部分', amount: '適量' }, { name: '生姜', amount: '1片' }], steps: ['鶏肉を蒸す', 'タレをかける'], salt_tips: ['タレは別添えで量を調整'], is_favorite: false },
    { id: 'r40', name: '野菜炒め', category: 'main', salt_g: 0.9, calories: 120, carbs_g: 10, protein_g: 5, fiber_g: 4, cook_time_min: 15, servings: 2, ingredients: [{ name: 'キャベツ', amount: '200g' }, { name: 'もやし', amount: '100g' }, { name: '豚こま', amount: '100g' }], steps: ['具材を切る', '強火で手早く炒める'], salt_tips: ['仕上げの塩は控えめに'], is_favorite: false },

    // その他副菜
    { id: 'r41', name: '白和え', category: 'side', salt_g: 0.5, calories: 70, carbs_g: 5, protein_g: 5, fiber_g: 2, cook_time_min: 15, servings: 2, ingredients: [{ name: '豆腐', amount: '150g' }, { name: 'ほうれん草', amount: '1/2束' }, { name: 'にんじん', amount: '1/4本' }], steps: ['豆腐を水切り', '野菜と和える'], salt_tips: ['白ごまで風味UP'], is_favorite: false },
    { id: 'r42', name: 'たたききゅうり', category: 'side', salt_g: 0.4, calories: 20, carbs_g: 3, protein_g: 1, fiber_g: 1, cook_time_min: 5, servings: 2, ingredients: [{ name: 'きゅうり', amount: '2本' }, { name: 'ごま油', amount: '小さじ1' }, { name: 'にんにく', amount: '少々' }], steps: ['きゅうりを叩いて割る', '調味料で和える'], salt_tips: ['塩は最小限に'], is_favorite: false },
    { id: 'r43', name: 'ほうれん草のおひたし', category: 'side', salt_g: 0.4, calories: 25, carbs_g: 2, protein_g: 2, fiber_g: 2, cook_time_min: 8, servings: 2, ingredients: [{ name: 'ほうれん草', amount: '1束' }, { name: 'かつお節', amount: '適量' }], steps: ['ほうれん草を茹でる', 'かつお節をかける'], salt_tips: ['醤油は数滴で'], is_favorite: false },
    { id: 'r44', name: 'トマトサラダ', category: 'side', salt_g: 0.2, calories: 40, carbs_g: 6, protein_g: 1, fiber_g: 1, cook_time_min: 5, servings: 2, ingredients: [{ name: 'トマト', amount: '2個' }, { name: 'オリーブオイル', amount: '大さじ1' }, { name: 'バジル', amount: '適量' }], steps: ['トマトを切る', 'オイルとバジルをかける'], salt_tips: ['塩なしでも美味しい'], is_favorite: true },
    { id: 'r45', name: 'キャベツの浅漬け', category: 'side', salt_g: 0.5, calories: 15, carbs_g: 3, protein_g: 1, fiber_g: 1, cook_time_min: 10, servings: 4, ingredients: [{ name: 'キャベツ', amount: '1/4個' }, { name: '昆布', amount: '5cm' }, { name: '酢', amount: '大さじ1' }], steps: ['キャベツを切る', '調味料で和える'], salt_tips: ['塩は最小限に'], is_favorite: false },

    // 残りのレシピ
    { id: 'r46', name: 'ミネストローネ', category: 'soup', salt_g: 0.8, calories: 90, carbs_g: 12, protein_g: 4, fiber_g: 3, cook_time_min: 30, servings: 4, ingredients: [{ name: 'トマト缶', amount: '1缶' }, { name: 'キャベツ', amount: '100g' }, { name: '玉ねぎ', amount: '1個' }], steps: ['野菜を切る', 'トマトベースで煮込む'], salt_tips: ['トマトの旨味で減塩'], is_favorite: false },
    { id: 'r47', name: 'わかめスープ', category: 'soup', salt_g: 0.6, calories: 20, carbs_g: 2, protein_g: 2, fiber_g: 1, cook_time_min: 10, servings: 2, ingredients: [{ name: 'わかめ', amount: '10g' }, { name: '卵', amount: '1個' }, { name: '鶏ガラスープ', amount: '400ml' }], steps: ['スープを温める', 'わかめと卵を加える'], salt_tips: ['減塩鶏ガラスープを使用'], is_favorite: false },
    { id: 'r48', name: 'おからサラダ', category: 'side', salt_g: 0.5, calories: 100, carbs_g: 8, protein_g: 6, fiber_g: 5, cook_time_min: 15, servings: 4, ingredients: [{ name: 'おから', amount: '150g' }, { name: 'きゅうり', amount: '1本' }, { name: 'マヨネーズ', amount: '大さじ2' }], steps: ['おからを炒る', '野菜と和える'], salt_tips: ['マヨネーズは控えめに'], is_favorite: false },
    { id: 'r49', name: 'きのこの炊き込みごはん', category: 'rice', salt_g: 0.7, calories: 190, carbs_g: 38, protein_g: 5, fiber_g: 2, cook_time_min: 50, servings: 4, ingredients: [{ name: '米', amount: '2合' }, { name: 'しめじ', amount: '100g' }, { name: '舞茸', amount: '100g' }], steps: ['きのこを切る', '一緒に炊く'], salt_tips: ['きのこの旨味で減塩'], is_favorite: true },
    { id: 'r50', name: 'ナッツ', category: 'snack', salt_g: 0.1, calories: 150, carbs_g: 5, protein_g: 5, fiber_g: 2, cook_time_min: 0, servings: 1, ingredients: [{ name: '無塩ナッツ', amount: '30g' }], steps: ['そのまま食べる'], salt_tips: ['無塩タイプを選ぶ'], is_favorite: false },
  ];

  // 外食プリセット
  const eatingOut: EatingOutPreset[] = [
    { id: 'e1', name: 'ラーメン', category: '麺類', salt_g: 6.0, calories: 500, carbs_g: 65, protein_g: 20, warning: '塩分が非常に高いです' },
    { id: 'e2', name: 'うどん（かけ）', category: '麺類', salt_g: 4.5, calories: 300, carbs_g: 55, protein_g: 8, warning: '汁は残しましょう' },
    { id: 'e3', name: 'そば（かけ）', category: '麺類', salt_g: 4.0, calories: 280, carbs_g: 50, protein_g: 10, warning: '汁は残しましょう' },
    { id: 'e4', name: 'カレーライス', category: 'ごはんもの', salt_g: 3.5, calories: 700, carbs_g: 100, protein_g: 15, warning: null },
    { id: 'e5', name: '牛丼', category: 'ごはんもの', salt_g: 3.8, calories: 650, carbs_g: 90, protein_g: 20, warning: null },
    { id: 'e6', name: '定食（焼き魚）', category: '定食', salt_g: 4.0, calories: 600, carbs_g: 70, protein_g: 25, warning: '味噌汁は半分に' },
    { id: 'e7', name: '定食（生姜焼き）', category: '定食', salt_g: 4.5, calories: 750, carbs_g: 75, protein_g: 30, warning: null },
    { id: 'e8', name: 'ハンバーガーセット', category: 'ファストフード', salt_g: 3.0, calories: 800, carbs_g: 90, protein_g: 25, warning: 'ポテトの塩に注意' },
    { id: 'e9', name: '寿司（10貫）', category: '和食', salt_g: 3.5, calories: 400, carbs_g: 60, protein_g: 20, warning: '醤油は控えめに' },
    { id: 'e10', name: 'コンビニ弁当', category: 'コンビニ', salt_g: 4.0, calories: 700, carbs_g: 90, protein_g: 20, warning: '成分表示を確認' },
    { id: 'e11', name: 'おにぎり（1個）', category: 'コンビニ', salt_g: 1.0, calories: 180, carbs_g: 35, protein_g: 4, warning: null },
    { id: 'e12', name: 'サンドイッチ', category: 'コンビニ', salt_g: 1.5, calories: 300, carbs_g: 30, protein_g: 10, warning: null },
    { id: 'e13', name: 'サラダ（ドレッシング付）', category: 'コンビニ', salt_g: 1.2, calories: 100, carbs_g: 10, protein_g: 3, warning: 'ドレッシングは半分で' },
    { id: 'e14', name: 'ピザ（1切れ）', category: 'イタリアン', salt_g: 1.5, calories: 250, carbs_g: 30, protein_g: 10, warning: null },
    { id: 'e15', name: '中華丼', category: '中華', salt_g: 4.0, calories: 650, carbs_g: 85, protein_g: 20, warning: null },
  ];

  // ミッション
  const missions: Mission[] = [
    { id: 'm1', title: '朝の血圧を測る', description: '起床後1時間以内に測定', category: 'health', points: 10 },
    { id: 'm2', title: '体重を測る', description: '毎日同じ時間に測定', category: 'health', points: 10 },
    { id: 'm3', title: '減塩レシピを1品作る', description: '塩分2g以下のレシピに挑戦', category: 'food', points: 20 },
    { id: 'm4', title: '野菜を350g食べる', description: '1日の野菜摂取目標', category: 'food', points: 15 },
    { id: 'm5', title: '30分歩く', description: 'ウォーキングで健康維持', category: 'exercise', points: 15 },
    { id: 'm6', title: '水を1.5L飲む', description: '適切な水分補給', category: 'health', points: 10 },
    { id: 'm7', title: '7時間以上寝る', description: '質の良い睡眠を', category: 'rest', points: 15 },
    { id: 'm8', title: '体調を記録する', description: '今日の調子を振り返る', category: 'health', points: 10 },
  ];

  setItem(KEYS.RECIPES, recipes);
  setItem(KEYS.EATING_OUT, eatingOut);
  setItem(KEYS.MISSIONS, missions);
  setItem(KEYS.INITIALIZED, true);
}

// ==================== カスタム料理 ====================
export interface CustomFood {
  id: string;
  name: string;
  seasonings: {
    seasoning_id: string;
    name: string;
    amount: number;
    unit: 'tbsp' | 'tsp';
    salt_g: number;
  }[];
  total_salt_g: number;
  servings: number;
  created_at: string;
}

export function getCustomFoods(): CustomFood[] {
  return getItem<CustomFood[]>(KEYS.CUSTOM_FOODS, []);
}

export function addCustomFood(data: Omit<CustomFood, 'id' | 'created_at'>): CustomFood {
  const records = getItem<CustomFood[]>(KEYS.CUSTOM_FOODS, []);
  const newRecord: CustomFood = {
    ...data,
    id: generateId(),
    created_at: new Date().toISOString(),
  };
  records.push(newRecord);
  setItem(KEYS.CUSTOM_FOODS, records);
  return newRecord;
}

export function deleteCustomFood(id: string): void {
  const records = getItem<CustomFood[]>(KEYS.CUSTOM_FOODS, []);
  setItem(KEYS.CUSTOM_FOODS, records.filter(r => r.id !== id));
}

// ==================== 運動記録 ====================
export interface ExerciseLog {
  id: string;
  logged_date: string;
  exercise_id: string;
  exercise_name: string;
  duration_min: number;
  calories_burned: number;
  completed: boolean;
  note?: string;
  created_at: string;
}

export function getExerciseLogs(date?: string): ExerciseLog[] {
  const records = getItem<ExerciseLog[]>(KEYS.EXERCISE_LOG, []);
  if (date) {
    return records.filter(r => r.logged_date === date);
  }
  return records.sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function addExerciseLog(data: Omit<ExerciseLog, 'id' | 'created_at'>): ExerciseLog {
  const records = getItem<ExerciseLog[]>(KEYS.EXERCISE_LOG, []);
  const newRecord: ExerciseLog = {
    ...data,
    id: generateId(),
    created_at: new Date().toISOString(),
  };
  records.push(newRecord);
  setItem(KEYS.EXERCISE_LOG, records);
  return newRecord;
}

export function toggleExerciseComplete(id: string): void {
  const records = getItem<ExerciseLog[]>(KEYS.EXERCISE_LOG, []);
  const index = records.findIndex(r => r.id === id);
  if (index >= 0) {
    records[index].completed = !records[index].completed;
    setItem(KEYS.EXERCISE_LOG, records);
  }
}

export function deleteExerciseLog(id: string): void {
  const records = getItem<ExerciseLog[]>(KEYS.EXERCISE_LOG, []);
  setItem(KEYS.EXERCISE_LOG, records.filter(r => r.id !== id));
}

// 今日の運動サマリー
export function getTodayExerciseSummary(): { total_duration: number; total_calories: number; completed_count: number } {
  const today = new Date().toISOString().split('T')[0];
  const logs = getExerciseLogs(today).filter(l => l.completed);
  return {
    total_duration: logs.reduce((sum, l) => sum + l.duration_min, 0),
    total_calories: logs.reduce((sum, l) => sum + l.calories_burned, 0),
    completed_count: logs.length,
  };
}
