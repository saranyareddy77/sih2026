// AICTE SmartVerify — Validation Findings & Compliance Panel
// SIH Problem Statement 26261

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  HelpCircle, 
  ShieldCheck, 
  UserCheck, 
  FileSearch,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ValidationFinding, ValidationOutcome } from '../types';
import { applicationService } from '../services/applicationService';
import { authService } from '../services/authService';

interface ValidationFindingsPanelProps {
  applicationId: string;
  findings: ValidationFinding[];
  selectedDocumentId?: string;
  onFindingUpdated?: () => void;
}

export const ValidationFindingsPanel: React.FC<ValidationFindingsPanelProps> = ({
  applicationId,
  findings,
  selectedDocumentId,
  onFindingUpdated
}) => {
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('All');
  const [reviewNoteModalFinding, setReviewNoteModalFinding] = useState<ValidationFinding | null>(null);
  const [reviewNoteText, setReviewNoteText] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);

  const isAdmin = authService.isAdmin();
  const currentUser = authService.getCurrentUser();

  // Filter findings: if a document is selected, show its findings or application-level findings
  let displayedFindings = findings;
  if (selectedDocumentId) {
    displayedFindings = findings.filter(f => !f.document_id || f.document_id === selectedDocumentId);
  }

  if (activeCategoryFilter !== 'All') {
    displayedFindings = displayedFindings.filter(f => f.category === activeCategoryFilter);
  }

  const categories = Array.from(new Set(findings.map(f => f.category)));

  const getResultBadge = (result: ValidationOutcome) => {
    switch (result) {
      case 'Passed':
        return (
          <span className="badge badge-passed">
            <CheckCircle2 size={12} />
            Passed
          </span>
        );
      case 'Failed':
        return (
          <span className="badge badge-failed">
            <XCircle size={12} />
            Failed
          </span>
        );
      case 'Needs Review':
        return (
          <span className="badge badge-needs-review">
            <AlertTriangle size={12} />
            Needs Review
          </span>
        );
      default:
        return (
          <span className="badge badge-not-checked">
            <HelpCircle size={12} />
            Not Checked
          </span>
        );
    }
  };

  const handleOpenReviewModal = (finding: ValidationFinding) => {
    setReviewNoteModalFinding(finding);
    setReviewNoteText(finding.review_note || 'Verified against institutional supporting records.');
  };

  const handleSaveReview = async () => {
    if (!reviewNoteModalFinding) return;
    setIsSubmittingReview(true);
    try {
      await applicationService.markFindingReviewed(
        applicationId,
        reviewNoteModalFinding.id,
        currentUser?.full_name || 'Scrutiny Officer',
        reviewNoteText
      );
      setReviewNoteModalFinding(null);
      if (onFindingUpdated) onFindingUpdated();
    } catch (e) {
      alert('Failed to save review note');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Findings Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Validation Findings &amp; Regulatory Checks
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Evaluated by rule engine against AICTE Approval Process Handbook (APH) 2026-2027
          </p>
        </div>
        <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
          {displayedFindings.length} Check{displayedFindings.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '12px' }}>
        <button
          onClick={() => setActiveCategoryFilter('All')}
          className={`btn btn-sm ${activeCategoryFilter === 'All' ? 'btn-primary' : 'btn-outline'}`}
          style={{ fontSize: '0.75rem', padding: '2px 8px' }}
        >
          All ({findings.length})
        </button>
        {categories.map(cat => {
          const count = findings.filter(f => f.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategoryFilter(cat)}
              className={`btn btn-sm ${activeCategoryFilter === cat ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.75rem', padding: '2px 8px', whiteSpace: 'nowrap' }}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Findings List */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
        {displayedFindings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
            <ShieldCheck size={36} style={{ opacity: 0.5, marginBottom: '8px' }} />
            <p style={{ fontSize: '0.875rem' }}>No validation findings in this category.</p>
          </div>
        ) : (
          displayedFindings.map(finding => {
            const borderClass =
              finding.result === 'Failed'
                ? 'border-failed'
                : finding.result === 'Needs Review'
                ? 'border-review'
                : 'border-passed';

            return (
              <div key={finding.id} className={`finding-item ${borderClass}`}>
                <div className="finding-header">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {finding.category}
                      </span>
                      {finding.rule_id && (
                        <span className="badge badge-info" style={{ fontSize: '0.625rem', padding: '1px 5px' }}>
                          {finding.rule_id} v{finding.rule_version || '2026.1'}
                        </span>
                      )}
                    </div>
                    <h4 className="finding-title">{finding.check_name}</h4>
                  </div>
                  <div>{getResultBadge(finding.result)}</div>
                </div>

                <div className="finding-explanation">
                  {finding.explanation}
                </div>

                {/* Evidence & Observation Grid */}
                <div className="finding-meta">
                  {finding.expected_condition && (
                    <>
                      <strong>Expected:</strong>
                      <span>{finding.expected_condition}</span>
                    </>
                  )}
                  {finding.observed_value && (
                    <>
                      <strong>Observed:</strong>
                      <span style={{ fontWeight: 600, color: finding.result === 'Failed' ? '#991b1b' : finding.result === 'Needs Review' ? '#92400e' : 'inherit' }}>
                        {finding.observed_value}
                      </span>
                    </>
                  )}
                  {finding.evidence_source && (
                    <>
                      <strong>Evidence:</strong>
                      <span>{finding.evidence_source} {finding.page_reference ? `(${finding.page_reference})` : ''}</span>
                    </>
                  )}
                </div>

                {/* Genuine Evidence Snippet Box */}
                {finding.evidence_snippet && (
                  <div style={{
                    marginTop: '8px',
                    padding: '6px 10px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderLeft: '3px solid var(--color-primary)',
                    borderRadius: '4px',
                    fontSize: '0.6875rem',
                    color: '#334155',
                    fontFamily: 'monospace'
                  }}>
                    <strong>Supporting Evidence Excerpt {finding.page_reference ? `(${finding.page_reference})` : ''}:</strong>
                    <div style={{ marginTop: '2px', color: '#0f172a' }}>{finding.evidence_snippet}</div>
                  </div>
                )}

                {/* Recommended Action Box */}
                {finding.recommended_action && (
                  <div style={{
                    marginTop: '8px',
                    padding: '8px 10px',
                    backgroundColor: finding.result === 'Failed' ? '#fef2f2' : '#fffbeb',
                    border: `1px solid ${finding.result === 'Failed' ? '#fecaca' : '#fde68a'}`,
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    color: finding.result === 'Failed' ? '#991b1b' : '#92400e'
                  }}>
                    <strong>Recommended Action: </strong>
                    {finding.recommended_action}
                  </div>
                )}

                {/* Official Review Status / Action */}
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {finding.is_reviewed ? (
                    <span style={{ fontSize: '0.75rem', color: '#065f46', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <UserCheck size={14} />
                      Reviewed by {finding.reviewed_by}: <em>"{finding.review_note}"</em>
                    </span>
                  ) : finding.requires_human_review ? (
                    <span style={{ fontSize: '0.75rem', color: '#b45309', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertTriangle size={14} />
                      Mandatory Human Scrutiny Required
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Automated Technical Check
                    </span>
                  )}

                  {isAdmin && (
                    <button
                      onClick={() => handleOpenReviewModal(finding)}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                    >
                      {finding.is_reviewed ? 'Edit Review' : 'Mark Reviewed'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Review Note Modal */}
      {reviewNoteModalFinding && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Scrutiny Officer Finding Assessment</h3>
              <button 
                onClick={() => setReviewNoteModalFinding(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem' }}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '12px' }}>
                <span className="badge badge-info">{reviewNoteModalFinding.category}</span>
                <h4 style={{ marginTop: '6px', fontSize: '0.9375rem' }}>{reviewNoteModalFinding.check_name}</h4>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {reviewNoteModalFinding.explanation}
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Official Review Note / Disposition Reason:</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={reviewNoteText}
                  onChange={e => setReviewNoteText(e.target.value)}
                  placeholder="Enter scrutiny committee notes or verification reference..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                onClick={() => setReviewNoteModalFinding(null)} 
                className="btn btn-outline"
                disabled={isSubmittingReview}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveReview} 
                className="btn btn-primary"
                disabled={isSubmittingReview}
              >
                {isSubmittingReview ? 'Saving...' : 'Confirm Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
