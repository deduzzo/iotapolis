/**
 * edit-user.js — DEPRECATED
 *
 * Users now edit their profile by calling post_event(FORUM_USER, ...)
 * directly on the Move smart contract with their own IOTA wallet.
 * The backend detects the update via blockchain event polling
 * and caches it in SQLite automatically.
 */

module.exports = {
  friendlyName: 'Edit user (Deprecated)',
  description: 'User editing is now on-chain. This endpoint returns a deprecation notice.',

  inputs: {
    bio: { type: 'string', allowNull: true },
    avatar: { type: 'string', allowNull: true },
    showUsername: { type: 'boolean' },
    authorId: { type: 'string' },
    nonce: { type: 'string' },
    version: { type: 'number' },
    createdAt: { type: 'number' },
    publicKey: { type: 'string' },
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
      error: 'User edit endpoint deprecated. Users now edit their profile by calling post_event(FORUM_USER, ...) directly on the IOTA blockchain. The backend automatically detects updates via event polling.',
      migration: {
        action: 'Use IOTA SDK to call forum::post_event() with FORUM_USER tag',
      },
    };
  },
};
