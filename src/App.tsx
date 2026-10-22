// AICTE SmartVerify — Main App Root & Router
// SIH Problem Statement 26261

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { InstitutionDashboard } from './pages/InstitutionDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { ApplicationDetail } from './pages/ApplicationDetail';
import { NotificationsPage } from './pages/NotificationsPage';
import { AdminAuthorizationsPage } from './pages/AdminAuthorizationsPage';
import { AuthPage } from './pages/AuthPage';
import { authService, AuthUserSession } from './services/authService';

// Floating Quick Role Switcher for instant evaluator testing
const FloatingRoleSwitcher: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AuthUserSession | null>(authService.getCurrentUser());
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    return authService.subscribe(u => setCurrentUser(u));
  }, []);

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const role = e.target.value as 'institution' | 'admin' | 'super_admin';
    authService.setDemoUser(role);
    if (role === 'admin' || role === 'super_admin') {
      if (location.pathname === '/institution') navigate('/admin');
    } else {
      if (location.pathname.startsWith('/admin')) navigate('/institution');
    }
  };

  const currentRoleValue = currentUser?.roles.includes('super_admin')
    ? 'super_admin'
    : currentUser?.roles.includes('admin')
    ? 'admin'
    : 'institution';

  return (
    <div className="role-switcher-pill" title="Toggle active role for testing workflows">
      <span style={{ fontWeight: 600 }}>Active Role:</span>
      <select value={currentRoleValue} onChange={handleRoleChange}>
        <option value="institution">🏫 Institution User</option>
        <option value="admin">🛡️ Scrutiny Admin</option>
        <option value="super_admin">👑 Super Admin</option>
      </select>
    </div>
  );
};

// Route wrapper for Institution
const InstitutionRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = authService.getCurrentUser();
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

// Route wrapper for Admin
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = authService.getCurrentUser();
  if (!user) return <Navigate to="/auth" replace />;
  if (!authService.isAdmin()) {
    // If institution user tries to access admin, redirect to institution dashboard
    return <Navigate to="/institution" replace />;
  }
  return <>{children}</>;
};

// Home router resolver
const HomeRedirect: React.FC = () => {
  const user = authService.getCurrentUser();
  if (!user) return <Navigate to="/auth" replace />;
  return user.roles.includes('admin') 
    ? <Navigate to="/admin" replace /> 
    : <Navigate to="/institution" replace />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-main)' }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route 
              path="/institution" 
              element={
                <InstitutionRoute>
                  <InstitutionDashboard />
                </InstitutionRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/authorizations" 
              element={
                <AdminRoute>
                  <AdminAuthorizationsPage />
                </AdminRoute>
              } 
            />
            <Route 
              path="/applications/:id" 
              element={
                <InstitutionRoute>
                  <ApplicationDetail />
                </InstitutionRoute>
              } 
            />
            <Route 
              path="/notifications" 
              element={
                <InstitutionRoute>
                  <NotificationsPage />
                </InstitutionRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Global floating role switch tool */}
        <FloatingRoleSwitcher />
      </div>
    </BrowserRouter>
  );
};

export default App;
