// AICTE SmartVerify — Complaint Detail & Cross-Bureau Coordination Workbench
// SIH Problem Statement: Integrated Institution Complaint Monitoring and Status Dashboard for AICTE

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
  Info,
  ArrowLeftRight,
  AlertOctagon,
  Link2,
  Share2,
  FolderSync
} from 'lucide-react';
import { 
  Application, 
  ApplicationDocument, 
  ComplaintStatus, 
  ComplaintPriority,
  BureauCell,
  ComplaintTransfer,
  ComplaintEscalation,
  OverlapAlert
} from '../types';
import { applicationService } from '../services/applicationService';
import { complaintService } from '../services/complaintService';
import { overlapDetectionService } from '../services/overlapDetectionService';
import { authService } from '../services/authService';
import { DocumentViewer } from '../components/DocumentViewer';

type DrawerType = 'cross_comparison' | 'authority' | 'infrastructure' | 'rules' | 'audit_history' | 'clarifications' | null;

export const ApplicationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [app, setApp] = useState<Application | null>(null);
  const [allComplaints, setAllComplaints] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDocument, setSelectedDocument] = useState<ApplicationDocument | null>(null);
  
  // Secondary Inspector Drawer state
  const [activeDrawer, setActiveDrawer] = useState<DrawerType>(null);

  // Transfer modal state
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
  const [transferToBureau, setTransferToBureau] = useState<string>('Regulation Bureau (RB)');
  const [transferReason, setTransferReason] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState<boolean>(false);

  // Escalate modal state
  const [showEscalateModal, setShowEscalateModal] = useState<boolean>(false);
  const [escalateTo, setEscalateTo] = useState<string>('Member Secretary & Bureau Head (RB)');
  const [escalationReason, setEscalationReason] = useState<string>('');
  const [isEscalating, setIsEscalating] = useState<boolean>(false);

  // Disposal modal state
  const [showDisposalModal, setShowDisposalModal] = useState<boolean>(false);
  const [disposalDecision, setDisposalDecision] = useState<'Substantiated - Directive Issued' | 'Resolved upon Rectification' | 'Unsubstantiated / Closed' | 'Referred to State Authority'>('Resolved upon Rectification');
  const [disposalRemarks, setDisposalRemarks] = useState<string>('');
  const [disposalOrderNo, setDisposalOrderNo] = useState<string>('');
  const [isDisposing, setIsDisposing] = useState<boolean>(false);

  // Link related case modal state
  const [showLinkModal, setShowLinkModal] = useState<boolean>(false);
  const [selectedCaseToLink, setSelectedCaseToLink] = useState<string>('');
  const [linkRemarks, setLinkRemarks] = useState<string>('');
  const [isLinking, setIsLinking] = useState<boolean>(false);

  // Add Remark modal state
  const [showRemarkModal, setShowRemarkModal] = useState<boolean>(false);
  const [remarkText, setRemarkText] = useState<string>('');
  const [isAddingRemark, setIsAddingRemark] = useState<boolean>(false);

  // Inter-Bureau message note state
  const [interBureauRecipient, setInterBureauRecipient] = useState<string>('Regulation Bureau (RB)');
  const [interBureauSubject, setInterBureauSubject] = useState<string>('');
  const [interBureauMessage, setInterBureauMessage] = useState<string>('');

  const currentUser = authService.getCurrentUser();
  const isAdmin = authService.isAdmin();

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await applicationService.getApplicationById(id);
      const all = await applicationService.getApplications();
      setAllComplaints(all);

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
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="app-container" style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
        <RefreshCw size={28} className="spin" style={{ marginBottom: '12px', opacity: 0.7 }} />
        <p style={{ fontSize: '0.9375rem' }}>Loading institutional complaint record &amp; evaluating cross-bureau overlap...</p>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="app-container" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <AlertTriangle size={48} color="#dc2626" style={{ marginBottom: '12px' }} />
        <h2>Complaint Not Found</h2>
        <p style={{ marginBottom: '16px', color: 'var(--text-muted)' }}>
          The requested complaint docket could not be located in the repository.
        </p>
        <Link to="/admin" className="btn btn-primary">Return to Dashboard</Link>
      </div>
    );
  }

  // Evaluate Overlap Detection for this complaint
  const overlapInfo = overlapDetectionService.getOverlapForComplaint(app, allComplaints);
  const hasOverlap = overlapInfo.hasOverlap || (app.related_complaint_ids && app.related_complaint_ids.length > 0);

  // Other active cases concerning this institution across bureaus
  const concurrentInstitutionCases = allComplaints.filter(c => 
    c.id !== app.id && 
    (c.institution_id === app.institution_id || 
     (c.institution?.code && app.institution?.code && c.institution.code.replace(/[^a-zA-Z0-9]/g, '') === app.institution.code.replace(/[^a-zA-Z0-9]/g, '')))
  );

  // Handle Inter-Bureau Case Transfer
  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferReason.trim()) {
      alert('A formal statutory transfer reason is required.');
      return;
    }
    setIsTransferring(true);
    try {
      const updated = await complaintService.transferComplaint(
        app.id,
        app.bureau || 'Public Grievance Redressal Cell (PGRC)',
        transferToBureau,
        transferReason,
        currentUser?.full_name || 'Authorized Scrutiny Officer'
      );
      setApp({ ...updated });
      setShowTransferModal(false);
      setTransferReason('');
      alert(`Case transferred successfully to ${transferToBureau}!`);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsTransferring(false);
    }
  };

  // Handle Escalation
  const handleExecuteEscalation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!escalationReason.trim()) {
      alert('An escalation reason is required.');
      return;
    }
    setIsEscalating(true);
    try {
      const updated = await complaintService.escalateComplaint(
        app.id,
        escalateTo,
        escalationReason,
        currentUser?.full_name || 'Senior Scrutiny Officer'
      );
      setApp({ ...updated });
      setShowEscalateModal(false);
      setEscalationReason('');
      alert(`Case successfully escalated to ${escalateTo}!`);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsEscalating(false);
    }
  };

  // Handle Disposal Decision
  const handleExecuteDisposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disposalRemarks.trim()) {
      alert('Official disposal remarks and findings summary are required.');
      return;
    }
    setIsDisposing(true);
    try {
      const updated = await complaintService.recordDisposal(
        app.id,
        disposalDecision,
        disposalRemarks,
        disposalOrderNo,
        currentUser?.full_name || 'Designated Inquiring Authority'
      );
      setApp({ ...updated });
      setShowDisposalModal(false);
      setDisposalRemarks('');
      setDisposalOrderNo('');
      alert(`Complaint formally marked Disposed (${disposalDecision})!`);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsDisposing(false);
    }
  };

  // Handle Linking Related Complaints
  const handleExecuteLinkCases = async (targetCaseId: string) => {
    if (!targetCaseId) return;
    setIsLinking(true);
    try {
      const { case1 } = await complaintService.linkRelatedComplaints(
        app.id,
        targetCaseId,
        currentUser?.full_name || 'Coordination Desk Officer',
        `Mutual cross-bureau coordination established between ${app.case_id || app.application_number} and ${targetCaseId}.`
      );
      setApp({ ...case1 });
      setShowLinkModal(false);
      alert(`Cases successfully linked! Mutual cross-bureau coordination confirmed.`);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLinking(false);
    }
  };

  // Handle Overlap Decision (Confirmed, Dismissed, Needs Review)
  const handleReviewOverlapDecision = async (decision: 'Confirmed' | 'Dismissed' | 'Needs Review') => {
    const notes = prompt(`Enter coordination notes for marking overlap as "${decision}":`, `Case reviewed by ${currentUser?.full_name || 'Officer'}`);
    if (notes === null) return;
    try {
      const updated = await complaintService.reviewOverlap(
        app.id,
        decision,
        currentUser?.full_name || 'Scrutiny Officer',
        notes
      );
      setApp({ ...updated });
      alert(`Overlap decision recorded: ${decision}`);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handle Add Officer Remark
  const handleAddOfficerRemark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remarkText.trim()) return;
    setIsAddingRemark(true);
    try {
      const updated = await complaintService.addRemark(
        app.id,
        remarkText,
        currentUser?.full_name || 'Desk Officer'
      );
      setApp({ ...updated });
      setShowRemarkModal(false);
      setRemarkText('');
      alert('Officer remark recorded in case history.');
      await loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsAddingRemark(false);
    }
  };

  // Quick Status Transition
  const handleQuickStatusChange = async (newStatus: ComplaintStatus) => {
    const reason = prompt(`Reason for changing complaint status to "${newStatus}":`, `Status updated by ${currentUser?.full_name || 'Desk In-Charge'}`);
    if (reason === null) return;
    try {
      const updated = await complaintService.updateStatus(
        app.id,
        newStatus,
        currentUser?.full_name || 'Desk Officer',
        reason
      );
      setApp({ ...updated });
      alert(`Complaint status updated to ${newStatus}`);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Disposed':
      case 'Closed':
        return <span className="badge badge-passed">{status}</span>;
      case 'Escalated':
        return <span className="badge badge-failed">{status}</span>;
      case 'Transferred':
        return <span className="badge badge-needs-review" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>Transferred</span>;
      case 'Under Process':
        return <span className="badge badge-info">Under Process</span>;
      case 'Awaiting Information':
        return <span className="badge badge-needs-review">Awaiting Information</span>;
      default:
        return <span className="badge badge-draft">{status || 'Pending'}</span>;
    }
  };

  const caseId = app.case_id || app.application_number;
  const currentBureau = app.bureau || app.receiving_bureau || 'Public Grievance Redressal Cell (PGRC)';

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
          Back to {isAdmin ? 'Complaints Queue' : 'Institution Dashboard'}
        </Link>

        {/* Global Action Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            onClick={loadData} 
            className="btn btn-outline btn-sm"
            title="Refresh complaint data"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} />
            Refresh
          </button>

          <button 
            onClick={() => setShowRemarkModal(true)} 
            className="btn btn-outline btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Edit2 size={14} />
            Add Remark
          </button>

          {isAdmin && (
            <>
              <button 
                onClick={() => setShowTransferModal(true)} 
                className="btn btn-outline btn-sm"
                style={{ borderColor: '#d97706', color: '#92400e', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                title="Transfer case to another Bureau/Cell"
              >
                <ArrowLeftRight size={14} />
                Transfer to Another Bureau
              </button>

              <button 
                onClick={() => setShowEscalateModal(true)} 
                className="btn btn-outline btn-sm"
                style={{ borderColor: '#dc2626', color: '#b91c1c', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                title="Escalate complaint to senior authority"
              >
                <AlertOctagon size={14} />
                Escalate Complaint
              </button>

              <button 
                onClick={() => setShowDisposalModal(true)} 
                className="btn btn-primary btn-sm"
                style={{ 
                  backgroundColor: '#059669', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px'
                }}
              >
                <UserCheck size={14} />
                Record Formal Disposal
              </button>
            </>
          )}
        </div>
      </div>

      {/* Complaint Dossier Overview Banner */}
      <div className="card" style={{ padding: '18px 22px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                {caseId}
              </h1>
              {getStatusBadge(app.status)}
              {hasOverlap && (
                <span 
                  className="badge" 
                  style={{ 
                    backgroundColor: '#fef3c7', 
                    color: '#b45309', 
                    border: '1px solid #fde68a',
                    fontWeight: 700
                  }}
                >
                  ⚠️ Overlap Detected
                </span>
              )}
              {app.is_overdue && (
                <span className="badge badge-failed">
                  Overdue SLA
                </span>
              )}
            </div>

            <div style={{ fontSize: '0.9375rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              {app.institution?.name}
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <span>Permanent AICTE ID: <code>{app.institution?.code || '1-1092837411'}</code></span>
              <span>Responsible Bureau: <strong>{currentBureau}</strong></span>
              <span>Category: <strong>{app.complaint_category || 'Grievance'}</strong></span>
              <span>Received: <strong>{app.date_received || new Date(app.created_at).toLocaleDateString()}</strong></span>
              <span>Target Disposal: <strong>{app.expected_disposal_date || '30 days'}</strong></span>
            </div>
          </div>

          {/* SLA & Current Responsibility Card */}
          <div style={{
            backgroundColor: app.is_overdue ? '#fef2f2' : hasOverlap ? '#fffbeb' : '#f0fdf4',
            border: `1px solid ${app.is_overdue ? '#fecaca' : hasOverlap ? '#fde68a' : '#bbf7d0'}`,
            borderRadius: '8px',
            padding: '10px 16px',
            textAlign: 'right',
            minWidth: '220px'
          }}>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              SLA &amp; Bureau Status
            </div>
            <div style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: app.is_overdue ? '#991b1b' : hasOverlap ? '#92400e' : '#166534',
              marginTop: '2px'
            }}>
              {app.is_overdue 
                ? 'SLA Target Exceeded' 
                : hasOverlap 
                ? 'Cross-Bureau Attention' 
                : 'Within Compliance SLA'}
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Officer: {app.assigned_officer || 'Desk In-Charge'}
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Workflow Toolbar (Drawers) */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '16px', 
        overflowX: 'auto', 
        paddingBottom: '4px',
        alignItems: 'center'
      }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: '4px' }}>
          Coordination Tools:
        </span>

        <button
          onClick={() => setActiveDrawer('cross_comparison')}
          className={`btn btn-sm ${activeDrawer === 'cross_comparison' ? 'btn-primary' : 'btn-outline'}`}
          style={{ fontSize: '0.75rem', padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Layers size={13} />
          Cross-Bureau Overlap Analysis ({concurrentInstitutionCases.length} Concurrent)
        </button>

        <button
          onClick={() => setActiveDrawer('audit_history')}
          className={`btn btn-sm ${activeDrawer === 'audit_history' ? 'btn-primary' : 'btn-outline'}`}
          style={{ fontSize: '0.75rem', padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Clock size={13} />
          Action &amp; Transfer Trail ({app.status_history?.length || 0})
        </button>

        <button
          onClick={() => setActiveDrawer('clarifications')}
          className={`btn btn-sm ${activeDrawer === 'clarifications' ? 'btn-primary' : 'btn-outline'}`}
          style={{ fontSize: '0.75rem', padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <MessageSquare size={13} />
          Inter-Bureau Communications
        </button>

        <button
          onClick={() => setActiveDrawer('rules')}
          className={`btn btn-sm ${activeDrawer === 'rules' ? 'btn-primary' : 'btn-outline'}`}
          style={{ fontSize: '0.75rem', padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <BookOpen size={13} />
          SLA Timelines &amp; AICTE Norms
        </button>
      </div>

      {/* SIGNATURE 3-PANEL PERSISTENT COMPLAINT WORKBENCH */}
      <div className="workbench-layout">
        {/* PANEL 1: Institution Details & Complaint Metadata (LEFT PANEL) */}
        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: '720px', overflowY: 'auto' }}>
          <div style={{ marginBottom: '14px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
              Institution Profile
            </h3>
            <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Central Institution Registry Details
            </p>
          </div>

          {/* Institution Data Card */}
          <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-subtle)', marginBottom: '14px' }}>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
              {app.institution?.name}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#0369a1', marginTop: '3px', fontWeight: 600 }}>
              AICTE ID: {app.institution?.code}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {app.institution?.address}, {app.institution?.city}, {app.institution?.state} — {app.institution?.pincode}
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Region: <strong>{app.institution?.region || 'Northern'}</strong> • Type: {app.institution?.institution_type}
            </div>
          </div>

          {/* Case Metadata */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Case Metadata
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px', fontSize: '0.8125rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Complainant:</span>{' '}
                <strong>{app.complainant_name || 'Concerned Stakeholder'}</strong> ({app.complainant_type || 'Student'})
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Assigned Desk:</span>{' '}
                <strong>{currentBureau}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Lead Officer:</span>{' '}
                <strong>{app.assigned_officer || 'Scrutiny Officer'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Priority:</span>{' '}
                <span className="badge badge-info" style={{ fontSize: '0.6875rem' }}>{app.priority || 'Medium'}</span>
              </div>
            </div>
          </div>

          {/* Linked Complaints */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
              Linked Cases ({app.related_complaint_ids?.length || 0})
            </div>
            {app.related_complaint_ids && app.related_complaint_ids.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {app.related_complaint_ids.map(lid => (
                  <div key={lid} style={{ padding: '6px 10px', backgroundColor: '#eff6ff', borderRadius: '4px', border: '1px solid #bfdbfe', fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: '#1d4ed8' }}>🔗 {lid}</span>
                    <span style={{ fontSize: '0.6875rem', color: '#1e40af' }}>Coordinated</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                No cross-bureau complaints linked yet.
              </div>
            )}
          </div>

          {/* Supporting Evidence Documents */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
              Supporting Evidence Attachments ({(app.documents || []).length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {(app.documents || []).map(doc => {
                const isSelected = selectedDocument?.id === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDocument(doc)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '4px',
                      border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                      backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                      cursor: 'pointer',
                      fontSize: '0.75rem'
                    }}
                  >
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {doc.document_type}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {doc.original_name} • {(doc.file_size / 1024).toFixed(0)} KB
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* PANEL 2: Complaint Allegations & Supporting Documents Viewer (CENTER PANEL) */}
        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: '720px', overflowY: 'auto' }}>
          <div style={{ marginBottom: '12px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
              Complaint Narrative &amp; Evidence
            </h3>
            <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Allegations statement, verified documents, and investigation trail
            </p>
          </div>

          {/* Formal Complaint Statement Box */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '14px', marginBottom: '14px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
              Specific Grievance Allegation
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
              {app.complaint_description || 'Detailed complaint narrative registered with AICTE.'}
            </p>
          </div>

          {/* Next Action Required & Last Action Taken */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
            <div style={{ backgroundColor: '#f8fafc', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Last Action Taken
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', marginTop: '4px', fontWeight: 600 }}>
                {app.last_action_taken || 'Complaint docketed'}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {app.last_action_timestamp ? new Date(app.last_action_timestamp).toLocaleString() : ''}
              </div>
            </div>

            <div style={{ backgroundColor: '#eff6ff', padding: '10px 12px', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#1e40af', textTransform: 'uppercase' }}>
                Next Action Required
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#1e3a8a', marginTop: '4px', fontWeight: 600 }}>
                {app.next_action_required || 'Review of institution explanation response.'}
              </div>
            </div>
          </div>

          {/* Document Preview Canvas */}
          <div style={{ flex: 1, minHeight: '340px' }}>
            <DocumentViewer 
              document={selectedDocument}
              onCorrectField={() => {}}
              onTriggerAuthorityVerification={() => {}}
            />
          </div>
        </div>

        {/* PANEL 3: Overlap Detection, Deadlines & Authorized Actions (RIGHT PANEL) */}
        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: '720px', overflowY: 'auto' }}>
          <div style={{ marginBottom: '12px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
              Cross-Bureau Overlap &amp; Actions
            </h3>
            <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Automated overlap detection and authorized decisions
            </p>
          </div>

          {/* THE MANDATORY OVERLAP DETECTION CARD */}
          <div style={{
            backgroundColor: hasOverlap ? '#fffbeb' : '#f8fafc',
            border: `1px solid ${hasOverlap ? '#fde68a' : 'var(--border-subtle)'}`,
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <AlertTriangle size={16} color={hasOverlap ? '#d97706' : '#64748b'} />
              <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: hasOverlap ? '#92400e' : 'var(--text-primary)' }}>
                {hasOverlap ? 'Potential Overlapping Cases — Coordination Required' : 'No Active Overlap Detected'}
              </div>
            </div>

            {hasOverlap ? (
              <>
                <p style={{ fontSize: '0.75rem', color: '#92400e', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                  Institution <strong>{app.institution?.name}</strong> (AICTE ID: {app.institution?.code}) has concurrent active complaints across multiple Bureaus/Cells.
                </p>

                {/* Overlapping cases list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                  {/* Current case */}
                  <div style={{ backgroundColor: '#ffffff', padding: '8px 10px', borderRadius: '4px', border: '1px solid #fde68a', fontSize: '0.75rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>This Case: {caseId}</div>
                    <div style={{ color: 'var(--text-muted)' }}>Bureau: <strong>{currentBureau}</strong> • Status: {app.status}</div>
                  </div>

                  {/* Other overlapping case(s) */}
                  {concurrentInstitutionCases.map(oc => (
                    <div key={oc.id} style={{ backgroundColor: '#ffffff', padding: '8px 10px', borderRadius: '4px', border: '1px solid #fde68a', fontSize: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Link to={`/applications/${oc.id}`} style={{ fontWeight: 700, color: '#0284c7' }}>
                          Concurrent Case: {oc.case_id || oc.application_number}
                        </Link>
                        <span className="badge badge-info" style={{ fontSize: '0.625rem' }}>{oc.status}</span>
                      </div>
                      <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                        Bureau: <strong>{oc.bureau || oc.receiving_bureau}</strong>
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.6875rem', marginTop: '2px' }}>
                        Officer: {oc.assigned_officer || 'Desk In-Charge'}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Overlap Review Controls */}
                <div style={{ borderTop: '1px solid #fde68a', paddingTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleReviewOverlapDecision('Confirmed')}
                    className="btn btn-outline-clean btn-xs"
                    style={{ backgroundColor: '#ffffff', color: '#065f46', borderColor: '#a7f3d0' }}
                  >
                    ✓ Confirm Overlap
                  </button>
                  <button
                    onClick={() => handleReviewOverlapDecision('Dismissed')}
                    className="btn btn-outline-clean btn-xs"
                    style={{ backgroundColor: '#ffffff', color: '#991b1b', borderColor: '#fecaca' }}
                  >
                    Dismiss
                  </button>
                  {concurrentInstitutionCases.length > 0 && (
                    <button
                      onClick={() => handleExecuteLinkCases(concurrentInstitutionCases[0].case_id || concurrentInstitutionCases[0].application_number)}
                      className="btn btn-emerald-primary btn-xs"
                    >
                      🔗 Link Cases Now
                    </button>
                  )}
                </div>
              </>
            ) : (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                Deterministic scanning against AICTE ID and normalized institution titles found no duplicate complaints across other Bureaus.
              </p>
            )}
          </div>

          {/* Quick Status Update Section */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Update Case Status
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {(['Received', 'Pending', 'Under Process', 'Awaiting Information'] as ComplaintStatus[]).map(st => (
                <button
                  key={st}
                  disabled={app.status === st}
                  onClick={() => handleQuickStatusChange(st)}
                  className={`btn btn-xs ${app.status === st ? 'btn-primary' : 'btn-outline-clean'}`}
                  style={{ fontSize: '0.6875rem' }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Inter-Bureau Transfer History Snippet */}
          {app.transfers && app.transfers.length > 0 && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                Transfer History ({app.transfers.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {app.transfers.map(tr => (
                  <div key={tr.id} style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '4px', padding: '8px 10px', fontSize: '0.75rem' }}>
                    <div style={{ fontWeight: 700, color: '#92400e' }}>
                      {tr.from_bureau} ➔ {tr.to_bureau}
                    </div>
                    <div style={{ color: '#78350f', marginTop: '2px' }}>{tr.transfer_reason}</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      By: {tr.transferred_by} • {new Date(tr.transferred_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Escalation Record Snippet */}
          {app.escalations && app.escalations.length > 0 && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', marginBottom: '6px' }}>
                Escalation Notice
              </div>
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', padding: '8px 10px', fontSize: '0.75rem' }}>
                <div style={{ fontWeight: 700, color: '#991b1b' }}>
                  Escalated to: {app.escalations[0].escalated_to}
                </div>
                <div style={{ color: '#7f1d1d', marginTop: '2px' }}>{app.escalations[0].escalation_reason}</div>
              </div>
            </div>
          )}

          {/* Formal Disposal Order Display */}
          {app.disposal_decision && (
            <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '4px', padding: '10px 12px', fontSize: '0.75rem', marginTop: 'auto' }}>
              <div style={{ fontWeight: 700, color: '#065f46' }}>
                Formal Disposal Order: {app.disposal_decision.disposal_order_number}
              </div>
              <div style={{ fontWeight: 600, color: '#047857', marginTop: '2px' }}>
                Decision: {app.disposal_decision.decision}
              </div>
              <div style={{ color: '#064e3b', marginTop: '4px' }}>
                {app.disposal_decision.remarks}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Disposed by: {app.disposal_decision.disposed_by} on {new Date(app.disposal_decision.disposed_at).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECONDARY DRAWER: Overlap Matrix & Audit History */}
      {activeDrawer && (
        <div className="drawer-overlay" onClick={() => setActiveDrawer(null)}>
          <div className="drawer-panel" onClick={e => e.stopPropagation()}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '16px 20px', 
              borderBottom: '1px solid var(--border-subtle)' 
            }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                {activeDrawer === 'cross_comparison' && 'Cross-Bureau Overlap Analysis Matrix'}
                {activeDrawer === 'audit_history' && 'Chronological Action & Transfer History'}
                {activeDrawer === 'clarifications' && 'Inter-Bureau Communication Desk'}
                {activeDrawer === 'rules' && 'AICTE Complaint Disposal Timeline Norms'}
              </h2>
              <button 
                onClick={() => setActiveDrawer(null)}
                className="btn btn-outline-clean btn-xs"
                style={{ borderRadius: '50%', width: '28px', height: '28px', padding: 0 }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              {activeDrawer === 'cross_comparison' && (
                <div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                    Showing all concurrent active and historical complaints docketed against <strong>{app.institution?.name}</strong> (AICTE ID: {app.institution?.code}) across Regulation Bureau, PGRC, and Regional Offices.
                  </p>
                  <table className="clean-data-table" style={{ fontSize: '0.8125rem' }}>
                    <thead>
                      <tr>
                        <th>Case ID</th>
                        <th>Bureau</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Officer</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ backgroundColor: '#eff6ff' }}>
                        <td><strong>{caseId} (Current)</strong></td>
                        <td>{currentBureau}</td>
                        <td>{app.complaint_category}</td>
                        <td>{getStatusBadge(app.status)}</td>
                        <td>{app.assigned_officer}</td>
                        <td>—</td>
                      </tr>
                      {concurrentInstitutionCases.map(oc => (
                        <tr key={oc.id}>
                          <td><strong>{oc.case_id || oc.application_number}</strong></td>
                          <td>{oc.bureau || oc.receiving_bureau}</td>
                          <td>{oc.complaint_category}</td>
                          <td>{getStatusBadge(oc.status)}</td>
                          <td>{oc.assigned_officer}</td>
                          <td>
                            <button
                              onClick={() => handleExecuteLinkCases(oc.case_id || oc.application_number)}
                              className="btn btn-outline-clean btn-xs"
                            >
                              Link Case
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeDrawer === 'audit_history' && (
                <div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                    Immutable chronological record of registrations, assignments, inter-bureau transfers, status modifications, and officer notes.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(app.status_history || []).map((sh, idx) => (
                      <div key={sh.id || idx} style={{ borderLeft: '3px solid #0284c7', paddingLeft: '12px', fontSize: '0.8125rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {sh.new_status ? `Status: ${sh.new_status}` : 'Action Recorded'}
                        </div>
                        <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                          {sh.reason}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Actor: {sh.actor_name} • {new Date(sh.created_at).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeDrawer === 'clarifications' && (
                <div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                    Transmit internal inquiry notes, joint inspection directives, or coordination requests to other Bureaus/Cells.
                  </p>
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label className="form-label">Target Bureau/Cell</label>
                    <select 
                      className="form-input"
                      value={interBureauRecipient}
                      onChange={e => setInterBureauRecipient(e.target.value)}
                    >
                      <option value="Regulation Bureau (RB)">Regulation Bureau (RB)</option>
                      <option value="Public Grievance Redressal Cell (PGRC)">Public Grievance Redressal Cell (PGRC)</option>
                      <option value="Vigilance Cell">Vigilance Cell</option>
                      <option value="Regional Office (Northern)">Regional Office (Northern)</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label className="form-label">Subject</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Joint Scrutiny on Fee Structure & Unapproved Division"
                      value={interBureauSubject}
                      onChange={e => setInterBureauSubject(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label className="form-label">Message Content</label>
                    <textarea 
                      className="form-input" 
                      rows={4}
                      placeholder="Enter internal communication directive..."
                      value={interBureauMessage}
                      onChange={e => setInterBureauMessage(e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={() => {
                      if (!interBureauSubject || !interBureauMessage) {
                        alert('Please fill out subject and message.');
                        return;
                      }
                      alert(`Message dispatched to ${interBureauRecipient}! Notification recorded.`);
                      setInterBureauSubject('');
                      setInterBureauMessage('');
                      setActiveDrawer(null);
                    }}
                    className="btn btn-emerald-primary btn-sm"
                  >
                    Send Bureau Communication
                  </button>
                </div>
              )}

              {activeDrawer === 'rules' && (
                <div style={{ fontSize: '0.8125rem' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-primary)' }}>Standard Grievance Disposal Norms (APH 2026-27)</h4>
                  <ul style={{ paddingLeft: '20px', lineHeight: 1.6, color: 'var(--text-muted)' }}>
                    <li><strong>Initial Scrutiny &amp; Docketing:</strong> Within 48 hours of receipt.</li>
                    <li><strong>Explanation Notice to Institution:</strong> 7 days response window.</li>
                    <li><strong>Cross-Bureau Overlap Coordination:</strong> Immediate hold on conflicting unilateral decisions; mandatory consultation within 5 business days.</li>
                    <li><strong>Physical Fact-Finding / Inspection:</strong> Within 15 calendar days where prima facie violation is established.</li>
                    <li><strong>Final Disposal Order Target:</strong> Standard 30 days; Urgent escalations 15 days.</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Inter-Bureau Transfer Modal */}
      {showTransferModal && (
        <div className="modal-overlay" onClick={() => setShowTransferModal(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <form onSubmit={handleExecuteTransfer} className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title">Transfer Case to Another Bureau / Cell</h3>
                <button type="button" onClick={() => setShowTransferModal(false)} className="close-btn">✕</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Current Responsible Bureau</label>
                  <input type="text" disabled value={currentBureau} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Transfer To Bureau / Cell *</label>
                  <select 
                    className="form-input" 
                    value={transferToBureau}
                    onChange={e => setTransferToBureau(e.target.value)}
                  >
                    <option value="Regulation Bureau (RB)">Regulation Bureau (RB)</option>
                    <option value="Public Grievance Redressal Cell (PGRC)">Public Grievance Redressal Cell (PGRC)</option>
                    <option value="Vigilance Cell">Vigilance Cell</option>
                    <option value="Regional Office (Northern)">Regional Office (Northern)</option>
                    <option value="Regional Office (Western)">Regional Office (Western)</option>
                    <option value="Approval Bureau">Approval Bureau</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Statutory Reason for Transfer *</label>
                  <textarea 
                    required 
                    rows={4} 
                    className="form-input"
                    placeholder="Explain statutory jurisdiction or regulatory scope requiring transfer..."
                    value={transferReason}
                    onChange={e => setTransferReason(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowTransferModal(false)} className="btn btn-outline-clean btn-sm">Cancel</button>
                <button type="submit" disabled={isTransferring} className="btn btn-emerald-primary btn-sm">
                  {isTransferring ? 'Transferring...' : 'Execute Case Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Escalation Modal */}
      {showEscalateModal && (
        <div className="modal-overlay" onClick={() => setShowEscalateModal(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <form onSubmit={handleExecuteEscalation} className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title">Escalate Complaint to Higher Authority</h3>
                <button type="button" onClick={() => setShowEscalateModal(false)} className="close-btn">✕</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Escalate To *</label>
                  <select 
                    className="form-input"
                    value={escalateTo}
                    onChange={e => setEscalateTo(e.target.value)}
                  >
                    <option value="Member Secretary & Bureau Head (RB)">Member Secretary &amp; Bureau Head (RB)</option>
                    <option value="Vice Chairman, AICTE">Vice Chairman, AICTE</option>
                    <option value="Chairman, AICTE">Chairman, AICTE</option>
                    <option value="Chief Vigilance Officer (CVO)">Chief Vigilance Officer (CVO)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Reason for High-Level Escalation *</label>
                  <textarea 
                    required 
                    rows={4} 
                    className="form-input"
                    placeholder="Specify urgency, severe statutory non-compliance, or police/regulatory coordination required..."
                    value={escalationReason}
                    onChange={e => setEscalationReason(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowEscalateModal(false)} className="btn btn-outline-clean btn-sm">Cancel</button>
                <button type="submit" disabled={isEscalating} className="btn btn-emerald-primary btn-sm" style={{ backgroundColor: '#dc2626' }}>
                  {isEscalating ? 'Escalating...' : 'Confirm Escalation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Formal Disposal Order Modal */}
      {showDisposalModal && (
        <div className="modal-overlay" onClick={() => setShowDisposalModal(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <form onSubmit={handleExecuteDisposal} className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title">Record Formal Complaint Disposal Decision</h3>
                <button type="button" onClick={() => setShowDisposalModal(false)} className="close-btn">✕</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Disposal Finding / Decision *</label>
                  <select 
                    className="form-input"
                    value={disposalDecision}
                    onChange={e => setDisposalDecision(e.target.value as any)}
                  >
                    <option value="Resolved upon Rectification">Resolved upon Rectification (Refund/Correction Verified)</option>
                    <option value="Substantiated - Directive Issued">Substantiated - Formal Directive / Sanction Issued</option>
                    <option value="Unsubstantiated / Closed">Unsubstantiated / Dismissed upon Inquiry</option>
                    <option value="Referred to State Authority">Referred to State DTE / Judicial Forum</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Disposal Order Number (Optional)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. AICTE/PGRC/DISP/2026/0419"
                    value={disposalOrderNo}
                    onChange={e => setDisposalOrderNo(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Statutory Remarks &amp; Compliance Notes *</label>
                  <textarea 
                    required 
                    rows={4} 
                    className="form-input"
                    placeholder="Enter final order text, proof verification notes, and conditions..."
                    value={disposalRemarks}
                    onChange={e => setDisposalRemarks(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowDisposalModal(false)} className="btn btn-outline-clean btn-sm">Cancel</button>
                <button type="submit" disabled={isDisposing} className="btn btn-emerald-primary btn-sm">
                  {isDisposing ? 'Saving...' : 'Record Final Disposal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Add Officer Remark Modal */}
      {showRemarkModal && (
        <div className="modal-overlay" onClick={() => setShowRemarkModal(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <form onSubmit={handleAddOfficerRemark} className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title">Add Official Officer Remark</h3>
                <button type="button" onClick={() => setShowRemarkModal(false)} className="close-btn">✕</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Remark / Inquiry Note *</label>
                  <textarea 
                    required 
                    rows={4} 
                    className="form-input"
                    placeholder="Enter observation, telephonic inquiry summary, or compliance reminder..."
                    value={remarkText}
                    onChange={e => setRemarkText(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowRemarkModal(false)} className="btn btn-outline-clean btn-sm">Cancel</button>
                <button type="submit" disabled={isAddingRemark} className="btn btn-emerald-primary btn-sm">
                  {isAddingRemark ? 'Saving...' : 'Save Remark'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
