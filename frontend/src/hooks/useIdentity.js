import { useState, useEffect, useCallback } from 'react';
import { generateKeypair, signPayload, deriveUserId } from '../api/crypto';

const STORAGE_KEY = 'forum_identity';

/**
 * React hook that manages the user's cryptographic identity.
 * Identity is persisted in localStorage as:
 *   { privateKey, publicKey, userId, username }
 */
export function useIdentity() {
  const [identity, setIdentity] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load identity from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setIdentity(JSON.parse(stored));
      }
    } catch {
      // Corrupted data — ignore
      localStorage.removeItem(STORAGE_KEY);
    }
    setLoading(false);
  }, []);

  // Persist identity changes
  const persistIdentity = useCallback((newIdentity) => {
    setIdentity(newIdentity);
    if (newIdentity) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newIdentity));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  /**
   * Generate a new RSA-2048 keypair and derive userId.
   * Does NOT register a username yet.
   */
  const generateIdentity = useCallback(async () => {
    const { publicKeyPem, privateKeyPem } = await generateKeypair();
    const userId = await deriveUserId(publicKeyPem);

    const newIdentity = {
      privateKey: privateKeyPem,
      publicKey: publicKeyPem,
      userId,
      username: null,
    };

    persistIdentity(newIdentity);
    return newIdentity;
  }, [persistIdentity]);

  /**
   * Register a username by POSTing a signed payload to /api/v1/register.
   */
  const registerUsername = useCallback(
    async (username) => {
      if (!identity) throw new Error('No identity — generate one first');

      const response = await signAndSendInternal(
        identity,
        '/api/v1/register',
        'POST',
        { username },
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Registration failed' }));
        throw new Error(err.error || 'Registration failed');
      }

      const updated = { ...identity, username };
      persistIdentity(updated);
      return updated;
    },
    [identity, persistIdentity],
  );

  /**
   * Sign a payload and send it to an API endpoint.
   * Adds authorId, nonce, createdAt, signature, and publicKey.
   */
  const signAndSend = useCallback(
    async (url, method, data = {}) => {
      if (!identity) throw new Error('No identity — generate one first');
      return signAndSendInternal(identity, url, method, data);
    },
    [identity],
  );

  /**
   * Export identity as a downloadable JSON file.
   */
  const exportIdentity = useCallback(() => {
    if (!identity) return;

    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      identity: {
        privateKey: identity.privateKey,
        publicKey: identity.publicKey,
        userId: identity.userId,
        username: identity.username,
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `iota-forum-identity-${identity.userId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [identity]);

  /**
   * Import identity from a JSON file (File object).
   */
  const importIdentity = useCallback(
    async (file) => {
      const text = await file.text();
      const data = JSON.parse(text);

      const imported = data.identity || data;
      if (!imported.privateKey || !imported.publicKey) {
        throw new Error('Invalid identity file — missing keys');
      }

      // Re-derive userId to verify integrity
      const userId = await deriveUserId(imported.publicKey);

      const newIdentity = {
        privateKey: imported.privateKey,
        publicKey: imported.publicKey,
        userId,
        username: imported.username || null,
      };

      persistIdentity(newIdentity);
      return newIdentity;
    },
    [persistIdentity],
  );

  /**
   * Clear identity from state and localStorage.
   */
  const clearIdentity = useCallback(() => {
    persistIdentity(null);
  }, [persistIdentity]);

  return {
    identity,
    loading,
    generateIdentity,
    registerUsername,
    signAndSend,
    exportIdentity,
    importIdentity,
    clearIdentity,
  };
}

// ---------------------------------------------------------------------------
// Internal helper (not exported — avoids stale closure on `identity`)
// ---------------------------------------------------------------------------

async function signAndSendInternal(identity, url, method, data = {}) {
  const payload = {
    ...data,
    authorId: identity.userId,
    nonce: crypto.randomUUID(),
    createdAt: Date.now(),
  };

  const signature = await signPayload(identity.privateKey, payload);

  const body = {
    ...payload,
    signature,
    publicKey: identity.publicKey,
  };

  return fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
