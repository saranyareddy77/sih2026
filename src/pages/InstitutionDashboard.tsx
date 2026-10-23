// AICTE SmartVerify — Central Institution Complaint Registry & Status Portal
// SIH Problem Statement: Integrated Institution Complaint Monitoring and Status Dashboard for AICTE

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
  MessageSquare
} from 'lucide-react';
import { Application, ApplicationStatus, BureauCell } from '../types';
import { applicationService } from '../services/applicationService';
import { complaintService } from '../services/complaintService';
import { authService } from '../services/authService';

export const InstitutionDashboard: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const institution = currentUser?.institution;

  const [complaints, setComplaints] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [showResponseModal, setShowResponseModal] = useState<boolean>(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [responseText, setResponseText] = useState<string>('');
  const [isSubmittingResponse, setIsSubmittingResponse] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await applicationService.getApplications({
        institutionId: currentUser?.institution_id,
        searchTerm,
        status: statusFilter === 'All' ? undefined : (statusFilter as ApplicationStatus)
      });
      setComplaints(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchTerm, statusFilter, currentUser]);

  // Operational metrics derived directly and accurately from institution complaints
  const totalComplaints = complaints.length;
  const pendingScrutiny = complaints.filter(c => c.status === 'Pending' || c.status === 'Received').length;
  const awaitingInfo = complaints.filter(c => c.status === 'Awaiting Information' || c.status === 'Action Required').length;
  const underProcess = complaints.filter(c => c.status === 'Under Process' || c.status === 'Under Review' || c.status === 'Needs Review' || c.status === 'Transferred').length;
  const disposedCases = complaints.filter(c => c.status === 'Disposed' || c.status === 'Closed' || c.status === 'Review Completed').length;

  const getStatusBadge = (status: ApplicationStatus | string) => {
    switch (status) {
      case 'Disposed':
      case 'Closed':
      case 'Review Completed':
        return <span className="badge badge-passed">{status}</span>;
      case 'Awaiting Information':
      case 'Action Required':
        return <span className="badge badge-failed">{status}</span>;
      case 'Transferred':
        return <span className="badge badge-needs-review" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>Transferred</span>;
      case 'Under Process':
      case 'Under Review':
        return <span className="badge badge-info">{status}</span>;
      default:
        return <span className="badge badge-draft">{status || 'Pending'}</span>;
    }
  };

  const handleSendResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseText.trim()) return;
    setIsSubmittingResponse(true);
    try {
      const targetCase = complaints.find(c => c.id === selectedCaseId || c.case_id === selectedCaseId);
      if (targetCase) {
        await complaintService.addRemark(
          targetCase.id,
          `[INSTITUTION OFFICIAL COMPLIANCE RESPONSE]\n${responseText}`,
          currentUser?.full_name || 'Institution Registrar'
        );
        alert('Institutional response submitted to AICTE Bureau desk.');
        setShowResponseModal(false);
        setResponseText('');
        await loadData();
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  // Urgent notice if any complaint has an official notice awaiting response
  const urgentCase = complaints.find(c => c.status === 'Awaiting Information' || c.status === 'Action Required');

  return (
    <div className="app-container" style={{ paddingBottom: '60px' }}>
      {/* Clean Institution Profile & Action Header */}
      <div className="dashboard-header-clean">
        <div className="header-title-area">
          <div className="institution-meta-line">
            <Building2 size={15} className="text-emerald-600" />
            <span>AICTE ID: <strong>{institution?.code || '1-1092837411'}</strong></span>
            {institution?.aishe_code && (
              <span>• AISHE: <strong>{institution.aishe_code}</strong></span>
            )}
            <span>• Region: <strong>{institution?.region || 'Northern'}</strong></span>
          </div>
          <h1 className="dashboard-main-title">
            {institution?.name || 'Institution Complaint & Compliance Status Portal'}
          </h1>
          <p className="dashboard-sub-title">
            {institution?.address ? `${institution.address}, ${institution.city}, ${institution.state}` : 'Centralized repository of grievance dockets, compliance directives, and inquiry responses.'}
          </p>
        </div>

        <div className="header-action-group">
          <button 
            onClick={loadData} 
            className="btn btn-outline-clean btn-sm"
            title="Refresh complaint queue"
          >
            <RefreshCw size={14} />
            Refresh Queue
          </button>
        </div>
      </div>

      {/* Urgent Notice Banner if Action Required / Awaiting Information */}
      {urgentCase && (
        <div className="action-required-banner">
          <div className="banner-left">
            <AlertTriangle size={20} className="text-rose" />
            <div>
              <div className="banner-title">Statutory Inquiry Response Required: Case {urgentCase.case_id || urgentCase.application_number}</div>
              <div className="banner-desc">
                {urgentCase.bureau || 'AICTE Bureau'} has requested clarification or certified records regarding <strong>{urgentCase.complaint_category}</strong>.
              </div>
            </div>
          </div>
          <button 
            onClick={() => {
              setSelectedCaseId(urgentCase.id);
              setShowResponseModal(true);
            }} 
            className="btn btn-rose-subtle btn-sm"
          >
            Submit Response
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Responsive Metrics Grid with 5 Standard Metrics */}
      <div className="metrics-grid-5">
        <div className="metric-box">
          <div className="metric-label">Total Dockets</div>
          <div className="metric-val">{totalComplaints}</div>
          <div className="metric-sub">Registered complaints</div>
        </div>

        <div className="metric-box border-rose">
          <div className="metric-label text-rose">Response Awaited</div>
          <div className="metric-val text-rose">{awaitingInfo}</div>
          <div className="metric-sub">Action required from college</div>
        </div>

        <div className="metric-box border-blue">
          <div className="metric-label text-blue">Under Inquiry</div>
          <div className="metric-val text-blue">{underProcess}</div>
          <div className="metric-sub">Bureau fact-finding</div>
        </div>

        <div className="metric-box border-amber">
          <div className="metric-label text-amber">Pending Scrutiny</div>
          <div className="metric-val text-amber">{pendingScrutiny}</div>
          <div className="metric-sub">Awaiting desk review</div>
        </div>

        <div className="metric-box border-emerald">
          <div className="metric-label text-emerald">Disposed / Closed</div>
          <div className="metric-val text-emerald">{disposedCases}</div>
          <div className="metric-sub">Resolved / Order issued</div>
        </div>
      </div>

      {/* Complaints Table Card */}
      <div className="dashboard-content-card">
        <div className="dashboard-table-header">
          <div>
            <h2 className="table-heading">Institution Complaint Dockets</h2>
            <div className="table-subheading">
              Showing {complaints.length} registered complaint {complaints.length === 1 ? 'docket' : 'dockets'}
            </div>
          </div>

          <div className="table-quick-tabs">
            {['All', 'Awaiting Information', 'Under Process', 'Disposed'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`quick-tab-btn ${statusFilter === st ? 'active' : ''}`}
              >
                {st === 'All' ? 'All' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="filter-toolbar-grid">
          <div className="table-search-box">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              className="table-search-input"
              placeholder="Search by Case ID, category, or keyword..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="All">All Complaint Statuses</option>
            <option value="Awaiting Information">Awaiting Information (Action Required)</option>
            <option value="Under Process">Under Process</option>
            <option value="Transferred">Transferred</option>
            <option value="Disposed">Disposed / Closed</option>
          </select>
        </div>

        {/* Data Table */}
        {loading ? (
          <div className="empty-loading-state">
            <RefreshCw size={24} className="spin text-emerald-600" />
            <p>Loading institutional complaint records...</p>
          </div>
        ) : complaints.length === 0 ? (
          <div className="empty-loading-state">
            <FileText size={36} className="text-muted" />
            <h3 className="empty-title">No Active Complaints Found</h3>
            <p className="empty-desc">No complaints or grievance dockets are currently registered under this institution's AICTE Permanent ID.</p>
          </div>
        ) : (
          <div className="table-responsive-wrapper">
            <table className="clean-data-table">
              <thead>
                <tr>
                  <th>Case ID &amp; Complainant</th>
                  <th>Responsible Bureau &amp; Category</th>
                  <th>Status</th>
                  <th>SLA Target &amp; Directive</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map(app => {
                  const caseId = app.case_id || app.application_number;
                  const isAwaiting = app.status === 'Awaiting Information' || app.status === 'Action Required';

                  return (
                    <tr key={app.id} style={isAwaiting ? { backgroundColor: '#fff1f2' } : undefined}>
                      <td>
                        <Link to={`/applications/${app.id}`} className="app-link" style={{ fontWeight: 700 }}>
                          {caseId}
                        </Link>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Complainant: {app.complainant_name || 'Stakeholder'} ({app.complainant_type || 'Student'})
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {app.bureau || app.receiving_bureau || 'Public Grievance Redressal Cell (PGRC)'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {app.complaint_category || app.application_type}
                        </div>
                      </td>

                      <td>
                        {getStatusBadge(app.status)}
                      </td>

                      <td>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                          Target: {app.expected_disposal_date || '30 days'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {app.next_action_required || 'Under Bureau Scrutiny'}
                        </div>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <Link
                          to={`/applications/${app.id}`}
                          className="btn btn-outline-clean btn-xs"
                          style={isAwaiting ? { borderColor: '#e11d48', color: '#be123c' } : undefined}
                        >
                          View Details
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

      {/* MODAL: Submit Institutional Response */}
      {showResponseModal && (
        <div className="modal-overlay" onClick={() => setShowResponseModal(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <form onSubmit={handleSendResponse} className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title">Submit Official Compliance Response to AICTE</h3>
                <button type="button" onClick={() => setShowResponseModal(false)} className="close-btn">✕</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Explanation / Compliance Statement *</label>
                  <textarea 
                    required 
                    rows={5} 
                    className="form-input"
                    placeholder="Enter formal response from Principal/Registrar regarding the inquiry directive..."
                    value={responseText}
                    onChange={e => setResponseText(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowResponseModal(false)} className="btn btn-outline-clean btn-sm">Cancel</button>
                <button type="submit" disabled={isSubmittingResponse} className="btn btn-emerald-primary btn-sm">
                  {isSubmittingResponse ? 'Submitting...' : 'Submit Compliance Response'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
