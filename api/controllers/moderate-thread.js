const db = require('../utility/db');
const ForumTags = require('../enums/ForumTags');

module.exports = {
  friendlyName: 'Moderate thread',
  description: 'Moderate a thread: lock, unlock, pin, unpin, hide. Requires moderator or admin role.',

  inputs: {
    threadId: { type: 'string', required: true },
    action: { type: 'string', required: true },
    reason: { type: 'string', allowNull: true },
    moderatorId: { type: 'string', required: true },
    nonce: { type: 'string', required: true },
    createdAt: { type: 'number', required: true },
    publicKey: { type: 'string', required: true },
    signature: { type: 'string', required: true },
  },

  exits: {
    success: { statusCode: 200 },
    badRequest: { statusCode: 400 },
    forbidden: { statusCode: 403 },
    notFound: { statusCode: 404 },
  },

  fn: async function (inputs) {
    try {
      const { userId } = await sails.helpers.verifySignature(this.req.body);

      if (userId !== inputs.moderatorId) {
        this.res.status(403);
        return { success: false, error: 'Author mismatch' };
      }

      // Check moderator/admin role
      const Users = db.getModel('users');
      const user = Users.findOne({ id: userId });
      if (!user || (user.role !== 'moderator' && user.role !== 'admin')) {
        throw 'forbidden';
      }

      // Validate action
      const validActions = ['lock', 'unlock', 'pin', 'unpin', 'hide'];
      if (!validActions.includes(inputs.action)) {
        this.res.status(400);
        return { success: false, error: 'Invalid action. Must be: ' + validActions.join(', ') };
      }

      // Check thread exists
      const Threads = db.getModel('threads');
      const thread = Threads.findOne({ id: inputs.threadId });
      if (!thread) {
        throw 'notFound';
      }

      const modId = `MOD_${inputs.threadId}_${Date.now()}`;

      // Publish to blockchain
      const ForumManager = require('../utility/ForumManager');
      const txResult = await ForumManager.publishToChain(ForumTags.FORUM_MODERATION, modId, {
        threadId: inputs.threadId,
        action: inputs.action,
        reason: inputs.reason || null,
        moderatorId: userId,
        nonce: inputs.nonce,
        createdAt: inputs.createdAt,
      });

      // Cache moderation
      const Moderations = db.getModel('moderations');
      Moderations.create({
        id: modId,
        postId: inputs.threadId, // reuse postId column for threadId
        action: inputs.action,
        reason: inputs.reason || null,
        moderatorId: userId,
        createdAt: inputs.createdAt,
      });

      // Apply action to thread
      const updateData = {};
      switch (inputs.action) {
        case 'lock': updateData.locked = true; break;
        case 'unlock': updateData.locked = false; break;
        case 'pin': updateData.pinned = true; break;
        case 'unpin': updateData.pinned = false; break;
        case 'hide': updateData.hidden = true; break;
      }
      Threads.update(inputs.threadId, updateData);

      // Broadcast
      await sails.helpers.broadcastEvent('dataChanged', {
        action: 'threadModerated',
        label: inputs.action,
        threadId: inputs.threadId,
        categoryId: thread.categoryId,
      });

      return {
        success: true,
        moderation: { id: modId, action: inputs.action },
        digest: txResult?.digest || null,
      };
    } catch (err) {
      if (err === 'notFound') throw 'notFound';
      if (err === 'forbidden') throw 'forbidden';
      sails.log.error('[moderate-thread]', err.message || err);
      this.res.status(err.message?.includes('signature') || err.message?.includes('nonce') ? 400 : 500);
      return { success: false, error: err.message || String(err) };
    }
  },
};
