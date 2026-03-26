/**
 * api-user.js — Get user profile by ID.
 *
 * User ID is now an IOTA address (e.g. "0x1234...") instead of "USR_XXXX".
 * Includes reputation, subscription status, and badges.
 */

const db = require('../utility/db');

module.exports = {
  friendlyName: 'API User',
  description: 'Get user profile by id, including reputation, subscription, and badges.',

  inputs: {},

  exits: {
    success: { statusCode: 200 },
    notFound: { statusCode: 404 },
  },

  fn: async function () {
    try {
      const userId = this.req.params.id;
      const Users = db.getModel('users');
      const user = Users.findOne({ id: userId });
      if (!user) {
        throw 'notFound';
      }

      // Get user stats
      const Posts = db.getModel('posts');
      const Threads = db.getModel('threads');
      const postCount = Posts.count({ authorId: userId });
      const threadCount = Threads.count({ authorId: userId });

      // Get reputation (if available)
      const database = db.getDb();
      let reputation = null;
      let avgRating = null;
      let badges = [];
      let subscription = null;
      let subscriptionActive = false;

      try {
        reputation = database.prepare('SELECT * FROM reputations WHERE userId = ?').get(userId);
        if (reputation && reputation.ratingCount > 0) {
          avgRating = parseFloat((reputation.ratingSum / reputation.ratingCount).toFixed(2));
        }
      } catch (e) { /* table may not exist */ }

      try {
        badges = database.prepare(`
          SELECT ub.badgeId, ub.createdAt, bc.name, bc.icon
          FROM user_badges ub
          LEFT JOIN badges_config bc ON ub.badgeId = bc.id
          WHERE ub.userId = ?
          ORDER BY ub.createdAt DESC
        `).all(userId);
      } catch (e) { /* table may not exist */ }

      try {
        subscription = database.prepare('SELECT * FROM subscriptions WHERE userId = ?').get(userId);
        subscriptionActive = subscription && subscription.expiresAt && subscription.expiresAt > Date.now();
      } catch (e) { /* table may not exist */ }

      // Total tips received
      let totalTipsReceived = 0;
      try {
        const tipRow = database.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM tips WHERE toUser = ?').get(userId);
        totalTipsReceived = tipRow.total;
      } catch (e) { /* table may not exist */ }

      return {
        success: true,
        user: {
          ...user,
          postCount,
          threadCount,
          reputation: reputation || null,
          avgRating,
          badges,
          subscription: subscription || null,
          subscriptionActive,
          totalTipsReceived,
        },
      };
    } catch (err) {
      if (err === 'notFound') throw 'notFound';
      sails.log.error('[api-user]', err.message || err);
      this.res.status(500);
      return { success: false, error: err.message || String(err) };
    }
  },
};
