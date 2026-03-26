/**
 * edit-thread.js — DEPRECATED
 *
 * Users now edit threads by calling post_event(FORUM_THREAD, ...) with an
 * incremented version directly on the Move smart contract.
 * The backend detects the update via blockchain event polling.
 */

module.exports = {
  friendlyName: 'Edit thread (Deprecated)',
  description: 'Thread editing is now on-chain. This endpoint returns a deprecation notice.',

  inputs: {
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
      error: 'Thread edit endpoint deprecated. Users now edit threads by calling post_event(FORUM_THREAD, ...) with incremented version directly on the IOTA blockchain.',
      migration: {
        action: 'Use IOTA SDK to call forum::post_event() with FORUM_THREAD tag and incremented version',
      },
    };
  },
};
