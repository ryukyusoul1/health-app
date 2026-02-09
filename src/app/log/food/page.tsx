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
  const [activeTab, setActiveTab] = useState<'recipe' | 'preset' | 'custom'>('recipe');

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
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

  async function fetchData() {
    setIsLoading(true);
    try {
      const [logsRes, recipesRes, presetsRes] = await Promise.all([
        fetch(`/api/food-log?date=${today}`),
        fetch('/api/recipes'),
        fetch('/api/eating-out'),
      ]);

      const logsData = await logsRes.json();
      const recipesData = await recipesRes.json();
      const presetsData = await presetsRes.json();

      if (logsData.success) {
        setLogs(logsData.data);
        setSummary(logsData.summary);
      }
      if (recipesData.success) {
        setRecipes(recipesData.data);
      }
      if (presetsData.success) {
        setPresets(presetsData.data);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      const portionNum = parseFloat(portion) || 1;

      const body: Record<string, unknown> = {
        logged_date: today,
        meal_type: selectedMealType,
        portion: portionNum,
      };

      if (activeTab === 'recipe' && selectedRecipe) {
        body.recipe_id = selectedRecipe.id;
        body.calories = (selectedRecipe.calories || 0) * portionNum;
        body.salt_g = selectedRecipe.salt_g * portionNum;
        body.carbs_g = (selectedRecipe.carbs_g || 0) * portionNum;
        body.protein_g = (selectedRecipe.protein_g || 0) * portionNum;
        body.fiber_g = (selectedRecipe.fiber_g || 0) * portionNum;
      } else if (activeTab === 'preset' && selectedPreset) {
        body.custom_name = selectedPreset.name;
        body.calories = (selectedPreset.calories || 0) * portionNum;
        body.salt_g = (selectedPreset.salt_g || 0) * portionNum;
        body.carbs_g = (selectedPreset.carbs_g || 0) * portionNum;
        body.protein_g = (selectedPreset.protein_g || 0) * portionNum;
      } else if (activeTab === 'custom' && customName) {
        body.custom_name = customName;
      }

      const res = await fetch('/api/food-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await res.json();
      if (result.success) {
        setToast({ message: '記録しました！', type: 'success' });
        setShowAddModal(false);
        resetForm();
        fetchData();
      } else {
        setToast({ message: result.error || 'エラーが発生しました', type: 'error' });
      }
    } catch (error) {
      console.error('Save error:', error);
      setToast({ message: 'エラーが発生しました', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/food-log?id=${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const resetForm = () => {
    setSelectedRecipe(null);
    setSelectedPreset(null);
    setCustomName('');
    setPortion('1');
    setActiveTab('recipe');
  };

  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];

  return (
    <div className="p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">食事記録</h1>
        <p className="text-gray-600">{new Date().toLocaleDateString('ja-JP')}</p>
      </header>

      {/* 栄養サマリー */}
      <DailySummary summary={summary} />

      {/* 今日の記録 */}
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
              <div
                key={log.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
              >
                <div>
                  <p className="text-xs text-gray-500">
                    {MEAL_TYPE_LABELS[log.meal_type]}
                  </p>
                  <p className="font-medium text-gray-800">
                    {log.recipe?.name || log.custom_name || '食事'}
                    {log.portion !== 1 && ` ×${log.portion}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    🧂{log.salt_g?.toFixed(1) || '-'}g
                    {log.calories && ` ${log.calories}kcal`}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(log.id)}
                  className="text-red-500 text-sm"
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 追加ボタン */}
      <Button
        onClick={() => setShowAddModal(true)}
        fullWidth
        className="sticky bottom-20"
      >
        🍽️ 食事を追加
      </Button>

      {/* 追加モーダル */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
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
                  selectedMealType === type
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {MEAL_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        {/* タブ切り替え */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('recipe')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium ${
              activeTab === 'recipe'
                ? 'bg-primary/10 text-primary'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            レシピ
          </button>
          <button
            onClick={() => setActiveTab('preset')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium ${
              activeTab === 'preset'
                ? 'bg-primary/10 text-primary'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            外食
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium ${
              activeTab === 'custom'
                ? 'bg-primary/10 text-primary'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            その他
          </button>
        </div>

        {/* 選択エリア */}
        <div className="max-h-60 overflow-y-auto mb-4">
          {activeTab === 'recipe' && (
            <div className="space-y-2">
              {recipes.map((recipe) => (
                <button
                  key={recipe.id}
                  onClick={() => setSelectedRecipe(recipe)}
                  className={`w-full p-3 text-left rounded-xl transition-colors ${
                    selectedRecipe?.id === recipe.id
                      ? 'bg-primary/10 border-2 border-primary'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <p className="font-medium">{recipe.name}</p>
                  <p className="text-xs text-gray-500">
                    🧂 {recipe.salt_g}g {recipe.calories}kcal
                  </p>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'preset' && (
            <div className="space-y-2">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setSelectedPreset(preset)}
                  className={`w-full p-3 text-left rounded-xl transition-colors ${
                    selectedPreset?.id === preset.id
                      ? 'bg-amber-50 border-2 border-amber-400'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <p className="font-medium">{preset.name}</p>
                  <p className="text-xs text-gray-500">
                    🧂 {preset.salt_g}g {preset.calories}kcal
                  </p>
                  {preset.warning && (
                    <p className="text-xs text-amber-600 mt-1">⚠️ {preset.warning}</p>
                  )}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'custom' && (
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="例: コンビニのサラダ"
              className="w-full px-4 py-3 rounded-xl border border-gray-200"
            />
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
                  portion === p
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600'
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
            (activeTab === 'recipe' && !selectedRecipe) ||
            (activeTab === 'preset' && !selectedPreset) ||
            (activeTab === 'custom' && !customName)
          }
        >
          {isSaving ? '記録中...' : '記録する'}
        </Button>
      </Modal>

      {/* トースト */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
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
