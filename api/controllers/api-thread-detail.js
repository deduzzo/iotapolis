const db = require('../utility/db');

module.exports = {
  friendlyName: 'API Thread Detail',
  description: 'Get thread with all posts nested by parentId, with author usernames.',

  inputs: {},

  exits: {
    success: { statusCode: 200 },
    notFound: { statusCode: 404 },
  },

  fn: async function () {
    try {
      const threadId = this.req.params.id;
      const thread = db.getThreadDetail(threadId);
      if (!thread) {
        throw 'notFound';
      }
      return { success: true, thread };
    } catch (err) {
      if (err === 'notFound') throw 'notFound';
      sails.log.error('[api-thread-detail]', err.message || err);
      this.res.status(500);
      return { success: false, error: err.message || String(err) };
    }
  },
};
