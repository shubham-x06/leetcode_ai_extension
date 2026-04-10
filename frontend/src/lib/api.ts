import axios, { type AxiosError } from 'axios';
import { useSessionStore } from '../store/sessionStore';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const { jwt, apiBaseUrl } = useSessionStore.getState();
  if (apiBaseUrl) config.baseURL = apiBaseUrl;
  if (jwt) {
    config.headers.Authorization = `Bearer ${jwt}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<{ error?: string; code?: string }>) => {
    const status = err.response?.status;
    const data = err.response?.data;
    if (status === 401) {
      void useSessionStore.getState().clearSession();
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
