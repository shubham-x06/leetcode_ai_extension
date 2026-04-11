const LS_JWT = 'lc_ai_jwt';
const LS_USER = 'lc_ai_user';
const LS_API = 'lc_ai_api';

function hasChromeStorage(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.storage?.local;
}

export async function storageGet(keys: string[]): Promise<Record<string, unknown>> {
  if (hasChromeStorage()) {
    return new Promise((resolve) => {
      chrome.storage.local.get(keys, (r) => resolve(r as Record<string, unknown>));
    });
  }
  const out: Record<string, unknown> = {};
  for (const k of keys) {
    if (k === 'jwt') {
      const v = localStorage.getItem(LS_JWT);
      if (v) out.jwt = v;
    }
    if (k === 'user') {
      const raw = localStorage.getItem(LS_USER);
      if (raw) {
        try {
          out.user = JSON.parse(raw);
        } catch {
          /* ignore */
        }
      }
    }
    if (k === 'apiBaseUrl') {
      const v = localStorage.getItem(LS_API);
      if (v) out.apiBaseUrl = v;
    }
  }
  return out;
}

export async function storageSet(patch: Record<string, unknown>): Promise<void> {
  if (hasChromeStorage()) {
    return new Promise((resolve) => {
      chrome.storage.local.set(patch, () => resolve());
    });
  }
  if ('jwt' in patch) {
    if (patch.jwt == null) localStorage.removeItem(LS_JWT);
    else localStorage.setItem(LS_JWT, String(patch.jwt));
  }
  if ('user' in patch) {
    if (patch.user == null) localStorage.removeItem(LS_USER);
    else localStorage.setItem(LS_USER, JSON.stringify(patch.user));
  }
  if ('apiBaseUrl' in patch && patch.apiBaseUrl != null) {
    localStorage.setItem(LS_API, String(patch.apiBaseUrl));
  }
}
