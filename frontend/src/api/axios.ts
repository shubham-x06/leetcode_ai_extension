import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// For Chrome extension compatibility, always use explicit backend URL if defined
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const apiClient = axios.create({
  baseURL,
  timeout: 10000,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes('/auth/google') &&
      !error.config?.url?.includes('/auth/link-leetcode')
    ) {
      useAuthStore.getState().logout();
      window.location.hash = '#/login';
    }
    return Promise.reject(error);
  }
);