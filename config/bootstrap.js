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

      // Wait for gas coins to be available before proceeding
      if (walletResult.init) {
        console.log('[bootstrap] New wallet — waiting for faucet funds...');
        const funds = await iota.waitForFunds(30000);
        if (funds.ready) {
          console.log(`[bootstrap] Wallet funded: ${funds.coins} coins, ${funds.balance} nanos`);
        } else {
          console.log('[bootstrap] WARNING: Wallet not funded yet. TX will fail until funds arrive.');
        }
      } else {
        // Existing wallet — quick check
        const funds = await iota.waitForFunds(5000);
        if (!funds.ready) {
          console.log('[bootstrap] WARNING: No gas coins available. Requesting faucet...');
        }
      }
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

  // 4. Start retry queue processor (every 30 seconds)
  try {
    const ForumManager = require('../api/utility/ForumManager');
    if (typeof ForumManager.processRetryQueue === 'function') {
      setInterval(() => {
        ForumManager.processRetryQueue().catch(err => {
          console.log('[bootstrap] Retry queue processing error:', err.message);
        });
      }, 30000);
      console.log('[bootstrap] TX retry queue processor started (every 30s)');
    }
  } catch (err) {
    console.log('[bootstrap] Retry queue processor not started:', err.message);
  }

  // 5. Auto-refill faucet on testnet/devnet when balance is low
  try {
    const iota = require('../api/utility/iota');
    const config = require('./private_iota_conf');
    const network = config.IOTA_NETWORK || 'testnet';

    if (network === 'testnet' || network === 'devnet') {
      // Check balance every 60 seconds, request faucet if low
      const MIN_BALANCE_NANOS = BigInt(1000000000); // 1 IOTA
      const checkAndRefill = async () => {
        try {
          const status = await iota.getStatusAndBalance();
          const balanceStr = status.balance || '0';
          // Extract nanos from "X.XXX nanos [Y IOTA]" format
          const nanosMatch = balanceStr.match(/^([\d.]+)\s*nanos/);
          const nanos = nanosMatch ? BigInt(nanosMatch[1].replace(/\./g, '')) : BigInt(0);

          if (nanos < MIN_BALANCE_NANOS) {
            console.log(`[faucet-monitor] Balance low: ${balanceStr}. Requesting faucet...`);
            await iota.requestFaucet();
            console.log('[faucet-monitor] Faucet funds requested');
          }
        } catch (e) {
          // Silently ignore — faucet may be rate-limited
        }
      };
      // Check on startup after 5s delay, then every 60s
      setTimeout(checkAndRefill, 5000);
      setInterval(checkAndRefill, 60000);
      console.log('[bootstrap] Faucet auto-refill monitor started (testnet/devnet, every 60s)');
    } else {
      console.log(`[bootstrap] Network: ${network} — faucet auto-refill disabled (mainnet)`);
      console.log('[bootstrap] WARNING: Ensure wallet has sufficient IOTA balance for transactions!');
    }
  } catch (err) {
    console.log('[bootstrap] Faucet monitor not started:', err.message);
  }

  console.log('[bootstrap] Bootstrap complete. Sails is lifting...');
  done();
};
