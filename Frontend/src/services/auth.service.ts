/**
 * Authentication Service
 * Maps to backend /api/v1/auth routes
 */

import apiClient from '@/lib/api';
import { ApiResponse, AuthResponse, User } from '@/types';

export const authService = {
  /**
   * Login
   * POST /api/v1/auth/login
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', {
      email,
      password,
    });
    
    // Backend returns: { success: true, data: { token, user } }
    if (response.success && response.data) {
      return response.data;
    }
    
    // Handle error response
    throw new Error(response.error?.message || 'Login failed');
  },

  /**
   * Get current user
   * GET /api/v1/auth/me
   */
  async getMe(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>('/auth/me');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error?.message || 'Failed to get user');
  },

  /**
   * Logout
   * POST /api/v1/auth/logout
   */
  async logout(): Promise<void> {
    const response = await apiClient.post<ApiResponse<void>>('/auth/logout');
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Logout failed');
    }
  },

  /**
   * Refresh token
   * POST /api/v1/auth/refresh
   */
  async refreshToken(): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/refresh');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error?.message || 'Token refresh failed');
  },

  /**
   * Request password reset OTP
   * POST /api/v1/auth/forgot-password
   * Body: { email: string }
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/forgot-password', {
      email: email.trim().toLowerCase(),
    });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Request failed');
  },

  /**
   * Resend password reset OTP
   * POST /api/v1/auth/resend-password-otp
   * Body: { email: string }
   */
  async resendPasswordOTP(email: string): Promise<{ message: string }> {
    const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/resend-password-otp', {
      email: email.trim().toLowerCase(),
    });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Resend failed');
  },

  /**
   * Reset password with OTP
   * POST /api/v1/auth/reset-password
   * Body: { email: string, otp: string, newPassword: string }
   */
  async resetPassword(email: string, otp: string, newPassword: string): Promise<{ message: string }> {
    const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/reset-password', {
      email: email.trim().toLowerCase(),
      otp: String(otp).replace(/\s/g, ''),
      newPassword,
    });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Reset failed');
  },

  /**
   * Update current user profile (name only)
   * PATCH /api/v1/auth/me
   * Body: { name: string }
   */
  async updateProfile(name: string): Promise<User> {
    const response = await apiClient.patch<ApiResponse<User>>('/auth/me', { name: name.trim() });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Profile update failed');
  },

  /**
   * Change password (authenticated user). Requires current password; new password is stored hashed on server.
   * POST /api/v1/auth/change-password
   * Body: { currentPassword: string, newPassword: string }
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Password change failed');
  },
};

