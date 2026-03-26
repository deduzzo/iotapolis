const db = require('../utility/db');
const ForumTags = require('../enums/ForumTags');

module.exports = {
  friendlyName: 'Edit category',
  description: 'Edit an existing category (admin only, creates a new version on-chain).',

  inputs: {
    name: { type: 'string', required: true },
    description: { type: 'string', allowNull: true },
    sortOrder: { type: 'number', allowNull: true },
    authorId: { type: 'string', required: true },
    nonce: { type: 'string', required: true },
    version: { type: 'number', required: true },
    createdAt: { type: 'number', required: true },
    publicKey: { type: 'string', required: true },
    signature: { type: 'string', required: true },
  },

  exits: {
    success: { statusCode: 200 },
    forbidden: { statusCode: 403 },
    notFound: { statusCode: 404 },
  },

  fn: async function (inputs) {
    try {
      const { userId } = await sails.helpers.verifySignature(this.req.body);
      const categoryId = this.req.params.id;

      if (userId !== inputs.authorId) {
        this.res.status(403);
        return { success: false, error: 'Author mismatch' };
      }

      // Check admin
      const Users = db.getModel('users');
      const user = Users.findOne({ id: userId });
      if (!user || user.role !== 'admin') {
        throw 'forbidden';
      }

      // Check category exists
      const Categories = db.getModel('categories');
      const category = Categories.findOne({ id: categoryId });
      if (!category) {
        throw 'notFound';
      }

      const newVersion = inputs.version;

      // Publish to blockchain
      const ForumManager = require('../utility/ForumManager');
      const txResult = await ForumManager.publishToChain(ForumTags.FORUM_CATEGORY, categoryId, {
        id: categoryId,
        name: inputs.name,
        description: inputs.description || null,
        authorId: userId,
        nonce: inputs.nonce,
        version: newVersion,
        createdAt: inputs.createdAt,
      });

      // Update cache
      const updateData = {
        name: inputs.name,
        description: inputs.description !== undefined ? inputs.description : category.description,
      };
      if (inputs.sortOrder !== null && inputs.sortOrder !== undefined) {
        updateData.sortOrder = inputs.sortOrder;
      }
      const updated = Categories.update(categoryId, updateData);

      // Broadcast
      await sails.helpers.broadcastEvent('dataChanged', {
        entity: 'category',
        action: 'categoryEdited',
        label: inputs.name,
        categoryId,
        version: newVersion,
      });

      return {
        success: true,
        category: updated,
        digest: txResult?.digest || null,
      };
    } catch (err) {
      if (err === 'forbidden') throw 'forbidden';
      if (err === 'notFound') throw 'notFound';
      sails.log.error('[edit-category]', err.message || err);
      this.res.status(err.message?.includes('signature') || err.message?.includes('nonce') ? 400 : 500);
      return { success: false, error: err.message || String(err) };
    }
  },
};
