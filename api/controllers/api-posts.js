/**
 * api-posts.js — Get posts for a thread.
 *
 * Enriched with author info (respecting showUsername privacy)
 * and tip counts per post.
 */

const db = require('../utility/db');

module.exports = {
  friendlyName: 'API Posts',
  description: 'Get posts for a thread, enriched with author info and tip counts.',

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

      // Enrich with author info and tip counts
      const Users = db.getModel('users');
      const database = db.getDb();

      const enriched = posts.map(post => {
        const author = Users.findOne({ id: post.authorId });

        // Get tip count and total for this post
        let tipCount = 0;
        let tipTotal = 0;
        try {
          const tipRow = database.prepare(
            'SELECT COUNT(*) as cnt, COALESCE(SUM(amount), 0) as total FROM tips WHERE postId = ?'
          ).get(post.id);
          tipCount = tipRow.cnt;
          tipTotal = tipRow.total;
        } catch (e) { /* tips table may not exist */ }

        return {
          ...post,
          authorUsername: (author?.showUsername) ? author.username : null,
          authorAvatar: author?.avatar || null,
          authorShowUsername: author?.showUsername || 0,
          tipCount,
          tipTotal,
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
