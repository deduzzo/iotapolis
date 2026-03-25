const db = require('../utility/db');

module.exports = {
  friendlyName: 'API User',
  description: 'Get user profile by id.',

  inputs: {},

  exits: {
    success: { statusCode: 200 },
    notFound: { statusCode: 404 },
  },

  fn: async function () {
    try {
      const userId = this.req.params.id;
      const Users = db.getModel('users');
      const user = Users.findOne({ id: userId });
      if (!user) {
        throw 'notFound';
      }

      // Get user stats
      const Posts = db.getModel('posts');
      const Threads = db.getModel('threads');
      const postCount = Posts.count({ authorId: userId });
      const threadCount = Threads.count({ authorId: userId });

      return {
        success: true,
        user: {
          ...user,
          postCount,
          threadCount,
        },
      };
    } catch (err) {
      if (err === 'notFound') throw 'notFound';
      sails.log.error('[api-user]', err.message || err);
      this.res.status(500);
      return { success: false, error: err.message || String(err) };
    }
  },
};
