import { create } from 'zustand';
import { campaignsApi } from '../api/campaigns';
import { sequencesApi } from '../api/sequences';

export interface AppNotification {
  id: string;
  type: 'error' | 'success' | 'warning' | 'info';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: Date;
}

interface NotificationState {
  notifications: AppNotification[];
  lastFetched: Date | null;
  loading: boolean;
  fetch: () => Promise<void>;
  markRead: (id: string) => void;
  markAllRead: () => void;
  unreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  lastFetched: null,
  loading: false,

  fetch: async () => {
    set({ loading: true });
    try {
      const [campaignData, sequenceData] = await Promise.all([
        campaignsApi.getAll({ limit: 50 }),
        sequencesApi.getAll({ limit: 50 }),
      ]);

      const notes: AppNotification[] = [];
      const now = new Date();

      // Campaigns: FAILED → error
      for (const c of campaignData.campaigns) {
        if (c.status === 'FAILED') {
          notes.push({
            id: `campaign-failed-${c.id}`,
            type: 'error',
            title: 'Campaña fallida',
            message: `La campaña "${c.name}" no pudo enviarse.`,
            link: `/campaigns/${c.id}`,
            read: false,
            createdAt: new Date(c.updatedAt),
          });
        }
        // Campaigns completed in last 24h → success
        if (c.status === 'COMPLETED' && c.sentAt) {
          const sentAt = new Date(c.sentAt);
          const hoursAgo = (now.getTime() - sentAt.getTime()) / (1000 * 60 * 60);
          if (hoursAgo <= 24) {
            notes.push({
              id: `campaign-completed-${c.id}`,
              type: 'success',
              title: 'Campaña completada',
              message: `"${c.name}" se envió exitosamente a ${c._count?.campaignContacts ?? 0} contactos.`,
              link: `/campaigns/${c.id}`,
              read: false,
              createdAt: sentAt,
            });
          }
        }
      }

      // Sequences: PAUSED → warning
      for (const s of sequenceData.sequences ?? []) {
        if (s.status === 'PAUSED') {
          notes.push({
            id: `sequence-paused-${s.id}`,
            type: 'warning',
            title: 'Secuencia pausada',
            message: `La secuencia "${s.name}" está pausada y tiene contactos activos.`,
            link: `/sequences/${s.id}`,
            read: false,
            createdAt: new Date(s.updatedAt),
          });
        }
      }

      // Sort newest first, cap at 20
      notes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      const capped = notes.slice(0, 20);

      // Preserve read state from previous notifications
      const prev = get().notifications;
      const readIds = new Set(prev.filter(n => n.read).map(n => n.id));
      const merged = capped.map(n => ({ ...n, read: readIds.has(n.id) }));

      set({ notifications: merged, lastFetched: now });
    } catch {
      // Silent fail — notifications are non-critical
    } finally {
      set({ loading: false });
    }
  },

  markRead: (id: string) =>
    set(state => ({
      notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n),
    })),

  markAllRead: () =>
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, read: true })),
    })),

  unreadCount: () => get().notifications.filter(n => !n.read).length,
}));
