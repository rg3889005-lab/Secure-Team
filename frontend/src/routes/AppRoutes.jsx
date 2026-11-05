import { Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import AppLayout from '../layouts/AppLayout';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import VerifyEmail from '../pages/auth/VerifyEmail';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';

// Public Legal Pages
import PrivacyPolicy from '../pages/public/PrivacyPolicy';
import TermsOfService from '../pages/public/TermsOfService';

// User Workspace Pages
import Dashboard from '../pages/user/Dashboard';
import Projects from '../pages/user/Projects';
import Tasks from '../pages/user/Tasks';
import Chat from '../pages/user/Chat';
import Files from '../pages/user/Files';
import Profile from '../pages/user/Profile';

// Admin Workspace Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import UserManagement from '../pages/admin/UserManagement';
import AuditLogs from '../pages/admin/AuditLogs';
import AdminAnalytics from '../pages/admin/AdminAnalytics';
import Broadcasts from '../pages/admin/Broadcasts';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Root redirection */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Public / Authentication Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      {/* Public Legal Pages (Accessible without login) */}
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />

      {/* Protected User Workspace Routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/files" element={<Files />} />
        <Route path="/profile" element={<Profile />} />

        {/* Protected Admin Routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <UserManagement />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/audit-logs"
          element={
            <AdminRoute>
              <AuditLogs />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <AdminRoute>
              <AdminAnalytics />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/broadcasts"
          element={
            <AdminRoute>
              <Broadcasts />
            </AdminRoute>
          }
        />
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
