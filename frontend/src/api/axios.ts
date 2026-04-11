import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use(async (config) => {
  let token = localStorage.getItem('authToken');
  if (!token && (window as any).chrome && (window as any).chrome.storage) {
    // Try to get from extension storage
    const result = await new Promise<{ authToken?: string }>((resolve) => {
      (window as any).chrome.storage.local.get('authToken', resolve);
    });
    token = result.authToken || null;
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      if ((window as any).chrome && (window as any).chrome.storage) {
        (window as any).chrome.storage.local.remove('authToken');
      }
      window.location.href = '#/login';
    }
    return Promise.reject(error);
  }
);

export default api;