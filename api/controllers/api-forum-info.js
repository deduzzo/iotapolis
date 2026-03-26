/**
 * api-forum-info.js — Public info about this forum instance
 * Returns the wallet address and network so others can connect.
 */
module.exports = {
  friendlyName: 'Forum Info',
  description: 'Get public info about this forum instance (address, network, name).',

  inputs: {},
  exits: { success: { statusCode: 200 } },

  fn: async function () {
    try {
      const iota = require('../utility/iota');
      const db = require('../utility/db');

      let address = null;
      let network = null;
      let explorerUrl = null;

      try {
        address = await iota.getAddress();
        const config = require('../../config/private_iota_conf');
        network = config.IOTA_NETWORK || 'testnet';
        explorerUrl = config.IOTA_EXPLORER_URL || null;
      } catch (e) {
        console.log('[api-forum-info] Could not get wallet info:', e.message);
      }

      // Forum name from theme config
      let forumName = 'IOTA Free Forum';
      try {
        const Config = db.getModel('config');
        const themeConfig = Config.findOne({ id: 'CONFIG_theme' });
        if (themeConfig && themeConfig.overrides) {
          const overrides = JSON.parse(themeConfig.overrides);
          if (overrides.forumName) forumName = overrides.forumName;
        }
      } catch (e) { /* ignore */ }

      return {
        success: true,
        forumName,
        address,
        network,
        explorerUrl,
        version: '0.1.0',
        // Connection string: everything needed to connect to this forum
        connectionString: address ? `${network}:${address}` : null,
      };
    } catch (err) {
      this.res.status(500);
      return { success: false, error: err.message };
    }
  },
};
