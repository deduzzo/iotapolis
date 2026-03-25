const db = require('../utility/db');

module.exports = {
  friendlyName: 'API Categories',
  description: 'Get all categories with thread/post counts and last activity.',

  inputs: {},

  exits: {
    success: { statusCode: 200 },
  },

  fn: async function () {
    try {
      const categories = db.getCategoryStats();
      return { success: true, categories };
    } catch (err) {
      sails.log.error('[api-categories]', err.message || err);
      this.res.status(500);
      return { success: false, error: err.message || String(err) };
    }
  },
};
