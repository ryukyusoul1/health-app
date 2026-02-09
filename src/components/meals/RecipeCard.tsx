'use client';

import React from 'react';
import Link from 'next/link';
import Card from '../ui/Card';
import { Recipe } from '@/types';
import { CATEGORY_LABELS } from '@/lib/constants';

interface RecipeCardProps {
  recipe: Recipe;
  onFavoriteToggle?: (id: string, isFavorite: boolean) => void;
  compact?: boolean;
}

export default function RecipeCard({
  recipe,
  onFavoriteToggle,
  compact = false,
}: RecipeCardProps) {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onFavoriteToggle) {
      onFavoriteToggle(recipe.id, !recipe.is_favorite);
    }
  };

  if (compact) {
    return (
      <Link href={`/meals/${recipe.id}`}>
        <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 hover:bg-gray-50 active:bg-gray-100 transition-colors">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-800 truncate">{recipe.name}</p>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
              <span>🧂 {recipe.salt_g}g</span>
              <span>⏱ {recipe.cooking_time_min}分</span>
            </div>
          </div>
          {onFavoriteToggle && (
            <button
              onClick={handleFavoriteClick}
              className="text-xl p-1"
            >
              {recipe.is_favorite ? '⭐' : '☆'}
            </button>
          )}
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/meals/${recipe.id}`}>
      <Card className="hover:bg-gray-50 active:bg-gray-100 transition-colors">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                {CATEGORY_LABELS[recipe.category]}
              </span>
              <span className="text-xs text-gray-500">⏱ {recipe.cooking_time_min}分</span>
            </div>
            <h3 className="font-bold text-gray-800 text-lg">{recipe.name}</h3>
          </div>
          {onFavoriteToggle && (
            <button
              onClick={handleFavoriteClick}
              className="text-2xl p-1"
            >
              {recipe.is_favorite ? '⭐' : '☆'}
            </button>
          )}
        </div>

        {/* 栄養情報 */}
        <div className="grid grid-cols-4 gap-2 mt-3 bg-gray-50 rounded-xl p-3">
          <div className="text-center">
            <p className="text-xs text-gray-500">塩分</p>
            <p className="font-bold text-primary">{recipe.salt_g}g</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">糖質</p>
            <p className="font-bold text-gray-700">{recipe.carbs_g || '-'}g</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">カロリー</p>
            <p className="font-bold text-gray-700">{recipe.calories || '-'}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">たんぱく</p>
            <p className="font-bold text-gray-700">{recipe.protein_g || '-'}g</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
