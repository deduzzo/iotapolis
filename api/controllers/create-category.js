const db = require('../utility/db');
const ForumTags = require('../enums/ForumTags');

module.exports = {
  friendlyName: 'Create category',
  description: 'Create a new forum category (admin only).',

  inputs: {
    id: { type: 'string', required: true },
    name: { type: 'string', required: true },
    description: { type: 'string', allowNull: true },
    sortOrder: { type: 'number', defaultsTo: 0 },
    authorId: { type: 'string', required: true },
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

      if (userId !== inputs.authorId) {
        this.res.status(403);
        return { success: false, error: 'Author mismatch' };
      }

      // Check admin role
      const Users = db.getModel('users');
      const user = Users.findOne({ id: userId });
      if (!user || user.role !== 'admin') {
        throw 'forbidden';
      }

      // Validate id format: CAT_ + nonce first 8
      const expectedId = 'CAT_' + inputs.nonce.substring(0, 8);
      if (inputs.id !== expectedId) {
        this.res.status(400);
        return { success: false, error: 'Invalid category ID format' };
      }

      // Publish to blockchain
      const ForumManager = require('../utility/ForumManager');
      const txResult = await ForumManager.publishToChain(ForumTags.FORUM_CATEGORY, inputs.id, {
        id: inputs.id,
        name: inputs.name,
        description: inputs.description || null,
        authorId: userId,
        nonce: inputs.nonce,
        version: 1,
        createdAt: inputs.createdAt,
      });

      // Cache
      const Categories = db.getModel('categories');
      const category = Categories.create({
        id: inputs.id,
        name: inputs.name,
        description: inputs.description || null,
        createdBy: userId,
        sortOrder: inputs.sortOrder || 0,
        createdAt: inputs.createdAt,
      });

      // Broadcast
      await sails.helpers.broadcastEvent('dataChanged', {
        action: 'categoryCreated',
        label: inputs.name,
        categoryId: inputs.id,
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
