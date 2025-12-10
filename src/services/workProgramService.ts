import { apiClient } from '@/lib/apiClient';

export interface WorkProgram {
  id: number;
  name: string;
  division_id: number;
  targets: string[];
  status: 'PLANNED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  pic_ids: number[];
  division?: {
    id: number;
    name: string;
  };
  users?: {
    id: number;
    name: string;
    email: string;
  }[];
  created_at: string;
  updated_at: string;
}

export interface CreateWorkProgram {
  name: string;
  division_id: number;
  targets: string[];
  status: 'PLANNED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  pic_ids: number[];
}

export interface UpdateWorkProgram {
  name?: string;
  targets?: string[];
  status?: 'PLANNED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  pic_ids?: number[];
}

export interface WorkProgramFilters {
  page?: number;
  limit?: number;
  division_id?: number;
  status?: 'PLANNED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  search?: string;
}

class WorkProgramService {
  // Get Work Programs
  async getWorkPrograms(filters?: WorkProgramFilters) {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.division_id) params.append('division_id', filters.division_id.toString());
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);

    const response = await apiClient.get<WorkProgram[]>(`/work-programs?${params}`);
    return response.data;
  }

  async getWorkProgram(id: number) {
    const response = await apiClient.get<WorkProgram>(`/work-programs/${id}`);
    return response.data;
  }

  async getDivisionWorkPrograms(divisionId: number) {
    const response = await apiClient.get<WorkProgram[]>(`/work-programs/division/${divisionId}`);
    return response.data;
  }

  // Create/Update/Delete Work Programs (Director/Admin Role)
  async createWorkProgram(data: CreateWorkProgram) {
    const response = await apiClient.post<WorkProgram>('/work-programs', data);
    return response.data;
  }

  async updateWorkProgram(id: number, data: UpdateWorkProgram) {
    const response = await apiClient.put<WorkProgram>(`/work-programs/${id}`, data);
    return response.data;
  }

  async deleteWorkProgram(id: number) {
    await apiClient.delete(`/work-programs/${id}`);
  }

  // Work Program Statistics
  async getWorkProgramStats() {
    const response = await apiClient.get('/work-programs/stats');
    return response.data;
  }

  async getDivisionWorkProgramStats(divisionId: number) {
    const response = await apiClient.get(`/work-programs/stats/division/${divisionId}`);
    return response.data;
  }

  // Work Program Milestones (if available)
  async getWorkProgramMilestones(workProgramId: number) {
    const response = await apiClient.get(`/work-programs/${workProgramId}/milestones`);
    return response.data;
  }

  async createMilestone(workProgramId: number, data: {title: string; description?: string; due_date: string}) {
    const response = await apiClient.post(`/work-programs/${workProgramId}/milestones`, data);
    return response.data;
  }

  async updateMilestone(milestoneId: number, data: {title?: string; description?: string; due_date?: string; completed?: boolean}) {
    const response = await apiClient.put(`/work-programs/milestones/${milestoneId}`, data);
    return response.data;
  }

  async deleteMilestone(milestoneId: number) {
    await apiClient.delete(`/work-programs/milestones/${milestoneId}`);
  }
}

export const workProgramService = new WorkProgramService();
