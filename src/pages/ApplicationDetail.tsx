// AICTE SmartVerify — Application Dossier Inspection, Verification & Scrutiny
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
  CheckSquare
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

export const ApplicationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDocument, setSelectedDocument] = useState<ApplicationDocument | null>(null);
  const [activeTab, setActiveTab] = useState<'verification' | 'cross_comparison' | 'authority' | 'rules' | 'infrastructure' | 'history' | 'comments' | 'requests'>('verification');

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
      <div className="app-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <p>Loading application dossier...</p>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="app-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2>Application Not Found</h2>
        <p style={{ marginBottom: '16px', color: 'var(--text-muted)' }}>The requested application record could not be loaded.</p>
        <Link to="/" className="btn btn-primary">Return to Dashboard</Link>
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
      const result = await documentService.uploadDocument(
        app.id,
        selectedUploadDocType,
        uploadFile,
        app.institution?.name || 'Institution',
        app.institution?.code || '1-INST'
      );

      if (!result.success || !result.document) {
        setUploadError(result.error || 'Failed to upload document.');
        setIsUploading(false);
        return;
      }

      // Add to application and dynamically revalidate!
      const updatedApp = await applicationService.addDocumentToApplication(app.id, result.document);
      if (updatedApp) {
        const revalidated = await applicationService.revalidateApplication(
          app.id,
          `${currentUser?.full_name || 'Institution User'} (Document Re-upload)`
        );
        setApp({ ...revalidated.app });
        setSelectedDocument(result.document);
      }

      setShowUploadModal(false);
      setUploadFile(null);
    } catch (err: any) {
      setUploadError(err.message || 'Upload error');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Application Submission / Resubmission
  const handleSubmitApplication = async () => {
    if (confirm('Are you sure you want to submit this application for official AICTE scrutiny?')) {
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

  // Admin reply to clarification
  const handleReplyToRequest = async (requestId: string) => {
    const replyText = replyTextMap[requestId];
    if (!replyText || !replyText.trim()) {
      alert('Please enter a reply message.');
      return;
    }

    try {
      await statusRequestService.replyToRequest(
        requestId,
        replyText,
        currentUser?.full_name || 'Scrutiny Officer',
        currentUser?.id
      );
      await loadApplication();
      alert('Reply sent to institution.');
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
  const uploadedTypes = (app.documents || []).map(d => d.document_type);

  return (
    <div className="app-container">
      {/* Top Breadcrumb & Action Strip */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <Link 
          to={isAdmin ? '/admin' : '/institution'} 
          className="btn btn-outline btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <ArrowLeft size={14} />
          Back to {isAdmin ? 'Scrutiny Queue' : 'My Applications'}
        </Link>

        {/* Global Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            onClick={handleRerunValidation} 
            className="btn btn-outline btn-sm"
            title="Recalculate 10 verification factors on current files"
          >
            <RefreshCw size={14} />
            Re-run Validation Engine
          </button>

          {!isAdmin && (
            <>
              <button 
                onClick={() => setShowUploadModal(true)} 
                className="btn btn-outline btn-sm"
              >
                <Upload size={14} />
                Upload / Replace Document
              </button>

              {app.status === 'Draft' ? (
                <button 
                  onClick={handleSubmitApplication} 
                  className="btn btn-primary btn-sm"
                >
                  <Send size={14} />
                  Submit Application
                </button>
              ) : app.status === 'Action Required' ? (
                <button 
                  onClick={handleResubmitApplication} 
                  className="btn btn-primary btn-sm"
                  style={{ backgroundColor: '#0284c7' }}
                >
                  <Send size={14} />
                  Resubmit Corrections
                </button>
              ) : null}

              <button 
                onClick={() => setShowClarificationModal(true)} 
                className="btn btn-outline btn-sm"
              >
                <HelpCircle size={14} />
                Request Status Clarification
              </button>
            </>
          )}

          {isAdmin && (
            <button 
              onClick={() => setShowAdminDecisionModal(true)} 
              className="btn btn-primary btn-sm"
              style={{ backgroundColor: '#1e3a8a' }}
            >
              <UserCheck size={14} />
              Record Scrutiny Decision
            </button>
          )}
        </div>
      </div>

      {/* Application Overview Header Card */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{app.application_number}</h1>
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

            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <strong>{app.institution?.name}</strong> • AICTE Permanent Institute ID: <code>{app.institution?.code}</code>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Type: <strong>{app.application_type}</strong> | Academic Year: <strong>{app.academic_year}</strong> | Submitted: {app.submission_date ? new Date(app.submission_date).toLocaleString() : 'Not Yet Submitted'}
            </div>
          </div>

          {/* Validation Summary Chip */}
          <div style={{
            backgroundColor: app.overall_validation_outcome === 'Passed' ? '#ecfdf5' : app.overall_validation_outcome === 'Failed' ? '#fef2f2' : '#fffbeb',
            border: `1px solid ${app.overall_validation_outcome === 'Passed' ? '#a7f3d0' : app.overall_validation_outcome === 'Failed' ? '#fecaca' : '#fde68a'}`,
            borderRadius: '6px',
            padding: '10px 16px',
            textAlign: 'right'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Automated Check Outcome
            </div>
            <div style={{
              fontSize: '1.125rem',
              fontWeight: 700,
              color: app.overall_validation_outcome === 'Passed' ? '#065f46' : app.overall_validation_outcome === 'Failed' ? '#991b1b' : '#92400e'
            }}>
              {app.overall_validation_outcome === 'Passed'
                ? 'Automated Checks Passed'
                : app.overall_validation_outcome === 'Failed'
                ? 'Action Required (Failed Checks)'
                : 'Needs Human Scrutiny'}
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
              {(app.findings || []).filter(f => f.result === 'Failed').length} Failed • {(app.findings || []).filter(f => f.result === 'Needs Review').length} Review • {(app.findings || []).filter(f => f.result === 'Passed').length} Passed
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '16px' }}>
        <button
          onClick={() => setActiveTab('verification')}
          className={`btn ${activeTab === 'verification' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderRadius: '4px 4px 0 0', borderBottom: 'none', padding: '8px 14px', fontSize: '0.8125rem' }}
        >
          <FileText size={14} />
          Verification Split-Workbench
        </button>

        <button
          onClick={() => setActiveTab('cross_comparison')}
          className={`btn ${activeTab === 'cross_comparison' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderRadius: '4px 4px 0 0', borderBottom: 'none', padding: '8px 14px', fontSize: '0.8125rem' }}
        >
          <Layers size={14} />
          Cross-Document Comparison
        </button>

        <button
          onClick={() => setActiveTab('authority')}
          className={`btn ${activeTab === 'authority' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderRadius: '4px 4px 0 0', borderBottom: 'none', padding: '8px 14px', fontSize: '0.8125rem' }}
        >
          <Shield size={14} />
          Authority Gateway ({Object.keys(app.authority_verifications || {}).length})
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`btn ${activeTab === 'rules' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderRadius: '4px 4px 0 0', borderBottom: 'none', padding: '8px 14px', fontSize: '0.8125rem' }}
        >
          <BookOpen size={14} />
          Applicable APH Rules
        </button>

        <button
          onClick={() => setActiveTab('infrastructure')}
          className={`btn ${activeTab === 'infrastructure' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderRadius: '4px 4px 0 0', borderBottom: 'none', padding: '8px 14px', fontSize: '0.8125rem' }}
        >
          <Camera size={14} />
          Infrastructure Evidence ({app.infrastructure_evidence?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderRadius: '4px 4px 0 0', borderBottom: 'none', padding: '8px 14px', fontSize: '0.8125rem' }}
        >
          <Clock size={14} />
          History &amp; Audit ({app.status_history?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('comments')}
          className={`btn ${activeTab === 'comments' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderRadius: '4px 4px 0 0', borderBottom: 'none', padding: '8px 14px', fontSize: '0.8125rem' }}
        >
          <UserCheck size={14} />
          Comments &amp; Decisions ({app.comments?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`btn ${activeTab === 'requests' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderRadius: '4px 4px 0 0', borderBottom: 'none', padding: '8px 14px', fontSize: '0.8125rem' }}
        >
          <MessageSquare size={14} />
          Clarifications
        </button>
      </div>

      {/* TAB 1: Documents & Verification Split-View */}
      {activeTab === 'verification' && (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 1fr', gap: '16px', alignItems: 'start' }}>
          {/* Column 1: Document Checklist & Attachments */}
          <div className="card" style={{ padding: '14px' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Required Attachments
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {requiredDocList.map(reqType => {
                const uploadedDoc = (app.documents || []).find(d => d.document_type === reqType);
                const isSelected = selectedDocument?.id === uploadedDoc?.id && uploadedDoc !== undefined;

                return (
                  <div
                    key={reqType}
                    onClick={() => uploadedDoc && setSelectedDocument(uploadedDoc)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '4px',
                      border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                      backgroundColor: isSelected ? '#eff6ff' : uploadedDoc ? '#ffffff' : '#fef2f2',
                      cursor: uploadedDoc ? 'pointer' : 'default',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: uploadedDoc ? 'var(--text-primary)' : '#991b1b' }}>
                        {reqType}
                      </span>
                      {uploadedDoc ? (
                        uploadedDoc.is_corrupt ? (
                          <span className="badge badge-failed" style={{ fontSize: '0.625rem' }}>Corrupt</span>
                        ) : (
                          <CheckCircle2 size={14} color="#059669" />
                        )
                      ) : (
                        <span className="badge badge-failed" style={{ fontSize: '0.625rem' }}>Missing</span>
                      )}
                    </div>

                    {uploadedDoc && (
                      <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                          {(uploadedDoc.file_size / 1024).toFixed(0)} KB • {uploadedDoc.ocr_status}
                        </span>
                        {!isAdmin && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openRectificationModal(reqType);
                            }}
                            className="btn btn-outline btn-sm"
                            style={{ fontSize: '0.625rem', padding: '1px 5px' }}
                            title="Upload replacement / rectification document"
                          >
                            Replace / Rectify
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
              <button 
                onClick={() => setShowUploadModal(true)} 
                className="btn btn-outline btn-sm"
                style={{ width: '100%' }}
              >
                <FilePlus size={14} />
                Upload New File
              </button>
            </div>
          </div>

          {/* Column 2: Document Viewer */}
          <div>
            <DocumentViewer 
              document={selectedDocument}
              onCorrectField={handleFieldCorrection}
              onTriggerAuthorityVerification={handleTriggerAuthority}
              authorityResult={selectedDocument ? app.authority_verifications?.[selectedDocument.document_type] : undefined}
            />
          </div>

          {/* Column 3: Validation Findings & Compliance Engine Panel */}
          <div className="card" style={{ height: '680px', overflow: 'hidden' }}>
            <ValidationFindingsPanel
              applicationId={app.id}
              findings={app.findings || []}
              selectedDocumentId={selectedDocument?.id}
              onFindingUpdated={loadApplication}
            />
          </div>
        </div>
      )}

      {/* TAB: Cross-Document Entity Comparison Matrix */}
      {activeTab === 'cross_comparison' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2>Cross-Document Entity Comparison &amp; Normalization Matrix</h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Systematic side-by-side comparison of registered institutional profile data against values extracted from each statutory certificate.
              </p>
            </div>
            <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>Phase Three Engine</span>
          </div>

          {/* Profile Baseline Strip */}
          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px 16px', marginBottom: '16px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
              Registered Institution Profile Baseline:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', fontSize: '0.8125rem' }}>
              <div><strong>Legal Title:</strong> <span style={{ color: '#0f172a' }}>{app.institution?.name}</span></div>
              <div><strong>AICTE Permanent ID:</strong> <code>{app.institution?.code}</code></div>
              <div><strong>Registered Address:</strong> <span style={{ color: '#0f172a' }}>{app.institution?.address}, {app.institution?.city}</span></div>
            </div>
          </div>

          {/* Comparison Table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ fontSize: '0.8125rem' }}>
              <thead>
                <tr>
                  <th>Statutory Document Slot</th>
                  <th>Attached File &amp; Version</th>
                  <th>Extracted Institution Name</th>
                  <th>Extracted AICTE ID</th>
                  <th>Certificate Reference No.</th>
                  <th>Validity Dates</th>
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
                        <td colSpan={6} style={{ color: '#dc2626', fontStyle: 'italic' }}>
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
                      <td><strong>{docType}</strong></td>
                      <td>
                        <div>{doc.original_name}</div>
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                          v{doc.version || 1} • {doc.ocr_status}
                        </span>
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
                            <div>Exp: {fields.expiryDate}</div>
                            {new Date(fields.expiryDate) < new Date('2026-04-01') ? (
                              <span className="badge badge-failed" style={{ fontSize: '0.625rem' }}>Expired</span>
                            ) : (
                              <span className="badge badge-passed" style={{ fontSize: '0.625rem' }}>Active</span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Permanent / N/A</span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.75rem' }}>{fields?.issuingAuthority || 'Local Statutory Directorate'}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: Issuing Authority Verification Gateway */}
      {activeTab === 'authority' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2>National Regulatory Gateway — Issuing Authority Verification</h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Direct electronic cross-check of certificates against State Revenue, Fire and Emergency Services, and Municipal registries.
              </p>
            </div>
            <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>Simulated Connector (SIH-2026)</span>
          </div>

          <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '10px 14px', marginBottom: '16px', fontSize: '0.75rem', color: '#92400e' }}>
            <strong>Regulatory Notice:</strong> {SYNTHETIC_AUTHORITY_DISCLAIMER}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ fontSize: '0.8125rem' }}>
              <thead>
                <tr>
                  <th>Statutory Requirement</th>
                  <th>Reference Number</th>
                  <th>Issuing Authority</th>
                  <th>Verification Status</th>
                  <th>Registry Response Summary</th>
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
                        {doc?.extracted_fields?.documentNumber ? <code>{doc.extracted_fields.documentNumber}</code> : <em>Missing file</em>}
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
                          <span className="badge badge-not-checked">Verification Pending</span>
                        )}
                      </td>
                      <td style={{ maxWidth: '320px' }}>
                        {auth ? (
                          <div style={{ fontSize: '0.75rem', color: '#334155' }}>
                            {auth.responseSummary}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            No electronic lookup dispatched yet.
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
                            <Shield size={12} /> {auth ? 'Re-Query Gateway' : 'Query Registry'}
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

      {/* TAB: Applicable Regulatory Rules & APH Norms */}
      {activeTab === 'rules' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2>Applicable Regulatory Rules &amp; APH Norms</h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Configurable, versioned rules applied to <strong>{app.application_type}</strong> from the AICTE Approval Process Handbook (APH 2026-2027).
              </p>
            </div>
            <span className="badge badge-passed" style={{ fontSize: '0.75rem' }}>AICTE-APH-2026-27-V2.1</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {regulatoryRuleEngine.getRulesForApplicationType(app.application_type).map(rule => (
              <div 
                key={rule.ruleId}
                style={{
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '12px 16px',
                  backgroundColor: '#ffffff'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge badge-info" style={{ fontSize: '0.6875rem' }}>
                      {rule.ruleId} v{rule.version}
                    </span>
                    <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600 }}>
                      {rule.name}
                    </h4>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span className={`badge ${rule.severity === 'High' ? 'badge-failed' : 'badge-needs-review'}`} style={{ fontSize: '0.625rem' }}>
                      {rule.severity} Severity
                    </span>
                    {rule.isOfficialNorm ? (
                      <span className="badge badge-passed" style={{ fontSize: '0.625rem' }}>Official APH Norm</span>
                    ) : (
                      <span className="badge badge-info" style={{ fontSize: '0.625rem' }}>SIH Prototype Rule</span>
                    )}
                  </div>
                </div>

                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0 0 8px 0' }}>
                  {rule.description}
                </p>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #e2e8f0', paddingTop: '6px' }}>
                  <span>Statutory Citation: <strong>{rule.aphReference}</strong></span>
                  <span>Effective: {rule.effectiveFrom}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: Infrastructure Evidence Review */}
      {activeTab === 'infrastructure' && (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2>Physical Infrastructure &amp; Safety Evidence Dossier</h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Geotagged photographic evidence, barrier-free accessibility, laboratory layouts, and safety installations.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span className="badge badge-info">
                Evidence Items: {(app.infrastructure_evidence || []).length}
              </span>
            </div>
          </div>

          {/* Regulatory Disclaimer Banner */}
          <div style={{
            backgroundColor: '#fffbeb',
            border: '1px solid #fef3c7',
            borderRadius: '6px',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <AlertTriangle size={18} color="#b45309" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div style={{ fontSize: '0.8125rem', color: '#92400e', lineHeight: 1.45 }}>
              <strong>AUTOMATED INFRASTRUCTURE TRIAGE — PROTOTYPE EVALUATION:</strong> Automated checks triage visual clarity, EXIF timestamps, and GPS coordinates against survey records. Automated visual triage does <em>not</em> constitute statutory proof of land title, structural stability, or fire safety compliance without an authorized physical AICTE Expert Visiting Committee (EVC) inspection.
            </div>
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
            {['All', 'Land', 'Building', 'Laboratory', 'Safety', 'Barrier-Free Access'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedInfraCategory(cat)}
                className={`btn btn-sm ${selectedInfraCategory === cat ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.75rem', padding: '4px 12px' }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Infrastructure Items Grid */}
          {(!app.infrastructure_evidence || app.infrastructure_evidence.length === 0) ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <Camera size={36} style={{ opacity: 0.5, marginBottom: '8px' }} />
              <p>No infrastructure photographs or evidence dossiers uploaded yet.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
              {(app.infrastructure_evidence || [])
                .filter(ev => selectedInfraCategory === 'All' || ev.category === selectedInfraCategory)
                .map(ev => {
                  const isEditing = editingInfraId === ev.id;
                  const isDeficient = ev.reviewer_status === 'Deficiency Found' || (ev.clarity_score && ev.clarity_score < 60);

                  return (
                    <div
                      key={ev.id}
                      style={{
                        backgroundColor: '#ffffff',
                        border: isDeficient ? '2px solid #f87171' : '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      {/* Evidence Image Preview */}
                      <div style={{ position: 'relative', width: '100%', height: '220px', backgroundColor: '#0f172a' }}>
                        <img 
                          src={ev.file_url} 
                          alt={ev.title} 
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                        />
                        <div style={{ 
                          position: 'absolute', 
                          top: '10px', 
                          left: '10px', 
                          backgroundColor: 'rgba(15, 23, 42, 0.85)', 
                          padding: '3px 8px', 
                          borderRadius: '4px',
                          fontSize: '0.6875rem',
                          color: '#38bdf8',
                          fontWeight: 600
                        }}>
                          {ev.category}
                        </div>
                        <div style={{ 
                          position: 'absolute', 
                          top: '10px', 
                          right: '10px' 
                        }}>
                          <span className={`badge ${
                            ev.reviewer_status === 'Verified' ? 'badge-passed' : 
                            ev.reviewer_status === 'Deficiency Found' ? 'badge-failed' : 'badge-needs-review'
                          }`} style={{ fontSize: '0.6875rem' }}>
                            {ev.reviewer_status || 'Pending Review'}
                          </span>
                        </div>
                      </div>

                      {/* Evidence Details */}
                      <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {ev.title}
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                          {ev.description}
                        </p>

                        {/* EXIF Metadata & Geotag */}
                        <div style={{ 
                          backgroundColor: 'var(--bg-subtle)', 
                          padding: '8px 10px', 
                          borderRadius: '4px', 
                          fontSize: '0.75rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px'
                        }}>
                          {ev.coordinates && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}>
                              <MapPin size={12} color="#0284c7" />
                              <span>GPS Geotag: <strong>{ev.coordinates.latitude.toFixed(6)}° N, {ev.coordinates.longitude.toFixed(6)}° E</strong></span>
                            </div>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                            <span>Timestamp: {ev.timestamp_verified ? 'Hardware Verified' : 'Unverified EXIF'}</span>
                            <span>Clarity Index: <strong>{ev.clarity_score ? `${ev.clarity_score}%` : 'N/A'}</strong></span>
                          </div>
                        </div>

                        {/* Reviewer Notes & Inspection Recommendation */}
                        {ev.reviewer_notes && (
                          <div style={{ 
                            fontSize: '0.75rem', 
                            padding: '8px 10px', 
                            backgroundColor: ev.reviewer_status === 'Deficiency Found' ? '#fef2f2' : '#f0fdf4',
                            border: `1px solid ${ev.reviewer_status === 'Deficiency Found' ? '#fecaca' : '#bbf7d0'}`,
                            borderRadius: '4px',
                            color: ev.reviewer_status === 'Deficiency Found' ? '#991b1b' : '#166534'
                          }}>
                            <strong>Reviewer Note:</strong> {ev.reviewer_notes}
                          </div>
                        )}

                        {/* Officer Review Form (if Admin) */}
                        {isAdmin && (
                          <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                            {isEditing ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <select 
                                    value={infraReviewStatus}
                                    onChange={e => setInfraReviewStatus(e.target.value as any)}
                                    className="form-select"
                                    style={{ fontSize: '0.75rem', padding: '4px 8px', flex: 1 }}
                                  >
                                    <option value="Verified">Verified Compliant</option>
                                    <option value="Deficiency Found">Deficiency Found</option>
                                  </select>
                                </div>
                                <textarea 
                                  value={infraReviewNotes}
                                  onChange={e => setInfraReviewNotes(e.target.value)}
                                  placeholder="Record official observation or note regarding physical inspection..."
                                  rows={2}
                                  className="form-input"
                                  style={{ fontSize: '0.75rem', padding: '6px' }}
                                />
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                  <button
                                    onClick={() => setEditingInfraId(null)}
                                    className="btn btn-outline btn-sm"
                                    style={{ fontSize: '0.6875rem', padding: '3px 8px' }}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleSaveInfraReview(ev.id)}
                                    disabled={isUpdatingInfra}
                                    className="btn btn-primary btn-sm"
                                    style={{ fontSize: '0.6875rem', padding: '3px 8px' }}
                                  >
                                    Save Review
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <button
                                  onClick={() => {
                                    setEditingInfraId(ev.id);
                                    setInfraReviewStatus(ev.reviewer_status === 'Deficiency Found' ? 'Deficiency Found' : 'Verified');
                                    setInfraReviewNotes(ev.reviewer_notes || '');
                                  }}
                                  className="btn btn-outline btn-sm"
                                  style={{ fontSize: '0.6875rem', padding: '3px 8px' }}
                                >
                                  <Edit2 size={12} />
                                  Record Officer Assessment
                                </button>
                                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                                  File: {ev.file_name}
                                </span>
                              </div>
                            )}
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

      {/* TAB 2: Status History & Audit Trail */}
      {activeTab === 'history' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2>Application Status Transitions &amp; Audit Trail</h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Immutable historical trail of all regulatory state changes, automated evaluations, and officer actions.
              </p>
            </div>
          </div>
          <StatusHistoryTimeline history={app.status_history || []} />
        </div>
      )}

      {/* TAB 3: Official Comments & Decisions */}
      {activeTab === 'comments' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2>Official Scrutiny Comments &amp; Review Decisions</h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Official notes recorded by authorized AICTE scrutiny officers.
              </p>
            </div>
            {isAdmin && (
              <button 
                onClick={() => setShowAdminDecisionModal(true)} 
                className="btn btn-primary btn-sm"
              >
                Add Scrutiny Decision
              </button>
            )}
          </div>

          {!app.comments || app.comments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
              <UserCheck size={36} style={{ opacity: 0.5, marginBottom: '8px' }} />
              <p>No official scrutiny comments have been recorded yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {app.comments.map(comm => (
                <div 
                  key={comm.id}
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '16px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div>
                      <span className="badge badge-info" style={{ marginRight: '8px' }}>
                        {comm.comment_type}
                      </span>
                      {comm.decision && (
                        <span className={`badge ${comm.decision === 'Approved' ? 'badge-passed' : 'badge-failed'}`}>
                          Decision: {comm.decision}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(comm.created_at).toLocaleString()}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '8px', lineHeight: 1.5 }}>
                    {comm.comment_text}
                  </p>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Author: <strong>{comm.author_name}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Status Clarification Requests */}
      {activeTab === 'requests' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2>In-App Status Clarification Requests</h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Institutions can seek clarifications regarding flagged findings, and scrutiny officers provide official in-app replies.
              </p>
            </div>
            {!isAdmin && (
              <button 
                onClick={() => setShowClarificationModal(true)} 
                className="btn btn-outline btn-sm"
              >
                <HelpCircle size={14} />
                Ask Clarification
              </button>
            )}
          </div>

          <StatusClarificationSection
            applicationId={app.id}
            isAdmin={isAdmin}
            onUpdate={loadApplication}
          />
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Upload Regulatory Document Attachment</h3>
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
                    Files will be analyzed by the local validation engine. SHA-256 checksum is calculated for duplicate &amp; integrity detection.
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
              <h3>Record Official Scrutiny Committee Decision</h3>
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
                  <option value="Action Required">Action Required (Request Institution Correction)</option>
                  <option value="Needs Further Inspection">Needs Further Inspection (Physical Visit Required)</option>
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
                  placeholder="State the justification, applicable APH clauses, or deficiency explanations..."
                />
              </div>

              <div style={{ backgroundColor: '#eff6ff', padding: '10px', borderRadius: '4px', fontSize: '0.75rem', color: '#1e40af' }}>
                <strong>Audit Notice:</strong> This action changes application status to <em>{adminDecisionType === 'Approved' ? 'Review Completed' : adminDecisionType === 'Action Required' ? 'Action Required' : 'Under Review'}</em>, records your identity in the status history, and dispatches an in-app alert to the institution.
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
                  <strong>Rectification Workflow:</strong> Uploading will advance the version, recalculate all 10 verification factors on the new bytes, set application status to <em>Resubmitted</em>, and notify the scrutiny desk.
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {requests.map(req => (
        <div 
          key={req.id}
          style={{
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '16px',
            backgroundColor: '#ffffff'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{req.request_subject}</h4>
            <span className={`badge ${req.status === 'Resolved' ? 'badge-passed' : 'badge-needs-review'}`}>
              {req.status}
            </span>
          </div>

          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
            {req.request_message}
          </p>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
            Requested on {new Date(req.created_at).toLocaleString()}
          </span>

          {/* Official Reply Box */}
          {req.reply_message ? (
            <div style={{
              marginTop: '12px',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '4px',
              padding: '12px'
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e40af', marginBottom: '4px' }}>
                Official Scrutiny Reply ({req.replied_by}):
              </div>
              <p style={{ fontSize: '0.8125rem', color: '#1e3a8a' }}>
                {req.reply_message}
              </p>
              <div style={{ fontSize: '0.6875rem', color: '#60a5fa', marginTop: '4px' }}>
                Replied on {new Date(req.replied_at).toLocaleString()}
              </div>
            </div>
          ) : isAdmin ? (
            <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Official Scrutiny Desk Reply:
              </label>
              <textarea
                className="form-textarea"
                rows={2}
                value={replies[req.id] || ''}
                onChange={e => setReplies({ ...replies, [req.id]: e.target.value })}
                placeholder="Enter official committee reply..."
              />
              <button
                onClick={() => handleSendReply(req.id)}
                className="btn btn-primary btn-sm"
                style={{ marginTop: '6px' }}
                disabled={!replies[req.id]}
              >
                Send Reply
              </button>
            </div>
          ) : (
            <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Awaiting officer reply from AICTE scrutiny desk.
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
