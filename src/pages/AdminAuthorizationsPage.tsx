// AICTE SmartVerify — Administrator Authorizations & Audit Logs
// SIH Problem Statement 26261

import React, { useState } from 'react';
import { 
  Key, 
  ShieldCheck, 
  UserPlus, 
  Lock, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  FileText 
} from 'lucide-react';
import { authService } from '../services/authService';
import { regulatoryRuleEngine } from '../services/regulatoryRuleEngine';
import { AuditLog } from '../types';

export const AdminAuthorizationsPage: React.FC = () => {
  const isSuperAdmin = authService.isSuperAdmin();
  const currentUser = authService.getCurrentUser();

  const [targetEmail, setTargetEmail] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'institution'>('admin');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [rulesList, setRulesList] = useState(regulatoryRuleEngine.getRules());
  const [ruleAuditList, setRuleAuditList] = useState(regulatoryRuleEngine.getAuditLog());

  // Fictional demonstration administrators
  const [authorizedAdmins, setAuthorizedAdmins] = useState([
    {
      id: 'admin-1',
      name: 'Prof. T. G. Chandrasekhar',
      email: 'director.approval@aicte-india.org',
      role: 'Super Admin',
      granted_by: 'Initial Bootstrap System',
      date: '2026-01-01'
    },
    {
      id: 'admin-2',
      name: 'Dr. V. K. Deshmukh',
      email: 'scrutiny.officer@aicte-india.org',
      role: 'Scrutiny Officer (Admin)',
      granted_by: 'Prof. T. G. Chandrasekhar',
      date: '2026-01-15'
    },
    {
      id: 'admin-3',
      name: 'Dr. R. K. Bhattacharya',
      email: 'technical.scrutiny@aicte-india.org',
      role: 'Scrutiny Officer (Admin)',
      granted_by: 'Prof. T. G. Chandrasekhar',
      date: '2026-02-01'
    }
  ]);

  // Synthetic security audit logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    {
      id: 'log-1',
      actor_email: 'director.approval@aicte-india.org',
      action: 'BOOTSTRAP_SUPER_ADMIN',
      resource_type: 'user_roles',
      resource_id: 'user-superadmin-demo-3',
      details: { role: 'super_admin', initial_bootstrap: true },
      ip_address: '10.0.12.4',
      created_at: '2026-01-01T10:00:00Z'
    },
    {
      id: 'log-2',
      actor_email: 'director.approval@aicte-india.org',
      action: 'AUTHORIZE_ADMIN_USER',
      resource_type: 'user_roles',
      resource_id: 'user-admin-demo-2',
      details: { role_assigned: 'admin', authorized_by: 'Super Admin' },
      ip_address: '10.0.12.4',
      created_at: '2026-01-15T11:30:00Z'
    },
    {
      id: 'log-3',
      actor_email: 'scrutiny.officer@aicte-india.org',
      action: 'RECORD_SCRUTINY_DECISION',
      resource_type: 'applications',
      resource_id: 'demo-app-2',
      details: { decision: 'Approved', app_number: 'AICTE/2026/APP-1002-REVIEWED' },
      ip_address: '10.0.14.88',
      created_at: '2026-02-04T16:20:00Z'
    }
  ]);

  const handleAuthorizeUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmail || !targetEmail.includes('@')) {
      setMessage({ type: 'error', text: 'Please enter a valid official email address.' });
      return;
    }

    if (!isSuperAdmin) {
      setMessage({ 
        type: 'error', 
        text: 'Access Denied: Only a verified Super Administrator can grant administrative privileges.' 
      });
      return;
    }

    const newAdmin = {
      id: `admin-${Date.now()}`,
      name: targetEmail.split('@')[0].replace('.', ' ').toUpperCase(),
      email: targetEmail,
      role: selectedRole === 'admin' ? 'Scrutiny Officer (Admin)' : 'Institution User',
      granted_by: currentUser?.full_name || 'Super Admin',
      date: new Date().toISOString().split('T')[0]
    };

    setAuthorizedAdmins([newAdmin, ...authorizedAdmins]);

    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      actor_email: currentUser?.email,
      action: 'AUTHORIZE_ADMIN_USER',
      resource_type: 'user_roles',
      resource_id: newAdmin.id,
      details: { email: targetEmail, assigned_role: selectedRole },
      ip_address: '127.0.0.1',
      created_at: new Date().toISOString()
    };

    setAuditLogs([newLog, ...auditLogs]);
    setMessage({ 
      type: 'success', 
      text: `User ${targetEmail} authorized with role "${newAdmin.role}" and recorded in audit log.` 
    });
    setTargetEmail('');
  };

  return (
    <div className="app-container" style={{ maxWidth: '1080px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1>Administrator Authorizations &amp; Security Audit Trail</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Role assignments, administrator privilege management, and security audit logs.
        </p>
      </div>

      {/* Security Notice */}
      <div style={{
        backgroundColor: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '6px',
        padding: '14px 18px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <Lock size={20} color="#1e40af" />
        <div style={{ fontSize: '0.8125rem', color: '#1e3a8a' }}>
          <strong>PostgreSQL Role-Level Security (RLS):</strong> Public registration never grants administrative roles. Role changes are protected by PostgreSQL security definer procedures and can only be executed by authorized Super Administrators.
        </div>
      </div>

      {/* Authorization Form (Active for Super Admin) */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div>
            <h2>Authorize Additional Administrator</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Assign Scrutiny Officer administrative privileges to an official user account.
            </p>
          </div>
          <span className={`badge ${isSuperAdmin ? 'badge-passed' : 'badge-failed'}`}>
            {isSuperAdmin ? 'Super Admin Authorized' : 'Read-Only (Requires Super Admin)'}
          </span>
        </div>

        {message && (
          <div style={{
            padding: '10px 14px',
            borderRadius: '4px',
            marginBottom: '16px',
            fontSize: '0.8125rem',
            backgroundColor: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${message.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            color: message.type === 'success' ? '#065f46' : '#991b1b'
          }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleAuthorizeUser} style={{ display: 'grid', gridTemplateColumns: '1fr 200px auto', gap: '12px', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Official AICTE / Officer Email:</label>
            <input
              type="email"
              className="form-input"
              required
              disabled={!isSuperAdmin}
              placeholder="officer.name@aicte-india.org"
              value={targetEmail}
              onChange={e => setTargetEmail(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Privilege Tier:</label>
            <select
              className="form-select"
              disabled={!isSuperAdmin}
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value as any)}
            >
              <option value="admin">Scrutiny Officer (Admin)</option>
              <option value="institution">Institution User</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={!isSuperAdmin || !targetEmail}
            style={{ padding: '8px 18px' }}
          >
            <UserPlus size={16} />
            Authorize Role
          </button>
        </form>
      </div>

      {/* Configurable Regulatory Rule Configuration & Versioning Card */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2>Configurable Regulatory Rules &amp; Versioning Engine</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Manage AICTE Approval Process Handbook (APH 2026-2027) rules, adjust severity tiers, and track rule version bumps.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span className="badge badge-passed">Ruleset: AICTE-APH-2026-27-V2.1</span>
            {isSuperAdmin && (
              <button 
                onClick={() => {
                  regulatoryRuleEngine.resetToDefaults(currentUser?.full_name || 'Super Admin');
                  setRulesList(regulatoryRuleEngine.getRules());
                  setRuleAuditList(regulatoryRuleEngine.getAuditLog());
                  alert('Reset all rules to official APH 2026-2027 defaults.');
                }}
                className="btn btn-outline btn-sm"
              >
                Reset to APH Defaults
              </button>
            )}
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table" style={{ fontSize: '0.8125rem' }}>
            <thead>
              <tr>
                <th>Rule ID &amp; Version</th>
                <th>Rule Name &amp; Category</th>
                <th>Severity Tier</th>
                <th>Statutory Norm / Prototype</th>
                <th>Status</th>
                {isSuperAdmin && <th>Toggle</th>}
              </tr>
            </thead>
            <tbody>
              {rulesList.map(rule => (
                <tr key={rule.ruleId} style={{ opacity: rule.isActive ? 1 : 0.6 }}>
                  <td>
                    <span className="badge badge-info" style={{ fontFamily: 'var(--font-mono)' }}>
                      {rule.ruleId} v{rule.version}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{rule.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {rule.category} • Citation: {rule.aphReference}
                    </div>
                  </td>
                  <td>
                    {isSuperAdmin ? (
                      <select
                        value={rule.severity}
                        onChange={e => {
                          regulatoryRuleEngine.updateRule(
                            rule.ruleId, 
                            { severity: e.target.value as any }, 
                            currentUser?.full_name || 'Super Admin'
                          );
                          setRulesList(regulatoryRuleEngine.getRules());
                          setRuleAuditList(regulatoryRuleEngine.getAuditLog());
                        }}
                        className="form-select"
                        style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                      >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                        <option value="Info">Info</option>
                      </select>
                    ) : (
                      <span className={`badge ${rule.severity === 'High' ? 'badge-failed' : 'badge-needs-review'}`}>
                        {rule.severity}
                      </span>
                    )}
                  </td>
                  <td>
                    {rule.isOfficialNorm ? (
                      <span className="badge badge-passed">Official APH</span>
                    ) : (
                      <span className="badge badge-info">Prototype Rule</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${rule.isActive ? 'badge-passed' : 'badge-draft'}`}>
                      {rule.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  {isSuperAdmin && (
                    <td>
                      <button
                        onClick={() => {
                          regulatoryRuleEngine.updateRule(
                            rule.ruleId, 
                            { isActive: !rule.isActive }, 
                            currentUser?.full_name || 'Super Admin'
                          );
                          setRulesList(regulatoryRuleEngine.getRules());
                          setRuleAuditList(regulatoryRuleEngine.getAuditLog());
                        }}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.6875rem', padding: '2px 8px' }}
                      >
                        {rule.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Rule Version Bump Audit Log */}
        {ruleAuditList.length > 0 && (
          <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
            <h4 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
              Rule Configuration Audit History ({ruleAuditList.length} events)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {ruleAuditList.slice(0, 5).map(ev => (
                <div 
                  key={ev.id} 
                  style={{ 
                    fontSize: '0.75rem', 
                    padding: '6px 10px', 
                    backgroundColor: 'var(--bg-subtle)', 
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span>
                    <strong>{ev.actorName}</strong> {ev.action} rule <code>{ev.ruleId}</code> ({ev.changesSummary})
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>
                    {new Date(ev.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Authorized Admins Table */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h2>Active Authorized Administrators</h2>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Officer Name</th>
                <th>Email</th>
                <th>Role Tier</th>
                <th>Authorized By</th>
                <th>Authorization Date</th>
              </tr>
            </thead>
            <tbody>
              {authorizedAdmins.map(admin => (
                <tr key={admin.id}>
                  <td style={{ fontWeight: 600 }}>{admin.name}</td>
                  <td>{admin.email}</td>
                  <td>
                    <span className="badge badge-info">{admin.role}</span>
                  </td>
                  <td>{admin.granted_by}</td>
                  <td>{admin.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2>Security &amp; Regulatory Audit Trail</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Logged actions for role changes, statutory decisions, and administrator operations.
            </p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor Email</th>
                <th>Action</th>
                <th>Resource</th>
                <th>IP Address</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map(log => (
                <tr key={log.id}>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td style={{ fontWeight: 600 }}>{log.actor_email}</td>
                  <td>
                    <span className="badge badge-draft" style={{ fontFamily: 'var(--font-mono)' }}>
                      {log.action}
                    </span>
                  </td>
                  <td>{log.resource_type} ({log.resource_id})</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{log.ip_address || '127.0.0.1'}</td>
                  <td style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    {JSON.stringify(log.details)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
