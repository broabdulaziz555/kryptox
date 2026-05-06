// ── API client — works on Vercel web, Capacitor Android, and local dev ────────
//
//  URL resolution priority:
//    1. process.env.NEXT_PUBLIC_API_URL         (set on Vercel, baked into APK)
//    2. 'http://localhost:3001'                  (local dev fallback)
//
//  For Capacitor APK builds set NEXT_PUBLIC_API_URL in frontend/.env.production
//  to your Railway URL before running `npm run build:android`.

const API_URL = (() => {
  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  // Strip trailing slash if present
  return url.endsWith('/') ? url.slice(0, -1) : url;
})();

// ── Token storage ─────────────────────────────────────────────────────────────
function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('kryptox_token');
}

// ── Core request ─────────────────────────────────────────────────────────────
async function request(method, path, body, options = {}) {
  const token   = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // 30-second timeout — critical for mobile networks (3G, spotty wifi)
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), options.timeout ?? 30_000);

  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body:   body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle non-JSON responses (e.g. 502 Bad Gateway HTML from Railway)
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error(`Server error (${res.status}) — is the backend running?`);
    }

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || data.message || `HTTP ${res.status}`);
    }

    return data;
  } catch (err) {
    clearTimeout(timeoutId);

    if (err.name === 'AbortError') {
      throw new Error('Request timed out — check your connection');
    }
    if (err.message === 'Failed to fetch' || err.message === 'Network request failed') {
      throw new Error('Cannot reach server — check your internet connection');
    }
    throw err;
  }
}

// ── Public API ────────────────────────────────────────────────────────────────
export const api = {
  get:    (path, opts)       => request('GET',    path, undefined, opts),
  post:   (path, body, opts) => request('POST',   path, body,      opts),
  put:    (path, body, opts) => request('PUT',    path, body,      opts),
  patch:  (path, body, opts) => request('PATCH',  path, body,      opts),
  delete: (path, opts)       => request('DELETE', path, undefined, opts),

  // Convenience — get the base URL (useful for share links, QR codes in Capacitor)
  baseUrl: () => API_URL,
};

export default api;
