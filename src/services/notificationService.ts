// AICTE SmartVerify — In-App Notifications Service
// SIH Problem Statement 26261 (Role-Aware & Event-Persisted In-App Notifications)

import { supabase, isConfigured } from './supabaseClient';
import { NotificationItem, UserRole } from '../types';
import { AuthUserSession } from './authService';

const NOTIFICATIONS_STORAGE_KEY = 'aicte_smartverify_notifications_v2';

// Seed notifications with explicit role segregation
const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  // Institution User / Director Notifications
  {
    id: 'notif-inst-1',
    institution_id: 'a0000000-0000-0000-0000-000000000001',
    target_role: 'institution_user',
    title: 'Preliminary Scrutiny Passed: EoA 2026-2027',
    message: 'Extension of Approval application AICTE/2026/APP-1001-PASS has passed all 10 automated regulatory verification checks and is awaiting official desk review.',
    type: 'success',
    application_id: 'demo-app-1',
    action_url: '/applications/demo-app-1',
    event_type: 'VALIDATION_PASSED',
    is_read: false,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'notif-inst-2',
    institution_id: 'a0000000-0000-0000-0000-000000000001',
    target_role: 'institution_user',
    title: 'Action Required: Expired Fire Safety Certificate',
    message: 'Application AICTE/2026/APP-1004-EXPIRED has a Fire Safety Certificate that expired before the start of Academic Year 2026-2027. Please re-upload a valid NOC.',
    type: 'action_required',
    application_id: 'demo-app-4',
    action_url: '/applications/demo-app-4',
    event_type: 'DOCUMENT_EXPIRED',
    is_read: false,
    created_at: new Date(Date.now() - 3600000 * 6).toISOString()
  },
  {
    id: 'notif-inst-3',
    institution_id: 'a0000000-0000-0000-0000-000000000001',
    target_role: 'institution_user',
    title: 'Missing Mandatory Attachments Alert',
    message: 'Application AICTE/2026/APP-1003-MISSING-DOC cannot be submitted. Fire Safety Certificate and Occupancy Certificate are required under AICTE APH 2026-2027.',
    type: 'warning',
    application_id: 'demo-app-3',
    action_url: '/applications/demo-app-3',
    event_type: 'DOCUMENTS_MISSING',
    is_read: true,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  },

  // Scrutiny Officer Notifications
  {
    id: 'notif-officer-1',
    target_role: 'scrutiny_officer',
    title: 'New Application Awaiting Scrutiny Desk Review',
    message: 'New application AICTE/2026/APP-1001-PASS submitted by Northern Institute of Advanced Technology & Research is ready for official scrutiny.',
    type: 'info',
    application_id: 'demo-app-1',
    action_url: '/applications/demo-app-1',
    event_type: 'APPLICATION_SUBMITTED',
    is_read: false,
    created_at: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'notif-officer-2',
    target_role: 'scrutiny_officer',
    title: 'Potential Document Anomaly Flagged for Manual Review',
    message: 'Application AICTE/2026/APP-1005-NAME-MISMATCH exhibits a legal entity name variation across uploaded Land Deed and Institute Profile. Officer review required.',
    type: 'warning',
    application_id: 'demo-app-5',
    action_url: '/applications/demo-app-5',
    event_type: 'ANOMALY_FLAGGED',
    is_read: false,
    created_at: new Date(Date.now() - 3600000 * 8).toISOString()
  },
  {
    id: 'notif-officer-3',
    target_role: 'scrutiny_officer',
    title: 'Duplicate Checksum Flagged',
    message: 'Application AICTE/2026/APP-1007-DUPLICATE uploaded an identical byte checksum across two distinct document slots. High scrutiny required.',
    type: 'action_required',
    application_id: 'demo-app-7',
    action_url: '/applications/demo-app-7',
    event_type: 'DUPLICATE_FILE',
    is_read: true,
    created_at: new Date(Date.now() - 3600000 * 28).toISOString()
  }
];

class NotificationService {
  private notifications: NotificationItem[] = [];
  private listeners: Array<(items: NotificationItem[]) => void> = [];

  constructor() {
    this.loadLocal();
  }

