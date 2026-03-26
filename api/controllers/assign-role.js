/**
 * assign-role.js — DEPRECATED
 *
 * Role assignment now happens on-chain. Admins call admin_post_event(FORUM_ROLE, ...)
 * or set_user_role() directly on the Move smart contract.
 * The backend detects role changes via blockchain event polling.
 */

module.exports = {
  friendlyName: 'Assign role (Deprecated)',
  description: 'Role assignment is now on-chain. This endpoint returns a deprecation notice.',

  inputs: {
    targetUserId: { type: 'string' },
    role: { type: 'string' },
    categoryId: { type: 'string', allowNull: true },
    grantedBy: { type: 'string' },
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
      error: 'Role assignment endpoint deprecated. Admins now call admin_post_event(FORUM_ROLE, ...) or set_user_role() directly on the IOTA blockchain.',
      migration: {
        action: 'Use IOTA SDK to call forum::set_user_role() or forum::admin_post_event()',
      },
    };
  },
};
