import axios from 'axios';
import { getApiURL } from '../utils/apiConfig';

const API_URL = getApiURL();

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const publicFeedService = {
  // Get public complaints feed
  getPublicFeed: async (params = {}) => {
    try {
      const response = await api.get('/public-feed', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching public feed:', error);
      throw error;
    }
  },

  // Get specific public complaint
  getPublicComplaint: async (id) => {
    try {
      const response = await api.get(`/public-feed/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching public complaint:', error);
      throw error;
    }
  },

  // Vote on a complaint
  voteOnComplaint: async (id, voteType) => {
    try {
      const response = await api.post(`/public-feed/${id}/vote`, {
        voteType
      });
      return response.data;
    } catch (error) {
      console.error('Error voting on complaint:', error);
      throw error;
    }
  },

  // Get public feed statistics
  getPublicFeedStats: async () => {
    try {
      const response = await api.get('/public-feed/stats/overview');
      return response.data;
    } catch (error) {
      console.error('Error fetching public feed stats:', error);
      throw error;
    }
  },

  // Get trending complaints
  getTrendingComplaints: async (limit = 10) => {
    try {
      const response = await api.get('/public-feed/trending', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching trending complaints:', error);
      throw error;
    }
  }
};

export default publicFeedService;