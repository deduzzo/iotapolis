/**
 * Client-side cryptography using the Web Crypto API.
 * Provides RSA signing/verification, AES-256-CBC encryption, and RSA-OAEP encryption.
 */

const SIGN_ALGO = {
  name: 'RSASSA-PKCS1-v1_5',
  modulusLength: 2048,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: 'SHA-256',
};

// ---------------------------------------------------------------------------
// Helpers: PEM <-> ArrayBuffer <-> CryptoKey
// ---------------------------------------------------------------------------

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
  const b64 = pem
    .replace(/-----[A-Z ]+-----/g, '')
    .replace(/\s+/g, '');
  return base64ToArrayBuffer(b64);
}

function arrayBufferToPem(buffer, type) {
  const b64 = arrayBufferToBase64(buffer);
  const lines = b64.match(/.{1,64}/g).join('\n');
  return `-----BEGIN ${type}-----\n${lines}\n-----END ${type}-----`;
}

async function importSignPrivateKey(pem) {
  const der = pemToArrayBuffer(pem);
  return crypto.subtle.importKey('pkcs8', der, SIGN_ALGO, false, ['sign']);
}

async function importSignPublicKey(pem) {
  const der = pemToArrayBuffer(pem);
  return crypto.subtle.importKey('spki', der, SIGN_ALGO, false, ['verify']);
}

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

// ---------------------------------------------------------------------------
// Keypair generation
// ---------------------------------------------------------------------------

/**
 * Generate an RSA-2048 keypair for signing (RSASSA-PKCS1-v1_5 / SHA-256).
 * Returns { publicKeyPem: string, privateKeyPem: string }
 */
export async function generateKeypair() {
  const keyPair = await crypto.subtle.generateKey(
    SIGN_ALGO,
    true, // extractable
    ['sign', 'verify'],
  );

  const publicKeyDer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const privateKeyDer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  return {
    publicKeyPem: arrayBufferToPem(publicKeyDer, 'PUBLIC KEY'),
    privateKeyPem: arrayBufferToPem(privateKeyDer, 'PRIVATE KEY'),
  };
}

// ---------------------------------------------------------------------------
// Signing
// ---------------------------------------------------------------------------

/**
 * Sign a payload object with RSA-SHA256 (RSASSA-PKCS1-v1_5).
 * Removes the 'signature' field, sorts keys, stringifies, then signs.
 * Returns a base64-encoded signature string.
 */
export async function signPayload(privateKeyPem, payload) {
  // Remove signature field and sort keys deterministically
  const cleaned = { ...payload };
  delete cleaned.signature;
  const sortedKeys = Object.keys(cleaned).sort();
  const sorted = {};
  for (const key of sortedKeys) {
    sorted[key] = cleaned[key];
  }
  const message = JSON.stringify(sorted);

  const key = await importSignPrivateKey(privateKeyPem);
  const encoded = new TextEncoder().encode(message);
  const signatureBuffer = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, encoded);

  return arrayBufferToBase64(signatureBuffer);
}

// ---------------------------------------------------------------------------
// User ID derivation
// ---------------------------------------------------------------------------

/**
 * Derive a user ID from a public key PEM.
 * SHA-256(publicKeyPem) -> first 16 hex chars uppercase -> prefix "USR_"
 */
export async function deriveUserId(publicKeyPem) {
  const encoded = new TextEncoder().encode(publicKeyPem);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = new Uint8Array(hashBuffer);
  const hex = Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `USR_${hex.slice(0, 16).toUpperCase()}`;
}

// ---------------------------------------------------------------------------
// AES-256-CBC encryption / decryption
// ---------------------------------------------------------------------------

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
 * AES-256-CBC encrypt.
 * Generates a random 16-byte IV, encrypts, computes HMAC-SHA256 over IV+ciphertext.
 * Returns { iv: base64, ciphertext: base64, hmac: base64 }
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

  // HMAC over IV + ciphertext (concatenated raw bytes)
  const combined = new Uint8Array(iv.byteLength + cipherBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipherBuffer), iv.byteLength);
  const hmac = await computeHMAC(keyBase64, combined.buffer);

  return { iv: ivB64, ciphertext: ciphertextB64, hmac };
}

/**
 * AES-256-CBC decrypt.
 * Verifies HMAC before decrypting.
 * Throws on HMAC mismatch.
 */
export async function decryptAES(encrypted, keyBase64) {
  const { iv, ciphertext, hmac } = encrypted;

  const ivBytes = new Uint8Array(base64ToArrayBuffer(iv));
  const cipherBytes = new Uint8Array(base64ToArrayBuffer(ciphertext));

  // Verify HMAC
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

// ---------------------------------------------------------------------------
// RSA-OAEP encryption / decryption (for key exchange)
// ---------------------------------------------------------------------------

/**
 * RSA-OAEP encrypt a short string with a public key PEM.
 * Note: the public key PEM must be from an RSA-OAEP keypair, not the signing keypair.
 * Returns base64-encoded ciphertext.
 */
export async function encryptRSA(data, publicKeyPem) {
  const key = await importEncryptPublicKey(publicKeyPem);
  const encoded = new TextEncoder().encode(data);
  const cipherBuffer = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, key, encoded);
  return arrayBufferToBase64(cipherBuffer);
}

/**
 * RSA-OAEP decrypt with a private key PEM.
 * Returns the decrypted string.
 */
export async function decryptRSA(ciphertext, privateKeyPem) {
  const key = await importEncryptPrivateKey(privateKeyPem);
  const cipherBuffer = base64ToArrayBuffer(ciphertext);
  const plainBuffer = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, key, cipherBuffer);
  return new TextDecoder().decode(plainBuffer);
}
