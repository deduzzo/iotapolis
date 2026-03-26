/**
 * create-category.js — DEPRECATED
 *
 * Category creation now happens on-chain. Admins call
 * mod_post_event(FORUM_CATEGORY, ...) directly on the Move smart contract.
 * The backend detects new categories via blockchain event polling.
 */

module.exports = {
  friendlyName: 'Create category (Deprecated)',
  description: 'Category creation is now on-chain. This endpoint returns a deprecation notice.',

  inputs: {
    name: { type: 'string' },
    description: { type: 'string', allowNull: true },
    sortOrder: { type: 'number' },
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
      error: 'Category creation endpoint deprecated. Admins now call mod_post_event(FORUM_CATEGORY, ...) directly on the IOTA blockchain.',
      migration: {
        action: 'Use IOTA SDK to call forum::mod_post_event() with FORUM_CATEGORY tag',
      },
    };
  },
};
