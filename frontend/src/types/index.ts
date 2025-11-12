export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'ADMIN' | 'EDITOR' | 'VIEWER';
  createdAt: string;
}

export interface Contact {
  id: string;
  email: string;
  name?: string;
  company?: string;
  phone?: string;
  tags: string[];
  customFields?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  id: string;
  name: string;
  htmlContent: string;
  thumbnail?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  fromEmail: string;
  fromName: string;
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'COMPLETED' | 'FAILED';
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardAnalytics {
  summary: {
    totalCampaigns: number;
    totalContacts: number;
    totalSent: number;
    totalOpens: number;
    totalClicks: number;
    openRate: number;
    clickRate: number;
  };
  recentCampaigns: Array<{
    id: string;
    name: string;
    status: string;
    sentAt?: string;
    recipientsCount: number;
    eventsCount: number;
  }>;
  topContacts: Array<{
    id: string;
    email: string;
    name?: string;
    eventCount: number;
  }>;
  engagementOverTime: Array<{
    date: string;
    opens: number;
    clicks: number;
  }>;
}

export interface CampaignAnalytics {
  campaign: {
    id: string;
    name: string;
    status: string;
    sentAt?: string;
    totalRecipients: number;
  };
  metrics: {
    sent: number;
    opened: number;
    clicked: number;
    bounced: number;
    failed: number;
    uniqueOpens: number;
    uniqueClicks: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
  };
  deviceStats: Array<{ device: string; count: number }>;
  countryStats: Array<{ country: string; count: number }>;
  clickedLinks: Array<{ url: string; count: number }>;
  opensByHour: Array<{ hour: number; count: number }>;
  engagementTimeline: Array<{ date: string; opens: number; clicks: number }>;
}
