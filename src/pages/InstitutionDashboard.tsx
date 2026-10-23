// AICTE SmartVerify — Institution Compliance & Approval Portal
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
  Hash
} from 'lucide-react';
import { Application, ApplicationStatus, ApplicationType, ValidationOutcome } from '../types';
import { applicationService } from '../services/applicationService';
import { authService } from '../services/authService';

export const InstitutionDashboard: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const institution = currentUser?.institution;

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [showNewAppModal, setShowNewAppModal] = useState<boolean>(false);
  const [selectedAppType, setSelectedAppType] = useState<ApplicationType>('Extension of Approval (EoA)');
  const [academicYear, setAcademicYear] = useState<string>('2026-2027');

  const loadData = async () => {
    setLoading(true);
    try {
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

  // Operational metrics derived accurately from institution's active applications
  const totalApplications = applications.length;
  const actionRequired = applications.filter(a => a.status === 'Action Required' || a.overall_validation_outcome === 'Failed').length;
  const awaitingReview = applications.filter(a => a.status === 'Awaiting Official Review').length;
  const underReview = applications.filter(a => a.status === 'Under Review' || a.status === 'Submitted' || a.status === 'Needs Review' || a.status === 'Authenticity Confirmation Pending').length;
  const reviewCompleted = applications.filter(a => a.status === 'Review Completed' || a.status === 'Verification Complete').length;

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

  const getValidationBadge = (outcome?: ValidationOutcome) => {
    switch (outcome) {
      case 'Passed':
        return <span className="badge badge-passed">Passed</span>;
      case 'Failed':
        return <span className="badge badge-failed">Deficiencies</span>;
      case 'Needs Review':
        return <span className="badge badge-needs-review">Needs Review</span>;
      default:
        return <span className="badge badge-draft">Draft</span>;
    }
  };

  // Urgent notice if any application has deficiencies requiring correction
  const urgentApp = applications.find(a => a.status === 'Action Required' || a.overall_validation_outcome === 'Failed');

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
          </div>
          <h1 className="dashboard-main-title">
            {institution?.name || 'Institution Approval Portal'}
          </h1>
          <p className="dashboard-sub-title">
            {institution?.address ? `${institution.address}, ${institution.city}, ${institution.state}` : 'Manage institutional approval dossiers, upload regulatory deeds, and monitor scrutiny findings.'}
          </p>
        </div>

        <div className="header-action-group">
          <button 
            onClick={() => setShowNewAppModal(true)}
            className="btn btn-emerald-primary btn-sm"
          >
            <Plus size={15} />
            File New Application
          </button>

          <button 
            onClick={loadData} 
            className="btn btn-outline-clean btn-sm"
            title="Refresh application list"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {/* Urgent Deficiency Notice if Action Required */}
      {urgentApp && (
        <div className="action-required-banner">
          <div className="banner-left">
            <AlertTriangle size={20} className="text-rose" />
            <div>
              <div className="banner-title">Action Required on Application {urgentApp.application_number}</div>
              <div className="banner-desc">Automated validation detected regulatory omissions or expired certificates. Please inspect findings and upload corrected deeds.</div>
            </div>
          </div>
          <Link to={`/applications/${urgentApp.id}`} className="btn btn-rose-subtle btn-sm">
            Resolve Issues
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Responsive Metrics Grid with 5 Standard Metrics */}
      <div className="metrics-grid-5">
        <div className="metric-box">
          <div className="metric-label">Total Applications</div>
          <div className="metric-val">{totalApplications}</div>
          <div className="metric-sub">Submitted dossiers</div>
        </div>

        <div className="metric-box border-rose">
          <div className="metric-label text-rose">Action Required</div>
          <div className="metric-val text-rose">{actionRequired}</div>
          <div className="metric-sub">Requires resubmission</div>
        </div>

        <div className="metric-box border-amber">
          <div className="metric-label text-amber">Awaiting Review</div>
          <div className="metric-val text-amber">{awaitingReview}</div>
          <div className="metric-sub">Queued for committee</div>
        </div>

        <div className="metric-box border-blue">
          <div className="metric-label text-blue">Under Review</div>
          <div className="metric-val text-blue">{underReview}</div>
          <div className="metric-sub">Officer inspection</div>
        </div>

        <div className="metric-box border-emerald">
          <div className="metric-label text-emerald">Review Completed</div>
          <div className="metric-val text-emerald">{reviewCompleted}</div>
          <div className="metric-sub">Approved / Signed off</div>
        </div>
      </div>

      {/* Applications Table Card */}
      <div className="dashboard-content-card">
        <div className="dashboard-table-header">
          <div>
            <h2 className="table-heading">Institution Applications</h2>
            <div className="table-subheading">
              Showing {applications.length} submitted institutional {applications.length === 1 ? 'dossier' : 'dossiers'}
            </div>
          </div>

          <div className="table-quick-tabs">
            {['All', 'Action Required', 'Awaiting Official Review', 'Review Completed'].map(st => (
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
              placeholder="Search by application number or type..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="All">All Scrutiny Statuses</option>
            <option value="Action Required">Action Required</option>
            <option value="Awaiting Official Review">Awaiting Official Review</option>
            <option value="Under Review">Under Review</option>
            <option value="Review Completed">Review Completed</option>
          </select>
        </div>

        {/* Data Table */}
        {loading ? (
          <div className="empty-loading-state">
            <RefreshCw size={24} className="spin text-emerald-600" />
            <p>Loading application dossiers...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="empty-loading-state">
            <FileText size={36} className="text-muted" />
            <h3 className="empty-title">No Applications Found</h3>
            <p className="empty-desc">Your institution has not submitted any approval dossiers matching this criteria.</p>
            <button 
              onClick={() => setShowNewAppModal(true)}
              className="btn btn-emerald-primary btn-sm"
              style={{ marginTop: '12px' }}
            >
              <Plus size={14} />
              File First Application
            </button>
          </div>
        ) : (
          <div className="table-responsive-wrapper">
            <table className="clean-data-table">
              <thead>
                <tr>
                  <th>Application Number</th>
                  <th>Application Type</th>
                  <th>Academic Year</th>
                  <th>Validation Outcome</th>
                  <th>Scrutiny Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {applications.map(app => (
                  <tr key={app.id}>
                    <td>
                      <Link to={`/applications/${app.id}`} className="app-link">
                        {app.application_number}
                      </Link>
                      {app.is_synthetic_demo && (
                        <span className="demo-indicator-pill" style={{ marginLeft: '8px' }}>Demo Case</span>
                      )}
                    </td>

                    <td>
                      <div className="app-cell-type">{app.application_type}</div>
                    </td>

                    <td>
                      <span className="app-cell-year">{app.academic_year}</span>
                    </td>

                    <td>
                      {getValidationBadge(app.overall_validation_outcome)}
                    </td>

                    <td>
                      {getStatusBadge(app.status)}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <Link
                        to={`/applications/${app.id}`}
                        className="btn btn-outline-clean btn-xs"
                      >
                        View Dossier
                        <ChevronRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Application Modal */}
      {showNewAppModal && (
        <div className="modal-overlay" onClick={() => setShowNewAppModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h2>File Regulatory Approval Application</h2>
              <button onClick={() => setShowNewAppModal(false)} className="modal-close-btn">✕</button>
            </div>
            <div style={{ padding: '20px' }}>
              <div className="form-group">
                <label className="form-label">Application Type</label>
                <select
                  className="form-input"
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
                <label className="form-label">Academic Year</label>
                <select
                  className="form-input"
                  value={academicYear}
                  onChange={e => setAcademicYear(e.target.value)}
                >
                  <option value="2026-2027">2026-2027 (Current Cycle)</option>
                  <option value="2027-2028">2027-2028</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setShowNewAppModal(false)}
                  className="btn btn-secondary-subtle"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateApplication}
                  className="btn btn-emerald-primary"
                >
                  Initialize Application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
