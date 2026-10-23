// AICTE SmartVerify — Centralized Institution Complaint Management Service
// SIH Problem Statement: Integrated Institution Complaint Monitoring and Status Dashboard for AICTE

import { 
  Application, 
  ComplaintCase,
  Institution, 
  BureauCell, 
  ComplaintStatus, 
  ComplaintPriority, 
  ComplaintCategory,
  ComplaintTransfer,
  ComplaintEscalation,
  ComplaintDisposal,
  OverlapAlert
} from '../types';
import { overlapDetectionService } from './overlapDetectionService';
import { notificationService } from './notificationService';
import { SYNTHETIC_INSTITUTIONS, SYNTHETIC_APPLICATIONS } from '../data/syntheticDemoData';

const COMPLAINTS_STORAGE_KEY = 'aicte_smartverify_complaints_data';
const INSTITUTIONS_STORAGE_KEY = 'aicte_smartverify_institution_registry_data';

export interface ComplaintFilterOptions {
  searchTerm?: string;
  bureau?: string;
  status?: string;
  category?: string;
  region?: string;
  priority?: string;
  overlapOnly?: boolean;
  overdueOnly?: boolean;
  institutionId?: string;
}

export interface ComplaintDashboardMetrics {
  totalComplaints: number;
  pendingCases: number;
  underProcess: number;
  disposedCases: number;
  transferredCases: number;
  escalatedCases: number;
  overdueCases: number;
  potentialOverlaps: number;
}

class ComplaintService {
  private complaints: Application[] = [];
  private institutions: Institution[] = [];

  constructor() {
    this.init();
  }

  private init() {
    // 1. Load Institutions
    if (typeof localStorage !== 'undefined') {
      const savedInsts = localStorage.getItem(INSTITUTIONS_STORAGE_KEY);
      if (savedInsts) {
        try {
          this.institutions = JSON.parse(savedInsts);
        } catch (e) {
          this.institutions = [...SYNTHETIC_INSTITUTIONS];
        }
      } else {
        this.institutions = [...SYNTHETIC_INSTITUTIONS];
        this.saveInstitutionsLocal();
      }

      // 2. Load Complaints
      const savedComplaints = localStorage.getItem(COMPLAINTS_STORAGE_KEY);
      if (savedComplaints) {
        try {
          this.complaints = JSON.parse(savedComplaints);
        } catch (e) {
          this.complaints = [...SYNTHETIC_APPLICATIONS];
        }
      } else {
        this.complaints = [...SYNTHETIC_APPLICATIONS];
        this.saveComplaintsLocal();
      }
    } else {
      this.institutions = [...SYNTHETIC_INSTITUTIONS];
      this.complaints = [...SYNTHETIC_APPLICATIONS];
    }

    this.recalculateAllOverlapsAndRegistry();
  }

