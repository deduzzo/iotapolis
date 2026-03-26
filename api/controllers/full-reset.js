/**
 * full-reset.js — Full forum reset: new wallet, empty database, fresh start.
 *
 * This generates a new IOTA mnemonic/wallet, clears the SQLite cache,
 * and resets the forum to a blank state. On-chain data from the old
 * wallet remains but is no longer associated with this instance.
 */
const fs = require('fs');
const path = require('path');
const db = require('../utility/db');

const CONFIG_PATH = path.resolve(__dirname, '../../config/private_iota_conf.js');

module.exports = {
  friendlyName: 'Full Reset',
  description: 'Generate new wallet + clear all data. Forum restarts from scratch.',

  inputs: {},

  exits: {
    success: { statusCode: 200 },
  },

  fn: async function () {
    try {
      console.log('[full-reset] Starting full reset...');

      // 1. Clear all SQLite tables
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
      try { database.exec('DROP TABLE IF EXISTS tx_retry_queue'); } catch (e) { /* */ }
      console.log('[full-reset] Database cleared');

      // 2. Generate new mnemonic and overwrite config
      const iota = require('../utility/iota');
      const sdk = await iota.loadSdk();
      const { generateMnemonic } = await import('@scure/bip39');
      const { wordlist } = await import('@scure/bip39/wordlists/english.js');
      const newMnemonic = generateMnemonic(wordlist);

      const kp = sdk.Ed25519Keypair.deriveKeypair(newMnemonic);
      const newAddress = kp.getPublicKey().toIotaAddress();
      console.log('[full-reset] New wallet address:', newAddress);

      // 3. Overwrite mnemonic in config file
      try {
        let content = fs.readFileSync(CONFIG_PATH, 'utf8');
        // Replace existing mnemonic (whether null or a string value)
        content = content.replace(
          /IOTA_MNEMONIC:\s*(?:null|'[^']*')/,
          `IOTA_MNEMONIC: '${newMnemonic}'`
        );
        fs.writeFileSync(CONFIG_PATH, content, 'utf8');
        console.log('[full-reset] Config file updated with new mnemonic');
      } catch (e) {
        console.error('[full-reset] Could not update config file:', e.message);
        return {
          success: false,
          error: 'Could not write new mnemonic to config. Manual update needed.',
        };
      }

      // 4. Clear Move contract IDs (new wallet = need to re-deploy)
      try {
        let content = fs.readFileSync(CONFIG_PATH, 'utf8');
        content = content.replace(/FORUM_PACKAGE_ID:\s*'[^']*'/, "FORUM_PACKAGE_ID: null");
        content = content.replace(/FORUM_OBJECT_ID:\s*'[^']*'/, "FORUM_OBJECT_ID: null");
        content = content.replace(/ADMIN_CAP_ID:\s*'[^']*'/, "ADMIN_CAP_ID: null");
        fs.writeFileSync(CONFIG_PATH, content, 'utf8');
        console.log('[full-reset] Move contract IDs cleared — run `npm run move:deploy` to re-deploy');
      } catch (e) {
        console.log('[full-reset] Move config clear warning:', e.message);
      }

      // 5. Reset iota.js runtime state so it picks up the new mnemonic
      iota._resetRuntime();
      console.log('[full-reset] IOTA runtime reset');

      // 6. Re-initialize wallet (request faucet funds) and wait for them
      try {
        const walletResult = await iota.getOrInitWallet();
        console.log('[full-reset] New wallet initialized:', walletResult.address);

        // Wait for faucet funds to arrive (up to 30s)
        console.log('[full-reset] Waiting for faucet funds...');
        const funds = await iota.waitForFunds(30000);
        if (funds.ready) {
          console.log(`[full-reset] Wallet funded: ${funds.coins} coins`);
        } else {
          console.log('[full-reset] WARNING: Funds not yet available. May need to wait.');
        }
      } catch (e) {
        console.log('[full-reset] Wallet re-init warning:', e.message);
      }

      // 7. Generate new RSA keypair for the server
      const CryptHelper = require('../utility/CryptHelper');
      const { publicKey, privateKey } = await CryptHelper.RSAGenerateKeyPair();
      try {
        let content = fs.readFileSync(CONFIG_PATH, 'utf8');
        const escPub = publicKey.replace(/\n/g, '\\n');
        const escPriv = privateKey.replace(/\n/g, '\\n');
        content = content.replace(
          /MAIN_PUBLIC_KEY:\s*'[^']*'/,
          `MAIN_PUBLIC_KEY: '${escPub}'`
        );
        content = content.replace(
          /MAIN_PRIVATE_KEY:\s*'[^']*'/,
          `MAIN_PRIVATE_KEY: '${escPriv}'`
        );
        fs.writeFileSync(CONFIG_PATH, content, 'utf8');
        console.log('[full-reset] New RSA keypair generated and saved');
      } catch (e) {
        console.log('[full-reset] RSA key update warning:', e.message);
      }

      // Broadcast
      try {
        await sails.helpers.broadcastEvent('dataChanged', {
          action: 'fullReset',
          label: 'Full reset completed — new wallet created',
        });
      } catch (e) { /* */ }

      console.log('[full-reset] Full reset complete. New address:', newAddress);

      return {
        success: true,
        newAddress,
        needsMoveDeploy: true,
        message: 'Full reset complete. New wallet generated. Run `npm run move:deploy` to deploy a new smart contract, then restart the server.',
      };
    } catch (err) {
      console.error('[full-reset] Error:', err.message, err.stack);
      this.res.status(500);
      return { success: false, error: err.message || String(err) };
    }
  },
};
