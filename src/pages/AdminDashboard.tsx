// AICTE SmartVerify — Scrutiny Command Center & Official Review Desk
// SIH Problem Statement 26261

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  ChevronRight
} from 'lucide-react';
import { Application, ApplicationStatus, ValidationOutcome, ValidationFinding } from '../types';
import { applicationService } from '../services/applicationService';
import { SYNTHETIC_INSTITUTIONS } from '../data/syntheticDemoData';
import { isSupabaseConfigured } from '../services/supabaseClient';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [institutionFilter, setInstitutionFilter] = useState<string>('All');
  const [validationFilter, setValidationFilter] = useState<string>('All');
  const [appTypeFilter, setAppTypeFilter] = useState<string>('All');

  const isLive = isSupabaseConfigured();

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

  // Operational metrics derived directly from actual data
  const totalApplications = applications.length;
  const awaitingReview = applications.filter(a => a.status === 'Awaiting Official Review' || a.status === 'Under Review').length;
  const actionRequired = applications.filter(a => a.status === 'Action Required' || a.overall_validation_outcome === 'Failed').length;
  const readyForSignoff = applications.filter(a => a.overall_validation_outcome === 'Passed' && a.status !== 'Review Completed').length;
  const completed = applications.filter(a => a.status === 'Review Completed').length;

  // Find the primary issue/deficiency for an application
  const getPrimaryDeficiencyChip = (app: Application) => {
    const findings = app.findings || [];
    const failedFinding = findings.find(f => f.result === 'Failed');
    if (failedFinding) {
      return {
        label: failedFinding.check_name,
        detail: failedFinding.observed_value || failedFinding.explanation,
        type: 'failed' as const
      };
    }
    const reviewFinding = findings.find(f => f.result === 'Needs Review');
    if (reviewFinding) {
      return {
        label: reviewFinding.check_name,
        detail: reviewFinding.observed_value || reviewFinding.explanation,
        type: 'review' as const
      };
    }
    if (app.overall_validation_outcome === 'Passed') {
      return {
        label: 'All 10 Automated Checks Passed',
        detail: 'Ready for official scrutiny committee sign-off',
        type: 'passed' as const
      };
    }
    return {
      label: 'Checks Pending Evaluation',
      detail: 'Awaiting re-run or document upload',
      type: 'pending' as const
    };
  };

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

  // Jump to the highest priority item (first Action Required or Awaiting Review)
  const handleReviewNext = () => {
    const priorityApp = applications.find(a => a.status === 'Action Required') || 
                        applications.find(a => a.status === 'Awaiting Official Review') ||
                        applications[0];
    if (priorityApp) {
      navigate(`/applications/${priorityApp.id}`);
    }
  };

  return (
    <div className="app-container" style={{ paddingBottom: '60px' }}>
      {/* Ministry & Central Scrutiny Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0f2d59 0%, #0b1528 100%)',
        color: '#ffffff',
        borderRadius: '12px',
        padding: '24px 28px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 4px 16px -2px rgba(15, 45, 89, 0.2)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#38bdf8', marginBottom: '6px' }}>
            <Shield size={14} />
            <span>AICTE Approval Process Handbook (APH 2026-27) • Central Scrutiny Desk</span>
            <span style={{ 
              backgroundColor: isLive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              color: isLive ? '#34d399' : '#fbbf24',
              padding: '2px 8px',
              borderRadius: '9999px',
              fontSize: '0.6875rem'
            }}>
              {isLive ? 'Live Backend Connected' : 'Demo Mode Active'}
            </span>
          </div>

          <h1 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 700, margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>
            Scrutiny Command Center
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0, maxWidth: '640px', lineHeight: 1.5 }}>
            Evidence-grounded regulatory evaluation desk. Inspect institutional approval dossiers, verify extracted PDF citations, examine cross-document discrepancies, and record official committee scrutiny decisions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            onClick={handleReviewNext}
            className="btn"
            style={{ 
              backgroundColor: '#0284c7', 
              color: '#ffffff', 
              padding: '10px 18px', 
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)'
            }}
          >
            <Sparkles size={16} />
            Review Priority Dossier
          </button>

          <button 
            onClick={loadData} 
            className="btn btn-outline btn-sm"
            style={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.05)' }}
            title="Reload application queue"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {/* Operational Summary Metric Cards (strictly derived from real application counts) */}
      <div className="metrics-grid" style={{ marginBottom: '24px' }}>
        <div className="metric-card">
          <span className="metric-label">Dossiers in Queue</span>
          <span className="metric-value">{totalApplications}</span>
          <span className="metric-description">
            {isLive ? 'Authoritative database records' : 'Deterministic SIH demonstration records'}
          </span>
        </div>

        <div className="metric-card" style={{ borderLeft: '4px solid #dc2626' }}>
          <span className="metric-label" style={{ color: '#991b1b' }}>Action Required</span>
          <span className="metric-value" style={{ color: '#991b1b' }}>{actionRequired}</span>
          <span className="metric-description">Deficiencies flagged for institution correction</span>
        </div>

        <div className="metric-card" style={{ borderLeft: '4px solid #0284c7' }}>
          <span className="metric-label" style={{ color: '#0369a1' }}>In Active Scrutiny</span>
          <span className="metric-value" style={{ color: '#0369a1' }}>{awaitingReview}</span>
          <span className="metric-description">Under official officer inspection</span>
        </div>

        <div className="metric-card" style={{ borderLeft: '4px solid #059669' }}>
          <span className="metric-label" style={{ color: '#065f46' }}>Ready for Sign-off</span>
          <span className="metric-value" style={{ color: '#065f46' }}>{readyForSignoff}</span>
          <span className="metric-description">All automated checks passed</span>
        </div>

        <div className="metric-card" style={{ borderLeft: '4px solid #64748b' }}>
          <span className="metric-label" style={{ color: '#334155' }}>Decisions Recorded</span>
          <span className="metric-value" style={{ color: '#334155' }}>{completed}</span>
          <span className="metric-description">Formal committee decisions archived</span>
        </div>
      </div>

      {/* Action Queue Section */}
      <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
        {/* Search & Multi-filter Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Scrutiny Action Queue
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Showing {applications.length} submitted institutional approval {applications.length === 1 ? 'dossier' : 'dossiers'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['All', 'Action Required', 'Awaiting Official Review', 'Review Completed'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
              >
                {st === 'All' ? 'All Applications' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Toolbar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
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
              value={institutionFilter}
              onChange={e => setInstitutionFilter(e.target.value)}
            >
              <option value="All">All Institutions (10 Seeded)</option>
              {SYNTHETIC_INSTITUTIONS.map(inst => (
                <option key={inst.id} value={inst.id}>
                  {inst.name.substring(0, 34)}...
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
              <option value="Failed">Automated Failed (Deficiencies)</option>
            </select>
          </div>

          <div>
            <select
              className="form-select"
              value={appTypeFilter}
              onChange={e => setAppTypeFilter(e.target.value)}
            >
              <option value="All">All Application Types</option>
              <option value="Extension of Approval (EoA)">Extension of Approval (EoA)</option>
              <option value="Increase in Intake">Increase in Intake</option>
              <option value="New Technical Institution">New Technical Institution</option>
              <option value="Introduction of New Course">Introduction of New Course</option>
              <option value="Closure of Institution">Closure of Institution</option>
            </select>
          </div>
        </div>

        {/* Action Queue List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="spin" style={{ marginBottom: '8px', opacity: 0.7 }} />
            <p>Loading scrutiny action queue...</p>
          </div>
        ) : applications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
            <FileText size={36} style={{ marginBottom: '8px', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '4px' }}>No Applications Found</h3>
            <p style={{ fontSize: '0.8125rem' }}>No dossiers match your active filter criteria. Try resetting filters.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {applications.map(app => {
              const chip = getPrimaryDeficiencyChip(app);
              const docCount = app.documents?.length || 0;

              return (
                <div 
                  key={app.id}
                  className="action-queue-row"
                  onClick={() => navigate(`/applications/${app.id}`)}
                >
                  {/* Left Column: ID & Status */}
                  <div style={{ minWidth: '180px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                        {app.application_number}
                      </span>
                    </div>
                    <div>{getStatusBadge(app.status)}</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {app.submission_date ? `Submitted ${new Date(app.submission_date).toLocaleDateString()}` : 'Draft'}
                    </div>
                  </div>

                  {/* Middle Column: Institution & Details */}
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)', marginBottom: '2px' }}>
                      {app.institution?.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <span>AICTE ID: <strong>{app.institution?.code}</strong></span>
                      <span>Type: <strong>{app.application_type}</strong></span>
                      <span>AY: <strong>{app.academic_year}</strong></span>
                      <span>Attachments: <strong>{docCount}</strong></span>
                    </div>

                    {/* Prominent Primary Deficiency / Attention Chip */}
                    <div style={{ marginTop: '8px' }}>
                      <span className={`deficiency-chip ${chip.type}`}>
                        {chip.type === 'failed' ? (
                          <AlertTriangle size={12} color="#dc2626" />
                        ) : chip.type === 'review' ? (
                          <AlertCircle size={12} color="#d97706" />
                        ) : (
                          <CheckCircle2 size={12} color="#059669" />
                        )}
                        <strong>{chip.label}</strong>
                        {chip.detail && <span style={{ opacity: 0.85, fontWeight: 400 }}>— {chip.detail}</span>}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: CTA */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Link
                      to={`/applications/${app.id}`}
                      onClick={e => e.stopPropagation()}
                      className="btn btn-primary btn-sm"
                      style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        padding: '8px 14px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <Eye size={14} />
                      Open Workbench
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
