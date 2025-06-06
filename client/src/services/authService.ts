import { apiService } from './api';
import { ApiResponse, User } from '../types';

export const authService = {
  // Login with Firebase token
  login: async (idToken: string): Promise<ApiResponse<{ user: User }>> => {
    return apiService.post('/api/auth/login', { idToken });
  },

  // Logout
  logout: async (): Promise<ApiResponse> => {
    return apiService.post('/api/auth/logout');
  },

  // Get current user profile
  getProfile: async (): Promise<ApiResponse<{ user: User }>> => {
    return apiService.get('/api/auth/profile');
  },

  // Update user profile
  updateProfile: async (data: Partial<User>): Promise<ApiResponse<{ user: User }>> => {
    return apiService.put('/api/auth/profile', data);
  },

  // Register push notification token
  registerPushToken: async (token: string, platform: string): Promise<ApiResponse> => {
    return apiService.post('/api/auth/register-token', { token, platform });
  },

  // Refresh token
  refreshToken: async (): Promise<ApiResponse<{ user: User }>> => {
    return apiService.post('/api/auth/refresh');
  }
};
