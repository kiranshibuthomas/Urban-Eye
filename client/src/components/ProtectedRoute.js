import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Add aggressive back button protection for protected routes
  useEffect(() => {
    const handlePopState = (event) => {
      const currentPath = window.location.pathname;
      const isLoggedOut = sessionStorage.getItem('user_logged_out') === 'true';
      const token = localStorage.getItem('token');
      
      // If user is logged out or has no token, block all navigation
      if (isLoggedOut || !token) {
        if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/') {
          // Aggressively block navigation
          window.history.replaceState(null, '', '/login');
          
          // Add multiple history entries to prevent further back navigation
          for (let i = 0; i < 5; i++) {
            window.history.pushState(null, '', '/login');
          }
          
          // Force redirect
          window.location.href = '/login';
        }
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Show loading spinner while checking authentication
  if (loading) {
    return <LoadingSpinner />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requiredRole && user?.role !== requiredRole) {
    // Redirect to appropriate dashboard based on user's actual role
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
    return <Navigate to={redirectPath} replace />;
  }

  // Render the protected component
  return children;
};

export default ProtectedRoute;
