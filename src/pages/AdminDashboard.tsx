// AICTE SmartVerify — Central Complaint Monitoring & Status Dashboard
// SIH Problem Statement: Integrated Institution Complaint Monitoring and Status Dashboard for AICTE

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
  ArrowLeftRight
} from 'lucide-react';
import { Application, ApplicationStatus, BureauCell, ComplaintCategory } from '../types';
import { applicationService } from '../services/applicationService';
import { complaintService } from '../services/complaintService';
import { authService } from '../services/authService';
import { SYNTHETIC_INSTITUTIONS } from '../data/syntheticDemoData';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const isSuperAdmin = authService.isSuperAdmin();

  const [complaints, setComplaints] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [institutionFilter, setInstitutionFilter] = useState<string>('All');
  const [bureauFilter, setBureauFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [regionFilter, setRegionFilter] = useState<string>('All');
  const [overlapOnly, setOverlapOnly] = useState<boolean>(false);
  const [overdueOnly, setOverdueOnly] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await applicationService.getApplications({
        status: statusFilter === 'All' ? undefined : (statusFilter as ApplicationStatus),
        institutionId: institutionFilter === 'All' ? undefined : institutionFilter,
        bureau: bureauFilter === 'All' ? undefined : bureauFilter,
        category: categoryFilter === 'All' ? undefined : categoryFilter,
        region: regionFilter === 'All' ? undefined : regionFilter,
        overlapOnly: overlapOnly ? true : undefined,
        overdueOnly: overdueOnly ? true : undefined,
        searchTerm
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
  }, [searchTerm, statusFilter, institutionFilter, bureauFilter, categoryFilter, regionFilter, overlapOnly, overdueOnly]);

  // Operational metrics derived directly and dynamically from database records
  const metrics = complaintService.calculateMetrics();

  const getStatusBadge = (status: ApplicationStatus | string) => {
    switch (status) {
      case 'Disposed':
      case 'Closed':
      case 'Review Completed':
      case 'Verification Complete':
        return <span className="badge badge-passed">{status}</span>;
      case 'Escalated':
      case 'Action Required':
        return <span className="badge badge-failed">{status}</span>;
      case 'Transferred':
        return <span className="badge badge-needs-review" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>Transferred</span>;
      case 'Awaiting Information':
      case 'Needs Review':
      case 'Authenticity Confirmation Pending':
        return <span className="badge badge-needs-review">{status}</span>;
      case 'Under Process':
      case 'Under Review':
      case 'Awaiting Official Review':
      case 'Submitted':
        return <span className="badge badge-info">{status}</span>;
      case 'Pending':
      case 'Received':
      default:
        return <span className="badge badge-draft">{status || 'Received'}</span>;
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

  const activeOverlaps = complaints.filter(c => c.overlap_status === 'Potential Overlap Detected' || c.overlap_status === 'Confirmed Overlap - Coordinated');

  return (
    <div className="app-container" style={{ paddingBottom: '60px' }}>
      {/* Clean Dashboard Header */}
      <div className="dashboard-header-clean">
        <div className="header-title-area">
          <h1 className="dashboard-main-title">
            {isSuperAdmin ? 'Central Complaint Monitoring Dashboard' : 'Bureau Complaint Review Desk'}
          </h1>
          <p className="dashboard-sub-title">
            Integrated institution complaint tracking across Regulation Bureau (RB), Public Grievance Redressal Cell (PGRC), Vigilance Cell, and Regional Desks.
          </p>
        </div>

        <div className="header-action-group">
          <button 
            onClick={handleReviewPriority}
            className="btn btn-emerald-primary btn-sm"
            title="Open highest priority or overlapping complaint"
          >
            <Sparkles size={15} />
            Review Priority Complaint
          </button>

          <button 
            onClick={handleExportCSV}
            className="btn btn-outline-clean btn-sm"
            title="Export filtered records to CSV"
          >
            <Download size={14} />
            Export CSV
          </button>

          <button 
            onClick={loadData} 
            className="btn btn-outline-clean btn-sm"
            title="Refresh complaints queue"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
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
                Potential Overlapping Cases — Coordination Required
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#b45309' }}>
                Active concurrent complaints detected for <strong>ABC Engineering College</strong> across <strong>Public Grievance Redressal Cell (PGRC-2026-001)</strong> and <strong>Regulation Bureau (RB-2026-014)</strong>. Joint scrutiny recommended.
              </div>
            </div>
          </div>
          <button 
            onClick={() => {
              setOverlapOnly(true);
              setStatusFilter('All');
            }}
            className="btn btn-outline-clean btn-xs"
            style={{ borderColor: '#d97706', color: '#92400e', whiteSpace: 'nowrap' }}
          >
            Filter Overlapping Cases
            <ChevronRight size={13} />
          </button>
        </div>
      )}

      {/* Responsive Metrics Grid with 5 Standard Metrics */}
      <div className="metrics-grid-5">
        <div className="metric-box">
          <div className="metric-label">Total Complaints</div>
          <div className="metric-val">{metrics.totalComplaints}</div>
          <div className="metric-sub">Registered across all Bureaus</div>
        </div>

        <div className="metric-box border-rose">
          <div className="metric-label text-rose">Pending Scrutiny</div>
          <div className="metric-val text-rose">{metrics.pendingCases}</div>
          <div className="metric-sub">Received &amp; awaiting action</div>
        </div>

        <div className="metric-box border-blue">
          <div className="metric-label text-blue">Under Process</div>
          <div className="metric-val text-blue">{metrics.underProcess}</div>
          <div className="metric-sub">Active inquiry &amp; review</div>
        </div>

        <div className="metric-box border-amber">
          <div className="metric-label text-amber">Potential Overlaps</div>
          <div className="metric-val text-amber">{metrics.potentialOverlaps}</div>
          <div className="metric-sub">Multi-Bureau coordination</div>
        </div>

        <div className="metric-box border-emerald">
          <div className="metric-label text-emerald">Disposed / Closed</div>
          <div className="metric-val text-emerald">{metrics.disposedCases}</div>
          <div className="metric-sub">Final order recorded</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="dashboard-content-card">
        {/* Table Filter & Search Controls */}
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
                    setStatusFilter('All');
                  } else {
                    setOverlapOnly(false);
                    setStatusFilter(tab.id);
                  }
                }}
                className={`quick-tab-btn ${
                  (tab.id === 'OVERLAP' && overlapOnly) || (tab.id !== 'OVERLAP' && !overlapOnly && statusFilter === tab.id) 
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
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Bureau Filter */}
          <select
            className="filter-select"
            value={bureauFilter}
            onChange={e => setBureauFilter(e.target.value)}
          >
            <option value="All">All Bureaus &amp; Cells</option>
            <option value="Regulation Bureau">Regulation Bureau (RB)</option>
            <option value="Public Grievance">Public Grievance Redressal Cell (PGRC)</option>
            <option value="Vigilance Cell">Vigilance Cell</option>
            <option value="Regional Office">Regional Offices (RO)</option>
          </select>

          {/* Institution Filter */}
          <select
            className="filter-select"
            value={institutionFilter}
            onChange={e => setInstitutionFilter(e.target.value)}
          >
            <option value="All">All Institutions</option>
            {SYNTHETIC_INSTITUTIONS.map(inst => (
              <option key={inst.id} value={inst.id}>
                {inst.name.length > 34 ? `${inst.name.substring(0, 32)}...` : inst.name}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            className="filter-select"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
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

          {/* Region Filter */}
          <select
            className="filter-select"
            value={regionFilter}
            onChange={e => setRegionFilter(e.target.value)}
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

        {/* Clean Application & Complaint Table */}
        {loading ? (
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
                setStatusFilter('All');
                setBureauFilter('All');
                setInstitutionFilter('All');
                setCategoryFilter('All');
                setRegionFilter('All');
                setOverlapOnly(false);
                setOverdueOnly(false);
                setSearchTerm('');
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
    </div>
  );
};
