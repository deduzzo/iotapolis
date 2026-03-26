module.exports.custom = {
  // ── Porte ──────────────────────────────────────────────────────
  // Backend (Sails.js): cambia qui. Sails legge process.env.PORT o questo valore.
  port: 1337,
  // Frontend (Vite dev server): cambia qui E in frontend/vite.config.js
  frontendPort: 5173,
  // URL base del backend (usato per CORS e link interni)
  baseUrl: 'http://localhost:1337',

  forumName: 'IOTA Free Forum',
  postsPerPage: 20,
  threadsPerPage: 20,
  rateLimits: {
    post: { windowMs: 10000, max: 1 },
    register: { windowMs: 60000, max: 1 },
    vote: { windowMs: 2000, max: 1 },
    default: { windowMs: 5000, max: 1 },
  },
};
