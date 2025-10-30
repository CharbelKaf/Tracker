/**
 * API Service - Backend integration
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export interface ApiError {
  error: string;
  message: string;
  details?: Array<{ field: string; message: string }>;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  accessToken: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  department?: string;
  status: string;
}

export interface Equipment {
  id: string;
  name: string;
  category: string;
  model?: string;
  serialNumber?: string;
  status: string;
  location?: string;
  notes?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  warrantyExpiry?: string;
}

export interface Assignment {
  id: string;
  equipmentId: string;
  userId: string;
  assignedDate: string;
  returnDate?: string;
  status: string;
  notes?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class ApiService {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on init
    this.token = localStorage.getItem('accessToken');
  }

  private getHeaders(includeAuth = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: 'Error',
        message: `HTTP ${response.status}: ${response.statusText}`,
      }));

      // Token expired - try to refresh
      if (response.status === 401 && this.token) {
        const refreshed = await this.refreshToken();
        if (!refreshed) {
          this.clearAuth();
          window.location.href = '/login';
        }
      }

      throw error;
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('accessToken', token);
  }

  clearAuth() {
    this.token = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  }

  // ===== Authentication =====

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(false),
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data = await this.handleResponse<LoginResponse>(response);
    this.setToken(data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  }

  async register(userData: {
    email: string;
    password: string;
    name: string;
    role?: string;
    department?: string;
  }): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(false),
      credentials: 'include',
      body: JSON.stringify(userData),
    });

    const data = await this.handleResponse<LoginResponse>(response);
    this.setToken(data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  }

  async refreshToken(): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await this.handleResponse<{ accessToken: string }>(response);
      this.setToken(data.accessToken);
      return true;
    } catch {
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: this.getHeaders(),
        credentials: 'include',
      });
    } finally {
      this.clearAuth();
    }
  }

  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<User>(response);
  }

  // ===== Equipment =====

  async getEquipment(params?: {
    page?: number;
    limit?: number;
    category?: string;
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Equipment>> {
    const query = new URLSearchParams(
      Object.entries(params || {})
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ).toString();

    const response = await fetch(`${API_URL}/equipment?${query}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<PaginatedResponse<Equipment>>(response);
  }

  async getEquipmentById(id: string): Promise<Equipment> {
    const response = await fetch(`${API_URL}/equipment/${id}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<Equipment>(response);
  }

  async createEquipment(data: Omit<Equipment, 'id'>): Promise<Equipment> {
    const response = await fetch(`${API_URL}/equipment`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse<Equipment>(response);
  }

  async updateEquipment(id: string, data: Partial<Equipment>): Promise<Equipment> {
    const response = await fetch(`${API_URL}/equipment/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse<Equipment>(response);
  }

  async deleteEquipment(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/equipment/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    return this.handleResponse<void>(response);
  }

  // ===== Users =====

  async getUsers(params?: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    department?: string;
    search?: string;
  }): Promise<PaginatedResponse<User>> {
    const query = new URLSearchParams(
      Object.entries(params || {})
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ).toString();

    const response = await fetch(`${API_URL}/users?${query}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<PaginatedResponse<User>>(response);
  }

  async getUserById(id: string): Promise<User> {
    const response = await fetch(`${API_URL}/users/${id}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<User>(response);
  }

  async createUser(data: {
    email: string;
    password: string;
    name: string;
    role?: string;
    department?: string;
  }): Promise<User> {
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse<User>(response);
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse<User>(response);
  }

  async deleteUser(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    return this.handleResponse<void>(response);
  }

  // ===== Assignments =====

  async getAssignments(params?: {
    page?: number;
    limit?: number;
    status?: string;
    userId?: string;
    equipmentId?: string;
  }): Promise<PaginatedResponse<Assignment>> {
    const query = new URLSearchParams(
      Object.entries(params || {})
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ).toString();

    const response = await fetch(`${API_URL}/assignments?${query}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<PaginatedResponse<Assignment>>(response);
  }

  async getAssignmentById(id: string): Promise<Assignment> {
    const response = await fetch(`${API_URL}/assignments/${id}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<Assignment>(response);
  }

  async createAssignment(data: {
    equipmentId: string;
    userId: string;
    assignedDate: string;
    notes?: string;
  }): Promise<Assignment> {
    const response = await fetch(`${API_URL}/assignments`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse<Assignment>(response);
  }

  async updateAssignment(id: string, data: Partial<Assignment>): Promise<Assignment> {
    const response = await fetch(`${API_URL}/assignments/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse<Assignment>(response);
  }

  async returnAssignment(id: string): Promise<Assignment> {
    const response = await fetch(`${API_URL}/assignments/${id}/return`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    return this.handleResponse<Assignment>(response);
  }

  async deleteAssignment(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/assignments/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    return this.handleResponse<void>(response);
  }
}

// Export singleton instance
export const api = new ApiService();
