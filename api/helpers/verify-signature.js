const crypto = require('crypto');

module.exports = {
  friendlyName: 'Verify signature',
  description: 'Verify RSA-SHA256 signature on incoming request payload',
  inputs: {
    body: { type: 'ref', required: true },
  },
  fn: async function ({ body }) {
    const { signature, publicKey } = body;
    if (!signature || !publicKey) throw new Error('Missing signature or publicKey');

    // Remove signature for verification
    const payload = { ...body };
    delete payload.signature;

    // Canonical serialization (sorted keys)
    const canonical = JSON.stringify(payload, Object.keys(payload).sort());

    // Verify RSA-SHA256
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(canonical);
    const valid = verifier.verify(publicKey, signature, 'base64');
    if (!valid) throw new Error('Invalid signature');

    // Anti-replay: check nonce
    if (!body.nonce) throw new Error('Missing nonce');
    const db = require('../utility/db');
    const seen = db.checkNonce(body.nonce);
    if (seen) throw new Error('Nonce already used');

    // Check createdAt freshness (24h window)
    if (!body.createdAt || Date.now() - body.createdAt > 86400000) {
      throw new Error('Payload too old');
    }

    // Derive userId from publicKey
    const hash = crypto.createHash('sha256').update(publicKey).digest('hex');
    const userId = 'USR_' + hash.substring(0, 16).toUpperCase();

    return { userId, publicKey };
  },
};
