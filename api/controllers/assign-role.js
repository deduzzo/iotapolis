const db = require('../utility/db');
const ForumTags = require('../enums/ForumTags');

module.exports = {
  friendlyName: 'Assign role',
  description: 'Assign a role to a user (admin only).',

  inputs: {
    targetUserId: { type: 'string', required: true },
    role: { type: 'string', required: true },
    categoryId: { type: 'string', allowNull: true },
    grantedBy: { type: 'string', required: true },
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

      if (userId !== inputs.grantedBy) {
        this.res.status(403);
        return { success: false, error: 'Author mismatch' };
      }

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

      const roleId = `ROLE_${inputs.targetUserId}_${Date.now()}`;

      // Publish to blockchain
      const ForumManager = require('../utility/ForumManager');
      const txResult = await ForumManager.publishToChain(ForumTags.FORUM_ROLE, roleId, {
        targetUserId: inputs.targetUserId,
        role: inputs.role,
        categoryId: inputs.categoryId || null,
        grantedBy: userId,
        nonce: inputs.nonce,
        createdAt: inputs.createdAt,
      });

      // Cache role record
      const Roles = db.getModel('roles');
      Roles.create({
        id: roleId,
        targetUserId: inputs.targetUserId,
        role: inputs.role,
        categoryId: inputs.categoryId || null,
        grantedBy: userId,
        createdAt: inputs.createdAt,
      });

      // Update user role in cache
      Users.update(inputs.targetUserId, { role: inputs.role });

      // Broadcast
      await sails.helpers.broadcastEvent('dataChanged', {
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
