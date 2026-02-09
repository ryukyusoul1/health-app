'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'danger' | 'warning' | 'success';
  onClick?: () => void;
}

export default function Card({
  children,
  className = '',
  variant = 'default',
  onClick,
}: CardProps) {
  const variantStyles = {
    default: 'bg-white',
    danger: 'bg-red-50 border-red-200',
    warning: 'bg-amber-50 border-amber-200',
    success: 'bg-green-50 border-green-200',
  };

  return (
    <div
      className={`
        rounded-2xl p-4 shadow-sm border border-gray-100
        ${variantStyles[variant]}
        ${onClick ? 'cursor-pointer active:scale-[0.99] transition-transform' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
