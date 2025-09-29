import axios from 'axios';

// Access API_BASE_URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; // Fallback for development

// Create axios instance with base configuration
const api = axios.create({
  baseURL:  `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || JSON.parse(localStorage.getItem('authToken'));
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle authentication errors
    if (error.response?.status === 401) {
      // Token expired or invalid - handle gracefully without redirecting
      console.warn('Authentication error detected. Token may be expired or invalid.');
      
      // Don't clear localStorage or redirect - let the component handle the error
      // This prevents unwanted redirects to login page
      return Promise.reject(new Error('Authentication failed. Please check your session.'));
    }
    
    // Handle server errors
    if (error.response?.status >= 500) {
      return Promise.reject(new Error('Server error. Please try again later.'));
    }
    
    // Handle other errors
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject(new Error(errorMessage));
  }
);

// Helper function to get auth headers (for backward compatibility)
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || JSON.parse(localStorage.getItem('authToken'));
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Helper function to get token
export const getAuthToken = () => {
  return localStorage.getItem('token') || JSON.parse(localStorage.getItem('authToken'));
};

// Helper function to check if user is authenticated
export const isAuthenticated = () => {
  const token = getAuthToken();
  return !!token;
};

export default api; 