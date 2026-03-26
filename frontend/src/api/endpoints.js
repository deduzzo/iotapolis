const API_BASE = '/api/v1';

/**
 * Read-only API endpoints (no signature required).
 * Write operations now go directly to the blockchain via useIdentity().signAndSend().
 */
export const api = {
  // Categories
  getCategories: () =>
    fetch(`${API_BASE}/categories`).then((r) => r.json()),

  // Threads
  getThreads: (categoryId, page = 1) =>
    fetch(`${API_BASE}/threads?category=${categoryId}&page=${page}`).then((r) => r.json()),

  getThread: (id) =>
    fetch(`${API_BASE}/thread/${id}`).then((r) => r.json()),

  // Posts
  getPosts: (threadId) =>
    fetch(`${API_BASE}/posts?thread=${threadId}`).then((r) => r.json()),

  // Users
  getUsers: (params = {}) => {
    const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''));
    const q = new URLSearchParams(clean).toString();
    return fetch(`${API_BASE}/members${q ? '?' + q : ''}`).then((r) => r.json());
  },
  getUser: (id) =>
    fetch(`${API_BASE}/user/${id}`).then((r) => r.json()),

  // Config & Status
  getTheme: () =>
    fetch(`${API_BASE}/config/theme`).then((r) => r.json()),

  getDashboard: () =>
    fetch(`${API_BASE}/dashboard`).then((r) => r.json()),

  getSyncStatus: () =>
    fetch(`${API_BASE}/sync-status`).then((r) => r.json()),

  // History (edit versions)
  getPostHistory: (id) =>
    fetch(`${API_BASE}/post/${id}/history`).then((r) => r.json()),

  getThreadHistory: (id) =>
    fetch(`${API_BASE}/thread/${id}/history`).then((r) => r.json()),

  // Search
  search: (q) =>
    fetch(`${API_BASE}/search?q=${encodeURIComponent(q)}`).then((r) => r.json()),

  // Forum info
  getForumInfo: () =>
    fetch(`${API_BASE}/forum-info`).then((r) => r.json()),

  // ── New endpoints (payments / reputation) ─────────────────────────────────

  // Deploy contract — first-time setup
  deployContract: () =>
    fetch(`${API_BASE}/deploy-contract`, { method: 'POST' }).then((r) => r.json()),

  // Faucet — request gas tokens for a new address
  requestFaucet: (address) =>
    fetch(`${API_BASE}/faucet-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
    }).then((r) => r.json()),

  // User reputation
  getUserReputation: (id) =>
    fetch(`${API_BASE}/user/${id}/reputation`).then((r) => r.json()),

  // Subscription status
  getSubscriptionStatus: (id) =>
    fetch(`${API_BASE}/user/${id}/subscriptions`).then((r) => r.json()),

  // Escrows
  getEscrows: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.buyer) params.set('buyer', filters.buyer);
    if (filters.seller) params.set('seller', filters.seller);
    if (filters.status) params.set('status', filters.status);
    const qs = params.toString();
    return fetch(`${API_BASE}/escrows${qs ? `?${qs}` : ''}`).then((r) => r.json());
  },

  getEscrow: (id) =>
    fetch(`${API_BASE}/escrow/${id}`).then((r) => r.json()),

  // Marketplace
  getMarketplace: () =>
    fetch(`${API_BASE}/marketplace`).then((r) => r.json()),

  // Tips on a specific post
  getPostTips: (postId) =>
    fetch(`${API_BASE}/tips/${postId}`).then((r) => r.json()),
};
