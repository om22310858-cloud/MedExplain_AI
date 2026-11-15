import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach token if present
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('medexplain_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for consistent error extraction
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    let errorMessage = 'An unexpected error occurred. Please try again.';

    if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.message) {
      errorMessage = error.message;
    }

    if (error.response?.status === 401) {
      // Invalidate stored token if 401
      localStorage.removeItem('medexplain_token');
    }

    return Promise.reject({
      ...error,
      customMessage: errorMessage,
      validationErrors: error.response?.data?.errors,
    });
  }
);
