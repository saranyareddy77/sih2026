// AICTE SmartVerify — Evidence-First Scrutiny Workbench
// SIH Problem Statement 26261

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  FileText, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Upload, 
  RefreshCw, 
  Send, 
  MessageSquare, 
  Clock, 
  UserCheck, 
  FilePlus, 
  HelpCircle,
  Building,
  Check,
  X,
  Layers,
  Shield,
  BookOpen,
  Edit2,
  Camera,
  MapPin,
  Eye,
  CheckSquare,
  Sparkles,
  ChevronRight,
  AlertCircle,
  Download,
  Info
} from 'lucide-react';
import { regulatoryRuleEngine } from '../services/regulatoryRuleEngine';
import { normalizeText } from '../services/validationService';
import { SYNTHETIC_AUTHORITY_DISCLAIMER } from '../services/authorityVerificationService';
import { 
  Application, 
  ApplicationDocument, 
  ValidationFinding, 
  ValidationOutcome,
  ApplicationStatus,
  InfrastructureEvidenceItem
} from '../types';
import { applicationService } from '../services/applicationService';
import { documentService } from '../services/documentService';
import { statusRequestService } from '../services/statusRequestService';
import { authService } from '../services/authService';
import { DocumentViewer } from '../components/DocumentViewer';
import { ValidationFindingsPanel } from '../components/ValidationFindingsPanel';
import { StatusHistoryTimeline } from '../components/StatusHistoryTimeline';
import { REQUIRED_DOCUMENTS_BY_TYPE } from '../services/validationService';

type DrawerType = 'cross_comparison' | 'authority' | 'infrastructure' | 'rules' | 'audit_history' | 'clarifications' | null;

