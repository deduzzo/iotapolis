#!/usr/bin/env node
/**
 * move-publish.js — Deploy the Move forum contract to IOTA testnet/devnet/mainnet.
 *
 * Usage:
 *   node api/utility/move-publish.js
 *
 * Prerequisites:
 *   - `iota move build` must be run first in move/forum/
 *   - Wallet must be initialized (IOTA_MNEMONIC in config)
 *   - Wallet must have gas (faucet funds on testnet)
 *
 * Outputs:
 *   - Saves FORUM_PACKAGE_ID, FORUM_OBJECT_ID, ADMIN_CAP_ID to config/private_iota_conf.js
 *   - Prints the connection string for sharing
 */

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.resolve(__dirname, '../../config/private_iota_conf.js');
const MOVE_DIR = path.resolve(__dirname, '../../move/forum');

async function main() {
  console.log('[move-publish] Starting Move contract deployment...');

  // 1. Load SDK and wallet
  const iota = require('./iota');
  const sdk = await iota.loadSdk();
  const keypair = await iota.getKeypair();
  const client = await iota.getClient();
  const address = await iota.getAddress();

  console.log(`[move-publish] Wallet: ${address}`);

  // 2. Check compiled bytecode exists
  const buildDir = path.join(MOVE_DIR, 'build', 'IotaFreeForum', 'bytecode_modules');
  if (!fs.existsSync(buildDir)) {
    console.error(`[move-publish] ERROR: Compiled bytecode not found at ${buildDir}`);
    console.error('[move-publish] Run first: cd move/forum && iota move build');
    process.exit(1);
  }

  const moduleFiles = fs.readdirSync(buildDir).filter(f => f.endsWith('.mv'));
  if (moduleFiles.length === 0) {
    console.error('[move-publish] ERROR: No .mv files found in build directory');
    process.exit(1);
  }

  console.log(`[move-publish] Found ${moduleFiles.length} module(s): ${moduleFiles.join(', ')}`);

  // 3. Read compiled modules and dependencies
  const modules = moduleFiles.map(f =>
    Array.from(fs.readFileSync(path.join(buildDir, f)))
  );

  // Read package dependencies from BuildInfo
  const depsPath = path.join(MOVE_DIR, 'build', 'IotaFreeForum', 'bytecode_modules');
  // We need to read the compiled package properly — use the package bytes approach
  const compiledModules = moduleFiles.map(f =>
    fs.readFileSync(path.join(buildDir, f)).toString('base64')
  );

  // 4. Build publish transaction
  const { Transaction } = sdk;
  const tx = new Transaction();

  // Read the full compiled package for publishing
  const packagePath = path.join(MOVE_DIR, 'build', 'IotaFreeForum');

  // Read all module bytecodes
  const moduleBytecodes = moduleFiles.map(f =>
    Array.from(fs.readFileSync(path.join(buildDir, f)))
  );

  // Read dependencies from the lock file or package manifest
  // For IOTA, we use tx.publish with the compiled modules
  const [upgradeCap] = tx.publish({
    modules: moduleBytecodes,
    dependencies: [
      '0x1', // MoveStdlib
      '0x2', // IotaFramework
    ],
  });

  // Transfer the UpgradeCap to the deployer
  tx.transferObjects([upgradeCap], address);
  tx.setGasBudget(500_000_000); // 0.5 IOTA — publish can be expensive

  console.log('[move-publish] Signing and executing publish transaction...');

  // 5. Execute
  const result = await client.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: {
      showEffects: true,
      showObjectChanges: true,
    },
  });

  if (result.effects?.status?.status !== 'success') {
    console.error('[move-publish] ERROR: Transaction failed!');
    console.error(JSON.stringify(result.effects, null, 2));
    process.exit(1);
  }

  console.log(`[move-publish] TX digest: ${result.digest}`);

  // 6. Extract IDs from object changes
  let packageId = null;
  let forumObjectId = null;
  let adminCapId = null;

  for (const change of (result.objectChanges || [])) {
    if (change.type === 'published') {
      packageId = change.packageId;
    }
    if (change.type === 'created') {
      if (change.objectType?.includes('::forum::Forum')) {
        forumObjectId = change.objectId;
      }
      if (change.objectType?.includes('::forum::AdminCap')) {
        adminCapId = change.objectId;
      }
    }
  }

  if (!packageId || !forumObjectId || !adminCapId) {
    console.error('[move-publish] ERROR: Could not extract all IDs from transaction');
    console.error('  packageId:', packageId);
    console.error('  forumObjectId:', forumObjectId);
    console.error('  adminCapId:', adminCapId);
    console.error('  objectChanges:', JSON.stringify(result.objectChanges, null, 2));
    process.exit(1);
  }

  console.log(`[move-publish] Package ID:    ${packageId}`);
  console.log(`[move-publish] Forum Object:  ${forumObjectId}`);
  console.log(`[move-publish] Admin Cap:     ${adminCapId}`);

  // 7. Save to config
  _saveToConfig('FORUM_PACKAGE_ID', packageId);
  _saveToConfig('FORUM_OBJECT_ID', forumObjectId);
  _saveToConfig('ADMIN_CAP_ID', adminCapId);

  const config = require(CONFIG_PATH);
  const network = config.IOTA_NETWORK || 'testnet';
  const connectionString = `${network}:${packageId}:${forumObjectId}`;

  console.log('\n══════════════════════════════════════════════════');
  console.log(' Move contract deployed successfully!');
  console.log('══════════════════════════════════════════════════');
  console.log(`  Connection string: ${connectionString}`);
  console.log('  Share this with other users so they can connect.');
  console.log('══════════════════════════════════════════════════\n');
}

/**
 * Save a key-value pair to the config file.
 * If the key already exists (as null), replace it.
 * If the key doesn't exist, add it before the closing `};`.
 */
function _saveToConfig(key, value) {
  try {
    let content = fs.readFileSync(CONFIG_PATH, 'utf8');
    const quoted = `'${value}'`;

    // Try to replace existing null value
    const nullPattern = new RegExp(`${key}:\\s*null`);
    if (nullPattern.test(content)) {
      content = content.replace(nullPattern, `${key}: ${quoted}`);
    }
    // Try to replace existing quoted value
    else if (content.includes(`${key}:`)) {
      const existingPattern = new RegExp(`${key}:\\s*'[^']*'`);
      content = content.replace(existingPattern, `${key}: ${quoted}`);
    }
    // Add before closing };
    else {
      content = content.replace(
        /};(\s*)$/,
        `\n  // Move contract\n  ${key}: ${quoted},\n};$1`
      );
    }

    fs.writeFileSync(CONFIG_PATH, content, 'utf8');
    console.log(`[move-publish] Saved ${key} to config`);
  } catch (e) {
    console.error(`[move-publish] Could not save ${key} to config:`, e.message);
  }
}

main().catch(err => {
  console.error('[move-publish] Fatal error:', err);
  process.exit(1);
});
