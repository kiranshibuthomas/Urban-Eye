// API Configuration utility
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const SERVER_BASE_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';

export const getApiURL = (endpoint) => {
  // Handle undefined or null endpoint
  if (!endpoint) {
    console.warn('getApiURL called with undefined endpoint, returning base URL');
    return API_BASE_URL;
  }
  
  // Ensure endpoint is a string
  const endpointStr = String(endpoint);
  
  // Remove leading slash if present
  const cleanEndpoint = endpointStr.startsWith('/') ? endpointStr.slice(1) : endpointStr;
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

export const getBaseURL = () => {
  return process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
};

// Get server base URL for static files (removes /api from the end)
export const getServerBaseURL = () => {
  return SERVER_BASE_URL;
};

// Get full URL for uploaded files - supports both local and Cloudinary URLs
export const getUploadURL = (filePath) => {
  if (!filePath) return '';
  
  // If it's already a full URL (Cloudinary or external), return as is
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  
  // For local files, construct full URL
  const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
  
  // If path already starts with uploads, use it as is
  if (cleanPath.startsWith('uploads/')) {
    return `${getServerBaseURL()}/${cleanPath}`;
  }
  
  // Otherwise, assume it needs /uploads prefix
  return `${getServerBaseURL()}/uploads/${cleanPath}`;
};

// Legacy function for backward compatibility
export const getImageURL = (imagePath) => {
  return getUploadURL(imagePath);
};

export default {
  getApiURL,
  getBaseURL,
  getServerBaseURL,
  getUploadURL,
  getImageURL
};