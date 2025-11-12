import api from './client';
import { Template } from '../types';

export const templatesApi = {
  getAll: async (params?: { search?: string; page?: number; limit?: number }) => {
    const response = await api.get('/templates', { params });
    return response.data;
  },

  getOne: async (id: string): Promise<{ template: Template }> => {
    const response = await api.get(`/templates/${id}`);
    return response.data;
  },

  create: async (data: Partial<Template>) => {
    const response = await api.post('/templates', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Template>) => {
    const response = await api.put(`/templates/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/templates/${id}`);
    return response.data;
  },
};
