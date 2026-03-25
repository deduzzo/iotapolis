const db = require('../utility/db');
const ForumTags = require('../enums/ForumTags');

module.exports = {
  friendlyName: 'Create post',
  description: 'Create a new post or reply in a thread.',

  inputs: {
    id: { type: 'string', required: true },
    threadId: { type: 'string', required: true },
    parentId: { type: 'string', allowNull: true },
    content: { type: 'string', required: true },
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
    notFound: { statusCode: 404 },
  },

  fn: async function (inputs) {
    try {
      const { userId } = await sails.helpers.verifySignature(this.req.body);

      if (userId !== inputs.authorId) {
        this.res.status(403);
        return { success: false, error: 'Author mismatch' };
      }

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

      // Validate post id format: POST_ + nonce first 8
      const expectedId = 'POST_' + inputs.nonce.substring(0, 8);
      if (inputs.id !== expectedId) {
        this.res.status(400);
        return { success: false, error: 'Invalid post ID format' };
      }

      // Publish to blockchain
      const ForumManager = require('../utility/ForumManager');
      const txResult = await ForumManager.publishToChain(ForumTags.FORUM_POST, inputs.id, {
        id: inputs.id,
        threadId: inputs.threadId,
        parentId: inputs.parentId || null,
        content: inputs.content,
        authorId: inputs.authorId,
        nonce: inputs.nonce,
        version: 1,
        createdAt: inputs.createdAt,
      });

      // Cache post
      const Posts = db.getModel('posts');
      const post = Posts.create({
        id: inputs.id,
        threadId: inputs.threadId,
        parentId: inputs.parentId || null,
        content: inputs.content,
        authorId: inputs.authorId,
        hidden: false,
        version: 1,
        score: 0,
        createdAt: inputs.createdAt,
      });

      // Update thread stats
      const now = Date.now();
      Threads.update(inputs.threadId, {
        postCount: (thread.postCount || 0) + 1,
        lastPostAt: now,
      });

      // Update search index
      db.updateFtsIndex(inputs.id, '', inputs.content);

      // Broadcast
      await sails.helpers.broadcastEvent('dataChanged', {
        action: 'postCreated',
        label: inputs.id,
        threadId: inputs.threadId,
        postId: inputs.id,
      });

      return {
        success: true,
        post,
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
