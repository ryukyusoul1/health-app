'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Toast from '@/components/ui/Toast';
import DailySummary from '@/components/log/DailySummary';
import { Recipe, FoodLog, EatingOutPreset, DailyNutritionSummary } from '@/types';
import { MEAL_TYPE_LABELS } from '@/lib/constants';
import { SEASONINGS, calculateSalt, getSeasoningsByCategory } from '@/lib/seasonings';
import * as storage from '@/lib/storage';

interface SeasoningEntry {
  id: string;
  seasoning_id: string;
  name: string;
  amount: number;
  unit: 'tbsp' | 'tsp';
  salt_g: number;
}

function FoodLogContent() {
  const searchParams = useSearchParams();
  const recipeIdFromUrl = searchParams.get('recipe');

  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [summary, setSummary] = useState<DailyNutritionSummary>({
    date: new Date().toISOString().split('T')[0],
    salt_g: 0,
    carbs_g: 0,
    calories: 0,
    protein_g: 0,
    fiber_g: 0,
  });
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [presets, setPresets] = useState<EatingOutPreset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // モーダル制御
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<string>('dinner');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<EatingOutPreset | null>(null);
  const [customName, setCustomName] = useState('');
  const [portion, setPortion] = useState('1');
  const [activeTab, setActiveTab] = useState<'ai' | 'recipe' | 'preset' | 'homemade' | 'custom'>('ai');
  const [customCalories, setCustomCalories] = useState('');
  const [customSalt, setCustomSalt] = useState('');

  // AI推定
  const [aiInput, setAiInput] = useState('');
  const [aiEstimating, setAiEstimating] = useState(false);
  const [aiResult, setAiResult] = useState<{ name: string; calories: number; salt_g: number; carbs_g: number; protein_g: number; fiber_g: number } | null>(null);

  // 手作り用の調味料リスト
  const [seasoningEntries, setSeasoningEntries] = useState<SeasoningEntry[]>([]);
  const [homemadeName, setHomemadeName] = useState('');
  const [homemadeServings, setHomemadeServings] = useState('2');

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!storage.isInitialized()) {
      storage.initializeData();
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (recipeIdFromUrl && recipes.length > 0) {
      const recipe = recipes.find(r => r.id === recipeIdFromUrl);
      if (recipe) {
        setSelectedRecipe(recipe);
        setShowAddModal(true);
      }
    }
  }, [recipeIdFromUrl, recipes]);

  function fetchData() {
    setIsLoading(true);
    try {
      const { logs: foodLogs, summary: foodSummary } = storage.getFoodLogs(today);
      setLogs(foodLogs);
      setSummary(foodSummary);

      const allRecipes = storage.getRecipes();
      setRecipes(allRecipes);

      const allPresets = storage.getEatingOutPresets();
      setPresets(allPresets);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // 調味料を追加
  const addSeasoning = (seasoningId: string) => {
    const seasoning = SEASONINGS.find(s => s.id === seasoningId);
    if (!seasoning) return;

    const salt = calculateSalt(seasoningId, 1, 'tbsp');
    setSeasoningEntries([...seasoningEntries, {
      id: Date.now().toString(),
      seasoning_id: seasoningId,
      name: seasoning.name,
      amount: 1,
      unit: 'tbsp',
      salt_g: salt,
    }]);
  };

  // 調味料の量を変更
  const updateSeasoningAmount = (id: string, amount: number, unit: 'tbsp' | 'tsp') => {
    setSeasoningEntries(entries =>
      entries.map(e => {
        if (e.id === id) {
          const salt = calculateSalt(e.seasoning_id, amount, unit);
          return { ...e, amount, unit, salt_g: salt };
        }
        return e;
      })
    );
  };

  // 調味料を削除
  const removeSeasoning = (id: string) => {
    setSeasoningEntries(entries => entries.filter(e => e.id !== id));
  };

  // 手作り料理の合計塩分を計算
  const getTotalSalt = () => {
    const total = seasoningEntries.reduce((sum, e) => sum + e.salt_g, 0);
    const servings = parseInt(homemadeServings) || 1;
    return total / servings;
  };

  const handleSubmit = () => {
    setIsSaving(true);
    try {
      const portionNum = parseFloat(portion) || 1;

      const data: Omit<FoodLog, 'id' | 'created_at'> = {
        logged_date: today,
        meal_type: selectedMealType,
        portion: portionNum,
      };

      if (activeTab === 'ai' && aiResult) {
        data.custom_name = aiResult.name;
        data.calories = aiResult.calories * portionNum;
        data.salt_g = aiResult.salt_g * portionNum;
        data.carbs_g = aiResult.carbs_g * portionNum;
        data.protein_g = aiResult.protein_g * portionNum;
        data.fiber_g = aiResult.fiber_g * portionNum;
      } else if (activeTab === 'recipe' && selectedRecipe) {
        data.recipe_id = selectedRecipe.id;
        data.recipe = selectedRecipe;
        data.calories = (selectedRecipe.calories || 0) * portionNum;
        data.salt_g = selectedRecipe.salt_g * portionNum;
        data.carbs_g = (selectedRecipe.carbs_g || 0) * portionNum;
        data.protein_g = (selectedRecipe.protein_g || 0) * portionNum;
        data.fiber_g = (selectedRecipe.fiber_g || 0) * portionNum;
      } else if (activeTab === 'preset' && selectedPreset) {
        data.custom_name = selectedPreset.name;
        data.calories = (selectedPreset.calories || 0) * portionNum;
        data.salt_g = (selectedPreset.salt_g || 0) * portionNum;
        data.carbs_g = (selectedPreset.carbs_g || 0) * portionNum;
        data.protein_g = (selectedPreset.protein_g || 0) * portionNum;
      } else if (activeTab === 'homemade' && homemadeName && seasoningEntries.length > 0) {
        // 手作り料理
        const saltPerServing = getTotalSalt();
        data.custom_name = homemadeName;
        data.salt_g = saltPerServing * portionNum;

        // カスタム料理として保存
        storage.addCustomFood({
          name: homemadeName,
          seasonings: seasoningEntries,
          total_salt_g: seasoningEntries.reduce((sum, e) => sum + e.salt_g, 0),
          servings: parseInt(homemadeServings) || 1,
        });
      } else if (activeTab === 'custom' && customName) {
        data.custom_name = customName;
        if (customCalories) data.calories = parseFloat(customCalories) * portionNum;
        if (customSalt) data.salt_g = parseFloat(customSalt) * portionNum;
      }

      storage.addFoodLog(data);
      setToast({ message: '記録しました！', type: 'success' });
      setShowAddModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Save error:', error);
      setToast({ message: 'エラーが発生しました', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: number) => {
    try {
      storage.deleteFoodLog(id);
      fetchData();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const resetForm = () => {
    setSelectedRecipe(null);
    setSelectedPreset(null);
    setCustomName('');
    setHomemadeName('');
    setSeasoningEntries([]);
    setHomemadeServings('2');
    setPortion('1');
    setCustomCalories('');
    setCustomSalt('');
    setAiInput('');
    setAiResult(null);
    setActiveTab('ai');
  };

  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
  const seasoningsByCategory = getSeasoningsByCategory();

  return (
    <div className="p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">食事記録</h1>
        <p className="text-gray-600">{new Date().toLocaleDateString('ja-JP')}</p>
      </header>

      <DailySummary summary={summary} />

      <Card className="mb-4">
        <h2 className="font-bold text-gray-800 mb-3">今日の食事</h2>
        {isLoading ? (
          <div className="text-center py-4">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-gray-500 text-center py-4">まだ記録がありません</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-xs text-gray-500">{MEAL_TYPE_LABELS[log.meal_type]}</p>
                  <p className="font-medium text-gray-800">
                    {log.recipe?.name || log.custom_name || '食事'}
                    {log.portion !== 1 && ` ×${log.portion}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    🧂{log.salt_g?.toFixed(1) || '-'}g
                    {log.calories && ` ${log.calories}kcal`}
                  </p>
                </div>
                <button onClick={() => handleDelete(log.id)} className="text-red-500 text-sm">
                  削除
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Button onClick={() => setShowAddModal(true)} fullWidth>
        🍽️ 食事を追加
      </Button>

      {/* 追加モーダル */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); resetForm(); }}
        title="食事を記録"
      >
        {/* 食事タイプ選択 */}
        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-2">いつの食事？</label>
          <div className="grid grid-cols-4 gap-2">
            {mealTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedMealType(type)}
                className={`py-2 rounded-xl text-sm font-medium transition-colors ${
                  selectedMealType === type ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {MEAL_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        {/* タブ切り替え */}
        <div className="flex gap-1 mb-4">
          {(['ai', 'custom', 'recipe', 'homemade', 'preset'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-xl text-xs font-medium ${
                activeTab === tab ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {tab === 'ai' ? 'AI推定' : tab === 'custom' ? '自由入力' : tab === 'recipe' ? 'レシピ' : tab === 'homemade' ? '手作り' : '外食'}
            </button>
          ))}
        </div>

        {/* 選択エリア */}
        <div className="mb-4">
          {activeTab === 'ai' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">食べたものを入力するとAIが栄養素を推定します</p>
              <textarea
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                placeholder={"例:\nコロッケ2個と白ごはん\nスーパーの唐揚げ弁当\nコンビニのサラダとおにぎり2個"}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none"
              />
              <button
                onClick={async () => {
                  if (!aiInput.trim() || aiEstimating) return;
                  setAiEstimating(true);
                  setAiResult(null);
                  try {
                    const res = await fetch('/api/ai-food', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ description: aiInput.trim() }),
                    });
                    const data = await res.json();
                    if (res.ok && data.name) {
                      setAiResult(data);
                    } else {
                      setToast({ message: data.error || '推定に失敗しました', type: 'error' });
                    }
                  } catch {
                    setToast({ message: '通信エラーが発生しました', type: 'error' });
                  } finally {
                    setAiEstimating(false);
                  }
                }}
                disabled={!aiInput.trim() || aiEstimating}
                className="w-full py-3 bg-primary/10 text-primary rounded-xl font-medium text-sm disabled:opacity-50"
              >
                {aiEstimating ? '推定中...' : 'AIで栄養素を推定'}
              </button>

              {aiResult && (
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="font-bold text-gray-800 mb-2">{aiResult.name}</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white rounded-lg p-2">
                      <p className="text-[10px] text-gray-500">カロリー</p>
                      <p className="font-bold text-sm">{aiResult.calories}<span className="text-[10px]">kcal</span></p>
                    </div>
                    <div className="bg-white rounded-lg p-2">
                      <p className="text-[10px] text-gray-500">塩分</p>
                      <p className="font-bold text-sm">{aiResult.salt_g}<span className="text-[10px]">g</span></p>
                    </div>
                    <div className="bg-white rounded-lg p-2">
                      <p className="text-[10px] text-gray-500">糖質</p>
                      <p className="font-bold text-sm">{aiResult.carbs_g}<span className="text-[10px]">g</span></p>
                    </div>
                    <div className="bg-white rounded-lg p-2">
                      <p className="text-[10px] text-gray-500">たんぱく質</p>
                      <p className="font-bold text-sm">{aiResult.protein_g}<span className="text-[10px]">g</span></p>
                    </div>
                    <div className="bg-white rounded-lg p-2">
                      <p className="text-[10px] text-gray-500">食物繊維</p>
                      <p className="font-bold text-sm">{aiResult.fiber_g}<span className="text-[10px]">g</span></p>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 text-center">※ AIによる推定値です</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'recipe' && (
            <div className="space-y-2">
              {recipes.map((recipe) => (
                <button
                  key={recipe.id}
                  onClick={() => setSelectedRecipe(recipe)}
                  className={`w-full p-3 text-left rounded-xl transition-colors ${
                    selectedRecipe?.id === recipe.id ? 'bg-primary/10 border-2 border-primary' : 'bg-gray-50'
                  }`}
                >
                  <p className="font-medium">{recipe.name}</p>
                  <p className="text-xs text-gray-500">🧂 {recipe.salt_g}g {recipe.calories}kcal</p>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'homemade' && (
            <div className="space-y-4">
              {/* 料理名 */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">料理名</label>
                <input
                  type="text"
                  value={homemadeName}
                  onChange={(e) => setHomemadeName(e.target.value)}
                  placeholder="例: 野菜炒め"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200"
                />
              </div>

              {/* 何人分か */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">何人分？</label>
                <div className="flex gap-2">
                  {['1', '2', '3', '4'].map(n => (
                    <button
                      key={n}
                      onClick={() => setHomemadeServings(n)}
                      className={`flex-1 py-2 rounded-xl text-sm ${
                        homemadeServings === n ? 'bg-primary text-white' : 'bg-gray-100'
                      }`}
                    >
                      {n}人分
                    </button>
                  ))}
                </div>
              </div>

              {/* 追加した調味料 */}
              {seasoningEntries.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-sm">追加した調味料</span>
                    <span className="text-primary font-bold">
                      1人分 約{getTotalSalt().toFixed(1)}g
                    </span>
                  </div>
                  <div className="space-y-2">
                    {seasoningEntries.map((entry) => (
                      <div key={entry.id} className="flex items-center gap-2 bg-white p-2 rounded-lg">
                        <span className="flex-1 text-sm">{entry.name}</span>
                        <select
                          value={entry.amount}
                          onChange={(e) => updateSeasoningAmount(entry.id, parseFloat(e.target.value), entry.unit)}
                          className="w-16 px-2 py-1 text-sm border rounded"
                        >
                          {[0.5, 1, 1.5, 2, 2.5, 3].map(n => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                        <select
                          value={entry.unit}
                          onChange={(e) => updateSeasoningAmount(entry.id, entry.amount, e.target.value as 'tbsp' | 'tsp')}
                          className="w-20 px-2 py-1 text-sm border rounded"
                        >
                          <option value="tbsp">大さじ</option>
                          <option value="tsp">小さじ</option>
                        </select>
                        <span className="text-xs text-gray-500 w-12">{entry.salt_g.toFixed(1)}g</span>
                        <button onClick={() => removeSeasoning(entry.id)} className="text-red-500 text-xs">×</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 調味料を追加 */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">調味料を追加（タップで追加）</label>
                {Object.entries(seasoningsByCategory).map(([category, items]) => (
                  <div key={category} className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">{category}</p>
                    <div className="flex flex-wrap gap-1">
                      {items.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => addSeasoning(s.id)}
                          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg"
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'preset' && (
            <div className="space-y-2">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setSelectedPreset(preset)}
                  className={`w-full p-3 text-left rounded-xl transition-colors ${
                    selectedPreset?.id === preset.id ? 'bg-amber-50 border-2 border-amber-400' : 'bg-gray-50'
                  }`}
                >
                  <p className="font-medium">{preset.name}</p>
                  <p className="text-xs text-gray-500">🧂 {preset.salt_g}g {preset.calories}kcal</p>
                  {preset.warning && <p className="text-xs text-amber-600 mt-1">⚠️ {preset.warning}</p>}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'custom' && (
            <div className="space-y-3">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="例: コンビニのサラダ、唐揚げ弁当"
                className="w-full px-4 py-3 rounded-xl border border-gray-200"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500">カロリー (任意)</label>
                  <input
                    type="number"
                    value={customCalories}
                    onChange={e => setCustomCalories(e.target.value)}
                    placeholder="kcal"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">塩分 (任意)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={customSalt}
                    onChange={e => setCustomSalt(e.target.value)}
                    placeholder="g"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 量の調整 */}
        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-2">量</label>
          <div className="flex gap-2">
            {['0.5', '1', '1.5', '2'].map((p) => (
              <button
                key={p}
                onClick={() => setPortion(p)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium ${
                  portion === p ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {p === '1' ? '普通' : `×${p}`}
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          fullWidth
          disabled={
            isSaving ||
            (activeTab === 'ai' && !aiResult) ||
            (activeTab === 'recipe' && !selectedRecipe) ||
            (activeTab === 'preset' && !selectedPreset) ||
            (activeTab === 'homemade' && (!homemadeName || seasoningEntries.length === 0)) ||
            (activeTab === 'custom' && !customName)
          }
        >
          {isSaving ? '記録中...' : '記録する'}
        </Button>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default function FoodLogPage() {
  return (
    <Suspense fallback={
      <div className="p-4 flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <FoodLogContent />
    </Suspense>
  );
}
