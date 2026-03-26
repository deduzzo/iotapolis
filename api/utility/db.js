/**
 * db.js - SQLite storage layer with better-sqlite3
 *
 * Synchronous, zero-dependency (besides better-sqlite3) local cache.
 * All data is reconstructible from IOTA Tangle — this is just a fast cache.
 *
 * User identity is now the IOTA address (e.g. "0x1234...") instead of "USR_" IDs.
 * The backend is a pure indexer — it does NOT sign or publish transactions.
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// ---------------------------------------------------------------------------
// Part 1: Init + Schema
// ---------------------------------------------------------------------------

// Electron sets FORUM_DATA_DIR to appdata; otherwise use .tmp/
const DB_PATH = process.env.FORUM_DATA_DIR
  ? path.join(process.env.FORUM_DATA_DIR, 'iota-forum.db')
  : path.resolve(__dirname, '../../.tmp/iota-forum.db');

let database = null;

function initDb() {
  if (database) return database;

  // Ensure .tmp directory exists
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  database = new Database(DB_PATH);
  database.pragma('journal_mode = WAL');
  database.pragma('foreign_keys = ON');

  // Create tables
  // NOTE: users.id is now the IOTA address (e.g. "0x1234..."), not "USR_XXXX"
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      bio TEXT,
      avatar TEXT,
      publicKey TEXT DEFAULT '',
      role TEXT DEFAULT 'user',
      showUsername INTEGER DEFAULT 0,
      version INTEGER DEFAULT 1,
      createdAt INTEGER,
      updatedAt INTEGER
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      createdBy TEXT,
      sortOrder INTEGER DEFAULT 0,
      hidden INTEGER DEFAULT 0,
      createdAt INTEGER,
      updatedAt INTEGER
    );

    CREATE TABLE IF NOT EXISTS threads (
      id TEXT PRIMARY KEY,
      categoryId TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      authorId TEXT NOT NULL,
      encrypted INTEGER DEFAULT 0,
      encryptedTitle INTEGER DEFAULT 0,
      keyBundle TEXT,
      pinned INTEGER DEFAULT 0,
      locked INTEGER DEFAULT 0,
      hidden INTEGER DEFAULT 0,
      version INTEGER DEFAULT 1,
      lastPostAt INTEGER,
      postCount INTEGER DEFAULT 0,
      createdAt INTEGER,
      updatedAt INTEGER
    );

    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      threadId TEXT NOT NULL,
      parentId TEXT,
      content TEXT NOT NULL,
      authorId TEXT NOT NULL,
      hidden INTEGER DEFAULT 0,
      version INTEGER DEFAULT 1,
      score INTEGER DEFAULT 0,
      createdAt INTEGER,
      updatedAt INTEGER
    );

    CREATE TABLE IF NOT EXISTS seen_nonces (
      nonce TEXT PRIMARY KEY,
      createdAt INTEGER
    );

    CREATE TABLE IF NOT EXISTS votes (
      id TEXT PRIMARY KEY,
      postId TEXT NOT NULL,
      authorId TEXT NOT NULL,
      vote INTEGER NOT NULL,
      createdAt INTEGER,
      updatedAt INTEGER,
      UNIQUE(postId, authorId)
    );

    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      targetUserId TEXT NOT NULL,
      role TEXT NOT NULL,
      categoryId TEXT,
      grantedBy TEXT NOT NULL,
      createdAt INTEGER
    );

    CREATE TABLE IF NOT EXISTS moderations (
      id TEXT PRIMARY KEY,
      postId TEXT NOT NULL,
      action TEXT NOT NULL,
      reason TEXT,
      moderatorId TEXT NOT NULL,
      entityType TEXT DEFAULT 'post',
      createdAt INTEGER,
      updatedAt INTEGER
    );

    CREATE TABLE IF NOT EXISTS config (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      baseTheme TEXT,
      overrides TEXT,
      authorId TEXT NOT NULL,
      version INTEGER DEFAULT 1,
      createdAt INTEGER,
      updatedAt INTEGER
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
      entityId,
      title,
      content,
      content='',
      tokenize='unicode61'
    );

    -- =====================================================================
    -- New tables for payments, marketplace, escrow, reputation
    -- =====================================================================

    CREATE TABLE IF NOT EXISTS wallets (
      address TEXT PRIMARY KEY,
      userId TEXT,
      funded INTEGER DEFAULT 0,
      fundedAt INTEGER,
      createdAt INTEGER,
      updatedAt INTEGER
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      userId TEXT PRIMARY KEY,
      tier INTEGER DEFAULT 0,
      expiresAt INTEGER,
      createdAt INTEGER,
      updatedAt INTEGER
    );

    CREATE TABLE IF NOT EXISTS escrows (
      id TEXT PRIMARY KEY,
      buyer TEXT NOT NULL,
      seller TEXT NOT NULL,
      arbitrator TEXT NOT NULL,
      amount INTEGER NOT NULL,
      description TEXT,
      status INTEGER DEFAULT 0,
      deadline INTEGER,
      createdAt INTEGER,
      resolvedAt INTEGER
    );

    CREATE TABLE IF NOT EXISTS reputations (
      userId TEXT PRIMARY KEY,
      totalTrades INTEGER DEFAULT 0,
      successful INTEGER DEFAULT 0,
      disputesWon INTEGER DEFAULT 0,
      disputesLost INTEGER DEFAULT 0,
      totalVolume INTEGER DEFAULT 0,
      ratingSum INTEGER DEFAULT 0,
      ratingCount INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS tips (
      id TEXT PRIMARY KEY,
      fromUser TEXT NOT NULL,
      toUser TEXT NOT NULL,
      postId TEXT,
      amount INTEGER NOT NULL,
      createdAt INTEGER
    );

    CREATE TABLE IF NOT EXISTS purchases (
      id TEXT PRIMARY KEY,
      buyer TEXT NOT NULL,
      contentId TEXT NOT NULL,
      amount INTEGER NOT NULL,
      createdAt INTEGER
    );

    CREATE TABLE IF NOT EXISTS badges_config (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price INTEGER DEFAULT 0,
      icon TEXT,
      createdAt INTEGER
    );

    CREATE TABLE IF NOT EXISTS user_badges (
      userId TEXT NOT NULL,
      badgeId TEXT NOT NULL,
      createdAt INTEGER,
      PRIMARY KEY(userId, badgeId)
    );

    CREATE TABLE IF NOT EXISTS ratings (
      id TEXT PRIMARY KEY,
      escrowId TEXT NOT NULL,
      rater TEXT NOT NULL,
      rated TEXT NOT NULL,
      score INTEGER NOT NULL,
      comment TEXT,
      createdAt INTEGER
    );
  `);

  // Migrations: add columns that may be missing from older DBs
  const userCols = database.prepare("PRAGMA table_info(users)").all().map(c => c.name);
  if (!userCols.includes('showUsername')) {
    database.exec('ALTER TABLE users ADD COLUMN showUsername INTEGER DEFAULT 0');
  }

  // Create indexes
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_threads_category ON threads(categoryId);
    CREATE INDEX IF NOT EXISTS idx_posts_thread ON posts(threadId);
    CREATE INDEX IF NOT EXISTS idx_votes_post ON votes(postId);
    CREATE INDEX IF NOT EXISTS idx_roles_target ON roles(targetUserId);
    CREATE INDEX IF NOT EXISTS idx_tips_post ON tips(postId);
    CREATE INDEX IF NOT EXISTS idx_tips_toUser ON tips(toUser);
    CREATE INDEX IF NOT EXISTS idx_purchases_buyer ON purchases(buyer);
    CREATE INDEX IF NOT EXISTS idx_purchases_content ON purchases(contentId);
    CREATE INDEX IF NOT EXISTS idx_escrows_buyer ON escrows(buyer);
    CREATE INDEX IF NOT EXISTS idx_escrows_seller ON escrows(seller);
    CREATE INDEX IF NOT EXISTS idx_escrows_status ON escrows(status);
    CREATE INDEX IF NOT EXISTS idx_ratings_escrow ON ratings(escrowId);
    CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(userId);
  `);

  // Migrations: add missing columns to existing databases
  const migrations = [
    'ALTER TABLE votes ADD COLUMN updatedAt INTEGER',
    'ALTER TABLE users ADD COLUMN version INTEGER DEFAULT 1',
    'ALTER TABLE wallets ADD COLUMN createdAt INTEGER',
    'ALTER TABLE wallets ADD COLUMN updatedAt INTEGER',
  ];
  for (const sql of migrations) {
    try { database.exec(sql); } catch (e) { /* column already exists */ }
  }

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_moderations_post ON moderations(postId);
  `);

  return database;
}

function getDb() {
  if (!database) throw new Error('Database not initialized — call initDb() first');
  return database;
}

// ---------------------------------------------------------------------------
// Part 2: buildWhere + buildSelect helpers
// ---------------------------------------------------------------------------

function buildWhere(where) {
  if (!where || Object.keys(where).length === 0) {
    return { whereClause: '1=1', whereParams: [] };
  }
  const clauses = [];
  const params = [];
  for (const [key, value] of Object.entries(where)) {
    if (Array.isArray(value)) {
      clauses.push(`${key} IN (${value.map(() => '?').join(', ')})`);
      params.push(...value);
    } else if (value === null || value === undefined) {
      clauses.push(`${key} IS NULL`);
    } else if (typeof value === 'boolean') {
      clauses.push(`${key} = ?`);
      params.push(value ? 1 : 0);
    } else {
      clauses.push(`${key} = ?`);
      params.push(value);
    }
  }
  return { whereClause: clauses.join(' AND '), whereParams: params };
}

function buildSelect(tableName, where, options = {}) {
  const { whereClause, whereParams } = buildWhere(where);
  let sql = `SELECT * FROM ${tableName} WHERE ${whereClause}`;
  if (options.sort) sql += ` ORDER BY ${options.sort}`;
  if (options.limit) sql += ` LIMIT ${parseInt(options.limit)}`;
  if (options.offset) sql += ` OFFSET ${parseInt(options.offset)}`;
  return { sql, params: whereParams };
}

// ---------------------------------------------------------------------------
// Part 3: getModel factory
// ---------------------------------------------------------------------------

function getModel(tableName) {
  function toRow(data) {
    const row = {};
    for (const [k, v] of Object.entries(data)) {
      if (v === undefined) continue;
      if (typeof v === 'boolean') row[k] = v ? 1 : 0;
      else row[k] = v;
    }
    if (!row.createdAt) row.createdAt = Date.now();
    if (!row.updatedAt) row.updatedAt = Date.now();
    return row;
  }

  function fromRow(row) {
    if (!row) return null;
    return { ...row };
  }

  return {
    findAll(where = {}, options = {}) {
      const db = getDb();
      const { sql, params } = buildSelect(tableName, where, options);
      return db.prepare(sql).all(...params).map(fromRow);
    },

    findOne(where) {
      const db = getDb();
      const { sql, params } = buildSelect(tableName, where, { limit: 1 });
      const row = db.prepare(sql).get(...params);
      return fromRow(row);
    },

    create(data) {
      const db = getDb();
      const row = toRow(data);
      const cols = Object.keys(row);
      const placeholders = cols.map(() => '?').join(', ');
      const values = cols.map(c => row[c]);
      db.prepare(
        `INSERT INTO ${tableName} (${cols.join(', ')}) VALUES (${placeholders})`
      ).run(...values);
      return fromRow(row);
    },

    update(id, data) {
      const db = getDb();
      const updates = { ...data, updatedAt: Date.now() };
      for (const [k, v] of Object.entries(updates)) {
        if (typeof v === 'boolean') updates[k] = v ? 1 : 0;
      }
      const setCols = Object.keys(updates);
      const setValues = setCols.map(c => updates[c]);
      db.prepare(
        `UPDATE ${tableName} SET ${setCols.map(c => `${c} = ?`).join(', ')} WHERE id = ?`
      ).run(...setValues, id);
      return this.findOne({ id });
    },

    delete(id) {
      const db = getDb();
      db.prepare(`DELETE FROM ${tableName} WHERE id = ?`).run(id);
    },

    count(where = {}) {
      const db = getDb();
      const { whereClause, whereParams } = buildWhere(where);
      const row = db.prepare(
        `SELECT COUNT(*) as cnt FROM ${tableName} WHERE ${whereClause}`
      ).get(...whereParams);
      return row.cnt;
    },
  };
}

// ---------------------------------------------------------------------------
// Part 4: Nonce check (anti-replay)
// ---------------------------------------------------------------------------

function checkNonce(nonce) {
  const db = getDb();
  const existing = db.prepare('SELECT nonce FROM seen_nonces WHERE nonce = ?').get(nonce);
  if (existing) return true;
  db.prepare('INSERT INTO seen_nonces (nonce, createdAt) VALUES (?, ?)').run(nonce, Date.now());
  return false;
}

// ---------------------------------------------------------------------------
// Part 5: FTS5 search
// ---------------------------------------------------------------------------

function searchFts(query) {
  const db = getDb();
  return db.prepare(
    `SELECT entityId, title, content FROM search_index WHERE search_index MATCH ? ORDER BY rank`
  ).all(query);
}

function updateFtsIndex(entityId, title, content) {
  const db = getDb();
  // Delete old entry first, then insert new one (content='' table requires manual sync)
  db.prepare('INSERT INTO search_index(search_index, entityId, title, content) VALUES(\'delete\', ?, ?, ?)').run(entityId, title || '', content || '');
  db.prepare('INSERT INTO search_index(entityId, title, content) VALUES(?, ?, ?)').run(entityId, title || '', content || '');
}

// ---------------------------------------------------------------------------
// Part 6: Forum-specific queries
// ---------------------------------------------------------------------------

function getCategoryStats() {
  const db = getDb();
  return db.prepare(`
    SELECT
      c.*,
      COALESCE(ts.threadCount, 0) as threadCount,
      COALESCE(ts.postCount, 0) as postCount,
      ts.lastActivity,
      lt.title as lastThreadTitle,
      CASE WHEN lu.showUsername = 1 THEN lu.username ELSE NULL END as lastAuthor,
      lu.showUsername as lastAuthorShowUsername
    FROM categories c
    LEFT JOIN (
      SELECT
        t.categoryId,
        COUNT(DISTINCT t.id) as threadCount,
        COALESCE(SUM(t.postCount), 0) as postCount,
        MAX(COALESCE(t.lastPostAt, t.createdAt)) as lastActivity
      FROM threads t
      WHERE t.hidden = 0
      GROUP BY t.categoryId
    ) ts ON ts.categoryId = c.id
    LEFT JOIN (
      SELECT t2.categoryId, t2.title, t2.authorId,
        ROW_NUMBER() OVER (PARTITION BY t2.categoryId ORDER BY COALESCE(t2.lastPostAt, t2.createdAt) DESC) as rn
      FROM threads t2
      WHERE t2.hidden = 0
    ) lt ON lt.categoryId = c.id AND lt.rn = 1
    LEFT JOIN users lu ON lt.authorId = lu.id
    ORDER BY c.sortOrder ASC, c.createdAt ASC
  `).all();
}

function getThreadsByCategory(categoryId, page = 1, perPage = 20) {
  const db = getDb();
  const offset = (page - 1) * perPage;

  const threads = db.prepare(`
    SELECT
      t.*,
      u.username as authorUsername,
      u.avatar as authorAvatar,
      u.showUsername as authorShowUsername,
      lp.authorId as lastAuthorId,
      lu.username as lastAuthorUsername,
      lu.showUsername as lastAuthorShowUsername
    FROM threads t
    LEFT JOIN users u ON t.authorId = u.id
    LEFT JOIN (
      SELECT threadId, authorId
      FROM posts
      WHERE hidden = 0
      GROUP BY threadId
      HAVING createdAt = MAX(createdAt)
    ) lp ON lp.threadId = t.id
    LEFT JOIN users lu ON lp.authorId = lu.id
    WHERE t.categoryId = ? AND t.hidden = 0
    ORDER BY t.pinned DESC, t.lastPostAt DESC, t.createdAt DESC
    LIMIT ? OFFSET ?
  `).all(categoryId, perPage, offset);

  const total = db.prepare(
    'SELECT COUNT(*) as cnt FROM threads WHERE categoryId = ? AND hidden = 0'
  ).get(categoryId).cnt;

  return { threads, total, page, perPage };
}

function getThreadDetail(threadId) {
  const db = getDb();

  const thread = db.prepare(`
    SELECT
      t.*,
      u.username as authorUsername,
      u.avatar as authorAvatar,
      u.showUsername as authorShowUsername
    FROM threads t
    LEFT JOIN users u ON t.authorId = u.id
    WHERE t.id = ?
  `).get(threadId);

  if (!thread) return null;

  const posts = db.prepare(`
    SELECT
      p.*,
      u.username as authorUsername,
      u.avatar as authorAvatar,
      u.showUsername as authorShowUsername
    FROM posts p
    LEFT JOIN users u ON p.authorId = u.id
    WHERE p.threadId = ?
    ORDER BY p.createdAt ASC
  `).all(threadId);

  // Return flat list — frontend NestedReplies handles nesting by parentId
  return { ...thread, posts };
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  initDb,
  getDb,
  getModel,
  checkNonce,
  searchFts,
  updateFtsIndex,
  getCategoryStats,
  getThreadsByCategory,
  getThreadDetail,
};
