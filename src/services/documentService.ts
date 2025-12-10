import { apiClient } from '@/lib/apiClient';

export interface Document {
  id: number;
  title: string;
  description?: string;
  file_name: string;
  file_path: string;
  file_size: number;
  access_level: 'PUBLIC' | 'BOARD' | 'EXECUTIVE';
  version: number;
  uploaded_by: number;
  created_at: string;
  updated_at: string;
  uploader?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface CreateDocument {
  document: File;
  title: string;
  description?: string;
  access_level: 'PUBLIC' | 'BOARD' | 'EXECUTIVE';
}

export interface UpdateDocument {
  title?: string;
  description?: string;
  access_level?: 'PUBLIC' | 'BOARD' | 'EXECUTIVE';
}

export interface DocumentFilters {
  page?: number;
  limit?: number;
  search?: string;
  access_level?: 'PUBLIC' | 'BOARD' | 'EXECUTIVE';
  uploader_id?: number;
}

class DocumentService {
  // Get Documents
  async getDocuments(filters?: DocumentFilters) {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.access_level) params.append('access_level', filters.access_level);
    if (filters?.uploader_id) params.append('uploader_id', filters.uploader_id.toString());

    const response = await apiClient.get<Document[]>(`/documents?${params}`);
    return response.data;
  }

  async getDocument(id: number) {
    const response = await apiClient.get<Document>(`/documents/${id}`);
    return response.data;
  }

  // Upload/Update/Delete Documents (Secretary Role Required)
  async uploadDocument(data: CreateDocument) {
    const formData = new FormData();
    formData.append('document', data.document);
    formData.append('title', data.title);
    
    if (data.description) formData.append('description', data.description);
    formData.append('access_level', data.access_level);

    const response = await apiClient.post<Document>('/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async updateDocument(id: number, data: UpdateDocument) {
    const response = await apiClient.put<Document>(`/documents/${id}`, data);
    return response.data;
  }

  async deleteDocument(id: number) {
    await apiClient.delete(`/documents/${id}`);
  }

  // Download Document
  async downloadDocument(id: number): Promise<Blob> {
    const response = await apiClient.get<Blob>(`/documents/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // Document Preview (if available)
  async getDocumentPreview(id: number) {
    const response = await apiClient.get(`/documents/${id}/preview`);
    return response.data;
  }

  // Document Versions (if available)
  async getDocumentVersions(id: number) {
    const response = await apiClient.get(`/documents/${id}/versions`);
    return response.data;
  }

  async createNewVersion(id: number, file: File) {
    const formData = new FormData();
    formData.append('document', file);

    const response = await apiClient.post(`/documents/${id}/versions`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Document Categories (if available)
  async getDocumentCategories() {
    const response = await apiClient.get('/documents/categories');
    return response.data;
  }

  async createDocumentCategory(data: {name: string; description?: string}) {
    const response = await apiClient.post('/documents/categories', data);
    return response.data;
  }

  // Document Statistics
  async getDocumentStats() {
    const response = await apiClient.get('/documents/stats');
    return response.data;
  }

  // File validation
  validateFile(file: File): {valid: boolean; error?: string} {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
    ];

    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'File type not allowed. Only PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, and TXT files are accepted.',
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File size too large. Maximum size is 5MB.',
      };
    }

    return { valid: true };
  }

  // Format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Get file extension
  getFileExtension(fileName: string): string {
    return fileName.split('.').pop()?.toLowerCase() || '';
  }

  // Check if user can access document based on access level
  canAccessDocument(userPosition: string, documentAccessLevel: string): boolean {
    switch (documentAccessLevel) {
      case 'PUBLIC':
        return true;
      case 'BOARD':
        return ['P', 'VP', 'SEC', 'DIRECTOR'].includes(userPosition);
      case 'EXECUTIVE':
        return ['P', 'VP', 'SEC'].includes(userPosition);
      default:
        return false;
    }
  }
}

export const documentService = new DocumentService();
