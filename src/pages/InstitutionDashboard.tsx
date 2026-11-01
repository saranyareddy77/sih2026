// AICTE SmartVerify — Central Institution Portal & Application Management Dashboard
// SIH Problem Statement 26261

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Building2, 
  RefreshCw, 
  Upload, 
  ArrowRight, 
  ShieldCheck, 
  AlertTriangle, 
  ChevronRight, 
  Sparkles,
  MapPin,
  Hash,
  Send,
  MessageSquare,
  FileCheck2,
  Edit3,
  Trash2,
  Award,
  Layers,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { Application, ApplicationStatus, Institution } from '../types';
import { applicationService } from '../services/applicationService';
import { complaintService } from '../services/complaintService';
import { authService } from '../services/authService';
import { InstitutionProfileView } from '../components/InstitutionProfileView';
import { ApplicationWorkflowModal } from '../components/ApplicationWorkflowModal';

type ActiveTab = 'applications' | 'profile' | 'grievances';

export const InstitutionDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());
  const [activeTab, setActiveTab] = useState<ActiveTab>('applications');

  const [applications, setApplications] = useState<Application[]>([]);
  const [complaints, setComplaints] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Multi-step Application Workflow Modal state
  const [showWorkflowModal, setShowWorkflowModal] = useState<boolean>(false);
  const [selectedDraftId, setSelectedDraftId] = useState<string | undefined>(undefined);

  // Clarification Response modal state
  const [showClarificationModal, setShowClarificationModal] = useState<boolean>(false);
  const [selectedClarificationApp, setSelectedClarificationApp] = useState<Application | null>(null);
  const [clarificationResponseText, setClarificationResponseText] = useState<string>('');
  const [isSubmittingClarification, setIsSubmittingClarification] = useState<boolean>(false);

  // Sync auth state
  useEffect(() => {
    const unsub = authService.subscribe(user => setCurrentUser(user));
    return () => unsub();
  }, []);

  const institution = currentUser?.institution;

  const loadData = async () => {
    setLoading(true);
    try {
      const instId = currentUser?.institution_id || institution?.id;

      // 1. Fetch approval applications
      const apps = await applicationService.getApplications({
        institutionId: instId,
        status: statusFilter === 'All' ? undefined : (statusFilter as ApplicationStatus),
        searchTerm,
        docketType: 'approvals'
      });
      setApplications(apps);

      // 2. Fetch complaint dockets (preserving existing grievance data)
      const compData = await complaintService.getComplaints({
        institutionId: instId,
        searchTerm
      });
      setComplaints(compData);
    } catch (e) {
      console.error('Failed loading institution dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchTerm, statusFilter, currentUser]);

  // Separate drafts vs active/submitted applications
  const drafts = applications.filter(a => a.status === 'Draft' || a.status === 'Validation Required' || a.status === 'Ready for Submission');
  const submittedApps = applications.filter(a => a.status !== 'Draft' && a.status !== 'Validation Required' && a.status !== 'Ready for Submission');

  // Check for any urgent clarification requests
  const clarificationNeededApp = applications.find(a => a.status === 'Clarification Required');

  // Metrics
  const totalAppsCount = applications.length;
  const activeDraftsCount = drafts.length;
  const underScrutinyCount = applications.filter(a => a.status === 'Under Scrutiny' || a.status === 'Submitted' || a.status === 'Awaiting Official Review').length;
  const approvedCompletedCount = applications.filter(a => a.status === 'Verified' || a.status === 'Review Completed').length;

  const getStatusBadge = (status: ApplicationStatus | string) => {
    switch (status) {
      case 'Verified':
      case 'Review Completed':
      case 'Disposed':
      case 'Closed':
        return <span className="badge badge-passed">{status}</span>;
      case 'Clarification Required':
      case 'Action Required':
      case 'Awaiting Information':
        return <span className="badge badge-failed" style={{ backgroundColor: '#fff1f2', color: '#e11d48', borderColor: '#fecdd3' }}>{status}</span>;
      case 'Ready for Submission':
        return <span className="badge badge-passed" style={{ backgroundColor: '#ecfdf5', color: '#047857' }}>Ready for Submission</span>;
      case 'Draft':
      case 'Validation Required':
        return <span className="badge badge-draft">{status}</span>;
      case 'Under Scrutiny':
      case 'Awaiting Official Review':
      case 'Under Process':
      case 'Under Review':
      case 'Submitted':
        return <span className="badge badge-info">{status}</span>;
      case 'Resubmitted':
        return <span className="badge badge-needs-review" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>Resubmitted</span>;
      default:
        return <span className="badge badge-draft">{status || 'Draft'}</span>;
    }
  };

  // Handle continuing a draft
  const handleContinueDraft = (appId: string) => {
    setSelectedDraftId(appId);
    setShowWorkflowModal(true);
  };

  // Handle creating new application
  const handleCreateNew = () => {
    setSelectedDraftId(undefined);
    setShowWorkflowModal(true);
  };

  // Handle deleting a draft
  const handleDeleteDraft = async (appId: string) => {
    if (!window.confirm('Are you sure you want to delete this draft application?')) return;
    try {
      await applicationService.deleteDraft(appId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete draft');
    }
  };

  // Handle submitting clarification response
  const handleSendClarificationResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClarificationApp || !clarificationResponseText.trim()) return;

    setIsSubmittingClarification(true);
    try {
      await applicationService.submitClarificationResponse(
        selectedClarificationApp.id,
        clarificationResponseText.trim(),
        currentUser?.full_name || 'Authorized Representative'
      );
      alert('Clarification response & evidence submitted to the Scrutiny Desk!');
      setShowClarificationModal(false);
      setClarificationResponseText('');
      setSelectedClarificationApp(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit response');
    } finally {
      setIsSubmittingClarification(false);
    }
  };

  return (
    <div className="app-container" style={{ paddingBottom: '60px' }}>
      {/* Top Institution Banner */}
      <div className="dashboard-header-clean">
        <div className="header-title-area">
          <div className="institution-meta-line">
            <Building2 size={15} className="text-emerald-600" />
            <span>AICTE Permanent ID: <strong>{institution?.code || '1-1092837411'}</strong></span>
            {institution?.aishe_code && (
              <span>• AISHE: <strong>{institution.aishe_code}</strong></span>
            )}
            <span>• Region: <strong>{institution?.region || 'Northern'}</strong></span>
            <span>• Type: <strong>{institution?.institution_type || 'Engineering & Technology'}</strong></span>
          </div>
          <h1 className="dashboard-main-title">
            {institution?.name || 'Institution Approval & Scrutiny Portal'}
          </h1>
          <p className="dashboard-sub-title">
            {institution?.address ? `${institution.address}, ${institution.city}, ${institution.state} ${institution.pincode}` : 'Regulatory portal for AICTE Extension of Approval, New Programmes, and Document Authentication.'}
          </p>
        </div>

        <div className="header-action-group">
          <button 
            onClick={handleCreateNew} 
            className="btn btn-emerald-primary btn-sm"
            style={{ fontWeight: 600 }}
          >
            <Plus size={15} />
            Create New Application
          </button>
          <button 
            onClick={loadData} 
            className="btn btn-outline-clean btn-sm"
            title="Refresh application status"
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Urgent Clarification Required Alert Banner */}
      {clarificationNeededApp && (
        <div className="action-required-banner" style={{ backgroundColor: '#fff1f2', border: '1px solid #fecdd3' }}>
          <div className="banner-left">
            <AlertTriangle size={22} className="text-rose" />
            <div>
              <div className="banner-title" style={{ color: '#991b1b' }}>
                Official Scrutiny Directive: Clarification Required for Application {clarificationNeededApp.application_number}
              </div>
              <div className="banner-desc" style={{ color: '#b91c1c' }}>
                Query from Scrutiny Desk: "{clarificationNeededApp.clarification_request || 'Additional certified evidence or explanation required by Scrutiny Officer.'}"
              </div>
            </div>
          </div>
          <button 
            onClick={() => {
              setSelectedClarificationApp(clarificationNeededApp);
              setShowClarificationModal(true);
            }} 
            className="btn btn-rose-subtle btn-sm"
          >
            Submit Formal Response
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div style={{
        display: 'flex',
        gap: '4px',
        borderBottom: '2px solid #e2e8f0',
        marginBottom: '24px',
        backgroundColor: '#fff',
        borderRadius: '8px 8px 0 0',
        padding: '6px 8px 0'
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('applications')}
          style={{
            padding: '10px 20px',
            fontSize: '0.9375rem',
            fontWeight: activeTab === 'applications' ? 700 : 500,
            color: activeTab === 'applications' ? '#059669' : '#64748b',
            borderBottom: activeTab === 'applications' ? '3px solid #10b981' : '3px solid transparent',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <FileCheck2 size={16} />
          Approval Applications ({applications.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          style={{
            padding: '10px 20px',
            fontSize: '0.9375rem',
            fontWeight: activeTab === 'profile' ? 700 : 500,
            color: activeTab === 'profile' ? '#059669' : '#64748b',
            borderBottom: activeTab === 'profile' ? '3px solid #10b981' : '3px solid transparent',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Building2 size={16} />
          Institution Regulatory Profile
          {institution?.profile_completion_percentage !== undefined && (
            <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
              {institution.profile_completion_percentage}%
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('grievances')}
          style={{
            padding: '10px 20px',
            fontSize: '0.9375rem',
            fontWeight: activeTab === 'grievances' ? 700 : 500,
            color: activeTab === 'grievances' ? '#059669' : '#64748b',
            borderBottom: activeTab === 'grievances' ? '3px solid #10b981' : '3px solid transparent',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <MessageSquare size={16} />
          Grievances &amp; Inquiries ({complaints.length})
        </button>
      </div>

      {/* TAB 1: APPROVAL APPLICATIONS */}
      {activeTab === 'applications' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Key Metrics Grid */}
          <div className="metrics-grid-5">
            <div className="metric-box">
              <div className="metric-label">Total Applications</div>
              <div className="metric-val">{totalAppsCount}</div>
              <div className="metric-sub">Approval dossiers</div>
            </div>

            <div className="metric-box border-amber">
              <div className="metric-label text-amber">Active Drafts</div>
              <div className="metric-val text-amber">{activeDraftsCount}</div>
              <div className="metric-sub">Pending completion</div>
            </div>

            <div className="metric-box border-blue">
              <div className="metric-label text-blue">Under Scrutiny</div>
              <div className="metric-val text-blue">{underScrutinyCount}</div>
              <div className="metric-sub">Bureau desk review</div>
            </div>

            <div className="metric-box border-rose">
              <div className="metric-label text-rose">Clarification Due</div>
              <div className="metric-val text-rose">{clarificationNeededApp ? 1 : 0}</div>
              <div className="metric-sub">Action required</div>
            </div>

            <div className="metric-box border-emerald">
              <div className="metric-label text-emerald">Verified / Approved</div>
              <div className="metric-val text-emerald">{approvedCompletedCount}</div>
              <div className="metric-sub">Approval granted</div>
            </div>
          </div>

          {/* DRAFTS SECTION (If any active drafts exist) */}
          {drafts.length > 0 && (
            <div className="dashboard-content-card" style={{ border: '1px solid #fde68a', backgroundColor: '#fffbeb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={18} className="text-amber-600" />
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#92400e' }}>
                    Partially Completed Application Drafts ({drafts.length})
                  </h3>
                </div>
                <span style={{ fontSize: '0.8125rem', color: '#b45309' }}>
                  Drafts are saved automatically and can be resumed anytime
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {drafts.map(d => (
                  <div 
                    key={d.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: '#fff',
                      padding: '14px 18px',
                      borderRadius: '8px',
                      border: '1px solid #fef3c7',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#0f172a' }}>
                          {d.application_number}
                        </span>
                        <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                          {d.application_type}
                        </span>
                        {getStatusBadge(d.status)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                        Academic Year: <strong>{d.academic_year}</strong> • Progress: <strong>Step {d.step_progress || 1} of 5</strong> • Last saved: {new Date(d.updated_at).toLocaleString()}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => handleContinueDraft(d.id)}
                        className="btn btn-emerald-primary btn-xs"
                      >
                        <Edit3 size={13} />
                        Continue Draft
                      </button>
                      <button 
                        onClick={() => handleDeleteDraft(d.id)}
                        className="btn btn-outline-clean btn-xs"
                        style={{ color: '#e11d48' }}
                        title="Delete draft"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUBMITTED APPLICATIONS LIST */}
          <div className="dashboard-content-card">
            <div className="dashboard-table-header">
              <div>
                <h2 className="table-heading">Submitted Applications &amp; Scrutiny Queue</h2>
                <div className="table-subheading">
                  Showing {submittedApps.length} submitted approval {submittedApps.length === 1 ? 'dossier' : 'dossiers'}
                </div>
              </div>

              <div className="table-quick-tabs">
                {['All', 'Under Scrutiny', 'Clarification Required', 'Review Completed'].map(st => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`quick-tab-btn ${statusFilter === st ? 'active' : ''}`}
                  >
                    {st === 'All' ? 'All Applications' : st}
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
                  placeholder="Search by Application Number, category, or year..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                className="filter-select"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="All">All Application Statuses</option>
                <option value="Submitted">Submitted (Awaiting Desk)</option>
                <option value="Under Scrutiny">Under Scrutiny</option>
                <option value="Clarification Required">Clarification Required</option>
                <option value="Resubmitted">Resubmitted</option>
                <option value="Review Completed">Review Completed</option>
              </select>
            </div>

            {/* Applications Table */}
            {loading ? (
              <div className="empty-loading-state">
                <RefreshCw size={24} className="spin text-emerald-600" />
                <p>Loading application dossiers...</p>
              </div>
            ) : submittedApps.length === 0 ? (
              <div className="empty-loading-state">
                <FileText size={36} className="text-muted" />
                <h3 className="empty-title">No Submitted Applications Found</h3>
                <p className="empty-desc">
                  No approval applications have been submitted yet. Click "Create New Application" above to begin your application for Extension of Approval (EoA) or New Programmes.
                </p>
                <button onClick={handleCreateNew} className="btn btn-emerald-primary btn-sm" style={{ marginTop: '12px' }}>
                  <Plus size={14} /> Create First Application
                </button>
              </div>
            ) : (
              <div className="table-responsive-wrapper">
                <table className="clean-data-table">
                  <thead>
                    <tr>
                      <th>Application Number &amp; Category</th>
                      <th>Academic Year</th>
                      <th>Current Scrutiny Status</th>
                      <th>Automated Outcome</th>
                      <th>Submission Date</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submittedApps.map(item => {
                      const isClarification = item.status === 'Clarification Required';

                      return (
                        <tr key={item.id} style={isClarification ? { backgroundColor: '#fff1f2' } : undefined}>
                          <td>
                            <Link to={`/applications/${item.id}`} className="app-link" style={{ fontWeight: 700 }}>
                              {item.application_number}
                            </Link>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {item.application_type}
                            </div>
                          </td>

                          <td>
                            <strong>{item.academic_year || '2026-2027'}</strong>
                          </td>

                          <td>
                            {getStatusBadge(item.status)}
                          </td>

                          <td>
                            {item.overall_validation_outcome === 'Passed' ? (
                              <span className="badge badge-passed">Checks Passed</span>
                            ) : item.overall_validation_outcome === 'Failed' ? (
                              <span className="badge badge-failed">Deficiencies Found</span>
                            ) : item.overall_validation_outcome === 'Needs Review' ? (
                              <span className="badge badge-needs-review">Needs Review</span>
                            ) : (
                              <span className="badge badge-draft">Not Checked</span>
                            )}
                          </td>

                          <td>
                            <div style={{ fontSize: '0.8125rem' }}>
                              {item.submission_date ? new Date(item.submission_date).toLocaleDateString() : '—'}
                            </div>
                          </td>

                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                              {isClarification && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedClarificationApp(item);
                                    setShowClarificationModal(true);
                                  }}
                                  className="btn btn-rose-subtle btn-xs"
                                >
                                  Reply
                                </button>
                              )}
                              <Link
                                to={`/applications/${item.id}`}
                                className="btn btn-outline-clean btn-xs"
                              >
                                View Dossier <ChevronRight size={13} />
                              </Link>
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
        </div>
      )}

      {/* TAB 2: INSTITUTION PROFILE */}
      {activeTab === 'profile' && (
        <InstitutionProfileView 
          onProfileUpdated={updated => {
            loadData();
          }} 
        />
      )}

      {/* TAB 3: GRIEVANCES & COMPLAINTS (PRESERVED) */}
      {activeTab === 'grievances' && (
        <div className="dashboard-content-card">
          <div className="dashboard-table-header">
            <div>
              <h2 className="table-heading">Registered Grievance Dockets</h2>
              <div className="table-subheading">
                Centralized monitoring of stakeholder inquiries, vigilance complaints, and bureau transfers.
              </div>
            </div>
          </div>

          {complaints.length === 0 ? (
            <div className="empty-loading-state">
              <CheckCircle2 size={36} className="text-emerald-600" />
              <h3 className="empty-title">Zero Pending Complaints</h3>
              <p className="empty-desc">No active grievance dockets are currently registered under this institution's AICTE Permanent ID.</p>
            </div>
          ) : (
            <div className="table-responsive-wrapper">
              <table className="clean-data-table">
                <thead>
                  <tr>
                    <th>Case ID &amp; Complainant</th>
                    <th>Responsible Bureau &amp; Category</th>
                    <th>Status</th>
                    <th>Target Disposal Date</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map(app => (
                    <tr key={app.id}>
                      <td>
                        <Link to={`/applications/${app.id}`} className="app-link" style={{ fontWeight: 700 }}>
                          {app.case_id || app.application_number}
                        </Link>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Complainant: {app.complainant_name || 'Stakeholder'} ({app.complainant_type || 'Student'})
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{app.bureau || 'Public Grievance Redressal Cell (PGRC)'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{app.complaint_category || app.application_type}</div>
                      </td>
                      <td>{getStatusBadge(app.status)}</td>
                      <td>{app.expected_disposal_date || '30 days'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <Link to={`/applications/${app.id}`} className="btn btn-outline-clean btn-xs">
                          View Docket <ChevronRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL: APPLICATION WORKFLOW WIZARD */}
      {showWorkflowModal && (
        <ApplicationWorkflowModal
          isOpen={showWorkflowModal}
          applicationId={selectedDraftId}
          onClose={() => {
            setShowWorkflowModal(false);
            setSelectedDraftId(undefined);
            loadData();
          }}
          onApplicationSubmitted={() => {
            loadData();
          }}
        />
      )}

      {/* MODAL: SUBMIT FORMAL CLARIFICATION RESPONSE */}
      {showClarificationModal && selectedClarificationApp && (
        <div className="modal-overlay" onClick={() => setShowClarificationModal(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <form onSubmit={handleSendClarificationResponse} className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title">Submit Official Clarification Response to AICTE</h3>
                <button type="button" onClick={() => setShowClarificationModal(false)} className="close-btn">✕</button>
              </div>
              <div className="modal-body">
                <div style={{ padding: '12px', backgroundColor: '#fff1f2', borderRadius: '6px', border: '1px solid #fecdd3', marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase' }}>
                    Officer Scrutiny Directive:
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#b91c1c', marginTop: '4px' }}>
                    "{selectedClarificationApp.clarification_request || 'Additional certified evidence or explanation required by Scrutiny Officer.'}"
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Institution Explanation &amp; Certified Statement *</label>
                  <textarea 
                    required 
                    rows={6} 
                    className="form-input"
                    placeholder="Enter formal response from Principal/Registrar addressing the inquiry directive..."
                    value={clarificationResponseText}
                    onChange={e => setClarificationResponseText(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowClarificationModal(false)} className="btn btn-outline-clean btn-sm">Cancel</button>
                <button type="submit" disabled={isSubmittingClarification} className="btn btn-emerald-primary btn-sm">
                  {isSubmittingClarification ? 'Submitting to AICTE...' : 'Submit Formal Clarification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstitutionDashboard;
