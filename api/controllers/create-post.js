/**
 * create-post.js — DEPRECATED
 *
 * Users now create posts by calling post_event(FORUM_POST, ...)
 * directly on the Move smart contract with their own IOTA wallet.
 * The backend detects the new post via blockchain event polling
 * and caches it in SQLite automatically.
 */

module.exports = {
  friendlyName: 'Create post (Deprecated)',
  description: 'Post creation is now on-chain. This endpoint returns a deprecation notice.',

  inputs: {
    threadId: { type: 'string' },
    parentId: { type: 'string', allowNull: true },
    content: { type: 'string' },
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
      error: 'Post creation endpoint deprecated. Users now create posts by calling post_event(FORUM_POST, ...) directly on the IOTA blockchain. The backend automatically detects new posts via event polling.',
      migration: {
        action: 'Use IOTA SDK to call forum::post_event() with FORUM_POST tag',
      },
    };
  },
};
