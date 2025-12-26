/**
 * Demographics Service
 * Maps to backend /api/v1/demographics routes
 */

import apiClient from "@/lib/api";
import { ApiResponse } from "@/types";

export interface Town {
  areaName: string;
  totalPopulation: number;
  totalHouseholds: number;
  subdistrict: string;
  latitude?: number;
  longitude?: number;
  townCode?: string;
}

export interface Ward {
  areaName: string;
  totalPopulation: number;
  subdistrict: string;
  latitude?: number;
  longitude?: number;
  wardCode?: string;
}

export interface GeocodingResult {
  success: number;
  failed: number;
  total: number;
}

export const demographicsService = {
  /**
   * Get all towns
   * GET /api/v1/demographics/towns
   */
  async getTowns(): Promise<Town[]> {
    const response = await apiClient.get<ApiResponse<{ count: number; towns: Town[] }>>(
      "/demographics/towns"
    );

    if (response.success && response.data) {
      return response.data.towns || [];
    }

    return [];
  },

  /**
   * Get all wards
   * GET /api/v1/demographics/wards
   */
  async getWards(): Promise<Ward[]> {
    const response = await apiClient.get<ApiResponse<{ count: number; wards: Ward[] }>>(
      "/demographics/wards"
    );

    if (response.success && response.data) {
      return response.data.wards || [];
    }

    return [];
  },

  /**
   * Geocode towns
   * POST /api/v1/demographics/geocode-towns
   */
  async geocodeTowns(batchSize: number = 10): Promise<GeocodingResult> {
    const response = await apiClient.post<ApiResponse<GeocodingResult>>(
      "/demographics/geocode-towns",
      { batchSize }
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error?.message || "Failed to geocode towns");
  },

  /**
   * Geocode wards
   * POST /api/v1/demographics/geocode-wards
   */
  async geocodeWards(batchSize: number = 10): Promise<GeocodingResult> {
    const response = await apiClient.post<ApiResponse<GeocodingResult>>(
      "/demographics/geocode-wards",
      { batchSize }
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error?.message || "Failed to geocode wards");
  },

  /**
   * Get geocoding status
   * GET /api/v1/demographics/geocoding-status
   */
  async getGeocodingStatus(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>(
      "/demographics/geocoding-status"
    );

    if (response.success && response.data) {
      return response.data;
    }

    return null;
  },
};

