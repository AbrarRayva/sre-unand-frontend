import { apiClient } from './apiClient';

export interface User {
  id: string;
  name: string;
  email: string;
  position?: 'P' | 'VP' | 'SEC' | 'DIRECTOR' | 'MANAGER' | 'STAFF';
  division?: {
    id: string;
    name: string;
  };
  subDivision?: {
    id: string;
    name: string;
  };
  sub_division?: {  // Backend compatibility (snake_case)
    id: string;
    name: string;
  };
  roles?: string[]; // PERBAIKAN: Pastikan ini array string untuk menampung ["ADMIN"]
  role?: string;    // Tetap dipertahankan untuk kompatibilitas legacy
  permissions?: string[];
  division_id?: string;
  sub_division_id?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  position?: 'P' | 'VP' | 'SEC' | 'DIRECTOR' | 'MANAGER' | 'STAFF';
  division_id?: number;
  sub_division_id?: number;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

class AuthManager {
  private tokenKey = 'sisore_token';
  private userKey = 'sisore_user';

  // Token management
  setToken(token: string, storage: 'localStorage' | 'sessionStorage' = 'localStorage'): void {
    if (typeof window !== 'undefined') {
      if (storage === 'localStorage') {
        localStorage.setItem(this.tokenKey, token);
      } else {
        sessionStorage.setItem(this.tokenKey, token);
      }
    }
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.tokenKey) || sessionStorage.getItem(this.tokenKey);
    }
    return null;
  }

  clearToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.tokenKey);
      sessionStorage.removeItem(this.tokenKey);
    }
  }

  // User data management
  setUser(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.userKey, JSON.stringify(user));
    }
  }

  getUser(): User | null {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem(this.userKey);
      return userData ? JSON.parse(userData) : null;
    }
    return null;
  }

  clearUser(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.userKey);
    }
  }

  // Authentication methods
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const fetchResponse = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!fetchResponse.ok) {
        throw new Error('Login failed');
      }

      const apiResponse = await fetchResponse.json();
      
      if (apiResponse.success) {
        const authData = apiResponse.data;
        this.setToken(authData.token);
        this.setUser(authData.user);
        return apiResponse;
      } else {
        throw new Error(apiResponse.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', data);
      
      this.setToken(response.data.data.token);
      this.setUser(response.data.data.user);
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      this.clearToken();
      this.clearUser();
      
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    try {
      await apiClient.put('/auth/change-password', {
        oldPassword,
        newPassword,
      });
    } catch (error) {
      throw error;
    }
  }

  async fetchMe(): Promise<User> {
    try {
      const fetchResponse = await fetch('http://localhost:5000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${this.getToken()}`
        }
      });
      
      if (!fetchResponse.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const responseData = await fetchResponse.json();
      const userData = responseData.data || responseData;
      
      this.setUser(userData);
      return userData;
    } catch (error) {
      this.clearToken();
      this.clearUser();
      throw error;
    }
  }

  async forgotPassword(email: string): Promise<void> {
    await apiClient.post('/auth/forgot-password', { email });
  }

  async resetPassword(token: string, password: string): Promise<void> {
    await apiClient.post('/auth/reset-password', { token, password });
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * PERBAIKAN LOGIKA ROLE (ARRAY)
   * Mendukung pengecekan pada properti "roles" (array) dan "role" (string)
   */

  // Check if user has specific permission
  hasPermission(permission: string): boolean {
    const user = this.getUser();
    if (!user) return false;
    
    // Admin memiliki semua izin
    const isAdmin = (user.roles && Array.isArray(user.roles) && user.roles.includes('ADMIN')) || 
                    (user.role === 'ADMIN');

    if (isAdmin) return true;
    
    return user.permissions?.includes(permission) || false;
  }

  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  // Check if user has specific role
  hasRole(role: string): boolean {
    const user = this.getUser();
    if (!user) return false;

    // Cek di array roles (utama) atau string role (legacy)
    const hasInArray = Array.isArray(user.roles) && user.roles.includes(role);
    const hasInString = user.role === role;

    return hasInArray || hasInString;
  }

  // Check if user has any of the specified roles
  hasAnyRole(roles: string[]): boolean {
    const user = this.getUser();
    if (!user) return false;

    // Cek apakah ada role user yang cocok dengan daftar roles yang diminta
    const hasInArray = Array.isArray(user.roles) && user.roles.some(r => roles.includes(r));
    const hasInString = roles.includes(user.role || '');

    return hasInArray || hasInString;
  }
}

export const authManager = new AuthManager();
export default authManager;