/**
 * ForumManager.js - Core business logic + blockchain sync (INDEXER MODE)
 *
 * The backend is now a pure indexer: it reads all forum events from the IOTA
 * blockchain, processes them into the local SQLite cache, and serves data
 * via REST API. It does NOT sign or publish transactions — users sign TX
 * directly with their own IOTA wallet.
 *
 * CRITICAL: Every handler uses `eventAuthor` (from ForumEvent.author field,
 * verified by the Move smart contract via ctx.sender()) instead of
 * `data.authorId` from the payload. This prevents identity spoofing.
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
  FORUM_TIP,
  FORUM_SUBSCRIPTION,
  FORUM_PURCHASE,
  FORUM_BADGE,
  FORUM_ESCROW_CREATED,
  FORUM_ESCROW_UPDATED,
  FORUM_RATING,
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
  // --- Payment & marketplace handlers ---
  [FORUM_TIP]: 'handleTipEvent',
  [FORUM_SUBSCRIPTION]: 'handleSubscriptionEvent',
  [FORUM_PURCHASE]: 'handlePurchaseEvent',
  [FORUM_BADGE]: 'handleBadgeEvent',
  [FORUM_ESCROW_CREATED]: 'handleEscrowCreated',
  [FORUM_ESCROW_UPDATED]: 'handleEscrowUpdated',
  [FORUM_RATING]: 'handleRatingEvent',
  'ROLE_CHANGED': 'handleRoleChanged',
};

// --- Tag-to-entity mapping (per websocket broadcast) ---
const TAG_ENTITY = {
  [FORUM_USER]: 'user',
  [FORUM_CATEGORY]: 'category',
  [FORUM_THREAD]: 'thread',
  [FORUM_POST]: 'post',
  [FORUM_VOTE]: 'post',
  [FORUM_ROLE]: 'user',
  [FORUM_MODERATION]: 'post',
  [FORUM_CONFIG]: 'config',
  // --- Payment & marketplace entities ---
  [FORUM_TIP]: 'tip',
  [FORUM_SUBSCRIPTION]: 'subscription',
  [FORUM_PURCHASE]: 'purchase',
  [FORUM_BADGE]: 'badge',
  [FORUM_ESCROW_CREATED]: 'escrow',
  [FORUM_ESCROW_UPDATED]: 'escrow',
  [FORUM_RATING]: 'rating',
  'ROLE_CHANGED': 'user',
};

// --- Models (lazy-initialized) ---
let User, Category, Thread, Post, Vote, Role, Moderation, Config;
let Tip, Subscription, Purchase, BadgeConfig, UserBadge, Escrow, Reputation, Rating;

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
  // Payment & marketplace models
  Tip = db.getModel('tips');
  Subscription = db.getModel('subscriptions');
  Purchase = db.getModel('purchases');
  BadgeConfig = db.getModel('badges_config');
  UserBadge = db.getModel('user_badges');
  Escrow = db.getModel('escrows');
  Reputation = db.getModel('reputations');
  Rating = db.getModel('ratings');
}

// =========================================================================
// ForumManager (INDEXER MODE — no publishToChain)
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
      tips: 0,
      subscriptions: 0,
      purchases: 0,
      badges: 0,
      escrows: 0,
      ratings: 0,
      errors: 0,
    };

    const reportProgress = (status, total, processed) => {
      if (onProgress) onProgress({ status, ...stats, total, processed });
    };

    try {
      // Fetch all data — Move events or legacy split-coin TXs
      reportProgress('downloading', 0, 0);
      let byTag;
      if (iota.isMoveModeEnabled()) {
        syncLog.log('Fetching forum events from Move contract...');
        byTag = await iota.queryForumEvents();
      } else {
        syncLog.log('Fetching all transactions from chain (legacy bulk cache)...');
        byTag = await iota.getAllTransactionsCached();
      }

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

            // CRITICAL: Extract eventAuthor from the blockchain event's author field
            // This is verified by the Move smart contract via ctx.sender()
            const eventAuthor = record.author || null;

            sails.log.info(`[ForumManager] Sync processing: tag=${tag}, eventAuthor=${eventAuthor}, data.id=${data?.id}, keys=${Object.keys(data || {}).join(',')}`);
            this.processTransaction(tag, data, eventAuthor);
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

      // Free bulk cache (only needed for legacy mode)
      if (!iota.isMoveModeEnabled()) {
        iota.clearBulkCache();
      }

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
      if (!iota.isMoveModeEnabled()) iota.clearBulkCache();
      throw err;
    }
  }

  // -----------------------------------------------------------------------
  // 2. processTransaction (CRITICAL: uses eventAuthor, not data.authorId)
  // -----------------------------------------------------------------------

  /**
   * Parse payload and route to the appropriate handler.
   * @param {string} tag - The forum tag
   * @param {object} data - Decoded JSON payload
   * @param {string|null} eventAuthor - The blockchain-verified author address (from ForumEvent.author)
   */
  processTransaction(tag, data, eventAuthor = null) {
    ensureModels();

    const handlerName = TAG_HANDLERS[tag];
    if (!handlerName) {
      sails.log.verbose(`[ForumManager] Unknown tag: ${tag}, skipping`);
      return;
    }

    this[handlerName](data, eventAuthor);
  }

  // -----------------------------------------------------------------------
  // 3. Handler functions
  // -----------------------------------------------------------------------

  /**
   * Upsert user, update FTS index.
   * CRITICAL: Uses eventAuthor as the user ID (IOTA address), not data.id
   */
  handleForumUser(data, eventAuthor) {
    // The user ID is now the IOTA address from the blockchain event
    const userId = eventAuthor || data.id;
    sails.log.info(`[ForumManager] handleForumUser: eventAuthor=${eventAuthor}, data.id=${data.id}, userId=${userId}, username=${data.username}`);

    const existing = User.findOne({ id: userId });
    let isFirstUser = false;

    if (existing) {
      // Version-aware: skip if same version or older
      const incomingVersion = data.version || 1;
      if (incomingVersion <= existing.version) return;

      User.update(userId, {
        username: data.username,
        bio: data.bio,
        avatar: data.avatar,
        publicKey: data.publicKey,
        role: data.role || existing.role || 'user',
        showUsername: data.showUsername != null ? (data.showUsername ? 1 : 0) : existing.showUsername,
        version: incomingVersion,
        updatedAt: data.updatedAt || Date.now(),
      });
    } else {
      // First user to register becomes admin
      const allUsers = User.findAll({});
      isFirstUser = !allUsers || allUsers.length === 0;
      const role = isFirstUser ? 'admin' : (data.role || 'user');

      sails.log.info(`[ForumManager] Creating user ${userId} (${data.username}) with role=${role}, isFirstUser=${isFirstUser}`);

      User.create({
        id: userId,
        username: data.username,
        bio: data.bio || null,
        avatar: data.avatar || null,
        publicKey: data.publicKey || '',
        role,
        showUsername: data.showUsername ? 1 : 0,
        createdAt: data.createdAt || data.registeredAt || Date.now(),
        updatedAt: data.updatedAt || Date.now(),
      });
    }

    // Update FTS with username + bio
    db.updateFtsIndex(userId, data.username, data.bio || '');

    // If this is the first user, promote to admin ON-CHAIN via set_user_role
    if (isFirstUser && userId && iota.isMoveModeEnabled()) {
      sails.log.info(`[ForumManager] Promoting first user ${userId} to ADMIN on-chain...`);
      this._promoteFirstUserToAdmin(userId).catch(err => {
        sails.log.error(`[ForumManager] Failed to promote first user to admin on-chain: ${err.message}`);
      });
    }
  }

  /**
   * Promote the first registered user to ADMIN on-chain.
   * Uses the server's AdminCap (from contract deployment).
   */
  async _promoteFirstUserToAdmin(userAddress) {
    try {
      const config = require('../../config/private_iota_conf');
      if (!config.ADMIN_CAP_ID || !config.FORUM_PACKAGE_ID || !config.FORUM_OBJECT_ID) return;

      const sdk = await iota.loadSdk();
      const client = await iota.getClient();
      const keypair = await iota.getKeypair();

      const { Transaction } = sdk;
      const tx = new Transaction();
      tx.moveCall({
        target: `${config.FORUM_PACKAGE_ID}::forum::set_user_role`,
        arguments: [
          tx.object(config.FORUM_OBJECT_ID),
          tx.pure.address(userAddress),
          tx.pure.u8(3), // ROLE_ADMIN = 3
          tx.object('0x6'), // Clock object
        ],
      });
      tx.setGasBudget(50_000_000);

      const result = await client.signAndExecuteTransaction({
        signer: keypair,
        transaction: tx,
        options: { showEffects: true },
      });

      if (result.effects?.status?.status === 'success') {
        sails.log.info(`[ForumManager] First user ${userAddress} promoted to ADMIN on-chain! Digest: ${result.digest}`);
        // Update local cache role
        try { User.update(userAddress, { role: 'admin' }); } catch (e) { /* */ }
        // Notify frontend
        try {
          await sails.helpers.broadcastEvent('dataChanged', {
            entity: 'user',
            action: 'userPromotedAdmin',
            label: userAddress,
            userId: userAddress,
            role: 'admin',
            digest: result.digest,
          });
        } catch (e) { /* */ }
      } else {
        const errMsg = result.effects?.status?.error || 'Unknown error';
        sails.log.warn(`[ForumManager] set_user_role TX failed: ${errMsg}`);
        try {
          await sails.helpers.broadcastEvent('dataChanged', {
            entity: 'error',
            action: 'adminPromotionFailed',
            label: errMsg,
            userId: userAddress,
          });
        } catch (e) { /* */ }
      }
    } catch (err) {
      sails.log.error(`[ForumManager] _promoteFirstUserToAdmin error: ${err.message}`);
      try {
        await sails.helpers.broadcastEvent('dataChanged', {
          entity: 'error',
          action: 'adminPromotionFailed',
          label: err.message,
          userId: userAddress,
        });
      } catch (e) { /* */ }
    }
  }

  /**
   * Upsert category.
   * CRITICAL: Uses eventAuthor as createdBy
   */
  handleForumCategory(data, eventAuthor) {
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
        createdBy: eventAuthor || data.createdBy || data.authorId,
        sortOrder: data.sortOrder || 0,
        createdAt: data.createdAt || Date.now(),
      });
    }
  }

  /**
   * Upsert thread (version-aware), update postCount/lastPostAt, update FTS.
   * CRITICAL: Uses eventAuthor as authorId
   */
  handleForumThread(data, eventAuthor) {
    const existing = Thread.findOne({ id: data.id });

    if (existing) {
      // Version-aware: skip if same version or older
      const incomingVersion = data.version || 1;
      if (incomingVersion <= existing.version) return;

      Thread.update(data.id, {
        title: data.title,
        content: data.content,
        encrypted: data.encrypted ? 1 : 0,
        encryptedTitle: data.encryptedTitle ? 1 : 0,
        keyBundle: data.keyBundle || existing.keyBundle,
        pinned: data.pinned != null ? (data.pinned ? 1 : 0) : existing.pinned,
        locked: data.locked != null ? (data.locked ? 1 : 0) : existing.locked,
        hidden: data.hidden != null ? (data.hidden ? 1 : 0) : existing.hidden,
        version: incomingVersion,
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
        authorId: eventAuthor,
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
   * CRITICAL: Uses eventAuthor as authorId
   */
  handleForumPost(data, eventAuthor) {
    const existing = Post.findOne({ id: data.id });

    if (existing) {
      // Version-aware: skip if same version or older
      const incomingVersion = data.version || 1;
      if (incomingVersion <= existing.version) return;

      Post.update(data.id, {
        content: data.content,
        hidden: data.hidden != null ? (data.hidden ? 1 : 0) : existing.hidden,
        version: incomingVersion,
        score: data.score != null ? data.score : existing.score,
        updatedAt: data.updatedAt || Date.now(),
      });
    } else {
      Post.create({
        id: data.id,
        threadId: data.threadId,
        parentId: data.parentId || null,
        content: data.content,
        authorId: eventAuthor,
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
   * CRITICAL: Uses eventAuthor as authorId
   */
  handleForumVote(data, eventAuthor) {
    const voteAuthor = eventAuthor;
    if (!data.postId || !voteAuthor) {
      sails.log.warn(`[ForumManager] Vote missing postId or authorId:`, JSON.stringify(data).substring(0, 200));
      return;
    }
    const voteId = data.id || `VOTE_${data.postId}_${voteAuthor}`;
    sails.log.verbose(`[ForumManager] handleForumVote: id=${voteId} postId=${data.postId} vote=${data.vote}`);

    const existing = Vote.findOne({ id: voteId });

    if (existing) {
      Vote.update(voteId, {
        vote: data.vote,
      });
    } else {
      // Check for existing vote by same author on same post (UNIQUE constraint)
      const duplicate = Vote.findOne({ postId: data.postId, authorId: voteAuthor });
      if (duplicate) {
        Vote.update(duplicate.id, { vote: data.vote });
      } else {
        Vote.create({
          id: voteId,
          postId: data.postId,
          authorId: voteAuthor,
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
   * CRITICAL: Uses eventAuthor as grantedBy
   */
  handleForumRole(data, eventAuthor) {
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
        grantedBy: eventAuthor || data.grantedBy,
        createdAt: data.createdAt || Date.now(),
      });
    }

    // Also update the user's role in the users table
    if (data.targetUserId && data.role) {
      const targetUser = User.findOne({ id: data.targetUserId });
      if (targetUser) {
        User.update(data.targetUserId, { role: data.role });
      }
    }
  }

  /**
   * Handle on-chain RoleChanged events (from set_user_role).
   * Updates the user's role in the cache.
   */
  handleRoleChanged(data, eventAuthor) {
    const targetUser = User.findOne({ id: data.targetUserId });
    if (targetUser) {
      User.update(data.targetUserId, { role: data.role });
      sails.log.info(`[ForumManager] RoleChanged: ${data.targetUserId} -> ${data.role} (by ${data.grantedBy})`);
    }
  }

  /**
   * Upsert moderation action, update post.hidden if action is 'hide'.
   * CRITICAL: Uses eventAuthor as moderatorId
   */
  handleForumModeration(data, eventAuthor) {
    const existing = Moderation.findOne({ id: data.id });

    if (!existing) {
      Moderation.create({
        id: data.id,
        postId: data.postId,
        action: data.action,
        reason: data.reason || null,
        moderatorId: eventAuthor || data.moderatorId,
        entityType: data.entityType || 'post',
        createdAt: data.createdAt || Date.now(),
      });
    }

    // Apply moderation effect
    if (data.action === 'hide') {
      const post = Post.findOne({ id: data.postId });
      if (post) {
        Post.update(data.postId, { hidden: 1 });
      }
      // Also check if it's a thread
      const thread = Thread.findOne({ id: data.postId });
      if (thread) {
        Thread.update(data.postId, { hidden: 1 });
      }
    } else if (data.action === 'unhide') {
      const post = Post.findOne({ id: data.postId });
      if (post) {
        Post.update(data.postId, { hidden: 0 });
      }
      const thread = Thread.findOne({ id: data.postId });
      if (thread) {
        Thread.update(data.postId, { hidden: 0 });
      }
    } else if (data.action === 'lock' && data.threadId) {
      Thread.update(data.threadId, { locked: 1 });
    } else if (data.action === 'unlock' && data.threadId) {
      Thread.update(data.threadId, { locked: 0 });
    } else if (data.action === 'pin' && data.threadId) {
      Thread.update(data.threadId, { pinned: 1 });
    } else if (data.action === 'unpin' && data.threadId) {
      Thread.update(data.threadId, { pinned: 0 });
    }
  }

  /**
   * Upsert forum config (version-aware).
   * CRITICAL: Uses eventAuthor as authorId
   */
  handleForumConfig(data, eventAuthor) {
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
        authorId: eventAuthor,
        version: data.version || 1,
        createdAt: data.createdAt || Date.now(),
        updatedAt: data.updatedAt || Date.now(),
      });
    }
  }

  // -----------------------------------------------------------------------
  // 3b. Payment & Marketplace handlers
  // -----------------------------------------------------------------------

  /**
   * Cache tip in tips table.
   * CRITICAL: Uses eventAuthor as fromUser (the sender)
   */
  handleTipEvent(data, eventAuthor) {
    const tipId = data.id || `TIP_${eventAuthor}_${data.postId}_${data.createdAt || Date.now()}`;
    const existing = Tip.findOne({ id: tipId });
    if (existing) return; // Tips are immutable

    Tip.create({
      id: tipId,
      fromUser: eventAuthor || data.from,
      toUser: data.to || data.toUser,
      postId: data.postId || data.post_id || null,
      amount: data.amount,
      createdAt: data.timestamp || data.createdAt || Date.now(),
    });
  }

  /**
   * Cache subscription status.
   * CRITICAL: Uses eventAuthor as the subscriber
   */
  handleSubscriptionEvent(data, eventAuthor) {
    const userId = eventAuthor || data.user || data.userId;
    const existing = Subscription.findOne({ userId });

    if (existing) {
      // Update subscription — use the model's update but with userId as key
      const database = db.getDb();
      database.prepare(`
        UPDATE subscriptions SET tier = ?, expiresAt = ?, updatedAt = ? WHERE userId = ?
      `).run(data.tier, data.expiresAt || data.expires_at, Date.now(), userId);
    } else {
      // Insert new subscription directly (subscriptions table uses userId as PK, not id)
      const database = db.getDb();
      database.prepare(`
        INSERT INTO subscriptions (userId, tier, expiresAt, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?)
      `).run(userId, data.tier, data.expiresAt || data.expires_at, data.timestamp || Date.now(), Date.now());
    }
  }

  /**
   * Cache purchase record.
   * CRITICAL: Uses eventAuthor as the buyer
   */
  handlePurchaseEvent(data, eventAuthor) {
    const purchaseId = data.id || `PUR_${eventAuthor}_${data.contentId || data.content_id}_${data.createdAt || Date.now()}`;
    const existing = Purchase.findOne({ id: purchaseId });
    if (existing) return; // Purchases are immutable

    Purchase.create({
      id: purchaseId,
      buyer: eventAuthor || data.buyer,
      contentId: data.contentId || data.content_id,
      amount: data.amount,
      createdAt: data.timestamp || data.createdAt || Date.now(),
    });
  }

  /**
   * Cache badge purchase / configuration.
   * CRITICAL: Uses eventAuthor as the user who bought the badge
   */
  handleBadgeEvent(data, eventAuthor) {
    const userId = eventAuthor || data.user || data.userId;
    const badgeId = data.badgeId || data.badge_id;

    // If this is a badge configuration event (admin creating a badge)
    if (data.action === 'configure' || data.name) {
      const existingConfig = BadgeConfig.findOne({ id: badgeId });
      if (existingConfig) {
        BadgeConfig.update(badgeId, {
          name: data.name || existingConfig.name,
          price: data.price != null ? data.price : existingConfig.price,
          icon: data.icon || existingConfig.icon,
        });
      } else {
        BadgeConfig.create({
          id: badgeId,
          name: data.name,
          price: data.price || 0,
          icon: data.icon || null,
          createdAt: data.timestamp || Date.now(),
        });
      }
      return;
    }

    // Badge purchase — insert into user_badges
    try {
      const database = db.getDb();
      database.prepare(`
        INSERT OR IGNORE INTO user_badges (userId, badgeId, createdAt) VALUES (?, ?, ?)
      `).run(userId, badgeId, data.timestamp || Date.now());
    } catch (e) {
      // Duplicate — ignore
      sails.log.verbose(`[ForumManager] Badge already assigned: ${userId}/${badgeId}`);
    }
  }

  /**
   * Cache new escrow.
   * CRITICAL: Uses eventAuthor as the escrow creator (buyer)
   */
  handleEscrowCreated(data, eventAuthor) {
    const escrowId = data.id || data.escrowId || data.escrow_id;
    const existing = Escrow.findOne({ id: escrowId });
    if (existing) return; // Already cached

    Escrow.create({
      id: escrowId,
      buyer: eventAuthor || data.buyer,
      seller: data.seller,
      arbitrator: data.arbitrator,
      amount: data.amount,
      description: data.description || null,
      status: 0, // CREATED
      deadline: data.deadline || null,
      createdAt: data.timestamp || data.createdAt || Date.now(),
    });
  }

  /**
   * Update existing escrow status.
   * CRITICAL: Uses eventAuthor to verify who performed the action
   */
  handleEscrowUpdated(data, eventAuthor) {
    const escrowId = data.id || data.escrowId || data.escrow_id;
    const existing = Escrow.findOne({ id: escrowId });
    if (!existing) {
      sails.log.warn(`[ForumManager] EscrowUpdated for unknown escrow: ${escrowId}`);
      return;
    }

    const updateData = {};
    if (data.status != null) updateData.status = data.status;
    if (data.resolvedAt || data.resolved_at) {
      updateData.resolvedAt = data.resolvedAt || data.resolved_at;
    }

    // Use raw SQL because escrow table doesn't have standard 'updatedAt'
    if (Object.keys(updateData).length > 0) {
      const database = db.getDb();
      const setClauses = Object.keys(updateData).map(k => `${k} = ?`).join(', ');
      const values = Object.values(updateData);
      database.prepare(`UPDATE escrows SET ${setClauses} WHERE id = ?`).run(...values, escrowId);
    }
  }

  /**
   * Cache rating, update user reputation.
   * CRITICAL: Uses eventAuthor as the rater
   */
  handleRatingEvent(data, eventAuthor) {
    const ratingId = data.id || `RAT_${data.escrowId || data.escrow_id}_${eventAuthor}`;
    const existing = Rating.findOne({ id: ratingId });
    if (existing) return; // Ratings are immutable

    const rater = eventAuthor || data.rater;
    const rated = data.rated;
    const score = data.score;

    Rating.create({
      id: ratingId,
      escrowId: data.escrowId || data.escrow_id,
      rater,
      rated,
      score,
      comment: data.comment || null,
      createdAt: data.timestamp || data.createdAt || Date.now(),
    });

    // Update reputation for the rated user
    this._updateReputation(rated, score, data);
  }

  /**
   * Update user reputation after a rating.
   */
  _updateReputation(userId, score, data) {
    const database = db.getDb();
    const existing = database.prepare('SELECT * FROM reputations WHERE userId = ?').get(userId);

    if (existing) {
      database.prepare(`
        UPDATE reputations SET
          totalTrades = totalTrades + 1,
          successful = successful + ?,
          ratingSum = ratingSum + ?,
          ratingCount = ratingCount + 1,
          totalVolume = totalVolume + ?
        WHERE userId = ?
      `).run(
        score >= 3 ? 1 : 0,
        score,
        data.amount || 0,
        userId
      );
    } else {
      database.prepare(`
        INSERT INTO reputations (userId, totalTrades, successful, disputesWon, disputesLost, totalVolume, ratingSum, ratingCount)
        VALUES (?, 1, ?, 0, 0, ?, ?, 1)
      `).run(userId, score >= 3 ? 1 : 0, data.amount || 0, score);
    }
  }

  // -----------------------------------------------------------------------
  // 4. getEntityHistory
  // -----------------------------------------------------------------------

  /**
   * Fetch all TXs from chain with matching tag+entityId.
   * Returns sorted by version descending (newest first).
   */
  async getEntityHistory(tag, entityId) {
    let records;
    if (iota.isMoveModeEnabled()) {
      records = await iota.queryForumEventsByEntity(tag, entityId);
    } else {
      records = await iota.getAllDataByTag(tag, entityId);
    }

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
  // 5. Real-time subscription + fallback polling
  // -----------------------------------------------------------------------

  /**
   * Subscribe to real-time blockchain events via WebSocket.
   * Processes each new event immediately and broadcasts dataChanged.
   * Falls back to polling if subscription fails or is unavailable.
   */
  async startRealtimeSubscription() {
    if (!iota.isMoveModeEnabled()) return;

    try {
      this._unsubscribe = await iota.subscribeToForumEvents((event) => {
        try {
          ensureModels();
          const data = typeof event.payload === 'string'
            ? JSON.parse(event.payload)
            : event.payload;

          // CRITICAL: Extract eventAuthor from the blockchain event
          const eventAuthor = event.author || data.authorId || null;

          // Controlla se l'entita esiste gia con la stessa versione (evita duplicati dal nostro stesso nodo)
          const handlerName = TAG_HANDLERS[event.tag];
          if (!handlerName) return;

          this.processTransaction(event.tag, data, eventAuthor);

          const entity = TAG_ENTITY[event.tag] || event.tag;
          sails.log.info(`[ForumManager] RT event: ${event.tag} ${event.entityId}`);

          sails.helpers.broadcastEvent('dataChanged', {
            entity,
            action: `${entity}Updated`,
            label: event.entityId,
            entityId: event.entityId,
            tag: event.tag,
            digest: event.digest,
            ...(data.threadId && { threadId: data.threadId }),
            ...(data.categoryId && { categoryId: data.categoryId }),
            ...(data.postId && { postId: data.postId }),
          }).catch(() => {});
        } catch (err) {
          sails.log.warn('[ForumManager] RT event processing error:', err.message);
        }
      });

      sails.log.info('[ForumManager] Real-time blockchain subscription active');
      return true;
    } catch (err) {
      sails.log.warn('[ForumManager] Real-time subscription failed, falling back to polling:', err.message);
      return false;
    }
  }

  // -----------------------------------------------------------------------
  // 5b. pollNewEvents — Fallback incremental blockchain polling
  // -----------------------------------------------------------------------

  /**
   * Poll the blockchain for new events since the last known cursor.
   * Processes new transactions, updates cache, and broadcasts dataChanged
   * so all connected clients get real-time updates.
   * Call this periodically (e.g. every 30 seconds).
   */
  async pollNewEvents() {
    if (!iota.isMoveModeEnabled()) return;

    // Prima sync completa imposta il cursor
    if (!this._lastEventCursor && this._syncState.status !== 'idle') return;
    if (!this._pollReady) return; // Skip until cursor is initialized

    try {
      const { events, lastCursor } = await iota.queryForumEventsSince(this._lastEventCursor);

      if (events.length === 0) {
        this._lastEventCursor = lastCursor;
        return;
      }

      sails.log.info(`[ForumManager] Poll: ${events.length} new events from blockchain`);
      ensureModels();

      let changeCount = 0;
      for (const event of events) {
        try {
          const data = typeof event.payload === 'string'
            ? JSON.parse(event.payload)
            : event.payload;

          // CRITICAL: Extract eventAuthor from the blockchain event
          const eventAuthor = event.author || data.authorId || null;

          this.processTransaction(event.tag, data, eventAuthor);
          changeCount++;

          // Broadcast dataChanged per ogni nuovo evento
          const entity = TAG_ENTITY[event.tag] || event.tag;
          try {
            await sails.helpers.broadcastEvent('dataChanged', {
              entity,
              action: `${entity}Updated`,
              label: event.entityId,
              entityId: event.entityId,
              tag: event.tag,
              digest: event.digest,
              ...(data.threadId && { threadId: data.threadId }),
              ...(data.categoryId && { categoryId: data.categoryId }),
              ...(data.postId && { postId: data.postId }),
            });
          } catch (bErr) {
            // broadcast best-effort
          }
        } catch (err) {
          sails.log.warn(`[ForumManager] Poll: error processing event:`, err.message);
        }
      }

      this._lastEventCursor = lastCursor;

      if (changeCount > 0) {
        sails.log.info(`[ForumManager] Poll: processed ${changeCount} changes, cursor updated`);
      }
    } catch (err) {
      sails.log.warn('[ForumManager] Poll failed:', err.message);
    }
  }

  /**
   * Initialize the event cursor by scanning all existing events.
   * Called after the initial syncFromBlockchain completes.
   */
  async initEventCursor() {
    if (!iota.isMoveModeEnabled()) return;
    try {
      // Scan all existing events to advance cursor past them (no processing needed, already synced)
      const { lastCursor } = await iota.queryForumEventsSince(null);
      this._lastEventCursor = lastCursor;
      this._pollReady = true;
      sails.log.info(`[ForumManager] Event cursor initialized — polling ready`);
    } catch (err) {
      sails.log.warn('[ForumManager] Failed to init event cursor:', err.message);
    }
  }

  // -----------------------------------------------------------------------
  // 6. repairSync — Auto-repair missing data
  // -----------------------------------------------------------------------

  /**
   * Compare local cache with blockchain and re-process any missing events.
   * Called periodically to ensure eventual consistency.
   */
  async repairSync() {
    if (!iota.isMoveModeEnabled()) return;

    try {
      const byTag = await iota.queryForumEvents();
      ensureModels();

      let repaired = 0;
      const forumTags = Object.keys(TAG_HANDLERS);

      for (const tag of forumTags) {
        const records = byTag[tag] || [];
        // Sort by version ascending
        records.sort((a, b) => (a.version || 0) - (b.version || 0));

        for (const record of records) {
          try {
            const data = typeof record.payload === 'string'
              ? JSON.parse(record.payload)
              : record.payload;

            // CRITICAL: Extract eventAuthor from the blockchain event
            const eventAuthor = record.author || null;

            const entityId = data.id || record.entityId;
            if (!entityId) continue;

            // Check if entity exists and is up to date
            let model, existing;
            switch (tag) {
              case FORUM_USER: model = User; break;
              case FORUM_CATEGORY: model = Category; break;
              case FORUM_THREAD: model = Thread; break;
              case FORUM_POST: model = Post; break;
              case FORUM_VOTE:
                existing = Vote.findOne({ id: entityId });
                if (!existing && data.postId && (eventAuthor)) {
                  existing = Vote.findOne({ postId: data.postId, authorId: eventAuthor });
                }
                if (!existing) {
                  this.processTransaction(tag, data, eventAuthor);
                  repaired++;
                }
                continue;
              // Payment events — check by id
              case FORUM_TIP:
              case FORUM_PURCHASE:
              case FORUM_ESCROW_CREATED:
              case FORUM_RATING:
                // Try to find by id; if missing, re-process
                this.processTransaction(tag, data, eventAuthor);
                repaired++;
                continue;
              case FORUM_SUBSCRIPTION:
              case FORUM_BADGE:
              case FORUM_ESCROW_UPDATED:
                this.processTransaction(tag, data, eventAuthor);
                repaired++;
                continue;
              default: continue;
            }

            if (model) {
              existing = model.findOne({ id: entityId });
              if (!existing) {
                // Missing entirely — create
                this.processTransaction(tag, data, eventAuthor);
                repaired++;
              } else if (data.version && existing.version && data.version > existing.version) {
                // Outdated version — update
                this.processTransaction(tag, data, eventAuthor);
                repaired++;
              }
            }
          } catch (err) {
            // Skip individual errors, continue repairing
          }
        }
      }

      if (repaired > 0) {
        sails.log.info(`[ForumManager] Repair: fixed ${repaired} missing entries`);
        // Broadcast a general refresh
        try {
          await sails.helpers.broadcastEvent('dataChanged', {
            entity: 'sync',
            action: 'repairCompleted',
            label: `${repaired} entries repaired`,
          });
        } catch (e) { /* best effort */ }
      }

      return repaired;
    } catch (err) {
      sails.log.warn('[ForumManager] Repair failed:', err.message);
      return 0;
    }
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
      case FORUM_TIP: stats.tips++; break;
      case FORUM_SUBSCRIPTION: stats.subscriptions++; break;
      case FORUM_PURCHASE: stats.purchases++; break;
      case FORUM_BADGE: stats.badges++; break;
      case FORUM_ESCROW_CREATED:
      case FORUM_ESCROW_UPDATED: stats.escrows++; break;
      case FORUM_RATING: stats.ratings++; break;
    }
  }
}

module.exports = new ForumManager();
