import { apiClient } from '@/lib/apiClient';

export interface CashPeriod {
  id: number;
  name: string;
  amount: number;
  late_fee_per_day: number;
  due_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
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
  period?: CashPeriod;
  created_at: string;
  updated_at: string;
}

export interface PaymentStatistics {
  period: CashPeriod;
  statistics: {
    total_members: number;
    paid_count: number;
    pending_count: number;
    unpaid_count: number;
    total_collected: number;
    total_fines: number;
    payment_rate: string;
  };
}

export interface CreatePeriodData {
  name: string;
  amount: number;
  late_fee_per_day: number;
  due_date: string;
  is_active: boolean;
}

export interface CreateTransactionData {
  period_id: number;
  payment_method: 'CASH' | 'TRANSFER';
  payment_date: string;
  proof?: File;
}

export interface UpdatePeriodData {
  name?: string;
  amount?: number;
  late_fee_per_day?: number;
  due_date?: string;
  is_active?: boolean;
}

export interface VerifyTransactionData {
  status: 'COMPLETE' | 'REJECTED';
}

export interface TransactionFilters {
  page?: number;
  limit?: number;
  status?: 'COMPLETE' | 'PENDING' | 'REJECTED';
  period_id?: number;
  user_id?: number;
}

export interface PeriodFilters {
  page?: number;
  limit?: number;
  is_active?: boolean;
}

class FinanceService {
  // Period Management (Finance Role)
  async getPeriods(filters?: PeriodFilters) {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString());

    const response = await apiClient.get<CashPeriod[]>(`/cash/periods?${params}`);
    return response.data;
  }

  async getPeriod(id: number) {
    const response = await apiClient.get<CashPeriod>(`/cash/periods/${id}`);
    return response.data;
  }

  async createPeriod(data: CreatePeriodData) {
    const response = await apiClient.post<CashPeriod>('/cash/admin/periods', data);
    return response.data;
  }

  async updatePeriod(id: number, data: UpdatePeriodData) {
    const response = await apiClient.put<CashPeriod>(`/cash/admin/periods/${id}`, data);
    return response.data;
  }

  async deletePeriod(id: number) {
    await apiClient.delete(`/cash/admin/periods/${id}`);
  }

  // Transaction Management
  async getMyTransactions(filters?: TransactionFilters) {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.status) params.append('status', filters.status);
    if (filters?.period_id) params.append('period_id', filters.period_id.toString());

    const response = await apiClient.get<Transaction[]>(`/cash/my-transactions?${params}`);
    return response.data;
  }

  async getAllTransactions(filters?: TransactionFilters) {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.status) params.append('status', filters.status);
    if (filters?.period_id) params.append('period_id', filters.period_id.toString());
    if (filters?.user_id) params.append('user_id', filters.user_id.toString());

    const response = await apiClient.get<Transaction[]>(`/cash/admin/transactions?${params}`);
    return response.data;
  }

  async createTransaction(data: CreateTransactionData) {
    const formData = new FormData();
    formData.append('period_id', data.period_id.toString());
    formData.append('payment_method', data.payment_method);
    formData.append('payment_date', data.payment_date);
    
    if (data.proof) {
      formData.append('proof', data.proof);
    }

    // Use upload method to properly handle multipart/form-data
    const response = await apiClient.upload<Transaction>('/cash/transactions', formData);
    return response.data;
  }

  async verifyTransaction(id: number, data: VerifyTransactionData) {
    const response = await apiClient.put<Transaction>(`/cash/admin/transactions/${id}/verify`, data);
    return response.data;
  }

  async getStatistics(periodId: number) {
    const response = await apiClient.get<PaymentStatistics>(`/cash/admin/statistics?period_id=${periodId}`);
    // Ensure period has valid late_fee_per_day (fallback to 0 if missing)
    const data = response.data;
    if (data.period && (data.period.late_fee_per_day === undefined || data.period.late_fee_per_day === null)) {
      data.period.late_fee_per_day = 0;
    }
    return data;
  }

  // File upload helper
  async uploadProof(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    // Use apiClient.upload to let axios set the proper multipart boundary
    const response = await apiClient.upload<{url: string}>('/upload', formData);
    // apiClient.upload returns the response body directly. Backend may return { url } or { data: { url } }
    // Be defensive when extracting the URL
    const body: any = response as any;
    return (body.url ?? body.data?.url) as string;
  }
}

export const financeService = new FinanceService();
