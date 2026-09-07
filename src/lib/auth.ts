import { api } from './api-client';
import type { User } from '@shared/types';
const TOKEN_KEY = 'heimdal_auth_token';
export const auth = {
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const response = await api<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (response.token) {
      localStorage.setItem(TOKEN_KEY, response.token);
    }
    return response;
  },
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = '/login';
  },
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  isAuthenticated(): boolean {
    return !!this.getToken();
  },
  getAuthHeader(): Record<string, string> {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
};