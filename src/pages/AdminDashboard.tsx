// AICTE SmartVerify — Administrator & Scrutiny Committee Dashboard
// SIH Problem Statement 26261

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  Building
} from 'lucide-react';
import { Application, ApplicationStatus, ValidationOutcome } from '../types';
import { applicationService } from '../services/applicationService';
import { SYNTHETIC_INSTITUTIONS } from '../data/syntheticDemoData';

export const AdminDashboard: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [institutionFilter, setInstitutionFilter] = useState<string>('All');
  const [validationFilter, setValidationFilter] = useState<string>('All');
  const [appTypeFilter, setAppTypeFilter] = useState<string>('All');

  const loadData = async () => {
    setLoading(true);
    try {
      const apps = await applicationService.getApplications({
        status: statusFilter === 'All' ? undefined : (statusFilter as ApplicationStatus),
        institutionId: institutionFilter === 'All' ? undefined : institutionFilter,
        validationOutcome: validationFilter === 'All' ? undefined : (validationFilter as ValidationOutcome),
        applicationType: appTypeFilter === 'All' ? undefined : appTypeFilter,
        searchTerm
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
  }, [searchTerm, statusFilter, institutionFilter, validationFilter, appTypeFilter]);

  // Metric Number Cards (Strictly no charts)
  const totalApplications = applications.length;
  const awaitingReview = applications.filter(a => a.status === 'Awaiting Official Review').length;
  const underReview = applications.filter(a => a.status === 'Under Review').length;
  const actionRequired = applications.filter(a => a.status === 'Action Required').length;
  const completed = applications.filter(a => a.status === 'Review Completed').length;

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
      case 'Under Review':
        return <span className="badge badge-info">{status}</span>;
      default:
        return <span className="badge badge-draft">{status}</span>;
    }
  };

  return (
    <div className="app-container">
      {/* Admin Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1>AICTE Scrutiny Committee &amp; Official Review Desk</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Central regulatory scrutiny dashboard for evaluating submitted institutional approval dossiers.
          </p>
        </div>
        <button onClick={loadData} className="btn btn-outline btn-sm">
          <RefreshCw size={14} />
          Refresh Queue
        </button>
      </div>

      {/* Metric Cards (Strictly simple number cards, NO charts) */}
      <div className="metrics-grid">
        <div className="metric-card">
          <span className="metric-label">Dossiers in Queue</span>
          <span className="metric-value">{totalApplications}</span>
          <span className="metric-description">Submitted applications</span>
        </div>
        <div className="metric-card" style={{ borderLeft: '4px solid #0284c7' }}>
          <span className="metric-label" style={{ color: '#0369a1' }}>Awaiting Review</span>
          <span className="metric-value" style={{ color: '#0369a1' }}>{awaitingReview}</span>
          <span className="metric-description">Checks passed; officer decision pending</span>
        </div>
        <div className="metric-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <span className="metric-label" style={{ color: '#6d28d9' }}>Under Active Review</span>
          <span className="metric-value" style={{ color: '#6d28d9' }}>{underReview}</span>
          <span className="metric-description">Committee inspection in progress</span>
        </div>
        <div className="metric-card" style={{ borderLeft: '4px solid #dc2626' }}>
          <span className="metric-label" style={{ color: '#991b1b' }}>Action Required</span>
          <span className="metric-value" style={{ color: '#991b1b' }}>{actionRequired}</span>
          <span className="metric-description">Institutions flagged for correction</span>
        </div>
        <div className="metric-card" style={{ borderLeft: '4px solid #059669' }}>
          <span className="metric-label" style={{ color: '#065f46' }}>Decisions Recorded</span>
          <span className="metric-value" style={{ color: '#065f46' }}>{completed}</span>
          <span className="metric-description">Approval review completed</span>
        </div>
      </div>

      {/* Search and Multi-filter Toolbar */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="form-input"
              placeholder="Search by ID, institute name, code..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <select
              className="form-select"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="All">All Scrutiny Statuses</option>
              <option value="Awaiting Official Review">Awaiting Official Review</option>
              <option value="Under Review">Under Review</option>
              <option value="Action Required">Action Required</option>
              <option value="Needs Review">Needs Review</option>
              <option value="Review Completed">Review Completed</option>
            </select>
          </div>

          <div>
            <select
              className="form-select"
              value={institutionFilter}
              onChange={e => setInstitutionFilter(e.target.value)}
            >
              <option value="All">All Institutions (10 Seeded)</option>
              {SYNTHETIC_INSTITUTIONS.map(inst => (
                <option key={inst.id} value={inst.id}>
                  {inst.name.substring(0, 32)}...
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              className="form-select"
              value={validationFilter}
              onChange={e => setValidationFilter(e.target.value)}
            >
              <option value="All">All Validation Outcomes</option>
              <option value="Passed">Automated Passed</option>
              <option value="Needs Review">Needs Human Review</option>
              <option value="Failed">Automated Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Scrutiny Queue Table */}
      <div className="card">
        <div className="card-header">
          <h2>Submitted Applications Review Queue</h2>
          <span className="badge badge-info" style={{ fontSize: '0.8125rem' }}>
            Showing {applications.length} Application{applications.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Application No</th>
                <th>Institution</th>
                <th>Type &amp; Academic Year</th>
                <th>Validation Engine Outcome</th>
                <th>Status</th>
                <th>Submission Date</th>
                <th style={{ textAlign: 'right' }}>Official Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    Loading review queue...
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No applications match the active filter criteria.
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
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                        {app.institution?.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Code: <strong>{app.institution?.code}</strong> • {app.institution?.city}, {app.institution?.state}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8125rem' }}>{app.application_type}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AY {app.academic_year}</div>
                    </td>
                    <td>
                      {app.overall_validation_outcome === 'Passed' ? (
                        <span className="badge badge-passed">
                          <CheckCircle2 size={12} />
                          Automated Passed
                        </span>
                      ) : app.overall_validation_outcome === 'Failed' ? (
                        <span className="badge badge-failed">
                          <AlertTriangle size={12} />
                          Automated Failed
                        </span>
                      ) : app.overall_validation_outcome === 'Needs Review' ? (
                        <span className="badge badge-needs-review">
                          <AlertTriangle size={12} />
                          Needs Review
                        </span>
                      ) : (
                        <span className="badge badge-not-checked">Not Checked</span>
                      )}
                    </td>
                    <td>{getStatusBadge(app.status)}</td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {app.submission_date ? new Date(app.submission_date).toLocaleDateString() : 'Draft'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link 
                        to={`/applications/${app.id}`} 
                        className="btn btn-primary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Eye size={14} />
                        Review Dossier
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
