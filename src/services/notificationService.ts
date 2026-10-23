// AICTE SmartVerify — In-App Notifications Service
// SIH Problem Statement 26261 (In-App notifications ONLY — No Email)

import { supabase, isConfigured } from './supabaseClient';
import { NotificationItem } from '../types';

const NOTIFICATIONS_STORAGE_KEY = 'aicte_smartverify_notifications';

// Initial synthetic notifications
const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Scrutiny Review Decision Recorded',
    message: 'Official scrutiny review comments and recommendations have been published for Application AICTE/2026/APP-1002-REVIEWED.',
    type: 'success',
    application_id: 'demo-app-2',
    is_read: false,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'notif-2',
    title: 'Correction Required: Expired Certificate',
    message: 'Automated validation flagged an expired Fire Safety Certificate on Application AICTE/2026/APP-1004-EXPIRED. Please re-upload.',
    type: 'action_required',
    application_id: 'demo-app-4',
    is_read: false,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'notif-3',
    title: 'Mandatory Attachments Missing',
    message: 'Application AICTE/2026/APP-1003-MISSING-DOC requires Fire Safety and Occupancy certificates to proceed.',
    type: 'warning',
    application_id: 'demo-app-3',
    is_read: true,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  }
];

class NotificationService {
  private notifications: NotificationItem[] = [];
  private listeners: Array<(items: NotificationItem[]) => void> = [];

  constructor() {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (saved) {
        try {
          this.notifications = JSON.parse(saved);
        } catch (e) {
          this.notifications = INITIAL_NOTIFICATIONS;
        }
      } else {
        this.notifications = INITIAL_NOTIFICATIONS;
        this.saveLocal();
      }
    } else {
      this.notifications = INITIAL_NOTIFICATIONS;
    }
  }

  private saveLocal() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(this.notifications));
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach(l => l(this.notifications));
  }

  subscribe(listener: (items: NotificationItem[]) => void): () => void {
    this.listeners.push(listener);
    listener(this.notifications);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  async getNotifications(institutionId?: string): Promise<NotificationItem[]> {
    if (isConfigured) {
      try {
        let query = supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false });

        if (institutionId) {
          query = query.or(`institution_id.eq.${institutionId},institution_id.is.null`);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          this.notifications = data;
          this.saveLocal();
          return data;
        }
      } catch (e) {
        console.warn('Supabase fetch notifications notice:', e);
      }
    }
    return this.notifications;
  }

  async markAsRead(id: string): Promise<void> {
    this.notifications = this.notifications.map(n => 
      n.id === id ? { ...n, is_read: true } : n
    );
    this.saveLocal();

    if (isConfigured) {
      try {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', id);
      } catch (e) {
        console.warn('Supabase update notification notice:', e);
      }
    }
  }

  async markAllAsRead(): Promise<void> {
    this.notifications = this.notifications.map(n => ({ ...n, is_read: true }));
    this.saveLocal();

    if (isConfigured) {
      try {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .neq('is_read', true);
      } catch (e) {
        console.warn('Supabase mark all notifications read notice:', e);
      }
    }
  }

  async createNotification(item: Omit<NotificationItem, 'id' | 'is_read' | 'created_at'>): Promise<NotificationItem> {
    const newItem: NotificationItem = {
      ...item,
      id: `notif-${Date.now()}`,
      is_read: false,
      created_at: new Date().toISOString()
    };

    this.notifications = [newItem, ...this.notifications];
    this.saveLocal();

    if (isConfigured) {
      try {
        await supabase.from('notifications').insert({
          title: newItem.title,
          message: newItem.message,
          type: newItem.type,
          application_id: newItem.application_id,
          institution_id: newItem.institution_id,
          user_id: newItem.user_id,
          is_read: false
        });
      } catch (e) {
        console.warn('Supabase insert notification notice:', e);
      }
    }

    return newItem;
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.is_read).length;
  }
}

export const notificationService = new NotificationService();
