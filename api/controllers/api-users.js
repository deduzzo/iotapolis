const db = require('../utility/db');

module.exports = {
  friendlyName: 'API Users',
  description: 'List all forum users with stats, filterable and searchable.',

  inputs: {
    role: { type: 'string', description: 'Filter by role: admin, moderator, user, banned' },
    search: { type: 'string', description: 'Search by username (partial match)' },
    sort: { type: 'string', defaultsTo: 'newest', description: 'Sort: newest, oldest, mostPosts, mostThreads, mostTips' },
    page: { type: 'number', defaultsTo: 1 },
    perPage: { type: 'number', defaultsTo: 50 },
  },

  exits: {
    success: { statusCode: 200 },
  },

  fn: async function (inputs) {
    this.res.set('Content-Type', 'application/json');
    try {
      const database = db.getDb();
      const offset = (inputs.page - 1) * inputs.perPage;

      // Build WHERE conditions
      const conditions = [];
      const params = [];

      if (inputs.role) {
        conditions.push('u.role = ?');
        params.push(inputs.role);
      }

      if (inputs.search) {
        conditions.push('u.username LIKE ?');
        params.push(`%${inputs.search}%`);
      }

      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Sort mapping
      const sortMap = {
        newest: 'u.createdAt DESC',
        oldest: 'u.createdAt ASC',
        mostPosts: 'postCount DESC',
        mostThreads: 'threadCount DESC',
        mostTips: 'tipsReceived DESC',
        alphabetical: 'u.username ASC',
      };
      const orderBy = sortMap[inputs.sort] || sortMap.newest;

      // Main query with stats
      const users = database.prepare(`
        SELECT
          u.id,
          u.username,
          u.bio,
          u.avatar,
          u.role,
          u.showUsername,
          u.createdAt,
          COALESCE(ps.postCount, 0) as postCount,
          COALESCE(ts.threadCount, 0) as threadCount,
          COALESCE(tp.tipsReceived, 0) as tipsReceived,
          COALESCE(tp.tipAmount, 0) as tipAmount,
          COALESCE(rep.totalTrades, 0) as totalTrades,
          COALESCE(rep.ratingSum, 0) as ratingSum,
          COALESCE(rep.ratingCount, 0) as ratingCount
        FROM users u
        LEFT JOIN (
          SELECT authorId, COUNT(*) as postCount FROM posts WHERE hidden = 0 GROUP BY authorId
        ) ps ON ps.authorId = u.id
        LEFT JOIN (
          SELECT authorId, COUNT(*) as threadCount FROM threads WHERE hidden = 0 GROUP BY authorId
        ) ts ON ts.authorId = u.id
        LEFT JOIN (
          SELECT toUser, COUNT(*) as tipsReceived, SUM(amount) as tipAmount FROM tips GROUP BY toUser
        ) tp ON tp.toUser = u.id
        LEFT JOIN reputations rep ON rep.userId = u.id
        ${where}
        ORDER BY ${orderBy}
        LIMIT ? OFFSET ?
      `).all(...params, inputs.perPage, offset);

      // Total count
      const total = database.prepare(
        `SELECT COUNT(*) as cnt FROM users u ${where}`
      ).get(...params).cnt;

      // Role summary
      const roleSummary = database.prepare(`
        SELECT role, COUNT(*) as count FROM users GROUP BY role
      `).all();

      // Online in last 24h (users who posted)
      const oneDayAgo = Date.now() - 86400000;
      const active24h = database.prepare(`
        SELECT COUNT(DISTINCT authorId) as cnt FROM posts WHERE createdAt > ?
      `).get(oneDayAgo).cnt;

      return this.res.json({
        success: true,
        users: users.map(u => ({
          ...u,
          displayName: u.showUsername ? u.username : u.id.slice(0, 12) + '...',
          avgRating: u.ratingCount > 0 ? (u.ratingSum / u.ratingCount).toFixed(1) : null,
        })),
        total,
        page: inputs.page,
        perPage: inputs.perPage,
        roleSummary: Object.fromEntries(roleSummary.map(r => [r.role, r.count])),
        active24h,
      });
    } catch (err) {
      sails.log.error('[api-users]', err.message || err);
      this.res.status(500);
      return this.res.json({ success: false, error: err.message || String(err) });
    }
  },
};
