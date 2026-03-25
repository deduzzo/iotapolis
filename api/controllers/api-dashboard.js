const db = require('../utility/db');

module.exports = {
  friendlyName: 'API Dashboard',
  description: 'Return forum statistics: total users, threads, posts, active users in 24h.',

  inputs: {},

  exits: {
    success: { statusCode: 200 },
  },

  fn: async function () {
    try {
      const Users = db.getModel('users');
      const Threads = db.getModel('threads');
      const Posts = db.getModel('posts');
      const Categories = db.getModel('categories');

      const totalUsers = Users.count();
      const totalThreads = Threads.count();
      const totalPosts = Posts.count();
      const totalCategories = Categories.count();

      // Active users in last 24h (users who posted)
      const oneDayAgo = Date.now() - 86400000;
      const recentPosts = Posts.findAll({}, { sort: 'createdAt DESC', limit: 500 });
      const activeUserIds = new Set();
      for (const post of recentPosts) {
        if (post.createdAt >= oneDayAgo) {
          activeUserIds.add(post.authorId);
        }
      }

      // Latest threads
      const latestThreads = Threads.findAll(
        { hidden: false },
        { sort: 'createdAt DESC', limit: 5 }
      );

      return {
        success: true,
        stats: {
          totalUsers,
          totalThreads,
          totalPosts,
          totalCategories,
          activeUsers24h: activeUserIds.size,
          latestThreads,
        },
      };
    } catch (err) {
      sails.log.error('[api-dashboard]', err.message || err);
      this.res.status(500);
      return { success: false, error: err.message || String(err) };
    }
  },
};
