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
  roles?: any[];
  role?: string;
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
  async login(credentials: LoginCredentials): Promise<void> {
    try {
      console.log('Making login request to:', '/auth/login', credentials);
      
      // Try with fetch first for debugging
      const fetchResponse = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      });
      
      console.log('Fetch response status:', fetchResponse.status);
      const responseData = await fetchResponse.json();
      console.log('Fetch response data:', responseData);
      
      if (responseData.success && responseData.data) {
        this.setToken(responseData.data.token);
        this.setUser(responseData.data.user);
        console.log('Login successful');
      } else {
        const errorMsg = responseData.message || 'Login failed';
        console.log('Login failed:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Login error in authManager:', error);
      throw error;
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', data);
      
      // Store token and user data
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
      // Continue with logout even if API call fails
      console.error('Logout API call failed:', error);
    } finally {
      this.clearToken();
      this.clearUser();
      
      // Redirect to login
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
      const response = await apiClient.get<User>('/auth/me');
      this.setUser(response.data);
      return response.data;
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

  // Check if user has specific permission
  hasPermission(permission: string): boolean {
    const user = this.getUser();
    if (!user) return false;
    
    // Admin role has all permissions
    if (user.role === 'ADMIN') return true;
    
    // Check specific permission
    return user.permissions?.includes(permission) || false;
  }

  // Check if user has any of the specified permissions
  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  // Check if user has all specified permissions
  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  // Check if user has specific role
  hasRole(role: string): boolean {
    const user = this.getUser();
    return user?.role === role;
  }

  // Check if user has any of the specified roles
  hasAnyRole(roles: string[]): boolean {
    const user = this.getUser();
    return user ? roles.includes(user.role || '') : false;
  }
}

export const authManager = new AuthManager();
export default authManager;
