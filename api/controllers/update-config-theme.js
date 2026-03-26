const db = require('../utility/db');
const ForumTags = require('../enums/ForumTags');

module.exports = {
  friendlyName: 'Update config theme',
  description: 'Update the forum theme configuration (admin only).',

  inputs: {
    baseTheme: { type: 'string', required: true },
    overrides: { type: 'ref', defaultsTo: {} },
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
  },

  fn: async function (inputs) {
    try {
      const { userId } = await sails.helpers.verifySignature(this.req.body);

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

      const configId = 'CONFIG_theme';

      // Get existing config to determine version
      const Config = db.getModel('config');
      const existing = Config.findOne({ id: configId });
      const newVersion = existing ? (existing.version || 1) + 1 : 1;

      // Publish to blockchain
      const ForumManager = require('../utility/ForumManager');
      const txResult = await ForumManager.publishToChain(ForumTags.FORUM_CONFIG, configId, {
        id: configId,
        type: 'theme',
        baseTheme: inputs.baseTheme,
        overrides: inputs.overrides,
        authorId: userId,
        nonce: inputs.nonce,
        version: newVersion,
        createdAt: inputs.createdAt,
      });

      // Cache (upsert)
      const overridesStr = typeof inputs.overrides === 'string'
        ? inputs.overrides
        : JSON.stringify(inputs.overrides);

      if (existing) {
        Config.update(configId, {
          baseTheme: inputs.baseTheme,
          overrides: overridesStr,
          authorId: userId,
          version: newVersion,
        });
      } else {
        Config.create({
          id: configId,
          type: 'theme',
          baseTheme: inputs.baseTheme,
          overrides: overridesStr,
          authorId: userId,
          version: newVersion,
          createdAt: inputs.createdAt,
        });
      }

      // Broadcast
      await sails.helpers.broadcastEvent('dataChanged', {
        entity: 'config',
        action: 'themeUpdated',
        label: inputs.baseTheme,
        version: newVersion,
      });

      return {
        success: true,
        config: { id: configId, baseTheme: inputs.baseTheme, version: newVersion },
        digest: txResult?.digest || null,
      };
    } catch (err) {
      if (err === 'forbidden') throw 'forbidden';
      sails.log.error('[update-config-theme]', err.message || err);
      this.res.status(err.message?.includes('signature') || err.message?.includes('nonce') ? 400 : 500);
      return { success: false, error: err.message || String(err) };
    }
  },
};
