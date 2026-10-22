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
  HelpCircle,
  AlertTriangle,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Application, ApplicationStatus, ApplicationType, ValidationOutcome } from '../types';
import { applicationService } from '../services/applicationService';
import { authService } from '../services/authService';
import { REQUIRED_DOCUMENTS_BY_TYPE } from '../services/validationService';

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

  // Metrics derived from the institution's actual applications
  const totalApps = applications.length;
  const awaitingAction = applications.filter(a => a.status === 'Action Required' || a.overall_validation_outcome === 'Failed').length;
  const inScrutiny = applications.filter(a => a.status === 'Awaiting Official Review' || a.status === 'Submitted' || a.status === 'Under Review').length;
  const approved = applications.filter(a => a.status === 'Review Completed').length;

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

  // Find any urgent deficiency across the institution's dossiers
  const urgentApp = applications.find(a => a.status === 'Action Required') || 
                    applications.find(a => a.overall_validation_outcome === 'Failed');

  return (
    <div className="app-container" style={{ paddingBottom: '60px' }}>
      {/* Institution Identity & Status Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f2d59 0%, #0369a1 100%)',
        color: '#ffffff',
        borderRadius: '12px',
        padding: '26px 30px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        boxShadow: '0 4px 16px -2px rgba(15, 45, 89, 0.2)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.9, fontSize: '0.8125rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <Building2 size={16} color="#38bdf8" />
            <span>AICTE Permanent Institute ID: <strong>{institution?.code || '1-1092837411'}</strong></span>
            <span>• AISHE: <strong>{institution?.aishe_code || 'C-48192'}</strong></span>
          </div>
          <h1 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 700, margin: '0 0 6px 0' }}>
            {institution?.name || 'Authorized Technical Institution'}
          </h1>
          <p style={{ opacity: 0.85, fontSize: '0.875rem', margin: 0 }}>
            {institution?.address}, {institution?.city}, {institution?.state} — {institution?.pincode}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setShowNewAppModal(true)}
            className="btn"
            style={{ 
              backgroundColor: '#ffffff', 
              color: '#0f2d59', 
              padding: '10px 20px', 
              fontWeight: 700,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
          >
            <Plus size={16} />
            File New Application
          </button>

          <button 
            onClick={loadData} 
            className="btn btn-outline btn-sm"
            style={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.08)' }}
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {/* Urgent Rectification Alert Banner (if any application has deficiencies) */}
      {urgentApp && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '10px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={24} color="#dc2626" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, color: '#991b1b', fontSize: '0.9375rem' }}>
                Action Required: Scrutiny Committee Rectification Requested
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#b91c1c', marginTop: '2px' }}>
                Application <strong>{urgentApp.application_number}</strong> ({urgentApp.application_type}) has flagged deficiencies requiring replacement documents or official clarification.
              </div>
            </div>
          </div>

          <Link
            to={`/applications/${urgentApp.id}`}
            className="btn btn-sm"
            style={{ 
              backgroundColor: '#dc2626', 
              color: '#ffffff', 
              fontWeight: 600,
              padding: '8px 16px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Upload size={14} />
            Rectify Deficiency Now
          </Link>
        </div>
      )}

      {/* Institution Metric Summary */}
      <div className="metrics-grid" style={{ marginBottom: '24px' }}>
        <div className="metric-card">
          <span className="metric-label">Total Applications</span>
          <span className="metric-value">{totalApps}</span>
          <span className="metric-description">Approval dossiers on file</span>
        </div>

        <div className="metric-card" style={{ borderLeft: '4px solid #dc2626' }}>
          <span className="metric-label" style={{ color: '#991b1b' }}>Deficiencies Flagged</span>
          <span className="metric-value" style={{ color: '#991b1b' }}>{awaitingAction}</span>
          <span className="metric-description">Require replacement documents</span>
        </div>

        <div className="metric-card" style={{ borderLeft: '4px solid #0284c7' }}>
          <span className="metric-label" style={{ color: '#0369a1' }}>Under Official Scrutiny</span>
          <span className="metric-value" style={{ color: '#0369a1' }}>{inScrutiny}</span>
          <span className="metric-description">AICTE committee evaluation in progress</span>
        </div>

        <div className="metric-card" style={{ borderLeft: '4px solid #059669' }}>
          <span className="metric-label" style={{ color: '#065f46' }}>Approvals Granted</span>
          <span className="metric-value" style={{ color: '#065f46' }}>{approved}</span>
          <span className="metric-description">Formal review completed</span>
        </div>
      </div>

      {/* Applications List */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Institutional Approval Filings
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Statutory compliance records, document uploads, and validation outcomes for {institution?.name || 'this institution'}.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {['All', 'Action Required', 'Awaiting Official Review', 'Review Completed'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
              >
                {st === 'All' ? 'All' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div style={{ marginBottom: '16px', maxWidth: '400px' }}>
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="form-input"
              placeholder="Search by application number or type..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Applications List Rows */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="spin" style={{ marginBottom: '8px' }} />
            <p>Loading institutional applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
            <FileText size={40} style={{ opacity: 0.5, marginBottom: '8px' }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>No Applications Found</h3>
            <p style={{ fontSize: '0.875rem', marginBottom: '16px' }}>
              You have not filed any approval applications yet, or no applications match the active filter.
            </p>
            <button onClick={() => setShowNewAppModal(true)} className="btn btn-primary">
              <Plus size={16} /> File New Application
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {applications.map(app => {
              const reqDocs = REQUIRED_DOCUMENTS_BY_TYPE[app.application_type] || REQUIRED_DOCUMENTS_BY_TYPE['Extension of Approval (EoA)'];
              const uploadedCount = app.documents?.length || 0;
              const hasDeficiency = app.status === 'Action Required' || app.overall_validation_outcome === 'Failed';
              const firstFailedFinding = (app.findings || []).find(f => f.result === 'Failed');

              return (
                <div
                  key={app.id}
                  className="action-queue-row"
                  onClick={() => navigate(`/applications/${app.id}`)}
                >
                  {/* Left Column: ID & Status */}
                  <div style={{ minWidth: '180px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {app.application_number}
                    </div>
                    <div>{getStatusBadge(app.status)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      AY {app.academic_year}
                    </div>
                  </div>

                  {/* Middle Column: Progress & Deficiency info */}
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {app.application_type}
                    </div>

                    {/* Document Readiness Progress Bar */}
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                        <span>Document Readiness</span>
                        <span><strong>{uploadedCount}</strong> of <strong>{reqDocs.length}</strong> required certificates uploaded</span>
                      </div>
                      <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            height: '100%', 
                            width: `${Math.min(100, (uploadedCount / reqDocs.length) * 100)}%`,
                            backgroundColor: uploadedCount >= reqDocs.length ? '#059669' : '#0284c7',
                            borderRadius: '3px'
                          }} 
                        />
                      </div>
                    </div>

                    {/* Deficiency Chip */}
                    {hasDeficiency && firstFailedFinding ? (
                      <span className="deficiency-chip failed">
                        <AlertTriangle size={12} color="#dc2626" />
                        <strong>Rectification Required:</strong> {firstFailedFinding.check_name} ({firstFailedFinding.observed_value || 'Check failed'})
                      </span>
                    ) : app.overall_validation_outcome === 'Passed' ? (
                      <span className="deficiency-chip passed">
                        <CheckCircle2 size={12} color="#059669" />
                        All statutory documents validated and compliant
                      </span>
                    ) : (
                      <span className="deficiency-chip review">
                        <Clock size={12} color="#d97706" />
                        Application submitted for scrutiny review
                      </span>
                    )}
                  </div>

                  {/* Right Column: CTA */}
                  <div>
                    <Link
                      to={`/applications/${app.id}`}
                      onClick={e => e.stopPropagation()}
                      className="btn btn-primary btn-sm"
                      style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        padding: '8px 14px' 
                      }}
                    >
                      <Eye size={14} />
                      {hasDeficiency ? 'Rectify / Replace' : 'Inspect Dossier'}
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create New Application Modal */}
      {showNewAppModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>File New AICTE Approval Application</h3>
              <button 
                onClick={() => setShowNewAppModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem' }}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Select Approval Category:</label>
                <select
                  className="form-select"
                  value={selectedAppType}
                  onChange={e => setSelectedAppType(e.target.value as ApplicationType)}
                >
                  <option value="Extension of Approval (EoA)">Extension of Approval (EoA)</option>
                  <option value="Increase in Intake">Increase in Intake</option>
                  <option value="New Technical Institution">New Technical Institution</option>
                  <option value="Introduction of New Course">Introduction of New Course</option>
                  <option value="Closure of Institution">Closure of Institution</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Academic Year:</label>
                <input
                  type="text"
                  className="form-input"
                  value={academicYear}
                  onChange={e => setAcademicYear(e.target.value)}
                />
              </div>

              <div style={{ backgroundColor: '#eff6ff', padding: '12px', borderRadius: '6px', fontSize: '0.8125rem', color: '#1e40af' }}>
                <strong>Statutory Filing Note:</strong> Creating this application will generate a new application record under <strong>{institution?.name}</strong> and initialize the mandatory document checklist per the AICTE Approval Process Handbook (APH 2026-2027).
              </div>
            </div>
            <div className="modal-footer">
              <button 
                onClick={() => setShowNewAppModal(false)} 
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateApplication} 
                className="btn btn-primary"
              >
                Create Application Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
