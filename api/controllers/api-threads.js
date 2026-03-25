const db = require('../utility/db');

module.exports = {
  friendlyName: 'API Threads',
  description: 'Get threads by category, paginated, sorted by pinned DESC + lastPostAt DESC.',

  inputs: {
    category: { type: 'string', required: true },
    page: { type: 'number', defaultsTo: 1 },
  },

  exits: {
    success: { statusCode: 200 },
  },

  fn: async function (inputs) {
    try {
      const perPage = sails.config.custom.threadsPerPage || 20;
      const result = db.getThreadsByCategory(inputs.category, inputs.page, perPage);
      return { success: true, ...result };
    } catch (err) {
      sails.log.error('[api-threads]', err.message || err);
      this.res.status(500);
      return { success: false, error: err.message || String(err) };
    }
  },
};
