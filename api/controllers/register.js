/**
 * register.js — DEPRECATED
 *
 * Registration now happens directly on-chain. Users call register()
 * on the Move smart contract with their own IOTA wallet.
 * The backend detects the registration via blockchain event polling
 * and caches it in SQLite automatically.
 *
 * This endpoint is kept for backward compatibility but returns a
 * deprecation notice directing clients to use on-chain registration.
 */

module.exports = {
  friendlyName: 'Register (Deprecated)',
  description: 'Registration is now on-chain. This endpoint returns a deprecation notice.',

  inputs: {
    username: { type: 'string' },
    publicKey: { type: 'string' },
    bio: { type: 'string', allowNull: true },
    avatar: { type: 'string', allowNull: true },
    nonce: { type: 'string' },
    version: { type: 'number' },
    createdAt: { type: 'number' },
    signature: { type: 'string' },
  },

  exits: {
    success: { statusCode: 200 },
    gone: { statusCode: 410 },
  },

  fn: async function () {
    this.res.status(410);
    return {
      success: false,
      error: 'Registration endpoint deprecated. Users now register directly on the IOTA blockchain by calling register() on the Move smart contract. The backend automatically detects new registrations via event polling.',
      migration: {
        action: 'Use IOTA SDK to call forum::register() directly',
        docs: '/docs/superpowers/specs/2026-03-26-security-payments-redesign.md',
      },
    };
  },
};
