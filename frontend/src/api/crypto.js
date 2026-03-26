/**
 * Client-side cryptography for IOTA Free Forum.
 *
 * Primary identity: IOTA Ed25519 keypair derived from BIP39 mnemonic.
 * Mnemonic encrypted with AES-256-GCM (password-based) for localStorage.
 *
 * Retained from legacy:
 *   - AES-256-CBC encrypt/decrypt (paid content encryption)
 *   - RSA-OAEP encrypt/decrypt (key exchange for paid content)
 */

import { Ed25519Keypair } from '@iota/iota-sdk/keypairs/ed25519';
import { IotaClient, getFullnodeUrl } from '@iota/iota-sdk/client';
import { Transaction } from '@iota/iota-sdk/transactions';
import { generateMnemonic as _genMnemonic, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';

// ─── IOTA Network Client (singleton) ────────────────────────────────────────

let _client = null;
let _networkUrl = null;

/**
 * Set the RPC endpoint URL for the IOTA client.
 * Call this after fetching /api/v1/forum-info to use the correct network.
 */
export function setNetworkUrl(url) {
  if (url && url !== _networkUrl) {
    _networkUrl = url;
    _client = new IotaClient({ url });
  }
}

/**
 * Configure the client from a network name (e.g. 'testnet', 'mainnet').
 */
export function setNetwork(network) {
  const url = getFullnodeUrl(network);
  setNetworkUrl(url);
}

/**
 * Get the singleton IotaClient.
 * Falls back to testnet if not yet configured.
 */
export function getClient() {
  if (!_client) {
    const url = _networkUrl || getFullnodeUrl('testnet');
    _networkUrl = url;
    _client = new IotaClient({ url });
  }
  return _client;
}

// Re-export for transaction building
export { Transaction };

// IOTA system clock shared object
export const CLOCK_OBJECT_ID = '0x6';

// ─── BIP39 Mnemonic ─────────────────────────────────────────────────────────

/**
 * Generate a 12-word BIP39 mnemonic.
 */
export function generateMnemonic() {
  return _genMnemonic(wordlist, 128);
}

/**
 * Validate a BIP39 mnemonic string.
 */
export function isValidMnemonic(mnemonic) {
  if (!mnemonic || typeof mnemonic !== 'string') return false;
  return validateMnemonic(mnemonic.trim(), wordlist);
}

// ─── Ed25519 Keypair ─────────────────────────────────────────────────────────

/**
 * Derive an Ed25519Keypair from a BIP39 mnemonic.
 */
export function keypairFromMnemonic(mnemonic) {
  return Ed25519Keypair.deriveKeypair(mnemonic.trim());
}

/**
 * Get the IOTA address (0x...) from a keypair.
 */
export function getAddress(keypair) {
  return keypair.getPublicKey().toIotaAddress();
}

// ─── Mnemonic Encryption (AES-256-GCM, password-based) ──────────────────────

/**
 * Derive an AES-256-GCM key from a password + salt via PBKDF2 (600k rounds).
 */
async function deriveKeyFromPassword(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 600_000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/**
 * Encrypt mnemonic with a user password (AES-256-GCM).
 * Returns a base64 string containing: salt(16) || iv(12) || ciphertext+tag.
 */
export async function encryptMnemonic(mnemonic, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKeyFromPassword(password, salt);
  const encoded = new TextEncoder().encode(mnemonic);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded,
  );
  const result = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  result.set(salt, 0);
  result.set(iv, salt.length);
  result.set(new Uint8Array(ciphertext), salt.length + iv.length);
  return arrayBufferToBase64(result.buffer);
}

/**
 * Decrypt mnemonic with user password (AES-256-GCM).
 * Throws on wrong password.
 */
export async function decryptMnemonic(encryptedBase64, password) {
  const data = new Uint8Array(base64ToArrayBuffer(encryptedBase64));
  const salt = data.slice(0, 16);
  const iv = data.slice(16, 28);
  const ciphertext = data.slice(28);
  const key = await deriveKeyFromPassword(password, salt);
  try {
    const plainBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext,
    );
    return new TextDecoder().decode(plainBuffer);
  } catch {
    throw new Error('Wrong password or corrupted data');
  }
}

// ─── Sign & Execute Transaction ──────────────────────────────────────────────

/**
 * Sign a Transaction with the user's Ed25519 keypair and execute on the IOTA network.
 * Waits for confirmation before returning.
 */
