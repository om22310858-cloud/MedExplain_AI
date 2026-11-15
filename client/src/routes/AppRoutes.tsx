import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage.js';
import { RegisterPage } from '../pages/RegisterPage.js';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage.js';
import { ResetPasswordPage } from '../pages/ResetPasswordPage.js';
import { DashboardPage } from '../pages/DashboardPage.js';
import { MyReportsPage } from '../pages/MyReportsPage.js';
import { ReportDetailPage } from '../pages/ReportDetailPage.js';
import { CompareReportsPage } from '../pages/CompareReportsPage.js';
import { RiskAssessmentPage } from '../pages/RiskAssessmentPage.js';
import { ProfilePage } from '../pages/ProfilePage.js';
import { NotFoundPage } from '../pages/NotFoundPage.js';
import { AppLayout } from '../components/layout/AppLayout.js';
import { ProtectedRoute } from '../components/layout/ProtectedRoute.js';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected Application Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="reports" element={<MyReportsPage />} />
        <Route path="reports/:id" element={<ReportDetailPage />} />
        <Route path="compare" element={<CompareReportsPage />} />
        <Route path="risk-assessment" element={<RiskAssessmentPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
