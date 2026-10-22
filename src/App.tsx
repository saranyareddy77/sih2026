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
      </div>
    </BrowserRouter>
  );
};

export default App;
