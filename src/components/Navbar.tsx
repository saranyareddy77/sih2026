// AICTE SmartVerify — Government Tech Navigation Header
// SIH Problem Statement 26261

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  ShieldCheck, 
  Bell, 
  LogOut, 
  Layers, 
  BookOpen, 
  Sliders, 
  Database,
  Building2,
  FileText
} from 'lucide-react';
import { authService, AuthUserSession } from '../services/authService';
import { notificationService } from '../services/notificationService';
import { isConfigured } from '../services/supabaseClient';
import { NotificationItem } from '../types';
import { DemoControlsModal } from './DemoControlsModal';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<AuthUserSession | null>(authService.getCurrentUser());
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showDemoModal, setShowDemoModal] = useState<boolean>(false);

  useEffect(() => {
    const unsubAuth = authService.subscribe(user => setCurrentUser(user));
    const unsubNotif = notificationService.subscribe(items => {
      setUnreadCount(items.filter(i => !i.is_read).length);
    });
    return () => {
      unsubAuth();
      unsubNotif();
    };
  }, []);

  const handleSignOut = async () => {
    await authService.signOut();
    navigate('/auth');
  };

  const roleLabel = currentUser?.roles.includes('super_admin')
    ? 'Super Admin'
    : currentUser?.roles.includes('admin')
    ? 'AICTE Scrutiny Officer'
    : 'Institution Registrar';

  const isUserAdmin = currentUser?.roles.includes('admin') || currentUser?.roles.includes('super_admin');

  return (
    <>
      <header>
        {/* Official Ministry & Problem Statement Bar */}
        <div className="gov-top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>ALL INDIA COUNCIL FOR TECHNICAL EDUCATION • MINISTRY OF EDUCATION, GOVT. OF INDIA</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>SMART INDIA HACKATHON 2026 — PS 26261</span>
            <span style={{ opacity: 0.6 }}>•</span>
            <span style={{ color: isConfigured ? '#34d399' : '#fbbf24' }}>
              {isConfigured ? 'Live PostgreSQL Store' : 'Deterministic Demo Sandbox'}
            </span>
          </div>
        </div>

        {/* Main Application Navbar */}
        <nav className="app-navbar">
          {/* Brand & Crest */}
          <div className="brand-section">
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
              <div className="brand-emblem">
                <ShieldCheck size={22} />
              </div>
              <div>
                <div className="brand-title">
                  AICTE SmartVerify
                  <span className="badge badge-info" style={{ fontSize: '0.625rem', padding: '1px 6px' }}>SIH 2026</span>
                </div>
                <div className="brand-subtitle">
                  Regulatory Compliance &amp; Scrutiny Workbench
                </div>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="nav-links">
            {currentUser && (
              <>
                {isUserAdmin ? (
                  <>
                    <Link 
                      to="/admin" 
                      className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}
                    >
                      <Layers size={15} />
                      Scrutiny Command Center
                    </Link>
                    <Link 
                      to="/admin/authorizations" 
                      className={`nav-link ${location.pathname.startsWith('/admin/authorizations') ? 'active' : ''}`}
                    >
                      <BookOpen size={15} />
                      Regulatory Rules &amp; Governance
                    </Link>
                  </>
                ) : (
                  <>
                    <Link 
                      to="/institution" 
                      className={`nav-link ${location.pathname === '/institution' ? 'active' : ''}`}
                    >
                      <Building2 size={15} />
                      Institution Portal
                    </Link>
                  </>
                )}

                <Link 
                  to="/notifications" 
                  className={`nav-link ${location.pathname === '/notifications' ? 'active' : ''}`}
                  style={{ position: 'relative' }}
                >
                  <Bell size={15} />
                  Notifications
                  {unreadCount > 0 && (
                    <span 
                      style={{
                        backgroundColor: '#dc2626',
                        color: '#ffffff',
                        borderRadius: '9999px',
                        padding: '1px 5px',
                        fontSize: '0.625rem',
                        fontWeight: 700,
                        marginLeft: '4px'
                      }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </Link>

                {/* Evaluator Demo Controls Trigger */}
                <button
                  onClick={() => setShowDemoModal(true)}
                  className="btn btn-outline btn-sm"
                  style={{
                    backgroundColor: '#fffbeb',
                    borderColor: '#fde68a',
                    color: '#92400e',
                    fontWeight: 700
                  }}
                  title="Open evaluator testing controls and scenario selector"
                >
                  <Sliders size={13} />
                  Demo Controls &amp; Scenarios
                </button>

                {/* User Identity & Sign Out */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '8px', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '14px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {currentUser.full_name}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                      {roleLabel}
                    </div>
                  </div>

                  <button 
                    onClick={handleSignOut} 
                    className="btn btn-subtle btn-sm"
                    title="Sign out of current session"
                  >
                    <LogOut size={13} />
                  </button>
                </div>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Evaluator Demo Controls Modal */}
      <DemoControlsModal 
        isOpen={showDemoModal} 
        onClose={() => setShowDemoModal(false)} 
      />
    </>
  );
};
