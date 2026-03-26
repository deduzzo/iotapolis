const db = require('../utility/db');
const ForumTags = require('../enums/ForumTags');

module.exports = {
  friendlyName: 'Create post',
  description: 'Create a new post or reply in a thread.',

  inputs: {
    threadId: { type: 'string', required: true },
    parentId: { type: 'string', allowNull: true },
    content: { type: 'string', required: true },
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
    notFound: { statusCode: 404 },
  },

  fn: async function (inputs) {
    try {
      const { userId } = await sails.helpers.verifySignature(this.req.body);

      // Check user exists and not banned
      const Users = db.getModel('users');
      const user = Users.findOne({ id: userId });
      if (!user) {
        throw 'notFound';
      }
      if (user.role === 'banned') {
        throw 'forbidden';
      }

      // Check thread exists and not locked
      const Threads = db.getModel('threads');
      const thread = Threads.findOne({ id: inputs.threadId });
      if (!thread) {
        throw 'notFound';
      }
      if (thread.locked) {
        this.res.status(403);
        return { success: false, error: 'Thread is locked' };
      }

      // Generate post ID server-side from nonce
      const postId = 'POST_' + inputs.nonce.substring(0, 8);

      // Publish to blockchain (processTransaction handles cache)
      const ForumManager = require('../utility/ForumManager');
      const txResult = await ForumManager.publishToChain(ForumTags.FORUM_POST, postId, {
        id: postId,
        threadId: inputs.threadId,
        parentId: inputs.parentId || null,
        content: inputs.content,
        authorId: userId,
        nonce: inputs.nonce,
        version: 1,
        createdAt: inputs.createdAt,
      });

      if (!txResult || !txResult.success) {
        this.res.status(500);
        return { success: false, error: txResult?.error || 'Blockchain publish failed' };
      }

      // Update thread stats
      const now = Date.now();
      Threads.update(inputs.threadId, {
        postCount: (thread.postCount || 0) + 1,
        lastPostAt: now,
      });

      // Update search index
      db.updateFtsIndex(postId, '', inputs.content);

      // Broadcast
      await sails.helpers.broadcastEvent('dataChanged', {
        entity: 'post',
        action: 'postCreated',
        label: postId,
        threadId: inputs.threadId,
        postId,
      });

      return {
        success: true,
        post: { id: postId },
        digest: txResult?.digest || null,
      };
    } catch (err) {
      if (err === 'notFound') throw 'notFound';
      if (err === 'forbidden') throw 'forbidden';
      sails.log.error('[create-post]', err.message || err);
      this.res.status(err.message?.includes('signature') || err.message?.includes('nonce') ? 400 : 500);
      return { success: false, error: err.message || String(err) };
    }
  },
};
