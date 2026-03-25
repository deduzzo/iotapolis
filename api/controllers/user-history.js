const ForumTags = require('../enums/ForumTags');

module.exports = {
  friendlyName: 'User history',
  description: 'Get all versions of a user profile from the blockchain.',

  inputs: {},

  exits: {
    success: { statusCode: 200 },
    notFound: { statusCode: 404 },
  },

  fn: async function () {
    try {
      const userId = this.req.params.id;

      const ForumManager = require('../utility/ForumManager');
      const history = await ForumManager.getEntityHistory(ForumTags.FORUM_USER, userId);

      if (!history || history.length === 0) {
        throw 'notFound';
      }

      return { success: true, entityId: userId, history };
    } catch (err) {
      if (err === 'notFound') throw 'notFound';
      sails.log.error('[user-history]', err.message || err);
      this.res.status(500);
      return { success: false, error: err.message || String(err) };
    }
  },
};
