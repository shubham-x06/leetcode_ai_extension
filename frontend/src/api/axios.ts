import axios, { type AxiosError } from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import { DEFAULT_API_BASE_URL } from '../lib/constants';

export const api = axios.create({
  baseURL: DEFAULT_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const { token, apiBaseUrl } = useAuthStore.getState();
  if (apiBaseUrl) config.baseURL = apiBaseUrl;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<{ error?: string; code?: string }>) => {
    const status = err.response?.status;
    const data = err.response?.data;
    if (status === 401) {
      void useAuthStore.getState().logout();
    }
    const message = data?.error || err.message || 'Request failed';
    return Promise.reject(
      Object.assign(new Error(message), {
        status,
        code: data?.code,
      })
    );
  }
);

export function getStaleMeta(headers: import('axios').AxiosResponse['headers']): {
  stale: boolean;
  staleReason?: string;
} {
  const h = headers || {};
  const stale = String(h['x-data-stale'] || h['X-Data-Stale'] || '') === 'true';
  const staleReason = (h['x-data-stale-reason'] || h['X-Data-Stale-Reason']) as string | undefined;
  return { stale, staleReason };
}
