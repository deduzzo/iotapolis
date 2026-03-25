const ForumTags = require('../enums/ForumTags');

module.exports = {
  friendlyName: 'Config theme history',
  description: 'Get all versions of the theme configuration from the blockchain.',

  inputs: {},

  exits: {
    success: { statusCode: 200 },
  },

  fn: async function () {
    try {
      const ForumManager = require('../utility/ForumManager');
      const history = await ForumManager.getEntityHistory(ForumTags.FORUM_CONFIG, 'CONFIG_theme');

      return {
        success: true,
        entityId: 'CONFIG_theme',
        history: history || [],
      };
    } catch (err) {
      sails.log.error('[config-theme-history]', err.message || err);
      this.res.status(500);
      return { success: false, error: err.message || String(err) };
    }
  },
};
