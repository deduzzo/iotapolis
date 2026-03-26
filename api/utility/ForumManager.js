/**
 * ForumManager.js - Core business logic + blockchain sync
 *
 * Reads all forum transactions from IOTA Tangle, processes them into
 * the local SQLite cache, and publishes new data to the chain.
 * Pattern follows ListManager.js from exart26-iota.
 */

const path = require('path');
const fs = require('fs');
const iota = require('./iota');
const db = require('./db');
const {
  FORUM_USER,
  FORUM_CATEGORY,
  FORUM_THREAD,
  FORUM_POST,
  FORUM_VOTE,
  FORUM_ROLE,
  FORUM_MODERATION,
  FORUM_CONFIG,
} = require('../enums/ForumTags');

// --- Sync Logger ---
const LOGS_DIR = path.resolve(__dirname, '../../logs');

class SyncLogger {
  constructor() {
    this._stream = null;
    this._startTime = null;
  }

  start() {
    try {
      if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      const filePath = path.join(LOGS_DIR, `forum-sync-${ts}.log`);
      this._stream = fs.createWriteStream(filePath, { flags: 'a' });
      this._stream.on('error', (err) => {
        console.warn('[SyncLogger] Write error:', err.message);
        this._stream = null;
      });
      this._startTime = Date.now();
      this.log('=== FORUM SYNC STARTED ===');
      return filePath;
    } catch (e) {
      console.warn('[SyncLogger] Cannot create log file:', e.message);
      return null;
    }
  }

  log(msg) {
    if (!this._stream) return;
    const elapsed = this._startTime ? ((Date.now() - this._startTime) / 1000).toFixed(1) : '0.0';
    this._stream.write(`[+${elapsed}s] ${msg}\n`);
  }

  end(success) {
    if (!this._stream) return;
    const elapsed = this._startTime ? ((Date.now() - this._startTime) / 1000).toFixed(1) : '0.0';
    this.log(`=== FORUM SYNC ${success ? 'COMPLETED' : 'FAILED'} in ${elapsed}s ===`);
    this._stream.end();
    this._stream = null;
  }
}

// --- Tag-to-handler mapping ---
const TAG_HANDLERS = {
  [FORUM_USER]: 'handleForumUser',
  [FORUM_CATEGORY]: 'handleForumCategory',
  [FORUM_THREAD]: 'handleForumThread',
  [FORUM_POST]: 'handleForumPost',
  [FORUM_VOTE]: 'handleForumVote',
  [FORUM_ROLE]: 'handleForumRole',
  [FORUM_MODERATION]: 'handleForumModeration',
  [FORUM_CONFIG]: 'handleForumConfig',
};

// --- Models (lazy-initialized) ---
let User, Category, Thread, Post, Vote, Role, Moderation, Config;

function ensureModels() {
  if (User) return;
  User = db.getModel('users');
  Category = db.getModel('categories');
  Thread = db.getModel('threads');
  Post = db.getModel('posts');
  Vote = db.getModel('votes');
  Role = db.getModel('roles');
  Moderation = db.getModel('moderations');
  Config = db.getModel('config');
}

// =========================================================================
// ForumManager
// =========================================================================

class ForumManager {

  constructor(socketId = null) {
    this._socketId = socketId;
    this._syncState = { status: 'idle', lastSync: null, stats: null };
    if (socketId) iota.setSocketId(socketId);
  }

  getSyncState() {
    return { ...this._syncState };
  }

  // -----------------------------------------------------------------------
  // 1. syncFromBlockchain
  // -----------------------------------------------------------------------

