// AICTE SmartVerify — Evaluator Demo Controls & Scenario Selector
// SIH Problem Statement 26261

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  ShieldAlert, 
  RefreshCw, 
  UserCheck, 
  FileCheck2, 
  AlertTriangle, 
  FileX, 
  Layers, 
  Copy, 
  ExternalLink,
  Database
} from 'lucide-react';
import { authService } from '../services/authService';
import { applicationService } from '../services/applicationService';
import { isConfigured } from '../services/supabaseClient';

interface DemoControlsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoControlsModal: React.FC<DemoControlsModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  if (!isOpen) return null;

  const handleRoleSelect = (role: 'institution' | 'admin' | 'super_admin') => {
    authService.setDemoUser(role);
    if (role === 'admin' || role === 'super_admin') {
      navigate('/admin');
    } else {
      navigate('/institution');
    }
    onClose();
  };

  const handleNavigateScenario = (appId: string) => {
    onClose();
    navigate(`/application/${appId}`);
  };

  const handleResetData = () => {
    if (window.confirm('Reset all synthetic demo applications to their default clean fixtures?')) {
      applicationService.resetToSyntheticDefaults();
      window.location.reload();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 120 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '680px' }}>
        <div className="modal-header" style={{ backgroundColor: 'var(--color-primary)', color: '#ffffff' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={20} color="#38bdf8" />
              <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.0625rem' }}>
                Evaluator Demo Controls &amp; Scenarios
              </h3>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#cbd5e1' }}>
              Deterministic test fixtures designed for SIH Problem Statement 26261 demonstration.
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="btn btn-sm btn-subtle" 
            style={{ color: '#ffffff', background: 'rgba(255, 255, 255, 0.1)' }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Storage Mode Status */}
          <div style={{ 
            backgroundColor: isConfigured ? '#ecfdf5' : '#eff6ff', 
            border: `1px solid ${isConfigured ? '#a7f3d0' : '#bfdbfe'}`,
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Database size={18} color={isConfigured ? '#059669' : '#0284c7'} />
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: isConfigured ? '#065f46' : '#1e40af' }}>
                  {isConfigured ? 'Live Backend Connected (Supabase PostgreSQL & Storage)' : 'Deterministic Synthetic Sandbox Mode (Active)'}
                </div>
                <div style={{ fontSize: '0.6875rem', color: isConfigured ? '#047857' : '#2563eb' }}>
                  {isConfigured 
                    ? 'Records and private files persist in your configured Supabase database.'
                    : '10 preloaded reproducible SIH test dossiers saved in local browser sandbox.'}
                </div>
              </div>
            </div>
            <span className={`badge ${isConfigured ? 'badge-passed' : 'badge-info'}`}>
              {isConfigured ? 'LIVE MODE' : 'DEMO MODE'}
            </span>
          </div>

          {/* Quick Role Switcher */}
          <div>
            <label className="form-label">Simulate User Role Tier:</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <button
                onClick={() => handleRoleSelect('institution')}
                className={`btn ${currentUser?.roles[0] === 'institution' ? 'btn-primary' : 'btn-outline'}`}
                style={{ justifyContent: 'flex-start', padding: '10px 12px', textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.8125rem' }}>🏫 Institution</div>
                <div style={{ fontSize: '0.6875rem', opacity: 0.8, marginTop: '2px' }}>Upload &amp; Rectify</div>
              </button>

              <button
                onClick={() => handleRoleSelect('admin')}
                className={`btn ${currentUser?.roles[0] === 'admin' ? 'btn-primary' : 'btn-outline'}`}
                style={{ justifyContent: 'flex-start', padding: '10px 12px', textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.8125rem' }}>🛡️ Scrutiny Officer</div>
                <div style={{ fontSize: '0.6875rem', opacity: 0.8, marginTop: '2px' }}>Review &amp; Verify</div>
              </button>

              <button
                onClick={() => handleRoleSelect('super_admin')}
                className={`btn ${currentUser?.roles.includes('super_admin') ? 'btn-primary' : 'btn-outline'}`}
                style={{ justifyContent: 'flex-start', padding: '10px 12px', textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.8125rem' }}>👑 Super Admin</div>
                <div style={{ fontSize: '0.6875rem', opacity: 0.8, marginTop: '2px' }}>Rule Config &amp; Audit</div>
              </button>
            </div>
          </div>

          {/* 1-Click Key Demonstration Scenarios */}
          <div>
            <label className="form-label">Direct Jump to Core SIH Evaluation Scenarios:</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div 
                onClick={() => handleNavigateScenario('demo-app-1')}
                style={{ 
                  padding: '10px 14px', 
                  border: '1px solid var(--border-subtle)', 
                  borderRadius: 'var(--radius-sm)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  backgroundColor: '#ffffff'
                }}
                className="hover-subtle"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileCheck2 size={18} color="#059669" />
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700 }}>Case 1: Fully Compliant EoA Dossier</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>All 7 mandatory certificates active, infrastructure geotagged, passes validation.</div>
                  </div>
                </div>
                <span className="badge badge-passed">Compliant (Passed)</span>
              </div>

              <div 
                onClick={() => handleNavigateScenario('demo-app-3')}
                style={{ 
                  padding: '10px 14px', 
                  border: '1px solid var(--border-subtle)', 
                  borderRadius: 'var(--radius-sm)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  backgroundColor: '#ffffff'
                }}
                className="hover-subtle"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileX size={18} color="#dc2626" />
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700 }}>Case 3: Missing Statutory Documents</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Fire Safety Certificate &amp; Occupancy Certificate missing under APH Chapter II.</div>
                  </div>
                </div>
                <span className="badge badge-failed">Missing Docs (Action Req)</span>
              </div>

              <div 
                onClick={() => handleNavigateScenario('demo-app-4')}
                style={{ 
                  padding: '10px 14px', 
                  border: '1px solid var(--border-subtle)', 
                  borderRadius: 'var(--radius-sm)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  backgroundColor: '#ffffff'
                }}
                className="hover-subtle"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertTriangle size={18} color="#dc2626" />
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700 }}>Case 4: Expired Statutory Safety Certificate</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Fire NOC validity lapsed before evaluation cycle. Rectification needed.</div>
                  </div>
                </div>
                <span className="badge badge-failed">Expired Certificate</span>
              </div>

              <div 
                onClick={() => handleNavigateScenario('demo-app-5')}
                style={{ 
                  padding: '10px 14px', 
                  border: '1px solid var(--border-subtle)', 
                  borderRadius: 'var(--radius-sm)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  backgroundColor: '#ffffff'
                }}
                className="hover-subtle"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Layers size={18} color="#d97706" />
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700 }}>Case 5: Cross-Document Trust Entity Discrepancy</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Extracted trust deed name differs from registered institution profile.</div>
                  </div>
                </div>
                <span className="badge badge-needs-review">Cross-Doc Mismatch</span>
              </div>

              <div 
                onClick={() => handleNavigateScenario('demo-app-7')}
                style={{ 
                  padding: '10px 14px', 
                  border: '1px solid var(--border-subtle)', 
                  borderRadius: 'var(--radius-sm)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  backgroundColor: '#ffffff'
                }}
                className="hover-subtle"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Copy size={18} color="#d97706" />
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700 }}>Case 7: Exact SHA-256 Byte Duplication</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Same binary file uploaded across multiple distinct requirement slots.</div>
                  </div>
                </div>
                <span className="badge badge-needs-review">Duplicate Checksum</span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button 
            onClick={handleResetData}
            className="btn btn-outline btn-sm"
            style={{ color: '#991b1b' }}
          >
            <RefreshCw size={13} />
            Reset Data to Factory State
          </button>

          <button onClick={onClose} className="btn btn-primary btn-sm">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
