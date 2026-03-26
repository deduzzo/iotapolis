/**
 * bootstrap.js — Startup logic for IOTA Free Forum
 *
 * 1. Initialize SQLite database
 * 2. Initialize IOTA wallet (generate mnemonic on first run)
 * 3. Start blockchain sync in background
 */

const db = require('../api/utility/db');

module.exports.bootstrap = async function (done) {
  const log = sails.log || console;

  console.log('[bootstrap] Starting IOTA Free Forum bootstrap...');

  // 1. Initialize SQLite cache
  try {
    db.initDb();
    console.log('[bootstrap] Step 1/3: SQLite database initialized');
    log.info('[bootstrap] SQLite database initialized');
  } catch (err) {
    console.log('[bootstrap] FATAL: Failed to initialize database:', err.message);
    log.error('[bootstrap] Failed to initialize database:', err.message);
    return done(err);
  }

  // 2. Initialize IOTA wallet (best-effort)
  try {
    const iota = require('../api/utility/iota');
    if (typeof iota.getOrInitWallet === 'function') {
      const walletResult = await iota.getOrInitWallet();
      console.log('[bootstrap] Step 2/3: IOTA wallet initialized. Address:', walletResult.address || 'N/A');
      log.info('[bootstrap] IOTA wallet:', walletResult.address || 'initialized');
    } else {
      console.log('[bootstrap] Step 2/3: IOTA wallet init skipped (getOrInitWallet not available)');
    }
  } catch (err) {
    console.log('[bootstrap] Step 2/3: IOTA wallet init skipped:', err.message);
    log.warn('[bootstrap] IOTA wallet init skipped:', err.message);
  }

  // 3. Start blockchain sync in background (non-blocking)
  try {
    const ForumManager = require('../api/utility/ForumManager');
    console.log('[bootstrap] Step 3/3: Starting blockchain sync in background...');
    console.log('[bootstrap] ForumManager type:', typeof ForumManager, 'syncFromBlockchain:', typeof ForumManager.syncFromBlockchain);
    if (typeof ForumManager.syncFromBlockchain === 'function') {
      ForumManager.syncFromBlockchain().then(() => {
        console.log('[bootstrap] Blockchain sync completed successfully');
        log.info('[bootstrap] Blockchain sync completed');
      }).catch((err) => {
        console.log('[bootstrap] Blockchain sync failed:', err.message);
        log.warn('[bootstrap] Blockchain sync failed:', err.message);
      });
    } else {
      console.log('[bootstrap] ForumManager.syncFromBlockchain is not a function, skipping');
    }
  } catch (err) {
    console.log('[bootstrap] ForumManager not available, skipping sync:', err.message);
    log.warn('[bootstrap] ForumManager not available, skipping sync');
  }

  console.log('[bootstrap] Bootstrap complete. Sails is lifting...');
  done();
};
