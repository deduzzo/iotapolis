const db = require('../utility/db');

module.exports = {
  friendlyName: 'API Sync Reset',
  description: 'Drop and recreate the cache database, then resync from blockchain.',

  inputs: {},

  exits: {
    success: { statusCode: 200 },
  },

  fn: async function () {
    try {
      // Drop all tables and recreate schema
      const database = db.getDb();
      database.exec(`
        DELETE FROM users;
        DELETE FROM categories;
        DELETE FROM threads;
        DELETE FROM posts;
        DELETE FROM votes;
        DELETE FROM roles;
        DELETE FROM moderations;
        DELETE FROM config;
        DELETE FROM seen_nonces;
        INSERT INTO search_index(search_index) VALUES('delete-all');
      `);

      sails.log.info('[sync-reset] Cache cleared');

      // Start resync in background
      try {
        const ForumManager = require('../utility/ForumManager');
        if (ForumManager && typeof ForumManager.syncFromChain === 'function') {
          ForumManager.syncFromChain().then(() => {
            sails.log.info('[sync-reset] Resync completed');
          }).catch((err) => {
            sails.log.warn('[sync-reset] Resync failed:', err.message);
          });
        }
      } catch (e) {
        sails.log.warn('[sync-reset] ForumManager not available for resync');
      }

      // Broadcast
      await sails.helpers.broadcastEvent('dataChanged', {
        action: 'syncReset',
        label: 'Cache cleared and resync started',
      });

      return {
        success: true,
        message: 'Cache cleared. Resync started in background.',
      };
    } catch (err) {
      sails.log.error('[api-sync-reset]', err.message || err);
      this.res.status(500);
      return { success: false, error: err.message || String(err) };
    }
  },
};
