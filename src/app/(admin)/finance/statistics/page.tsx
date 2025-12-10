"use client";

import React, { useState, useEffect } from 'react';
import { useFinancePeriods, useFinanceStatistics } from '@/hooks/useFinanceQuery';
import { authManager } from '@/lib/auth';

interface PaymentStatistics {
  total_members: number;
  paid_count: number;
  pending_count: number;
  unpaid_count: number;
  total_collected: number;
  total_fines: number;
  payment_rate: string;
}

interface CashPeriod {
  id: string;
  name: string;
  amount: number;
  late_fee_per_day?: number;
  late_fee?: number; // Alternative field name
  due_date: string;
  is_active: boolean;
}

interface StatisticsData {
  period: CashPeriod;
  statistics: PaymentStatistics;
}

export default function FinanceStatisticsPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);

  // Use query hooks
  const { data: periodsData, isLoading: periodsLoading } = useFinancePeriods();
  const periods = periodsData || [];

  const { data: statisticsData, isLoading: statisticsLoading } = useFinanceStatistics(selectedPeriod || 0);
  const statistics = statisticsData;

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

  // Set default period when periods are loaded
  useEffect(() => {
    if (periods.length > 0 && !selectedPeriod) {
      setSelectedPeriod(periods[0].id);
    }
  }, [periods, selectedPeriod]);

  const formatCurrency = (amount?: number | null) => {
    const value = Number(amount ?? 0);
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(isNaN(value) ? 0 : value);
  };

  if (loading || periodsLoading || statisticsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Statistik Kas Per Periode</h1>
        <p className="text-gray-600 dark:text-gray-400">Lihat statistik pembayaran untuk setiap periode kas</p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Pilih Periode
        </label>
        <select
          value={selectedPeriod || ''}
          onChange={(e) => setSelectedPeriod(parseInt(e.target.value) || null)}
          className="w-full md:w-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        >
          {periods.map((period) => (
            <option key={period.id} value={period.id}>
              {period.name}
            </option>
          ))}
        </select>
      </div>

      {statistics && (
        <>
          {/* Period Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Informasi Periode
              </h2>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Nama Periode</div>
                  <div className="text-lg font-medium text-gray-900 dark:text-white">
                    {statistics.period.name}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Jumlah Kas</div>
                  <div className="text-lg font-medium text-gray-900 dark:text-white">
                    {formatCurrency(statistics.period.amount)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Denda/Hari</div>
                  <div className="text-lg font-medium text-gray-900 dark:text-white">
                    {formatCurrency((statistics.period as any)?.late_fee_per_day || (statistics.period as any)?.late_fee || 0)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Status</div>
                  <div className="text-lg font-medium">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      statistics.period.is_active 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {statistics.period.is_active ? 'Aktif' : 'Tutup'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                  </div>
                </div>
                <div className="ml-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Total Anggota</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {statistics.statistics.total_members}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 bg-green-600 dark:bg-green-400 rounded-full"></div>
                  </div>
                </div>
                <div className="ml-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Sudah Bayar</div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {statistics.statistics.paid_count}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 bg-yellow-600 dark:bg-yellow-400 rounded-full"></div>
                  </div>
                </div>
                <div className="ml-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Menunggu</div>
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {statistics.statistics.pending_count}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 bg-red-600 dark:bg-red-400 rounded-full"></div>
                  </div>
                </div>
                <div className="ml-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Belum Bayar</div>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {statistics.statistics.unpaid_count}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total Terkumpul</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(statistics.statistics.total_collected)}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total Denda</div>
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(statistics.statistics.total_fines)}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Tingkat Pembayaran</div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {statistics.statistics.payment_rate}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Progress Pembayaran
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <span>Sudah Bayar</span>
                  <span>{statistics.statistics.paid_count}/{statistics.statistics.total_members}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${(statistics.statistics.paid_count / statistics.statistics.total_members) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <span>Menunggu Verifikasi</span>
                  <span>{statistics.statistics.pending_count}/{statistics.statistics.total_members}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-yellow-600 h-2 rounded-full" 
                    style={{ width: `${(statistics.statistics.pending_count / statistics.statistics.total_members) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <span>Belum Bayar</span>
                  <span>{statistics.statistics.unpaid_count}/{statistics.statistics.total_members}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-red-600 h-2 rounded-full" 
                    style={{ width: `${(statistics.statistics.unpaid_count / statistics.statistics.total_members) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
