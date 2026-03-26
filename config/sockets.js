let frontendPort = 5173;
try { frontendPort = require('./private_iota_conf').FRONTEND_PORT || 5173; } catch (e) {}

module.exports.sockets = {
  transports: ['websocket', 'polling'],
  onlyAllowOrigins: [`http://localhost:${frontendPort}`],
  beforeConnect: function (handshake, cb) {
    return cb(null, true);
  },
};
