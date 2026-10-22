// AICTE SmartVerify — Authentication & Initial Super Admin Bootstrap Page
// SIH Problem Statement 26261

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Building2, 
  Key, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { authService, DEMO_USERS } from '../services/authService';
import { SYNTHETIC_INSTITUTIONS } from '../data/syntheticDemoData';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'register' | 'bootstrap'>('signin');
  const [email, setEmail] = useState<string>('registrar@niatr-demo.edu.in');
  const [password, setPassword] = useState<string>('DemoSecurePassword2026!');
  const [fullName, setFullName] = useState<string>('Dr. Amitabh Verma');
  const [institutionCode, setInstitutionCode] = useState<string>('1-1092837411');
  const [designation, setDesignation] = useState<string>('Registrar');
  const [bootstrapUserId, setBootstrapUserId] = useState<string>('');
  const [bootstrapToken, setBootstrapToken] = useState<string>('AICTE_SUPER_ADMIN_INIT_SECURE_TOKEN_2026');

  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await authService.signIn(email, password);
      if (res.success) {
        const user = authService.getCurrentUser();
        if (user?.roles.includes('admin')) {
          navigate('/admin');
        } else {
          navigate('/institution');
        }
      } else {
        setMessage({ type: 'error', text: res.error || 'Invalid credentials' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await authService.register(
        email, 
        password, 
        fullName, 
        institutionCode, 
        designation
      );
      if (res.success) {
        setMessage({ 
          type: 'success', 
          text: 'Institution account created successfully! Public registration grants Institution User access.' 
        });
        setTimeout(() => navigate('/institution'), 1000);
      } else {
        setMessage({ type: 'error', text: res.error || 'Registration failed' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleBootstrapSuperAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const current = authService.getCurrentUser();
      const targetId = bootstrapUserId.trim() || current?.id || 'super-admin-init';
      const res = await authService.bootstrapSuperAdmin(targetId, bootstrapToken);

      if (res.success) {
        setMessage({ 
          type: 'success', 
          text: res.message || 'Super Admin initialized successfully. Access granted.' 
        });
        setTimeout(() => navigate('/admin'), 1200);
      } else {
        setMessage({ type: 'error', text: res.error || 'Bootstrap token rejected.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoSwitch = (role: 'institution' | 'admin' | 'super_admin') => {
    authService.setDemoUser(role);
    if (role === 'admin' || role === 'super_admin') {
      navigate('/admin');
    } else {
      navigate('/institution');
    }
  };

  return (
    <div className="app-container" style={{ maxWidth: '520px', paddingTop: '36px' }}>
      {/* Quick Demo Switcher Card for Instant Evaluation */}
      <div style={{
        backgroundColor: '#f8fafc',
        border: '1px solid #cbd5e1',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
          SIH EVALUATION ONE-CLICK DEMO LOGIN
        </div>
        <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '12px' }}>
          Select a role to immediately explore the application with preloaded synthetic data:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          <button
            onClick={() => handleQuickDemoSwitch('institution')}
            className="btn btn-outline btn-sm"
            style={{ fontSize: '0.75rem', padding: '8px 6px' }}
          >
            🏫 Institution
          </button>
          <button
            onClick={() => handleQuickDemoSwitch('admin')}
            className="btn btn-primary btn-sm"
            style={{ fontSize: '0.75rem', padding: '8px 6px', backgroundColor: '#0284c7' }}
          >
            🛡️ AICTE Admin
          </button>
          <button
            onClick={() => handleQuickDemoSwitch('super_admin')}
            className="btn btn-primary btn-sm"
            style={{ fontSize: '0.75rem', padding: '8px 6px', backgroundColor: '#1e3a8a' }}
          >
            👑 Super Admin
          </button>
        </div>
      </div>

      {/* Main Auth Card */}
      <div className="card">
        {/* Emblem & Portal Branding */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div className="brand-emblem" style={{ margin: '0 auto 12px', width: '48px', height: '48px' }}>
            <ShieldCheck size={28} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)' }}>
            AICTE SmartVerify Portal
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            AI-Powered Application Validation &amp; Regulatory Compliance
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', marginBottom: '20px' }}>
          <button
            onClick={() => { setMode('signin'); setMessage(null); }}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              background: 'none',
              borderBottom: mode === 'signin' ? '2px solid var(--color-primary)' : 'none',
              fontWeight: mode === 'signin' ? 700 : 500,
              color: mode === 'signin' ? 'var(--color-primary)' : 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('register'); setMessage(null); }}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              background: 'none',
              borderBottom: mode === 'register' ? '2px solid var(--color-primary)' : 'none',
              fontWeight: mode === 'register' ? 700 : 500,
              color: mode === 'register' ? 'var(--color-primary)' : 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            Register Institution
          </button>
          <button
            onClick={() => { setMode('bootstrap'); setMessage(null); }}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              background: 'none',
              borderBottom: mode === 'bootstrap' ? '2px solid var(--color-primary)' : 'none',
              fontWeight: mode === 'bootstrap' ? 700 : 500,
              color: mode === 'bootstrap' ? 'var(--color-primary)' : 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            Initial Admin
          </button>
        </div>

        {/* Feedback Alert */}
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

        {/* MODE 1: Sign In */}
        {mode === 'signin' && (
          <form onSubmit={handleSignIn}>
            <div className="form-group">
              <label className="form-label">Official Email Address:</label>
              <input
                type="email"
                className="form-input"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="registrar@institution.edu.in"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password:</label>
              <input
                type="password"
                className="form-input"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ width: '100%', padding: '10px' }}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
            </button>
          </form>
        )}

        {/* MODE 2: Institution Registration */}
        {mode === 'register' && (
          <form onSubmit={handleRegister}>
            <div style={{
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '4px',
              padding: '10px',
              fontSize: '0.75rem',
              color: '#92400e',
              marginBottom: '14px'
            }}>
              <strong>Security Policy:</strong> Public registration strictly creates an Institution User role. Administrator accounts cannot be created via public sign-up.
            </div>

            <div className="form-group">
              <label className="form-label">Institution Representative Full Name:</label>
              <input
                type="text"
                className="form-input"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Official Email Address:</label>
              <input
                type="email"
                className="form-input"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Permanent AICTE Institute ID:</label>
              <input
                type="text"
                className="form-input"
                required
                value={institutionCode}
                onChange={e => setInstitutionCode(e.target.value)}
                placeholder="e.g. 1-1092837411"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Designation:</label>
              <input
                type="text"
                className="form-input"
                value={designation}
                onChange={e => setDesignation(e.target.value)}
                placeholder="Principal / Registrar / Coordinator"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Create Password:</label>
              <input
                type="password"
                className="form-input"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ width: '100%', padding: '10px' }}
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register Institution Profile'}
            </button>
          </form>
        )}

        {/* MODE 3: Initial Super Admin Bootstrap */}
        {mode === 'bootstrap' && (
          <form onSubmit={handleBootstrapSuperAdmin}>
            <div style={{
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '4px',
              padding: '10px',
              fontSize: '0.75rem',
              color: '#1e40af',
              marginBottom: '14px'
            }}>
              <strong>Initial Admin Bootstrap:</strong> Used during first-time system setup to authorize the primary Super Administrator using a secured server-side token. Once initialized, subsequent admins are authorized through the Super Admin console.
            </div>

            <div className="form-group">
              <label className="form-label">Bootstrap Security Token:</label>
              <input
                type="password"
                className="form-input"
                required
                value={bootstrapToken}
                onChange={e => setBootstrapToken(e.target.value)}
                placeholder="AICTE_SUPER_ADMIN_INIT_SECURE_TOKEN_2026"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Target User ID (Optional, defaults to current session):</label>
              <input
                type="text"
                className="form-input"
                value={bootstrapUserId}
                onChange={e => setBootstrapUserId(e.target.value)}
                placeholder="auth.users UUID"
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ width: '100%', padding: '10px', backgroundColor: '#1e3a8a' }}
              disabled={loading}
            >
              {loading ? 'Authorizing Super Admin...' : 'Authorize Initial Super Admin'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
