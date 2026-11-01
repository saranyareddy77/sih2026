// AICTE SmartVerify — Scrutiny Command Center & Central Monitoring Dashboard
// SIH Problem Statement 26261: AI-Powered Application Validation, Document Authentication & Regulatory Scrutiny

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Eye, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  FileCheck,
  RefreshCw,
  Building,
  ArrowRight,
  Shield,
  FileText,
  AlertCircle,
  Sparkles,
  Layers,
  ChevronRight,
  Users,
  Download,
  AlertOctagon,
  ArrowLeftRight,
  MessageSquare,
  Check,
  X,
  FileCheck2,
  ClipboardList,
  Send,
  ExternalLink
} from 'lucide-react';
import { Application, ApplicationStatus, BureauCell, ComplaintCategory } from '../types';
import { applicationService } from '../services/applicationService';
import { complaintService } from '../services/complaintService';
import { authService } from '../services/authService';
import { notificationService } from '../services/notificationService';
import { SYNTHETIC_INSTITUTIONS } from '../data/syntheticDemoData';

type MainTab = 'scrutiny_queue' | 'complaint_monitoring';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const isSuperAdmin = authService.isSuperAdmin();

  // Active top-level desk tab
  const [activeTab, setActiveTab] = useState<MainTab>('scrutiny_queue');

  // -------------------------------------------------------------
  // APPROVAL APPLICATIONS SCRUTINY DESK STATE
  // -------------------------------------------------------------
  const [approvalApps, setApprovalApps] = useState<Application[]>([]);
  const [approvalLoading, setApprovalLoading] = useState<boolean>(true);
  const [approvalSearchTerm, setApprovalSearchTerm] = useState<string>('');
  const [approvalStatusFilter, setApprovalStatusFilter] = useState<string>('All');
  const [approvalTypeFilter, setApprovalTypeFilter] = useState<string>('All');
  const [approvalYearFilter, setApprovalYearFilter] = useState<string>('All');
  const [approvalRegionFilter, setApprovalRegionFilter] = useState<string>('All');

  // Clarification Directive modal state
  const [clarificationModalApp, setClarificationModalApp] = useState<Application | null>(null);
  const [clarificationQuery, setClarificationQuery] = useState<string>('');
  const [clarificationDeadlineDays, setClarificationDeadlineDays] = useState<number>(7);
  const [isSubmittingClarification, setIsSubmittingClarification] = useState<boolean>(false);

  // Scrutiny Decision modal state
  const [decisionModalApp, setDecisionModalApp] = useState<Application | null>(null);
  const [decisionType, setDecisionType] = useState<'Approved' | 'Action Required' | 'Needs Further Inspection'>('Approved');
  const [decisionRemarks, setDecisionRemarks] = useState<string>('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState<boolean>(false);

  // -------------------------------------------------------------
  // CENTRAL COMPLAINT & OVERLAP MONITORING STATE
  // -------------------------------------------------------------
  const [complaints, setComplaints] = useState<Application[]>([]);
  const [complaintsLoading, setComplaintsLoading] = useState<boolean>(true);
  const [complaintSearchTerm, setComplaintSearchTerm] = useState<string>('');
  const [complaintStatusFilter, setComplaintStatusFilter] = useState<string>('All');
  const [complaintInstitutionFilter, setComplaintInstitutionFilter] = useState<string>('All');
  const [complaintBureauFilter, setComplaintBureauFilter] = useState<string>('All');
  const [complaintCategoryFilter, setComplaintCategoryFilter] = useState<string>('All');
  const [complaintRegionFilter, setComplaintRegionFilter] = useState<string>('All');
  const [overlapOnly, setOverlapOnly] = useState<boolean>(false);
  const [overdueOnly, setOverdueOnly] = useState<boolean>(false);

  // Load Approval Applications for Scrutiny Desk
  const loadApprovalData = async () => {
    setApprovalLoading(true);
    try {
      const data = await applicationService.getApplications({
        docketType: 'approvals',
        status: approvalStatusFilter === 'All' ? undefined : (approvalStatusFilter as ApplicationStatus),
        applicationType: approvalTypeFilter === 'All' ? undefined : approvalTypeFilter,
        searchTerm: approvalSearchTerm
      });
      // Filter out pure complaint dockets if any
      const filtered = data.filter(a => !a.case_id || a.application_type);
      setApprovalApps(filtered);
    } catch (e) {
      console.error('Failed loading approval applications queue:', e);
    } finally {
      setApprovalLoading(false);
    }
  };

  // Load Complaints for Overlap Desk
  const loadComplaintData = async () => {
    setComplaintsLoading(true);
    try {
      const data = await applicationService.getApplications({
        docketType: 'complaints',
        status: complaintStatusFilter === 'All' ? undefined : (complaintStatusFilter as ApplicationStatus),
        institutionId: complaintInstitutionFilter === 'All' ? undefined : complaintInstitutionFilter,
        bureau: complaintBureauFilter === 'All' ? undefined : complaintBureauFilter,
        category: complaintCategoryFilter === 'All' ? undefined : complaintCategoryFilter,
        region: complaintRegionFilter === 'All' ? undefined : complaintRegionFilter,
        overlapOnly: overlapOnly ? true : undefined,
        overdueOnly: overdueOnly ? true : undefined,
        searchTerm: complaintSearchTerm
      });
      setComplaints(data);
    } catch (e) {
      console.error('Failed loading complaint monitoring records:', e);
    } finally {
      setComplaintsLoading(false);
    }
  };

  useEffect(() => {
    loadApprovalData();
  }, [approvalSearchTerm, approvalStatusFilter, approvalTypeFilter, approvalYearFilter, approvalRegionFilter]);

  useEffect(() => {
    loadComplaintData();
  }, [complaintSearchTerm, complaintStatusFilter, complaintInstitutionFilter, complaintBureauFilter, complaintCategoryFilter, complaintRegionFilter, overlapOnly, overdueOnly]);

  // Operational metrics derived directly and dynamically
  const complaintMetrics = complaintService.calculateMetrics();

  // Metrics for Approval Applications
  const totalApprovalApps = approvalApps.length;
  const underScrutinyCount = approvalApps.filter(a => 
    a.status === 'Under Scrutiny' || a.status === 'Submitted' || a.status === 'Validation Required' || a.status === 'Under Process'
  ).length;
  const clarificationRequiredCount = approvalApps.filter(a => a.status === 'Clarification Required').length;
  const resubmittedCount = approvalApps.filter(a => a.status === 'Resubmitted').length;
  const verifiedCount = approvalApps.filter(a => a.status === 'Verified' || a.status === 'Review Completed' || a.status === 'Disposed').length;

  const getStatusBadge = (status: ApplicationStatus | string) => {
    switch (status) {
      case 'Verified':
      case 'Review Completed':
      case 'Disposed':
      case 'Closed':
        return <span className="badge badge-passed">{status}</span>;
      case 'Clarification Required':
      case 'Action Required':
      case 'Escalated':
        return <span className="badge badge-failed">{status}</span>;
      case 'Resubmitted':
        return <span className="badge badge-needs-review" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>Resubmitted</span>;
      case 'Transferred':
        return <span className="badge badge-needs-review" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>Transferred</span>;
      case 'Awaiting Information':
      case 'Needs Review':
      case 'Authenticity Confirmation Pending':
        return <span className="badge badge-needs-review">{status}</span>;
      case 'Under Scrutiny':
      case 'Under Process':
      case 'Under Review':
      case 'Awaiting Official Review':
      case 'Submitted':
        return <span className="badge badge-info">{status}</span>;
      case 'Ready for Submission':
        return <span className="badge badge-passed" style={{ backgroundColor: '#ecfdf5', color: '#047857' }}>Ready for Submission</span>;
      case 'Draft':
      case 'Validation Required':
      default:
        return <span className="badge badge-draft">{status || 'Draft'}</span>;
    }
  };

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'Urgent':
        return <span className="badge badge-failed" style={{ fontSize: '0.6875rem' }}>Urgent</span>;
      case 'High':
        return <span className="badge badge-needs-review" style={{ fontSize: '0.6875rem' }}>High</span>;
      case 'Medium':
        return <span className="badge badge-info" style={{ fontSize: '0.6875rem' }}>Medium</span>;
      default:
        return <span className="badge badge-draft" style={{ fontSize: '0.6875rem' }}>Low</span>;
    }
  };

  // Jump to priority complaint requiring immediate attention (Overlaps or Overdue)
  const handleReviewPriority = () => {
    const priorityCase = complaints.find(c => c.overlap_status === 'Potential Overlap Detected') ||
                         complaints.find(c => c.is_overdue) ||
                         complaints.find(c => c.status === 'Escalated') ||
                         complaints[0];
    if (priorityCase) {
      navigate(`/applications/${priorityCase.id}`);
    }
  };

  // Export filtered list to CSV
  const handleExportCSV = () => {
    const csvData = complaintService.exportComplaintsAsCSV(complaints);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `AICTE_Complaint_Monitoring_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dispatch Clarification Directive
  const handleDispatchClarification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clarificationModalApp || !clarificationQuery.trim()) return;

    setIsSubmittingClarification(true);
    try {
      const officerName = currentUser?.full_name || 'Scrutiny Officer';
      await applicationService.requestClarification(
        clarificationModalApp.id,
        clarificationQuery.trim(),
        officerName
      );
      setClarificationModalApp(null);
      setClarificationQuery('');
      await loadApprovalData();
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch clarification directive');
    } finally {
      setIsSubmittingClarification(false);
    }
  };

  // Record Scrutiny Decision
  const handleRecordScrutinyDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decisionModalApp) return;

    setIsSubmittingDecision(true);
    try {
      const officerName = currentUser?.full_name || 'Scrutiny Officer';
      await applicationService.recordAdminReview(
        decisionModalApp.id,
        officerName,
        currentUser?.id,
        'Final Decision',
        decisionRemarks.trim() || `Official scrutiny determination: ${decisionType}`,
        decisionType
      );
      setDecisionModalApp(null);
      setDecisionRemarks('');
      await loadApprovalData();
    } catch (err: any) {
      alert(err.message || 'Failed to record scrutiny decision');
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const activeOverlaps = complaints.filter(c => c.overlap_status === 'Potential Overlap Detected' || c.overlap_status === 'Confirmed Overlap - Coordinated');

  return (
    <div className="app-container" style={{ paddingBottom: '60px' }}>
      {/* Top Header */}
      <div className="dashboard-header-clean">
        <div className="header-title-area">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-info" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Regulation Bureau Desk
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              • Problem Statement 26261
            </span>
          </div>
          <h1 className="dashboard-main-title">
            {isSuperAdmin ? 'Central Scrutiny Command & Monitoring Center' : 'AICTE Scrutiny Officer Workbench'}
          </h1>
          <p className="dashboard-sub-title">
            Statutory AICTE regulatory approval scrutiny, AI-driven document authentication, and cross-bureau complaint coordination.
          </p>
        </div>

        <div className="header-action-group">
          <button 
            onClick={() => {
              if (activeTab === 'scrutiny_queue') loadApprovalData();
              else loadComplaintData();
            }} 
            className="btn btn-outline-clean btn-sm"
            title="Refresh active queue"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        borderBottom: '2px solid var(--border-subtle)', 
        marginBottom: '24px' 
      }}>
        <button
          onClick={() => setActiveTab('scrutiny_queue')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'scrutiny_queue' ? '3px solid #059669' : '3px solid transparent',
            color: activeTab === 'scrutiny_queue' ? '#059669' : 'var(--text-secondary)',
            fontWeight: activeTab === 'scrutiny_queue' ? 700 : 500,
            fontSize: '0.9375rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '-2px'
          }}
        >
          <ClipboardList size={18} />
          Approval Applications Scrutiny Queue
          {approvalApps.length > 0 && (
            <span style={{
              backgroundColor: activeTab === 'scrutiny_queue' ? '#ecfdf5' : '#f1f5f9',
              color: activeTab === 'scrutiny_queue' ? '#047857' : '#475569',
              fontSize: '0.6875rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '999px'
            }}>
              {approvalApps.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('complaint_monitoring')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'complaint_monitoring' ? '3px solid #059669' : '3px solid transparent',
            color: activeTab === 'complaint_monitoring' ? '#059669' : 'var(--text-secondary)',
            fontWeight: activeTab === 'complaint_monitoring' ? 700 : 500,
            fontSize: '0.9375rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '-2px'
          }}
        >
          <Layers size={18} />
          Central Complaint &amp; Overlap Monitoring
          {activeOverlaps.length > 0 && (
            <span style={{
              backgroundColor: '#fef3c7',
              color: '#b45309',
              fontSize: '0.6875rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '999px',
              border: '1px solid #fde68a'
            }}>
              ⚠️ {activeOverlaps.length} Overlaps
            </span>
          )}
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: APPROVAL APPLICATIONS SCRUTINY QUEUE                    */}
      {/* ============================================================== */}
      {activeTab === 'scrutiny_queue' && (
        <>
          {/* Scrutiny Metrics Grid */}
          <div className="metrics-grid-5">
            <div className="metric-box">
              <div className="metric-label">Applications in Queue</div>
              <div className="metric-val">{totalApprovalApps}</div>
              <div className="metric-sub">Approval dossiers received</div>
            </div>

            <div className="metric-box border-blue">
              <div className="metric-label text-blue">Under Scrutiny</div>
              <div className="metric-val text-blue">{underScrutinyCount}</div>
              <div className="metric-sub">Awaiting officer review</div>
            </div>

            <div className="metric-box border-rose">
              <div className="metric-label text-rose">Clarification Required</div>
              <div className="metric-val text-rose">{clarificationRequiredCount}</div>
              <div className="metric-sub">Pending institute reply</div>
            </div>

            <div className="metric-box border-amber">
              <div className="metric-label text-amber">Responses Resubmitted</div>
              <div className="metric-val text-amber">{resubmittedCount}</div>
              <div className="metric-sub">Institute replied with evidence</div>
            </div>

            <div className="metric-box border-emerald">
              <div className="metric-label text-emerald">Verified / Completed</div>
              <div className="metric-val text-emerald">{verifiedCount}</div>
              <div className="metric-sub">Scrutiny orders recorded</div>
            </div>
          </div>

          {/* Table Card */}
          <div className="dashboard-content-card">
            {/* Header & Quick Tabs */}
            <div className="dashboard-table-header">
              <div>
                <h2 className="table-heading">Regulatory Approval Scrutiny Dossiers</h2>
                <div className="table-subheading">
                  Showing {approvalApps.length} {approvalApps.length === 1 ? 'application' : 'applications'} across Extension of Approval, New Establishments &amp; Intake Variations
                </div>
              </div>

              <div className="table-quick-tabs">
                {[
                  { id: 'All', label: 'All Dossiers' },
                  { id: 'Under Scrutiny', label: 'Under Scrutiny' },
                  { id: 'Clarification Required', label: 'Clarification Required' },
                  { id: 'Resubmitted', label: 'Resubmitted' },
                  { id: 'Verified', label: 'Verified' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setApprovalStatusFilter(tab.id)}
                    className={`quick-tab-btn ${approvalStatusFilter === tab.id ? 'active' : ''}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Toolbar */}
            <div className="filter-toolbar-grid">
              <div className="table-search-box">
                <Search size={15} className="search-icon" />
                <input
                  type="text"
                  className="table-search-input"
                  placeholder="Search by App No (e.g. AICTE/2026/APP-1001), Institution, or AICTE ID..."
                  value={approvalSearchTerm}
                  onChange={e => setApprovalSearchTerm(e.target.value)}
                />
              </div>

              <select
                className="filter-select"
                value={approvalTypeFilter}
                onChange={e => setApprovalTypeFilter(e.target.value)}
              >
                <option value="All">All Application Categories</option>
                <option value="Extension of Approval (EoA)">Extension of Approval (EoA)</option>
                <option value="New Technical Institution">New Technical Institution</option>
                <option value="Increase in Intake / Additional Course">Increase in Intake / Additional Course</option>
                <option value="Change in Site / Campus">Change in Site / Campus</option>
                <option value="Closure of Course / Institution">Closure of Course / Institution</option>
              </select>

              <select
                className="filter-select"
                value={approvalYearFilter}
                onChange={e => setApprovalYearFilter(e.target.value)}
              >
                <option value="All">All Academic Years</option>
                <option value="2026-2027">2026-2027</option>
                <option value="2025-2026">2025-2026</option>
              </select>
            </div>

            {/* Applications Table */}
            {approvalLoading ? (
              <div className="empty-loading-state">
                <RefreshCw size={24} className="spin text-emerald-600" />
                <p>Loading regulatory dossiers and verifying submission integrity...</p>
              </div>
            ) : approvalApps.length === 0 ? (
              <div className="empty-loading-state">
                <FileText size={36} className="text-muted" />
                <h3 className="empty-title">No Applications Found</h3>
                <p className="empty-desc">No applications match your active filter criteria. Try resetting filters or search terms.</p>
                <button 
                  onClick={() => {
                    setApprovalStatusFilter('All');
                    setApprovalTypeFilter('All');
                    setApprovalYearFilter('All');
                    setApprovalSearchTerm('');
                  }}
                  className="btn btn-outline-clean btn-xs"
                  style={{ marginTop: '12px' }}
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="table-responsive-wrapper">
                <table className="clean-data-table">
                  <thead>
                    <tr>
                      <th>Application &amp; Category</th>
                      <th>Institution &amp; AICTE ID</th>
                      <th>Submission &amp; Snapshot</th>
                      <th>Validation &amp; Findings</th>
                      <th>Status &amp; Directives</th>
                      <th style={{ textAlign: 'right' }}>Scrutiny Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvalApps.map(app => {
                      const appNo = app.application_number || app.id;
                      const instName = app.institution?.name || 'Technical Institution';
                      const instCode = app.institution?.code || '—';
                      const snapshot = app.submission_snapshot;
                      const hasClarification = !!app.clarification_request;
                      const hasResponse = !!app.clarification_response;

                      return (
                        <tr key={app.id}>
                          <td>
                            <div className="app-cell-title">
                              <Link to={`/applications/${app.id}`} className="app-link" style={{ fontWeight: 700 }}>
                                {appNo}
                              </Link>
                              {snapshot && (
                                <span 
                                  className="badge" 
                                  style={{ 
                                    backgroundColor: '#eff6ff', 
                                    color: '#1d4ed8', 
                                    fontSize: '0.6875rem',
                                    border: '1px solid #bfdbfe',
                                    marginLeft: '6px'
                                  }}
                                  title="Submission snapshot cryptographically frozen"
                                >
                                  Frozen v{snapshot.version || 1}
                                </span>
                              )}
                            </div>
                            <div className="app-cell-type" style={{ fontWeight: 600 }}>
                              {app.application_type || 'Extension of Approval (EoA)'}
                            </div>
                            <div className="app-cell-year" style={{ color: 'var(--text-muted)' }}>
                              AY: {app.academic_year || '2026-2027'}
                            </div>
                          </td>

                          <td>
                            <div className="app-cell-inst-name" style={{ fontWeight: 600 }}>
                              {instName}
                            </div>
                            <div className="app-cell-inst-code">
                              AICTE ID: <strong>{instCode}</strong>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {app.institution?.state || 'Northern Region'}
                            </div>
                          </td>

                          <td>
                            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {app.submission_date ? new Date(app.submission_date).toLocaleDateString() : 'Draft / In Progress'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              By: {snapshot?.submitted_by || 'Authorized Submitter'}
                            </div>
                            {app.documents && (
                              <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '2px', fontWeight: 600 }}>
                                📁 {app.documents.length} Dossier Documents
                              </div>
                            )}
                          </td>

                          <td>
                            <div>
                              {app.overall_validation_outcome === 'Passed' ? (
                                <span className="badge badge-passed">Automated Checks: Passed</span>
                              ) : app.overall_validation_outcome === 'Failed' ? (
                                <span className="badge badge-failed">Failed Validation</span>
                              ) : (
                                <span className="badge badge-needs-review">Needs Review</span>
                              )}
                            </div>
                            {app.findings && app.findings.length > 0 && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                {app.findings.length} Regulatory Findings ({app.findings.filter(f => f.severity === 'High').length} High Severity)
                              </div>
                            )}
                          </td>

                          <td>
                            <div>{getStatusBadge(app.status)}</div>
                            {hasClarification && app.status === 'Clarification Required' && (
                              <div style={{ 
                                fontSize: '0.75rem', 
                                color: '#e11d48', 
                                marginTop: '4px',
                                backgroundColor: '#fff1f2',
                                padding: '3px 6px',
                                borderRadius: '4px',
                                border: '1px solid #fecdd3'
                              }}>
                                ⚠️ Directive Dispatched: Pending Reply
                              </div>
                            )}
                            {hasResponse && app.status === 'Resubmitted' && (
                              <div style={{ 
                                fontSize: '0.75rem', 
                                color: '#047857', 
                                marginTop: '4px',
                                backgroundColor: '#ecfdf5',
                                padding: '3px 6px',
                                borderRadius: '4px',
                                border: '1px solid #a7f3d0'
                              }}>
                                ✓ Institution Reply Received
                              </div>
                            )}
                          </td>

                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                              <Link
                                to={`/applications/${app.id}`}
                                className="btn btn-outline-clean btn-xs"
                                title="Open full application workbench"
                              >
                                <Eye size={12} />
                                Inspect Dossier
                              </Link>

                              <button
                                onClick={() => {
                                  setClarificationModalApp(app);
                                  setClarificationQuery('');
                                }}
                                className="btn btn-outline-clean btn-xs"
                                style={{ borderColor: '#d97706', color: '#92400e' }}
                                title="Issue statutory clarification query"
                              >
                                <MessageSquare size={12} />
                                Issue Directive
                              </button>

                              <button
                                onClick={() => {
                                  setDecisionModalApp(app);
                                  setDecisionRemarks('');
                                }}
                                className="btn btn-emerald-primary btn-xs"
                                title="Record official scrutiny decision"
                              >
                                <CheckCircle2 size={12} />
                                Record Decision
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ============================================================== */}
      {/* TAB 2: CENTRAL COMPLAINT & OVERLAP MONITORING                  */}
      {/* ============================================================== */}
      {activeTab === 'complaint_monitoring' && (
        <>
          {/* Action Row */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '16px' }}>
            <button 
              onClick={handleReviewPriority}
              className="btn btn-emerald-primary btn-sm"
              title="Open highest priority or overlapping complaint"
            >
              <Sparkles size={15} />
              Review Priority Case
            </button>

            <button 
              onClick={handleExportCSV}
              className="btn btn-outline-clean btn-sm"
              title="Export filtered records to CSV"
            >
              <Download size={14} />
              Export CSV Report
            </button>
          </div>

          {/* Mandatory Overlap Alert Notification Banner */}
          {activeOverlaps.length > 0 && (
            <div style={{
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  backgroundColor: '#fef3c7',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#92400e' }}>
                    Potential Overlapping Cases — Multi-Bureau Coordination Required
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#b45309' }}>
                    Active concurrent complaints detected for <strong>ABC Engineering College</strong> across <strong>Public Grievance Redressal Cell (PGRC-2026-001)</strong> and <strong>Regulation Bureau (RB-2026-014)</strong>. Joint scrutiny recommended.
                  </div>
                </div>
              </div>
              <button 
                onClick={() => {
                  setOverlapOnly(true);
                  setComplaintStatusFilter('All');
                }}
                className="btn btn-outline-clean btn-xs"
                style={{ borderColor: '#d97706', color: '#92400e', whiteSpace: 'nowrap' }}
              >
                Filter Overlapping Cases
                <ChevronRight size={13} />
              </button>
            </div>
          )}

          {/* Responsive Metrics Grid */}
          <div className="metrics-grid-5">
            <div className="metric-box">
              <div className="metric-label">Total Complaints</div>
              <div className="metric-val">{complaintMetrics.totalComplaints}</div>
              <div className="metric-sub">Registered across all Bureaus</div>
            </div>

            <div className="metric-box border-rose">
              <div className="metric-label text-rose">Pending Scrutiny</div>
              <div className="metric-val text-rose">{complaintMetrics.pendingCases}</div>
              <div className="metric-sub">Received &amp; awaiting action</div>
            </div>

            <div className="metric-box border-blue">
              <div className="metric-label text-blue">Under Process</div>
              <div className="metric-val text-blue">{complaintMetrics.underProcess}</div>
              <div className="metric-sub">Active inquiry &amp; review</div>
            </div>

            <div className="metric-box border-amber">
              <div className="metric-label text-amber">Potential Overlaps</div>
              <div className="metric-val text-amber">{complaintMetrics.potentialOverlaps}</div>
              <div className="metric-sub">Multi-Bureau coordination</div>
            </div>

            <div className="metric-box border-emerald">
              <div className="metric-label text-emerald">Disposed / Closed</div>
              <div className="metric-val text-emerald">{complaintMetrics.disposedCases}</div>
              <div className="metric-sub">Final order recorded</div>
            </div>
          </div>

          {/* Main Table Card */}
          <div className="dashboard-content-card">
            <div className="dashboard-table-header">
              <div>
                <h2 className="table-heading">Central Complaints &amp; Grievance Queue</h2>
                <div className="table-subheading">
                  Showing {complaints.length} {complaints.length === 1 ? 'case' : 'cases'} {overlapOnly ? '(Overlaps filtered)' : overdueOnly ? '(Overdue filtered)' : ''}
                </div>
              </div>

              <div className="table-quick-tabs">
                {[
                  { id: 'All', label: 'All Cases' },
                  { id: 'OVERLAP', label: '⚠️ Potential Overlaps' },
                  { id: 'Pending', label: 'Pending' },
                  { id: 'Under Process', label: 'Under Process' },
                  { id: 'Transferred', label: 'Transferred' },
                  { id: 'Disposed', label: 'Disposed' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (tab.id === 'OVERLAP') {
                        setOverlapOnly(!overlapOnly);
                        setComplaintStatusFilter('All');
                      } else {
                        setOverlapOnly(false);
                        setComplaintStatusFilter(tab.id);
                      }
                    }}
                    className={`quick-tab-btn ${
                      (tab.id === 'OVERLAP' && overlapOnly) || (tab.id !== 'OVERLAP' && !overlapOnly && complaintStatusFilter === tab.id) 
                        ? 'active' 
                        : ''
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Toolbar */}
            <div className="filter-toolbar-grid">
              <div className="table-search-box">
                <Search size={15} className="search-icon" />
                <input
                  type="text"
                  className="table-search-input"
                  placeholder="Search by Case ID (e.g. PGRC-2026-001), institution, or category..."
                  value={complaintSearchTerm}
                  onChange={e => setComplaintSearchTerm(e.target.value)}
                />
              </div>

              <select
                className="filter-select"
                value={complaintBureauFilter}
                onChange={e => setComplaintBureauFilter(e.target.value)}
              >
                <option value="All">All Bureaus &amp; Cells</option>
                <option value="Regulation Bureau">Regulation Bureau (RB)</option>
                <option value="Public Grievance">Public Grievance Redressal Cell (PGRC)</option>
                <option value="Vigilance Cell">Vigilance Cell</option>
                <option value="Regional Office">Regional Offices (RO)</option>
              </select>

              <select
                className="filter-select"
                value={complaintInstitutionFilter}
                onChange={e => setComplaintInstitutionFilter(e.target.value)}
              >
                <option value="All">All Institutions</option>
                {SYNTHETIC_INSTITUTIONS.map(inst => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name.length > 34 ? `${inst.name.substring(0, 32)}...` : inst.name}
                  </option>
                ))}
              </select>

              <select
                className="filter-select"
                value={complaintCategoryFilter}
                onChange={e => setComplaintCategoryFilter(e.target.value)}
              >
                <option value="All">All Complaint Categories</option>
                <option value="Capitation Fee & Excess Fees">Capitation Fee &amp; Excess Fees</option>
                <option value="Faculty Shortage & Non-Payment">Faculty Shortage &amp; Non-Payment</option>
                <option value="Infrastructure & Safety Deficiencies">Infrastructure &amp; Safety Deficiencies</option>
                <option value="Unauthorized Course / Intake">Unauthorized Course / Intake</option>
                <option value="Ragging & Student Harassment">Ragging &amp; Student Harassment</option>
                <option value="Admission Irregularities">Admission Irregularities</option>
                <option value="Non-Refund of Caution Money / Certificates Withheld">Non-Refund of Caution Money</option>
              </select>

              <select
                className="filter-select"
                value={complaintRegionFilter}
                onChange={e => setComplaintRegionFilter(e.target.value)}
              >
                <option value="All">All Regions</option>
                <option value="Northern">Northern Region</option>
                <option value="Western">Western Region</option>
                <option value="Southern">Southern Region</option>
                <option value="Eastern">Eastern Region</option>
                <option value="Central">Central Region</option>
                <option value="South-Western">South-Western Region</option>
              </select>
            </div>

            {/* Table */}
            {complaintsLoading ? (
              <div className="empty-loading-state">
                <RefreshCw size={24} className="spin text-emerald-600" />
                <p>Loading central complaint records and evaluating cross-bureau overlaps...</p>
              </div>
            ) : complaints.length === 0 ? (
              <div className="empty-loading-state">
                <FileText size={36} className="text-muted" />
                <h3 className="empty-title">No Complaints Found</h3>
                <p className="empty-desc">No complaints match your active filter criteria. Try resetting filters or adjusting search parameters.</p>
                <button 
                  onClick={() => {
                    setComplaintStatusFilter('All');
                    setComplaintBureauFilter('All');
                    setComplaintInstitutionFilter('All');
                    setComplaintCategoryFilter('All');
                    setComplaintRegionFilter('All');
                    setOverlapOnly(false);
                    setOverdueOnly(false);
                    setComplaintSearchTerm('');
                  }}
                  className="btn btn-outline-clean btn-xs"
                  style={{ marginTop: '12px' }}
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="table-responsive-wrapper">
                <table className="clean-data-table">
                  <thead>
                    <tr>
                      <th>Case ID &amp; Institution</th>
                      <th>Responsible Bureau &amp; Category</th>
                      <th>Current Status &amp; Overlap Alert</th>
                      <th>SLA Deadline &amp; Last Action</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.map(item => {
                      const isOverlap = item.overlap_status === 'Potential Overlap Detected' || item.overlap_status === 'Confirmed Overlap - Coordinated';
                      const caseId = item.case_id || item.application_number;
                      const bureauName = item.bureau || item.receiving_bureau || 'Public Grievance Redressal Cell (PGRC)';

                      return (
                        <tr key={item.id} style={isOverlap ? { backgroundColor: 'rgba(254, 243, 199, 0.25)' } : undefined}>
                          <td>
                            <div className="app-cell-title">
                              <Link to={`/applications/${item.id}`} className="app-link" style={{ fontWeight: 700 }}>
                                {caseId}
                              </Link>
                              {isOverlap && (
                                <span 
                                  className="badge" 
                                  style={{ 
                                    backgroundColor: '#fef3c7', 
                                    color: '#b45309', 
                                    border: '1px solid #fde68a', 
                                    fontSize: '0.6875rem',
                                    marginLeft: '6px'
                                  }}
                                  title="Concurrent complaint detected across other Bureau/Cell"
                                >
                                  ⚠️ Potential Overlap
                                </span>
                              )}
                              {item.is_overdue && (
                                <span 
                                  className="badge" 
                                  style={{ 
                                    backgroundColor: '#fee2e2', 
                                    color: '#dc2626', 
                                    border: '1px solid #fca5a5', 
                                    fontSize: '0.6875rem',
                                    marginLeft: '6px'
                                  }}
                                >
                                  Overdue
                                </span>
                              )}
                            </div>
                            <div className="app-cell-inst-name" style={{ fontWeight: 600 }}>
                              {item.institution?.name || 'Technical Institution'}
                            </div>
                            <div className="app-cell-inst-code">
                              AICTE ID: <strong>{item.institution?.code || '—'}</strong> • Region: {item.institution?.region || item.institution?.state || 'Northern'}
                            </div>
                          </td>

                          <td>
                            <div className="app-cell-type" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {bureauName}
                            </div>
                            <div className="app-cell-year" style={{ color: 'var(--text-muted)' }}>
                              {item.complaint_category || item.application_type}
                            </div>
                            <div style={{ marginTop: '4px' }}>
                              {getPriorityBadge(item.priority)}
                            </div>
                          </td>

                          <td>
                            <div>{getStatusBadge(item.status)}</div>
                            {item.related_complaint_ids && item.related_complaint_ids.length > 0 && (
                              <div style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '4px' }}>
                                Linked: {item.related_complaint_ids.join(', ')}
                              </div>
                            )}
                            {item.assigned_officer && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                Desk: {item.assigned_officer}
                              </div>
                            )}
                          </td>

                          <td>
                            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: item.is_overdue ? '#dc2626' : 'var(--text-primary)' }}>
                              {item.expected_disposal_date ? `Due: ${item.expected_disposal_date}` : 'Target: 30 days'}
                              {item.days_remaining !== undefined && (
                                <span style={{ fontSize: '0.75rem', fontWeight: 400, marginLeft: '4px' }}>
                                  ({item.days_remaining < 0 ? `${Math.abs(item.days_remaining)}d overdue` : `${item.days_remaining}d left`})
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.last_action_taken || 'Registered in Bureau queue'}
                            </div>
                          </td>

                          <td style={{ textAlign: 'right' }}>
                            <Link
                              to={`/applications/${item.id}`}
                              className="btn btn-outline-clean btn-xs"
                              style={isOverlap ? { borderColor: '#d97706', color: '#92400e' } : undefined}
                            >
                              Review Case
                              <ChevronRight size={13} />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ============================================================== */}
      {/* MODAL: ISSUE CLARIFICATION DIRECTIVE                           */}
      {/* ============================================================== */}
      {clarificationModalApp && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div className="card" style={{ maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  backgroundColor: '#fef3c7',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                    Issue Regulatory Clarification Directive
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Statutory query dispatched to the Institution Director / Registrar
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setClarificationModalApp(null)} 
                className="btn btn-outline btn-xs"
              >
                <X size={14} />
              </button>
            </div>

            {/* Target App Details Banner */}
            <div style={{ 
              backgroundColor: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              borderRadius: '6px', 
              padding: '12px 14px', 
              marginBottom: '16px' 
            }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                {clarificationModalApp.application_number} — {clarificationModalApp.institution?.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                AICTE Permanent ID: {clarificationModalApp.institution?.code} • {clarificationModalApp.application_type}
              </div>
            </div>

            <form onSubmit={handleDispatchClarification}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Clarification Query &amp; Deficiency Details <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <textarea
                  className="form-control"
                  rows={5}
                  required
                  placeholder="Specify the regulatory deficiency or document anomaly requiring explanation or resubmission (e.g., 'Please upload certified Land Use Certificate issued within the last 3 years and provide resolution regarding the mismatch in authorized representative designation.')..."
                  value={clarificationQuery}
                  onChange={e => setClarificationQuery(e.target.value)}
                  style={{ fontSize: '0.875rem' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Response Compliance Deadline
                </label>
                <select
                  className="form-control"
                  value={clarificationDeadlineDays}
                  onChange={e => setClarificationDeadlineDays(Number(e.target.value))}
                >
                  <option value={7}>7 Calendar Days (Standard Regulatory Window)</option>
                  <option value={10}>10 Calendar Days (Document Rectification)</option>
                  <option value={14}>14 Calendar Days (Statutory NOC / Land Evidence)</option>
                </select>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Target deadline will be calculated and displayed to the institution. Status transitions to "Clarification Required".
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setClarificationModalApp(null)}
                  className="btn btn-outline btn-sm"
                  disabled={isSubmittingClarification}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  style={{ backgroundColor: '#d97706', borderColor: '#d97706' }}
                  disabled={isSubmittingClarification || !clarificationQuery.trim()}
                >
                  {isSubmittingClarification ? (
                    <RefreshCw size={14} className="spin" />
                  ) : (
                    <Send size={14} />
                  )}
                  Dispatch Directive to Institution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: RECORD OFFICIAL SCRUTINY DECISION                       */}
      {/* ============================================================== */}
      {decisionModalApp && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div className="card" style={{ maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  backgroundColor: '#ecfdf5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                    Record Official Scrutiny Decision
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Statutory recommendation entered into immutable audit log
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setDecisionModalApp(null)} 
                className="btn btn-outline btn-xs"
              >
                <X size={14} />
              </button>
            </div>

            {/* Target App Details Banner */}
            <div style={{ 
              backgroundColor: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              borderRadius: '6px', 
              padding: '12px 14px', 
              marginBottom: '16px' 
            }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                {decisionModalApp.application_number} — {decisionModalApp.institution?.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                AICTE Permanent ID: {decisionModalApp.institution?.code} • Category: {decisionModalApp.application_type}
              </div>
            </div>

            <form onSubmit={handleRecordScrutinyDecision}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Official Scrutiny Determination <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                  {[
                    { val: 'Approved', label: 'Verified & Recommended', color: '#059669' },
                    { val: 'Action Required', label: 'Deficiencies Detected', color: '#dc2626' },
                    { val: 'Needs Further Inspection', label: 'Expert Committee Inspection', color: '#d97706' }
                  ].map(opt => (
                    <label 
                      key={opt.val}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: decisionType === opt.val ? `2px solid ${opt.color}` : '1px solid var(--border-subtle)',
                        backgroundColor: decisionType === opt.val ? '#f8fafc' : '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="radio"
                        name="decisionRadio"
                        value={opt.val}
                        checked={decisionType === opt.val}
                        onChange={() => setDecisionType(opt.val as any)}
                      />
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: opt.color }}>
                        {opt.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Statutory Observations &amp; Scrutiny Remarks <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <textarea
                  className="form-control"
                  rows={4}
                  required
                  placeholder="Record formal observations regarding document authenticity, compliance with AICTE Approval Process Handbook (APH), land and building norms, faculty cadre ratio, and infrastructure..."
                  value={decisionRemarks}
                  onChange={e => setDecisionRemarks(e.target.value)}
                  style={{ fontSize: '0.875rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setDecisionModalApp(null)}
                  className="btn btn-outline btn-sm"
                  disabled={isSubmittingDecision}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  style={{ backgroundColor: '#059669', borderColor: '#059669' }}
                  disabled={isSubmittingDecision || !decisionRemarks.trim()}
                >
                  {isSubmittingDecision ? (
                    <RefreshCw size={14} className="spin" />
                  ) : (
                    <CheckCircle2 size={14} />
                  )}
                  Record Scrutiny Determination
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
