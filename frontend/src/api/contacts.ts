import api from './client';
import { Contact } from '../types';

export const contactsApi = {
  getAll: async (params?: { search?: string; tags?: string; page?: number; limit?: number }) => {
    const response = await api.get('/contacts', { params });
    return response.data;
  },

  getOne: async (id: string): Promise<{ contact: Contact }> => {
    const response = await api.get(`/contacts/${id}`);
    return response.data;
  },

  create: async (data: Partial<Contact>) => {
    const response = await api.post('/contacts', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Contact>) => {
    const response = await api.put(`/contacts/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/contacts/${id}`);
    return response.data;
  },

  import: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/contacts/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  export: async () => {
    const response = await api.get('/contacts/export', { responseType: 'blob' });
    return response.data;
  },
};
