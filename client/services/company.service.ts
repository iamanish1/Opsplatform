import apiClient from '@/lib/api';

export interface CompanyProfile {
  id: string;
  userId: string;
  companyName: string;
  website?: string;
  logo?: string;
  createdAt: string;
  updatedAt: string;
}

export const companyService = {
  /**
   * Get company profile
   */
  async getProfile(): Promise<{ success: boolean; data?: CompanyProfile }> {
    const response = await apiClient.get('/api/company/profile');
    return response.data;
  },

  /**
   * Update company profile
   */
  async updateProfile(data: Partial<CompanyProfile>): Promise<{ success: boolean; data?: CompanyProfile }> {
    const response = await apiClient.patch('/api/company/profile', data);
    return response.data;
  },

  /**
   * Get portfolio for company view
   */
  async getPortfolioForCompany(slug: string): Promise<{ success: boolean; data?: any }> {
    const response = await apiClient.get(`/api/company/portfolios/${slug}`);
    return response.data;
  },
};

