import api from './client';
import { Campaign } from '../types';

export const campaignsApi = {
  getAll: async (params?: { status?: string; search?: string; page?: number; limit?: number }) => {
    const response = await api.get('/campaigns', { params });
    return response.data;
  },

  getOne: async (id: string): Promise<{ campaign: Campaign }> => {
    const response = await api.get(`/campaigns/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/campaigns', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Campaign>) => {
    const response = await api.put(`/campaigns/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/campaigns/${id}`);
    return response.data;
  },

  send: async (id: string) => {
    const response = await api.post(`/campaigns/${id}/send`);
    return response.data;
  },
};
