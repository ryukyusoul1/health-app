'use client';

import React, { useEffect, useState } from 'react';
import RecipeCard from '@/components/meals/RecipeCard';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Toast from '@/components/ui/Toast';
import { Recipe } from '@/types';
import { CATEGORY_LABELS } from '@/lib/constants';
import * as storage from '@/lib/storage';

export default function MealsPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFavorites, setShowFavorites] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // 新規レシピフォーム
  const [newRecipe, setNewRecipe] = useState({
    name: '',
    category: 'main',
    cook_time_min: 20,
    servings: 2,
    calories: '',
    salt_g: '',
    carbs_g: '',
    protein_g: '',
    fiber_g: '',
    ingredientText: '',
    stepsText: '',
    salt_tips: '',
  });

  const categories = [
    { key: 'all', label: 'すべて' },
    { key: 'main', label: '主菜' },
    { key: 'side', label: '副菜' },
    { key: 'soup', label: '汁物' },
    { key: 'rice', label: 'ごはん' },
    { key: 'snack', label: '間食' },
  ];

  useEffect(() => {
    if (!storage.isInitialized()) {
      storage.initializeData();
    }
  }, []);

  useEffect(() => {
    fetchRecipes();
  }, [selectedCategory, showFavorites, searchQuery]);

  function fetchRecipes() {
    setIsLoading(true);
    try {
      const data = storage.getRecipes({
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        favorite: showFavorites || undefined,
        search: searchQuery || undefined,
      });
      setRecipes(data);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleFavoriteToggle = (id: string) => {
    storage.toggleRecipeFavorite(id);
    setRecipes(prev =>
      prev.map(r => (r.id === id ? { ...r, is_favorite: !r.is_favorite } : r))
    );
  };

  const handleAddRecipe = () => {
    if (!newRecipe.name || !newRecipe.salt_g) {
      setToast({ message: '料理名と塩分は必須です', type: 'error' });
      return;
    }

    const ingredients = newRecipe.ingredientText
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        const parts = line.split(/[：:]|\s{2,}/);
        return { name: parts[0]?.trim() || line.trim(), amount: parts[1]?.trim() || '' };
      });

    const steps = newRecipe.stepsText
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.trim());

    const saltTips = newRecipe.salt_tips
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.trim());

    storage.addRecipe({
      id: 'custom_' + Date.now().toString(36),
      name: newRecipe.name,
      category: newRecipe.category,
      cook_time_min: newRecipe.cook_time_min,
      servings: newRecipe.servings,
      calories: parseFloat(newRecipe.calories) || 0,
      salt_g: parseFloat(newRecipe.salt_g) || 0,
      carbs_g: parseFloat(newRecipe.carbs_g) || 0,
      protein_g: parseFloat(newRecipe.protein_g) || 0,
      fiber_g: parseFloat(newRecipe.fiber_g) || 0,
      ingredients: ingredients.length > 0 ? ingredients : [{ name: '-', amount: '-' }],
      steps: steps.length > 0 ? steps : ['-'],
      salt_tips: saltTips.length > 0 ? saltTips : undefined,
      is_favorite: false,
    });

    setToast({ message: 'レシピを追加しました！', type: 'success' });
    setShowAddModal(false);
    setNewRecipe({
      name: '', category: 'main', cook_time_min: 20, servings: 2,
      calories: '', salt_g: '', carbs_g: '', protein_g: '', fiber_g: '',
      ingredientText: '', stepsText: '', salt_tips: '',
    });
    fetchRecipes();
  };

  // カテゴリごとにグループ化
  const groupedRecipes = recipes.reduce((acc, recipe) => {
    const cat = recipe.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(recipe);
    return acc;
  }, {} as Record<string, Recipe[]>);

  return (
    <div className="p-4">
      <header className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">献立・レシピ</h1>
            <p className="text-gray-600">すべて塩分2g以下の減塩レシピ</p>
          </div>
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            + 追加
          </Button>
        </div>
      </header>

      {/* 検索 */}
      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="レシピを検索..."
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
        />
      </div>

      {/* フィルター */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(cat.key)}
            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
              selectedCategory === cat.key
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* お気に入りトグル */}
      <button
        onClick={() => setShowFavorites(!showFavorites)}
        className={`mb-4 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          showFavorites
            ? 'bg-amber-100 text-amber-700'
            : 'bg-gray-100 text-gray-600'
        }`}
      >
        お気に入りのみ
      </button>

      {/* レシピ一覧 */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          レシピが見つかりませんでした
        </div>
      ) : selectedCategory === 'all' ? (
        Object.entries(groupedRecipes).map(([category, categoryRecipes]) => (
          <div key={category} className="mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-3">
              {CATEGORY_LABELS[category] || category}
            </h2>
            <div className="space-y-3">
              {categoryRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="space-y-3">
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onFavoriteToggle={handleFavoriteToggle}
            />
          ))}
        </div>
      )}

      {/* レシピ追加モーダル */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="レシピを追加"
      >
        <div className="space-y-4">
          {/* 料理名 */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">料理名 *</label>
            <input
              type="text"
              value={newRecipe.name}
              onChange={(e) => setNewRecipe({ ...newRecipe, name: e.target.value })}
              placeholder="例: 鶏むね肉のレモン焼き"
              className="w-full px-3 py-2 rounded-xl border border-gray-200"
            />
          </div>

          {/* カテゴリ */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">カテゴリ</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'main', label: '主菜' },
                { key: 'side', label: '副菜' },
                { key: 'soup', label: '汁物' },
                { key: 'rice', label: 'ごはん' },
                { key: 'snack', label: '間食' },
              ].map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setNewRecipe({ ...newRecipe, category: cat.key })}
                  className={`py-2 rounded-xl text-sm ${
                    newRecipe.category === cat.key ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* 調理時間・人数 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">調理時間（分）</label>
              <input
                type="number"
                value={newRecipe.cook_time_min}
                onChange={(e) => setNewRecipe({ ...newRecipe, cook_time_min: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">何人分</label>
              <input
                type="number"
                value={newRecipe.servings}
                onChange={(e) => setNewRecipe({ ...newRecipe, servings: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200"
              />
            </div>
          </div>

          {/* 栄養情報 */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">栄養情報（1人分）</label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-gray-500">塩分(g) *</label>
                <input
                  type="number"
                  step="0.1"
                  value={newRecipe.salt_g}
                  onChange={(e) => setNewRecipe({ ...newRecipe, salt_g: e.target.value })}
                  placeholder="1.0"
                  className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500">カロリー</label>
                <input
                  type="number"
                  value={newRecipe.calories}
                  onChange={(e) => setNewRecipe({ ...newRecipe, calories: e.target.value })}
                  placeholder="200"
                  className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500">糖質(g)</label>
                <input
                  type="number"
                  step="0.1"
                  value={newRecipe.carbs_g}
                  onChange={(e) => setNewRecipe({ ...newRecipe, carbs_g: e.target.value })}
                  placeholder="10"
                  className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500">たんぱく(g)</label>
                <input
                  type="number"
                  step="0.1"
                  value={newRecipe.protein_g}
                  onChange={(e) => setNewRecipe({ ...newRecipe, protein_g: e.target.value })}
                  placeholder="20"
                  className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500">食物繊維(g)</label>
                <input
                  type="number"
                  step="0.1"
                  value={newRecipe.fiber_g}
                  onChange={(e) => setNewRecipe({ ...newRecipe, fiber_g: e.target.value })}
                  placeholder="3"
                  className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm"
                />
              </div>
            </div>
          </div>

          {/* 材料 */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">材料（1行1材料）</label>
            <textarea
              value={newRecipe.ingredientText}
              onChange={(e) => setNewRecipe({ ...newRecipe, ingredientText: e.target.value })}
              placeholder={"鶏むね肉：300g\nレモン：1個\n塩：少々"}
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
            />
          </div>

          {/* 作り方 */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">作り方（1行1ステップ）</label>
            <textarea
              value={newRecipe.stepsText}
              onChange={(e) => setNewRecipe({ ...newRecipe, stepsText: e.target.value })}
              placeholder={"鶏肉を一口大に切る\nレモン汁をかけて焼く"}
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
            />
          </div>

          {/* 減塩のコツ */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">減塩のコツ（任意）</label>
            <textarea
              value={newRecipe.salt_tips}
              onChange={(e) => setNewRecipe({ ...newRecipe, salt_tips: e.target.value })}
              placeholder="レモンで風味をつけて塩分控えめに"
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
            />
          </div>

          <Button onClick={handleAddRecipe} fullWidth>
            レシピを追加
          </Button>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
