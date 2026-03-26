// Frontend port — deve corrispondere a config/custom.js > frontendPort
const frontendPort = require('./custom').custom.frontendPort || 5173;

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