  private loadLocal() {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (saved) {
        try {
          this.notifications = JSON.parse(saved);
          return;
        } catch (e) {
          console.warn('Failed parsing notifications cache:', e);
        }
      }
      this.notifications = [...INITIAL_NOTIFICATIONS];
      this.saveLocal();
    } else {
      this.notifications = [...INITIAL_NOTIFICATIONS];
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

  /**
   * Role-aware notification filter:
   * Strictly delivers Director/Institution notifications to institutions,
   * and Scrutiny Officer notifications to scrutiny officers.
   */
  filterForUser(items: NotificationItem[], user: AuthUserSession | null): NotificationItem[] {
    if (!user) return [];

    const isSuperAdmin = user.roles.includes('super_admin');
    const isOfficer = user.roles.includes('scrutiny_officer') || user.roles.includes('admin');
    const isInst = user.roles.includes('institution_user') || user.roles.includes('institution');

    return items.filter(n => {
      // Direct user match
      if (n.user_id && n.user_id === user.id) return true;

      // Super Admin sees governance and officer notifications
      if (isSuperAdmin) {
        return n.target_role === 'super_admin' || n.target_role === 'scrutiny_officer' || n.target_role === 'all' || !n.target_role;
      }

      // Scrutiny Officer sees scrutiny workflow notifications
      if (isOfficer) {
        return n.target_role === 'scrutiny_officer' || n.target_role === 'all' || (!n.institution_id && !n.target_role);
      }

      // Institution User / Director sees ONLY their institution's notifications
      if (isInst) {
        if (n.target_role === 'scrutiny_officer' || n.target_role === 'super_admin') {
          return false; // Security boundary: never leak officer notifications to institution
        }
        if (n.institution_id) {
          return n.institution_id === user.institution_id || (user.institution && n.institution_id === user.institution.id);
        }
        return n.target_role === 'institution_user' || n.target_role === 'all';
      }

      return false;
    });
  }

  async getNotifications(user?: AuthUserSession | null): Promise<NotificationItem[]> {
    if (isConfigured) {
      try {
        let query = supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false });

        if (user?.institution_id) {
          query = query.or(`institution_id.eq.${user.institution_id},institution_id.is.null`);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          // Merge database records with local memory
          const existingIds = new Set(data.map(d => d.id));
          const localOnly = this.notifications.filter(n => !existingIds.has(n.id));
          this.notifications = [...data, ...localOnly];
          this.saveLocal();
        }
      } catch (e) {
        console.warn('Supabase fetch notifications notice:', e);
      }
    }

