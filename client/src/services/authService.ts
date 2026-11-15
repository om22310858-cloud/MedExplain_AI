import { apiClient } from './api.js';
import { User, ApiResponse } from '../types/index.js';

export interface AuthResponseData {
  user: User;
  token: string;
}

export const authService = {
  async register(data: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    acceptTerms: boolean;
  }): Promise<AuthResponseData> {
    const res = await apiClient.post<ApiResponse<AuthResponseData>>('/auth/register', data);
    if (res.data.data?.token) {
      localStorage.setItem('medexplain_token', res.data.data.token);
    }
    return res.data.data!;
  },

  async login(data: { email: string; password: string }): Promise<AuthResponseData> {
    const res = await apiClient.post<ApiResponse<AuthResponseData>>('/auth/login', data);
    if (res.data.data?.token) {
      localStorage.setItem('medexplain_token', res.data.data.token);
    }
    return res.data.data!;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      localStorage.removeItem('medexplain_token');
    }
  },

  async getMe(): Promise<User> {
    const res = await apiClient.get<ApiResponse<{ user: User }>>('/auth/me');
    return res.data.data!.user;
  },

  async forgotPassword(email: string): Promise<string> {
    const res = await apiClient.post<ApiResponse<{ devResetToken?: string }>>('/auth/forgot-password', {
      email,
    });
    return res.data.data?.devResetToken || '';
  },

  async resetPassword(data: {
    token: string;
    password: string;
    confirmPassword: string;
  }): Promise<void> {
    await apiClient.post('/auth/reset-password', data);
  },

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }): Promise<void> {
    await apiClient.patch('/auth/change-password', data);
  },

  async updateProfile(data: {
    name?: string;
    themePreference?: 'light' | 'dark' | 'system';
    profile?: {
      age?: number | null;
      gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
      bloodGroup?: string | null;
      phone?: string | null;
    };
  }): Promise<User> {
    const res = await apiClient.patch<ApiResponse<{ user: User }>>('/users/me', data);
    return res.data.data!.user;
  },

  async deleteAccount(): Promise<void> {
    await apiClient.delete('/users/me');
    localStorage.removeItem('medexplain_token');
  },
};
