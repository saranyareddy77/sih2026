// AICTE SmartVerify — Scrutiny Command Center & Official Review Desk
// SIH Problem Statement 26261

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
  Users
} from 'lucide-react';
import { Application, ApplicationStatus, ValidationOutcome } from '../types';
import { applicationService } from '../services/applicationService';
import { authService } from '../services/authService';
import { SYNTHETIC_INSTITUTIONS } from '../data/syntheticDemoData';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const isSuperAdmin = authService.isSuperAdmin();
  const isOfficer = authService.isScrutinyOfficer();

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

  // Operational metrics derived directly and accurately from active application records
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
        return <span className="badge badge-info">{status}</span>;
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
        return <span className="badge badge-failed">Failed</span>;
      case 'Needs Review':
        return <span className="badge badge-needs-review">Needs Review</span>;
      default:
        return <span className="badge badge-draft">Not Checked</span>;
    }
  };

  // Jump to the highest priority item requiring official attention
  const handleReviewPriority = () => {
    const priorityApp = applications.find(a => a.status === 'Action Required') || 
                        applications.find(a => a.status === 'Awaiting Official Review') ||
                        applications[0];
    if (priorityApp) {
      navigate(`/applications/${priorityApp.id}`);
    }
  };

  return (
    <div className="app-container" style={{ paddingBottom: '60px' }}>
      {/* Clean Dashboard Header */}
      <div className="dashboard-header-clean">
        <div className="header-title-area">
          <h1 className="dashboard-main-title">
            {isSuperAdmin ? 'Scrutiny Command Center' : 'Scrutiny Review Desk'}
          </h1>
          <p className="dashboard-sub-title">
            {isSuperAdmin 
              ? 'System-wide regulatory overview of higher technical education approval dossiers.'
              : 'Assigned institutional approval dossiers requiring regulatory inspection and evidence verification.'}
          </p>
        </div>

        <div className="header-action-group">
          <button 
            onClick={handleReviewPriority}
            className="btn btn-emerald-primary btn-sm"
          >
            <Sparkles size={15} />
            Review Priority Dossier
          </button>

          <button 
            onClick={loadData} 
            className="btn btn-outline-clean btn-sm"
            title="Refresh dossier list"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {/* Responsive Metrics Grid with 5 Standard Metrics */}
      <div className="metrics-grid-5">
        <div className="metric-box">
          <div className="metric-label">Total Applications</div>
          <div className="metric-val">{totalApplications}</div>
          <div className="metric-sub">{isSuperAdmin ? 'System-wide dossiers' : 'Assigned workload'}</div>
        </div>

        <div className="metric-box border-rose">
          <div className="metric-label text-rose">Action Required</div>
          <div className="metric-val text-rose">{actionRequired}</div>
          <div className="metric-sub">Deficiencies flagged</div>
        </div>

        <div className="metric-box border-amber">
          <div className="metric-label text-amber">Awaiting Review</div>
          <div className="metric-val text-amber">{awaitingReview}</div>
          <div className="metric-sub">Queued for committee</div>
        </div>

        <div className="metric-box border-blue">
          <div className="metric-label text-blue">Under Review</div>
          <div className="metric-val text-blue">{underReview}</div>
          <div className="metric-sub">Active inspection</div>
        </div>

        <div className="metric-box border-emerald">
          <div className="metric-label text-emerald">Review Completed</div>
          <div className="metric-val text-emerald">{reviewCompleted}</div>
          <div className="metric-sub">Formal sign-off recorded</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="dashboard-content-card">
        {/* Table Filter & Search Controls */}
        <div className="dashboard-table-header">
          <div>
            <h2 className="table-heading">Approval Applications Queue</h2>
            <div className="table-subheading">
              Showing {applications.length} {applications.length === 1 ? 'dossier' : 'dossiers'}
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

        {/* Filter Toolbar */}
        <div className="filter-toolbar-grid">
          <div className="table-search-box">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              className="table-search-input"
              placeholder="Search by application number, institution, or code..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={institutionFilter}
            onChange={e => setInstitutionFilter(e.target.value)}
          >
            <option value="All">All Institutions</option>
            {SYNTHETIC_INSTITUTIONS.map(inst => (
              <option key={inst.id} value={inst.id}>
                {inst.name.length > 36 ? `${inst.name.substring(0, 34)}...` : inst.name}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={validationFilter}
            onChange={e => setValidationFilter(e.target.value)}
          >
            <option value="All">All Validation Outcomes</option>
            <option value="Passed">Automated Passed</option>
            <option value="Needs Review">Needs Review</option>
            <option value="Failed">Deficiencies Found</option>
          </select>

          <select
            className="filter-select"
            value={appTypeFilter}
            onChange={e => setAppTypeFilter(e.target.value)}
          >
            <option value="All">All Application Types</option>
            <option value="Extension of Approval (EoA)">Extension of Approval (EoA)</option>
            <option value="New Institution Approval">New Institution Approval</option>
            <option value="Increase in Intake">Increase in Intake</option>
          </select>
        </div>

        {/* Clean Application Table */}
        {loading ? (
          <div className="empty-loading-state">
            <RefreshCw size={24} className="spin text-emerald-600" />
            <p>Loading application dossiers...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="empty-loading-state">
            <FileText size={36} className="text-muted" />
            <h3 className="empty-title">No Applications Found</h3>
            <p className="empty-desc">No applications match your active filter criteria. Try adjusting your search query.</p>
          </div>
        ) : (
          <div className="table-responsive-wrapper">
            <table className="clean-data-table">
              <thead>
                <tr>
                  <th>Application &amp; Institution</th>
                  <th>Type &amp; Academic Year</th>
                  <th>Automated Checks</th>
                  <th>Scrutiny Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {applications.map(app => (
                  <tr key={app.id}>
                    <td>
                      <div className="app-cell-title">
                        <Link to={`/applications/${app.id}`} className="app-link">
                          {app.application_number}
                        </Link>
                        {app.is_synthetic_demo && (
                          <span className="demo-indicator-pill">Synthetic Case</span>
                        )}
                      </div>
                      <div className="app-cell-inst-name">
                        {app.institution?.name || 'Institution Record'}
                      </div>
                      <div className="app-cell-inst-code">
                        Permanent ID: {app.institution?.code || '—'}
                      </div>
                    </td>

                    <td>
                      <div className="app-cell-type">{app.application_type}</div>
                      <div className="app-cell-year">{app.academic_year}</div>
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
                        Review Dossier
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
    </div>
  );
};
