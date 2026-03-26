/**
 * moderate.js — DEPRECATED for write operations.
 *
 * Moderation actions now happen on-chain: moderators call
 * mod_post_event(FORUM_MODERATION, ...) directly on the Move smart contract.
 * The backend detects moderation events via blockchain event polling.
 *
 * This endpoint is kept as a READ-ONLY moderation log query.
 * GET requests return the moderation history for a given entity.
 */

const db = require('../utility/db');

module.exports = {
  friendlyName: 'Moderate (Read-only log)',
  description: 'Moderation writes are now on-chain. This endpoint serves as a read-only moderation log.',

  inputs: {
    // For POST (deprecated write) — kept for backward compatibility
    postId: { type: 'string' },
    action: { type: 'string' },
    reason: { type: 'string', allowNull: true },
    authorId: { type: 'string' },
    nonce: { type: 'string' },
    createdAt: { type: 'number' },
    publicKey: { type: 'string' },
    signature: { type: 'string' },
    // For GET (read-only moderation log)
    entityId: { type: 'string' },
  },

  exits: {
    success: { statusCode: 200 },
    gone: { statusCode: 410 },
  },

  fn: async function (inputs) {
    // If this is a POST (write) request, return deprecation notice
    if (this.req.method === 'POST') {
      this.res.status(410);
      return {
        success: false,
        error: 'Moderation write endpoint deprecated. Moderators now call mod_post_event(FORUM_MODERATION, ...) directly on the IOTA blockchain. The backend automatically detects moderation events via polling.',
        migration: {
          action: 'Use IOTA SDK to call forum::mod_post_event() with FORUM_MODERATION tag',
        },
      };
    }

    // GET — return moderation log for the given entity
    try {
      const Moderations = db.getModel('moderations');
      const Users = db.getModel('users');

      const where = {};
      if (inputs.entityId) where.postId = inputs.entityId;

      const moderations = Moderations.findAll(where, { sort: 'createdAt DESC', limit: 50 });

      // Enrich with moderator info
      const enriched = moderations.map(mod => {
        const moderator = Users.findOne({ id: mod.moderatorId });
        return {
          ...mod,
          moderatorUsername: moderator?.showUsername ? moderator.username : null,
          moderatorShowUsername: moderator?.showUsername || 0,
        };
      });

      return {
        success: true,
        moderations: enriched,
      };
    } catch (err) {
      sails.log.error('[moderate]', err.message || err);
      this.res.status(500);
      return { success: false, error: err.message || String(err) };
    }
  },
};
