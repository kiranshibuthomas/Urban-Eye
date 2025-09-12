import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const OAuthHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { checkAuthStatus, user } = useAuth();
  const hasProcessedAuth = useRef(false);
  const lastProcessedUrl = useRef('');

  useEffect(() => {
    const currentUrl = location.search;
    
    // Skip if we've already processed this exact URL
    if (hasProcessedAuth.current && lastProcessedUrl.current === currentUrl) {
      return;
    }

    // Check for OAuth success/error in URL params
    const urlParams = new URLSearchParams(currentUrl);
    const authStatus = urlParams.get('auth');
    const token = urlParams.get('token');
    const errorParam = urlParams.get('error');

    // Only process if there are actual OAuth parameters
    if (!authStatus && !errorParam) {
      return;
    }

    // Mark as processed for this URL
    hasProcessedAuth.current = true;
    lastProcessedUrl.current = currentUrl;

    if (authStatus === 'success' && token) {
      // Store token and trigger auth check
      localStorage.setItem('token', token);
      toast.success('Google authentication successful!');
      
      // Clear URL params immediately and navigate
      navigate(location.pathname, { replace: true });
      
      // Small delay to ensure URL is cleared before auth check
      setTimeout(() => {
        checkAuthStatus();
      }, 100);
    } else if (authStatus === 'success' && !token) {
      toast.success('Google authentication successful!');
      navigate(location.pathname, { replace: true });
      
      setTimeout(() => {
        checkAuthStatus();
      }, 100);
    } else if (errorParam === 'auth_failed') {
      toast.error('Google authentication failed. Please try again.');
      navigate(location.pathname, { replace: true });
    }

    // Reset the flag after a delay to allow for new OAuth flows
    setTimeout(() => {
      hasProcessedAuth.current = false;
      lastProcessedUrl.current = '';
    }, 5000);

  }, [location.search, location.pathname, checkAuthStatus, navigate]);

  // Handle redirect after OAuth authentication
  useEffect(() => {
    if (user && hasProcessedAuth.current) {
      // Redirect based on user role after OAuth success
      const redirectPath = user.role === 'admin' ? '/admin-dashboard' : '/citizen-dashboard';
      navigate(redirectPath, { replace: true });
      
      // Reset the flag
      hasProcessedAuth.current = false;
      lastProcessedUrl.current = '';
    }
  }, [user, navigate]);

  return null; // This component doesn't render anything
};

export default OAuthHandler;