export const ApplicationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDocument, setSelectedDocument] = useState<ApplicationDocument | null>(null);
  
  // Secondary Inspector Drawer state (keeps the 3-panel workbench permanently visible)
  const [activeDrawer, setActiveDrawer] = useState<DrawerType>(null);

  // Infrastructure evidence state
  const [selectedInfraCategory, setSelectedInfraCategory] = useState<string>('All');
  const [editingInfraId, setEditingInfraId] = useState<string | null>(null);
  const [infraReviewStatus, setInfraReviewStatus] = useState<'Verified' | 'Deficiency Found'>('Verified');
  const [infraReviewNotes, setInfraReviewNotes] = useState<string>('');
  const [isUpdatingInfra, setIsUpdatingInfra] = useState<boolean>(false);

  // Modals & form states
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [selectedUploadDocType, setSelectedUploadDocType] = useState<string>('Land Use Certificate');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Rectification modal state
  const [showRectificationModal, setShowRectificationModal] = useState<boolean>(false);
  const [rectificationDocType, setRectificationDocType] = useState<string>('Fire Safety Certificate');
  const [rectificationFile, setRectificationFile] = useState<File | null>(null);
  const [rectificationNote, setRectificationNote] = useState<string>('');
  const [isRectifying, setIsRectifying] = useState<boolean>(false);
  const [rectificationError, setRectificationError] = useState<string | null>(null);

  // Admin decision state
  const [showAdminDecisionModal, setShowAdminDecisionModal] = useState<boolean>(false);
  const [adminDecisionType, setAdminDecisionType] = useState<'Approved' | 'Rejected' | 'Action Required' | 'Needs Further Inspection'>('Approved');
  const [adminDecisionReason, setAdminDecisionReason] = useState<string>('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState<boolean>(false);

  // Clarification request state
  const [showClarificationModal, setShowClarificationModal] = useState<boolean>(false);
  const [requestSubject, setRequestSubject] = useState<string>('');
  const [requestMessage, setRequestMessage] = useState<string>('');
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});

  const currentUser = authService.getCurrentUser();
  const isAdmin = authService.isAdmin();

  const loadApplication = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await applicationService.getApplicationById(id);
      if (data) {
        setApp(data);
        if (data.documents && data.documents.length > 0 && !selectedDocument) {
          setSelectedDocument(data.documents[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplication();
  }, [id]);

  if (loading) {
    return (
      <div className="app-container" style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
        <RefreshCw size={28} className="spin" style={{ marginBottom: '12px', opacity: 0.7 }} />
        <p style={{ fontSize: '0.9375rem' }}>Loading institutional approval dossier &amp; extracted evidence...</p>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="app-container" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <AlertTriangle size={48} color="#dc2626" style={{ marginBottom: '12px' }} />
        <h2>Application Not Found</h2>
        <p style={{ marginBottom: '16px', color: 'var(--text-muted)' }}>
          The requested application dossier could not be located in the current repository.
        </p>
        <Link to="/" className="btn btn-primary">Return to Command Center</Link>
      </div>
    );
  }

  // Handle Dynamic Validation Recalculation
  const handleRerunValidation = async () => {
    try {
      const result = await applicationService.revalidateApplication(
        app.id,
        currentUser ? `${currentUser.full_name} (${currentUser.roles[0]})` : 'System'
      );
      setApp({ ...result.app });
      alert(`Validation recalculated! Outcome: ${result.overallOutcome}. Evaluated ${result.findings.length} checks.`);
    } catch (e: any) {
      alert(`Error running validation: ${e.message}`);
    }
  };

  // Handle File Upload
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Please select a PDF, JPG, or PNG file.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const { app: updated, document: newDoc } = await applicationService.uploadDocument(
        app.id,
        selectedUploadDocType,
        uploadFile,
        currentUser?.full_name || 'Institution User'
      );
      setApp({ ...updated });
      setSelectedDocument(newDoc);
      setShowUploadModal(false);
      setUploadFile(null);
      alert(`Document uploaded for "${selectedUploadDocType}". Real-time extraction and rule evaluation completed.`);
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Application Submission
  const handleSubmitApplication = async () => {
    if (confirm('Are you sure you want to submit this approval dossier to the AICTE Scrutiny Committee?')) {
      try {
        const updated = await applicationService.submitApplication(
          app.id,
          currentUser?.full_name || 'Institution Representative'
        );
        setApp({ ...updated });
        alert(`Application submitted! Status: ${updated.status}. Outcome: ${updated.overall_validation_outcome}`);
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleResubmitApplication = async () => {
    const note = prompt('Please enter a brief explanation of the corrections made:');
    if (note) {
      try {
        const updated = await applicationService.resubmitApplication(
          app.id,
          currentUser?.full_name || 'Institution Representative',
          note
        );
        setApp({ ...updated });
        alert('Application resubmitted with corrections.');
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  // Handle Admin Decision Recording
  const handleRecordAdminDecision = async () => {
    if (!adminDecisionReason.trim()) {
      alert('A formal scrutiny reason is required before recording a decision.');
      return;
    }

    setIsSubmittingDecision(true);
    try {
      const updated = await applicationService.recordAdminReview(
        app.id,
        currentUser?.full_name || 'Scrutiny Officer',
        currentUser?.id,
        'Final Decision',
        adminDecisionReason,
        adminDecisionType
      );
      setApp({ ...updated });
      setShowAdminDecisionModal(false);
      setAdminDecisionReason('');
      alert(`Scrutiny Decision recorded: ${adminDecisionType}`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  // Handle Field Correction
  const handleFieldCorrection = async (documentId: string, fieldName: string, correctedValue: string) => {
    try {
      const updated = await applicationService.correctDocumentField(
        app.id,
        documentId,
        fieldName,
        correctedValue,
        currentUser?.full_name || 'Authorized Reviewer'
      );
      setApp({ ...updated });
      const updatedDoc = updated.documents?.find(d => d.id === documentId);
      if (updatedDoc) setSelectedDocument(updatedDoc);
      alert(`Field "${fieldName}" updated to "${correctedValue}". Application re-evaluated against regulatory rules.`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handle Trigger Authority Verification
  const handleTriggerAuthority = async (docType: string) => {
    try {
      const { app: updated, result } = await applicationService.runAuthorityVerification(
        app.id,
        docType,
        currentUser?.full_name || 'Scrutiny Officer'
      );
      setApp({ ...updated });
      alert(`Issuing Authority Gateway Query: ${docType} -> Status: ${result.status}`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Open Rectification Modal
  const openRectificationModal = (docType: string) => {
    setRectificationDocType(docType);
    setRectificationFile(null);
    setRectificationNote('');
    setRectificationError(null);
    setShowRectificationModal(true);
  };

  // Handle Rectification Upload
  const handleRectificationUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rectificationFile) {
      setRectificationError('Please select a replacement PDF or image file.');
      return;
    }

    setIsRectifying(true);
    setRectificationError(null);

    try {
      const { app: updated, document: newDoc } = await applicationService.uploadReplacementDocument(
        app.id,
        rectificationDocType,
        rectificationFile,
        currentUser?.full_name || 'Institution User',
        rectificationNote
      );

      setApp({ ...updated });
      setSelectedDocument(newDoc);
      setShowRectificationModal(false);
      setRectificationFile(null);
      setRectificationNote('');
      alert(`Replacement document uploaded for "${rectificationDocType}"! Previous version archived. Re-run validation completed.`);
    } catch (err: any) {
      setRectificationError(err.message || 'Rectification upload failed.');
    } finally {
      setIsRectifying(false);
    }
  };

  // Submit Status Clarification
  const handleSubmitClarification = async () => {
    if (!requestSubject || !requestMessage) {
      alert('Please enter both subject and message.');
      return;
    }

    try {
      await statusRequestService.submitRequest(
        app.id,
        app.institution_id,
        requestSubject,
        requestMessage,
        currentUser?.id
      );
      setShowClarificationModal(false);
      setRequestSubject('');
      setRequestMessage('');
      await loadApplication();
      alert('Clarification request submitted to scrutiny desk.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Infrastructure review update handler
  const handleSaveInfraReview = async (evidenceId: string) => {
    if (!app) return;
    setIsUpdatingInfra(true);
    try {
      const updated = await applicationService.updateInfrastructureEvidenceReview(
        app.id,
        evidenceId,
        infraReviewStatus,
        infraReviewNotes
      );
      setApp({ ...updated });
      setEditingInfraId(null);
      alert('Infrastructure review recorded successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to update review.');
    } finally {
      setIsUpdatingInfra(false);
    }
  };

  const requiredDocList = REQUIRED_DOCUMENTS_BY_TYPE[app.application_type] || REQUIRED_DOCUMENTS_BY_TYPE['Extension of Approval (EoA)'];
  const uploadedCount = (app.documents || []).length;
  const failedFindingsCount = (app.findings || []).filter(f => f.result === 'Failed').length;
  const reviewFindingsCount = (app.findings || []).filter(f => f.result === 'Needs Review').length;

  return (
    <div className="app-container" style={{ paddingBottom: '60px' }}>
      {/* Top Header Breadcrumb & Actions Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <Link 
          to={isAdmin ? '/admin' : '/institution'} 
          className="btn btn-outline btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <ArrowLeft size={14} />
          Back to {isAdmin ? 'Scrutiny Queue' : 'My Applications'}
        </Link>

        {/* Global Action Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            onClick={handleRerunValidation} 
            className="btn btn-outline btn-sm"
            title="Recalculate 10 verification factors on current files"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} />
            Re-run 10-Factor Engine
          </button>

          {!isAdmin && (
            <>
              <button 
                onClick={() => setShowUploadModal(true)} 
                className="btn btn-outline btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Upload size={14} />
                Upload New Document
              </button>

              {app.status === 'Draft' ? (
                <button 
                  onClick={handleSubmitApplication} 
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={14} />
                  Submit Application
                </button>
              ) : app.status === 'Action Required' ? (
                <button 
                  onClick={handleResubmitApplication} 
                  className="btn btn-primary btn-sm"
                  style={{ backgroundColor: '#0284c7', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={14} />
                  Resubmit Corrections
                </button>
              ) : null}

              <button 
                onClick={() => setShowClarificationModal(true)} 
                className="btn btn-outline btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <HelpCircle size={14} />
                Ask Clarification
              </button>
            </>
          )}

          {isAdmin && (
            <button 
              onClick={() => setShowAdminDecisionModal(true)} 
              className="btn btn-primary btn-sm"
              style={{ 
                backgroundColor: '#0f2d59', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px',
                boxShadow: '0 2px 6px rgba(15, 45, 89, 0.25)'
              }}
            >
              <UserCheck size={14} />
              Record Committee Decision
            </button>
          )}
        </div>
      </div>

      {/* Application Dossier Overview Banner */}
      <div className="card" style={{ padding: '18px 22px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                {app.application_number}
              </h1>
              {app.status === 'Review Completed' ? (
                <span className="badge badge-passed">Review Completed</span>
              ) : app.status === 'Action Required' ? (
                <span className="badge badge-failed">Action Required</span>
              ) : app.status === 'Awaiting Official Review' ? (
                <span className="badge badge-info">Awaiting Official Review</span>
              ) : app.status === 'Needs Review' ? (
                <span className="badge badge-needs-review">Needs Review</span>
              ) : (
                <span className="badge badge-draft">{app.status}</span>
              )}
            </div>

            <div style={{ fontSize: '0.9375rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              {app.institution?.name}
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <span>Permanent ID: <code>{app.institution?.code}</code></span>
              <span>Category: <strong>{app.application_type}</strong></span>
              <span>AY: <strong>{app.academic_year}</strong></span>
              <span>Submitted: {app.submission_date ? new Date(app.submission_date).toLocaleDateString() : 'Draft Mode'}</span>
            </div>
          </div>

          {/* Validation Engine Outcome Badge */}
          <div style={{
            backgroundColor: app.overall_validation_outcome === 'Passed' ? '#ecfdf5' : app.overall_validation_outcome === 'Failed' ? '#fef2f2' : '#fffbeb',
            border: `1px solid ${app.overall_validation_outcome === 'Passed' ? '#a7f3d0' : app.overall_validation_outcome === 'Failed' ? '#fecaca' : '#fde68a'}`,
            borderRadius: '8px',
            padding: '10px 16px',
            textAlign: 'right',
            minWidth: '220px'
          }}>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              Automated Check Status
            </div>
            <div style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: app.overall_validation_outcome === 'Passed' ? '#065f46' : app.overall_validation_outcome === 'Failed' ? '#991b1b' : '#92400e',
              marginTop: '2px'
            }}>
              {app.overall_validation_outcome === 'Passed'
                ? 'Automated Checks Passed'
                : app.overall_validation_outcome === 'Failed'
                ? 'Deficiencies Detected'
                : 'Needs Human Scrutiny'}
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {failedFindingsCount} Failed • {reviewFindingsCount} Review • {(app.findings || []).filter(f => f.result === 'Passed').length} Passed
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Workflow Toolbar (Drawers) — Kept persistent above the 3-panel workbench */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '16px', 
        overflowX: 'auto', 
        paddingBottom: '4px',
        alignItems: 'center'
      }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: '4px' }}>
          Inspector Tools:
        </span>

        <button
          onClick={() => setActiveDrawer('cross_comparison')}
          className={`btn btn-sm ${activeDrawer === 'cross_comparison' ? 'btn-primary' : 'btn-outline'}`}
          style={{ fontSize: '0.75rem', padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Layers size={13} />
          Cross-Document Matrix
          {failedFindingsCount > 0 && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#dc2626' }} />}
        </button>

        <button
          onClick={() => setActiveDrawer('authority')}
          className={`btn btn-sm ${activeDrawer === 'authority' ? 'btn-primary' : 'btn-outline'}`}
          style={{ fontSize: '0.75rem', padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Shield size={13} />
          Authority Gateway ({Object.keys(app.authority_verifications || {}).length})
        </button>

        <button
          onClick={() => setActiveDrawer('infrastructure')}
          className={`btn btn-sm ${activeDrawer === 'infrastructure' ? 'btn-primary' : 'btn-outline'}`}
          style={{ fontSize: '0.75rem', padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Camera size={13} />
          Infrastructure Evidence ({app.infrastructure_evidence?.length || 0})
        </button>

        <button
          onClick={() => setActiveDrawer('rules')}
          className={`btn btn-sm ${activeDrawer === 'rules' ? 'btn-primary' : 'btn-outline'}`}
          style={{ fontSize: '0.75rem', padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <BookOpen size={13} />
          Applicable APH Rules
        </button>

        <button
          onClick={() => setActiveDrawer('audit_history')}
          className={`btn btn-sm ${activeDrawer === 'audit_history' ? 'btn-primary' : 'btn-outline'}`}
          style={{ fontSize: '0.75rem', padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Clock size={13} />
          Audit History ({app.status_history?.length || 0})
        </button>

        <button
          onClick={() => setActiveDrawer('clarifications')}
          className={`btn btn-sm ${activeDrawer === 'clarifications' ? 'btn-primary' : 'btn-outline'}`}
          style={{ fontSize: '0.75rem', padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <MessageSquare size={13} />
          Clarifications
        </button>
      </div>

      {/* SIGNATURE 3-PANEL PERSISTENT SCRUTINY WORKBENCH */}
      <div className="workbench-layout">
        {/* PANEL 1: Application Dossier & Document Checklist */}
        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: '720px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
                Required Attachments
              </h3>
              <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                {uploadedCount} of {requiredDocList.length} documents uploaded
              </p>
            </div>
            <span className="badge badge-info" style={{ fontSize: '0.6875rem' }}>
              APH 2026-27
            </span>
          </div>

          {/* Document list */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '2px' }}>
            {requiredDocList.map(reqType => {
              const uploadedDoc = (app.documents || []).find(d => d.document_type === reqType && d.is_active_version !== false);
              const isSelected = selectedDocument?.id === uploadedDoc?.id && uploadedDoc !== undefined;
              const hasDocIssue = uploadedDoc?.is_corrupt || (app.findings || []).some(f => f.document_id === uploadedDoc?.id && f.result === 'Failed');

              return (
                <div
                  key={reqType}
                  onClick={() => uploadedDoc && setSelectedDocument(uploadedDoc)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: isSelected 
                      ? '2px solid var(--color-primary)' 
                      : hasDocIssue 
                      ? '1px solid #fecaca' 
                      : uploadedDoc 
                      ? '1px solid var(--border-subtle)' 
                      : '1px dashed #fca5a5',
                    backgroundColor: isSelected 
                      ? '#eff6ff' 
                      : hasDocIssue 
                      ? '#fff1f2' 
                      : uploadedDoc 
                      ? '#ffffff' 
                      : '#fef2f2',
                    cursor: uploadedDoc ? 'pointer' : 'default',
                    transition: 'all 0.15s ease',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: uploadedDoc ? 'var(--text-primary)' : '#991b1b' }}>
                      {reqType}
                    </div>
                    {uploadedDoc ? (
                      uploadedDoc.is_corrupt ? (
                        <span className="badge badge-failed" style={{ fontSize: '0.625rem' }}>Corrupt</span>
                      ) : hasDocIssue ? (
                        <span className="badge badge-failed" style={{ fontSize: '0.625rem' }}>Deficient</span>
                      ) : (
                        <CheckCircle2 size={14} color="#059669" />
                      )
                    ) : (
                      <span className="badge badge-failed" style={{ fontSize: '0.625rem' }}>Missing</span>
                    )}
                  </div>

                  {uploadedDoc ? (
                    <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                        v{uploadedDoc.version || 1} • {(uploadedDoc.file_size / 1024).toFixed(0)} KB • {uploadedDoc.ocr_status}
                      </span>
                      {!isAdmin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openRectificationModal(reqType);
                          }}
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: '0.625rem', padding: '1px 6px' }}
                          title="Upload replacement / rectification document"
                        >
                          Replace
                        </button>
                      )}
                    </div>
                  ) : (
                    <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'flex-end' }}>
                      {!isAdmin && (
                        <button
                          onClick={() => {
                            setSelectedUploadDocType(reqType);
                            setShowUploadModal(true);
                          }}
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: '0.625rem', padding: '2px 6px', color: '#dc2626', borderColor: '#fca5a5' }}
                        >
                          Upload File
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
            <button 
              onClick={() => setShowUploadModal(true)} 
              className="btn btn-outline btn-sm"
              style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <FilePlus size={14} />
              Upload Extra Attachment
            </button>
          </div>
        </div>

        {/* PANEL 2: Document Canvas & Viewer */}
        <div style={{ height: '720px' }}>
          <DocumentViewer 
            document={selectedDocument}
            onCorrectField={handleFieldCorrection}
            onTriggerAuthorityVerification={handleTriggerAuthority}
            authorityResult={selectedDocument ? app.authority_verifications?.[selectedDocument.document_type] : undefined}
          />
        </div>

        {/* PANEL 3: AI Findings & Regulatory Evidence Panel */}
        <div className="card" style={{ height: '720px', overflow: 'hidden' }}>
          <ValidationFindingsPanel
            applicationId={app.id}
            findings={app.findings || []}
            selectedDocumentId={selectedDocument?.id}
            onFindingUpdated={loadApplication}
          />
        </div>
      </div>

      {/* SLIDE-OVER INSPECTOR DRAWER FOR SECONDARY WORKFLOWS */}
      {activeDrawer && (
        <div className="drawer-overlay" onClick={() => setActiveDrawer(null)}>
          <div className="drawer-panel" onClick={e => e.stopPropagation()}>
            {/* Drawer Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '16px 20px', 
              borderBottom: '1px solid var(--border-subtle)',
              backgroundColor: '#f8fafc'
            }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  {activeDrawer === 'cross_comparison' && 'Cross-Document Entity Comparison Matrix'}
                  {activeDrawer === 'authority' && 'National Regulatory Gateway — Authority Verification'}
                  {activeDrawer === 'infrastructure' && 'Physical Infrastructure & Safety Evidence'}
                  {activeDrawer === 'rules' && 'Applicable AICTE Regulatory Rules (APH 2026-27)'}
                  {activeDrawer === 'audit_history' && 'Application Status Transitions & Audit Trail'}
                  {activeDrawer === 'clarifications' && 'In-App Status Clarification Requests'}
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  {app.application_number} • {app.institution?.name}
                </p>
              </div>

              <button 
                onClick={() => setActiveDrawer(null)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  padding: '6px',
                  borderRadius: '4px',
                  color: 'var(--text-muted)'
                }}
                title="Close drawer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Content Body */}
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              {/* DRAWER 1: Cross-Document Entity Comparison Matrix */}
              {activeDrawer === 'cross_comparison' && (
                <div>
                  <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px 16px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                      Registered Institution Profile Baseline:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '0.8125rem' }}>
                      <div><strong>Legal Title:</strong> <span style={{ color: '#0f172a' }}>{app.institution?.name}</span></div>
                      <div><strong>AICTE Permanent ID:</strong> <code>{app.institution?.code}</code></div>
                      <div><strong>Address:</strong> <span style={{ color: '#0f172a' }}>{app.institution?.address}, {app.institution?.city}</span></div>
                    </div>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table className="table" style={{ fontSize: '0.8125rem' }}>
                      <thead>
                        <tr>
                          <th>Document Slot</th>
                          <th>Extracted Legal Name</th>
                          <th>Extracted Code</th>
                          <th>Certificate Ref No.</th>
                          <th>Validity</th>
                          <th>Issuing Authority</th>
                        </tr>
                      </thead>
                      <tbody>
                        {requiredDocList.map(docType => {
                          const doc = (app.documents || []).find(d => d.document_type === docType && d.is_active_version !== false);
                          if (!doc) {
                            return (
                              <tr key={docType} style={{ backgroundColor: '#fef2f2' }}>
                                <td><strong>{docType}</strong></td>
                                <td colSpan={5} style={{ color: '#dc2626', fontStyle: 'italic' }}>
                                  Missing — Mandatory certificate has not been uploaded.
                                </td>
                              </tr>
                            );
                          }

                          const fields = doc.extracted_fields;
                          const normAppName = normalizeText(app.institution?.name);
                          const normDocName = normalizeText(fields?.institutionName);
                          const isNameMatched = normDocName && normAppName && (normAppName.includes(normDocName) || normDocName.includes(normAppName));
                          const isCodeMatched = fields?.institutionCode && app.institution?.code && fields.institutionCode.trim().toUpperCase() === app.institution.code.trim().toUpperCase();

                          return (
                            <tr key={docType}>
                              <td>
                                <strong>{docType}</strong>
                                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                                  {doc.original_name} (v{doc.version || 1})
                                </div>
                              </td>
                              <td>
                                {fields?.institutionName ? (
                                  <div>
                                    <div>{fields.institutionName}</div>
                                    {isNameMatched ? (
                                      <span className="badge badge-passed" style={{ fontSize: '0.625rem', marginTop: '2px' }}>
                                        <Check size={10} /> Name Matches Profile
                                      </span>
                                    ) : (
                                      <span className="badge badge-needs-review" style={{ fontSize: '0.625rem', marginTop: '2px' }}>
                                        <AlertTriangle size={10} /> Discrepancy Detected
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Not Detected</span>
                                )}
                              </td>
                              <td>
                                {fields?.institutionCode ? (
                                  <div>
                                    <code>{fields.institutionCode}</code>
                                    <div>
                                      {isCodeMatched ? (
                                        <span className="badge badge-passed" style={{ fontSize: '0.625rem', marginTop: '2px' }}>
                                          <Check size={10} /> Code Aligned
                                        </span>
                                      ) : (
                                        <span className="badge badge-needs-review" style={{ fontSize: '0.625rem', marginTop: '2px' }}>
                                          <AlertTriangle size={10} /> Code Mismatch
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Not Detected</span>
                                )}
                              </td>
                              <td>
                                {fields?.documentNumber ? <code>{fields.documentNumber}</code> : <span style={{ color: '#94a3b8' }}>N/A</span>}
                              </td>
                              <td>
                                {fields?.expiryDate ? (
                                  <div>
                                    <div>{fields.expiryDate}</div>
                                    {new Date(fields.expiryDate) < new Date('2026-04-01') ? (
                                      <span className="badge badge-failed" style={{ fontSize: '0.625rem' }}>Expired</span>
                                    ) : (
                                      <span className="badge badge-passed" style={{ fontSize: '0.625rem' }}>Active</span>
                                    )}
                                  </div>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)' }}>Permanent</span>
                                )}
                              </td>
                              <td>
                                <span style={{ fontSize: '0.75rem' }}>{fields?.issuingAuthority || 'Competent Authority'}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* DRAWER 2: Authority Gateway */}
              {activeDrawer === 'authority' && (
                <div>
                  <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '10px 14px', marginBottom: '16px', fontSize: '0.75rem', color: '#92400e' }}>
                    <strong>Regulatory Notice:</strong> {SYNTHETIC_AUTHORITY_DISCLAIMER}
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table className="table" style={{ fontSize: '0.8125rem' }}>
                      <thead>
                        <tr>
                          <th>Document Type</th>
                          <th>Reference Number</th>
                          <th>Issuing Authority</th>
                          <th>Status</th>
                          <th>Registry Response</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {requiredDocList.map(docType => {
                          const doc = (app.documents || []).find(d => d.document_type === docType && d.is_active_version !== false);
                          const auth = app.authority_verifications?.[docType];

                          return (
                            <tr key={docType}>
                              <td><strong>{docType}</strong></td>
                              <td>
                                {doc?.extracted_fields?.documentNumber ? <code>{doc.extracted_fields.documentNumber}</code> : <em>Missing</em>}
                              </td>
                              <td>
                                {doc?.extracted_fields?.issuingAuthority || 'Competent Directorate'}
                              </td>
                              <td>
                                {auth ? (
                                  <span className={`badge ${
                                    auth.status === 'Verified by Source' ? 'badge-passed' :
                                    auth.status === 'Source Unavailable' ? 'badge-needs-review' : 'badge-failed'
                                  }`}>
                                    {auth.status}
                                  </span>
                                ) : (
                                  <span className="badge badge-not-checked">Pending Query</span>
                                )}
                              </td>
                              <td style={{ maxWidth: '280px' }}>
                                {auth ? (
                                  <div style={{ fontSize: '0.75rem', color: '#334155' }}>
                                    {auth.responseSummary}
                                  </div>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                    No lookup dispatched yet.
                                  </span>
                                )}
                              </td>
                              <td>
                                {doc && (
                                  <button
                                    onClick={() => handleTriggerAuthority(docType)}
                                    className="btn btn-outline btn-sm"
                                    style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                                  >
                                    <Shield size={12} /> {auth ? 'Re-Query' : 'Query'}
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* DRAWER 3: Infrastructure Evidence */}
              {activeDrawer === 'infrastructure' && (
                <div>
                  <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '6px', padding: '12px', marginBottom: '16px', fontSize: '0.75rem', color: '#92400e' }}>
                    <strong>AUTOMATED INFRASTRUCTURE TRIAGE:</strong> Triage checks clarity, EXIF timestamps, and GPS coordinates against survey records. Physical EVC inspection remains mandatory for final statutory compliance.
                  </div>

                  <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
                    {['All', 'Land', 'Building', 'Laboratory', 'Safety', 'Barrier-Free Access'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedInfraCategory(cat)}
                        className={`btn btn-sm ${selectedInfraCategory === cat ? 'btn-primary' : 'btn-outline'}`}
                        style={{ fontSize: '0.75rem', padding: '3px 10px' }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {(!app.infrastructure_evidence || app.infrastructure_evidence.length === 0) ? (
                    <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      <Camera size={32} style={{ opacity: 0.5, marginBottom: '8px' }} />
                      <p>No geotagged photographs on file.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                      {(app.infrastructure_evidence || [])
                        .filter(ev => selectedInfraCategory === 'All' || ev.category === selectedInfraCategory)
                        .map(ev => {
                          const isEditing = editingInfraId === ev.id;
                          return (
                            <div key={ev.id} style={{ border: '1px solid var(--border-subtle)', borderRadius: '6px', overflow: 'hidden' }}>
                              <div style={{ height: '160px', backgroundColor: '#0f172a' }}>
                                <img src={ev.file_url} alt={ev.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                              </div>
                              <div style={{ padding: '10px' }}>
                                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{ev.title}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0' }}>{ev.description}</div>
                                {ev.coordinates && (
                                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                                    GPS: {ev.coordinates.latitude.toFixed(4)}° N, {ev.coordinates.longitude.toFixed(4)}° E
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}

              {/* DRAWER 4: Regulatory Rules (APH) */}
              {activeDrawer === 'rules' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {regulatoryRuleEngine.getRulesForApplicationType(app.application_type).map(rule => (
                    <div key={rule.ruleId} style={{ border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '12px 14px', backgroundColor: '#ffffff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span className="badge badge-info" style={{ fontSize: '0.6875rem' }}>{rule.ruleId} v{rule.version}</span>
                        <span className={`badge ${rule.severity === 'High' ? 'badge-failed' : 'badge-needs-review'}`} style={{ fontSize: '0.625rem' }}>
                          {rule.severity} Severity
                        </span>
                      </div>
                      <h4 style={{ margin: '4px 0', fontSize: '0.875rem', fontWeight: 600 }}>{rule.name}</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '4px 0 8px 0' }}>{rule.description}</p>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Citation: <strong>{rule.aphReference}</strong></div>
                    </div>
                  ))}
                </div>
              )}

              {/* DRAWER 5: Status History & Audit */}
              {activeDrawer === 'audit_history' && (
                <div>
                  <StatusHistoryTimeline history={app.status_history || []} />
                </div>
              )}

              {/* DRAWER 6: Clarifications & Notes */}
              {activeDrawer === 'clarifications' && (
                <div>
                  <StatusClarificationSection
                    applicationId={app.id}
                    isAdmin={isAdmin}
                    onUpdate={loadApplication}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Upload Statutory Document Attachment</h3>
              <button 
                onClick={() => setShowUploadModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem' }}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleFileUpload}>
              <div className="modal-body">
                {uploadError && (
                  <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '10px', borderRadius: '4px', color: '#991b1b', marginBottom: '14px', fontSize: '0.8125rem' }}>
                    {uploadError}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Regulatory Document Category:</label>
                  <select
                    className="form-select"
                    value={selectedUploadDocType}
                    onChange={e => setSelectedUploadDocType(e.target.value)}
                  >
                    {requiredDocList.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Select File (PDF, JPG, PNG under 15MB):</label>
                  <input
                    type="file"
                    className="form-input"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={e => setUploadFile(e.target.files ? e.target.files[0] : null)}
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                    Files will be analyzed by PDF.js text extractor and evaluated against 10 regulatory factors. SHA-256 checksum is computed.
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  onClick={() => setShowUploadModal(false)} 
                  className="btn btn-outline"
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isUploading || !uploadFile}
                >
                  {isUploading ? 'Uploading & Analyzing...' : 'Upload Attachment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Scrutiny Decision Modal */}
      {showAdminDecisionModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Record Official Scrutiny Decision</h3>
              <button 
                onClick={() => setShowAdminDecisionModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem' }}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Regulatory Decision Outcome:</label>
                <select
                  className="form-select"
                  value={adminDecisionType}
                  onChange={e => setAdminDecisionType(e.target.value as any)}
                >
                  <option value="Approved">Approved (Grant Approval)</option>
                  <option value="Action Required">Action Required (Flag Deficiency for Rectification)</option>
                  <option value="Needs Further Inspection">Needs Further Inspection (Schedule Physical EVC)</option>
                  <option value="Rejected">Rejected (Disapprove with Cause)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Scrutiny Reason &amp; Official Grounds (Mandatory):</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={adminDecisionReason}
                  onChange={e => setAdminDecisionReason(e.target.value)}
                  placeholder="State the regulatory justification, applicable APH clauses, or deficiency explanations..."
                />
              </div>

              <div style={{ backgroundColor: '#eff6ff', padding: '10px', borderRadius: '4px', fontSize: '0.75rem', color: '#1e40af' }}>
                <strong>Audit Notice:</strong> This action changes application status to <em>{adminDecisionType === 'Approved' ? 'Review Completed' : adminDecisionType === 'Action Required' ? 'Action Required' : 'Under Review'}</em>, records your credentials in the immutable audit trail, and notifies the institution.
              </div>
            </div>
            <div className="modal-footer">
              <button 
                onClick={() => setShowAdminDecisionModal(false)} 
                className="btn btn-outline"
                disabled={isSubmittingDecision}
              >
                Cancel
              </button>
              <button 
                onClick={handleRecordAdminDecision} 
                className="btn btn-primary"
                disabled={isSubmittingDecision || !adminDecisionReason.trim()}
              >
                {isSubmittingDecision ? 'Recording Decision...' : 'Record Decision'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rectification / Document Replacement Modal */}
      {showRectificationModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Upload Replacement / Rectification Document</h3>
              <button 
                onClick={() => setShowRectificationModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem' }}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleRectificationUpload}>
              <div className="modal-body">
                {rectificationError && (
                  <div style={{ padding: '10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', color: '#991b1b', marginBottom: '14px', fontSize: '0.8125rem' }}>
                    {rectificationError}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Statutory Document Category:</label>
                  <input
                    type="text"
                    className="form-input"
                    value={rectificationDocType}
                    disabled
                    style={{ backgroundColor: '#f8fafc', fontWeight: 600 }}
                  />
                  <small style={{ color: 'var(--text-muted)' }}>
                    Uploading a new file preserves the existing version in history and archives it.
                  </small>
                </div>

                <div className="form-group">
                  <label className="form-label">Replacement File (PDF, JPG, PNG — max 15MB):</label>
                  <input
                    type="file"
                    className="form-input"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setRectificationFile(e.target.files[0]);
                      }
                    }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Rectification Note / Officer Reference (Optional):</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    value={rectificationNote}
                    onChange={e => setRectificationNote(e.target.value)}
                    placeholder="e.g. Uploaded renewed Fire Safety NOC valid through 2027 as requested by scrutiny officer..."
                  />
                </div>

                <div style={{ backgroundColor: '#eff6ff', padding: '10px', borderRadius: '4px', fontSize: '0.75rem', color: '#1e40af' }}>
                  <strong>Rectification Workflow:</strong> Uploading will advance the version to v2, recalculate all 10 verification factors on the new bytes, set application status to <em>Resubmitted</em>, and notify the scrutiny desk.
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button"
                  onClick={() => setShowRectificationModal(false)} 
                  className="btn btn-outline"
                  disabled={isRectifying}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isRectifying || !rectificationFile}
                >
                  {isRectifying ? 'Validating & Replacing...' : 'Upload & Re-run Validation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clarification Request Modal */}
      {showClarificationModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Submit Status Clarification Request</h3>
              <button 
                onClick={() => setShowClarificationModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem' }}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Subject / Query Title:</label>
                <input
                  type="text"
                  className="form-input"
                  value={requestSubject}
                  onChange={e => setRequestSubject(e.target.value)}
                  placeholder="e.g. Clarification regarding Fire Safety Certificate renewal timeline"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Message Details:</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={requestMessage}
                  onChange={e => setRequestMessage(e.target.value)}
                  placeholder="Describe your inquiry or contextual explanation for the scrutiny committee..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                onClick={() => setShowClarificationModal(false)} 
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmitClarification} 
                className="btn btn-primary"
                disabled={!requestSubject || !requestMessage}
              >
                Send Request to Officer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Subcomponent for Clarification requests
const StatusClarificationSection: React.FC<{
  applicationId: string;
  isAdmin: boolean;
  onUpdate: () => void;
}> = ({ applicationId, isAdmin, onUpdate }) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [replies, setReplies] = useState<Record<string, string>>({});

  useEffect(() => {
    statusRequestService.getRequests(applicationId).then(setRequests);
  }, [applicationId]);

  const handleSendReply = async (reqId: string) => {
    const text = replies[reqId];
    if (!text || !text.trim()) return;

    await statusRequestService.replyToRequest(
      reqId,
      text,
      authService.getCurrentUser()?.full_name || 'Scrutiny Officer'
    );
    const updated = await statusRequestService.getRequests(applicationId);
    setRequests(updated);
    setReplies({ ...replies, [reqId]: '' });
    onUpdate();
  };

  if (requests.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
        <MessageSquare size={36} style={{ opacity: 0.5, marginBottom: '8px' }} />
        <p>No status clarification requests found for this application.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {requests.map(req => (
        <div 
          key={req.id}
          style={{
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '14px',
            backgroundColor: '#ffffff'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, margin: 0 }}>{req.request_subject}</h4>
            <span className={`badge ${req.status === 'Resolved' ? 'badge-passed' : 'badge-needs-review'}`} style={{ fontSize: '0.6875rem' }}>
              {req.status}
            </span>
          </div>

          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            {req.request_message}
          </p>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
            Requested on {new Date(req.created_at).toLocaleString()}
          </span>

          {/* Official Reply Box */}
          {req.reply_message ? (
            <div style={{
              marginTop: '10px',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '4px',
              padding: '10px'
            }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#1e40af', marginBottom: '2px' }}>
                Official Scrutiny Reply ({req.replied_by}):
              </div>
              <p style={{ fontSize: '0.8125rem', color: '#1e3a8a', margin: 0 }}>
                {req.reply_message}
              </p>
              <div style={{ fontSize: '0.625rem', color: '#60a5fa', marginTop: '4px' }}>
                Replied on {new Date(req.replied_at).toLocaleString()}
              </div>
            </div>
          ) : isAdmin ? (
            <div style={{ marginTop: '10px', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
              <label style={{ fontSize: '0.6875rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Official Scrutiny Desk Reply:
              </label>
              <textarea
                className="form-textarea"
                rows={2}
                value={replies[req.id] || ''}
                onChange={e => setReplies({ ...replies, [req.id]: e.target.value })}
                placeholder="Enter official committee reply..."
                style={{ fontSize: '0.75rem' }}
              />
              <button
                onClick={() => handleSendReply(req.id)}
                className="btn btn-primary btn-sm"
                style={{ marginTop: '6px', fontSize: '0.6875rem' }}
                disabled={!replies[req.id]}
              >
                Send Reply
              </button>
            </div>
          ) : (
            <div style={{ marginTop: '6px', fontSize: '0.6875rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Awaiting officer reply from AICTE scrutiny desk.
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
