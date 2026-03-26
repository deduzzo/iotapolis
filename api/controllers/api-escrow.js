/**
 * api-escrow.js — GET /api/v1/escrow/:id
 *
 * Returns details of a single escrow.
 */

const db = require('../utility/db');

module.exports = {
  friendlyName: 'API Escrow Detail',
  description: 'Get details of a single escrow by ID.',

  inputs: {},

  exits: {
    success: { statusCode: 200 },
    notFound: { statusCode: 404 },
  },

  fn: async function () {
    try {
      const escrowId = this.req.params.id;
      const database = db.getDb();

      const escrow = database.prepare(`
        SELECT
          e.*,
          ub.username as buyerUsername,
          ub.showUsername as buyerShowUsername,
          us.username as sellerUsername,
          us.showUsername as sellerShowUsername,
          ua.username as arbitratorUsername,
          ua.showUsername as arbitratorShowUsername
        FROM escrows e
        LEFT JOIN users ub ON e.buyer = ub.id
        LEFT JOIN users us ON e.seller = us.id
        LEFT JOIN users ua ON e.arbitrator = ua.id
        WHERE e.id = ?
      `).get(escrowId);

      if (!escrow) {
        throw 'notFound';
      }

      // Get ratings for this escrow
      const ratings = database.prepare(`
        SELECT r.*, u.username as raterUsername, u.showUsername as raterShowUsername
        FROM ratings r
        LEFT JOIN users u ON r.rater = u.id
        WHERE r.escrowId = ?
        ORDER BY r.createdAt DESC
      `).all(escrowId);

      return {
        success: true,
        escrow,
        ratings,
      };
    } catch (err) {
      if (err === 'notFound') throw 'notFound';
      sails.log.error('[api-escrow]', err.message || err);
      this.res.status(500);
      return { success: false, error: err.message || String(err) };
    }
  },
};
