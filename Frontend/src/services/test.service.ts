/**
 * Test Service
 * Maps to backend /api/v1/test routes
 * These are public routes for testing purposes
 */

import apiClient from "@/lib/api";
import { ApiResponse } from "@/types";
import { Complaint } from "@/types";

export const testService = {
  /**
   * Get all complaints (public endpoint, no auth required)
   * GET /api/v1/test/complaints
   */
  async getAllComplaints(): Promise<Complaint[]> {
    const response = await apiClient.get<ApiResponse<{ complaints: Complaint[] }>>(
      "/test/complaints"
    );

    if (response.success && response.data) {
      return response.data.complaints || [];
    }

    return [];
  },
};

