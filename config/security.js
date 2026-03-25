module.exports.security = {
  cors: {
    allRoutes: true,
    allowOrigins: ['http://localhost:5173'],
    allowCredentials: true,
    allowRequestHeaders: 'content-type, authorization',
    allowRequestMethods: 'GET, POST, PUT, DELETE, OPTIONS, HEAD',
  },
  csrf: false,
};
