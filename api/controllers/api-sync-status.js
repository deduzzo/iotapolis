module.exports = {
  friendlyName: 'API Sync Status',
  description: 'Return the current blockchain sync state.',

  inputs: {},

  exits: {
    success: { statusCode: 200 },
  },

  fn: async function () {
    try {
      let syncState = { status: 'unknown', lastSync: null };

      try {
        const ForumManager = require('../utility/ForumManager');
        if (ForumManager && typeof ForumManager.getSyncState === 'function') {
          syncState = ForumManager.getSyncState();
        }
      } catch (e) {
        syncState = { status: 'unavailable', error: e.message };
      }

      // IOTA wallet status
      let walletStatus = null;
      try {
        const iota = require('../utility/iota');
        walletStatus = await iota.getStatusAndBalance();
      } catch (e) {
        walletStatus = { status: 'error', error: e.message };
      }

      return {
        success: true,
        sync: syncState,
        wallet: walletStatus,
        pendingTx: require('../utility/iota').getPendingTxCount(),
      };
    } catch (err) {
      sails.log.error('[api-sync-status]', err.message || err);
      this.res.status(500);
      return { success: false, error: err.message || String(err) };
    }
  },
};
