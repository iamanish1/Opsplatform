import apiClient from '@/lib/api';

export interface Score {
  id: string;
  submissionId: string;
  codeQuality: number;
  problemSolving: number;
  bugRisk: number;
  devopsExecution: number;
  optimization: number;
  documentation: number;
  gitMaturity: number;
  collaboration: number;
  deliverySpeed: number;
  security: number;
  totalScore: number;
  badge: 'RED' | 'YELLOW' | 'GREEN';
  detailsJson?: {
    breakdown?: Record<string, any>;
    evidence?: Array<{
      category: string;
      description: string;
      githubLink?: string;
      codeSnippet?: string;
    }>;
    appliedRules?: Array<{
      rule: string;
      category: string;
      action: string;
      reason: string;
    }>;
  };
  createdAt: string;
  updatedAt: string;
}

export const scoreService = {
  /**
   * Get score for a submission
   * Note: This endpoint may need to be implemented in the backend
   * For now, we'll try to get it from the submission or portfolio endpoint
   */
  async getScore(submissionId: string): Promise<{ success: boolean; data?: Score }> {
    try {
      // Try direct endpoint first
      const response = await apiClient.get(`/api/score/${submissionId}`);
      return response.data;
    } catch (error: any) {
      // Fallback: get from submission endpoint
      if (error.response?.status === 404) {
        const submissionResponse = await apiClient.get(`/api/submissions/${submissionId}`);
        if (submissionResponse.data?.data?.score) {
          return {
            success: true,
            data: submissionResponse.data.data.score,
          };
        }
      }
      throw error;
    }
  },
};

