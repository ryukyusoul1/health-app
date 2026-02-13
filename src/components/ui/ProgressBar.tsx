'use client';

import React from 'react';

interface ProgressBarProps {
  value: number;
  max: number;
  label: string;
  unit?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'danger' | 'warning' | 'success';
}

export default function ProgressBar({
  value,
  max,
  label,
  unit = '',
  showValue = true,
  size = 'md',
  color = 'primary',
}: ProgressBarProps) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const isOver = max > 0 && value > max;

  const sizeStyles = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  const colorStyles = {
    primary: isOver ? 'bg-red-500' : 'bg-primary',
    danger: 'bg-red-500',
    warning: 'bg-amber-500',
    success: 'bg-green-500',
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-gray-600">{label}</span>
        {showValue && (
          <span className={`text-sm font-medium ${isOver ? 'text-red-600' : 'text-gray-700'}`}>
            {value.toFixed(1)}{unit} / {max}{unit}
          </span>
        )}
      </div>
      <div className={`w-full bg-gray-200 rounded-full ${sizeStyles[size]} overflow-hidden`}>
        <div
          className={`${sizeStyles[size]} ${colorStyles[color]} rounded-full transition-all duration-300`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      {isOver && (
        <p className="text-xs text-red-600 mt-1">
          目標を{(value - max).toFixed(1)}{unit}超過しています
        </p>
      )}
    </div>
  );
}
