const normalizeBase = (value?: string) => (value ? value.replace(/\/$/, "") : "");

/**
 * Real API origin (no trailing slash). Example: `https://api.yourdomain.com`.
 * When set, `/api/be/*` proxies to `{API_BASE}/v1/*`.
 * When unset, the app uses the local JSON store (`data/.mock-backend-store.json`) for development.
 */
export const API_BASE = normalizeBase(
  process.env.NEXT_PUBLIC_API_BASE || process.env.API_BASE
);

/** Browser-facing BFF prefix (App Router route). */
export const API_PROXY_BASE = normalizeBase(
  process.env.API_PROXY_BASE || process.env.NEXT_PUBLIC_API_PROXY_BASE || "/api/be"
);

export const API_URLS = {
  base_url: API_BASE || API_PROXY_BASE,
  /** Real API: `{API_BASE}/api/auth`. Local mock: `{API_PROXY_BASE}/auth` → `/api/be/auth` */
  auth: API_BASE ? `${API_BASE}/api/auth` : `${API_PROXY_BASE}/auth`,
  users: `${API_PROXY_BASE}/users`,
  storageFiles: `${API_PROXY_BASE}/storage-files`,
  products: `${API_PROXY_BASE}/products`,
  categories: `${API_PROXY_BASE}/categories`,
};