  /**
   * Fetch all TXs with 'iotaforum' tag from the IOTA Tangle,
   * decode each payload, route to handler, update SQLite cache.
   */
  async syncFromBlockchain(onProgress = null) {
    this._syncState = { status: 'syncing', lastSync: null, stats: null };
    const syncLog = new SyncLogger();
    const logFile = syncLog.start();
    sails.log.info(`[ForumManager] Starting blockchain sync... (log: ${logFile || 'N/A'})`);

    ensureModels();

    const stats = {
      users: 0,
      categories: 0,
      threads: 0,
      posts: 0,
      votes: 0,
      roles: 0,
      moderations: 0,
      configs: 0,
      errors: 0,
    };

    const reportProgress = (status, total, processed) => {
      if (onProgress) onProgress({ status, ...stats, total, processed });
    };

    try {
      // Use bulk cache to download all TXs once
      reportProgress('downloading', 0, 0);
      syncLog.log('Fetching all transactions from chain (bulk cache)...');
      const byTag = await iota.getAllTransactionsCached();

      // Count total TXs across relevant forum tags
      let totalTxs = 0;
      const forumTags = Object.keys(TAG_HANDLERS);
      for (const tag of forumTags) {
        totalTxs += (byTag[tag] || []).length;
      }
      syncLog.log(`Found ${totalTxs} forum transactions across ${forumTags.length} tags`);

      // Process each tag
      let processed = 0;
      for (const tag of forumTags) {
        const records = byTag[tag] || [];
        syncLog.log(`Processing tag ${tag}: ${records.length} records`);

        // Sort by version/timestamp ascending so latest overwrites correctly
        records.sort((a, b) => (a.version || 0) - (b.version || 0) || (a.timestamp || 0) - (b.timestamp || 0));

        for (const record of records) {
          try {
            const data = typeof record.payload === 'string'
              ? JSON.parse(record.payload)
              : record.payload;

            this.processTransaction(tag, data);
            this._incrementStat(stats, tag);
          } catch (err) {
            stats.errors++;
            syncLog.log(`ERROR processing ${tag} record: ${err.message}`);
            sails.log.warn(`[ForumManager] Error processing ${tag}:`, err.message);
          }

          processed++;
          if (processed % 100 === 0) {
            reportProgress('syncing', totalTxs, processed);
          }
        }
      }

      // Free bulk cache
      iota.clearBulkCache();

      reportProgress('done', totalTxs, totalTxs);
      syncLog.log(`Sync complete: ${JSON.stringify(stats)}`);
      syncLog.end(true);
      this._syncState = { status: 'idle', lastSync: new Date().toISOString(), stats };
      sails.log.info(`[ForumManager] Sync complete:`, stats);
      return stats;

    } catch (err) {
      syncLog.log(`FATAL: ${err.message}\n${err.stack}`);
      syncLog.end(false);
      this._syncState = { status: 'error', lastSync: null, error: err.message };
      sails.log.error('[ForumManager] Sync failed:', err);
      iota.clearBulkCache();
      throw err;
    }
  }

  // -----------------------------------------------------------------------
  // 2. publishToChain
  // -----------------------------------------------------------------------

  /**
   * Publish data to IOTA Tangle and update local cache.
   * @param {string} tag - Forum tag (e.g. FORUM_THREAD)
   * @param {string} entityId - Unique entity identifier
   * @param {object} data - The data object to publish
   * @returns {{ success, digest, error }}
   */
  async publishToChain(tag, entityId, data) {
    console.log(`[ForumManager] publishToChain called: tag=${tag}, entityId=${entityId}, data=`, JSON.stringify(data).substring(0, 200));
    sails.log.info(`[ForumManager] Publishing ${tag} entityId=${entityId}`);

    const result = await iota.publishData(tag, data, entityId, data.version || 1);

    if (!result.success) {
      // TX failed — add to retry queue
      sails.log.error(`[ForumManager] TX failed for ${tag}:${entityId}: ${result.error}`);
      this._addToRetryQueue(tag, entityId, data, result.error);
      return result;
    }

    // TX succeeded — verify it's actually on-chain
    sails.log.info(`[ForumManager] TX published: ${result.digest}. Verifying on-chain...`);
    const verified = await this._verifyOnChain(result.digest);

    if (!verified) {
      sails.log.warn(`[ForumManager] TX ${result.digest} NOT verified on-chain! Adding to retry queue.`);
      this._addToRetryQueue(tag, entityId, data, 'TX published but not verified on-chain');
      return { ...result, verified: false };
    }

    sails.log.info(`[ForumManager] TX ${result.digest} verified on-chain OK`);

    // Only update local cache AFTER on-chain verification
    try {
      ensureModels();
      this.processTransaction(tag, data);
    } catch (err) {
      sails.log.warn('[ForumManager] Local cache update failed after publish:', err.message);
    }

    // Broadcast real-time event
    try {
      await sails.helpers.broadcastEvent(tag, {
        action: 'upsert',
        entityId,
        tag,
        digest: result.digest,
        verified: true,
      });
    } catch (err) {
      sails.log.warn('[ForumManager] Broadcast failed:', err.message);
    }

    return { ...result, verified: true };
  }

