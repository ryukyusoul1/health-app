'use client';

import React, { useState } from 'react';
import Button from '../ui/Button';

interface BPInputProps {
  onSubmit: (data: {
    systolic: number;
    diastolic: number;
    pulse?: number;
    timing: 'morning' | 'evening';
  }) => void;
  isLoading?: boolean;
}

export default function BPInput({ onSubmit, isLoading }: BPInputProps) {
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [pulse, setPulse] = useState('');
  const [timing, setTiming] = useState<'morning' | 'evening'>('morning');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!systolic || !diastolic) return;

    onSubmit({
      systolic: parseInt(systolic),
      diastolic: parseInt(diastolic),
      pulse: pulse ? parseInt(pulse) : undefined,
      timing,
    });

    // フォームをリセット
    setSystolic('');
    setDiastolic('');
    setPulse('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* タイミング選択 */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTiming('morning')}
          className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
            timing === 'morning'
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          🌅 朝
        </button>
        <button
          type="button"
          onClick={() => setTiming('evening')}
          className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
            timing === 'evening'
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          🌙 夜
        </button>
      </div>

      {/* 血圧入力 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-600 mb-1">上（収縮期）</label>
          <input
            type="number"
            inputMode="numeric"
            value={systolic}
            onChange={(e) => setSystolic(e.target.value)}
            placeholder="120"
            className="w-full px-4 py-3 text-xl font-bold text-center rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">下（拡張期）</label>
          <input
            type="number"
            inputMode="numeric"
            value={diastolic}
            onChange={(e) => setDiastolic(e.target.value)}
            placeholder="80"
            className="w-full px-4 py-3 text-xl font-bold text-center rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
            required
          />
        </div>
      </div>

      {/* 脈拍（オプション） */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">脈拍（任意）</label>
        <input
          type="number"
          inputMode="numeric"
          value={pulse}
          onChange={(e) => setPulse(e.target.value)}
          placeholder="70"
          className="w-full px-4 py-3 text-lg text-center rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
        />
      </div>

      <Button type="submit" fullWidth disabled={isLoading || !systolic || !diastolic}>
        {isLoading ? '記録中...' : '記録する'}
      </Button>
    </form>
  );
}
