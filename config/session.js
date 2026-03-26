const crypto = require('crypto');

module.exports.session = {
  // Auto-generated random secret per instance
  secret: crypto.randomBytes(32).toString('hex'),
};
