'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', icon: '🏠', label: 'ホーム' },
  { href: '/meals', icon: '🍱', label: '献立' },
  { href: '/log', icon: '📝', label: '記録' },
  { href: '/analysis', icon: '📊', label: '分析' },
  { href: '/settings', icon: '⚙️', label: '設定' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center justify-center w-16 h-full
                transition-colors
                ${isActive ? 'text-primary' : 'text-gray-500'}
              `}
            >
              <span className="text-2xl mb-0.5">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
