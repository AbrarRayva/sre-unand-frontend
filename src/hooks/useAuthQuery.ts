import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authManager, LoginCredentials, RegisterData } from '@/lib/auth';

export const useAuth = () => {
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => authManager.login(credentials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error) => {
      console.error('Login failed:', error);
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterData) => authManager.register(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error) => {
      console.error('Registration failed:', error);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authManager.logout(),
    onSuccess: () => {
      queryClient.clear();
    },
    onError: (error) => {
      console.error('Logout failed:', error);
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: ({ oldPassword, newPassword }: { oldPassword: string; newPassword: string }) =>
      authManager.changePassword(oldPassword, newPassword),
    onSuccess: () => {
      console.log('Password changed successfully');
    },
    onError: (error) => {
      console.error('Password change failed:', error);
    },
  });

  return {
    loginMutation,
    registerMutation,
    logoutMutation,
    changePasswordMutation,
  };
};

export const useUser = () => {
  return useQuery({
    queryKey: ['user'],
    queryFn: () => authManager.fetchMe(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
};
