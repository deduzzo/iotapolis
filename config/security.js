// Frontend port — letta da private_iota_conf.js
let frontendPort = 5173;
try { frontendPort = require('./private_iota_conf').FRONTEND_PORT || 5173; } catch (e) { /* */ }

module.exports.security = {
  cors: {
    allRoutes: true,
    allowOrigins: [`http://localhost:${frontendPort}`],
    allowCredentials: true,
    allowRequestHeaders: 'content-type, authorization',
    allowRequestMethods: 'GET, POST, PUT, DELETE, OPTIONS, HEAD',
  },
  csrf: false,
};
