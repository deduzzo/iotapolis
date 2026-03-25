const ForumTags = require('../enums/ForumTags');

module.exports = {
  friendlyName: 'Thread history',
  description: 'Get all versions of a thread from the blockchain.',

  inputs: {},

  exits: {
    success: { statusCode: 200 },
    notFound: { statusCode: 404 },
  },

  fn: async function () {
    try {
      const threadId = this.req.params.id;

      const ForumManager = require('../utility/ForumManager');
      const history = await ForumManager.getEntityHistory(ForumTags.FORUM_THREAD, threadId);

      if (!history || history.length === 0) {
        throw 'notFound';
      }

      return { success: true, entityId: threadId, history };
    } catch (err) {
      if (err === 'notFound') throw 'notFound';
      sails.log.error('[thread-history]', err.message || err);
      this.res.status(500);
      return { success: false, error: err.message || String(err) };
    }
  },
};
