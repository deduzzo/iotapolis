/**
 * bootstrap.js — Startup logic for IOTA Free Forum
 *
 * 1. Initialize SQLite database
 * 2. Initialize IOTA wallet (generate mnemonic on first run)
 * 3. Start blockchain sync in background
 */

const db = require('../api/utility/db');

module.exports.bootstrap = async function (done) {
  // 1. Initialize SQLite cache
  try {
    db.initDb();
    sails.log.info('[bootstrap] SQLite database initialized');
  } catch (err) {
    sails.log.error('[bootstrap] Failed to initialize database:', err.message);
    return done(err);
  }

  // 2. Initialize IOTA wallet
  try {
    const iota = require('../api/utility/iota');
    const walletResult = await iota.getOrInitWallet();
    if (walletResult.init) {
      sails.log.info('[bootstrap] New IOTA wallet created:', walletResult.address);
    } else {
      sails.log.info('[bootstrap] IOTA wallet loaded:', walletResult.address);
    }
  } catch (err) {
    sails.log.warn('[bootstrap] IOTA wallet init failed (forum will work in offline mode):', err.message);
  }

  // 3. Start blockchain sync in background (non-blocking)
  try {
    const ForumManager = require('../api/utility/ForumManager');
    if (ForumManager && typeof ForumManager.syncFromChain === 'function') {
      // Run sync asynchronously — don't block startup
      ForumManager.syncFromChain().then(() => {
        sails.log.info('[bootstrap] Blockchain sync completed');
      }).catch((err) => {
        sails.log.warn('[bootstrap] Blockchain sync failed:', err.message);
      });
    }
  } catch (err) {
    sails.log.warn('[bootstrap] ForumManager not available yet, skipping sync');
  }

  done();
};
