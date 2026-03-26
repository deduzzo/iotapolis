/**
 * sync-connect.js — Connect to an existing forum by its Move contract IDs.
 *
 * Connection string format: network:packageId:forumObjectId
 * Legacy format (deprecated): network:address
 */
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.resolve(__dirname, '../../config/private_iota_conf.js');

module.exports = {
  friendlyName: 'Sync Connect',
  description: 'Connect to a remote forum by its Move contract Package ID and Forum Object ID.',

  inputs: {
    connectionString: { type: 'string', required: true },
  },

  exits: {
    success: { statusCode: 200 },
    badRequest: { statusCode: 400 },
  },

  fn: async function (inputs) {
    const raw = inputs.connectionString.trim();
    const parts = raw.split(':');

    // Parse connection string
    let network, packageId, forumObjectId;

    if (parts.length === 3) {
      // New format: network:packageId:forumObjectId
      [network, packageId, forumObjectId] = parts;
    } else if (parts.length === 2) {
      // Legacy format: network:address — no longer supported for Move mode
      return {
        success: false,
        error: 'Formato legacy non supportato. Usa il formato: network:packageId:forumObjectId',
      };
    } else {
      throw 'badRequest';
    }

    if (!packageId.startsWith('0x') || !forumObjectId.startsWith('0x')) {
      return { success: false, error: 'Package ID e Forum Object ID devono iniziare con 0x' };
    }

    console.log(`[sync-connect] Connecting to forum: ${network}:${packageId}:${forumObjectId}`);

    try {
      const iota = require('../utility/iota');
      const sdk = await iota.loadSdk();

      // Create a client for the specified network
      const nodeUrl = network === 'mainnet'
        ? 'https://api.mainnet.iota.cafe'
        : network === 'devnet'
          ? 'https://api.devnet.iota.cafe'
          : 'https://api.testnet.iota.cafe';

      const client = new sdk.IotaClient({ url: nodeUrl });

      // Verify the forum exists by querying its events
      let totalEvents = 0;
      try {
        const result = await client.queryEvents({
          query: { MoveModule: { package: packageId, module: 'forum' } },
          limit: 1,
        });
        totalEvents = result.data.length;
        // If we got a result, the contract exists
        if (result.data.length === 0 && !result.hasNextPage) {
          // Contract exists but no events yet — check if the object exists
          try {
            await client.getObject({ id: forumObjectId, options: { showContent: true } });
            totalEvents = 0; // Object exists, just no events
          } catch {
            return {
              success: false,
              error: 'Forum Object non trovato sulla blockchain. Verifica l\'ID.',
            };
          }
        }
      } catch (queryErr) {
        console.log('[sync-connect] Query error:', queryErr.message);
        return {
          success: false,
          error: `Impossibile interrogare il contratto: ${queryErr.message}`,
        };
      }

      // Count total events
      if (totalEvents > 0) {
        let cursor = null;
        let hasMore = true;
        totalEvents = 0;
        while (hasMore && totalEvents < 1000) {
          const r = await client.queryEvents({
            query: { MoveModule: { package: packageId, module: 'forum' } },
            limit: 50,
            cursor,
          });
          totalEvents += r.data.length;
          hasMore = r.hasNextPage;
          cursor = r.nextCursor;
        }
      }

      console.log(`[sync-connect] Found ${totalEvents} events from contract ${packageId}`);

      // Save to config
      _saveToConfig('FORUM_PACKAGE_ID', packageId);
      _saveToConfig('FORUM_OBJECT_ID', forumObjectId);
      // No ADMIN_CAP_ID — only the deployer has it

      // Reload config in iota.js
      iota._resetRuntime();

      return {
        success: true,
        packageId,
        forumObjectId,
        network,
        totalEvents,
        message: totalEvents > 0
          ? `Connesso! Trovati ${totalEvents} eventi del forum.`
          : 'Connesso al contratto. Nessun evento ancora (forum nuovo).',
      };
    } catch (err) {
      console.error('[sync-connect] Error:', err.message);
      return {
        success: false,
        error: err.message || 'Errore di connessione alla blockchain.',
      };
    }
  },
};

function _saveToConfig(key, value) {
  try {
    let content = fs.readFileSync(CONFIG_PATH, 'utf8');
    const quoted = `'${value}'`;

    const nullPattern = new RegExp(`${key}:\\s*null`);
    if (nullPattern.test(content)) {
      content = content.replace(nullPattern, `${key}: ${quoted}`);
    } else if (content.includes(`${key}:`)) {
      const existingPattern = new RegExp(`${key}:\\s*'[^']*'`);
      content = content.replace(existingPattern, `${key}: ${quoted}`);
    } else {
      content = content.replace(/};(\s*)$/, `\n  ${key}: ${quoted},\n};$1`);
    }

    fs.writeFileSync(CONFIG_PATH, content, 'utf8');
    console.log(`[sync-connect] Saved ${key} to config`);
  } catch (e) {
    console.error(`[sync-connect] Could not save ${key}:`, e.message);
  }
}
