import api from './client';
import { Contact } from '../types';

export const contactsApi = {
  getAll: async (params?: { search?: string; tags?: string; company?: string; page?: number; limit?: number }) => {
    const response = await api.get('/contacts', { params });
    return response.data;
  },

  batchDelete: async (ids: string[]) => {
    const response = await api.delete('/contacts/batch', { data: { ids } });
    return response.data;
  },

  batchUpdate: async (ids: string[], data: { company?: string; tagsAdd?: string[]; tagsRemove?: string[] }) => {
    const response = await api.put('/contacts/batch', { ids, data });
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

  previewImport: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/contacts/import/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  import: async (
    validRows: any[],
    onProgress: (imported: number, processed: number, total: number) => void,
  ): Promise<{ imported: number; skipped: number; total: number; errors: any[] }> => {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const token = localStorage.getItem('token');
    const response = await fetch(`${baseURL}/contacts/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ validRows }),
    });

    if (!response.ok || !response.body) {
      throw new Error('Error al iniciar la importación');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const event = JSON.parse(line.slice(6));
        if (event.type === 'progress') onProgress(event.imported, event.processed, event.total);
        if (event.type === 'done') return event;
      }
    }
    throw new Error('Stream cerrado sin evento done');
  },

  export: async (format: 'csv' | 'xlsx' = 'csv') => {
    const response = await api.get('/contacts/export', {
      params: { format },
      responseType: 'blob',
    });
    return response.data as Blob;
  },

  downloadTemplate: async (format: 'csv' | 'xlsx' = 'xlsx') => {
    const response = await api.get('/contacts/template', {
      params: { format },
      responseType: 'blob',
    });
    return response.data as Blob;
  },

  getMeta: async (): Promise<{ companies: string[]; tags: string[] }> => {
    const response = await api.get('/contacts/meta');
    return response.data;
  },

  checkEmail: async (email: string, excludeId?: string): Promise<{ exists: boolean }> => {
    const response = await api.get('/contacts/check-email', {
      params: { email, ...(excludeId ? { excludeId } : {}) },
    });
    return response.data;
  },
};
