const db = require('../utility/db');
const ForumTags = require('../enums/ForumTags');

module.exports = {
  friendlyName: 'Edit thread',
  description: 'Edit an existing thread (creates a new version on-chain).',

  inputs: {
    title: { type: 'string', required: true },
    content: { type: 'string', required: true },
    authorId: { type: 'string', required: true },
    encrypted: { type: 'boolean', defaultsTo: false },
    encryptedTitle: { type: 'boolean', defaultsTo: false },
    keyBundle: { type: 'ref', defaultsTo: null },
    nonce: { type: 'string', required: true },
    version: { type: 'number', required: true },
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
      const threadId = this.req.params.id;

      // Check thread exists
      const Threads = db.getModel('threads');
      const thread = Threads.findOne({ id: threadId });
      if (!thread) {
        throw 'notFound';
      }

      // Check author matches
      if (thread.authorId !== userId) {
        throw 'forbidden';
      }

      const newVersion = (thread.version || 1) + 1;

      // Publish to blockchain
      const ForumManager = require('../utility/ForumManager');
      const txResult = await ForumManager.publishToChain(ForumTags.FORUM_THREAD, threadId, {
        id: threadId,
        categoryId: thread.categoryId,
        title: inputs.title,
        content: inputs.content,
        authorId: userId,
        encrypted: inputs.encrypted,
        encryptedTitle: inputs.encryptedTitle,
        keyBundle: inputs.keyBundle,
        nonce: inputs.nonce,
        version: newVersion,
        createdAt: inputs.createdAt,
      });

      // Update cache
      const updated = Threads.update(threadId, {
        title: inputs.title,
        content: inputs.content,
        encrypted: inputs.encrypted,
        encryptedTitle: inputs.encryptedTitle,
        keyBundle: inputs.keyBundle ? JSON.stringify(inputs.keyBundle) : thread.keyBundle,
        version: newVersion,
      });

      // Update search index
      if (!inputs.encrypted) {
        db.updateFtsIndex(threadId, inputs.title, inputs.content);
      }

      // Broadcast
      await sails.helpers.broadcastEvent('dataChanged', {
        action: 'threadEdited',
        label: inputs.title,
        threadId,
        version: newVersion,
      });

      return {
        success: true,
        thread: updated,
        digest: txResult?.digest || null,
      };
    } catch (err) {
      if (err === 'notFound') throw 'notFound';
      if (err === 'forbidden') throw 'forbidden';
      sails.log.error('[edit-thread]', err.message || err);
      this.res.status(err.message?.includes('signature') || err.message?.includes('nonce') ? 400 : 500);
      return { success: false, error: err.message || String(err) };
    }
  },
};
