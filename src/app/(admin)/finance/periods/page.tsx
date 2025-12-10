"use client";

import React, { useState, useEffect } from 'react';
import { useFinancePeriods, useUpdatePeriod } from '@/hooks/useFinanceQuery';
import { financeService } from '@/services';
import { authManager } from '@/lib/auth';

interface CashPeriod {
  id: number;
  name: string;
  amount: number;
  late_fee_per_day: number;
  due_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function CashPeriodsPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    amount: 50000,
    late_fee_per_day: 5000,
    due_date: new Date().toISOString().split('T')[0]
  });

  // Use query hook
  const { data: periodsData, isLoading: periodsLoading, refetch: refetchPeriods } = useFinancePeriods();
  const periods = periodsData || [];
  const updatePeriodMutation = useUpdatePeriod();

  // Detail modal state
  const [detailPeriodId, setDetailPeriodId] = useState<number | null>(null);
  const [detailTransactions, setDetailTransactions] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTotal, setDetailTotal] = useState<number>(0);

  const openPeriodDetail = async (periodId: number) => {
    setDetailPeriodId(periodId);
    setDetailLoading(true);
    try {
      const txs = await financeService.getAllTransactions({ period_id: periodId, limit: 1000 });
      const safe = (txs || []).map((t: any) => ({
        ...t,
        amount: Number(t.amount ?? t.period?.amount ?? 0),
        fine_amount: Number(t.fine_amount ?? 0),
      }));
      setDetailTransactions(safe);
      const total = safe.reduce((sum: number, t: any) => sum + (t.amount || 0) + (t.fine_amount || 0), 0);
      setDetailTotal(total);
    } catch (err) {
      console.error('Failed to load period transactions', err);
      setDetailTransactions([]);
      setDetailTotal(0);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await authManager.fetchMe();
        setUser(userData);
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const formatCurrency = (amount: number) => {
    const formatted = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
    // Remove trailing comma after Rp
    return formatted.replace(/,\s*$/, '');
  };

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateLoading(true);
    
    try {
      await financeService.createPeriod({
        name: formData.name,
        amount: formData.amount,
        late_fee_per_day: formData.late_fee_per_day,
        due_date: formData.due_date,
        is_active: true
      });

      setShowCreateModal(false);
      setFormData({
        name: '',
        amount: 50000,
        late_fee_per_day: 5000,
        due_date: new Date().toISOString().split('T')[0]
      });
      
      // Refetch periods
      refetchPeriods();
    } catch (error) {
      console.error('Failed to create period:', error);
      const errorMsg = error instanceof Error ? error.message : 'Gagal membuat periode';
      setCreateError(errorMsg);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleClosePeriod = async (periodId: number) => {
    try {
      await updatePeriodMutation.mutateAsync({
        id: periodId,
        data: { is_active: false }
      });
    } catch (error) {
      console.error('Failed to close period:', error);
      alert('Gagal menutup periode');
    }
  };

  if (loading || periodsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Periode Kas</h1>
        <p className="text-gray-600 dark:text-gray-400">Kelola periode keuangan organisasi</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Daftar Periode
            </h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Buat Periode Baru
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Nama Periode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Jumlah Kas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Denda/Hari
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Batas Bayar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {periods.map((period) => (
                <tr key={period.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {period.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatCurrency(period.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatCurrency(period.late_fee_per_day)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {new Date(period.due_date).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      period.is_active
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {period.is_active ? 'Aktif' : 'Tutup'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <button onClick={() => openPeriodDetail(period.id)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                        Detail
                      </button>
                      {period.is_active && (
                        <button
                          onClick={() => handleClosePeriod(period.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Tutup
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {periods.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-500 dark:text-gray-400">
              Belum ada periode kas
            </div>
          </div>
        )}
      </div>

      {/* Period Detail Modal */}
      {detailPeriodId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => { setDetailPeriodId(null); setDetailTransactions([]); setDetailTotal(0); }}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Detail Periode</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Terkumpul: {formatCurrency(detailTotal)}</p>
              </div>
              <button 
                onClick={() => { setDetailPeriodId(null); setDetailTransactions([]); setDetailTotal(0); }} 
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-6">
              {detailLoading ? (
                <div className="text-center py-8 text-gray-500">Memuat...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">User</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Jumlah</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Denda</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Tanggal</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {detailTransactions.map((t) => (
                        <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-3 text-gray-900 dark:text-white">{t.user?.name ?? t.user_id}</td>
                          <td className="px-4 py-3 text-gray-900 dark:text-white">{formatCurrency(t.period?.amount ?? 0)}</td>
                          <td className="px-4 py-3 text-gray-900 dark:text-white">{formatCurrency(t.fine_amount ?? 0)}</td>
                          <td className="px-4 py-3 text-gray-900 dark:text-white">{t.payment_date ? new Date(t.payment_date).toLocaleDateString('id-ID') : '-'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              t.status === 'COMPLETE' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : t.status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}>
                              {t.status === 'COMPLETE' ? 'Selesai' : 
                               t.status === 'PENDING' ? 'Menunggu' : 'Ditolak'}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {detailTransactions.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                            Belum ada transaksi untuk periode ini.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => { setDetailPeriodId(null); setDetailTransactions([]); setDetailTotal(0); }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Period Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Buat Periode Baru
            </h3>

            {createError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                {createError}
              </div>
            )}
            
            <form onSubmit={handleCreatePeriod}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nama Periode
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="contoh: Januari 2024"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Jumlah Kas
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    min="0"
                    step="1000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Denda Per Hari
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.late_fee_per_day}
                    onChange={(e) => setFormData({...formData, late_fee_per_day: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    min="0"
                    step="1000"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Batas Pembayaran
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.due_date}
                    onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateError(null);
                  }}
                  disabled={createLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createLoading ? 'Membuat...' : 'Buat Periode'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
