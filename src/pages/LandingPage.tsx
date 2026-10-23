// AICTE SmartVerify — Public Landing Page
// SIH Problem Statement 26261

import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  FileCheck, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  Lock, 
  Layers, 
  Building2, 
  FileText,
  UserCheck,
  Scale
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="landing-container">
      {/* Hero Section */}
      <section className="landing-hero-section">
        <div className="landing-hero-content">
          <div className="landing-badge">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>AICTE Regulatory Scrutiny Platform</span>
          </div>

          <h1 className="landing-hero-title">
            Smarter Scrutiny.<br />
            Clearer Compliance.
          </h1>

          <p className="landing-hero-subtext">
            AI-assisted document validation and regulatory compliance checks for institutional applications, with transparent findings and accountable human review.
          </p>

          <div className="landing-hero-actions">
            <Link to="/auth" className="btn btn-emerald-primary">
              Sign In
              <ArrowRight size={16} />
            </Link>
            <Link to="/register" className="btn btn-secondary-subtle">
              Register Institution
            </Link>
          </div>

          <div className="landing-trust-strip">
            <div className="trust-item">
              <CheckCircle2 size={16} className="trust-icon" />
              <span>10 Verification Factors</span>
            </div>
            <div className="trust-item">
              <Lock size={16} className="trust-icon" />
              <span>PostgreSQL RLS Security</span>
            </div>
            <div className="trust-item">
              <Scale size={16} className="trust-icon" />
              <span>APH 2026-27 Norms</span>
            </div>
          </div>
        </div>

        {/* Visual Composition: Clean Application Document & Checklist Mockup */}
        <div className="landing-visual-wrapper">
          <div className="landing-doc-card">
            {/* Card Header */}
            <div className="doc-card-header">
              <div className="doc-card-icon">
                <FileText size={20} />
              </div>
              <div>
                <div className="doc-card-title">Land Title &amp; Use Deed — Scrutiny Dossier</div>
                <div className="doc-card-meta">AICTE Approval Process Handbook • 2026-2027 Academic Year</div>
              </div>
              <span className="doc-card-status-badge">
                <CheckCircle2 size={13} />
                Validated
              </span>
            </div>

            {/* Document Checklist Items */}
            <div className="doc-checklist">
              <div className="checklist-item passed">
                <div className="check-indicator">
                  <CheckCircle2 size={16} />
                </div>
                <div className="check-details">
                  <div className="check-title">Document Completeness &amp; Resolution</div>
                  <div className="check-desc">All required regulatory certificates uploaded, DPI contrast verified</div>
                </div>
                <span className="check-tag">Pass</span>
              </div>

              <div className="checklist-item passed">
                <div className="check-indicator">
                  <CheckCircle2 size={16} />
                </div>
                <div className="check-details">
                  <div className="check-title">SHA-256 Checksum &amp; Anti-Duplication</div>
                  <div className="check-desc">Cryptographic fingerprint verified unique across all slots</div>
                </div>
                <span className="check-tag">Verified</span>
              </div>

              <div className="checklist-item passed">
                <div className="check-indicator">
                  <CheckCircle2 size={16} />
                </div>
                <div className="check-details">
                  <div className="check-title">Cross-Document Entity Consistency</div>
                  <div className="check-desc">Permanent Institute ID and institution name match registration records</div>
                </div>
                <span className="check-tag">Consistent</span>
              </div>

              <div className="checklist-item review">
                <div className="check-indicator">
                  <Clock size={16} />
                </div>
                <div className="check-details">
                  <div className="check-title">Official Seal &amp; Signature Inspection</div>
                  <div className="check-desc">Competent authority stamp identified; routed for officer concurrence</div>
                </div>
                <span className="check-tag review">Officer Review</span>
              </div>
            </div>

            {/* Outcome Footer */}
            <div className="doc-card-footer">
              <div className="doc-footer-status">
                <div className="status-dot"></div>
                <span>Automated Validation: <strong>Passed</strong> • Ready for Official Review</span>
              </div>
              <span className="doc-footer-tag">Confidence 98.4%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section id="features" className="landing-features-section">
        <div className="section-header">
          <h2 className="section-title">Designed for Precision, Built for Accountability</h2>
          <p className="section-subtext">
            Three foundational pillars streamline higher technical education approvals with speed and institutional trust.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-box">
              <FileCheck size={24} />
            </div>
            <h3 className="feature-title">Document Validation</h3>
            <p className="feature-desc">
              Automated multi-factor parsing of PDF deeds, building approvals, and fire safety certificates with checksum integrity and tamper detection.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">
              <Scale size={24} />
            </div>
            <h3 className="feature-title">Compliance Checks</h3>
            <p className="feature-desc">
              Deterministic evaluation against AICTE Approval Process Handbook (APH 2026-27) norms, academic year validity, and land-use requirements.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">
              <UserCheck size={24} />
            </div>
            <h3 className="feature-title">Transparent Review</h3>
            <p className="feature-desc">
              Clear, evidence-backed findings and side-by-side document previews enabling scrutiny committee officers to make accountable decisions.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="landing-workflow-section">
        <div className="section-header">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtext">
            A seamless three-step workflow connecting technical institutions with AICTE scrutiny officers.
          </p>
        </div>

        <div className="workflow-steps">
          <div className="workflow-step">
            <div className="step-number">1</div>
            <h4 className="step-title">Submit Application</h4>
            <p className="step-desc">
              Institutions upload mandatory approval documents such as land deeds, occupancy certificates, and society registration.
            </p>
          </div>

          <div className="workflow-step">
            <div className="step-number">2</div>
            <h4 className="step-title">Automated Scrutiny</h4>
            <p className="step-desc">
              The engine evaluates 10 verification factors in real time, detecting omissions, expired dates, and entity discrepancies.
            </p>
          </div>

          <div className="workflow-step">
            <div className="step-number">3</div>
            <h4 className="step-title">Committee Sign-off</h4>
            <p className="step-desc">
              Authorized Scrutiny Officers inspect evidence findings, request clarifications if needed, and record final decisions.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="footer-logo">
              <ShieldCheck size={20} className="text-emerald-600" />
              <span>SmartVerify</span>
            </div>
            <p className="footer-desc">
              Automated document authentication &amp; regulatory scrutiny system for AICTE approval processes.
            </p>
          </div>

          <div className="footer-links">
            <div className="footer-link-group">
              <span className="footer-link-title">Navigation</span>
              <a href="#features">Features</a>
              <a href="#how-it-works">How It Works</a>
              <Link to="/auth">Sign In</Link>
              <Link to="/register">Register</Link>
            </div>
            <div className="footer-link-group">
              <span className="footer-link-title">Standards</span>
              <span>APH 2026-27 Norms</span>
              <span>10 Verification Factors</span>
              <span>PostgreSQL RLS</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>&copy; 2026 AICTE SmartVerify • Smart India Hackathon PS 26261.</span>
        </div>
      </footer>
    </div>
  );
};