  /**
   * Verify a TX exists on-chain by its digest.
   * Retries up to 3 times with 2s delay.
   */
  async _verifyOnChain(digest, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const client = await iota.getClient();
        const tx = await client.getTransactionBlock({ digest, options: { showEffects: true } });
        if (tx && tx.effects?.status?.status === 'success') {
          return true;
        }
        sails.log.warn(`[ForumManager] Verify attempt ${attempt}: TX ${digest} status=${tx?.effects?.status?.status}`);
      } catch (err) {
        sails.log.warn(`[ForumManager] Verify attempt ${attempt}: ${err.message}`);
      }
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    return false;
  }

  /**
   * Add a failed TX to the retry queue. Stored in SQLite for persistence.
   * A background process retries these periodically.
   */
  _addToRetryQueue(tag, entityId, data, error) {
    try {
      const database = db.getDb();
      // Create retry queue table if not exists
      database.exec(`
        CREATE TABLE IF NOT EXISTS tx_retry_queue (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tag TEXT NOT NULL,
          entityId TEXT,
          data TEXT NOT NULL,
          error TEXT,
          attempts INTEGER DEFAULT 0,
          maxAttempts INTEGER DEFAULT 5,
          nextRetryAt INTEGER,
          createdAt INTEGER,
          updatedAt INTEGER
        )
      `);

      const now = Date.now();
      database.prepare(`
        INSERT INTO tx_retry_queue (tag, entityId, data, error, attempts, nextRetryAt, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, 0, ?, ?, ?)
      `).run(tag, entityId, JSON.stringify(data), error, now + 10000, now, now);

      sails.log.info(`[ForumManager] Added to retry queue: ${tag}:${entityId}`);
    } catch (err) {
      sails.log.error('[ForumManager] Failed to add to retry queue:', err.message);
    }
  }

  /**
   * Process the retry queue — called periodically from bootstrap.
   * Retries failed TXs with exponential backoff.
   */
  async processRetryQueue() {
    try {
      const database = db.getDb();
      database.exec(`
        CREATE TABLE IF NOT EXISTS tx_retry_queue (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tag TEXT NOT NULL, entityId TEXT, data TEXT NOT NULL,
          error TEXT, attempts INTEGER DEFAULT 0, maxAttempts INTEGER DEFAULT 5,
          nextRetryAt INTEGER, createdAt INTEGER, updatedAt INTEGER
        )
      `);

      const now = Date.now();
      const pending = database.prepare(`
        SELECT * FROM tx_retry_queue WHERE attempts < maxAttempts AND nextRetryAt <= ?
      `).all(now);

      if (pending.length === 0) return;

      sails.log.info(`[ForumManager] Retry queue: ${pending.length} pending TXs`);

      for (const item of pending) {
        const data = JSON.parse(item.data);
        sails.log.info(`[ForumManager] Retrying TX: ${item.tag}:${item.entityId} (attempt ${item.attempts + 1}/${item.maxAttempts})`);

        const result = await iota.publishData(item.tag, data, item.entityId, data.version || 1);

        if (result.success) {
          const verified = await this._verifyOnChain(result.digest);
          if (verified) {
            // Success — remove from queue, update cache
            database.prepare('DELETE FROM tx_retry_queue WHERE id = ?').run(item.id);
            try {
              ensureModels();
              this.processTransaction(item.tag, data);
            } catch (e) { /* cache update best-effort */ }
            sails.log.info(`[ForumManager] Retry SUCCESS: ${item.tag}:${item.entityId} digest=${result.digest}`);
            continue;
          }
        }

        // Still failed — increment attempts, set next retry with exponential backoff
        const nextDelay = Math.min(30000 * Math.pow(2, item.attempts), 600000); // max 10 min
        database.prepare(`
          UPDATE tx_retry_queue SET attempts = attempts + 1, error = ?, nextRetryAt = ?, updatedAt = ? WHERE id = ?
        `).run(result.error || 'Verification failed', now + nextDelay, now, item.id);

        sails.log.warn(`[ForumManager] Retry FAILED: ${item.tag}:${item.entityId}, next retry in ${nextDelay / 1000}s`);
      }
    } catch (err) {
      sails.log.error('[ForumManager] processRetryQueue error:', err.message);
    }
  }

  /**
   * Get retry queue status.
   */
  getRetryQueueStatus() {
    try {
      const database = db.getDb();
      database.exec(`CREATE TABLE IF NOT EXISTS tx_retry_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT, tag TEXT NOT NULL, entityId TEXT,
        data TEXT NOT NULL, error TEXT, attempts INTEGER DEFAULT 0,
        maxAttempts INTEGER DEFAULT 5, nextRetryAt INTEGER, createdAt INTEGER, updatedAt INTEGER
      )`);
      const pending = database.prepare('SELECT COUNT(*) as count FROM tx_retry_queue WHERE attempts < maxAttempts').get();
      const failed = database.prepare('SELECT COUNT(*) as count FROM tx_retry_queue WHERE attempts >= maxAttempts').get();
      return { pending: pending.count, failed: failed.count };
    } catch {
      return { pending: 0, failed: 0 };
    }
  }

  // -----------------------------------------------------------------------
  // 3. processTransaction
  // -----------------------------------------------------------------------

  /**
   * Parse payload and route to the appropriate handler.
   * @param {string} tag - The forum tag
   * @param {object} data - Decoded JSON payload
   */
  processTransaction(tag, data) {
    ensureModels();

    const handlerName = TAG_HANDLERS[tag];
    if (!handlerName) {
      sails.log.verbose(`[ForumManager] Unknown tag: ${tag}, skipping`);
      return;
    }

    this[handlerName](data);
  }

  // -----------------------------------------------------------------------
  // 4. Handler functions
  // -----------------------------------------------------------------------

  /**
   * Upsert user, update FTS index.
   */
  handleForumUser(data) {
    const existing = User.findOne({ id: data.id });

    if (existing) {
      // Preserve role if not explicitly set in data (sync doesn't carry roles)
      User.update(data.id, {
        username: data.username,
        bio: data.bio,
        avatar: data.avatar,
        publicKey: data.publicKey,
        role: data.role || existing.role || 'user',
        showUsername: data.showUsername != null ? (data.showUsername ? 1 : 0) : existing.showUsername,
        updatedAt: data.updatedAt || Date.now(),
      });
    } else {
      // First user in empty DB becomes admin
      const allUsers = User.findAll({});
      const isFirstUser = !allUsers || allUsers.length === 0;

      User.create({
        id: data.id,
        username: data.username,
        bio: data.bio || null,
        avatar: data.avatar || null,
        publicKey: data.publicKey,
        role: data.role || (isFirstUser ? 'admin' : 'user'),
        showUsername: data.showUsername ? 1 : 0,
        createdAt: data.createdAt || Date.now(),
        updatedAt: data.updatedAt || Date.now(),
      });
    }

    // Update FTS with username + bio
    db.updateFtsIndex(data.id, data.username, data.bio || '');
  }

  /**
   * Upsert category.
   */
  handleForumCategory(data) {
    const existing = Category.findOne({ id: data.id });

    if (existing) {
      Category.update(data.id, {
        name: data.name,
        description: data.description,
        sortOrder: data.sortOrder != null ? data.sortOrder : existing.sortOrder,
      });
    } else {
      Category.create({
        id: data.id,
        name: data.name,
        description: data.description || null,
        createdBy: data.createdBy || data.authorId,
        sortOrder: data.sortOrder || 0,
        createdAt: data.createdAt || Date.now(),
      });
    }
  }

  /**
   * Upsert thread (version-aware), update postCount/lastPostAt, update FTS.
   */
  handleForumThread(data) {
    const existing = Thread.findOne({ id: data.id });

    if (existing) {
      // Version-aware: only update if version > existing
      if (data.version && existing.version && data.version <= existing.version) return;

      Thread.update(data.id, {
        title: data.title,
        content: data.content,
        encrypted: data.encrypted ? 1 : 0,
        encryptedTitle: data.encryptedTitle ? 1 : 0,
        keyBundle: data.keyBundle || existing.keyBundle,
        pinned: data.pinned != null ? (data.pinned ? 1 : 0) : existing.pinned,
        locked: data.locked != null ? (data.locked ? 1 : 0) : existing.locked,
        hidden: data.hidden != null ? (data.hidden ? 1 : 0) : existing.hidden,
        version: data.version || (existing.version + 1),
        lastPostAt: data.lastPostAt || existing.lastPostAt,
        postCount: data.postCount != null ? data.postCount : existing.postCount,
        updatedAt: data.updatedAt || Date.now(),
      });
    } else {
      Thread.create({
        id: data.id,
        categoryId: data.categoryId,
        title: data.title,
        content: data.content,
        authorId: data.authorId,
        encrypted: data.encrypted ? 1 : 0,
        encryptedTitle: data.encryptedTitle ? 1 : 0,
        keyBundle: data.keyBundle || null,
        pinned: data.pinned ? 1 : 0,
        locked: data.locked ? 1 : 0,
        hidden: data.hidden ? 1 : 0,
        version: data.version || 1,
        lastPostAt: data.lastPostAt || data.createdAt || Date.now(),
        postCount: data.postCount || 0,
        createdAt: data.createdAt || Date.now(),
        updatedAt: data.updatedAt || Date.now(),
      });
    }

    // Update FTS with title + content (skip if encrypted)
    if (!data.encrypted) {
      db.updateFtsIndex(data.id, data.title, data.content);
    }
  }

  /**
   * Upsert post (version-aware), update parent thread stats, update FTS.
   */
  handleForumPost(data) {
    const existing = Post.findOne({ id: data.id });

    if (existing) {
      // Version-aware: only update if version > existing
      if (data.version && existing.version && data.version <= existing.version) return;

      Post.update(data.id, {
        content: data.content,
        hidden: data.hidden != null ? (data.hidden ? 1 : 0) : existing.hidden,
        version: data.version || (existing.version + 1),
        score: data.score != null ? data.score : existing.score,
        updatedAt: data.updatedAt || Date.now(),
      });
    } else {
      Post.create({
        id: data.id,
        threadId: data.threadId,
        parentId: data.parentId || null,
        content: data.content,
        authorId: data.authorId,
        hidden: data.hidden ? 1 : 0,
        version: data.version || 1,
        score: data.score || 0,
        createdAt: data.createdAt || Date.now(),
        updatedAt: data.updatedAt || Date.now(),
      });

      // Update parent thread stats (postCount + lastPostAt)
      this._updateThreadStats(data.threadId);
    }

    // Update FTS
    db.updateFtsIndex(data.id, '', data.content);
  }

  /**
   * Upsert vote, recalculate post score.
   */
  handleForumVote(data) {
    const existing = Vote.findOne({ id: data.id });

    if (existing) {
      Vote.update(data.id, {
        vote: data.vote,
      });
    } else {
      // Check for existing vote by same author on same post (UNIQUE constraint)
      const duplicate = Vote.findOne({ postId: data.postId, authorId: data.authorId });
      if (duplicate) {
        Vote.update(duplicate.id, { vote: data.vote });
      } else {
        Vote.create({
          id: data.id,
          postId: data.postId,
          authorId: data.authorId,
          vote: data.vote,
          createdAt: data.createdAt || Date.now(),
        });
      }
    }

    // Recalculate post score
    this._recalculatePostScore(data.postId);
  }

  /**
   * Upsert role assignment.
   */
  handleForumRole(data) {
    const existing = Role.findOne({ id: data.id });

    if (existing) {
      Role.update(data.id, {
        role: data.role,
        categoryId: data.categoryId || null,
      });
    } else {
      Role.create({
        id: data.id,
        targetUserId: data.targetUserId,
        role: data.role,
        categoryId: data.categoryId || null,
        grantedBy: data.grantedBy,
        createdAt: data.createdAt || Date.now(),
      });
    }
  }

  /**
   * Upsert moderation action, update post.hidden if action is 'hide'.
   */
  handleForumModeration(data) {
    const existing = Moderation.findOne({ id: data.id });

    if (!existing) {
      Moderation.create({
        id: data.id,
        postId: data.postId,
        action: data.action,
        reason: data.reason || null,
        moderatorId: data.moderatorId,
        createdAt: data.createdAt || Date.now(),
      });
    }

    // Apply moderation effect
    if (data.action === 'hide') {
      const post = Post.findOne({ id: data.postId });
      if (post) {
        Post.update(data.postId, { hidden: 1 });
      }
    } else if (data.action === 'unhide') {
      const post = Post.findOne({ id: data.postId });
      if (post) {
        Post.update(data.postId, { hidden: 0 });
      }
    }
  }

  /**
   * Upsert forum config (version-aware).
   */
  handleForumConfig(data) {
    const existing = Config.findOne({ id: data.id });

    if (existing) {
      // Version-aware
      if (data.version && existing.version && data.version <= existing.version) return;

      Config.update(data.id, {
        type: data.type,
        baseTheme: data.baseTheme || existing.baseTheme,
        overrides: typeof data.overrides === 'string' ? data.overrides : JSON.stringify(data.overrides || {}),
        version: data.version || (existing.version + 1),
        updatedAt: data.updatedAt || Date.now(),
      });
    } else {
      Config.create({
        id: data.id,
        type: data.type,
        baseTheme: data.baseTheme || null,
        overrides: typeof data.overrides === 'string' ? data.overrides : JSON.stringify(data.overrides || {}),
        authorId: data.authorId,
        version: data.version || 1,
        createdAt: data.createdAt || Date.now(),
        updatedAt: data.updatedAt || Date.now(),
      });
    }
  }

  // -----------------------------------------------------------------------
  // 5. getEntityHistory
  // -----------------------------------------------------------------------

  /**
   * Fetch all TXs from chain with matching tag+entityId.
   * Returns sorted by version descending (newest first).
   */
  async getEntityHistory(tag, entityId) {
    const records = await iota.getAllDataByTag(tag, entityId);

    const history = records.map(record => {
      let payload;
      try {
        payload = typeof record.payload === 'string'
          ? JSON.parse(record.payload)
          : record.payload;
      } catch {
        payload = record.payload;
      }

      return {
        digest: record.digest,
        version: record.version || payload?.version || 0,
        timestamp: record.timestamp,
        data: payload,
      };
    });

    // Sort by version descending
    history.sort((a, b) => (b.version || 0) - (a.version || 0));

    return history;
  }

  // -----------------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------------

  /**
   * Recalculate postCount and lastPostAt on a thread.
   */
  _updateThreadStats(threadId) {
    const thread = Thread.findOne({ id: threadId });
    if (!thread) return;

    const posts = Post.findAll({ threadId });
    const visiblePosts = posts.filter(p => !p.hidden);
    const postCount = visiblePosts.length;
    const lastPostAt = visiblePosts.reduce((max, p) => {
      const t = p.createdAt || 0;
      return t > max ? t : max;
    }, thread.createdAt || 0);

    Thread.update(threadId, { postCount, lastPostAt });
  }

  /**
   * Recalculate the score on a post from all votes.
   */
  _recalculatePostScore(postId) {
    const votes = Vote.findAll({ postId });
    const score = votes.reduce((sum, v) => sum + (v.vote || 0), 0);
    const post = Post.findOne({ id: postId });
    if (post) {
      Post.update(postId, { score });
    }
  }

  /**
   * Increment the appropriate counter in stats based on tag.
   */
  _incrementStat(stats, tag) {
    switch (tag) {
      case FORUM_USER: stats.users++; break;
      case FORUM_CATEGORY: stats.categories++; break;
      case FORUM_THREAD: stats.threads++; break;
      case FORUM_POST: stats.posts++; break;
      case FORUM_VOTE: stats.votes++; break;
      case FORUM_ROLE: stats.roles++; break;
      case FORUM_MODERATION: stats.moderations++; break;
      case FORUM_CONFIG: stats.configs++; break;
    }
  }
}

module.exports = new ForumManager();
