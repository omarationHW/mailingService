import api from './client';
import { DashboardAnalytics, CampaignAnalytics } from '../types';

export const analyticsApi = {
  getDashboard: async (): Promise<DashboardAnalytics> => {
    const response = await api.get('/analytics/dashboard');
    return response.data;
  },

  getCampaign: async (id: string): Promise<CampaignAnalytics> => {
    const response = await api.get(`/analytics/campaigns/${id}`);
    return response.data;
  },

  exportCampaign: async (id: string) => {
    const response = await api.get(`/analytics/campaigns/${id}/export`, { responseType: 'blob' });
    return response.data;
  },
};
