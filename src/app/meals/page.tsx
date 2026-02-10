'use client';

import React, { useEffect, useState } from 'react';
import RecipeCard from '@/components/meals/RecipeCard';
import { Recipe } from '@/types';
import { CATEGORY_LABELS } from '@/lib/constants';
import * as storage from '@/lib/storage';

export default function MealsPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFavorites, setShowFavorites] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
        <h1 className="text-2xl font-bold text-gray-800">献立・レシピ</h1>
        <p className="text-gray-600">すべて塩分2g以下の減塩レシピ</p>
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
        ⭐ お気に入りのみ
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
        // カテゴリごとに表示
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
        // フラットに表示
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
    </div>
  );
}
