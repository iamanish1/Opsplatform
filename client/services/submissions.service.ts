import apiClient from '@/lib/api';

export interface Submission {
  id: string;
  userId: string;
  projectId: string;
  repoUrl?: string;
  prNumber?: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'REVIEWED';
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    title: string;
    description: string;
  };
  score?: {
    id: string;
    totalScore: number;
    badge: 'RED' | 'YELLOW' | 'GREEN';
  };
}

export const submissionsService = {
  /**
   * Get submission details
   */
  async getSubmission(submissionId: string): Promise<{ success: boolean; data?: Submission }> {
    const response = await apiClient.get(`/api/submissions/${submissionId}`);
    return response.data;
  },
};

