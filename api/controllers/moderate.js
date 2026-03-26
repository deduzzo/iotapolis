const db = require('../utility/db');
const ForumTags = require('../enums/ForumTags');

module.exports = {
  friendlyName: 'Moderate post',
  description: 'Moderate a post (hide/unhide). Requires moderator or admin role.',

  inputs: {
    postId: { type: 'string', required: true },
    action: { type: 'string', required: true },
    reason: { type: 'string', allowNull: true },
    authorId: { type: 'string' },
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
      console.log('[moderate] Verified userId:', userId);

      // Check user has moderator or admin role
      const Users = db.getModel('users');
      const user = Users.findOne({ id: userId });
      console.log('[moderate] User:', user ? `${user.username} role=${user.role}` : 'NOT FOUND');
      if (!user || (user.role !== 'moderator' && user.role !== 'admin')) {
        this.res.status(403);
        return { success: false, error: `Access denied. Role: ${user?.role || 'not found'}` };
      }

      // Validate action
      const validActions = ['hide', 'unhide'];
      if (!validActions.includes(inputs.action)) {
        this.res.status(400);
        return { success: false, error: 'Invalid action. Must be: ' + validActions.join(', ') };
      }

      // Check post exists
      const Posts = db.getModel('posts');
      const post = Posts.findOne({ id: inputs.postId });
      if (!post) {
        throw 'notFound';
      }

      const modId = `MOD_${inputs.postId}_${Date.now()}`;

      // Publish to blockchain
      const ForumManager = require('../utility/ForumManager');
      const txResult = await ForumManager.publishToChain(ForumTags.FORUM_MODERATION, modId, {
        postId: inputs.postId,
        action: inputs.action,
        reason: inputs.reason || null,
        moderatorId: userId,
        nonce: inputs.nonce,
        createdAt: inputs.createdAt,
      });

      // Cache moderation record
      const Moderations = db.getModel('moderations');
      Moderations.create({
        id: modId,
        postId: inputs.postId,
        action: inputs.action,
        reason: inputs.reason || null,
        moderatorId: userId,
        createdAt: inputs.createdAt,
      });

      // Update post hidden status
      Posts.update(inputs.postId, {
        hidden: inputs.action === 'hide',
      });

      // Broadcast
      await sails.helpers.broadcastEvent('dataChanged', {
        action: 'postModerated',
        label: inputs.action,
        postId: inputs.postId,
        threadId: post.threadId,
      });

      return {
        success: true,
        moderation: { id: modId, action: inputs.action },
        digest: txResult?.digest || null,
      };
    } catch (err) {
      if (err === 'notFound') throw 'notFound';
      if (err === 'forbidden') throw 'forbidden';
      sails.log.error('[moderate]', err.message || err);
      this.res.status(err.message?.includes('signature') || err.message?.includes('nonce') ? 400 : 500);
      return { success: false, error: err.message || String(err) };
    }
  },
};
