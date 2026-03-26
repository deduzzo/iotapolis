const crypto = require('crypto');

module.exports = {
  friendlyName: 'Verify signature',
  description: 'Verify RSA-SHA256 signature on incoming request payload',
  inputs: {
    body: { type: 'ref', required: true },
  },
  fn: async function ({ body }) {
    console.log('[verify-signature] Called with body keys:', Object.keys(body || {}));

    const { signature, publicKey } = body;
    if (!signature || !publicKey) {
      console.log('[verify-signature] Missing signature or publicKey. signature:', !!signature, 'publicKey:', !!publicKey);
      throw new Error('Missing signature or publicKey');
    }

    // Remove signature and publicKey for verification
    // (frontend signs payload WITHOUT these fields, then adds them to the body)
    const payload = { ...body };
    delete payload.signature;
    delete payload.publicKey;

    // Canonical serialization (sorted keys)
    const canonical = JSON.stringify(payload, Object.keys(payload).sort());
    console.log('[verify-signature] Canonical payload length:', canonical.length);

    // Verify RSA-SHA256
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(canonical);
    let valid;
    try {
      valid = verifier.verify(publicKey, signature, 'base64');
    } catch (cryptoErr) {
      console.log('[verify-signature] Crypto verify threw:', cryptoErr.message);
      throw new Error('Invalid signature: ' + cryptoErr.message);
    }
    console.log('[verify-signature] Signature valid:', valid);
    if (!valid) throw new Error('Invalid signature');

    // Anti-replay: check nonce
    if (!body.nonce) throw new Error('Missing nonce');
    const db = require('../utility/db');
    const seen = db.checkNonce(body.nonce);
    console.log('[verify-signature] Nonce check - nonce:', body.nonce, 'seen:', seen);
    if (seen) throw new Error('Nonce already used');

    // Check createdAt freshness (24h window)
    if (!body.createdAt || Date.now() - body.createdAt > 86400000) {
      console.log('[verify-signature] Payload too old. createdAt:', body.createdAt, 'now:', Date.now());
      throw new Error('Payload too old');
    }

    // Derive userId from publicKey
    const hash = crypto.createHash('sha256').update(publicKey).digest('hex');
    const userId = 'USR_' + hash.substring(0, 16).toUpperCase();
    console.log('[verify-signature] Verified OK. userId:', userId);

    return { userId, publicKey };
  },
};
