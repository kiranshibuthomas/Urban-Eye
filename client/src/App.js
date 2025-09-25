import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SessionProvider } from './context/SessionContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import OAuthHandler from './components/OAuthHandler';

// Import pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OTPVerificationPage from './pages/OTPVerificationPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import PasswordResetOTPPage from './pages/PasswordResetOTPPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import CitizenDashboard from './pages/CitizenDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminComplaintManagement from './pages/AdminComplaintManagement';
import FieldStaffDashboard from './pages/FieldStaffDashboard';
import FieldStaffManagement from './pages/FieldStaffManagement';
import ReportIssue from './pages/ReportIssue';
import ReportsHistory from './pages/ReportsHistory';
import ComplaintDetail from './pages/ComplaintDetail';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import AuditLogsPage from './pages/AuditLogsPage';
import EmailVerification from './components/EmailVerification';

// Component to handle role-based default redirects
const DefaultRedirect = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on user role
  let redirectPath;
  switch (user?.role) {
    case 'admin':
      redirectPath = '/admin-dashboard';
      break;
    case 'field_staff':
      redirectPath = '/field-staff-dashboard';
      break;
    default:
      redirectPath = '/citizen-dashboard';
  }
  
  // Debug logging
  console.log('DefaultRedirect:', { userRole: user?.role, redirectPath });
  
  return <Navigate to={redirectPath} replace />;
};

function AppRoutes() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Initializing UrbanEye..." />;
  }

  return (
    <>
      <OAuthHandler />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-otp" element={<OTPVerificationPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-password-reset-otp" element={<PasswordResetOTPPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email/:token" element={<EmailVerification />} />
        
        {/* Protected routes */}
        <Route 
          path="/citizen-dashboard" 
          element={
            <ProtectedRoute requiredRole="citizen">
              <CitizenDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin-dashboard" 
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/field-staff-dashboard" 
          element={
            <ProtectedRoute requiredRole="field_staff">
              <FieldStaffDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin-complaint-management" 
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminComplaintManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/field-staff-management" 
          element={
            <ProtectedRoute requiredRole="admin">
              <FieldStaffManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/report-issue" 
          element={
            <ProtectedRoute requiredRole="citizen">
              <ReportIssue />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/reports-history" 
          element={
            <ProtectedRoute requiredRole="citizen">
              <ReportsHistory />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/complaint/:id" 
          element={
            <ProtectedRoute>
              <ComplaintDetail />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/audit-logs" 
          element={
            <ProtectedRoute requiredRole="admin">
              <AuditLogsPage />
            </ProtectedRoute>
          } 
        />

        {/* Default redirect */}
        <Route path="/" element={<DefaultRedirect />} />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <ThemeProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <SessionProvider>
              {/* Global toast notifications */}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#ffffff',
                    color: '#1f2937',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  },
                  success: {
                    iconTheme: {
                      primary: '#10b981',
                      secondary: '#ffffff',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#ffffff',
                    },
                  },
                }}
              />
              
              <AppRoutes />
            </SessionProvider>
          </Router>
        </ThemeProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
