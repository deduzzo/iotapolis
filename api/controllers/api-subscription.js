/**
 * api-subscription.js — GET /api/v1/user/:id/subscription
 *
 * Returns the subscription status for a user.
 */

const db = require('../utility/db');

module.exports = {
  friendlyName: 'API Subscription',
  description: 'Get user subscription status and tier.',

  inputs: {},

  exits: {
    success: { statusCode: 200 },
    notFound: { statusCode: 404 },
  },

  fn: async function () {
    try {
      const userId = this.req.params.id;

      // Check user exists
      const Users = db.getModel('users');
      const user = Users.findOne({ id: userId });
      if (!user) {
        throw 'notFound';
      }

      // Get subscription
      const database = db.getDb();
      const subscription = database.prepare('SELECT * FROM subscriptions WHERE userId = ?').get(userId);

      // Check if subscription is active (not expired)
      const now = Date.now();
      const isActive = subscription && subscription.expiresAt && subscription.expiresAt > now;

      return {
        success: true,
        subscription: subscription || {
          userId,
          tier: 0,
          expiresAt: null,
          createdAt: null,
          updatedAt: null,
        },
        isActive: !!isActive,
        currentTier: isActive ? subscription.tier : 0,
      };
    } catch (err) {
      if (err === 'notFound') throw 'notFound';
      sails.log.error('[api-subscription]', err.message || err);
      this.res.status(500);
      return { success: false, error: err.message || String(err) };
    }
  },
};
