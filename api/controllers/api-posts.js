const db = require('../utility/db');

module.exports = {
  friendlyName: 'API Posts',
  description: 'Get posts for a thread.',

  inputs: {
    thread: { type: 'string', required: true },
    page: { type: 'number', defaultsTo: 1 },
  },

  exits: {
    success: { statusCode: 200 },
  },

  fn: async function (inputs) {
    try {
      const perPage = sails.config.custom.postsPerPage || 20;
      const offset = (inputs.page - 1) * perPage;

      const Posts = db.getModel('posts');
      const posts = Posts.findAll(
        { threadId: inputs.thread, hidden: false },
        { sort: 'createdAt ASC', limit: perPage, offset }
      );
      const total = Posts.count({ threadId: inputs.thread, hidden: false });

      // Enrich with author info
      const Users = db.getModel('users');
      const enriched = posts.map(post => {
        const author = Users.findOne({ id: post.authorId });
        return {
          ...post,
          authorUsername: author?.username || null,
          authorAvatar: author?.avatar || null,
        };
      });

      return {
        success: true,
        posts: enriched,
        total,
        page: inputs.page,
        perPage,
      };
    } catch (err) {
      sails.log.error('[api-posts]', err.message || err);
      this.res.status(500);
      return { success: false, error: err.message || String(err) };
    }
  },
};
