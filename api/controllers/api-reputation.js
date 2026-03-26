/**
 * api-reputation.js — GET /api/v1/user/:id/reputation
 *
 * Returns the reputation data for a user (trade stats, ratings).
 */

const db = require('../utility/db');

module.exports = {
  friendlyName: 'API Reputation',
  description: 'Get user reputation: trade stats, ratings, score.',

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

      // Get reputation
      const database = db.getDb();
      const reputation = database.prepare('SELECT * FROM reputations WHERE userId = ?').get(userId);

      // Get recent ratings for this user
      const ratings = database.prepare(`
        SELECT r.*, u.username as raterUsername, u.showUsername as raterShowUsername
        FROM ratings r
        LEFT JOIN users u ON r.rater = u.id
        WHERE r.rated = ?
        ORDER BY r.createdAt DESC
        LIMIT 20
      `).all(userId);

      // Calculate average rating
      const avgRating = reputation && reputation.ratingCount > 0
        ? (reputation.ratingSum / reputation.ratingCount).toFixed(2)
        : null;

      // Get user badges
      const badges = database.prepare(`
        SELECT ub.badgeId, ub.createdAt, bc.name, bc.icon
        FROM user_badges ub
        LEFT JOIN badges_config bc ON ub.badgeId = bc.id
        WHERE ub.userId = ?
        ORDER BY ub.createdAt DESC
      `).all(userId);

      return {
        success: true,
        reputation: reputation || {
          userId,
          totalTrades: 0,
          successful: 0,
          disputesWon: 0,
          disputesLost: 0,
          totalVolume: 0,
          ratingSum: 0,
          ratingCount: 0,
        },
        avgRating: avgRating ? parseFloat(avgRating) : null,
        ratings,
        badges,
      };
    } catch (err) {
      if (err === 'notFound') throw 'notFound';
      sails.log.error('[api-reputation]', err.message || err);
      this.res.status(500);
      return { success: false, error: err.message || String(err) };
    }
  },
};
