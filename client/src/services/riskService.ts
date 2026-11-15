import { apiClient } from './api.js';
import {
  RiskAssessment,
  AssessmentType,
  WhatIfScenario,
  ApiResponse,
} from '../types/index.js';

export const riskService = {
  async evaluateRisk(
    reportId: string,
    assessmentType: AssessmentType,
    manualInputs?: Record<string, unknown>
  ): Promise<RiskAssessment> {
    const res = await apiClient.post<ApiResponse<{ assessment: RiskAssessment }>>(
      `/reports/${reportId}/risk-assessments`,
      {
        assessmentType,
        manualInputs,
      }
    );
    return res.data.data!.assessment;
  },

  async getReportAssessments(reportId: string): Promise<RiskAssessment[]> {
    const res = await apiClient.get<ApiResponse<{ assessments: RiskAssessment[] }>>(
      `/reports/${reportId}/risk-assessments`
    );
    return res.data.data!.assessments;
  },

  async getAssessmentById(
    id: string
  ): Promise<{ assessment: RiskAssessment; scenarios: WhatIfScenario[] }> {
    const res = await apiClient.get<
      ApiResponse<{ assessment: RiskAssessment; scenarios: WhatIfScenario[] }>
    >(`/risk-assessments/${id}`);
    return res.data.data!;
  },

  async createWhatIfScenario(
    assessmentId: string,
    scenarioName: string,
    hypotheticalInputs: Record<string, unknown>
  ): Promise<WhatIfScenario> {
    const res = await apiClient.post<ApiResponse<{ scenario: WhatIfScenario }>>(
      `/risk-assessments/${assessmentId}/scenarios`,
      {
        scenarioName,
        hypotheticalInputs,
      }
    );
    return res.data.data!.scenario;
  },

  async getWhatIfScenarios(assessmentId: string): Promise<WhatIfScenario[]> {
    const res = await apiClient.get<ApiResponse<{ scenarios: WhatIfScenario[] }>>(
      `/risk-assessments/${assessmentId}/scenarios`
    );
    return res.data.data!.scenarios;
  },
};
