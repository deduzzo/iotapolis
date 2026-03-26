const sails = require('sails');
const rc = require('sails/accessible/rc');
const config = rc('sails');

// Read port from private_iota_conf.js (single source of truth)
try {
  const privateConf = require('./config/private_iota_conf');
  if (privateConf.PORT && !process.env.PORT) {
    config.port = privateConf.PORT;
  }
} catch (e) { /* file doesn't exist yet — bootstrap will create it */ }

sails.lift(config);
