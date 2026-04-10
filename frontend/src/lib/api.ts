import { storageGet, storageSet } from './storage';

const DEFAULT_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export type ApiMeta = { stale?: boolean; staleReason?: string };

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function getBase(): Promise<string> {
  const s = await storageGet(['apiBaseUrl']);
  const v = s.apiBaseUrl;
  return (typeof v === 'string' && v.trim()) || DEFAULT_BASE;
}

async function getJwt(): Promise<string | undefined> {
  const s = await storageGet(['jwt']);
  return typeof s.jwt === 'string' ? s.jwt : undefined;
}

export async function setApiBaseUrl(url: string): Promise<void> {
  await storageSet({ apiBaseUrl: url.trim() || DEFAULT_BASE });
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {}
): Promise<{ data: T; meta: ApiMeta; response: Response }> {
  const base = await getBase();
  const jwt = init.auth === false ? undefined : await getJwt();
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (jwt) headers.set('Authorization', `Bearer ${jwt}`);

  const res = await fetch(`${base}${path}`, { ...init, headers });
  const stale = res.headers.get('X-Data-Stale') === 'true';
  const staleReason = res.headers.get('X-Data-Stale-Reason') || undefined;

  if (res.status === 401 && init.auth !== false) {
    await storageSet({ jwt: null, user: null });
  }

  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json().catch(() => ({})) : (await res.text() as unknown);

  if (!res.ok) {
    const body = data as { error?: string; code?: string; message?: string };
    throw new ApiError(
      body.error || body.message || `HTTP ${res.status}`,
      res.status,
      body.code
    );
  }

  return { data: data as T, meta: { stale, staleReason }, response: res };
}

export async function loginWithGoogleAccessToken(accessToken: string): Promise<void> {
  const base = await getBase();
  const res = await fetch(`${base}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken }),
  });
  const data = (await res.json()) as { token?: string; user?: unknown; error?: string };
  if (!res.ok) {
    throw new Error(data.error || 'Login failed');
  }
  if (!data.token) throw new Error('No token returned');
  await storageSet({ jwt: data.token, user: data.user });
}

export function getGoogleAccessTokenInteractive(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof chrome === 'undefined' || !chrome.identity?.getAuthToken) {
      reject(new Error('Google sign-in is only available inside the Chrome extension.'));
      return;
    }
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      const err = chrome.runtime.lastError;
      if (err || !token) {
        reject(new Error(err?.message || 'Could not get Google token'));
        return;
      }
      resolve(token);
    });
  });
}
