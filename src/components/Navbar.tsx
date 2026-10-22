// AICTE SmartVerify — Government Tech Navigation Header
// SIH Problem Statement 26261

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  ShieldCheck, 
  FileText, 
  Bell, 
  User, 
  LogOut, 
  HelpCircle, 
  Layers, 
  Key, 
  CheckCircle2, 
  AlertCircle,
  FileSearch,
  ExternalLink
} from 'lucide-react';
import { authService, AuthUserSession } from '../services/authService';
import { notificationService } from '../services/notificationService';
import { NotificationItem } from '../types';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<AuthUserSession | null>(authService.getCurrentUser());
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifMenu, setShowNotifMenu] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    const unsubAuth = authService.subscribe(user => setCurrentUser(user));
    const unsubNotif = notificationService.subscribe(items => {
      setNotifications(items.slice(0, 5));
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
    : 'Institution User';

  return (
    <header>
      {/* Official Government Strip */}
      <div className="gov-top-bar">
        <span>ALL INDIA COUNCIL FOR TECHNICAL EDUCATION (AICTE) — MINISTRY OF EDUCATION, GOVT. OF INDIA</span>
        <span>SIH 2026 Problem Statement 26261</span>
      </div>

      {/* Synthetic Banner */}
      <div className="synthetic-banner">
        <span>
          <AlertCircle size={15} />
          <strong>PROTOTYPE DEMONSTRATION:</strong> All applicant records, documents, certificates, and seals are synthetic demo fixtures.
        </span>
        <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>
          SYNTHETIC DEMO DATA — NOT AN OFFICIAL DOCUMENT
        </span>
      </div>

      {/* Main Navbar */}
      <nav className="app-navbar">
        <div className="brand-section">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <div className="brand-emblem">
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="brand-title">
                AICTE SmartVerify
                <span className="badge badge-info" style={{ fontSize: '0.6875rem', fontWeight: 600 }}>v1.2</span>
              </div>
              <div className="brand-subtitle">
                AI-Powered Validation &amp; Regulatory Compliance
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="nav-links">
          {currentUser ? (
            <>
              {currentUser.roles.includes('admin') ? (
                <>
                  <Link 
                    to="/admin" 
                    className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}
                  >
                    <Layers size={16} />
                    Scrutiny Dashboard
                  </Link>
                  <Link 
                    to="/admin/authorizations" 
                    className={`nav-link ${location.pathname.startsWith('/admin/authorizations') ? 'active' : ''}`}
                  >
                    <Key size={16} />
                    Admin Authorizations
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    to="/institution" 
                    className={`nav-link ${location.pathname === '/institution' ? 'active' : ''}`}
                  >
                    <Layers size={16} />
                    Institution Dashboard
                  </Link>
                </>
              )}

              <Link 
                to="/notifications" 
                className={`nav-link ${location.pathname === '/notifications' ? 'active' : ''}`}
                style={{ position: 'relative' }}
              >
                <Bell size={16} />
                Notifications
                {unreadCount > 0 && (
                  <span 
                    style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      fontSize: '0.6875rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </Link>

              {/* User Identity Pill */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '12px', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '16px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {currentUser.full_name}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                    {roleLabel}
                  </div>
                </div>

                <button 
                  onClick={handleSignOut} 
                  className="btn btn-outline btn-sm"
                  title="Sign out of current session"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <Link to="/auth" className="btn btn-primary btn-sm">
              Sign In
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
};
