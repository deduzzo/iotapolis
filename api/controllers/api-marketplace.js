/**
 * api-marketplace.js — GET /api/v1/marketplace
 *
 * Returns paid contents (threads with price > 0), available badges,
 * and subscription tiers.
 */

const db = require('../utility/db');

module.exports = {
  friendlyName: 'API Marketplace',
  description: 'List paid contents, badges, and subscription tiers.',

  inputs: {
    page: { type: 'number', defaultsTo: 1 },
  },

  exits: {
    success: { statusCode: 200 },
  },

  fn: async function (inputs) {
    try {
      const database = db.getDb();
      const perPage = 20;
      const offset = (inputs.page - 1) * perPage;

      // Get available badges
      const badges = database.prepare(`
        SELECT * FROM badges_config ORDER BY createdAt DESC
      `).all();

      // Get recent purchases (for marketplace activity feed)
      const recentPurchases = database.prepare(`
        SELECT
          p.*,
          ub.username as buyerUsername,
          ub.showUsername as buyerShowUsername
        FROM purchases p
        LEFT JOIN users ub ON p.buyer = ub.id
        ORDER BY p.createdAt DESC
        LIMIT 10
      `).all();

      // Get top tipped posts (most tips received)
      const topTippedPosts = database.prepare(`
        SELECT
          t.postId,
          COUNT(*) as tipCount,
          SUM(t.amount) as totalAmount,
          ur.username as recipientUsername,
          ur.showUsername as recipientShowUsername
        FROM tips t
        LEFT JOIN posts po ON t.postId = po.id
        LEFT JOIN users ur ON t.toUser = ur.id
        WHERE t.postId IS NOT NULL
        GROUP BY t.postId
        ORDER BY totalAmount DESC
        LIMIT 10
      `).all();

      // Get top sellers by reputation
      const topSellers = database.prepare(`
        SELECT
          r.*,
          u.username,
          u.showUsername,
          u.avatar
        FROM reputations r
        LEFT JOIN users u ON r.userId = u.id
        WHERE r.totalTrades > 0
        ORDER BY r.ratingSum * 1.0 / CASE WHEN r.ratingCount > 0 THEN r.ratingCount ELSE 1 END DESC
        LIMIT 10
      `).all();

      return {
        success: true,
        badges,
        recentPurchases,
        topTippedPosts,
        topSellers,
      };
    } catch (err) {
      sails.log.error('[api-marketplace]', err.message || err);
      this.res.status(500);
      return { success: false, error: err.message || String(err) };
    }
  },
};
