import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  financeService, 
  CreatePeriodData, 
  CreateTransactionData, 
  UpdatePeriodData, 
  VerifyTransactionData,
  TransactionFilters,
  PeriodFilters 
} from '@/services';

export const useFinancePeriods = (filters?: PeriodFilters) => {
  return useQuery({
    queryKey: ['finance', 'periods', filters],
    queryFn: () => financeService.getPeriods(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useFinancePeriod = (id: number) => {
  return useQuery({
    queryKey: ['finance', 'period', id],
    queryFn: () => financeService.getPeriod(id),
    enabled: !!id,
  });
};

export const useCreatePeriod = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreatePeriodData) => financeService.createPeriod(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'periods'] });
    },
  });
};

export const useUpdatePeriod = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePeriodData }) => 
      financeService.updatePeriod(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'periods'] });
      queryClient.invalidateQueries({ queryKey: ['finance', 'period', variables.id] });
    },
  });
};

export const useDeletePeriod = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => financeService.deletePeriod(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'periods'] });
    },
  });
};

export const useMyTransactions = (filters?: TransactionFilters) => {
  return useQuery({
    queryKey: ['finance', 'my-transactions', filters],
    queryFn: () => financeService.getMyTransactions(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useAllTransactions = (filters?: TransactionFilters) => {
  return useQuery({
    queryKey: ['finance', 'transactions', filters],
    queryFn: () => financeService.getAllTransactions(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateTransactionData) => financeService.createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'my-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['finance', 'transactions'] });
    },
  });
};

export const useVerifyTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: VerifyTransactionData }) => 
      financeService.verifyTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'transactions'] });
    },
  });
};

export const useFinanceStatistics = (periodId: number) => {
  return useQuery({
    queryKey: ['finance', 'statistics', periodId],
    queryFn: () => financeService.getStatistics(periodId),
    enabled: !!periodId,
  });
};
