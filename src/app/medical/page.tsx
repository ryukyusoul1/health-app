'use client';

import React, { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Toast from '@/components/ui/Toast';
import { MedicalVisit } from '@/types';

export default function MedicalPage() {
  const [visits, setVisits] = useState<MedicalVisit[]>([]);
  const [nextVisit, setNextVisit] = useState<MedicalVisit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // フォーム
  const [visitDate, setVisitDate] = useState('');
  const [department, setDepartment] = useState('循環器内科');
  const [doctorName, setDoctorName] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [nextVisitDate, setNextVisitDate] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await fetch('/api/medical-visits');
      const data = await res.json();

      if (data.success) {
        setVisits(data.data);
        setNextVisit(data.nextVisit || null);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSubmit = async () => {
    if (!visitDate) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/medical-visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visit_date: visitDate,
          department,
          doctor_name: doctorName || null,
          diagnosis: diagnosis || null,
          prescription: prescription || null,
          next_visit: nextVisitDate || null,
          note: note || null,
        }),
      });

      const result = await res.json();
      if (result.success) {
        setToast({ message: '受診記録を保存しました！', type: 'success' });
        setShowAddModal(false);
        resetForm();
        fetchData();
      } else {
        setToast({ message: result.error || 'エラーが発生しました', type: 'error' });
      }
    } catch (error) {
      console.error('Save error:', error);
      setToast({ message: 'エラーが発生しました', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setVisitDate('');
    setDepartment('循環器内科');
    setDoctorName('');
    setDiagnosis('');
    setPrescription('');
    setNextVisitDate('');
    setNote('');
  };

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">受診記録</h1>
        <p className="text-gray-600">通院・処方の管理</p>
      </header>

      {/* 受診促進カード */}
      {visits.length === 0 && (
        <Card variant="danger" className="mb-4">
          <div className="text-center py-2">
            <span className="text-4xl block mb-2">🏥</span>
            <h3 className="font-bold text-red-700 mb-1">まだ受診記録がありません</h3>
            <p className="text-red-600 text-sm mb-3">
              高血圧の状態です。循環器内科の受診をおすすめします
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              受診を記録する
            </Button>
          </div>
        </Card>
      )}

      {/* 次回予約 */}
      {nextVisit && (
        <Card className="mb-4 bg-primary/5">
          <h2 className="font-bold text-primary mb-2 flex items-center gap-2">
            <span>📅</span>
            次回予約
          </h2>
          <p className="text-xl font-bold text-gray-800">
            {new Date(nextVisit.next_visit!).toLocaleDateString('ja-JP', {
              month: 'long',
              day: 'numeric',
              weekday: 'short',
            })}
          </p>
          <p className="text-sm text-gray-600">{nextVisit.department}</p>
        </Card>
      )}

      {/* 受診履歴 */}
      <Card className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-gray-800">受診履歴</h2>
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            + 追加
          </Button>
        </div>

        {visits.length === 0 ? (
          <p className="text-gray-500 text-center py-4">まだ記録がありません</p>
        ) : (
          <div className="space-y-3">
            {visits.map((visit) => (
              <div key={visit.id} className="p-3 bg-gray-50 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-gray-800">
                      {new Date(visit.visit_date).toLocaleDateString('ja-JP')}
                    </p>
                    <p className="text-sm text-gray-600">{visit.department}</p>
                  </div>
                  {visit.doctor_name && (
                    <span className="text-sm text-gray-500">{visit.doctor_name}先生</span>
                  )}
                </div>
                {visit.diagnosis && (
                  <p className="text-sm text-gray-700 mb-1">
                    <span className="text-gray-500">診断: </span>
                    {visit.diagnosis}
                  </p>
                )}
                {visit.prescription && (
                  <p className="text-sm text-gray-700 mb-1">
                    <span className="text-gray-500">処方: </span>
                    {visit.prescription}
                  </p>
                )}
                {visit.note && (
                  <p className="text-sm text-gray-600 italic">{visit.note}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 追加モーダル */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title="受診記録を追加"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">受診日 *</label>
            <input
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">診療科</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200"
            >
              <option>循環器内科</option>
              <option>内科</option>
              <option>呼吸器内科</option>
              <option>糖尿病内科</option>
              <option>その他</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">担当医</label>
            <input
              type="text"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              placeholder="例: 田中"
              className="w-full px-4 py-3 rounded-xl border border-gray-200"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">診断・所見</label>
            <textarea
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="例: 本態性高血圧"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 resize-none"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">処方</label>
            <textarea
              value={prescription}
              onChange={(e) => setPrescription(e.target.value)}
              placeholder="例: 降圧剤 1日1回"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 resize-none"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">次回予約日</label>
            <input
              type="date"
              value={nextVisitDate}
              onChange={(e) => setNextVisitDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">メモ</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="その他気になったことなど"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 resize-none"
              rows={2}
            />
          </div>

          <Button
            onClick={handleSubmit}
            fullWidth
            disabled={isSaving || !visitDate}
          >
            {isSaving ? '保存中...' : '保存する'}
          </Button>
        </div>
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
