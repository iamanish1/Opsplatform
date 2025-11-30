import apiClient from '@/lib/api';

export interface TalentFilters {
  badge?: 'RED' | 'YELLOW' | 'GREEN';
  minScore?: number;
  maxScore?: number;
  skills?: string[];
  country?: string;
  hasProject?: boolean;
  githubUsername?: string;
  page?: number;
  limit?: number;
}

export interface Talent {
  id: string;
  name?: string;
  githubUsername?: string;
  avatar?: string;
  location?: string;
  badge: 'RED' | 'YELLOW' | 'GREEN';
  trustScore: number;
  portfolio?: {
    slug: string;
    score?: {
      totalScore: number;
    };
  };
  latestSubmission?: {
    id: string;
    project?: {
      title: string;
      tags?: string[];
    };
  };
}

export interface TalentFeedResponse {
  success: boolean;
  data?: {
    talents: Talent[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export const talentService = {
  /**
   * Get talent feed with filters
   */
  async getTalentFeed(filters: TalentFilters = {}): Promise<TalentFeedResponse> {
    const params = new URLSearchParams();
    if (filters.badge) params.append('badge', filters.badge);
    if (filters.minScore !== undefined) params.append('minScore', filters.minScore.toString());
    if (filters.maxScore !== undefined) params.append('maxScore', filters.maxScore.toString());
    if (filters.skills?.length) {
      filters.skills.forEach(skill => params.append('skills', skill));
    }
    if (filters.country) params.append('country', filters.country);
    if (filters.hasProject !== undefined) params.append('hasProject', filters.hasProject.toString());
    if (filters.githubUsername) params.append('githubUsername', filters.githubUsername);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get(`/api/company/talent-feed?${params.toString()}`);
    return response.data;
  },
};

