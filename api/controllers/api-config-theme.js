const db = require('../utility/db');

module.exports = {
  friendlyName: 'API Config Theme',
  description: 'Get the latest theme configuration from cache.',

  inputs: {},

  exits: {
    success: { statusCode: 200 },
  },

  fn: async function () {
    try {
      const Config = db.getModel('config');
      const theme = Config.findOne({ type: 'theme' });

      if (!theme) {
        // Return default (no custom theme configured)
        return {
          success: true,
          config: null,
        };
      }

      // Parse overrides if stored as JSON string
      let overrides = theme.overrides;
      if (typeof overrides === 'string') {
        try { overrides = JSON.parse(overrides); } catch (e) { /* keep as string */ }
      }

      return {
        success: true,
        config: {
          ...theme,
          overrides,
        },
      };
    } catch (err) {
      sails.log.error('[api-config-theme]', err.message || err);
      this.res.status(500);
      return { success: false, error: err.message || String(err) };
    }
  },
};
