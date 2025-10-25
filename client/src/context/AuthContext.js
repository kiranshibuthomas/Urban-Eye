import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import axios from 'axios';
import { customToast } from '../utils/customToast';
import { getApiURL } from '../utils/apiConfig';

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
  error: null
};

// Action types
const AuthActionTypes = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_USER: 'UPDATE_USER'
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AuthActionTypes.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
        error: null
      };
    
    case AuthActionTypes.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null
      };
    
    case AuthActionTypes.LOGOUT:
      return {
        ...initialState,
        loading: false
      };
    
    case AuthActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    
    case AuthActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    
    case AuthActionTypes.UPDATE_USER:
      return {
        ...state,
        user: action.payload
      };
    
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Configure axios defaults
axios.defaults.baseURL = getApiURL();
axios.defaults.withCredentials = true;

// Auth Provider
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Define logout function early to avoid hoisting issues
  const logout = useCallback(async () => {
    try {
      // Call logout endpoint to clear server-side session/cookie
      await axios.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage and axios headers
      localStorage.removeItem('token');
      localStorage.removeItem('session_refresh');
      sessionStorage.clear();
      delete axios.defaults.headers.common['Authorization'];

      // Dispatch logout action
      dispatch({ type: AuthActionTypes.LOGOUT });
      
      // Clear browser history to prevent back button access
      window.history.replaceState(null, '', '/login');
      
      customToast.success('See you later! 👋');
    }
  }, []);

  // Set up axios interceptor for token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    // Response interceptor to handle token expiration
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid - only show toast if not already logged out
          if (state.isAuthenticated) {
            // Clear token immediately
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
            
            // Dispatch logout action
            dispatch({ type: AuthActionTypes.LOGOUT });
            
            // Show error message
            customToast.error('Session expired. Please login again.');
            
            // Redirect to login
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [state.isAuthenticated]);

  // Check if user is logged in on app start
  useEffect(() => {
    checkAuthStatus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Set up periodic session refresh
  useEffect(() => {
    if (state.isAuthenticated) {
      // Refresh session every 30 minutes
      const refreshInterval = setInterval(() => {
        checkAuthStatus();
      }, 30 * 60 * 1000);

      return () => clearInterval(refreshInterval);
    }
  }, [state.isAuthenticated]);

  const checkAuthStatus = async () => {
    try {
      dispatch({ type: AuthActionTypes.SET_LOADING, payload: true });
      
      const token = localStorage.getItem('token');
      
      if (token) {
        // Set token in axios headers
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      // Try to verify authentication with backend (works with both token and cookie)
      const response = await axios.get('/auth/me');
      
      if (response.data.success) {
        // If we don't have a token in localStorage but the request succeeded,
        // it means we're authenticated via cookie (from OAuth)
        const finalToken = token || 'cookie-auth';
        
        // If we got a new token from the server, store it
        if (response.data.token && response.data.token !== 'cookie-auth') {
          localStorage.setItem('token', response.data.token);
          axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        }
        
        dispatch({
          type: AuthActionTypes.LOGIN_SUCCESS,
          payload: {
            user: response.data.user,
            token: response.data.token || finalToken
          }
        });
        
        // Clear logout flag on successful authentication
        sessionStorage.removeItem('user_logged_out');
        
        // Clear navigation blocker logout state
        if (window.navigationBlocker) {
          window.navigationBlocker.clearLoggedOut();
        }
      } else {
        throw new Error('Invalid authentication');
      }
    } catch (error) {
      console.error('Auth check failed:', error.response?.data || error.message);
      
      // Clear authentication state
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      dispatch({ type: AuthActionTypes.LOGOUT });
    }
  };

  const login = async (credentials) => {
    try {
      dispatch({ type: AuthActionTypes.SET_LOADING, payload: true });
      dispatch({ type: AuthActionTypes.CLEAR_ERROR });

      const response = await axios.post('/auth/login', credentials);
      
      if (response.data.success) {
        const { token, user } = response.data;
        
        // Store token in localStorage with validation
        if (token) {
          localStorage.setItem('token', token);
          // Set token in axios headers
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        
        dispatch({
          type: AuthActionTypes.LOGIN_SUCCESS,
          payload: { user, token }
        });

        // Only show login success message if it's not an OAuth login
        // OAuth logins will show their own message via OAuthHandler
        const isOAuthLogin = sessionStorage.getItem('oauth_login') === 'true';
        if (!isOAuthLogin) {
          customToast.success('Welcome back! 🎉');
        } else {
          // Clear the OAuth flag
          sessionStorage.removeItem('oauth_login');
        }
        
        return { success: true, user, token };
      }
    } catch (error) {
      // Clear any existing token on login failure
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      
      const message = error.response?.data?.message || 'Login failed';
      dispatch({ type: AuthActionTypes.SET_ERROR, payload: message });
      customToast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: AuthActionTypes.SET_LOADING, payload: true });
      dispatch({ type: AuthActionTypes.CLEAR_ERROR });

      const response = await axios.post('/auth/register', userData);
      
      if (response.data.success) {
        const { token, user, requiresEmailVerification, requiresOTPVerification, email, message } = response.data;
        
        // Only log in user if no verification is required (e.g., Google OAuth)
        if (!requiresEmailVerification && !requiresOTPVerification) {
          // Store token in localStorage
          localStorage.setItem('token', token);
          
          // Set token in axios headers
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          dispatch({
            type: AuthActionTypes.LOGIN_SUCCESS,
            payload: { user, token }
          });
          
          customToast.success('Account created! 🚀');
        } else {
          // For verification flows, don't log in yet
          dispatch({ type: AuthActionTypes.SET_LOADING, payload: false });
          
          if (requiresOTPVerification) {
            customToast.success('Check your email for verification! 📧');
          } else if (requiresEmailVerification) {
            customToast.success('Check your email to verify! 📧');
          }
        }
        
        return { 
          success: true, 
          user, 
          requiresEmailVerification, 
          requiresOTPVerification,
          email 
        };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      dispatch({ type: AuthActionTypes.SET_ERROR, payload: message });
      customToast.error(message);
      return { success: false, error: message };
    }
  };

  const verifyOTP = async (email, otp) => {
    try {
      dispatch({ type: AuthActionTypes.SET_LOADING, payload: true });
      dispatch({ type: AuthActionTypes.CLEAR_ERROR });

      const response = await axios.post('/auth/verify-otp', { email, otp });
      
      if (response.data.success) {
        const { token, user } = response.data;
        
        // Store token in localStorage
        localStorage.setItem('token', token);
        
        // Set token in axios headers
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        dispatch({
          type: AuthActionTypes.LOGIN_SUCCESS,
          payload: { user, token }
        });
        
        customToast.success('Email verified! ✅');
        return { success: true, user };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'OTP verification failed';
      dispatch({ type: AuthActionTypes.SET_ERROR, payload: message });
      return { success: false, error: message };
    } finally {
      dispatch({ type: AuthActionTypes.SET_LOADING, payload: false });
    }
  };


  const updateUser = (userData) => {
    dispatch({ type: AuthActionTypes.UPDATE_USER, payload: userData });
  };

  const clearError = useCallback(() => {
    dispatch({ type: AuthActionTypes.CLEAR_ERROR });
  }, []);

  const verifyEmail = async (token) => {
    try {
      const response = await axios.get(`/auth/verify-email/${token}`);
      
      if (response.data.success) {
        customToast.success('Email verified! ✅');
        return { success: true };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Email verification failed';
      customToast.error(message);
      return { success: false, error: message };
    }
  };

  const resendVerification = async () => {
    try {
      const response = await axios.post('/auth/resend-verification');
      
      if (response.data.success) {
        customToast.success('Verification email sent! 📧');
        return { success: true };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to resend verification email';
      customToast.error(message);
      return { success: false, error: message };
    }
  };

  const refreshAvatar = useCallback(async () => {
    try {
      const response = await axios.get('/auth/debug-avatar');
      if (response.data.success) {
        const debugInfo = response.data.debug;
        
        // Update user with fresh avatar URL
        dispatch({
          type: AuthActionTypes.UPDATE_USER,
          payload: debugInfo.publicProfile
        });
        
        return debugInfo;
      }
    } catch (error) {
      console.error('Avatar refresh error:', error);
      return null;
    }
  }, []);

  const value = {
    ...state,
    login,
    register,
    verifyOTP,
    logout,
    updateUser,
    clearError,
    checkAuthStatus,
    verifyEmail,
    resendVerification,
    refreshAvatar
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
