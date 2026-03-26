/**
 * edit-category.js — DEPRECATED
 *
 * Category editing now happens on-chain. Admins call
 * mod_post_event(FORUM_CATEGORY, ...) with an incremented version
 * directly on the Move smart contract.
 * The backend detects updates via blockchain event polling.
 */

module.exports = {
  friendlyName: 'Edit category (Deprecated)',
  description: 'Category editing is now on-chain. This endpoint returns a deprecation notice.',

  inputs: {
    name: { type: 'string' },
    description: { type: 'string', allowNull: true },
    sortOrder: { type: 'number', allowNull: true },
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
      error: 'Category edit endpoint deprecated. Admins now call mod_post_event(FORUM_CATEGORY, ...) with incremented version directly on the IOTA blockchain.',
      migration: {
        action: 'Use IOTA SDK to call forum::mod_post_event() with FORUM_CATEGORY tag',
      },
    };
  },
};
