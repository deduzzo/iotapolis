const API_BASE = '/api/v1';

/**
 * Read-only API endpoints (no signature required).
 * Write endpoints are called via useIdentity().signAndSend().
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
};
