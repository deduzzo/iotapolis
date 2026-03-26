/**
 * api-dashboard.js — Forum statistics dashboard.
 *
 * Includes new payment/marketplace stats alongside existing forum stats.
 */

const db = require('../utility/db');

module.exports = {
  friendlyName: 'API Dashboard',
  description: 'Return forum statistics: users, threads, posts, active users, payment stats.',

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

      // Latest threads (enriched with author info + privacy)
      const rawThreads = Threads.findAll(
        { hidden: false },
        { sort: 'createdAt DESC', limit: 5 }
      );
      const latestThreads = rawThreads.map(thread => {
        const author = Users.findOne({ id: thread.authorId });
        return {
          ...thread,
          authorUsername: (author?.showUsername) ? author.username : null,
          authorShowUsername: author?.showUsername || 0,
        };
      });

      // Payment/marketplace stats
      const database = db.getDb();
      let paymentStats = {};
      try {
        const totalTips = database.prepare('SELECT COUNT(*) as cnt, COALESCE(SUM(amount), 0) as total FROM tips').get();
        const totalPurchases = database.prepare('SELECT COUNT(*) as cnt, COALESCE(SUM(amount), 0) as total FROM purchases').get();
        const totalEscrows = database.prepare('SELECT COUNT(*) as cnt FROM escrows').get();
        const activeEscrows = database.prepare('SELECT COUNT(*) as cnt FROM escrows WHERE status < 3').get(); // status < RESOLVED
        const totalSubscriptions = database.prepare('SELECT COUNT(*) as cnt FROM subscriptions WHERE expiresAt > ?').get(Date.now());
        const totalBadges = database.prepare('SELECT COUNT(*) as cnt FROM user_badges').get();

        paymentStats = {
          tips: { count: totalTips.cnt, totalAmount: totalTips.total },
          purchases: { count: totalPurchases.cnt, totalAmount: totalPurchases.total },
          escrows: { total: totalEscrows.cnt, active: activeEscrows.cnt },
          activeSubscriptions: totalSubscriptions.cnt,
          badgesIssued: totalBadges.cnt,
        };
      } catch (e) {
        // Payment tables may not exist yet in older DBs
        sails.log.verbose('[api-dashboard] Payment stats not available:', e.message);
      }

      return {
        success: true,
        stats: {
          totalUsers,
          totalThreads,
          totalPosts,
          totalCategories,
          activeUsers24h: activeUserIds.size,
          latestThreads,
          ...paymentStats,
        },
      };
    } catch (err) {
      sails.log.error('[api-dashboard]', err.message || err);
      this.res.status(500);
      return { success: false, error: err.message || String(err) };
    }
  },
};
