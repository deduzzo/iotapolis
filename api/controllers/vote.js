/**
 * vote.js — DEPRECATED
 *
 * Users now vote by calling post_event(FORUM_VOTE, ...) directly on the
 * Move smart contract with their own IOTA wallet.
 * The backend detects votes via blockchain event polling.
 */

module.exports = {
  friendlyName: 'Vote (Deprecated)',
  description: 'Voting is now on-chain. This endpoint returns a deprecation notice.',

  inputs: {
    postId: { type: 'string' },
    vote: { type: 'number' },
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
      error: 'Vote endpoint deprecated. Users now vote by calling post_event(FORUM_VOTE, ...) directly on the IOTA blockchain.',
      migration: {
        action: 'Use IOTA SDK to call forum::post_event() with FORUM_VOTE tag',
      },
    };
  },
};
