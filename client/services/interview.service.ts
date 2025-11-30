import apiClient from '@/lib/api';

export interface InterviewRequest {
  id: string;
  companyId: string;
  userId: string;
  message?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
  company?: {
    companyName: string;
    logo?: string;
  };
  user?: {
    name?: string;
    githubUsername?: string;
    avatar?: string;
  };
}

export interface CreateInterviewRequest {
  userId: string;
  message?: string;
  position?: string;
}

export const interviewService = {
  /**
   * Create interview request
   */
  async createRequest(data: CreateInterviewRequest): Promise<{ success: boolean; data?: InterviewRequest }> {
    const response = await apiClient.post('/api/interview-requests', data);
    return response.data;
  },

  /**
   * Get my interview requests
   */
  async getMyRequests(status?: string): Promise<{ success: boolean; data?: InterviewRequest[] }> {
    const params = status ? `?status=${status}` : '';
    const response = await apiClient.get(`/api/interview-requests${params}`);
    return response.data;
  },

  /**
   * Accept interview request
   */
  async acceptRequest(requestId: string): Promise<{ success: boolean; data?: InterviewRequest }> {
    const response = await apiClient.post(`/api/interview-requests/${requestId}/accept`);
    return response.data;
  },

  /**
   * Reject interview request
   */
  async rejectRequest(requestId: string): Promise<{ success: boolean; data?: InterviewRequest }> {
    const response = await apiClient.post(`/api/interview-requests/${requestId}/reject`);
    return response.data;
  },

  /**
   * Cancel interview request
   */
  async cancelRequest(requestId: string): Promise<{ success: boolean; data?: InterviewRequest }> {
    const response = await apiClient.post(`/api/interview-requests/${requestId}/cancel`);
    return response.data;
  },
};

