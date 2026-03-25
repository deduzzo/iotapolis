module.exports.sockets = {
  transports: ['websocket', 'polling'],
  onlyAllowOrigins: ['http://localhost:5173'],
  beforeConnect: function (handshake, cb) {
    return cb(null, true);
  },
};
