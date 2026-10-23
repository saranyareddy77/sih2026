// AICTE SmartVerify — Modern Header & Slide-Out Navigation Drawer
// SIH Problem Statement 26261

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  ShieldCheck, 
  Bell, 
  LogOut, 
  Layers, 
  BookOpen, 
  Building2, 
  Menu, 
  X, 
  Users, 
  FileCheck2, 
  Home, 
  LogIn, 
  UserPlus, 
  Shield, 
  ChevronRight,
  ClipboardList
} from 'lucide-react';
import { authService, AuthUserSession } from '../services/authService';
import { notificationService } from '../services/notificationService';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<AuthUserSession | null>(authService.getCurrentUser());
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  useEffect(() => {
    const unsubAuth = authService.subscribe(user => setCurrentUser(user));
    const unsubNotif = notificationService.subscribe(items => {
      setUnreadCount(items.filter(i => !i.is_read).length);
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unsubAuth();
      unsubNotif();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSignOut = async () => {
    setDrawerOpen(false);
    await authService.signOut();
    navigate('/auth');
  };

  const isSuperAdmin = currentUser?.roles.includes('super_admin');
  const isScrutinyOfficer = currentUser?.roles.includes('scrutiny_officer') || 
    (currentUser?.roles.includes('admin') && !isSuperAdmin && !currentUser?.roles.includes('scrutiny_member'));
  const isScrutinyMember = currentUser?.roles.includes('scrutiny_member');
  const isInstitution = currentUser?.roles.includes('institution_user') || currentUser?.roles.includes('institution');

  const getRoleLabel = () => {
    if (isSuperAdmin) return 'Super Admin';
    if (isScrutinyOfficer) return 'Scrutiny Officer';
    if (isScrutinyMember) return 'Scrutiny Member';
    return 'Institution User';
  };

  const getHomeRoute = () => {
    if (!currentUser) return '/';
    if (isSuperAdmin || isScrutinyOfficer || isScrutinyMember) return '/admin';
    return '/institution';
  };

  return (
    <>
      {/* Compact Main Application Header */}
      <header className="app-navbar">
        {/* Brand */}
        <div className="brand-section">
          <Link to={getHomeRoute()} className="brand-logo-link">
            <div className="brand-emblem-clean">
              <ShieldCheck size={20} />
            </div>
            <div className="brand-text-block">
              <span className="brand-main-title">SmartVerify</span>
              <span className="brand-tag">AICTE Scrutiny</span>
            </div>
          </Link>
        </div>

        {/* Right Action Cluster */}
        <div className="navbar-actions">
          {currentUser ? (
            <>
              {/* Notifications shortcut */}
              <Link 
                to="/notifications" 
                className={`navbar-icon-btn ${location.pathname === '/notifications' ? 'active' : ''}`}
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="notif-badge">{unreadCount}</span>
                )}
              </Link>

              {/* User badge */}
              <div className="user-profile-badge hidden-mobile">
                <div className="user-name">{currentUser.full_name}</div>
                <div className="user-role-tag">{getRoleLabel()}</div>
              </div>
            </>
          ) : (
            <div className="guest-nav-actions hidden-mobile">
              <Link to="/auth" className="btn btn-outline-clean btn-sm">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-emerald-primary btn-sm">
                Register
              </Link>
            </div>
          )}

          {/* Drawer Hamburger Button */}
          <button 
            onClick={() => setDrawerOpen(true)}
            className="navbar-menu-btn"
            aria-label="Open navigation menu"
            title="Open navigation menu"
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      {/* Slide-out Navigation Drawer Backdrop */}
      {drawerOpen && (
        <div 
          className="drawer-backdrop" 
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Slide-out Navigation Drawer */}
      <aside 
        className={`nav-drawer ${drawerOpen ? 'open' : ''}`}
        aria-label="Navigation drawer"
      >
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-title-block">
            <ShieldCheck size={18} className="text-emerald-600" />
            <span className="drawer-title">Navigation</span>
          </div>
          <button 
            onClick={() => setDrawerOpen(false)}
            className="drawer-close-btn"
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Identity inside drawer if logged in */}
        {currentUser && (
          <div className="drawer-user-card">
            <div className="drawer-user-name">{currentUser.full_name}</div>
            <div className="drawer-user-email">{currentUser.email}</div>
            <div className="drawer-user-role-pill">
              <Shield size={12} />
              <span>{getRoleLabel()}</span>
            </div>
            {currentUser.institution?.name && (
              <div className="drawer-institution-name">
                <Building2 size={12} />
                <span>{currentUser.institution.name}</span>
              </div>
            )}
          </div>
        )}

        {/* Drawer Navigation Links */}
        <nav className="drawer-links-container">
          {!currentUser ? (
            /* Signed-out Public Navigation */
            <div className="drawer-group">
              <div className="drawer-group-title">Public Navigation</div>
              <Link 
                to="/" 
                className={`drawer-link ${location.pathname === '/' ? 'active' : ''}`}
                onClick={() => setDrawerOpen(false)}
              >
                <Home size={18} />
                <span>Home</span>
                <ChevronRight size={14} className="chevron" />
              </Link>
              <a 
                href="/#features" 
                className="drawer-link"
                onClick={() => setDrawerOpen(false)}
              >
                <Layers size={18} />
                <span>Features</span>
                <ChevronRight size={14} className="chevron" />
              </a>
              <a 
                href="/#how-it-works" 
                className="drawer-link"
                onClick={() => setDrawerOpen(false)}
              >
                <FileCheck2 size={18} />
                <span>How It Works</span>
                <ChevronRight size={14} className="chevron" />
              </a>

              <div className="drawer-divider" />

              <Link 
                to="/auth" 
                className={`drawer-link ${location.pathname === '/auth' ? 'active' : ''}`}
                onClick={() => setDrawerOpen(false)}
              >
                <LogIn size={18} />
                <span>Sign In</span>
                <ChevronRight size={14} className="chevron" />
              </Link>
              <Link 
                to="/register" 
                className={`drawer-link ${location.pathname === '/register' ? 'active' : ''}`}
                onClick={() => setDrawerOpen(false)}
              >
                <UserPlus size={18} />
                <span>Register Institution</span>
                <ChevronRight size={14} className="chevron" />
              </Link>
            </div>
          ) : (
            /* Signed-in Role-specific Navigation */
            <>
              {/* Institution Portal Navigation */}
              {isInstitution && (
                <div className="drawer-group">
                  <div className="drawer-group-title">Institution Workspace</div>
                  <Link 
                    to="/institution" 
                    className={`drawer-link ${location.pathname === '/institution' ? 'active' : ''}`}
                    onClick={() => setDrawerOpen(false)}
                  >
                    <Building2 size={18} />
                    <span>Institution Portal</span>
                    <ChevronRight size={14} className="chevron" />
                  </Link>
                </div>
              )}

              {/* Scrutiny Officer Navigation */}
              {isScrutinyOfficer && (
                <div className="drawer-group">
                  <div className="drawer-group-title">Scrutiny Desk</div>
                  <Link 
                    to="/admin" 
                    className={`drawer-link ${location.pathname === '/admin' ? 'active' : ''}`}
                    onClick={() => setDrawerOpen(false)}
                  >
                    <ClipboardList size={18} />
                    <span>Scrutiny Queue</span>
                    <ChevronRight size={14} className="chevron" />
                  </Link>
                  <Link 
                    to="/admin/teams" 
                    className={`drawer-link ${location.pathname === '/admin/teams' ? 'active' : ''}`}
                    onClick={() => setDrawerOpen(false)}
                  >
                    <Users size={18} />
                    <span>Team &amp; Assignments</span>
                    <ChevronRight size={14} className="chevron" />
                  </Link>
                </div>
              )}

              {/* Scrutiny Member Navigation */}
              {isScrutinyMember && (
                <div className="drawer-group">
                  <div className="drawer-group-title">Scrutiny Review</div>
                  <Link 
                    to="/admin" 
                    className={`drawer-link ${location.pathname === '/admin' ? 'active' : ''}`}
                    onClick={() => setDrawerOpen(false)}
                  >
                    <ClipboardList size={18} />
                    <span>Assigned Reviews</span>
                    <ChevronRight size={14} className="chevron" />
                  </Link>
                </div>
              )}

              {/* Super Admin Navigation */}
              {isSuperAdmin && (
                <div className="drawer-group">
                  <div className="drawer-group-title">Super Administration</div>
                  <Link 
                    to="/admin" 
                    className={`drawer-link ${location.pathname === '/admin' ? 'active' : ''}`}
                    onClick={() => setDrawerOpen(false)}
                  >
                    <Layers size={18} />
                    <span>Scrutiny Command Center</span>
                    <ChevronRight size={14} className="chevron" />
                  </Link>
                  <Link 
                    to="/admin/teams" 
                    className={`drawer-link ${location.pathname === '/admin/teams' ? 'active' : ''}`}
                    onClick={() => setDrawerOpen(false)}
                  >
                    <Users size={18} />
                    <span>Officer &amp; Team Management</span>
                    <ChevronRight size={14} className="chevron" />
                  </Link>
                  <Link 
                    to="/admin/authorizations" 
                    className={`drawer-link ${location.pathname === '/admin/authorizations' ? 'active' : ''}`}
                    onClick={() => setDrawerOpen(false)}
                  >
                    <BookOpen size={18} />
                    <span>Governance &amp; Audit Trail</span>
                    <ChevronRight size={14} className="chevron" />
                  </Link>
                </div>
              )}

              {/* Common Authenticated Links */}
              <div className="drawer-group">
                <div className="drawer-group-title">Account &amp; System</div>
                <Link 
                  to="/notifications" 
                  className={`drawer-link ${location.pathname === '/notifications' ? 'active' : ''}`}
                  onClick={() => setDrawerOpen(false)}
                >
                  <Bell size={18} />
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="drawer-badge">{unreadCount}</span>
                  )}
                  <ChevronRight size={14} className="chevron" />
                </Link>
              </div>

              {/* Sign Out Action */}
              <div className="drawer-footer">
                <button 
                  onClick={handleSignOut} 
                  className="drawer-logout-btn"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </nav>
      </aside>
    </>
  );
};
