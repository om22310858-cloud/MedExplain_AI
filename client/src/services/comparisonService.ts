import { apiClient } from './api.js';
import { ReportComparison, ApiResponse } from '../types/index.js';

export const comparisonService = {
  async createComparison(
    olderReportId: string,
    newerReportId: string
  ): Promise<ReportComparison> {
    const res = await apiClient.post<ApiResponse<{ comparison: ReportComparison }>>(
      '/comparisons',
      {
        olderReportId,
        newerReportId,
      }
    );
    return res.data.data!.comparison;
  },

  async getComparisons(): Promise<ReportComparison[]> {
    const res = await apiClient.get<ApiResponse<{ comparisons: ReportComparison[] }>>(
      '/comparisons'
    );
    return res.data.data!.comparisons;
  },

  async getComparisonById(id: string): Promise<ReportComparison> {
    const res = await apiClient.get<ApiResponse<{ comparison: ReportComparison }>>(
      `/comparisons/${id}`
    );
    return res.data.data!.comparison;
  },

  async deleteComparison(id: string): Promise<void> {
    await apiClient.delete(`/comparisons/${id}`);
  },
};
