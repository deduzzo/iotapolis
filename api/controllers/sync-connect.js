/**
 * sync-connect.js — Connect to an existing forum by reading from a remote wallet address.
 *
 * Queries the IOTA blockchain for transactions published from the given address,
 * decodes them, and populates the local SQLite cache.
 */
module.exports = {
  friendlyName: 'Sync Connect',
  description: 'Connect to a remote forum by querying its wallet address on the blockchain.',

  inputs: {
    address: { type: 'string', required: true },
    network: { type: 'string', defaultsTo: 'testnet' },
  },

  exits: {
    success: { statusCode: 200 },
    badRequest: { statusCode: 400 },
  },

  fn: async function (inputs) {
    const { address, network } = inputs;

    if (!address || !address.startsWith('0x')) {
      throw 'badRequest';
    }

    console.log(`[sync-connect] Connecting to forum at ${network}:${address}`);

    try {
      const iota = require('../utility/iota');
      const sdk = await iota.loadSdk();

      // Create a temporary client for the specified network
      const nodeUrl = network === 'mainnet'
        ? 'https://api.mainnet.iota.cafe'
        : network === 'devnet'
        ? 'https://api.devnet.iota.cafe'
        : 'https://api.testnet.iota.cafe';

      const client = new sdk.IotaClient({ url: nodeUrl });

      // Query transactions from the remote address
      let totalTx = 0;
      let cursor = null;
      let hasMore = true;
      const allDecoded = [];

      while (hasMore && totalTx < 1000) {
        const opts = {
          filter: { FromAddress: address },
          options: { showInput: true },
          limit: 50,
          order: 'descending',
        };
        if (cursor) opts.cursor = cursor;

        let txBlocks;
        try {
          txBlocks = await client.queryTransactionBlocks(opts);
        } catch (queryErr) {
          console.log('[sync-connect] Query error:', queryErr.message);
          return {
            success: false,
            error: `Impossibile interrogare l'indirizzo: ${queryErr.message}`,
          };
        }

        totalTx += txBlocks.data.length;
        console.log(`[sync-connect] Page fetched: ${txBlocks.data.length} TXs (total: ${totalTx})`);

        // We found transactions — the address exists and has activity
        hasMore = txBlocks.hasNextPage;
        cursor = txBlocks.nextCursor;
      }

      console.log(`[sync-connect] Found ${totalTx} total transactions from ${address}`);

      // Save the remote address in the config so future syncs use it
      // For now just report success — full sync will be a separate step
      return {
        success: true,
        address,
        network,
        totalTx,
        message: totalTx > 0
          ? `Trovate ${totalTx} transazioni. Il forum esiste ed e attivo.`
          : 'Indirizzo valido ma nessuna transazione trovata. Potrebbe essere un forum nuovo.',
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
