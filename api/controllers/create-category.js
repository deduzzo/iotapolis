const db = require('../utility/db');
const ForumTags = require('../enums/ForumTags');

module.exports = {
  friendlyName: 'Create category',
  description: 'Create a new forum category (admin only).',

  inputs: {
    name: { type: 'string', required: true },
    description: { type: 'string', allowNull: true },
    sortOrder: { type: 'number', defaultsTo: 0 },
    authorId: { type: 'string' },
    nonce: { type: 'string', required: true },
    version: { type: 'number', defaultsTo: 1 },
    createdAt: { type: 'number', required: true },
    publicKey: { type: 'string', required: true },
    signature: { type: 'string', required: true },
  },

  exits: {
    success: { statusCode: 200 },
    badRequest: { statusCode: 400 },
    forbidden: { statusCode: 403 },
  },

  fn: async function (inputs) {
    try {
      const { userId } = await sails.helpers.verifySignature(this.req.body);
      console.log('[create-category] Verified userId:', userId);

      // Check admin role
      const Users = db.getModel('users');
      const user = Users.findOne({ id: userId });
      console.log('[create-category] User found:', user ? `${user.username} role=${user.role}` : 'NOT FOUND');
      if (!user || user.role !== 'admin') {
        console.log('[create-category] FORBIDDEN — not admin');
        this.res.status(403);
        return { success: false, error: `Access denied. User ${userId} role: ${user?.role || 'not found'}` };
      }

      // Generate id from nonce
      const categoryId = 'CAT_' + inputs.nonce.substring(0, 8);

      // Publish to blockchain
      const ForumManager = require('../utility/ForumManager');
      const txResult = await ForumManager.publishToChain(ForumTags.FORUM_CATEGORY, categoryId, {
        id: categoryId,
        name: inputs.name,
        description: inputs.description || null,
        authorId: userId,
        nonce: inputs.nonce,
        version: 1,
        createdAt: inputs.createdAt,
      });

      if (!txResult.success || txResult.verified === false) {
        this.res.status(503);
        return { success: false, error: 'Blockchain TX failed: ' + (txResult.error || 'not verified') };
      }

      // publishToChain already cached via processTransaction
      const Categories = db.getModel('categories');
      const category = Categories.findOne({ id: categoryId });

      // Broadcast
      await sails.helpers.broadcastEvent('dataChanged', {
        action: 'categoryCreated',
        label: inputs.name,
        categoryId,
      });

      return {
        success: true,
        category,
        digest: txResult?.digest || null,
      };
    } catch (err) {
      if (err === 'forbidden') throw 'forbidden';
      sails.log.error('[create-category]', err.message || err);
      this.res.status(err.message?.includes('signature') || err.message?.includes('nonce') ? 400 : 500);
      return { success: false, error: err.message || String(err) };
    }
  },
};
