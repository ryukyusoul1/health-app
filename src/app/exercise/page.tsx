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
  const [showAddModal, setShowAddModal] = useState(false);
  const [customExercises, setCustomExercises] = useState<storage.CustomExercise[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // 新規運動フォーム
  const [newExercise, setNewExercise] = useState({
    name: '',
    description: '',
    duration_min: 5,
    category: 'stretch' as 'stretch' | 'strength' | 'cardio' | 'relaxation',
    difficulty: 1 as 1 | 2 | 3,
    calories_burned: 10,
    stepsText: '',
    benefitsText: '',
    caution: '',
  });

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
    setCustomExercises(storage.getCustomExercises());
  }

  // すべての運動（デフォルト + カスタム）
  const allExercises: Exercise[] = [
    ...EXERCISES,
    ...customExercises.map(ce => ({
      id: ce.id,
      name: ce.name,
      description: ce.description,
      duration_min: ce.duration_min,
      category: ce.category,
      difficulty: ce.difficulty,
      calories_burned: ce.calories_burned,
      steps: ce.steps,
      benefits: ce.benefits,
      caution: ce.caution,
    })),
  ];

  const filteredExercises = selectedCategory === 'all'
    ? allExercises
    : allExercises.filter(e => e.category === selectedCategory);

  const handleStartExercise = (exercise: Exercise) => {
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

  const handleAddExercise = () => {
    if (!newExercise.name) {
      setToast({ message: '運動名は必須です', type: 'error' });
      return;
    }

    const steps = newExercise.stepsText.split('\n').filter(l => l.trim()).map(l => l.trim());
    const benefits = newExercise.benefitsText.split('\n').filter(l => l.trim()).map(l => l.trim());

    storage.addCustomExercise({
      name: newExercise.name,
      description: newExercise.description || newExercise.name,
      duration_min: newExercise.duration_min,
      category: newExercise.category,
      difficulty: newExercise.difficulty,
      calories_burned: newExercise.calories_burned,
      steps: steps.length > 0 ? steps : ['自分のペースで行う'],
      benefits: benefits.length > 0 ? benefits : ['健康維持'],
      caution: newExercise.caution || undefined,
    });

    setToast({ message: '運動を追加しました！', type: 'success' });
    setShowAddModal(false);
    setNewExercise({
      name: '', description: '', duration_min: 5,
      category: 'stretch', difficulty: 1, calories_burned: 10,
      stepsText: '', benefitsText: '', caution: '',
    });
    loadData();
  };

  const isExerciseDoneToday = (exerciseId: string) => {
    return todayLogs.some(l => l.exercise_id === exerciseId && l.completed);
  };

  return (
    <div className="p-4">
      <header className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">運動メニュー</h1>
            <p className="text-gray-600">座ったままできる簡単エクササイズ</p>
          </div>
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            + 追加
          </Button>
        </div>
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
          今日のおすすめ（疲れている時に）
        </h2>
        <div className="space-y-2">
          {allExercises.filter(e => e.difficulty === 1).slice(0, 3).map(exercise => (
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

            {selectedExercise.caution && (
              <div className="mb-4 p-3 bg-amber-50 rounded-xl">
                <p className="text-amber-700 text-sm">{selectedExercise.caution}</p>
              </div>
            )}

            <Button onClick={handleCompleteExercise} fullWidth>
              完了！
            </Button>
          </div>
        )}
      </Modal>

      {/* 運動追加モーダル */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="運動を追加"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">運動名 *</label>
            <input
              type="text"
              value={newExercise.name}
              onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
              placeholder="例: ウォーキング"
              className="w-full px-3 py-2 rounded-xl border border-gray-200"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">説明</label>
            <input
              type="text"
              value={newExercise.description}
              onChange={(e) => setNewExercise({ ...newExercise, description: e.target.value })}
              placeholder="例: 近所を散歩する"
              className="w-full px-3 py-2 rounded-xl border border-gray-200"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">カテゴリ</label>
            <div className="grid grid-cols-2 gap-2">
              {(['stretch', 'strength', 'cardio', 'relaxation'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setNewExercise({ ...newExercise, category: cat })}
                  className={`py-2 rounded-xl text-sm ${
                    newExercise.category === cat ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {EXERCISE_CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500">時間（分）</label>
              <input
                type="number"
                value={newExercise.duration_min}
                onChange={(e) => setNewExercise({ ...newExercise, duration_min: parseInt(e.target.value) || 0 })}
                className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500">消費kcal</label>
              <input
                type="number"
                value={newExercise.calories_burned}
                onChange={(e) => setNewExercise({ ...newExercise, calories_burned: parseInt(e.target.value) || 0 })}
                className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500">難易度</label>
              <div className="flex gap-1">
                {([1, 2, 3] as const).map(d => (
                  <button
                    key={d}
                    onClick={() => setNewExercise({ ...newExercise, difficulty: d })}
                    className={`flex-1 py-1.5 rounded-lg text-xs ${
                      newExercise.difficulty === d ? 'bg-primary text-white' : 'bg-gray-100'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">やり方（1行1ステップ）</label>
            <textarea
              value={newExercise.stepsText}
              onChange={(e) => setNewExercise({ ...newExercise, stepsText: e.target.value })}
              placeholder={"背筋を伸ばす\nゆっくり深呼吸する"}
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">効果（1行1つ）</label>
            <textarea
              value={newExercise.benefitsText}
              onChange={(e) => setNewExercise({ ...newExercise, benefitsText: e.target.value })}
              placeholder={"血行促進\nリラックス効果"}
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">注意点（任意）</label>
            <input
              type="text"
              value={newExercise.caution}
              onChange={(e) => setNewExercise({ ...newExercise, caution: e.target.value })}
              placeholder="例: 動悸がある場合は中止"
              className="w-full px-3 py-2 rounded-xl border border-gray-200"
            />
          </div>

          <Button onClick={handleAddExercise} fullWidth>
            運動を追加
          </Button>
        </div>
      </Modal>

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
