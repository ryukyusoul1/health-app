'use client';

import React from 'react';
import Card from '../ui/Card';

interface MissionCardProps {
  mission: {
    mission_text: string;
    completed: boolean;
  };
  streak?: {
    current_count: number;
    best_count: number;
  };
  onComplete: (completed: boolean) => void;
  isLoading?: boolean;
}

export default function MissionCard({
  mission,
  streak,
  onComplete,
  isLoading,
}: MissionCardProps) {
  return (
    <Card className={mission.completed ? 'bg-green-50 border-green-200' : ''}>
      <div className="flex items-start gap-3">
        <button
          onClick={() => onComplete(!mission.completed)}
          disabled={isLoading}
          style={{ touchAction: 'manipulation' }}
          className={`
            w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 select-none
            transition-all duration-200
            ${mission.completed
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-gray-300 hover:border-primary'
            }
            ${isLoading ? 'opacity-50' : ''}
          `}
        >
          {mission.completed && '✓'}
        </button>

        <div className="flex-1">
          <p className="text-sm text-gray-500 mb-1">今日のミッション</p>
          <p className={`font-medium ${mission.completed ? 'text-green-700 line-through' : 'text-gray-800'}`}>
            {mission.mission_text}
          </p>

          {mission.completed && (
            <p className="text-green-600 text-sm mt-2 flex items-center gap-1">
              <span>🎉</span>
              達成おめでとうございます！
            </p>
          )}
        </div>
      </div>

      {/* ストリーク表示 */}
      {streak && streak.current_count > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔥</span>
            <div>
              <p className="text-sm font-medium text-gray-800">
                {streak.current_count}日連続達成中！
              </p>
              {streak.best_count > streak.current_count && (
                <p className="text-xs text-gray-500">
                  最高記録: {streak.best_count}日
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
