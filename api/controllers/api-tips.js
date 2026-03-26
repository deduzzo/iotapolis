/**
 * api-tips.js — GET /api/v1/tips/:postId
 *
 * Returns all tips received on a specific post.
 */

const db = require('../utility/db');

module.exports = {
  friendlyName: 'API Tips',
  description: 'Get all tips received on a specific post.',

  inputs: {},

  exits: {
    success: { statusCode: 200 },
  },

  fn: async function () {
    try {
      const postId = this.req.params.postId;
      const database = db.getDb();

      // Get tips for this post with user info
      const tips = database.prepare(`
        SELECT
          t.*,
          uf.username as fromUsername,
          uf.showUsername as fromShowUsername,
          ut.username as toUsername,
          ut.showUsername as toShowUsername
        FROM tips t
        LEFT JOIN users uf ON t.fromUser = uf.id
        LEFT JOIN users ut ON t.toUser = ut.id
        WHERE t.postId = ?
        ORDER BY t.createdAt DESC
      `).all(postId);

      // Calculate total tips amount
      const totalAmount = tips.reduce((sum, t) => sum + (t.amount || 0), 0);

      return {
        success: true,
        tips,
        totalAmount,
        tipCount: tips.length,
      };
    } catch (err) {
      sails.log.error('[api-tips]', err.message || err);
      this.res.status(500);
      return { success: false, error: err.message || String(err) };
    }
  },
};
