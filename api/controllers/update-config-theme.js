/**
 * update-config-theme.js — DEPRECATED
 *
 * Theme configuration now happens on-chain. Admins call
 * admin_post_event(FORUM_CONFIG, ...) directly on the Move smart contract.
 * The backend detects config updates via blockchain event polling.
 */

module.exports = {
  friendlyName: 'Update config theme (Deprecated)',
  description: 'Theme config is now on-chain. This endpoint returns a deprecation notice.',

  inputs: {
    baseTheme: { type: 'string' },
    overrides: { type: 'ref' },
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
      error: 'Theme config endpoint deprecated. Admins now call admin_post_event(FORUM_CONFIG, ...) directly on the IOTA blockchain.',
      migration: {
        action: 'Use IOTA SDK to call forum::admin_post_event() with FORUM_CONFIG tag',
      },
    };
  },
};
