'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Recipe } from '@/types';
import { CATEGORY_LABELS } from '@/lib/constants';
import * as storage from '@/lib/storage';

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!storage.isInitialized()) {
      storage.initializeData();
    }

    if (params.id) {
      const id = Array.isArray(params.id) ? params.id[0] : params.id;
      const foundRecipe = storage.getRecipeById(id);
      setRecipe(foundRecipe);
      setIsLoading(false);
    }
  }, [params.id]);

  const handleFavoriteToggle = () => {
    if (!recipe) return;
    storage.toggleRecipeFavorite(recipe.id);
    setRecipe(prev => prev ? { ...prev, is_favorite: !prev.is_favorite } : null);
  };

  const handleAddToLog = () => {
    router.push(`/log/food?recipe=${recipe?.id}`);
  };

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-600">レシピが見つかりませんでした</p>
        <Button onClick={() => router.back()} className="mt-4">
          戻る
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* ヘッダー */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
              {CATEGORY_LABELS[recipe.category] || recipe.category}
            </span>
            <span className="text-xs text-gray-500">⏱ {recipe.cook_time_min}分</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">{recipe.name}</h1>
        </div>
        <button
          onClick={handleFavoriteToggle}
          className="text-3xl"
        >
          {recipe.is_favorite ? '⭐' : '☆'}
        </button>
      </div>

      {/* 栄養情報 */}
      <Card className="mb-4">
        <h2 className="font-bold text-gray-800 mb-3">栄養情報</h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-primary/5 rounded-xl">
            <p className="text-xs text-gray-500">塩分</p>
            <p className="text-xl font-bold text-primary">{recipe.salt_g}g</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500">糖質</p>
            <p className="text-xl font-bold text-gray-700">{recipe.carbs_g || '-'}g</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500">カロリー</p>
            <p className="text-xl font-bold text-gray-700">{recipe.calories || '-'}</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500">たんぱく</p>
            <p className="text-xl font-bold text-gray-700">{recipe.protein_g || '-'}g</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500">食物繊維</p>
            <p className="text-xl font-bold text-gray-700">{recipe.fiber_g || '-'}g</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500">調理時間</p>
            <p className="text-xl font-bold text-gray-700">{recipe.cook_time_min || '-'}分</p>
          </div>
        </div>
      </Card>

      {/* 材料 */}
      <Card className="mb-4">
        <h2 className="font-bold text-gray-800 mb-3">材料（{recipe.servings}人分）</h2>
        <ul className="space-y-2">
          {recipe.ingredients.map((ing, i) => (
            <li key={i} className="flex justify-between text-gray-700 py-1 border-b border-gray-100 last:border-0">
              <span>{ing.name}</span>
              <span className="text-gray-500">{ing.amount}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* 作り方 */}
      <Card className="mb-4">
        <h2 className="font-bold text-gray-800 mb-3">作り方</h2>
        <ol className="space-y-3">
          {recipe.steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm flex-shrink-0">
                {i + 1}
              </span>
              <span className="text-gray-700">{step}</span>
            </li>
          ))}
        </ol>
      </Card>

      {/* 減塩のコツ */}
      {recipe.salt_tips && recipe.salt_tips.length > 0 && (
        <Card className="mb-4 bg-primary/5 border-primary/20">
          <h2 className="font-bold text-primary mb-2 flex items-center gap-2">
            <span>🧂</span>
            減塩のコツ
          </h2>
          <ul className="space-y-1">
            {recipe.salt_tips.map((tip, i) => (
              <li key={i} className="text-gray-700 text-sm flex items-start gap-1">
                <span>•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* アクションボタン */}
      <div className="sticky bottom-20 bg-background pt-4">
        <Button onClick={handleAddToLog} fullWidth>
          🍽️ 食事として記録する
        </Button>
      </div>
    </div>
  );
}