  private saveComplaintsLocal() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(COMPLAINTS_STORAGE_KEY, JSON.stringify(this.complaints));
      // Also mirror to legacy key so old views reading aicte_smartverify_applications_data stay in sync
      localStorage.setItem('aicte_smartverify_applications_data', JSON.stringify(this.complaints));
    }
  }

  private saveInstitutionsLocal() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(INSTITUTIONS_STORAGE_KEY, JSON.stringify(this.institutions));
    }
  }

  /**
   * Recalculates institutional counts, active bureaus, and cross-bureau overlap alerts
   */
  public recalculateAllOverlapsAndRegistry() {
    const today = new Date();

    // 1. Recalculate SLA, Overdue flag and Overlap alert on every complaint
    for (const c of this.complaints) {
      // Overdue calculation
      if (c.expected_disposal_date && c.status !== 'Disposed' && c.status !== 'Closed') {
        const exp = new Date(c.expected_disposal_date);
        const diffMs = exp.getTime() - today.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        c.days_remaining = diffDays;
        c.is_overdue = diffDays < 0;
      } else {
        c.is_overdue = false;
        c.days_remaining = undefined;
      }

      // Overlap detection
      const overlapInfo = overlapDetectionService.getOverlapForComplaint(c, this.complaints);
      if (overlapInfo.hasOverlap) {
        if (!c.overlap_status || c.overlap_status === 'None') {
          c.overlap_status = 'Potential Overlap Detected';
        }
        c.overlap_alert = overlapInfo.alert || undefined;
      } else {
        if (c.overlap_status === 'Potential Overlap Detected') {
          c.overlap_status = 'None';
        }
      }
    }

    // 2. Update Central Institution Registry counts
    for (const inst of this.institutions) {
      const instComplaints = this.complaints.filter(c => 
        c.institution_id === inst.id || 
        (c.institution?.code && inst.code && c.institution.code.replace(/[^a-zA-Z0-9]/g, '') === inst.code.replace(/[^a-zA-Z0-9]/g, ''))
      );

      inst.total_complaints = instComplaints.length;
      inst.pending_complaints = instComplaints.filter(c => c.status === 'Pending' || c.status === 'Received' || c.status === 'Action Required').length;
      inst.disposed_complaints = instComplaints.filter(c => c.status === 'Disposed' || c.status === 'Closed' || c.status === 'Review Completed').length;

      const activeBureaus = Array.from(new Set(
        instComplaints
          .filter(c => c.status !== 'Disposed' && c.status !== 'Closed')
          .map(c => c.bureau || c.receiving_bureau || '')
          .filter(Boolean)
      ));
      inst.active_bureaus = activeBureaus;

      inst.related_complaint_ids = instComplaints.map(c => c.case_id || c.application_number);
      if (instComplaints.length > 0) {
        inst.latest_complaint_date = instComplaints[0].date_received || instComplaints[0].created_at;
      }
    }

    this.saveComplaintsLocal();
    this.saveInstitutionsLocal();
  }

  /**
   * Reset data to the synthetic baseline
   */
  resetToDefaults() {
    this.complaints = [...SYNTHETIC_APPLICATIONS];
    this.institutions = [...SYNTHETIC_INSTITUTIONS];
    this.recalculateAllOverlapsAndRegistry();
  }

  // =========================================================================
  // INSTITUTION REGISTRY METHODS
  // =========================================================================

  getInstitutions(): Institution[] {
    return [...this.institutions];
  }

  getInstitutionById(id: string): Institution | null {
    return this.institutions.find(i => i.id === id) || null;
  }

  getInstitutionByAicteId(code: string): Institution | null {
    const clean = code.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return this.institutions.find(i => i.code.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === clean) || null;
  }

  registerOrUpdateInstitution(data: Partial<Institution>): Institution {
    if (data.code) {
      const existing = this.getInstitutionByAicteId(data.code);
      if (existing) {
        // Update without creating duplicate
        Object.assign(existing, data, { updated_at: new Date().toISOString() });
        this.saveInstitutionsLocal();
        return existing;
      }
    }

    const newInst: Institution = {
      id: data.id || `inst-${Date.now()}`,
      name: data.name || 'Technical Institution',
      code: data.code || `1-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      aishe_code: data.aishe_code,
      institution_type: data.institution_type || 'Engineering & Technology',
      address: data.address || 'Institutional Area',
      city: data.city || 'New Delhi',
      state: data.state || 'Delhi',
      pincode: data.pincode || '110001',
      region: data.region || 'Northern',
      district: data.district || data.city || 'Central',
      contact_email: data.contact_email || 'registrar@institution.edu.in',
      contact_phone: data.contact_phone,
      website: data.website,
      total_complaints: 0,
      pending_complaints: 0,
      disposed_complaints: 0,
      active_bureaus: [],
      related_complaint_ids: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.institutions.push(newInst);
    this.saveInstitutionsLocal();
    return newInst;
  }

  // =========================================================================
  // COMPLAINT RETRIEVAL & FILTERING
  // =========================================================================

  async getComplaints(filters?: ComplaintFilterOptions): Promise<Application[]> {
    this.recalculateAllOverlapsAndRegistry();
    let result = [...this.complaints];

    if (filters?.institutionId) {
      result = result.filter(c => c.institution_id === filters.institutionId);
    }

    if (filters?.bureau && filters.bureau !== 'All') {
      result = result.filter(c => 
        (c.bureau && c.bureau.toLowerCase().includes(filters.bureau!.toLowerCase())) ||
        (c.receiving_bureau && c.receiving_bureau.toLowerCase().includes(filters.bureau!.toLowerCase()))
      );
    }

    if (filters?.status && filters.status !== 'All') {
      result = result.filter(c => c.status === filters.status);
    }

    if (filters?.category && filters.category !== 'All') {
      result = result.filter(c => c.complaint_category === filters.category);
    }

    if (filters?.region && filters.region !== 'All') {
      result = result.filter(c => 
        (c.institution?.region && c.institution.region.toLowerCase().includes(filters.region!.toLowerCase())) ||
        (c.institution?.state && c.institution.state.toLowerCase().includes(filters.region!.toLowerCase()))
      );
    }

    if (filters?.priority && filters.priority !== 'All') {
      result = result.filter(c => c.priority === filters.priority);
    }

    if (filters?.overlapOnly) {
      result = result.filter(c => c.overlap_status === 'Potential Overlap Detected' || c.overlap_status === 'Confirmed Overlap - Coordinated');
    }

    if (filters?.overdueOnly) {
      result = result.filter(c => c.is_overdue === true);
    }

    if (filters?.searchTerm) {
      const term = filters.searchTerm.toLowerCase().trim();
      result = result.filter(c => 
        (c.case_id && c.case_id.toLowerCase().includes(term)) ||
        (c.application_number && c.application_number.toLowerCase().includes(term)) ||
        (c.institution?.name && c.institution.name.toLowerCase().includes(term)) ||
        (c.institution?.code && c.institution.code.toLowerCase().includes(term)) ||
        (c.complaint_category && c.complaint_category.toLowerCase().includes(term)) ||
        (c.complaint_description && c.complaint_description.toLowerCase().includes(term)) ||
        (c.complainant_name && c.complainant_name.toLowerCase().includes(term)) ||
        (c.bureau && c.bureau.toLowerCase().includes(term))
      );
    }

    return result;
  }

  async getComplaintById(id: string): Promise<Application | null> {
    this.recalculateAllOverlapsAndRegistry();
    const found = this.complaints.find(c => c.id === id || c.case_id === id || c.application_number === id);
    if (!found) return null;
    return JSON.parse(JSON.stringify(found));
  }

  // =========================================================================
  // DASHBOARD METRICS CALCULATION
  // =========================================================================

  calculateMetrics(complaintsList?: Application[]): ComplaintDashboardMetrics {
    const list = complaintsList || this.complaints;
    const today = new Date();

    const total = list.length;
    const pending = list.filter(c => c.status === 'Pending' || c.status === 'Received' || c.status === 'Action Required' || c.status === 'Draft').length;
    const underProcess = list.filter(c => c.status === 'Under Process' || c.status === 'Under Review' || c.status === 'Awaiting Information' || c.status === 'Submitted' || c.status === 'Needs Review').length;
    const disposed = list.filter(c => c.status === 'Disposed' || c.status === 'Closed' || c.status === 'Review Completed' || c.status === 'Verification Complete').length;
    const transferred = list.filter(c => c.status === 'Transferred' || (c.transfers && c.transfers.length > 0)).length;
    const escalated = list.filter(c => c.status === 'Escalated' || (c.escalations && c.escalations.length > 0)).length;

    const overdue = list.filter(c => {
      if (c.status === 'Disposed' || c.status === 'Closed') return false;
      if (!c.expected_disposal_date) return false;
      return new Date(c.expected_disposal_date) < today;
    }).length;

    // Distinct institutions with active overlapping cases
    const potentialOverlaps = list.filter(c => c.overlap_status === 'Potential Overlap Detected' || c.overlap_status === 'Confirmed Overlap - Coordinated').length;

    return {
      totalComplaints: total,
      pendingCases: pending,
      underProcess: underProcess,
      disposedCases: disposed,
      transferredCases: transferred,
      escalatedCases: escalated,
      overdueCases: overdue,
      potentialOverlaps: potentialOverlaps
    };
  }

  // =========================================================================
  // COMPLAINT WORKFLOW OPERATIONS
  // =========================================================================

  /**
   * Create a new formal complaint case
   */
  async createComplaint(data: {
    institutionId: string;
    bureau: BureauCell | string;
    complaintCategory: ComplaintCategory | string;
    complaintDescription: string;
    complainantName?: string;
    complainantType?: 'Student' | 'Faculty' | 'Parent' | 'Citizen' | 'Official Anonymous';
    priority?: ComplaintPriority;
    assignedOfficer?: string;
    createdBy?: string;
  }): Promise<Application> {
    const inst = this.institutions.find(i => i.id === data.institutionId) || this.institutions[0];
    const timestamp = Date.now();
    const prefix = data.bureau.includes('PGRC') ? 'PGRC' : (data.bureau.includes('RB') || data.bureau.includes('Regulation')) ? 'RB' : 'AICTE-CMP';
    const caseNumber = `${prefix}-2026-${Math.floor(100 + Math.random() * 900)}`;

    const receivedDate = new Date().toISOString().split('T')[0];
    const expectedDisposal = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const newCase: Application = {
      id: `cmp-${timestamp}`,
      application_number: caseNumber,
      case_id: caseNumber,
      institution_id: inst.id,
      institution: inst,
      created_by: data.createdBy,
      application_type: 'Extension of Approval (EoA)',
      academic_year: '2026-2027',
      status: 'Received',
      overall_validation_outcome: 'Needs Review',
      is_synthetic_demo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),

      bureau: data.bureau,
      receiving_bureau: data.bureau,
      assigned_officer: data.assignedOfficer || 'Desk In-Charge',
      complaint_category: data.complaintCategory,
      complaint_description: data.complaintDescription,
      complainant_name: data.complainantName || 'Concerned Stakeholder',
      complainant_type: data.complainantType || 'Student',
      priority: data.priority || 'Medium',
      date_received: receivedDate,
      expected_disposal_date: expectedDisposal,
      last_action_taken: 'Complaint registered and assigned to desk officer',
      last_action_timestamp: new Date().toISOString(),
      next_action_required: 'Preliminary scrutiny of allegations and supporting materials',
      transfers: [],
      escalations: [],
      related_complaint_ids: [],
      overlap_status: 'None',
      documents: [],
      findings: [],
      comments: [],
      status_history: [
        {
          id: `sh-${timestamp}`,
          application_id: `cmp-${timestamp}`,
          new_status: 'Received',
          actor_name: data.createdBy || 'Registration Desk',
          reason: `Complaint docketed into ${data.bureau}. Initial scrutiny initiated.`,
          created_at: new Date().toISOString()
        }
      ]
    };

    this.complaints.unshift(newCase);
    this.recalculateAllOverlapsAndRegistry();

    // Check if new complaint triggers overlap with existing cases
    const overlap = overlapDetectionService.getOverlapForComplaint(newCase, this.complaints);
    if (overlap.hasOverlap) {
      await notificationService.createNotification({
        title: 'Potential Overlapping Cases — Coordination Required',
        message: `Case ${caseNumber} (${data.bureau}) matches active cases for ${inst.name}. Cross-bureau coordination initiated.`,
        type: 'warning',
        application_id: newCase.id,
        institution_id: inst.id
      });
    }

    return newCase;
  }

  /**
   * Update complaint status
   */
  async updateStatus(
    complaintId: string, 
    newStatus: ComplaintStatus, 
    actorName: string, 
    reason: string
  ): Promise<Application> {
    const idx = this.complaints.findIndex(c => c.id === complaintId);
    if (idx === -1) throw new Error('Complaint not found');

    const complaint = this.complaints[idx];
    const prev = complaint.status;
    complaint.status = newStatus;
    complaint.updated_at = new Date().toISOString();
    complaint.last_action_taken = `Status changed to "${newStatus}"`;
    complaint.last_action_timestamp = new Date().toISOString();

    complaint.status_history = [
      ...(complaint.status_history || []),
      {
        id: `sh-${Date.now()}`,
        application_id: complaint.id,
        previous_status: prev,
        new_status: newStatus,
        actor_name: actorName,
        reason: reason || `Complaint updated to ${newStatus}.`,
        created_at: new Date().toISOString()
      }
    ];

    this.recalculateAllOverlapsAndRegistry();

    await notificationService.createNotification({
      title: `Complaint Status Updated: ${newStatus}`,
      message: `Case ${complaint.case_id || complaint.application_number} status updated to ${newStatus}. Reason: ${reason}`,
      type: 'info',
      application_id: complaint.id,
      institution_id: complaint.institution_id
    });

    return complaint;
  }

  /**
   * Transfer complaint from one Bureau/Cell to another
   */
  async transferComplaint(
    complaintId: string,
    fromBureau: string,
    toBureau: string,
    transferReason: string,
    actorName: string
  ): Promise<Application> {
    const idx = this.complaints.findIndex(c => c.id === complaintId);
    if (idx === -1) throw new Error('Complaint not found');

    const complaint = this.complaints[idx];
    const prevBureau = complaint.bureau || fromBureau;

    const transferRecord: ComplaintTransfer = {
      id: `tr-${Date.now()}`,
      complaint_id: complaint.id,
      from_bureau: prevBureau,
      to_bureau: toBureau,
      transfer_reason: transferReason,
      transferred_by: actorName,
      transferred_at: new Date().toISOString()
    };

    complaint.bureau = toBureau;
    complaint.status = 'Transferred';
    complaint.transfers = [...(complaint.transfers || []), transferRecord];
    complaint.last_action_taken = `Transferred from ${prevBureau} to ${toBureau}`;
    complaint.last_action_timestamp = new Date().toISOString();
    complaint.next_action_required = `Receipt confirmation and case review by ${toBureau}`;
    complaint.updated_at = new Date().toISOString();

    complaint.status_history = [
      ...(complaint.status_history || []),
      {
        id: `sh-${Date.now()}`,
        application_id: complaint.id,
        previous_status: 'Under Process',
        new_status: 'Transferred',
        actor_name: actorName,
        reason: `Inter-Bureau Transfer to ${toBureau}. Reason: ${transferReason}`,
        created_at: new Date().toISOString()
      }
    ];

    this.recalculateAllOverlapsAndRegistry();

    await notificationService.createNotification({
      title: 'Inter-Bureau Case Transfer Alert',
      message: `Case ${complaint.case_id || complaint.application_number} transferred to ${toBureau} by ${actorName}. Reason: ${transferReason}`,
      type: 'warning',
      application_id: complaint.id,
      institution_id: complaint.institution_id
    });

    return complaint;
  }

  /**
   * Escalate complaint to senior authority
   */
  async escalateComplaint(
    complaintId: string,
    escalatedTo: string,
    escalationReason: string,
    actorName: string
  ): Promise<Application> {
    const idx = this.complaints.findIndex(c => c.id === complaintId);
    if (idx === -1) throw new Error('Complaint not found');

    const complaint = this.complaints[idx];
    const escalationRecord: ComplaintEscalation = {
      id: `esc-${Date.now()}`,
      complaint_id: complaint.id,
      escalated_to: escalatedTo,
      escalation_reason: escalationReason,
      escalated_by: actorName,
      escalated_at: new Date().toISOString()
    };

    complaint.status = 'Escalated';
    complaint.priority = 'Urgent';
    complaint.escalations = [...(complaint.escalations || []), escalationRecord];
    complaint.last_action_taken = `Escalated to ${escalatedTo}`;
    complaint.last_action_timestamp = new Date().toISOString();
    complaint.next_action_required = `High-level direction and statutory order by ${escalatedTo}`;
    complaint.updated_at = new Date().toISOString();

    complaint.status_history = [
      ...(complaint.status_history || []),
      {
        id: `sh-${Date.now()}`,
        application_id: complaint.id,
        previous_status: 'Under Process',
        new_status: 'Escalated',
        actor_name: actorName,
        reason: `Escalated to ${escalatedTo}. Reason: ${escalationReason}`,
        created_at: new Date().toISOString()
      }
    ];

    this.recalculateAllOverlapsAndRegistry();

    await notificationService.createNotification({
      title: 'Case Escalated to Senior Authority',
      message: `Case ${complaint.case_id || complaint.application_number} escalated to ${escalatedTo}. Immediate action required.`,
      type: 'error',
      application_id: complaint.id,
      institution_id: complaint.institution_id
    });

    return complaint;
  }

  /**
   * Record formal disposal / closure decision
   */
  async recordDisposal(
    complaintId: string,
    decision: 'Substantiated - Directive Issued' | 'Resolved upon Rectification' | 'Unsubstantiated / Closed' | 'Referred to State Authority',
    remarks: string,
    orderNumber: string,
    actorName: string
  ): Promise<Application> {
    const idx = this.complaints.findIndex(c => c.id === complaintId);
    if (idx === -1) throw new Error('Complaint not found');

    const complaint = this.complaints[idx];
    const disposal: ComplaintDisposal = {
      decision,
      disposal_order_number: orderNumber || `AICTE/DISP/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
      remarks,
      disposed_by: actorName,
      disposed_at: new Date().toISOString()
    };

    complaint.disposal_decision = disposal;
    complaint.status = 'Disposed';
    complaint.last_action_taken = `Disposed: ${decision} (${disposal.disposal_order_number})`;
    complaint.last_action_timestamp = new Date().toISOString();
    complaint.next_action_required = 'None. Matter disposed and archived.';
    complaint.updated_at = new Date().toISOString();

    complaint.status_history = [
      ...(complaint.status_history || []),
      {
        id: `sh-${Date.now()}`,
        application_id: complaint.id,
        previous_status: 'Under Process',
        new_status: 'Disposed',
        actor_name: actorName,
        reason: `Final Disposal: ${decision}. Order: ${disposal.disposal_order_number}. Notes: ${remarks}`,
        created_at: new Date().toISOString()
      }
    ];

    complaint.comments = [
      ...(complaint.comments || []),
      {
        id: `com-${Date.now()}`,
        application_id: complaint.id,
        author_name: actorName,
        comment_type: 'Final Decision',
        decision: 'Approved',
        comment_text: `[FORMAL DISPOSAL ORDER ${disposal.disposal_order_number}]\nDecision: ${decision}\nRemarks: ${remarks}`,
        created_at: new Date().toISOString()
      }
    ];

    this.recalculateAllOverlapsAndRegistry();

    await notificationService.createNotification({
      title: 'Complaint Formally Disposed',
      message: `Case ${complaint.case_id || complaint.application_number} marked Disposed (${decision}). Order No: ${disposal.disposal_order_number}.`,
      type: 'success',
      application_id: complaint.id,
      institution_id: complaint.institution_id
    });

    return complaint;
  }

  /**
   * Link related complaints together (bilateral linkage)
   */
  async linkRelatedComplaints(
    complaintId1: string,
    complaintId2: string,
    actorName: string,
    remarks: string
  ): Promise<{ case1: Application; case2: Application }> {
    const c1 = this.complaints.find(c => c.id === complaintId1 || c.case_id === complaintId1 || c.application_number === complaintId1);
    const c2 = this.complaints.find(c => c.id === complaintId2 || c.case_id === complaintId2 || c.application_number === complaintId2);

    if (!c1 || !c2) throw new Error('One or both complaints could not be located');

    const id1 = c1.case_id || c1.application_number;
    const id2 = c2.case_id || c2.application_number;

    // Add linkage
    c1.related_complaint_ids = Array.from(new Set([...(c1.related_complaint_ids || []), id2]));
    c2.related_complaint_ids = Array.from(new Set([...(c2.related_complaint_ids || []), id1]));

    c1.overlap_status = 'Confirmed Overlap - Coordinated';
    c2.overlap_status = 'Confirmed Overlap - Coordinated';

    const logEntry1 = {
      id: `sh-${Date.now()}-1`,
      application_id: c1.id,
      new_status: c1.status,
      actor_name: actorName,
      reason: `Formally linked to related case ${id2} (${c2.bureau}). Coordination notes: ${remarks}`,
      created_at: new Date().toISOString()
    };

    const logEntry2 = {
      id: `sh-${Date.now()}-2`,
      application_id: c2.id,
      new_status: c2.status,
      actor_name: actorName,
      reason: `Formally linked to related case ${id1} (${c1.bureau}). Coordination notes: ${remarks}`,
      created_at: new Date().toISOString()
    };

    c1.status_history = [...(c1.status_history || []), logEntry1];
    c2.status_history = [...(c2.status_history || []), logEntry2];

    this.recalculateAllOverlapsAndRegistry();

    return { case1: c1, case2: c2 };
  }

  /**
   * Review Overlap decision: Confirmed, Dismissed, or Needs Review
   */
  async reviewOverlap(
    complaintId: string,
    decision: 'Confirmed' | 'Dismissed' | 'Needs Review',
    actorName: string,
    reviewNotes: string
  ): Promise<Application> {
    const idx = this.complaints.findIndex(c => c.id === complaintId);
    if (idx === -1) throw new Error('Complaint not found');

    const complaint = this.complaints[idx];

    if (!complaint.overlap_alert) {
      complaint.overlap_alert = {
        id: `overlap-${complaint.id}`,
        institution_id: complaint.institution_id,
        institution_name: complaint.institution?.name || 'Institution',
        aicte_id: complaint.institution?.code || '',
        complaint_ids: [complaint.case_id || complaint.application_number],
        bureaus_involved: [complaint.bureau || 'Current Bureau'],
        reason: 'Manual Overlap Review',
        match_type: 'exact_aicte_id',
        status: decision,
        created_at: new Date().toISOString()
      };
    }

    complaint.overlap_alert.status = decision;
    complaint.overlap_alert.reviewed_by = actorName;
    complaint.overlap_alert.reviewed_at = new Date().toISOString();
    complaint.overlap_alert.review_notes = reviewNotes;

    if (decision === 'Confirmed') {
      complaint.overlap_status = 'Confirmed Overlap - Coordinated';
    } else if (decision === 'Dismissed') {
      complaint.overlap_status = 'Dismissed Overlap';
    } else {
      complaint.overlap_status = 'Potential Overlap Detected';
    }

    complaint.status_history = [
      ...(complaint.status_history || []),
      {
        id: `sh-${Date.now()}`,
        application_id: complaint.id,
        new_status: complaint.status,
        actor_name: actorName,
        reason: `Cross-Bureau Overlap decision recorded: ${decision}. Remarks: ${reviewNotes}`,
        created_at: new Date().toISOString()
      }
    ];

    this.saveComplaintsLocal();
    return complaint;
  }

  /**
   * Assign or reassign officer to a complaint
   */
  async assignOfficer(
    complaintId: string,
    officerName: string,
    officerId: string | undefined,
    actorName: string
  ): Promise<Application> {
    const idx = this.complaints.findIndex(c => c.id === complaintId);
    if (idx === -1) throw new Error('Complaint not found');

    const complaint = this.complaints[idx];
    complaint.assigned_officer = officerName;
    complaint.assigned_officer_id = officerId;
    complaint.last_action_taken = `Assigned to officer ${officerName}`;
    complaint.last_action_timestamp = new Date().toISOString();
    complaint.updated_at = new Date().toISOString();

    complaint.status_history = [
      ...(complaint.status_history || []),
      {
        id: `sh-${Date.now()}`,
        application_id: complaint.id,
        new_status: complaint.status,
        actor_name: actorName,
        reason: `Desk officer assigned: ${officerName}.`,
        created_at: new Date().toISOString()
      }
    ];

    this.saveComplaintsLocal();
    return complaint;
  }

  /**
   * Add officer remarks to a complaint
   */
  async addRemark(
    complaintId: string,
    remarkText: string,
    actorName: string
  ): Promise<Application> {
    const idx = this.complaints.findIndex(c => c.id === complaintId);
    if (idx === -1) throw new Error('Complaint not found');

    const complaint = this.complaints[idx];
    complaint.comments = [
      ...(complaint.comments || []),
      {
        id: `rem-${Date.now()}`,
        application_id: complaint.id,
        author_name: actorName,
        comment_type: 'Official Comment',
        comment_text: remarkText,
        created_at: new Date().toISOString()
      }
    ];
    complaint.last_action_taken = `Officer remark added by ${actorName}`;
    complaint.last_action_timestamp = new Date().toISOString();
    complaint.updated_at = new Date().toISOString();

    this.saveComplaintsLocal();
    return complaint;
  }

  // =========================================================================
  // REPORTING & ANALYTICS HELPER
  // =========================================================================

  generateReportSummary() {
    this.recalculateAllOverlapsAndRegistry();
    const metrics = this.calculateMetrics();

    // Bureau-wise counts
    const bureauStats: Record<string, { total: number; pending: number; underProcess: number; disposed: number; transferred: number }> = {};
    for (const c of this.complaints) {
      const b = c.bureau || c.receiving_bureau || 'Unspecified Bureau';
      if (!bureauStats[b]) {
        bureauStats[b] = { total: 0, pending: 0, underProcess: 0, disposed: 0, transferred: 0 };
      }
      bureauStats[b].total++;
      if (c.status === 'Pending' || c.status === 'Received') bureauStats[b].pending++;
      else if (c.status === 'Under Process' || c.status === 'Awaiting Information') bureauStats[b].underProcess++;
      else if (c.status === 'Disposed' || c.status === 'Closed') bureauStats[b].disposed++;
      else if (c.status === 'Transferred') bureauStats[b].transferred++;
    }

    // Category-wise counts
    const categoryStats: Record<string, number> = {};
    for (const c of this.complaints) {
      const cat = c.complaint_category || 'Other Grievance';
      categoryStats[cat] = (categoryStats[cat] || 0) + 1;
    }

    // Region-wise counts
    const regionStats: Record<string, number> = {};
    for (const c of this.complaints) {
      const reg = c.institution?.region || 'Central';
      regionStats[reg] = (regionStats[reg] || 0) + 1;
    }

    return {
      metrics,
      bureauStats,
      categoryStats,
      regionStats,
      totalInstitutions: this.institutions.length,
      institutionsWithActiveComplaints: this.institutions.filter(i => (i.pending_complaints || 0) > 0).length
    };
  }

  exportComplaintsAsCSV(complaintsList?: Application[]): string {
    const list = complaintsList || this.complaints;
    const headers = [
      'Case ID',
      'AICTE Permanent ID',
      'Institution Name',
      'Responsible Bureau/Cell',
      'Receiving Bureau',
      'Category',
      'Status',
      'Priority',
      'Assigned Officer',
      'Date Received',
      'Expected Disposal',
      'Overdue',
      'Overlap Status',
      'Last Action Taken'
    ];

    const rows = list.map(c => [
      `"${c.case_id || c.application_number}"`,
      `"${c.institution?.code || ''}"`,
      `"${(c.institution?.name || '').replace(/"/g, '""')}"`,
      `"${c.bureau || ''}"`,
      `"${c.receiving_bureau || ''}"`,
      `"${c.complaint_category || ''}"`,
      `"${c.status}"`,
      `"${c.priority || 'Medium'}"`,
      `"${c.assigned_officer || ''}"`,
      `"${c.date_received || ''}"`,
      `"${c.expected_disposal_date || ''}"`,
      `"${c.is_overdue ? 'YES' : 'NO'}"`,
      `"${c.overlap_status || 'None'}"`,
      `"${(c.last_action_taken || '').replace(/"/g, '""')}"`
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
}

export const complaintService = new ComplaintService();
