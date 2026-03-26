module.exports = {
  friendlyName: 'API Sync Status',
  description: 'Return the current blockchain sync state.',

  inputs: {},

  exits: {
    success: { statusCode: 200 },
  },

  fn: async function () {
    try {
      let syncState = { status: 'idle', lastSync: null };

      try {
        const ForumManager = require('../utility/ForumManager');
        if (ForumManager && typeof ForumManager.getSyncState === 'function') {
          syncState = ForumManager.getSyncState();
        }
      } catch (e) {
        console.log('[api-sync-status] ForumManager getSyncState not available:', e.message);
        syncState = { status: 'idle', lastSync: null };
      }

      // IOTA wallet status
      let walletStatus = null;
      try {
        const iota = require('../utility/iota');
        if (typeof iota.getStatusAndBalance === 'function') {
          walletStatus = await iota.getStatusAndBalance();
        } else {
          walletStatus = { status: 'unknown' };
        }
      } catch (e) {
        walletStatus = { status: 'error', error: e.message };
      }

      // Pending TX count (safe default)
      let pendingTx = 0;
      try {
        const iota = require('../utility/iota');
        if (typeof iota.getPendingTxCount === 'function') {
          pendingTx = iota.getPendingTxCount();
        }
      } catch (e) {
        console.log('[api-sync-status] getPendingTxCount error:', e.message);
      }

      // Retry queue status
      let retryQueue = { pending: 0, failed: 0 };
      try {
        const ForumManager = require('../utility/ForumManager');
        if (typeof ForumManager.getRetryQueueStatus === 'function') {
          retryQueue = ForumManager.getRetryQueueStatus();
        }
      } catch (e) { /* ignore */ }

      return {
        success: true,
        sync: syncState,
        wallet: walletStatus,
        pendingTx,
        retryQueue,
      };
    } catch (err) {
      sails.log.error('[api-sync-status]', err.message || err);
      this.res.status(500);
      return { success: false, error: err.message || String(err) };
    }
  },
};
