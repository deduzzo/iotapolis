const crypto = require('crypto');
const db = require('../utility/db');
const ForumTags = require('../enums/ForumTags');

module.exports = {
  friendlyName: 'Register',
  description: 'Register a new user with RSA keypair identity.',

  inputs: {
    username: { type: 'string', required: true },
    publicKey: { type: 'string', required: true },
    bio: { type: 'string', allowNull: true },
    avatar: { type: 'string', allowNull: true },
    nonce: { type: 'string', required: true },
    version: { type: 'number', defaultsTo: 1 },
    createdAt: { type: 'number', required: true },
    signature: { type: 'string', required: true },
  },

  exits: {
    success: { statusCode: 200 },
    badRequest: { statusCode: 400 },
    conflict: { statusCode: 409 },
  },

  fn: async function (inputs) {
    console.log('[register] Incoming request. username:', inputs.username, 'publicKey length:', inputs.publicKey?.length);
    try {
      // Verify signature + anti-replay
      console.log('[register] Calling verifySignature...');
      const { userId } = await sails.helpers.verifySignature(this.req.body);
      console.log('[register] Signature verified. userId:', userId);

      // Validate username: 3-20 chars, alphanumeric + underscore
      const username = inputs.username.trim();
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
        console.log('[register] Invalid username format:', username);
        throw 'badRequest';
      }

      // Check reserved usernames
      const reserved = ['admin', 'moderator', 'system', 'null', 'undefined'];
      if (reserved.includes(username.toLowerCase())) {
        console.log('[register] Reserved username:', username);
        throw 'badRequest';
      }

      // Check username uniqueness
      const Users = db.getModel('users');
      const existingUsername = Users.findOne({ username });
      if (existingUsername) {
        console.log('[register] Username already taken:', username);
        throw 'conflict';
      }

      // Check if user already registered with this publicKey
      const existingUser = Users.findOne({ id: userId });
      if (existingUser) {
        console.log('[register] User already registered with this publicKey. userId:', userId);
        throw 'conflict';
      }

      // First user becomes admin automatically
      const allUsers = Users.findAll({});
      const isFirstUser = !allUsers || allUsers.length === 0;
      const role = isFirstUser ? 'admin' : 'user';
      if (isFirstUser) {
        console.log('[register] First user — assigning admin role to', username);
      }

      // Publish to blockchain (this also caches in local db via processTransaction)
      console.log('[register] Publishing to blockchain...');
      const ForumManager = require('../utility/ForumManager');
      const txResult = await ForumManager.publishToChain(ForumTags.FORUM_USER, userId, {
        id: userId,
        username,
        bio: inputs.bio || null,
        avatar: inputs.avatar || null,
        publicKey: inputs.publicKey,
        nonce: inputs.nonce,
        version: 1,
        createdAt: inputs.createdAt,
      });
      console.log('[register] Blockchain publish result:', JSON.stringify(txResult));

      if (!txResult.success || txResult.verified === false) {
        console.log('[register] TX failed or not verified — registration aborted. Error:', txResult.error || 'not verified on-chain');
        this.res.status(503);
        return {
          success: false,
          error: 'Blockchain transaction failed: ' + (txResult.error || 'TX not verified on-chain'),
          retryQueued: true,
          digest: txResult.digest || null,
        };
      }

      // Update role if admin (processTransaction defaults to 'user')
      if (isFirstUser) {
        Users.update(userId, { role: 'admin' });
      }

      const user = Users.findOne({ id: userId });

      // Update search index
      db.updateFtsIndex(userId, username, inputs.bio || '');

      // Broadcast
      await sails.helpers.broadcastEvent('dataChanged', {
        action: 'userRegistered',
        label: username,
        userId,
      });

      console.log('[register] Registration complete for:', username);
      return {
        success: true,
        user,
        digest: txResult?.digest || null,
      };
    } catch (err) {
      if (err === 'badRequest') throw 'badRequest';
      if (err === 'conflict') throw 'conflict';
      console.log('[register] ERROR:', err.message || err, err.stack || '');
      sails.log.error('[register]', err.message || err);
      this.res.status(err.message?.includes('signature') || err.message?.includes('nonce') ? 400 : 500);
      return { success: false, error: err.message || String(err) };
    }
  },
};
