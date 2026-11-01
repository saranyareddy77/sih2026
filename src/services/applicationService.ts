// AICTE SmartVerify — Application Management & Workflow Service
// SIH Problem Statement 26261

import { supabase, isConfigured } from './supabaseClient';
import { 
  Application, 
  ApplicationStatus, 
  ValidationOutcome, 
  ApplicationType, 
  ApplicationDocument, 
  ValidationFinding,
  OfficialReviewComment,
  ApplicationStatusHistory,
  InfrastructureEvidenceItem,
  AuthorityVerificationResult
} from '../types';
import { SYNTHETIC_APPLICATIONS, SYNTHETIC_INSTITUTIONS } from '../data/syntheticDemoData';
import { runApplicationValidation, REQUIRED_DOCUMENTS_BY_TYPE } from './validationService';
import { notificationService } from './notificationService';
import { authorityVerificationService } from './authorityVerificationService';
import { documentService } from './documentService';
import { complaintService } from './complaintService';

const APPLICATIONS_STORAGE_KEY = 'aicte_smartverify_applications_data_v2';

class ApplicationService {
  private applications: Application[] = [];

  constructor() {
    this.loadApplications();
  }

  private loadApplications() {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(APPLICATIONS_STORAGE_KEY);
      if (saved) {
        try {
          this.applications = JSON.parse(saved);
          return;
        } catch (e) {
          console.warn('Failed to parse cached applications:', e);
        }
      }
    }
    // Seed with 10 synthetic applications
    this.applications = JSON.parse(JSON.stringify(SYNTHETIC_APPLICATIONS));
    this.saveLocal();
  }

  private saveLocal() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(this.applications));
    }
  }

  /**
   * Reset data to the fresh 10 synthetic applications
   */
  resetToSyntheticDefaults() {
    this.applications = JSON.parse(JSON.stringify(SYNTHETIC_APPLICATIONS));
    this.saveLocal();
    complaintService.resetToDefaults();
  }

  /**
   * Fetch all applications / complaints, optionally filtered
   * Supports both Approval Applications and Complaint Dockets
   */
  async getApplications(options?: {
    institutionId?: string;
    status?: ApplicationStatus | 'All';
    validationOutcome?: ValidationOutcome | 'All';
    applicationType?: string | 'All';
    searchTerm?: string;
    bureau?: string | 'All';
    category?: string | 'All';
    region?: string | 'All';
    priority?: string | 'All';
    overlapOnly?: boolean;
    overdueOnly?: boolean;
    docketType?: 'approvals' | 'complaints' | 'all';
  }): Promise<Application[]> {
    // If specific complaint options are provided and docketType !== 'approvals', delegate to complaintService
    if ((options?.bureau && options.bureau !== 'All') || 
        (options?.category && options.category !== 'All') || 
        options?.overlapOnly || 
        options?.overdueOnly ||
        options?.docketType === 'complaints') {
      return complaintService.getComplaints({
        institutionId: options?.institutionId,
        status: options?.status,
        searchTerm: options?.searchTerm,
        bureau: options?.bureau,
        category: options?.category,
        region: options?.region,
        priority: options?.priority,
        overlapOnly: options?.overlapOnly,
        overdueOnly: options?.overdueOnly
      });
    }

    // Query Supabase if online
    if (isConfigured) {
      try {
        let query = supabase.from('applications').select('*, documents:application_documents(*)');
        if (options?.institutionId) {
          query = query.eq('institution_id', options.institutionId);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          const dbIds = new Set(data.map(d => d.id));
          const localOnly = this.applications.filter(a => !dbIds.has(a.id));
          this.applications = [...data, ...localOnly];
          this.saveLocal();
        }
      } catch (err) {
        console.warn('Supabase getApplications notice:', err);
      }
    }

    // Filter approval applications
    let results = [...this.applications];

    if (options?.institutionId) {
      results = results.filter(a => 
        a.institution_id === options.institutionId || 
        a.institution?.id === options.institutionId
      );
    }

    if (options?.status && options.status !== 'All') {
      results = results.filter(a => a.status === options.status);
    }

    if (options?.applicationType && options.applicationType !== 'All') {
      results = results.filter(a => a.application_type === options.applicationType);
    }

    if (options?.validationOutcome && options.validationOutcome !== 'All') {
      results = results.filter(a => a.overall_validation_outcome === options.validationOutcome);
    }

    if (options?.searchTerm && options.searchTerm.trim()) {
      const q = options.searchTerm.trim().toLowerCase();
      results = results.filter(a => 
        (a.application_number && a.application_number.toLowerCase().includes(q)) ||
        (a.institution?.name && a.institution.name.toLowerCase().includes(q)) ||
        (a.institution?.code && a.institution.code.toLowerCase().includes(q)) ||
        (a.application_type && a.application_type.toLowerCase().includes(q)) ||
        (a.case_id && a.case_id.toLowerCase().includes(q))
      );
    }

    return results;
  }

  /**
   * Get single application / complaint by ID with full details
   */
  async getApplicationById(id: string): Promise<Application | null> {
    const local = this.applications.find(a => a.id === id || a.application_number === id || a.case_id === id);
    if (local) return local;

    // Check complaint service
    const comp = await complaintService.getComplaintById(id);
    if (comp) return comp;

    if (isConfigured) {
      try {
        const { data, error } = await supabase
          .from('applications')
          .select('*, documents:application_documents(*), findings:validation_findings(*)')
          .eq('id', id)
          .maybeSingle();

        if (!error && data) {
          return data as Application;
        }
      } catch (err) {
        console.warn('Supabase getApplicationById notice:', err);
      }
    }

    return null;
  }

  // --- Complaint Management Operations Delegations ---
  async transferComplaint(complaintId: string, fromBureau: string, toBureau: string, reason: string, actor: string) {
    return complaintService.transferComplaint(complaintId, fromBureau, toBureau, reason, actor);
  }

  async escalateComplaint(complaintId: string, escalatedTo: string, reason: string, actor: string) {
    return complaintService.escalateComplaint(complaintId, escalatedTo, reason, actor);
  }

  async recordDisposal(complaintId: string, decision: any, remarks: string, orderNumber: string, actor: string) {
    return complaintService.recordDisposal(complaintId, decision, remarks, orderNumber, actor);
  }

  async linkRelatedComplaints(id1: string, id2: string, actor: string, remarks: string) {
    return complaintService.linkRelatedComplaints(id1, id2, actor, remarks);
  }

  async reviewOverlap(complaintId: string, decision: any, actor: string, remarks: string) {
    return complaintService.reviewOverlap(complaintId, decision, actor, remarks);
  }

  async assignOfficer(complaintId: string, officerName: string, officerId: string | undefined, actor: string) {
    return complaintService.assignOfficer(complaintId, officerName, officerId, actor);
  }

  async addRemark(complaintId: string, remark: string, actor: string) {
    return complaintService.addRemark(complaintId, remark, actor);
  }

  calculateMetrics(complaintsList?: Application[]) {
    return complaintService.calculateMetrics(complaintsList);
  }

  exportComplaintsAsCSV(complaintsList?: Application[]) {
    return complaintService.exportComplaintsAsCSV(complaintsList);
  }

  /**
   * Create application draft alias
   */
  async createApplicationDraft(
    institutionId: string,
    applicationType: any,
    academicYear: string = '2026-2027',
    userId?: string,
    initialDraftData?: Record<string, any>
  ): Promise<Application> {
    return this.createApplication(institutionId, applicationType, academicYear, userId, initialDraftData);
  }

  /**
   * Create a new application (starts in Draft)
   */
  async createApplication(
    institutionId: string,
    applicationType: ApplicationType,
    academicYear: string = '2026-2027',
    userId?: string,
    initialDraftData?: Record<string, any>
  ): Promise<Application> {
    const institution = SYNTHETIC_INSTITUTIONS.find(i => i.id === institutionId) || {
      id: institutionId,
      name: 'Registered Institution',
      code: '1-REG-NEW',
      institution_type: 'Engineering & Technology',
      address: 'Institutional Area',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110001',
      contact_email: 'institution@example.edu.in',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const appNumber = `AICTE/2026/APP-${randomSuffix}-DRAFT`;
    const appId = `app-${Date.now()}`;

    const newApp: Application = {
      id: appId,
      application_number: appNumber,
      institution_id: institutionId,
      institution,
      created_by: userId,
      application_type: applicationType,
      academic_year: academicYear,
      status: 'Draft',
      overall_validation_outcome: 'Not Checked',
      is_synthetic_demo: false,
      step_progress: 1,
      draft_data: initialDraftData || {
        applicationCategory: applicationType,
        academicYear,
        purposeOfApplication: 'Extension of Approval for existing approved programmes and courses.',
        intakeChangeType: 'None'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      documents: [],
      findings: [],
      comments: [],
      status_history: [
        {
          id: `sh-${Date.now()}`,
          application_id: appId,
          new_status: 'Draft',
          actor_name: 'Institution User',
          reason: `Application initiated in Draft state for ${applicationType} (${academicYear}).`,
          created_at: new Date().toISOString()
        }
      ]
    };

    this.applications = [newApp, ...this.applications];
    this.saveLocal();

    // Persist to Supabase if configured
    if (isConfigured) {
      try {
        await supabase.from('applications').insert({
          id: newApp.id,
          application_number: newApp.application_number,
          institution_id: newApp.institution_id,
          created_by: userId,
          application_type: newApp.application_type,
          academic_year: newApp.academic_year,
          status: 'Draft',
          draft_data: newApp.draft_data,
          step_progress: 1
        });
      } catch (err) {
        console.warn('Supabase createApplication notice:', err);
      }
    }

    await notificationService.notifyDraftSaved(newApp.id, newApp.application_number, institutionId, userId);

    return newApp;
  }

  /**
   * Save Partial Application Draft
   * Permits saving incomplete fields and missing documents at any step without errors.
   */
  async saveDraft(
    applicationId: string, 
    draftData: Record<string, any>, 
    stepProgress: number = 1
  ): Promise<Application> {
    const appIndex = this.applications.findIndex(a => a.id === applicationId);
    if (appIndex === -1) throw new Error(`Application ${applicationId} not found.`);

    const app = this.applications[appIndex];
    app.draft_data = {
      ...(app.draft_data || {}),
      ...draftData
    };
    app.step_progress = stepProgress;
    app.updated_at = new Date().toISOString();

    // Keep draft or validation required status
    if (app.status === 'Ready for Submission') {
      app.status = 'Draft';
    }

    this.applications[appIndex] = app;
    this.saveLocal();

    if (isConfigured) {
      try {
        await supabase
          .from('applications')
          .update({
            draft_data: app.draft_data,
            step_progress: app.step_progress,
            updated_at: app.updated_at
          })
          .eq('id', applicationId);
      } catch (err) {
        console.warn('Supabase saveDraft notice:', err);
      }
    }

    await notificationService.notifyDraftSaved(
      app.id, 
      app.application_number, 
      app.institution_id, 
      app.created_by
    );

    return app;
  }

  /**
   * Delete an un-submitted draft application
   */
  async deleteDraft(applicationId: string): Promise<boolean> {
    const appIndex = this.applications.findIndex(a => a.id === applicationId);
    if (appIndex === -1) return false;

    const app = this.applications[appIndex];
    if (app.status !== 'Draft' && app.status !== 'Validation Required') {
      throw new Error('Only draft applications can be deleted.');
    }

    this.applications = this.applications.filter(a => a.id !== applicationId);
    this.saveLocal();

    if (isConfigured) {
      try {
        await supabase.from('applications').delete().eq('id', applicationId);
      } catch (err) {
        console.warn('Supabase deleteDraft notice:', err);
      }
    }

    return true;
  }

  /**
   * Run Comprehensive Validation on Application
   * Returns findings, outcome, and submission readiness blockers.
   */
  async validateApplication(
    applicationId: string, 
    evaluationDate: string = '2026-04-01'
  ): Promise<{ 
    app: Application; 
    findings: ValidationFinding[]; 
    outcome: ValidationOutcome; 
    canSubmit: boolean; 
    blockerReasons: string[];
    mandatoryMissing: string[];
    expiredDocs: string[];
  }> {
    const appIndex = this.applications.findIndex(a => a.id === applicationId);
    if (appIndex === -1) throw new Error('Application not found');

    const app = this.applications[appIndex];
    const inst = app.institution || SYNTHETIC_INSTITUTIONS[0];

    // Run the 10-factor regulatory engine
    const { findings, overallOutcome } = runApplicationValidation(
      app,
      inst.name,
      inst.code,
      inst.address,
      evaluationDate
    );

    app.findings = findings;
    app.overall_validation_outcome = overallOutcome;

    // Check mandatory document requirements
    const requiredTypes = REQUIRED_DOCUMENTS_BY_TYPE[app.application_type] || REQUIRED_DOCUMENTS_BY_TYPE['Extension of Approval (EoA)'];
    const uploadedTypes = new Set((app.documents || []).filter(d => !d.is_corrupt && d.is_active_version !== false).map(d => d.document_type));
    
    const mandatoryMissing = requiredTypes.filter(rt => !uploadedTypes.has(rt));
    const expiredDocs = (app.documents || [])
      .filter(d => d.extracted_fields?.isExpired)
      .map(d => d.document_type);

    const blockerReasons: string[] = [];
    if (mandatoryMissing.length > 0) {
      blockerReasons.push(`Missing mandatory statutory documents: ${mandatoryMissing.join(', ')}.`);
    }
    if (expiredDocs.length > 0) {
      blockerReasons.push(`Expired statutory certificates detected: ${expiredDocs.join(', ')}.`);
    }
    if ((app.documents || []).some(d => d.is_corrupt)) {
      blockerReasons.push('One or more uploaded document files are corrupt or unreadable.');
    }

    const canSubmit = blockerReasons.length === 0;

    // Update status based on validation
    if (app.status === 'Draft' || app.status === 'Validation Required' || app.status === 'Ready for Submission') {
      app.status = canSubmit ? 'Ready for Submission' : 'Validation Required';
    }

    app.updated_at = new Date().toISOString();
    this.applications[appIndex] = app;
    this.saveLocal();

    return {
      app,
      findings,
      outcome: overallOutcome,
      canSubmit,
      blockerReasons,
      mandatoryMissing,
      expiredDocs
    };
  }

  /**
   * Final Submit Application
   * Validates mandatory criteria, freezes submitted snapshot, assigns final reference,
   * updates status to 'Submitted' -> 'Under Scrutiny', and alerts Scrutiny Officers.
   */
  async finalSubmitApplication(
    applicationId: string, 
    submitterName: string, 
    submitterId?: string,
    declarations?: Record<string, boolean>
  ): Promise<{ success: boolean; application?: Application; error?: string }> {
    const appIndex = this.applications.findIndex(a => a.id === applicationId);
    if (appIndex === -1) return { success: false, error: 'Application not found.' };

    const app = this.applications[appIndex];

    // Prevent duplicate repeated submissions
    if (app.status === 'Submitted' || app.status === 'Under Scrutiny' || app.status === 'Verified') {
      return {
        success: false,
        error: `Application ${app.application_number} has already been submitted on ${app.submission_date ? new Date(app.submission_date).toLocaleString() : 'record'}. Duplicate submission attempts are prevented.`
      };
    }

    // Run validation to enforce regulatory completeness
    const valResult = await this.validateApplication(applicationId);
    if (!valResult.canSubmit) {
      return {
        success: false,
        error: `Application cannot be submitted due to statutory deficiencies:\n${valResult.blockerReasons.join('\n')}`
      };
    }

    const previousStatus = app.status;
    const submissionTime = new Date().toISOString();

    // Assign permanent submission reference if draft
    if (app.application_number.includes('-DRAFT')) {
      app.application_number = app.application_number.replace('-DRAFT', '');
    }

    // Freeze snapshot so subsequent changes do not alter the submitted record
    app.submission_snapshot = {
      submitted_at: submissionTime,
      submitted_by: submitterName,
      submitter_id: submitterId,
      application_number: app.application_number,
      application_type: app.application_type,
      academic_year: app.academic_year,
      institution: app.institution,
      draft_data: JSON.parse(JSON.stringify(app.draft_data || {})),
      documents: JSON.parse(JSON.stringify(app.documents || [])),
      findings: JSON.parse(JSON.stringify(app.findings || [])),
      declarations: declarations || { statutoryNormsCompliant: true, dataAuthenticityAffirmed: true }
    };

    app.submission_date = submissionTime;
    app.status = 'Submitted';

    // Status transition audit log
    app.status_history = [
      ...(app.status_history || []),
      {
        id: `sh-${Date.now()}-1`,
        application_id: app.id,
        previous_status: previousStatus,
        new_status: 'Submitted',
        actor_name: submitterName,
        reason: 'Authorized representative finalized statutory declarations and officially submitted application.',
        created_at: submissionTime
      },
      {
        id: `sh-${Date.now()}-2`,
        application_id: app.id,
        previous_status: 'Submitted',
        new_status: 'Under Scrutiny',
        actor_name: 'AICTE Workflow Gateway',
        reason: 'Application queued for regional officer scrutiny review and document authentication.',
        created_at: new Date(Date.now() + 1000).toISOString()
      }
    ];

    app.status = 'Under Scrutiny';
    app.updated_at = submissionTime;
    this.applications[appIndex] = app;
    this.saveLocal();

    if (isConfigured) {
      try {
        await supabase
          .from('applications')
          .update({
            application_number: app.application_number,
            status: app.status,
            submission_date: app.submission_date,
            submission_snapshot: app.submission_snapshot,
            updated_at: app.updated_at
          })
          .eq('id', applicationId);
      } catch (err) {
        console.warn('Supabase submitApplication notice:', err);
      }
    }

    // Role-specific notifications
    await notificationService.notifyApplicationSubmitted(
      app.id,
      app.application_number,
      app.institution_id,
      app.institution?.name || 'Institution'
    );

    return { success: true, application: app };
  }

  /**
   * Scrutiny Officer: Issue clarification directive to institution
   */
  async requestClarification(
    applicationId: string, 
    queryText: string, 
    officerName: string
  ): Promise<Application> {
    const appIndex = this.applications.findIndex(a => a.id === applicationId);
    if (appIndex === -1) throw new Error('Application not found');

    const app = this.applications[appIndex];
    const previousStatus = app.status;

    app.clarification_request = queryText;
    app.clarification_requested_at = new Date().toISOString();
    app.status = 'Clarification Required';

    app.status_history = [
      ...(app.status_history || []),
      {
        id: `sh-${Date.now()}`,
        application_id: app.id,
        previous_status: previousStatus,
        new_status: 'Clarification Required',
        actor_name: officerName,
        reason: `Scrutiny Officer Directive: ${queryText}`,
        created_at: new Date().toISOString()
      }
    ];

    app.updated_at = new Date().toISOString();
    this.applications[appIndex] = app;
    this.saveLocal();

    await notificationService.notifyClarificationRequested(
      app.id,
      app.application_number,
      app.institution_id,
      queryText
    );

    return app;
  }

  /**
   * Institution User: Submit clarification response & certified evidence
   */
  async submitClarificationResponse(
    applicationId: string, 
    responseText: string, 
    responderName: string
  ): Promise<Application> {
    const appIndex = this.applications.findIndex(a => a.id === applicationId);
    if (appIndex === -1) throw new Error('Application not found');

    const app = this.applications[appIndex];
    const previousStatus = app.status;

    app.clarification_response = responseText;
    app.clarification_responded_at = new Date().toISOString();
    app.status = 'Resubmitted';

    app.status_history = [
      ...(app.status_history || []),
      {
        id: `sh-${Date.now()}`,
        application_id: app.id,
        previous_status: previousStatus,
        new_status: 'Resubmitted',
        actor_name: responderName,
        reason: `Institution response submitted: "${responseText.substring(0, 100)}..."`,
        created_at: new Date().toISOString()
      }
    ];

    app.updated_at = new Date().toISOString();
    this.applications[appIndex] = app;
    this.saveLocal();

    await notificationService.notifyClarificationResponded(
      app.id,
      app.application_number,
      app.institution?.name || 'Institution'
    );

    return app;
  }

  /**
   * Add or replace document on an application
   */
  async addDocumentToApplication(
    applicationId: string, 
    document: ApplicationDocument
  ): Promise<Application | null> {
    const appIndex = this.applications.findIndex(a => a.id === applicationId);
    if (appIndex === -1) return null;

    const app = this.applications[appIndex];
    const existingDocIndex = (app.documents || []).findIndex(d => d.document_type === document.document_type && d.is_active_version !== false);

    if (existingDocIndex >= 0 && app.documents) {
      // Archive old version
      app.documents[existingDocIndex].is_active_version = false;
      document.version = (app.documents[existingDocIndex].version || 1) + 1;
      document.replaced_doc_id = app.documents[existingDocIndex].id;
      app.documents.push(document);
    } else {
      app.documents = [...(app.documents || []), document];
    }

    app.updated_at = new Date().toISOString();
    this.applications[appIndex] = app;
    this.saveLocal();

    return app;
  }

  /**
   * Remove a document from an application
   */
  async removeDocument(applicationId: string, documentId: string): Promise<Application | null> {
    const appIndex = this.applications.findIndex(a => a.id === applicationId);
    if (appIndex === -1) return null;

    const app = this.applications[appIndex];
    app.documents = (app.documents || []).filter(d => d.id !== documentId);
    app.updated_at = new Date().toISOString();
    this.applications[appIndex] = app;
    this.saveLocal();

    return app;
  }

  /**
   * Re-runs the 10-factor validation engine on current data
   */
  async revalidateApplication(
    applicationId: string, 
    actorName: string = 'AICTE SmartVerify Automated Engine',
    evaluationDate: string = '2026-04-01'
  ): Promise<{ app: Application; findings: ValidationFinding[]; overallOutcome: ValidationOutcome }> {
    const res = await this.validateApplication(applicationId, evaluationDate);
    return { app: res.app, findings: res.findings, overallOutcome: res.outcome };
  }

  /**
   * Submit application (from Draft or Resubmission)
   */
  async submitApplication(applicationId: string, actorName: string): Promise<Application> {
    const res = await this.finalSubmitApplication(applicationId, actorName);
    if (!res.success || !res.application) {
      throw new Error(res.error || 'Submission failed');
    }
    return res.application;
  }

  /**
   * Resubmit application after correcting issues
   */
  async resubmitApplication(applicationId: string, actorName: string, correctionNote: string): Promise<Application> {
    const appIndex = this.applications.findIndex(a => a.id === applicationId);
    if (appIndex === -1) throw new Error('Application not found');

    const app = this.applications[appIndex];
    const previousStatus = app.status;

    const inst = app.institution || SYNTHETIC_INSTITUTIONS[0];
    const { findings, overallOutcome } = runApplicationValidation(
      app,
      inst.name,
      inst.code,
      inst.address
    );

    app.findings = findings;
    app.overall_validation_outcome = overallOutcome;
    app.status = 'Resubmitted';

    app.status_history = [
      ...(app.status_history || []),
      {
        id: `sh-${Date.now()}`,
        application_id: app.id,
        previous_status: previousStatus,
        new_status: 'Resubmitted',
        actor_name: actorName,
        reason: `Institution resubmitted with corrections: "${correctionNote}". New automated outcome: ${overallOutcome}.`,
        created_at: new Date().toISOString()
      }
    ];

    app.updated_at = new Date().toISOString();
    this.applications[appIndex] = app;
    this.saveLocal();

    await notificationService.notifyClarificationResponded(
      app.id,
      app.application_number,
      app.institution?.name || 'Institution'
    );

    return app;
  }

  /**
   * Administrator: Record official review comment / decision
   */
  async recordAdminReview(
    applicationId: string,
    authorName: string,
    authorId: string | undefined,
    commentType: 'Official Comment' | 'Correction Request' | 'Final Decision',
    commentText: string,
    decision?: 'Approved' | 'Rejected' | 'Action Required' | 'Needs Further Inspection'
  ): Promise<Application> {
    const appIndex = this.applications.findIndex(a => a.id === applicationId);
    if (appIndex === -1) throw new Error('Application not found');

    const app = this.applications[appIndex];
    const previousStatus = app.status;

    const newComment: OfficialReviewComment = {
      id: `comm-${Date.now()}`,
      application_id: applicationId,
      author_id: authorId,
      author_name: authorName,
      comment_type: commentType,
      decision,
      comment_text: commentText,
      created_at: new Date().toISOString()
    };

    app.comments = [...(app.comments || []), newComment];

    if (commentType === 'Final Decision') {
      if (decision === 'Approved') {
        app.status = 'Review Completed';
      } else if (decision === 'Rejected') {
        app.status = 'Review Completed';
      } else if (decision === 'Action Required') {
        app.status = 'Action Required';
      } else if (decision === 'Needs Further Inspection') {
        app.status = 'Under Review';
      }
    } else if (commentType === 'Correction Request') {
      app.status = 'Action Required';
    } else if (app.status === 'Awaiting Official Review' || app.status === 'Resubmitted' || app.status === 'Submitted') {
      app.status = 'Under Review';
    }

    app.status_history = [
      ...(app.status_history || []),
      {
        id: `sh-${Date.now()}`,
        application_id: applicationId,
        previous_status: previousStatus,
        new_status: app.status,
        actor_name: authorName,
        reason: `${commentType}${decision ? ` (${decision})` : ''}: ${commentText.substring(0, 100)}...`,
        created_at: new Date().toISOString()
      }
    ];

    app.updated_at = new Date().toISOString();
    this.applications[appIndex] = app;
    this.saveLocal();

    await notificationService.notifyStatusChanged(
      app.id,
      app.application_number,
      app.institution_id,
      previousStatus,
      app.status,
      commentText
    );

    return app;
  }

  /**
   * Administrator: Mark finding as reviewed
   */
  async markFindingReviewed(
    applicationId: string,
    findingId: string,
    reviewedByName: string,
    reviewNote: string
  ): Promise<Application> {
    const appIndex = this.applications.findIndex(a => a.id === applicationId);
    if (appIndex === -1) throw new Error('Application not found');

    const app = this.applications[appIndex];
    app.findings = (app.findings || []).map(f => {
      if (f.id === findingId) {
        return {
          ...f,
          is_reviewed: true,
          reviewed_by: reviewedByName,
          review_note: reviewNote,
          updated_at: new Date().toISOString()
        };
      }
      return f;
    });

    app.updated_at = new Date().toISOString();
    this.applications[appIndex] = app;
    this.saveLocal();

    return app;
  }

  /**
   * Queries external issuing authority and persists verification results on application
   */
  async runAuthorityVerification(
    applicationId: string,
    documentType: string,
    actorName: string = 'Scrutiny Officer'
  ): Promise<{ app: Application; result: AuthorityVerificationResult }> {
    const appIndex = this.applications.findIndex(a => a.id === applicationId);
    if (appIndex === -1) throw new Error('Application not found');

    const app = this.applications[appIndex];
    const targetDoc = (app.documents || []).find(d => d.document_type === documentType && d.is_active_version !== false);
    const inst = app.institution || SYNTHETIC_INSTITUTIONS[0];

    const result = await authorityVerificationService.verifyDocumentWithAuthority({
      documentType,
      authorityName: targetDoc?.extracted_fields?.issuingAuthority || 'Competent State Regulatory Directorate',
      documentNumber: targetDoc?.extracted_fields?.documentNumber || 'REF-PENDING',
      institutionCode: inst.code,
      institutionName: inst.name,
      issueDate: targetDoc?.extracted_fields?.issueDate || undefined
    });

    if (!app.authority_verifications) {
      app.authority_verifications = {};
    }
    app.authority_verifications[documentType] = result;

    await this.validateApplication(applicationId);

    return { app: this.applications[appIndex], result };
  }

  /**
   * Rectification Workflow: Upload replacement document for an existing slot
   */
  async uploadReplacementDocument(
    applicationId: string,
    documentType: string,
    file: File,
    actorName: string,
    rectificationNote?: string
  ): Promise<{ app: Application; document: ApplicationDocument }> {
    const appIndex = this.applications.findIndex(a => a.id === applicationId);
    if (appIndex === -1) throw new Error('Application not found');

    const app = this.applications[appIndex];
    const inst = app.institution || SYNTHETIC_INSTITUTIONS[0];
    const previousStatus = app.status;

    const existingDoc = (app.documents || []).find(d => d.document_type === documentType && d.is_active_version !== false);
    const newVersion = existingDoc ? (existingDoc.version || 1) + 1 : 1;

    if (existingDoc) {
      existingDoc.is_active_version = false;
    }

    const uploadRes = await documentService.uploadDocument(
      applicationId,
      documentType,
      file,
      inst.name,
      inst.code,
      newVersion,
      existingDoc?.id
    );

    if (!uploadRes.success || !uploadRes.document) {
      throw new Error(uploadRes.error || 'Failed to process replacement document');
    }

    const newDoc = uploadRes.document;
    app.documents = [...(app.documents || []), newDoc];

    if (app.status === 'Clarification Required') {
      app.status = 'Resubmitted';
    }

    app.status_history = [
      ...(app.status_history || []),
      {
        id: `sh-${Date.now()}`,
        application_id: applicationId,
        previous_status: previousStatus,
        new_status: app.status,
        actor_name: actorName,
        reason: `Uploaded replacement document for "${documentType}" (v${newVersion}). ${rectificationNote ? `Note: ${rectificationNote}` : ''}`,
        created_at: new Date().toISOString()
      }
    ];

    app.updated_at = new Date().toISOString();
    this.applications[appIndex] = app;
    this.saveLocal();

    await this.validateApplication(applicationId);

    return { app: this.applications[appIndex], document: newDoc };
  }

  /**
   * Uploads a document attachment for an application
   */
  async uploadDocument(
    applicationId: string,
    documentType: string,
    file: File,
    actorName: string
  ): Promise<{ app: Application; document: ApplicationDocument }> {
    return this.uploadReplacementDocument(applicationId, documentType, file, actorName);
  }

  /**
   * Allows manual correction of an extracted field on a document with provenance tracking
   */
  async correctDocumentField(
    applicationId: string,
    documentId: string,
    fieldName: string,
    correctedValue: string,
    reviewerName: string
  ): Promise<Application> {
    const appIndex = this.applications.findIndex(a => a.id === applicationId);
    if (appIndex === -1) throw new Error('Application not found');

    const app = this.applications[appIndex];
    const docIndex = (app.documents || []).findIndex(d => d.id === documentId);
    if (docIndex === -1) throw new Error('Document not found');

    const targetDoc = app.documents![docIndex];
    const updatedDoc = documentService.correctDocumentField(targetDoc, fieldName, correctedValue, reviewerName);
    app.documents![docIndex] = updatedDoc;

    app.updated_at = new Date().toISOString();
    this.applications[appIndex] = app;
    this.saveLocal();

    await this.validateApplication(applicationId);

    return this.applications[appIndex];
  }

  /**
   * Adds infrastructure evidence to the application
   */
  async addInfrastructureEvidence(
    applicationId: string,
    evidence: InfrastructureEvidenceItem
  ): Promise<Application> {
    const appIndex = this.applications.findIndex(a => a.id === applicationId);
    if (appIndex === -1) throw new Error('Application not found');

    const app = this.applications[appIndex];
    app.infrastructure_evidence = [...(app.infrastructure_evidence || []), evidence];
    app.updated_at = new Date().toISOString();
    this.applications[appIndex] = app;
    this.saveLocal();

    return app;
  }

  /**
   * Updates reviewer notes and status for an infrastructure evidence item
   */
  async updateInfrastructureEvidenceReview(
    applicationId: string,
    evidenceId: string,
    reviewerStatus: 'Pending' | 'Verified' | 'Deficiency Found',
    reviewerNotes: string
  ): Promise<Application> {
    const appIndex = this.applications.findIndex(a => a.id === applicationId);
    if (appIndex === -1) throw new Error('Application not found');

    const app = this.applications[appIndex];
    if (app.infrastructure_evidence) {
      app.infrastructure_evidence = app.infrastructure_evidence.map(ev => 
        ev.id === evidenceId 
          ? { ...ev, reviewer_status: reviewerStatus, reviewer_notes: reviewerNotes }
          : ev
      );
    }
    app.updated_at = new Date().toISOString();
    this.applications[appIndex] = app;
    this.saveLocal();

    return app;
  }
}

export const applicationService = new ApplicationService();
