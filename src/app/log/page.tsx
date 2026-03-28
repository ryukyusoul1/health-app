'use client';

import React from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';

export default function LogPage() {
  const logTypes = [
    {
      href: '/log/food',
      icon: '🍽️',
      title: '食事記録',
      description: '朝・昼・夜の食事を記録',
      color: 'bg-primary/10',
    },
    {
      href: '/log/blood-pressure',
      icon: '💓',
      title: '血圧記録',
      description: '朝・夜の血圧を記録・グラフ確認',
      color: 'bg-red-50',
    },
    {
      href: '/log/body',
      icon: '⚖️',
      title: '体組成記録',
      description: '体重・体脂肪率・内臓脂肪・骨格筋率など',
      color: 'bg-blue-50',
    },
    {
      href: '/log/condition',
      icon: '😊',
      title: '体調記録',
      description: '動悸・むくみ・疲労度を記録',
      color: 'bg-amber-50',
    },
    {
      href: '/medical',
      icon: '🏥',
      title: '受診記録',
      description: '通院・処方・次回予約を管理',
      color: 'bg-purple-50',
    },
  ];

  return (
    <div className="p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">記録</h1>
        <p className="text-gray-600">毎日の健康状態を記録しましょう</p>
      </header>

      <div className="space-y-3">
        {logTypes.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className={`${item.color} hover:opacity-90 transition-opacity`}>
              <div className="flex items-center gap-4">
                <span className="text-4xl">{item.icon}</span>
                <div className="flex-1">
                  <h2 className="font-bold text-gray-800 text-lg">{item.title}</h2>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
                <span className="text-gray-400 text-xl">→</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
