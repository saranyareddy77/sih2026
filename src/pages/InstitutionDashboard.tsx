// AICTE SmartVerify — Institution Dashboard
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
  RefreshCw
} from 'lucide-react';
import { Application, ApplicationStatus, ApplicationType, ValidationOutcome } from '../types';
import { applicationService } from '../services/applicationService';
import { authService } from '../services/authService';

export const InstitutionDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [showNewAppModal, setShowNewAppModal] = useState<boolean>(false);
  const [selectedAppType, setSelectedAppType] = useState<ApplicationType>('Extension of Approval (EoA)');
  const [academicYear, setAcademicYear] = useState<string>('2026-2027');

  const currentUser = authService.getCurrentUser();
  const institution = currentUser?.institution;

  const loadData = async () => {
    setLoading(true);
    try {
      // Filter by current user's institution ID
      const apps = await applicationService.getApplications({
        institutionId: currentUser?.institution_id,
        searchTerm,
        status: statusFilter === 'All' ? undefined : (statusFilter as ApplicationStatus)
      });
      setApplications(apps);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchTerm, statusFilter, currentUser]);

  const handleCreateApplication = async () => {
    if (!currentUser?.institution_id) return;
    try {
      const newApp = await applicationService.createApplication(
        currentUser.institution_id,
        selectedAppType,
        academicYear,
        currentUser.id
      );
      setShowNewAppModal(false);
      navigate(`/applications/${newApp.id}`);
    } catch (err: any) {
      alert(`Could not create application: ${err.message}`);
    }
  };

  // Metrics (Strictly simple number cards, NO charts)
  const totalApps = applications.length;
  const awaitingAction = applications.filter(a => a.status === 'Action Required').length;
  const awaitingReview = applications.filter(a => a.status === 'Awaiting Official Review' || a.status === 'Submitted' || a.status === 'Under Review').length;
  const validationIssues = applications.filter(a => a.overall_validation_outcome === 'Failed' || a.overall_validation_outcome === 'Needs Review').length;

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'Review Completed':
      case 'Verification Complete':
        return <span className="badge badge-passed">{status}</span>;
      case 'Action Required':
        return <span className="badge badge-failed">{status}</span>;
      case 'Needs Review':
      case 'Authenticity Confirmation Pending':
        return <span className="badge badge-needs-review">{status}</span>;
      case 'Awaiting Official Review':
      case 'Submitted':
      case 'Under Review':
        return <span className="badge badge-info">{status}</span>;
      default:
        return <span className="badge badge-draft">{status}</span>;
    }
  };

  return (
    <div className="app-container">
      {/* Institution Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
        color: '#ffffff',
        borderRadius: '8px',
        padding: '24px 28px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.85, fontSize: '0.8125rem', marginBottom: '6px' }}>
            <Building2 size={16} />
            <span>AICTE Institute ID: {institution?.code || '1-1092837411'}</span>
            <span>• AISHE: {institution?.aishe_code || 'C-48192'}</span>
          </div>
          <h1 style={{ color: '#ffffff', fontSize: '1.4rem', fontWeight: 700, marginBottom: '4px' }}>
            {institution?.name || 'Institution Portal'}
          </h1>
          <p style={{ opacity: 0.8, fontSize: '0.875rem' }}>
            {institution?.address}, {institution?.city}, {institution?.state} — {institution?.pincode}
          </p>
        </div>

        <button 
          onClick={() => setShowNewAppModal(true)}
          className="btn"
          style={{ backgroundColor: '#2563eb', color: '#ffffff', padding: '10px 18px', fontWeight: 600 }}
        >
          <Plus size={16} />
          Create New Application
        </button>
      </div>

      {/* Metric Number Cards (Strictly No Charts) */}
      <div className="metrics-grid">
        <div className="metric-card">
          <span className="metric-label">Total Applications</span>
          <span className="metric-value">{totalApps}</span>
          <span className="metric-description">Dossiers in system</span>
        </div>
        <div className="metric-card" style={{ borderLeft: '4px solid #dc2626' }}>
          <span className="metric-label" style={{ color: '#991b1b' }}>Awaiting Action</span>
          <span className="metric-value" style={{ color: '#991b1b' }}>{awaitingAction}</span>
          <span className="metric-description">Missing docs or expired certificates</span>
        </div>
        <div className="metric-card" style={{ borderLeft: '4px solid #0284c7' }}>
          <span className="metric-label" style={{ color: '#0369a1' }}>Awaiting Review</span>
          <span className="metric-value" style={{ color: '#0369a1' }}>{awaitingReview}</span>
          <span className="metric-description">Submitted to Scrutiny Desk</span>
        </div>
        <div className="metric-card" style={{ borderLeft: '4px solid #d97706' }}>
          <span className="metric-label" style={{ color: '#92400e' }}>Validation Issues</span>
          <span className="metric-value" style={{ color: '#92400e' }}>{validationIssues}</span>
          <span className="metric-description">Discrepancies flagged by engine</span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2>Application Records</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Manage statutory approval applications, upload mandatory documents, and track AICTE scrutiny outcomes.
            </p>
          </div>
          <button onClick={loadData} className="btn btn-outline btn-sm">
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        {/* Search and Filters Toolbar */}
        <div className="toolbar">
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="form-input"
              placeholder="Search by Application No, Type or Keyword..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} color="var(--text-muted)" />
            <select
              className="form-select"
              style={{ width: 'auto' }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Submitted">Submitted</option>
              <option value="Action Required">Action Required</option>
              <option value="Awaiting Official Review">Awaiting Official Review</option>
              <option value="Under Review">Under Review</option>
              <option value="Review Completed">Review Completed</option>
            </select>
          </div>
        </div>

        {/* Applications Table */}
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Application No</th>
                <th>Type</th>
                <th>Academic Year</th>
                <th>Status</th>
                <th>Validation Outcome</th>
                <th>Last Updated</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '28px', color: 'var(--text-muted)' }}>
                    Loading applications...
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    <FileText size={36} style={{ opacity: 0.5, marginBottom: '8px' }} />
                    <p>No matching applications found.</p>
                  </td>
                </tr>
              ) : (
                applications.map(app => (
                  <tr key={app.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {app.application_number}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {app.documents?.length || 0} document attachment(s)
                      </div>
                    </td>
                    <td>{app.application_type}</td>
                    <td>{app.academic_year}</td>
                    <td>{getStatusBadge(app.status)}</td>
                    <td>
                      {app.overall_validation_outcome === 'Passed' ? (
                        <span className="badge badge-passed">Passed</span>
                      ) : app.overall_validation_outcome === 'Failed' ? (
                        <span className="badge badge-failed">Failed</span>
                      ) : app.overall_validation_outcome === 'Needs Review' ? (
                        <span className="badge badge-needs-review">Needs Review</span>
                      ) : (
                        <span className="badge badge-not-checked">Not Checked</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {new Date(app.updated_at).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link 
                        to={`/applications/${app.id}`} 
                        className="btn btn-outline btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Eye size={14} />
                        View Application
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Application Modal */}
      {showNewAppModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Initiate New AICTE Application</h3>
              <button 
                onClick={() => setShowNewAppModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem' }}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Application Type:</label>
                <select
                  className="form-select"
                  value={selectedAppType}
                  onChange={e => setSelectedAppType(e.target.value as ApplicationType)}
                >
                  <option value="Extension of Approval (EoA)">Extension of Approval (EoA)</option>
                  <option value="New Institution Approval">New Institution Approval</option>
                  <option value="Increase in Intake">Increase in Intake</option>
                  <option value="Introduction of New Course / Faculty">Introduction of New Course / Faculty</option>
                  <option value="Change in Site / Campus Location">Change in Site / Campus Location</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Academic Session:</label>
                <input
                  type="text"
                  className="form-input"
                  value={academicYear}
                  onChange={e => setAcademicYear(e.target.value)}
                />
              </div>

              <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '12px', borderRadius: '4px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                <strong>Checklist Notice:</strong> Initiating an application creates a draft. You will be guided to upload the required certificates and deeds as per the AICTE Approval Process Handbook.
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowNewAppModal(false)} className="btn btn-outline">
                Cancel
              </button>
              <button onClick={handleCreateApplication} className="btn btn-primary">
                Create Draft Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