    if (user) {
      return this.filterForUser(this.notifications, user);
    }
    return this.notifications;
  }

  getAllLocal(): NotificationItem[] {
    return this.notifications;
  }

  async createNotification(item: Partial<NotificationItem> & { title: string; message: string }): Promise<NotificationItem> {
    const notif: NotificationItem = {
      id: item.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: item.user_id,
      institution_id: item.institution_id,
      title: item.title,
      message: item.message,
      type: item.type || 'info',
      application_id: item.application_id,
      action_url: item.action_url || (item.application_id ? `/applications/${item.application_id}` : undefined),
      event_type: item.event_type,
      target_role: item.target_role,
      is_read: false,
      created_at: new Date().toISOString()
    };

    this.notifications.unshift(notif);
    this.saveLocal();

    if (isConfigured) {
      try {
        await supabase.from('notifications').insert([{
          id: notif.id,
          user_id: notif.user_id,
          institution_id: notif.institution_id,
          title: notif.title,
          message: notif.message,
          type: notif.type,
          application_id: notif.application_id,
          is_read: false,
          created_at: notif.created_at
        }]);
      } catch (err) {
        console.warn('Supabase createNotification notice:', err);
      }
    }

    return notif;
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

  async markAllAsRead(user?: AuthUserSession | null): Promise<void> {
    if (user) {
      const allowedIds = new Set(this.filterForUser(this.notifications, user).map(n => n.id));
      this.notifications = this.notifications.map(n => 
        allowedIds.has(n.id) ? { ...n, is_read: true } : n
      );
    } else {
      this.notifications = this.notifications.map(n => ({ ...n, is_read: true }));
    }
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

  async dispatchNotification(item: {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'action_required';
    targetRole?: 'institution_user' | 'scrutiny_officer' | 'super_admin' | 'all';
    institutionId?: string;
    userId?: string;
    applicationId?: string;
    actionUrl?: string;
    eventType?: string;
  }): Promise<NotificationItem> {
    const newItem: NotificationItem = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: item.title,
      message: item.message,
      type: item.type,
      target_role: item.targetRole || 'all',
      institution_id: item.institutionId,
      user_id: item.userId,
      application_id: item.applicationId,
      action_url: item.actionUrl || (item.applicationId ? `/applications/${item.applicationId}` : undefined),
      event_type: item.eventType,
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

  // --- Specialized Workflow Dispatchers ---

  async notifyDraftSaved(applicationId: string, appNumber: string, institutionId: string, userId?: string) {
    return this.dispatchNotification({
      title: 'Application Draft Saved',
      message: `Draft application ${appNumber} saved. You can continue editing anytime from your Institution Dashboard.`,
      type: 'info',
      targetRole: 'institution_user',
      institutionId,
      userId,
      applicationId,
      actionUrl: `/applications/${applicationId}`,
      eventType: 'DRAFT_SAVED'
    });
  }

  async notifyApplicationSubmitted(applicationId: string, appNumber: string, institutionId: string, instName: string) {
    // 1. Notify Institution Director
    await this.dispatchNotification({
      title: 'Application Successfully Submitted',
      message: `Application ${appNumber} has been officially submitted to the AICTE Regulation Bureau for scrutiny.`,
      type: 'success',
      targetRole: 'institution_user',
      institutionId,
      applicationId,
      actionUrl: `/applications/${applicationId}`,
      eventType: 'APPLICATION_SUBMITTED'
    });

    // 2. Alert Scrutiny Officers Queue
    await this.dispatchNotification({
      title: 'New Application Awaiting Scrutiny',
      message: `${instName} submitted Application ${appNumber}. Assigned to regional scrutiny queue.`,
      type: 'info',
      targetRole: 'scrutiny_officer',
      applicationId,
      actionUrl: `/applications/${applicationId}`,
      eventType: 'APPLICATION_AWAITING_SCRUTINY'
    });
  }

  async notifyClarificationRequested(applicationId: string, appNumber: string, institutionId: string, query: string) {
    return this.dispatchNotification({
      title: 'Clarification Directive Issued by Scrutiny Desk',
      message: `AICTE Scrutiny Officer issued a query regarding ${appNumber}: "${query.slice(0, 100)}...". Please review and submit certified response.`,
      type: 'action_required',
      targetRole: 'institution_user',
      institutionId,
      applicationId,
      actionUrl: `/applications/${applicationId}`,
      eventType: 'CLARIFICATION_REQUESTED'
    });
  }

  async notifyClarificationResponded(applicationId: string, appNumber: string, instName: string, officerId?: string) {
    return this.dispatchNotification({
      title: 'Institutional Clarification Response Received',
      message: `${instName} has submitted response & evidence for ${appNumber}. Ready for officer evaluation.`,
      type: 'info',
      targetRole: 'scrutiny_officer',
      userId: officerId,
      applicationId,
      actionUrl: `/applications/${applicationId}`,
      eventType: 'CLARIFICATION_RESPONDED'
    });
  }

  async notifyStatusChanged(applicationId: string, appNumber: string, institutionId: string, oldStatus: string, newStatus: string, reason: string) {
    // Notify Director
    await this.dispatchNotification({
      title: `Application Status Updated: ${newStatus}`,
      message: `Application ${appNumber} status transitioned from ${oldStatus} to ${newStatus}. Note: ${reason}`,
      type: newStatus === 'Verified' || newStatus === 'Review Completed' ? 'success' : 'info',
      targetRole: 'institution_user',
      institutionId,
      applicationId,
      actionUrl: `/applications/${applicationId}`,
      eventType: 'STATUS_CHANGED'
    });

    // Notify Officer
    await this.dispatchNotification({
      title: `Status Transition Recorded: ${appNumber}`,
      message: `Status transitioned to ${newStatus} by authorized scrutiny workflow.`,
      type: 'info',
      targetRole: 'scrutiny_officer',
      applicationId,
      actionUrl: `/applications/${applicationId}`,
      eventType: 'STATUS_CHANGED'
    });
  }
}

export const notificationService = new NotificationService();
