// AICTE SmartVerify — Status Clarification & Request Service
// SIH Problem Statement 26261

import { supabase, isConfigured } from './supabaseClient';
import { StatusUpdateRequest } from '../types';
import { notificationService } from './notificationService';

const STATUS_REQUESTS_KEY = 'aicte_smartverify_status_requests';

const INITIAL_REQUESTS: StatusUpdateRequest[] = [
  {
    id: 'req-demo-1',
    application_id: 'demo-app-3',
    institution_id: 'inst-3',
    request_subject: 'Clarification regarding Fire Safety Certificate renewal timeline',
    request_message: 'Our regional fire department inspection was conducted on Feb 5th. We have received the provisional receipt. Can this provisional receipt be accepted while the final certificate is generated?',
    reply_message: 'Provisional receipts cannot be accepted for final Extension of Approval. AICTE Approval Process Handbook requires the signed official clearance certificate with valid serial number.',
    replied_by: 'Dr. V. K. Deshmukh (Regional Scrutiny Officer)',
    status: 'Resolved',
    created_at: '2026-02-12T16:00:00Z',
    replied_at: '2026-02-13T10:30:00Z'
  }
];

class StatusRequestService {
  private requests: StatusUpdateRequest[] = [];

  constructor() {
    const saved = localStorage.getItem(STATUS_REQUESTS_KEY);
    if (saved) {
      try {
        this.requests = JSON.parse(saved);
      } catch (e) {
        this.requests = INITIAL_REQUESTS;
      }
    } else {
      this.requests = INITIAL_REQUESTS;
      this.saveLocal();
    }
  }

  private saveLocal() {
    localStorage.setItem(STATUS_REQUESTS_KEY, JSON.stringify(this.requests));
  }

  async getRequests(applicationId?: string, institutionId?: string): Promise<StatusUpdateRequest[]> {
    if (isConfigured) {
      try {
        let query = supabase
          .from('status_update_requests')
          .select('*')
          .order('created_at', { ascending: false });

        if (applicationId) {
          query = query.eq('application_id', applicationId);
        } else if (institutionId) {
          query = query.eq('institution_id', institutionId);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          this.requests = data;
          this.saveLocal();
          return data;
        }
      } catch (e) {
        console.warn('Supabase fetch status requests notice:', e);
      }
    }

    if (applicationId) {
      return this.requests.filter(r => r.application_id === applicationId);
    }
    if (institutionId) {
      return this.requests.filter(r => r.institution_id === institutionId);
    }
    return this.requests;
  }

  async submitRequest(
    applicationId: string,
    institutionId: string,
    subject: string,
    message: string,
    userId?: string
  ): Promise<StatusUpdateRequest> {
    const newReq: StatusUpdateRequest = {
      id: `req-${Date.now()}`,
      application_id: applicationId,
      institution_id: institutionId,
      requested_by: userId,
      request_subject: subject,
      request_message: message,
      status: 'Pending',
      created_at: new Date().toISOString()
    };

    this.requests = [newReq, ...this.requests];
    this.saveLocal();

    if (isConfigured) {
      try {
        await supabase.from('status_update_requests').insert({
          id: newReq.id,
          application_id: applicationId,
          institution_id: institutionId,
          requested_by: userId,
          request_subject: subject,
          request_message: message,
          status: 'Pending'
        });
      } catch (e) {
        console.warn('Supabase insert status request notice:', e);
      }
    }

    // In-app notification for administrator
    await notificationService.createNotification({
      title: 'New Status Clarification Request',
      message: `Institution submitted a clarification request: "${subject}"`,
      type: 'info',
      application_id: applicationId
    });

    return newReq;
  }

  async replyToRequest(
    requestId: string,
    replyText: string,
    repliedByName: string,
    adminId?: string
  ): Promise<StatusUpdateRequest | null> {
    const req = this.requests.find(r => r.id === requestId);
    if (!req) return null;

    req.reply_message = replyText;
    req.replied_by = repliedByName;
    req.status = 'Resolved';
    req.replied_at = new Date().toISOString();

    this.saveLocal();

    if (isConfigured) {
      try {
        await supabase
          .from('status_update_requests')
          .update({
            reply_message: replyText,
            replied_by: adminId,
            status: 'Resolved',
            replied_at: req.replied_at
          })
          .eq('id', requestId);
      } catch (e) {
        console.warn('Supabase update status request reply notice:', e);
      }
    }

    // In-app notification for institution
    await notificationService.createNotification({
      title: 'Clarification Request Answered',
      message: `Scrutiny Officer replied to your request: "${req.request_subject}"`,
      type: 'info',
      application_id: req.application_id,
      institution_id: req.institution_id
    });

    return req;
  }
}

export const statusRequestService = new StatusRequestService();
