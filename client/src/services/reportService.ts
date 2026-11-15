import { apiClient, API_BASE_URL } from './api.js';
import {
  MedicalReport,
  ExtractedMeasurement,
  ReportAnalysis,
  RiskAssessment,
  AssessmentType,
  ApiResponse,
} from '../types/index.js';

export interface GetReportsParams {
  category?: string;
  documentType?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ReportsListResponse {
  reports: MedicalReport[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ReportDetailResponse {
  report: MedicalReport;
  measurements: ExtractedMeasurement[];
  analysis?: ReportAnalysis;
  riskAssessments: RiskAssessment[];
  supportedAssessments?: AssessmentType[];
}

export const reportService = {
  async uploadReport(formData: FormData): Promise<MedicalReport> {
    const res = await apiClient.post<ApiResponse<{ report: MedicalReport }>>(
      '/reports',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return res.data.data!.report;
  },

  async getReports(params?: GetReportsParams): Promise<ReportsListResponse> {
    const res = await apiClient.get<ApiResponse<ReportsListResponse>>('/reports', {
      params,
    });
    return res.data.data!;
  },

  async getReportById(id: string): Promise<ReportDetailResponse> {
    const res = await apiClient.get<ApiResponse<ReportDetailResponse>>(`/reports/${id}`);
    return res.data.data!;
  },

  async updateReport(
    id: string,
    data: Partial<MedicalReport>
  ): Promise<MedicalReport> {
    const res = await apiClient.patch<ApiResponse<{ report: MedicalReport }>>(
      `/reports/${id}`,
      data
    );
    return res.data.data!.report;
  },

  async deleteReport(id: string): Promise<void> {
    await apiClient.delete(`/reports/${id}`);
  },

  getDownloadUrl(id: string): string {
    return `${API_BASE_URL}/reports/${id}/download`;
  },

  async downloadReport(id: string, filename: string): Promise<void> {
    const res = await apiClient.get(`/reports/${id}/download`, {
      responseType: 'blob',
    });
    const contentType = typeof res.headers['content-type'] === 'string' ? res.headers['content-type'] : 'application/octet-stream';
    const blob = new Blob([res.data], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  async addMeasurement(
    reportId: string,
    data: Partial<ExtractedMeasurement>
  ): Promise<ExtractedMeasurement> {
    const res = await apiClient.post<ApiResponse<{ measurement: ExtractedMeasurement }>>(
      `/reports/${reportId}/measurements`,
      data
    );
    return res.data.data!.measurement;
  },

  async triggerAnalysis(id: string): Promise<{
    report: MedicalReport;
    measurements?: ExtractedMeasurement[];
    analysis?: ReportAnalysis;
    message?: string;
  }> {
    const res = await apiClient.post<
      ApiResponse<{
        report: MedicalReport;
        measurements?: ExtractedMeasurement[];
        analysis?: ReportAnalysis;
      }>
    >(`/reports/${id}/analyze`);
    return {
      report: res.data.data!.report,
      measurements: res.data.data?.measurements,
      analysis: res.data.data?.analysis,
      message: res.data.message,
    };
  },

  async updateMeasurement(
    reportId: string,
    measurementId: string,
    data: Partial<ExtractedMeasurement>
  ): Promise<ExtractedMeasurement> {
    const res = await apiClient.patch<
      ApiResponse<{ measurement: ExtractedMeasurement }>
    >(`/reports/${reportId}/measurements/${measurementId}`, data);
    return res.data.data!.measurement;
  },

  async confirmAllMeasurements(reportId: string): Promise<MedicalReport> {
    const res = await apiClient.post<ApiResponse<{ report: MedicalReport }>>(
      `/reports/${reportId}/confirm-measurements`
    );
    return res.data.data!.report;
  },
};
