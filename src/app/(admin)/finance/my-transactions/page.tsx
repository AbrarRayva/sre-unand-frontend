"use client";

import React, { useState, useEffect } from 'react';
import { useMyTransactions, useCreateTransaction } from '@/hooks/useFinanceQuery';
import { financeService } from '@/services';
import { authManager } from '@/lib/auth';

interface Transaction {
  id: number;
  user_id: number;
  period_id: number;
  amount: number;
  payment_method: 'CASH' | 'TRANSFER';
  payment_date: string;
  status: 'COMPLETE' | 'PENDING' | 'REJECTED';
  proof?: string;
  fine_amount?: number;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  period?: {
    id: number;
    name: string;
    amount: number;
    late_fee_per_day: number;
    due_date: string;
  };
  created_at: string;
  updated_at: string;
}

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

export default function MyTransactionsPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [availablePeriods, setAvailablePeriods] = useState<CashPeriod[]>([]);
  const [paymentForm, setPaymentForm] = useState({
    period_id: '',
    payment_method: 'TRANSFER' as 'CASH' | 'TRANSFER',
    payment_date: new Date().toISOString().split('T')[0],
    proof: null as File | null
  });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Use query hooks
  const { data: transactionsData, isLoading: transactionsLoading, refetch: refetchTransactions } = useMyTransactions();
  const transactions = transactionsData || [];
  const safeTransactions = (transactions || []).map((t) => ({
    ...t,
    amount: Number(t.amount ?? t.period?.amount ?? 0),
    fine_amount: Number(t.fine_amount ?? 0),
  }));

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

  // Load available periods
  useEffect(() => {
    const loadAvailablePeriods = async () => {
      try {
        const periods = await financeService.getPeriods({ is_active: true });
        
        // Filter periods yang belum dibayar oleh user
        const unpaidPeriods = periods.filter((period: CashPeriod) => {
          return !transactions.some(transaction => 
            transaction.period_id === period.id
          );
        });
        
        setAvailablePeriods(unpaidPeriods);
      } catch (error) {
        console.error('Failed to load periods:', error);
      }
    };

    loadAvailablePeriods();
  }, [transactions]);

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitLoading(true);
    
    try {
      if (!paymentForm.period_id) {
        setSubmitError('Pilih periode pembayaran terlebih dahulu');
        return;
      }

      // Debug log
      console.log('Submitting payment with data:', {
        period_id: parseInt(paymentForm.period_id),
        payment_method: paymentForm.payment_method,
        payment_date: paymentForm.payment_date,
        has_proof: !!paymentForm.proof
      });

      await financeService.createTransaction({
        period_id: parseInt(paymentForm.period_id),
        payment_method: paymentForm.payment_method,
        payment_date: paymentForm.payment_date,
        proof: paymentForm.proof || undefined
      });

      setShowPaymentModal(false);
      setPaymentForm({
        period_id: '',
        payment_method: 'TRANSFER',
        payment_date: new Date().toISOString().split('T')[0],
        proof: null
      });
      
      // Refetch transactions
      refetchTransactions();
    } catch (error) {
      console.error('Failed to submit payment:', error);
      const errorMsg = error instanceof Error ? error.message : 'Gagal submit pembayaran';
      setSubmitError(errorMsg);
    } finally {
      setSubmitLoading(false);
    }
  };

  const formatCurrency = (amount?: number | null) => {
    const value = Number(amount ?? 0);
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(isNaN(value) ? 0 : value);
  };

  if (loading || transactionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transaksi Saya</h1>
        <p className="text-gray-600 dark:text-gray-400">Daftar transaksi keuangan Anda</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Riwayat Transaksi
            </h2>
            {availablePeriods.length > 0 ? (
              <button 
                onClick={() => setShowPaymentModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Bayar Kas
              </button>
            ) : (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Tidak ada periode pembayaran yang tersedia
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Periode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Jumlah Kas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Denda/Hari
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tanggal Bayar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Metode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Total Bayar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {safeTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {transaction.period?.name || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Due: {transaction.period?.due_date ? new Date(transaction.period.due_date).toLocaleDateString('id-ID') : 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {transaction.period?.amount ? formatCurrency(transaction.period.amount) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-white">
                    {transaction.period?.late_fee_per_day ? formatCurrency(transaction.period.late_fee_per_day) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {transaction.payment_date ? new Date(transaction.payment_date).toLocaleDateString('id-ID') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      transaction.payment_method === 'TRANSFER' 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {transaction.payment_method}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(transaction.period?.amount ?? 0)}
                    </div>
                    {transaction.fine_amount && transaction.fine_amount > 0 && (
                      <div className="text-xs text-red-600 dark:text-red-400">
                        +{formatCurrency(transaction.fine_amount)} denda
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      transaction.status === 'COMPLETE' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : transaction.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {transaction.status === 'COMPLETE' ? 'Selesai' : 
                       transaction.status === 'PENDING' ? 'Menunggu Verifikasi' : 'Ditolak'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {transactions.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-500 dark:text-gray-400">
              Belum ada transaksi
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Bayar Kas
              </h3>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSubmitError(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {submitError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmitPayment}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Periode Pembayaran
                  </label>
                  <select
                    value={paymentForm.period_id}
                    onChange={(e) => setPaymentForm({...paymentForm, period_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="">Pilih Periode</option>
                    {availablePeriods.map((period) => (
                      <option key={period.id} value={period.id}>
                        {period.name} - {formatCurrency(period.amount)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Metode Pembayaran
                  </label>
                  <select
                    value={paymentForm.payment_method}
                    onChange={(e) => setPaymentForm({...paymentForm, payment_method: e.target.value as 'CASH' | 'TRANSFER'})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="CASH">Tunai</option>
                    <option value="TRANSFER">Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tanggal Pembayaran
                  </label>
                  <input
                    type="date"
                    value={paymentForm.payment_date}
                    onChange={(e) => setPaymentForm({...paymentForm, payment_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                {paymentForm.payment_method === 'TRANSFER' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Bukti Transfer (Wajib)
                    </label>
                    <input
                      type="file"
                      onChange={(e) => setPaymentForm({...paymentForm, proof: e.target.files?.[0] || null})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      accept="image/*,.pdf"
                      required
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitLoading ? 'Mengirim...' : 'Submit Pembayaran'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPaymentModal(false);
                      setSubmitError(null);
                    }}
                    disabled={submitLoading}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
