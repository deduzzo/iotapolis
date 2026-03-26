module.exports.custom = {
  // Server port (change here + in frontend vite.config.js proxy)
  // Default: backend 1337, frontend 5173
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
