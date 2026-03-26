/**
 * create-thread.js — DEPRECATED
 *
 * Users now create threads by calling post_event(FORUM_THREAD, ...)
 * directly on the Move smart contract with their own IOTA wallet.
 * The backend detects the new thread via blockchain event polling
 * and caches it in SQLite automatically.
 */

module.exports = {
  friendlyName: 'Create thread (Deprecated)',
  description: 'Thread creation is now on-chain. This endpoint returns a deprecation notice.',

  inputs: {
    categoryId: { type: 'string' },
    title: { type: 'string' },
    content: { type: 'string' },
    authorId: { type: 'string' },
    encrypted: { type: 'boolean' },
    encryptedTitle: { type: 'boolean' },
    keyBundle: { type: 'ref' },
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
      error: 'Thread creation endpoint deprecated. Users now create threads by calling post_event(FORUM_THREAD, ...) directly on the IOTA blockchain. The backend automatically detects new threads via event polling.',
      migration: {
        action: 'Use IOTA SDK to call forum::post_event() with FORUM_THREAD tag',
      },
    };
  },
};
