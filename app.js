const sails = require('sails');
const rc = require('sails/accessible/rc');
const config = rc('sails');

// Use port from config/custom.js or env variable
try {
  const custom = require('./config/custom').custom;
  if (custom.port && !process.env.PORT) {
    config.port = custom.port;
  }
} catch (e) { /* use default */ }

sails.lift(config);
