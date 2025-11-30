import apiClient from '@/lib/api';

export interface Project {
  id: string;
  title: string;
  description: string;
  starterRepo?: string;
  tasksJson?: any;
  tags?: string[];
  createdAt: string;
}

export interface StartProjectRequest {
  repoUrl: string;
}

export interface StartProjectResponse {
  success: boolean;
  data?: {
    submission: {
      id: string;
      projectId: string;
      repoUrl: string;
      status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'REVIEWED';
      createdAt: string;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

export const projectsService = {
  /**
   * Get project details
   */
  async getProject(projectId: string): Promise<{ success: boolean; data?: Project }> {
    const response = await apiClient.get(`/api/projects/${projectId}`);
    return response.data;
  },

  /**
   * Start a project (create submission)
   */
  async startProject(projectId: string, data: StartProjectRequest): Promise<StartProjectResponse> {
    const response = await apiClient.post(`/api/projects/${projectId}/start`, data);
    return response.data;
  },
};

