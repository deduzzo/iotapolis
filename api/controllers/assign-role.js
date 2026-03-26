const db = require('../utility/db');
const ForumTags = require('../enums/ForumTags');

module.exports = {
  friendlyName: 'Assign role',
  description: 'Assign a role to a user (admin only).',

  inputs: {
    targetUserId: { type: 'string', required: true },
    role: { type: 'string', required: true },
    categoryId: { type: 'string', allowNull: true },
    grantedBy: { type: 'string' },
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

      // Check user is admin
      const Users = db.getModel('users');
      const admin = Users.findOne({ id: userId });
      if (!admin || admin.role !== 'admin') {
        throw 'forbidden';
      }

      // Check target user exists
      const targetUser = Users.findOne({ id: inputs.targetUserId });
      if (!targetUser) {
        throw 'notFound';
      }

      // Validate role
      const validRoles = ['user', 'moderator', 'admin', 'banned'];
      if (!validRoles.includes(inputs.role)) {
        this.res.status(400);
        return { success: false, error: 'Invalid role. Must be: ' + validRoles.join(', ') };
      }

      // Generate role ID server-side from nonce
      const roleId = `ROLE_${inputs.nonce.substring(0, 8)}`;

      // Publish to blockchain (processTransaction handles cache)
      const ForumManager = require('../utility/ForumManager');
      const txResult = await ForumManager.publishToChain(ForumTags.FORUM_ROLE, roleId, {
        targetUserId: inputs.targetUserId,
        role: inputs.role,
        categoryId: inputs.categoryId || null,
        grantedBy: userId,
        nonce: inputs.nonce,
        createdAt: inputs.createdAt,
      });

      if (!txResult || !txResult.success) {
        this.res.status(500);
        return { success: false, error: txResult?.error || 'Blockchain publish failed' };
      }

      // Update user role in cache
      Users.update(inputs.targetUserId, { role: inputs.role });

      // Broadcast
      await sails.helpers.broadcastEvent('dataChanged', {
        entity: 'user',
        action: 'roleAssigned',
        label: `${inputs.targetUserId} → ${inputs.role}`,
        targetUserId: inputs.targetUserId,
        role: inputs.role,
      });

      return {
        success: true,
        role: { id: roleId, targetUserId: inputs.targetUserId, role: inputs.role },
        digest: txResult?.digest || null,
      };
    } catch (err) {
      if (err === 'notFound') throw 'notFound';
      if (err === 'forbidden') throw 'forbidden';
      sails.log.error('[assign-role]', err.message || err);
      this.res.status(err.message?.includes('signature') || err.message?.includes('nonce') ? 400 : 500);
      return { success: false, error: err.message || String(err) };
    }
  },
};
