/**
 * edit-post.js — DEPRECATED
 *
 * Users now edit posts by calling post_event(FORUM_POST, ...) with an
 * incremented version directly on the Move smart contract.
 * The backend detects the update via blockchain event polling.
 */

module.exports = {
  friendlyName: 'Edit post (Deprecated)',
  description: 'Post editing is now on-chain. This endpoint returns a deprecation notice.',

  inputs: {
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
      error: 'Post edit endpoint deprecated. Users now edit posts by calling post_event(FORUM_POST, ...) with incremented version directly on the IOTA blockchain.',
      migration: {
        action: 'Use IOTA SDK to call forum::post_event() with FORUM_POST tag and incremented version',
      },
    };
  },
};
