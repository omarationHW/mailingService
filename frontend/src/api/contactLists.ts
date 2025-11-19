import api from './client';

export interface ContactList {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    members: number;
  };
}

export interface ContactListMember {
  id: string;
  contactListId: string;
  contactId: string;
  addedAt: string;
  contact: {
    id: string;
    email: string;
    name?: string;
    company?: string;
    phone?: string;
  };
}

export interface ContactListWithMembers extends ContactList {
  members: ContactListMember[];
}

export const contactListsApi = {
  getAll: async (params?: { search?: string; page?: number; limit?: number }) => {
    const response = await api.get('/contact-lists', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/contact-lists/${id}`);
    return response.data;
  },

  create: async (data: { name: string; description?: string }) => {
    const response = await api.post('/contact-lists', data);
    return response.data;
  },

  update: async (id: string, data: { name?: string; description?: string }) => {
    const response = await api.put(`/contact-lists/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/contact-lists/${id}`);
    return response.data;
  },

  addContacts: async (id: string, contactIds: string[]) => {
    const response = await api.post(`/contact-lists/${id}/contacts`, {
      contactIds,
    });
    return response.data;
  },

  removeContact: async (listId: string, contactId: string) => {
    const response = await api.delete(
      `/contact-lists/${listId}/contacts/${contactId}`
    );
    return response.data;
  },

  getContacts: async (
    listId: string,
    params?: { page?: number; limit?: number }
  ) => {
    const response = await api.get(`/contact-lists/${listId}/contacts`, {
      params,
    });
    return response.data;
  },
};
