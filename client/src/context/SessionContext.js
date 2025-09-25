import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import sessionManager from '../services/sessionManager';
import navigationBlocker from '../utils/navigationBlocker';

const SessionContext = createContext();

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

export const SessionProvider = ({ children }) => {
  const [sessionStatus, setSessionStatus] = useState({
    isActive: true,
    lastActivity: Date.now(),
    timeSinceActivity: 0,
    timeUntilTimeout: 0,
    isExpired: false,
    isWarning: false
  });
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const navigate = useNavigate();
  const { logout: authLogout } = useAuth();

  useEffect(() => {
    // Set up session event listeners
    const removeListener = sessionManager.addListener((event, data) => {
      switch (event) {
        case 'activity':
          setSessionStatus(prev => ({
            ...prev,
            lastActivity: data.lastActivity
          }));
          break;

        case 'refresh':
          setSessionStatus(prev => ({
            ...prev,
            lastActivity: Date.now()
          }));
          break;

        case 'extend':
          setSessionStatus(prev => ({
            ...prev,
            lastActivity: data.lastActivity
          }));
          break;

        case 'timeout':
        case 'logout':
          setIsSessionExpired(true);
          setSessionStatus(prev => ({
            ...prev,
            isExpired: true
          }));
          
          // Logout from AuthContext first, then navigate
          authLogout().then(() => {
            navigate('/login', { 
              replace: true,
              state: { 
                reason: data.reason || 'Session expired',
                from: window.location.pathname 
              }
            });
          });
          break;

        default:
          break;
      }
    });

    // Update session status every 30 seconds
    const statusInterval = setInterval(() => {
      const status = sessionManager.getSessionStatus();
      setSessionStatus(status);
    }, 30000);

    // Handle page visibility changes (when user returns to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // User returned to the tab, just refresh session status
        const status = sessionManager.getSessionStatus();
        setSessionStatus(status);
      }
    };

    // Handle back button navigation - block access to protected pages after logout
    const handlePopState = (event) => {
      const currentPath = window.location.pathname;
      const isLoggedOut = sessionStorage.getItem('user_logged_out') === 'true';
      const token = localStorage.getItem('token');
      
      // If user is logged out or has no token, block all navigation except to login/register
      if (isLoggedOut || !token) {
        if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/') {
          // Aggressively block navigation and redirect to login
          window.history.replaceState(null, '', '/login');
          
          // Add more history entries to prevent further back navigation
          for (let i = 0; i < 5; i++) {
            window.history.pushState(null, '', '/login');
          }
          
          // Force redirect
          window.location.href = '/login';
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('popstate', handlePopState);

    // Handle browser close/refresh (only for sensitive data)
    const handleBeforeUnload = () => {
      // Only clear session data, don't trigger full logout
      localStorage.removeItem('session_refresh');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      removeListener();
      clearInterval(statusInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [navigate, authLogout]);

  // Session actions
  const extendSession = () => {
    sessionManager.extendSession();
  };

  const clearLogoutFlag = () => {
    sessionStorage.removeItem('user_logged_out');
    navigationBlocker.clearLoggedOut();
  };

  const logout = async () => {
    // First logout from AuthContext to clear user state
    await authLogout();
    // Then logout from session manager
    await sessionManager.logout();
    
    // Set navigation blocker to logged out state
    navigationBlocker.setLoggedOut();
    
    // Aggressive history clearing to prevent back button access
    // Clear all history and add multiple login entries
    window.history.replaceState(null, '', '/login');
    
    // Add multiple history entries to create a "wall" against back navigation
    for (let i = 0; i < 10; i++) {
      window.history.pushState(null, '', '/login');
    }
    
    // Set a flag to indicate user is logged out
    sessionStorage.setItem('user_logged_out', 'true');
    
    // Navigate to login
    navigate('/login', { replace: true });
  };

  const getSessionStatus = () => {
    return sessionManager.getSessionStatus();
  };

  const value = {
    sessionStatus,
    isSessionExpired,
    extendSession,
    logout,
    getSessionStatus,
    clearLogoutFlag
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};
