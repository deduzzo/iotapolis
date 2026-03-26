const db = require('../utility/db');
const ForumTags = require('../enums/ForumTags');

module.exports = {
  friendlyName: 'Edit user',
  description: 'Update user bio/avatar (creates a new version on-chain).',

  inputs: {
    bio: { type: 'string', allowNull: true },
    avatar: { type: 'string', allowNull: true },
    authorId: { type: 'string' },
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
      const targetUserId = this.req.params.id;

      // User can only edit own profile
      if (userId !== targetUserId) {
        throw 'forbidden';
      }

      const Users = db.getModel('users');
      const user = Users.findOne({ id: userId });
      if (!user) {
        throw 'notFound';
      }

      const newVersion = (user.version || 1) + 1;

      // Publish to blockchain (processTransaction handles cache)
      const ForumManager = require('../utility/ForumManager');
      const txResult = await ForumManager.publishToChain(ForumTags.FORUM_USER, userId, {
        username: user.username,
        bio: inputs.bio !== undefined ? inputs.bio : user.bio,
        avatar: inputs.avatar !== undefined ? inputs.avatar : user.avatar,
        publicKey: inputs.publicKey,
        nonce: inputs.nonce,
        version: newVersion,
        createdAt: inputs.createdAt,
      });

      if (!txResult || !txResult.success) {
        this.res.status(500);
        return { success: false, error: txResult?.error || 'Blockchain publish failed' };
      }

      // Update search index
      db.updateFtsIndex(userId, user.username, inputs.bio || '');

      // Broadcast
      await sails.helpers.broadcastEvent('dataChanged', {
        action: 'userUpdated',
        label: user.username,
        userId,
      });

      return {
        success: true,
        user: { id: userId, version: newVersion },
        digest: txResult?.digest || null,
      };
    } catch (err) {
      if (err === 'notFound') throw 'notFound';
      if (err === 'forbidden') throw 'forbidden';
      sails.log.error('[edit-user]', err.message || err);
      this.res.status(err.message?.includes('signature') || err.message?.includes('nonce') ? 400 : 500);
      return { success: false, error: err.message || String(err) };
    }
  },
};
