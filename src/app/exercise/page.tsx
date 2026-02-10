'use client';

import React, { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Toast from '@/components/ui/Toast';
import { EXERCISES, EXERCISE_CATEGORY_LABELS, DIFFICULTY_LABELS, Exercise } from '@/lib/exercises';
import * as storage from '@/lib/storage';

export default function ExercisePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [todayLogs, setTodayLogs] = useState<storage.ExerciseLog[]>([]);
  const [summary, setSummary] = useState({ total_duration: 0, total_calories: 0, completed_count: 0 });
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const categories = [
    { key: 'all', label: 'すべて' },
    { key: 'stretch', label: 'ストレッチ' },
    { key: 'strength', label: '筋トレ' },
    { key: 'cardio', label: '有酸素' },
    { key: 'relaxation', label: 'リラックス' },
  ];

  useEffect(() => {
    if (!storage.isInitialized()) {
      storage.initializeData();
    }
    loadData();
  }, []);

  function loadData() {
    const logs = storage.getExerciseLogs(today);
    setTodayLogs(logs);
    setSummary(storage.getTodayExerciseSummary());
  }

  const filteredExercises = selectedCategory === 'all'
    ? EXERCISES
    : EXERCISES.filter(e => e.category === selectedCategory);

  const handleStartExercise = (exercise: Exercise) => {
    // 運動を開始（記録を追加）
    storage.addExerciseLog({
      logged_date: today,
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      duration_min: exercise.duration_min,
      calories_burned: exercise.calories_burned,
      completed: false,
    });
    setSelectedExercise(exercise);
    setShowDetailModal(true);
    loadData();
  };

  const handleCompleteExercise = () => {
    // 最新の未完了ログを完了にする
    const logs = storage.getExerciseLogs(today);
    const incompleteLog = logs.find(l => l.exercise_id === selectedExercise?.id && !l.completed);
    if (incompleteLog) {
      storage.toggleExerciseComplete(incompleteLog.id);
    }
    setToast({ message: 'お疲れさまでした！運動完了です', type: 'success' });
    setShowDetailModal(false);
    setSelectedExercise(null);
    loadData();
  };

  const isExerciseDoneToday = (exerciseId: string) => {
    return todayLogs.some(l => l.exercise_id === exerciseId && l.completed);
  };

  return (
    <div className="p-4">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">運動メニュー</h1>
        <p className="text-gray-600">座ったままできる簡単エクササイズ</p>
      </header>

      {/* 今日のサマリー */}
      <Card className="mb-4 bg-primary/5">
        <h2 className="font-bold text-primary mb-3">今日の運動</h2>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-gray-500">完了数</p>
            <p className="text-2xl font-bold text-primary">{summary.completed_count}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">合計時間</p>
            <p className="text-2xl font-bold text-gray-700">{summary.total_duration}分</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">消費カロリー</p>
            <p className="text-2xl font-bold text-gray-700">{summary.total_calories}kcal</p>
          </div>
        </div>
      </Card>

      {/* カテゴリフィルター */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
        {categories.map(cat => (
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

      {/* おすすめセクション */}
      <Card className="mb-4">
        <h2 className="font-bold text-gray-800 mb-3">
          🌟 今日のおすすめ（疲れている時に）
        </h2>
        <div className="space-y-2">
          {EXERCISES.filter(e => e.difficulty === 1).slice(0, 3).map(exercise => (
            <ExerciseItem
              key={exercise.id}
              exercise={exercise}
              isDone={isExerciseDoneToday(exercise.id)}
              onStart={() => handleStartExercise(exercise)}
            />
          ))}
        </div>
      </Card>

      {/* 運動一覧 */}
      <Card>
        <h2 className="font-bold text-gray-800 mb-3">
          {selectedCategory === 'all' ? 'すべての運動' : EXERCISE_CATEGORY_LABELS[selectedCategory]}
        </h2>
        <div className="space-y-2">
          {filteredExercises.map(exercise => (
            <ExerciseItem
              key={exercise.id}
              exercise={exercise}
              isDone={isExerciseDoneToday(exercise.id)}
              onStart={() => handleStartExercise(exercise)}
            />
          ))}
        </div>
      </Card>

      {/* 運動詳細モーダル */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedExercise(null);
        }}
        title={selectedExercise?.name || ''}
      >
        {selectedExercise && (
          <div>
            <p className="text-gray-600 mb-4">{selectedExercise.description}</p>

            {/* 情報 */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="text-center p-2 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500">時間</p>
                <p className="font-bold">{selectedExercise.duration_min}分</p>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500">消費</p>
                <p className="font-bold">{selectedExercise.calories_burned}kcal</p>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500">難易度</p>
                <p className="font-bold">{DIFFICULTY_LABELS[selectedExercise.difficulty]}</p>
              </div>
            </div>

            {/* やり方 */}
            <div className="mb-4">
              <h3 className="font-bold text-gray-800 mb-2">やり方</h3>
              <ol className="space-y-2">
                {selectedExercise.steps.map((step, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center text-xs flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-gray-700 text-sm">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* 効果 */}
            <div className="mb-4 p-3 bg-green-50 rounded-xl">
              <h3 className="font-bold text-green-700 mb-1 text-sm">期待できる効果</h3>
              <div className="flex flex-wrap gap-1">
                {selectedExercise.benefits.map((benefit, i) => (
                  <span key={i} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    {benefit}
                  </span>
                ))}
              </div>
            </div>

            {/* 注意 */}
            {selectedExercise.caution && (
              <div className="mb-4 p-3 bg-amber-50 rounded-xl">
                <p className="text-amber-700 text-sm">⚠️ {selectedExercise.caution}</p>
              </div>
            )}

            <Button onClick={handleCompleteExercise} fullWidth>
              ✓ 完了！
            </Button>
          </div>
        )}
      </Modal>

      {/* トースト */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

// 運動アイテムコンポーネント
function ExerciseItem({
  exercise,
  isDone,
  onStart,
}: {
  exercise: Exercise;
  isDone: boolean;
  onStart: () => void;
}) {
  return (
    <div className={`p-3 rounded-xl border ${isDone ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              isDone ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
            }`}>
              {EXERCISE_CATEGORY_LABELS[exercise.category]}
            </span>
            <span className="text-xs text-gray-500">
              {exercise.duration_min}分 · {exercise.calories_burned}kcal
            </span>
          </div>
          <p className={`font-medium ${isDone ? 'text-green-700' : 'text-gray-800'}`}>
            {isDone && '✓ '}{exercise.name}
          </p>
          <p className="text-xs text-gray-500">{exercise.description}</p>
        </div>
        {!isDone && (
          <Button size="sm" onClick={onStart}>
            開始
          </Button>
        )}
      </div>
    </div>
  );
}