export async function signAndExecuteTransaction(keypair, transactionBlock) {
  const client = getClient();
  const result = await client.signAndExecuteTransaction({
    signer: keypair,
    transaction: transactionBlock,
    options: { showEffects: true, showEvents: true },
  });
  await client.waitForTransaction({ digest: result.digest });
  return result;
}

// ─── Gzip compression (for on-chain data payloads) ──────────────────────────

/**
 * Gzip-compress a JSON-serialisable object.
 * Returns Uint8Array suitable for passing as vector<u8> in Move calls.
 */
export async function gzipCompress(jsonObject) {
  const jsonStr = JSON.stringify(jsonObject);
  const stream = new Blob([jsonStr]).stream().pipeThrough(new CompressionStream('gzip'));
  const blob = await new Response(stream).blob();
  return new Uint8Array(await blob.arrayBuffer());
}

// ─── Helpers: base64 / PEM ──────────────────────────────────────────────────

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function pemToArrayBuffer(pem) {
  const b64 = pem.replace(/-----[A-Z ]+-----/g, '').replace(/\s+/g, '');
  return base64ToArrayBuffer(b64);
}

// ─── AES-256-CBC (for paid content encryption) ──────────────────────────────

async function importAESKey(keyBase64) {
  const raw = base64ToArrayBuffer(keyBase64);
  return crypto.subtle.importKey('raw', raw, { name: 'AES-CBC' }, false, [
    'encrypt',
    'decrypt',
  ]);
}

async function computeHMAC(keyBase64, data) {
  const keyBytes = base64ToArrayBuffer(keyBase64);
  const hmacKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', hmacKey, data);
  return arrayBufferToBase64(sig);
}

/**
 * AES-256-CBC encrypt with HMAC-SHA256 integrity.
 * Returns { iv, ciphertext, hmac } — all base64.
 */
export async function encryptAES(plaintext, keyBase64) {
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const aesKey = await importAESKey(keyBase64);
  const encoded = new TextEncoder().encode(plaintext);

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-CBC', iv },
    aesKey,
    encoded,
  );

  const ivB64 = arrayBufferToBase64(iv.buffer);
  const ciphertextB64 = arrayBufferToBase64(cipherBuffer);

  const combined = new Uint8Array(iv.byteLength + cipherBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipherBuffer), iv.byteLength);
  const hmac = await computeHMAC(keyBase64, combined.buffer);

  return { iv: ivB64, ciphertext: ciphertextB64, hmac };
}

/**
 * AES-256-CBC decrypt. Verifies HMAC before decrypting.
 */
export async function decryptAES(encrypted, keyBase64) {
  const { iv, ciphertext, hmac } = encrypted;

  const ivBytes = new Uint8Array(base64ToArrayBuffer(iv));
  const cipherBytes = new Uint8Array(base64ToArrayBuffer(ciphertext));

  const combined = new Uint8Array(ivBytes.byteLength + cipherBytes.byteLength);
  combined.set(ivBytes, 0);
  combined.set(cipherBytes, ivBytes.byteLength);
  const computedHmac = await computeHMAC(keyBase64, combined.buffer);

  if (computedHmac !== hmac) {
    throw new Error('HMAC verification failed — data may be tampered');
  }

  const aesKey = await importAESKey(keyBase64);
  const plainBuffer = await crypto.subtle.decrypt(
    { name: 'AES-CBC', iv: ivBytes },
    aesKey,
    cipherBytes,
  );

  return new TextDecoder().decode(plainBuffer);
}

// ─── RSA-OAEP (key exchange for paid content) ───────────────────────────────

async function importEncryptPublicKey(pem) {
  const der = pemToArrayBuffer(pem);
  return crypto.subtle.importKey(
    'spki',
    der,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt'],
  );
}

async function importEncryptPrivateKey(pem) {
  const der = pemToArrayBuffer(pem);
  return crypto.subtle.importKey(
    'pkcs8',
    der,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['decrypt'],
  );
}

/**
 * RSA-OAEP encrypt a short string with a public key PEM.
 */
export async function encryptRSA(data, publicKeyPem) {
  const key = await importEncryptPublicKey(publicKeyPem);
  const encoded = new TextEncoder().encode(data);
  const cipherBuffer = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, key, encoded);
  return arrayBufferToBase64(cipherBuffer);
}

/**
 * RSA-OAEP decrypt with a private key PEM.
 */
export async function decryptRSA(ciphertext, privateKeyPem) {
  const key = await importEncryptPrivateKey(privateKeyPem);
  const cipherBuffer = base64ToArrayBuffer(ciphertext);
  const plainBuffer = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, key, cipherBuffer);
  return new TextDecoder().decode(plainBuffer);
}
