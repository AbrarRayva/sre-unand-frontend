"use client";

import React, { useState, useEffect } from 'react';
import { financeService, CashPeriod as ServicePeriod, Transaction as ServiceTransaction } from '@/services/financeService';
import { authManager } from '@/lib/auth';

export default function CashManagementPage() {
  const [transactions, setTransactions] = useState<ServiceTransaction[]>([]);
  const [periods, setPeriods] = useState<ServicePeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'transactions' | 'periods'>('transactions');
  const [user, setUser] = useState<any>(null);
  const [proofModalUrl, setProofModalUrl] = useState<string | null>(null);
  const [detailPeriodId, setDetailPeriodId] = useState<number | null>(null);
  const [detailTransactions, setDetailTransactions] = useState<ServiceTransaction[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const me = await authManager.fetchMe();
        setUser(me);

        const [txs, prs] = await Promise.all([
          financeService.getAllTransactions({ limit: 100 }),
          financeService.getPeriods({ limit: 100 }),
        ]);

        // Defensive mapping to avoid NaN: ensure period amount is numeric
        const safeTxs = (txs || []).map((t) => ({ ...t, fine_amount: Number(t.fine_amount || 0) }));
        setTransactions(safeTxs);

        // Periods from backend already include amount and is_active; keep as-is but ensure numeric values
        const safePeriods = (prs || []).map((p) => ({ ...p, amount: Number((p as any).amount || 0) }));
        setPeriods(safePeriods);
      } catch (err) {
        console.error('Failed to load finance data', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const formatCurrency = (amount?: number | null) => {
    const value = Number(amount ?? 0);
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(isNaN(value) ? 0 : value);
  };

  const handleVerifyTransaction = async (transactionId: number, status: 'COMPLETE' | 'REJECTED') => {
    try {
      await financeService.verifyTransaction(transactionId, { status });
      // Refresh transactions
      const txs = await financeService.getAllTransactions({ limit: 100 });
      setTransactions((txs || []).map((t) => ({ ...t, fine_amount: Number(t.fine_amount || 0) })));
    } catch (err) {
      console.error('Failed to verify transaction', err);
    }
  };

  const openProof = (url?: string) => {
    if (!url) return;
    // If backend returns relative path, try to prefix with base URL
    const finalUrl = url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api','') || 'http://localhost:5000'}${url}`;
    setProofModalUrl(finalUrl);
  };

  const openPeriodDetail = async (periodId: number) => {
    setDetailPeriodId(periodId);
    try {
      const txs = await financeService.getAllTransactions({ period_id: periodId, limit: 200 });
      setDetailTransactions((txs || []).map((t) => ({ ...t, fine_amount: Number(t.fine_amount || 0) })));
    } catch (err) {
      console.error('Failed to load period transactions', err);
      setDetailTransactions([]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">History Transaksi Semua User</h1>
        <p className="text-gray-600 dark:text-gray-400">Lihat semua transaksi dari setiap user</p>
      </div>

      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'transactions'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Transaksi
          </button>
          <button
            onClick={() => setActiveTab('periods')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'periods'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Periode
          </button>
        </div>
      </div>

      {activeTab === 'transactions' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Semua Transaksi
              </h2>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  Export Excel
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Periode
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {transaction.user?.name || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {transaction.user?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {transaction.period?.name || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Due: {transaction.period?.due_date ? new Date(transaction.period.due_date).toLocaleDateString('id-ID') : 'N/A'}
                      </div>
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
                        {formatCurrency(transaction.period?.amount || 0)}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        {transaction.status === 'PENDING' && (
                          <>
                            <button 
                              onClick={() => handleVerifyTransaction(Number(transaction.id), 'COMPLETE')}
                              className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                            >
                              Verifikasi
                            </button>
                            <button 
                              onClick={() => handleVerifyTransaction(Number(transaction.id), 'REJECTED')}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Tolak
                            </button>
                          </>
                        )}
                        {transaction.proof && (
                          <button onClick={() => openProof(transaction.proof)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                            Lihat Bukti
                          </button>
                        )}
                      </div>
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
      )}

      {activeTab === 'periods' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Periode Kas
              </h2>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Buat Periode Baru
              </button>
            </div>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {periods.map((period) => (
                <div key={period.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {period.name || 'Unknown'}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      period.is_active 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {period.is_active ? 'Aktif' : 'Tutup'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Mulai:</span>
                      <span className="text-gray-900 dark:text-white">
                        {period.created_at ? new Date(period.created_at).toLocaleDateString('id-ID') : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Selesai:</span>
                      <span className="text-gray-900 dark:text-white">
                        {period.due_date ? new Date(period.due_date).toLocaleDateString('id-ID') : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Pemasukan:</span>
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        {formatCurrency((period as any).total_collected ?? 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Pengeluaran:</span>
                      <span className="text-red-600 dark:text-red-400 font-medium">
                        {formatCurrency(0)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Saldo:</span>
                      <span className={`font-bold ${
                        ((period as any).total_collected ?? 0) >= 0 
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {formatCurrency((period as any).total_collected ?? 0)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button onClick={() => openPeriodDetail(Number(period.id))} className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                      Detail
                    </button>
                    {period.is_active && (
                      <button className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700">
                        Tutup
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {periods.length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-500 dark:text-gray-400">
                  Belum ada periode kas
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Proof modal */}
      {proofModalUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setProofModalUrl(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end">
              <button onClick={() => setProofModalUrl(null)} className="text-gray-500">Tutup</button>
            </div>
            <div className="mt-2">
              <img src={proofModalUrl} alt="Bukti" className="max-h-[70vh] w-full object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* Period detail modal */}
      {detailPeriodId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => { setDetailPeriodId(null); setDetailTransactions([]); }}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Detail Periode</h3>
              <button onClick={() => { setDetailPeriodId(null); setDetailTransactions([]); }} className="text-gray-500">Tutup</button>
            </div>
            <div className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-2 text-left">User</th>
                      <th className="px-4 py-2 text-left">Jumlah</th>
                      <th className="px-4 py-2 text-left">Tanggal</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailTransactions.map((t) => (
                      <tr key={t.id} className="border-t">
                        <td className="px-4 py-3">{t.user?.name}</td>
                        <td className="px-4 py-3">{formatCurrency(t.period?.amount || 0)}</td>
                        <td className="px-4 py-3">{t.payment_date ? new Date(t.payment_date).toLocaleDateString('id-ID') : '-'}</td>
                        <td className="px-4 py-3">{t.status}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            {t.proof && <button onClick={() => openProof(t.proof)} className="text-blue-600">Lihat Bukti</button>}
                            {t.status === 'PENDING' && (
                              <>
                                <button onClick={() => handleVerifyTransaction(Number(t.id), 'COMPLETE')} className="text-green-600">Verifikasi</button>
                                <button onClick={() => handleVerifyTransaction(Number(t.id), 'REJECTED')} className="text-red-600">Tolak</button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {detailTransactions.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-gray-500">Belum ada transaksi untuk periode ini.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
