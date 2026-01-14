import api from './client';

export type SequenceStatus = 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
export type SequenceTriggerType = 'MANUAL' | 'CONTACT_CREATED' | 'LIST_ADDED' | 'TAG_ADDED' | 'EMAIL_OPENED' | 'LINK_CLICKED';
export type SequenceStepStatus = 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED';
export type SchedulingType = 'RELATIVE_DELAY' | 'ABSOLUTE_DATE';

export interface SequenceStep {
  id: string;
  sequenceId: string;
  stepOrder: number;
  name: string;
  subject: string;
  htmlContent: string;
  schedulingType: SchedulingType;
  delayDays: number;
  delayHours: number;
  absoluteScheduleDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SequenceStepExecution {
  id: string;
  enrollmentId: string;
  stepId: string;
  status: SequenceStepStatus;
  scheduledFor: string;
  sentAt?: string;
  trackToken: string;
  error?: string;
  createdAt: string;
  step: SequenceStep;
}

export interface SequenceEnrollment {
  id: string;
  sequenceId: string;
  contactId: string;
  status: SequenceStatus;
  enrolledAt: string;
  completedAt?: string;
  pausedAt?: string;
  contact: {
    id: string;
    email: string;
    name?: string;
    company?: string;
  };
  executions: SequenceStepExecution[];
}

export interface Sequence {
  id: string;
  name: string;
  description?: string;
  status: SequenceStatus;
  triggerType: SequenceTriggerType;
  triggerValue?: string;
  fromEmail: string;
  fromName: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    steps: number;
    enrollments: number;
  };
}

export interface SequenceWithSteps extends Sequence {
  steps: SequenceStep[];
  enrollments?: SequenceEnrollment[];
}

export interface CreateSequenceStep {
  name: string;
  subject: string;
  htmlContent: string;
  schedulingType?: SchedulingType;
  delayDays?: number;
  delayHours?: number;
  absoluteScheduleDate?: string;
}

export interface CreateSequenceData {
  name: string;
  description?: string;
  triggerType: SequenceTriggerType;
  triggerValue?: string;
  fromEmail: string;
  fromName: string;
  steps: CreateSequenceStep[];
}

export interface UpdateSequenceData {
  name?: string;
  description?: string;
  status?: SequenceStatus;
  triggerType?: SequenceTriggerType;
  triggerValue?: string;
  fromEmail?: string;
  fromName?: string;
}

export const sequencesApi = {
  getAll: async (params?: { search?: string; status?: SequenceStatus; page?: number; limit?: number }) => {
    const response = await api.get('/sequences', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/sequences/${id}`);
    return response.data;
  },

  create: async (data: CreateSequenceData) => {
    const response = await api.post('/sequences', data);
    return response.data;
  },

  update: async (id: string, data: UpdateSequenceData) => {
    const response = await api.put(`/sequences/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/sequences/${id}`);
    return response.data;
  },

  updateSteps: async (id: string, steps: CreateSequenceStep[]) => {
    const response = await api.put(`/sequences/${id}/steps`, { steps });
    return response.data;
  },

  enrollContacts: async (id: string, contactIds: string[]) => {
    const response = await api.post(`/sequences/${id}/enroll`, {
      contactIds,
    });
    return response.data;
  },

  unenrollContact: async (sequenceId: string, contactId: string) => {
    const response = await api.delete(
      `/sequences/${sequenceId}/contacts/${contactId}`
    );
    return response.data;
  },

  getEnrollments: async (
    sequenceId: string,
    params?: { status?: SequenceStatus; page?: number; limit?: number }
  ) => {
    const response = await api.get(`/sequences/${sequenceId}/enrollments`, {
      params,
    });
    return response.data;
  },

  getAnalytics: async (sequenceId: string) => {
    const response = await api.get(`/sequences/${sequenceId}/analytics`);
    return response.data;
  },
};
