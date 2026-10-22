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
import { runApplicationValidation } from './validationService';
import { notificationService } from './notificationService';
import { authorityVerificationService } from './authorityVerificationService';
import { documentService } from './documentService';

const APPLICATIONS_STORAGE_KEY = 'aicte_smartverify_applications_data';

class ApplicationService {
  private applications: Application[] = [];

  constructor() {
    this.loadApplications();
  }

  private loadApplications() {
    const saved = localStorage.getItem(APPLICATIONS_STORAGE_KEY);
    if (saved) {
      try {
        this.applications = JSON.parse(saved);
        return;
      } catch (e) {
        console.warn('Failed to parse cached applications:', e);
      }
    }
    // Seed with 10 synthetic applications
    this.applications = [...SYNTHETIC_APPLICATIONS];
    this.saveLocal();
  }

  private saveLocal() {
    localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(this.applications));
  }

  /**
   * Reset data to the fresh 10 synthetic applications
   */
  resetToSyntheticDefaults() {
    this.applications = [...SYNTHETIC_APPLICATIONS];
    this.saveLocal();
  }

  /**
   * Fetch all applications, optionally filtered
   */
  async getApplications(options?: {
    institutionId?: string;
    status?: ApplicationStatus | 'All';
    validationOutcome?: ValidationOutcome | 'All';
    applicationType?: string | 'All';
    searchTerm?: string;
  }): Promise<Application[]> {
    let result = [...this.applications];

    if (options?.institutionId) {
      result = result.filter(a => a.institution_id === options.institutionId);
    }

    if (options?.status && options.status !== 'All') {
      result = result.filter(a => a.status === options.status);
    }

    if (options?.validationOutcome && options.validationOutcome !== 'All') {
      result = result.filter(a => a.overall_validation_outcome === options.validationOutcome);
    }

    if (options?.applicationType && options.applicationType !== 'All') {
      result = result.filter(a => a.application_type === options.applicationType);
    }

    if (options?.searchTerm) {
      const term = options.searchTerm.toLowerCase().trim();
      result = result.filter(a => 
        a.application_number.toLowerCase().includes(term) ||
        (a.institution?.name && a.institution.name.toLowerCase().includes(term)) ||
        (a.institution?.code && a.institution.code.toLowerCase().includes(term))
      );
    }

    return result;
  }

  /**
   * Get single application by ID with full details
   */
  async getApplicationById(id: string): Promise<Application | null> {
    const app = this.applications.find(a => a.id === id);
    if (!app) return null;
    return JSON.parse(JSON.stringify(app)); // Return clone
  }

  /**
   * Create a new draft application
   */
  async createApplication(
    institutionId: string,
    applicationType: ApplicationType,
    academicYear: string = '2026-2027',
    userId?: string
  ): Promise<Application> {
    const institution = SYNTHETIC_INSTITUTIONS.find(i => i.id === institutionId) || SYNTHETIC_INSTITUTIONS[0];
    const appNumber = `AICTE/2026/APP-${Math.floor(1000 + Math.random() * 9000)}-DRAFT`;

    const newApp: Application = {
      id: `app-${Date.now()}`,
      application_number: appNumber,
      institution_id: institutionId,
      institution,
      created_by: userId,
      application_type: applicationType,
      academic_year: academicYear,
      status: 'Draft',
      overall_validation_outcome: 'Not Checked',
      is_synthetic_demo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      documents: [],
      findings: [],
      comments: [],
      status_history: [
        {
          id: `sh-${Date.now()}`,
          application_id: `app-${Date.now()}`,
          new_status: 'Draft',
          actor_name: 'Institution User',
          reason: 'Application initiated in Draft state.',
          created_at: new Date().toISOString()
        }
      ]
    };

    this.applications = [newApp, ...this.applications];
    this.saveLocal();

    await notificationService.createNotification({
      title: 'Draft Application Created',
      message: `Application ${appNumber} initiated. Please upload mandatory documents.`,
      type: 'info',
      application_id: newApp.id,
      institution_id: institutionId
    });

    return newApp;
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
    const existingDocIndex = (app.documents || []).findIndex(d => d.document_type === document.document_type);

    if (existingDocIndex >= 0 && app.documents) {
      // Replace existing slot
      app.documents[existingDocIndex] = document;
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
    const appIndex = this.applications.findIndex(a => a.id === applicationId);
    if (appIndex === -1) throw new Error('Application not found');

    const app = this.applications[appIndex];
    const previousStatus = app.status;
    const inst = app.institution || SYNTHETIC_INSTITUTIONS[0];

    // Run dynamic rule engine with explicit evaluation date
    const { findings, overallOutcome } = runApplicationValidation(
      app,
      inst.name,
      inst.code,
      inst.address,
      evaluationDate
    );

    app.findings = findings;
    app.overall_validation_outcome = overallOutcome;

    // Determine new status if under preliminary validation or active submission
    if (app.status === 'Draft' || app.status === 'Preliminary Validation' || app.status === 'Action Required') {
      if (overallOutcome === 'Passed') {
        app.status = 'Awaiting Official Review';
      } else if (overallOutcome === 'Failed') {
        app.status = 'Action Required';
      } else {
        app.status = 'Needs Review';
      }
    }

    // Append to status history recording real previous and new state
    app.status_history = [
      ...(app.status_history || []),
      {
        id: `sh-${Date.now()}`,
        application_id: app.id,
        previous_status: previousStatus,
        new_status: app.status,
        actor_name: actorName,
        reason: `Re-ran validation engine against ruleset. Outcome: ${overallOutcome}. Evaluated ${findings.length} checks.`,
        created_at: new Date().toISOString()
      }
    ];

    app.updated_at = new Date().toISOString();
    this.applications[appIndex] = app;
    this.saveLocal();

    await notificationService.createNotification({
      title: 'Validation Completed',
      message: `Validation re-evaluated for ${app.application_number}. Overall outcome: ${overallOutcome}.`,
      type: overallOutcome === 'Passed' ? 'success' : overallOutcome === 'Failed' ? 'error' : 'warning',
      application_id: app.id,
      institution_id: app.institution_id
    });

    return { app, findings, overallOutcome };
  }

  /**
   * Submit application (from Draft or Resubmission)
   */
  async submitApplication(applicationId: string, actorName: string): Promise<Application> {
    const appIndex = this.applications.findIndex(a => a.id === applicationId);
    if (appIndex === -1) throw new Error('Application not found');

    const app = this.applications[appIndex];
    const previousStatus = app.status;

    // Run validation immediately
    const inst = app.institution || SYNTHETIC_INSTITUTIONS[0];
    const { findings, overallOutcome } = runApplicationValidation(
      app,
      inst.name,
      inst.code,
      inst.address
    );

    app.findings = findings;
    app.overall_validation_outcome = overallOutcome;
    app.submission_date = new Date().toISOString();

    if (overallOutcome === 'Passed') {
      app.status = 'Awaiting Official Review';
    } else if (overallOutcome === 'Failed') {
      app.status = 'Action Required';
    } else {
      app.status = 'Needs Review';
    }

    app.status_history = [
      ...(app.status_history || []),
      {
        id: `sh-${Date.now()}-1`,
        application_id: app.id,
        previous_status: previousStatus,
        new_status: 'Submitted',
        actor_name: actorName,
        reason: 'Application submitted by institution representative.',
        created_at: new Date().toISOString()
      },
      {
        id: `sh-${Date.now()}-2`,
        application_id: app.id,
        previous_status: 'Submitted',
        new_status: app.status,
        actor_name: 'AICTE SmartVerify Automated Engine',
        reason: `Automated preliminary validation completed. Outcome: ${overallOutcome}.`,
        created_at: new Date().toISOString()
      }
    ];

    app.updated_at = new Date().toISOString();
    this.applications[appIndex] = app;
    this.saveLocal();

    await notificationService.createNotification({
      title: 'Application Submitted',
      message: `Application ${app.application_number} submitted. Validation outcome: ${overallOutcome}.`,
      type: overallOutcome === 'Passed' ? 'success' : 'action_required',
      application_id: app.id,
      institution_id: app.institution_id
    });

    return app;
  }

  /**
   * Resubmit application after correcting issues
   */
  async resubmitApplication(applicationId: string, actorName: string, correctionNote: string): Promise<Application> {
    const appIndex = this.applications.findIndex(a => a.id === applicationId);
    if (appIndex === -1) throw new Error('Application not found');

    const app = this.applications[appIndex];
    const previousStatus = app.status;

    // Run validation on corrected data
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

    await notificationService.createNotification({
      title: 'Application Resubmitted',
      message: `Corrections submitted for ${app.application_number}. Forwarded to Scrutiny Desk.`,
      type: 'info',
      application_id: app.id
    });

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

    // Status transition based on decision
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
    } else if (app.status === 'Awaiting Official Review' || app.status === 'Resubmitted') {
      app.status = 'Under Review';
    }

    // Add status history
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

    // In-app notification for institution
    await notificationService.createNotification({
      title: commentType === 'Final Decision' ? 'Official Scrutiny Decision' : 'Official Scrutiny Comment Added',
      message: `${authorName} recorded: "${commentText.substring(0, 90)}..."`,
      type: decision === 'Approved' ? 'success' : decision === 'Rejected' || decision === 'Action Required' ? 'warning' : 'info',
      application_id: applicationId,
      institution_id: app.institution_id
    });

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
      issueDate: targetDoc?.extracted_fields?.issueDate
    });

    if (!app.authority_verifications) {
      app.authority_verifications = {};
    }
    app.authority_verifications[documentType] = result;

    // Revalidate application so authority result is reflected in findings
    await this.revalidateApplication(applicationId, `${actorName} (Authority Verification)`);

    return { app: this.applications[appIndex], result };
  }

  /**
   * Rectification Workflow: Upload replacement document for an existing slot
   * Preserves version history (version 2, replaces version 1), updates slot, and triggers revalidation.
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

    // Locate existing document
    const existingDoc = (app.documents || []).find(d => d.document_type === documentType && d.is_active_version !== false);
    const newVersion = existingDoc ? (existingDoc.version || 1) + 1 : 1;

    // Archive previous version if present
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

    // Status transition to 'Resubmitted'
    app.status = 'Resubmitted';

    // Append to status history
    app.status_history = [
      ...(app.status_history || []),
      {
        id: `sh-${Date.now()}`,
        application_id: applicationId,
        previous_status: previousStatus,
        new_status: 'Resubmitted',
        actor_name: actorName,
        reason: `Uploaded replacement document for "${documentType}" (v${newVersion}). ${rectificationNote ? `Note: ${rectificationNote}` : ''}`,
        created_at: new Date().toISOString()
      }
    ];

    app.updated_at = new Date().toISOString();
    this.applications[appIndex] = app;
    this.saveLocal();

    // Re-run validation immediately on replaced document
    await this.revalidateApplication(applicationId, 'AICTE SmartVerify Rectification Engine');

    await notificationService.createNotification({
      title: 'Replacement Document Uploaded',
      message: `New version of "${documentType}" uploaded by ${actorName}. Revalidation completed.`,
      type: 'info',
      application_id: applicationId,
      institution_id: app.institution_id
    });

    return { app: this.applications[appIndex], document: newDoc };
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

    // Re-run validation with updated values
    await this.revalidateApplication(applicationId, `${reviewerName} (Manual Field Correction)`);

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
