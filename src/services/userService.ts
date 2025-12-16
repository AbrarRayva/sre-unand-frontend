import { apiClient } from '@/lib/apiClient';
import { User } from '@/lib/auth';

export interface CreateUser {
  name: string;
  email: string;
  password: string;
  position: 'P' | 'VP' | 'SEC' | 'DIRECTOR' | 'MANAGER' | 'STAFF';
  division_id: number;
  sub_division_id: number;
  roles: number[];
}

export interface UpdateUser {
  name?: string;
  position?: 'P' | 'VP' | 'SEC' | 'DIRECTOR' | 'MANAGER' | 'STAFF';
  division_id?: number;
  sub_division_id?: number;
  roles?: number[];
}

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  division_id?: number;
  position?: 'P' | 'VP' | 'SEC' | 'DIRECTOR' | 'MANAGER' | 'STAFF';
}

export interface Division {
  id: number;
  name: string;
  description?: string;
  subDivisions: SubDivision[];
  users?: User[];
}

export interface SubDivision {
  id: number;
  name: string;
  division_id: number;
}

export interface Role {
  id: number;
  name: string;
  permissions: Permission[];
}

export interface Permission {
  id: number;
  name: string;
  module: string;
}

class UserService {
  // User Management (HR Role)
  async getUsers(filters?: UserFilters) {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.division_id) params.append('division_id', filters.division_id.toString());
    if (filters?.position) params.append('position', filters.position);

    const response = await apiClient.get<User[]>(`/admin/users?${params}`);
    return response.data;
  }

  async getUser(id: number) {
    const response = await apiClient.get<User>(`/admin/users/${id}`);
    return response.data;
  }

  async createUser(data: CreateUser) {
    const response = await apiClient.post<User>('/admin/users', data);
    return response.data;
  }

  async updateUser(id: number, data: UpdateUser) {
    const response = await apiClient.put<User>(`/admin/users/${id}`, data);
    return response.data;
  }

  async deleteUser(id: number) {
    await apiClient.delete(`/admin/users/${id}`);
  }

  async bulkUploadUsers(csvFile: File) {
    const formData = new FormData();
    formData.append('csv', csvFile);

    const response = await apiClient.post<{success: number; failed: number; errors: string[]}>(
      '/admin/users/bulk-upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  async downloadCsvTemplate() {
    const response = await apiClient.get('/admin/users/csv-template', {
      responseType: 'blob',
    });
    return response.data;
  }

  async resetUserPassword(id: number, newPassword: string) {
    await apiClient.put(`/admin/users/${id}/reset-password`, {
      password: newPassword,
    });
  }

  // Division Management
  async getDivisions() {
    const response = await apiClient.get<Division[]>('/divisions');
    return response.data;
  }

  async getDivision(id: number) {
    const response = await apiClient.get<Division>(`/divisions/${id}`);
    return response.data;
  }

  async getDivisionMembers(divisionId: number) {
    const response = await apiClient.get<User[]>(`/divisions/${divisionId}/members`);
    return response.data;
  }

  // Role Management
  // PERBAIKAN: Path disesuaikan dengan pendaftaran di userRoutes.js (Backend)
  async getRoles() {
    const response = await apiClient.get<Role[]>('/admin/users/roles');
    return response.data;
  }

  // Jika Anda juga membutuhkan permissions, pastikan rutenya ada di backend
  async getPermissions() {
    const response = await apiClient.get<Permission[]>('/admin/users/permissions');
    return response.data;
  }

  async assignRoles(userId: number, roleIds: number[]) {
    await apiClient.put(`/admin/users/${userId}/roles`, {
      roles: roleIds,
    });
  }

  // User Activity
  async getUserActivity(userId: number) {
    const response = await apiClient.get(`/admin/users/${userId}/activity`);
    return response.data;
  }
}

export const userService = new UserService();