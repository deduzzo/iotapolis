const ForumTags = require('../enums/ForumTags');

module.exports = {
  friendlyName: 'Post history',
  description: 'Get all versions of a post from the blockchain.',

  inputs: {},

  exits: {
    success: { statusCode: 200 },
    notFound: { statusCode: 404 },
  },

  fn: async function () {
    try {
      const postId = this.req.params.id;

      const ForumManager = require('../utility/ForumManager');
      const history = await ForumManager.getEntityHistory(ForumTags.FORUM_POST, postId);

      if (!history || history.length === 0) {
        throw 'notFound';
      }

      return { success: true, entityId: postId, history };
    } catch (err) {
      if (err === 'notFound') throw 'notFound';
      sails.log.error('[post-history]', err.message || err);
      this.res.status(500);
      return { success: false, error: err.message || String(err) };
    }
  },
};
