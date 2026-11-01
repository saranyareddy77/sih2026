// AICTE SmartVerify — Multi-Step Application Creation & Submission Workflow
// SIH Problem Statement 26261

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  Building2, 
  Calendar, 
  HelpCircle, 
  Eye, 
  RefreshCw, 
  Lock, 
  FileCheck2,
  Trash2,
  Download
} from 'lucide-react';
import { 
  Application, 
  ApplicationType, 
  ApplicationDocument, 
  ValidationFinding, 
  ValidationOutcome,
  Institution 
} from '../types';
import { applicationService } from '../services/applicationService';
import { documentService } from '../services/documentService';
import { REQUIRED_DOCUMENTS_BY_TYPE, hasDocumentExpiry } from '../services/validationService';
import { authService } from '../services/authService';

interface ApplicationWorkflowModalProps {
  applicationId?: string; // If editing existing draft
  initialType?: ApplicationType;
  isOpen: boolean;
  onClose: () => void;
  onApplicationSubmitted?: (app: Application) => void;
}

const APPLICATION_CATEGORIES: ApplicationType[] = [
  'Extension of Approval (EoA)',
  'New Institution Approval',
  'Increase in Intake',
  'Introduction of New Course / Faculty',
  'Change in Site / Campus Location'
];

export const ApplicationWorkflowModal: React.FC<ApplicationWorkflowModalProps> = ({
  applicationId,
  initialType = 'Extension of Approval (EoA)',
  isOpen,
  onClose,
  onApplicationSubmitted
}) => {
  const currentUser = authService.getCurrentUser();
  const institution = currentUser?.institution;

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingDraft, setSavingDraft] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // Step 1: Application Details
  const [category, setCategory] = useState<ApplicationType>(initialType);
  const [academicYear, setAcademicYear] = useState<string>('2026-2027');
  const [purpose, setPurpose] = useState<string>('Extension of Approval for existing approved courses without intake change.');
  const [previousApprovalRef, setPreviousApprovalRef] = useState<string>(institution?.previous_approval_details?.approvalNumber || 'F.No. Northern/1-1092837411/2025/EoA');
  const [requestedChanges, setRequestedChanges] = useState<string>('None');

  // Step 2: Institutional Information (Editable permitted fields)
  const [instName, setInstName] = useState<string>(institution?.name || '');
  const [instAddress, setInstAddress] = useState<string>(institution?.address || '');
  const [instCity, setInstCity] = useState<string>(institution?.city || '');
  const [instState, setInstState] = useState<string>(institution?.state || '');
  const [instPincode, setInstPincode] = useState<string>(institution?.pincode || '');
  const [directorName, setDirectorName] = useState<string>(institution?.director_name || '');
  const [directorEmail, setDirectorEmail] = useState<string>(institution?.director_email || '');
  const [directorPhone, setDirectorPhone] = useState<string>(institution?.director_phone || '');

  // Step 3: Supporting Documents
  const [uploadedDocs, setUploadedDocs] = useState<ApplicationDocument[]>([]);
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);
  const [docDates, setDocDates] = useState<Record<string, { issueDate?: string; expiryDate?: string }>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [targetUploadSlot, setTargetUploadSlot] = useState<string | null>(null);

  // Step 4: Compliance & Declarations
  const [validating, setValidating] = useState<boolean>(false);
  const [validationReport, setValidationReport] = useState<{
    findings: ValidationFinding[];
    outcome: ValidationOutcome;
    canSubmit: boolean;
    blockerReasons: string[];
    mandatoryMissing: string[];
    expiredDocs: string[];
  } | null>(null);

  const [declarationNorms, setDeclarationNorms] = useState<boolean>(false);
  const [declarationAuthenticity, setDeclarationAuthenticity] = useState<boolean>(false);
  const [declarationPunitive, setDeclarationPunitive] = useState<boolean>(false);

  // Step 5: Submission & Receipt
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedReceipt, setSubmittedReceipt] = useState<Application | null>(null);

  // Preview document state
  const [previewDoc, setPreviewDoc] = useState<ApplicationDocument | null>(null);

  // Load or initialize application
  useEffect(() => {
    if (!isOpen) return;

    const init = async () => {
      setLoading(true);
      try {
        if (applicationId) {
          const existing = await applicationService.getApplicationById(applicationId);
          if (existing) {
            setApp(existing);
            setCategory(existing.application_type);
            setAcademicYear(existing.academic_year || '2026-2027');
            setUploadedDocs(existing.documents || []);
            if (existing.draft_data) {
              setPurpose(existing.draft_data.purpose || purpose);
              setPreviousApprovalRef(existing.draft_data.previousApprovalRef || previousApprovalRef);
              setRequestedChanges(existing.draft_data.requestedChanges || requestedChanges);
            }
            if (existing.step_progress) {
              setCurrentStep(existing.step_progress);
            }
            setLastSavedTime(new Date(existing.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          }
        } else {
          // Create fresh draft
          const newDraft = await applicationService.createApplication(
            institution?.id || 'inst-current',
            category,
            academicYear,
            currentUser?.id
          );
          setApp(newDraft);
          setUploadedDocs([]);
          setCurrentStep(1);
          setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
      } catch (err) {
        console.error('Workflow initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [isOpen, applicationId]);

  // Update dynamic document checklist when category changes
  const requiredDocList = REQUIRED_DOCUMENTS_BY_TYPE[category] || REQUIRED_DOCUMENTS_BY_TYPE['Extension of Approval (EoA)'];

  // Save partial draft at current state
  const handleSaveDraft = async () => {
    if (!app) return;
    setSavingDraft(true);
    try {
      const draftPayload = {
        category,
        academicYear,
        purpose,
        previousApprovalRef,
        requestedChanges,
        instName,
        instAddress,
        instCity,
        instState,
        instPincode,
        directorName,
        directorEmail,
        directorPhone
      };

      const updated = await applicationService.saveDraft(app.id, draftPayload, currentStep);
      setApp(updated);
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err: any) {
      console.error('Save draft error:', err);
    } finally {
      setSavingDraft(false);
    }
  };

  // Run validation engine for Step 4
  const runValidation = async () => {
    if (!app) return;
    setValidating(true);
    try {
      const report = await applicationService.validateApplication(app.id);
      setValidationReport(report);
    } catch (err) {
      console.error('Validation error:', err);
    } finally {
      setValidating(false);
    }
  };

  // Trigger file upload for a specific slot
  const handleSlotUploadClick = (slotName: string) => {
    setTargetUploadSlot(slotName);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetUploadSlot || !app) return;

    setUploadingDocType(targetUploadSlot);
    try {
      const res = await documentService.uploadDocument(
        app.id,
        targetUploadSlot,
        file,
        instName || institution?.name || 'Institution',
        institution?.code || '1-REG-NEW'
      );

      if (res.success && res.document) {
        const updatedApp = await applicationService.addDocumentToApplication(app.id, res.document);
        if (updatedApp && updatedApp.documents) {
          setUploadedDocs([...updatedApp.documents]);
          setApp(updatedApp);
        }
      } else {
        alert(res.error || 'Failed to upload document.');
      }
    } catch (err: any) {
      alert(err.message || 'File upload failed');
    } finally {
      setUploadingDocType(null);
      setTargetUploadSlot(null);
    }
  };

  // Remove document
  const handleRemoveDoc = async (docId: string) => {
    if (!app) return;
    try {
      const updated = await applicationService.removeDocument(app.id, docId);
      if (updated && updated.documents) {
        setUploadedDocs([...updated.documents]);
        setApp(updated);
      }
    } catch (err: any) {
      console.error('Remove doc error:', err);
    }
  };

  // Final Submit
  const handleFinalSubmit = async () => {
    if (!app) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await applicationService.finalSubmitApplication(
        app.id,
        currentUser?.full_name || 'Authorized Representative',
        currentUser?.id,
        {
          declarationNorms,
          declarationAuthenticity,
          declarationPunitive
        }
      );

      if (res.success && res.application) {
        setSubmittedReceipt(res.application);
        if (onApplicationSubmitted) {
          onApplicationSubmitted(res.application);
        }
      } else {
        setSubmitError(res.error || 'Submission failed. Please verify regulatory compliance.');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'An unexpected error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  // Navigation between steps
  const goToNextStep = async () => {
    await handleSaveDraft();
    if (currentStep === 3) {
      // Run validation before step 4
      await runValidation();
    }
    setCurrentStep(prev => Math.min(prev + 1, 5));
  };

  const goToPrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div 
        className="modal-dialog" 
        onClick={e => e.stopPropagation()} 
        style={{ 
          maxWidth: '1000px', 
          width: '95%', 
          maxHeight: '92vh', 
          display: 'flex', 
          flexDirection: 'column',
          backgroundColor: '#fff',
          borderRadius: '12px',
          overflow: 'hidden'
        }}
      >
        {/* Hidden File Input for document checklist */}
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileChange}
        />

        {/* Modal Top Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                {category}
              </span>
              <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                AY {academicYear}
              </span>
              {lastSavedTime && (
                <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Check size={12} /> Saved at {lastSavedTime}
                </span>
              )}
            </div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '4px 0 0', color: '#0f172a' }}>
              {app?.application_number || 'New AICTE Approval Application'}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {!submittedReceipt && (
              <button 
                type="button" 
                onClick={handleSaveDraft}
                disabled={savingDraft}
                className="btn btn-outline-clean btn-sm"
                title="Save partially completed draft"
              >
                <Save size={14} />
                {savingDraft ? 'Saving...' : 'Save Draft'}
              </button>
            )}

            <button 
              type="button" 
              onClick={onClose}
              className="btn btn-outline-clean btn-sm"
              style={{ padding: '6px' }}
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Step Progress Indicator (Only if not already submitted) */}
        {!submittedReceipt && (
          <div style={{
            display: 'flex',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            overflowX: 'auto'
          }}>
            {[
              { num: 1, title: 'Application Details' },
              { num: 2, title: 'Institutional Info' },
              { num: 3, title: 'Supporting Documents' },
              { num: 4, title: 'Compliance & Declaration' },
              { num: 5, title: 'Review & Submit' }
            ].map(s => {
              const isActive = currentStep === s.num;
              const isPassed = currentStep > s.num;
              return (
                <div 
                  key={s.num}
                  style={{
                    flex: 1,
                    minWidth: '150px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    borderBottom: isActive ? '3px solid #10b981' : '3px solid transparent',
                    backgroundColor: isActive ? '#f0fdf4' : 'transparent',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    if (s.num === 4) runValidation();
                    setCurrentStep(s.num);
                  }}
                >
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    backgroundColor: isPassed ? '#10b981' : isActive ? '#059669' : '#e2e8f0',
                    color: isPassed || isActive ? '#fff' : '#64748b'
                  }}>
                    {isPassed ? <Check size={13} /> : s.num}
                  </div>
                  <div style={{
                    fontSize: '0.8125rem',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#065f46' : '#475569',
                    whiteSpace: 'nowrap'
                  }}>
                    {s.title}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
              <RefreshCw size={28} className="spin text-emerald-600" style={{ margin: '0 auto 12px' }} />
              <p>Initializing regulatory application workflow...</p>
            </div>
          ) : submittedReceipt ? (
            /* SUBMISSION RECEIPT SCREEN */
            <div style={{ textAlign: 'center', padding: '30px 20px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#dcfce7',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <CheckCircle2 size={36} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#065f46', margin: '0 0 8px' }}>
                Application Officially Submitted!
              </h2>
              <p style={{ color: '#475569', fontSize: '0.9375rem', maxWidth: '600px', margin: '0 auto 24px' }}>
                Your approval dossier has been successfully submitted to the AICTE Regulation Bureau for statutory desk scrutiny and document authentication.
              </p>

              <div style={{
                maxWidth: '540px',
                margin: '0 auto',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '20px',
                textAlign: 'left'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '0.875rem' }}>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block' }}>Permanent Ref No</span>
                    <strong style={{ color: '#0f172a' }}>{submittedReceipt.application_number}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block' }}>Approval Category</span>
                    <strong>{submittedReceipt.application_type}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block' }}>Academic Year</span>
                    <strong>{submittedReceipt.academic_year}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block' }}>Submission Timestamp</span>
                    <strong>{new Date(submittedReceipt.submission_date || Date.now()).toLocaleString()}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block' }}>Current Status</span>
                    <span className="badge badge-passed">Under Scrutiny</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block' }}>Submitter</span>
                    <strong>{currentUser?.full_name || 'Authorized Officer'}</strong>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <button 
                  type="button" 
                  onClick={onClose}
                  className="btn btn-emerald-primary"
                  style={{ padding: '10px 24px' }}
                >
                  Return to Institution Dashboard
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* STEP 1: APPLICATION DETAILS */}
              {currentStep === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Step 1 — Application Category &amp; Regulatory Parameters</h3>
                    <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#64748b' }}>
                      Select the applicable AICTE Approval Process Handbook (APH 2026-2027) application type.
                    </p>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Application Category *</label>
                      <select 
                        className="form-input" 
                        value={category} 
                        onChange={e => setCategory(e.target.value as ApplicationType)}
                      >
                        {APPLICATION_CATEGORIES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Academic Year *</label>
                      <select 
                        className="form-input" 
                        value={academicYear} 
                        onChange={e => setAcademicYear(e.target.value)}
                      >
                        <option value="2026-2027">2026-2027 (Current Cycle)</option>
                        <option value="2027-2028">2027-2028</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Institution Permanent AICTE ID</label>
                      <input 
                        type="text" 
                        disabled 
                        className="form-input" 
                        style={{ backgroundColor: '#f1f5f9' }} 
                        value={institution?.code || '1-1092837411'} 
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Previous AICTE Approval Letter Reference</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="F.No. Northern/1-1092837411/2025/EoA"
                        value={previousApprovalRef} 
                        onChange={e => setPreviousApprovalRef(e.target.value)} 
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Purpose of Application &amp; Requested Changes *</label>
                    <textarea 
                      rows={4} 
                      className="form-input" 
                      placeholder="Specify requested changes in approved intake, introduction of new course, or extension of approval details..."
                      value={purpose} 
                      onChange={e => setPurpose(e.target.value)} 
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: INSTITUTIONAL INFORMATION */}
              {currentStep === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Step 2 — Institutional Profile &amp; Contact Records</h3>
                    <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#64748b' }}>
                      Pre-filled automatically from your verified institution profile. You may correct permitted fields.
                    </p>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Institution Full Legal Name</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={instName} 
                        onChange={e => setInstName(e.target.value)} 
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Campus Physical Address</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={instAddress} 
                        onChange={e => setInstAddress(e.target.value)} 
                      />
                    </div>
                  </div>

                  <div className="form-grid-3">
                    <div className="form-group">
                      <label className="form-label">City</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={instCity} 
                        onChange={e => setInstCity(e.target.value)} 
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">State</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={instState} 
                        onChange={e => setInstState(e.target.value)} 
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">PIN Code</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={instPincode} 
                        onChange={e => setInstPincode(e.target.value)} 
                      />
                    </div>
                  </div>

                  <div className="form-grid-3">
                    <div className="form-group">
                      <label className="form-label">Director / Principal Name</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={directorName} 
                        onChange={e => setDirectorName(e.target.value)} 
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Director Email</label>
                      <input 
                        type="email" 
                        className="form-input" 
                        value={directorEmail} 
                        onChange={e => setDirectorEmail(e.target.value)} 
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Director Phone</label>
                      <input 
                        type="tel" 
                        className="form-input" 
                        value={directorPhone} 
                        onChange={e => setDirectorPhone(e.target.value)} 
                      />
                    </div>
                  </div>

                  <div style={{ padding: '14px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', fontSize: '0.8125rem', color: '#065f46' }}>
                    <strong>Approved Programmes on Record: </strong>
                    {(institution?.approved_programmes || []).length > 0 
                      ? `${institution?.approved_programmes?.length} courses registered (${institution?.approved_programmes?.reduce((sum, c) => sum + (c.approvedIntake || c.approved_intake || 0), 0)} total intake).` 
                      : '3 courses registered on record.'}
                  </div>
                </div>
              )}

              {/* STEP 3: SUPPORTING DOCUMENTS (DYNAMIC CHECKLIST) */}
              {currentStep === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                          Step 3 — Mandatory Regulatory Supporting Documents
                        </h3>
                        <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#64748b' }}>
                          Dynamic checklist tailored for: <strong>{category}</strong>. PDF and image formats up to 15 MB accepted.
                        </p>
                      </div>
                      <span className="badge badge-info">
                        {uploadedDocs.length} / {requiredDocList.length} Uploaded
                      </span>
                    </div>
                  </div>

                  {/* Checklist Table */}
                  <div className="table-responsive-wrapper">
                    <table className="clean-data-table">
                      <thead>
                        <tr>
                          <th>Document Type &amp; Purpose</th>
                          <th>Status &amp; Requirement</th>
                          <th>Uploaded File</th>
                          <th>Expiry Status</th>
                          <th style={{ textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {requiredDocList.map(docType => {
                          const uploaded = uploadedDocs.find(d => d.document_type === docType && d.is_active_version !== false);
                          const isExpiring = hasDocumentExpiry(docType);
                          const isCurrentlyUploading = uploadingDocType === docType;

                          return (
                            <tr key={docType}>
                              <td>
                                <div style={{ fontWeight: 600, color: '#0f172a' }}>{docType}</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                  AICTE APH 2026-2027 Mandatory Compliance Attachment
                                </div>
                              </td>

                              <td>
                                {uploaded ? (
                                  uploaded.is_corrupt ? (
                                    <span className="badge badge-failed">Corrupted File</span>
                                  ) : (
                                    <span className="badge badge-passed">Uploaded (v{uploaded.version || 1})</span>
                                  )
                                ) : (
                                  <span className="badge badge-failed" style={{ backgroundColor: '#fff1f2', color: '#e11d48' }}>
                                    Mandatory Missing
                                  </span>
                                )}
                              </td>

                              <td>
                                {uploaded ? (
                                  <div>
                                    <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#0f172a' }}>
                                      {uploaded.original_name}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                      {(uploaded.file_size / 1024).toFixed(1)} KB • {uploaded.checksum ? `SHA256: ${uploaded.checksum.slice(0, 10)}...` : 'Checksum verified'}
                                    </div>
                                  </div>
                                ) : (
                                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>No file attached yet</span>
                                )}
                              </td>

                              <td>
                                {uploaded ? (
                                  uploaded.extracted_fields?.isExpired ? (
                                    <span className="badge badge-failed">Expired Certificate</span>
                                  ) : uploaded.extracted_fields?.expiryDate ? (
                                    <span style={{ fontSize: '0.75rem', color: '#059669' }}>
                                      Valid until: {uploaded.extracted_fields.expiryDate}
                                    </span>
                                  ) : isExpiring ? (
                                    <span style={{ fontSize: '0.75rem', color: '#d97706' }}>Expiry check active</span>
                                  ) : (
                                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Perpetual / Non-expiring</span>
                                  )
                                ) : (
                                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>—</span>
                                )}
                              </td>

                              <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                                  {uploaded ? (
                                    <>
                                      <button 
                                        type="button" 
                                        onClick={() => handleSlotUploadClick(docType)}
                                        disabled={isCurrentlyUploading}
                                        className="btn btn-outline-clean btn-xs"
                                        title="Replace file with newer version"
                                      >
                                        <RefreshCw size={12} className={isCurrentlyUploading ? 'spin' : ''} />
                                        Replace
                                      </button>
                                      <button 
                                        type="button" 
                                        onClick={() => handleRemoveDoc(uploaded.id)}
                                        className="btn btn-outline-clean btn-xs"
                                        style={{ color: '#e11d48' }}
                                        title="Remove attachment"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </>
                                  ) : (
                                    <button 
                                      type="button" 
                                      onClick={() => handleSlotUploadClick(docType)}
                                      disabled={isCurrentlyUploading}
                                      className="btn btn-emerald-primary btn-xs"
                                    >
                                      <Upload size={12} className={isCurrentlyUploading ? 'spin' : ''} />
                                      {isCurrentlyUploading ? 'Uploading...' : 'Upload'}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* STEP 4: COMPLIANCE & DECLARATION */}
              {currentStep === 4 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                          Step 4 — Automated Regulatory Check &amp; Statutory Undertakings
                        </h3>
                        <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#64748b' }}>
                          Pre-submission verification against AICTE Approval Process Handbook norms.
                        </p>
                      </div>
                      <button 
                        type="button" 
                        onClick={runValidation} 
                        disabled={validating}
                        className="btn btn-outline-clean btn-sm"
                      >
                        <RefreshCw size={13} className={validating ? 'spin' : ''} />
                        Re-run Checks
                      </button>
                    </div>
                  </div>

                  {/* Validation Summary Card */}
                  {validationReport ? (
                    <div style={{
                      padding: '16px',
                      borderRadius: '8px',
                      backgroundColor: validationReport.canSubmit ? '#f0fdf4' : '#fff1f2',
                      border: validationReport.canSubmit ? '1px solid #bbf7d0' : '1px solid #fecdd3'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {validationReport.canSubmit ? (
                          <CheckCircle2 size={22} className="text-emerald-600" />
                        ) : (
                          <AlertTriangle size={22} color="#dc2626" />
                        )}
                        <div>
                          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: validationReport.canSubmit ? '#065f46' : '#991b1b' }}>
                            {validationReport.canSubmit ? 'Application Meets Preliminary Submission Criteria' : 'Statutory Deficiencies Detected — Submission Blocked'}
                          </h4>
                          <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: validationReport.canSubmit ? '#047857' : '#b91c1c' }}>
                            {validationReport.canSubmit 
                              ? 'All mandatory certificates attached and verified. You may proceed to review and submit.' 
                              : 'The system prevents premature submission when mandatory statutory requirements are missing.'}
                          </p>
                        </div>
                      </div>

                      {validationReport.blockerReasons.length > 0 && (
                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #fecdd3' }}>
                          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#991b1b', marginBottom: '4px' }}>
                            Blockers requiring rectification:
                          </div>
                          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.8125rem', color: '#b91c1c' }}>
                            {validationReport.blockerReasons.map((b, idx) => (
                              <li key={idx}>{b}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                      <RefreshCw size={20} className="spin text-emerald-600" style={{ margin: '0 auto 8px' }} />
                      <p style={{ fontSize: '0.875rem' }}>Evaluating application against regulatory rules...</p>
                    </div>
                  )}

                  {/* Statutory Declarations */}
                  <div style={{ marginTop: '8px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
                      Mandatory Institutional Undertakings (Required for Final Submission)
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '0.8125rem', color: '#334155' }}>
                        <input 
                          type="checkbox" 
                          checked={declarationNorms} 
                          onChange={e => setDeclarationNorms(e.target.checked)} 
                          style={{ marginTop: '3px' }}
                        />
                        <span>I hereby solemnly declare that the institution complies with all land, building, faculty cadre ratio, laboratory readiness, and statutory safety norms prescribed in AICTE Approval Process Handbook (APH 2026-2027).</span>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '0.8125rem', color: '#334155' }}>
                        <input 
                          type="checkbox" 
                          checked={declarationAuthenticity} 
                          onChange={e => setDeclarationAuthenticity(e.target.checked)} 
                          style={{ marginTop: '3px' }}
                        />
                        <span>I affirm that all uploaded deeds, certificates, and authority letters are genuine, unaltered digital reproductions of authentic records issued by competent government/statutory authorities.</span>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '0.8125rem', color: '#334155' }}>
                        <input 
                          type="checkbox" 
                          checked={declarationPunitive} 
                          onChange={e => setDeclarationPunitive(e.target.checked)} 
                          style={{ marginTop: '3px' }}
                        />
                        <span>I acknowledge that furnishing counterfeit documents, deceptive declarations, or suppressing material facts constitutes an offence liable for summary rejection and punitive action under the AICTE Act.</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: REVIEW & FINAL SUBMIT */}
              {currentStep === 5 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                      Step 5 — Complete Application Dossier Summary &amp; Submission
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#64748b' }}>
                      Verify all dossier details before executing statutory submission. A frozen snapshot will be registered for scrutiny.
                    </p>
                  </div>

                  {submitError && (
                    <div className="auth-alert alert-error">
                      <AlertCircle size={18} className="alert-icon" />
                      <div style={{ whiteSpace: 'pre-line' }}>{submitError}</div>
                    </div>
                  )}

                  {/* Application Summary Box */}
                  <div style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    padding: '20px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '16px',
                    fontSize: '0.875rem'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Draft Ref</span>
                      <strong style={{ color: '#0f172a' }}>{app?.application_number}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Category</span>
                      <strong>{category}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Academic Cycle</span>
                      <strong>{academicYear}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Institution</span>
                      <strong>{instName || institution?.name}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>AICTE Permanent ID</span>
                      <strong>{institution?.code}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Attached Certificates</span>
                      <strong>{uploadedDocs.length} documents uploaded</strong>
                    </div>
                  </div>

                  {/* Submission Readiness Status */}
                  <div style={{
                    padding: '16px',
                    borderRadius: '8px',
                    backgroundColor: (validationReport?.canSubmit && declarationNorms && declarationAuthenticity && declarationPunitive) ? '#f0fdf4' : '#fffbeb',
                    border: (validationReport?.canSubmit && declarationNorms && declarationAuthenticity && declarationPunitive) ? '1px solid #bbf7d0' : '1px solid #fde68a'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {(validationReport?.canSubmit && declarationNorms && declarationAuthenticity && declarationPunitive) ? (
                        <CheckCircle2 size={20} className="text-emerald-600" />
                      ) : (
                        <AlertCircle size={20} className="text-amber-600" />
                      )}
                      <div style={{ fontSize: '0.875rem' }}>
                        {(validationReport?.canSubmit && declarationNorms && declarationAuthenticity && declarationPunitive) ? (
                          <span style={{ color: '#065f46', fontWeight: 600 }}>
                            Ready for final official submission. Submitting user: {currentUser?.full_name} ({currentUser?.designation}).
                          </span>
                        ) : (
                          <span style={{ color: '#92400e', fontWeight: 600 }}>
                            Submission requirements incomplete. Please ensure all mandatory documents are uploaded and all statutory undertakings in Step 4 are confirmed.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Bottom Footer Navigation */}
        {!submittedReceipt && (
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              {currentStep > 1 && (
                <button 
                  type="button" 
                  onClick={goToPrevStep} 
                  className="btn btn-outline-clean btn-sm"
                >
                  <ChevronLeft size={16} /> Back
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              {currentStep < 5 ? (
                <button 
                  type="button" 
                  onClick={goToNextStep} 
                  className="btn btn-emerald-primary btn-sm"
                >
                  Save &amp; Continue <ChevronRight size={16} />
                </button>
              ) : (
                <button 
                  type="button" 
                  onClick={handleFinalSubmit}
                  disabled={submitting || !(validationReport?.canSubmit && declarationNorms && declarationAuthenticity && declarationPunitive)}
                  className="btn btn-emerald-primary"
                  style={{ padding: '10px 24px', fontWeight: 700 }}
                >
                  <FileCheck2 size={16} />
                  {submitting ? 'Submitting to AICTE Bureau...' : 'Final Submit Application'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationWorkflowModal;
