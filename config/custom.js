module.exports.custom = {
  // Porte: configurate in config/private_iota_conf.js (PORT, FRONTEND_PORT)
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
