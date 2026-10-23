// AICTE SmartVerify — Main App Root & Router
// SIH Problem Statement 26261

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { InstitutionDashboard } from './pages/InstitutionDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { TeamManagementPage } from './pages/TeamManagementPage';
import { AdminAuthorizationsPage } from './pages/AdminAuthorizationsPage';
import { ApplicationDetail } from './pages/ApplicationDetail';
import { NotificationsPage } from './pages/NotificationsPage';
import { authService, AuthUserSession } from './services/authService';
import { RefreshCw } from 'lucide-react';

// Route wrapper requiring any valid authenticated session
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!authService.isLoggedIn()) {
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
};

// Route wrapper for Institution Portal
const InstitutionRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!authService.isLoggedIn()) {
    return <Navigate to="/auth" replace />;
  }
  // If an officer or super admin visits /institution, route them to their scrutiny command center
  if (authService.isAdmin() && !authService.isInstitution()) {
    return <Navigate to="/admin" replace />;
  }
  return <>{children}</>;
};

// Route wrapper for Admin / Scrutiny Portal
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!authService.isLoggedIn()) {
    return <Navigate to="/auth" replace />;
  }
  if (!authService.isAdmin()) {
    // If ordinary institution user attempts to access scrutiny admin routes, deny and redirect
    return <Navigate to="/institution" replace />;
  }
  return <>{children}</>;
};

// Route wrapper strictly for Super Admin
const SuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!authService.isLoggedIn()) {
    return <Navigate to="/auth" replace />;
  }
  if (!authService.isSuperAdmin()) {
    return <Navigate to="/admin" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AuthUserSession | null>(authService.getCurrentUser());
  const [initialized, setInitialized] = useState<boolean>(authService.isInitialized());

  useEffect(() => {
    const unsub = authService.subscribe(user => {
      setCurrentUser(user);
      setInitialized(authService.isInitialized());
    });
    return () => unsub();
  }, []);

  if (!initialized) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-canvas)',
        gap: '12px'
      }}>
        <RefreshCw size={28} className="spin text-emerald-600" />
        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Verifying security session...
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-canvas)' }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage />} />

            {/* Protected Institution Portal */}
            <Route 
              path="/institution" 
              element={
                <InstitutionRoute>
                  <InstitutionDashboard />
                </InstitutionRoute>
              } 
            />

            {/* Protected Scrutiny Command Center */}
            <Route 
              path="/admin" 
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } 
            />

            {/* Protected Scrutiny Team & Assignment Management */}
            <Route 
              path="/admin/teams" 
              element={
                <AdminRoute>
                  <TeamManagementPage />
                </AdminRoute>
              } 
            />

            {/* Protected Super Admin Governance & Authorizations */}
            <Route 
              path="/admin/authorizations" 
              element={
                <SuperAdminRoute>
                  <AdminAuthorizationsPage />
                </SuperAdminRoute>
              } 
            />

            {/* Protected Application Dossier Detail */}
            <Route 
              path="/applications/:id" 
              element={
                <ProtectedRoute>
                  <ApplicationDetail />
                </ProtectedRoute>
              } 
            />

            {/* Protected In-App Notifications */}
            <Route 
              path="/notifications" 
              element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              } 
            />

            {/* Catch-all redirects to public homepage */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
