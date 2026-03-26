/**
 * moderate-thread.js — DEPRECATED
 *
 * Thread moderation (lock, unlock, pin, unpin, hide) now happens on-chain.
 * Moderators call mod_post_event(FORUM_MODERATION, ...) directly on the
 * Move smart contract. The backend detects moderation events via polling.
 */

module.exports = {
  friendlyName: 'Moderate thread (Deprecated)',
  description: 'Thread moderation is now on-chain. This endpoint returns a deprecation notice.',

  inputs: {
    threadId: { type: 'string' },
    action: { type: 'string' },
    reason: { type: 'string', allowNull: true },
    moderatorId: { type: 'string' },
    nonce: { type: 'string' },
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
      error: 'Thread moderation endpoint deprecated. Moderators now call mod_post_event(FORUM_MODERATION, ...) directly on the IOTA blockchain.',
      migration: {
        action: 'Use IOTA SDK to call forum::mod_post_event() with moderation action',
      },
    };
  },
};
