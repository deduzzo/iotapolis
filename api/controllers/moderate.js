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

      // Find target entity (post, thread, or category)
      const entityId = inputs.postId;
      const Posts = db.getModel('posts');
      const Threads = db.getModel('threads');
      const Categories = db.getModel('categories');

      let entity = Posts.findOne({ id: entityId });
      let entityType = 'post';
      if (!entity) {
        entity = Threads.findOne({ id: entityId });
        entityType = 'thread';
      }
      if (!entity) {
        entity = Categories.findOne({ id: entityId });
        entityType = 'category';
      }
      if (!entity) {
        console.log('[moderate] Entity not found:', entityId);
        this.res.status(404);
        return { success: false, error: `Entity ${entityId} not found` };
      }
      console.log('[moderate] Target:', entityType, entityId, 'action:', inputs.action);

      const modId = `MOD_${entityId}_${Date.now()}`;

      // Publish to blockchain
      const ForumManager = require('../utility/ForumManager');
      const txResult = await ForumManager.publishToChain(ForumTags.FORUM_MODERATION, modId, {
        postId: entityId,
        entityType,
        action: inputs.action,
        reason: inputs.reason || null,
        moderatorId: userId,
        nonce: inputs.nonce,
        createdAt: inputs.createdAt,
      });

      if (!txResult.success) {
        this.res.status(503);
        return { success: false, error: 'TX failed: ' + (txResult.error || 'unknown') };
      }

      // Cache moderation record (publishToChain already does via processTransaction)
      // Update hidden status on the target entity
      const hiddenValue = inputs.action === 'hide' ? 1 : 0;
      if (entityType === 'post') {
        Posts.update(entityId, { hidden: hiddenValue });
      } else if (entityType === 'thread') {
        Threads.update(entityId, { hidden: hiddenValue });
      } else if (entityType === 'category') {
        // Categories may not have 'hidden' column yet — use try/catch
        try {
          Categories.update(entityId, { hidden: hiddenValue });
        } catch (e) {
          console.log('[moderate] Could not update category hidden:', e.message);
        }
      }

      // Broadcast
      await sails.helpers.broadcastEvent('dataChanged', {
        action: 'moderated',
        label: inputs.action,
        entityId,
        entityType,
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
