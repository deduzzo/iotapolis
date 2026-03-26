/**
 * api-escrows.js — GET /api/v1/escrows
 *
 * Returns a list of escrows, optionally filtered by buyer, seller, status.
 */

const db = require('../utility/db');

module.exports = {
  friendlyName: 'API Escrows',
  description: 'List escrows with optional filters: buyer, seller, status.',

  inputs: {
    buyer: { type: 'string' },
    seller: { type: 'string' },
    status: { type: 'number' },
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

      // Build dynamic WHERE clause
      const conditions = [];
      const params = [];

      if (inputs.buyer) {
        conditions.push('e.buyer = ?');
        params.push(inputs.buyer);
      }
      if (inputs.seller) {
        conditions.push('e.seller = ?');
        params.push(inputs.seller);
      }
      if (inputs.status != null) {
        conditions.push('e.status = ?');
        params.push(inputs.status);
      }

      const whereClause = conditions.length > 0
        ? 'WHERE ' + conditions.join(' AND ')
        : '';

      // Get escrows with user info
      const escrows = database.prepare(`
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
        ${whereClause}
        ORDER BY e.createdAt DESC
        LIMIT ? OFFSET ?
      `).all(...params, perPage, offset);

      // Count total
      const countRow = database.prepare(
        `SELECT COUNT(*) as cnt FROM escrows e ${whereClause}`
      ).get(...params);

      return {
        success: true,
        escrows,
        total: countRow.cnt,
        page: inputs.page,
        perPage,
      };
    } catch (err) {
      sails.log.error('[api-escrows]', err.message || err);
      this.res.status(500);
      return { success: false, error: err.message || String(err) };
    }
  },
};
