import { apiClient } from './api.js';
import { DashboardStats, ApiResponse } from '../types/index.js';

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const res = await apiClient.get<ApiResponse<DashboardStats>>('/dashboard/stats');
    return res.data.data!;
  },
};
