// API configuration utility
export const getApiURL = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Auto-detect based on current domain
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  } else {
    // For production, use the same domain as the frontend
    return `${window.location.protocol}//${window.location.host}/api`;
  }
};

// Get base URL without /api suffix for image URLs
export const getBaseURL = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL.replace('/api', '');
  }
  
  // Auto-detect based on current domain
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5000';
  } else {
    // For production, use the same domain as the frontend
    return `${window.location.protocol}//${window.location.host}`;
  }
};
