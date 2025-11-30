import apiClient from '@/lib/api';

export interface Portfolio {
  id: string;
  userId: string;
  submissionId: string;
  summary?: string;
  slug: string;
  portfolioJson?: {
    header?: {
      name?: string;
      githubUsername?: string;
      avatar?: string;
      location?: string;
    };
    score?: {
      totalScore: number;
      badge: 'RED' | 'YELLOW' | 'GREEN';
      breakdown: Record<string, number>;
    };
    project?: {
      title: string;
      description: string;
      repoUrl?: string;
    };
    review?: {
      summary: string;
      highlights: string[];
    };
    evidence?: Array<{
      category: string;
      description: string;
      githubLink?: string;
      codeSnippet?: string;
    }>;
    timeline?: Array<{
      date: string;
      event: string;
    }>;
  };
  createdAt: string;
  updatedAt: string;
}

export const portfolioService = {
  /**
   * Get portfolio by slug (public)
   */
  async getPortfolioBySlug(slug: string): Promise<{ success: boolean; data?: Portfolio }> {
    const response = await apiClient.get(`/api/portfolios/${slug}`);
    return response.data;
  },

  /**
   * Get user's portfolios (authenticated)
   */
  async getUserPortfolios(): Promise<{ success: boolean; data?: Portfolio[] }> {
    const response = await apiClient.get('/api/portfolios');
    return response.data;
  },

  /**
   * Get portfolio by submission ID
   */
  async getPortfolioBySubmission(submissionId: string): Promise<{ success: boolean; data?: Portfolio }> {
    const response = await apiClient.get(`/api/portfolios/submission/${submissionId}`);
    return response.data;
  },
};

