const db = require('../utility/db');
const ForumTags = require('../enums/ForumTags');

module.exports = {
  friendlyName: 'Create thread',
  description: 'Create a new thread in a category.',

  inputs: {
    id: { type: 'string', required: true },
    categoryId: { type: 'string', required: true },
    title: { type: 'string', required: true },
    content: { type: 'string', required: true },
    authorId: { type: 'string', required: true },
    encrypted: { type: 'boolean', defaultsTo: false },
    encryptedTitle: { type: 'boolean', defaultsTo: false },
    keyBundle: { type: 'ref', defaultsTo: null },
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

      // Verify author matches signature
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

      // Check category exists
      const Categories = db.getModel('categories');
      const category = Categories.findOne({ id: inputs.categoryId });
      if (!category) {
        throw 'notFound';
      }

      // Validate thread id format: THR_ + nonce first 8
      const expectedId = 'THR_' + inputs.nonce.substring(0, 8);
      if (inputs.id !== expectedId) {
        this.res.status(400);
        return { success: false, error: 'Invalid thread ID format' };
      }

      // Publish to blockchain
      const ForumManager = require('../utility/ForumManager');
      const txResult = await ForumManager.publishToChain(ForumTags.FORUM_THREAD, inputs.id, {
        id: inputs.id,
        categoryId: inputs.categoryId,
        title: inputs.title,
        content: inputs.content,
        authorId: inputs.authorId,
        encrypted: inputs.encrypted,
        encryptedTitle: inputs.encryptedTitle,
        keyBundle: inputs.keyBundle,
        nonce: inputs.nonce,
        version: 1,
        createdAt: inputs.createdAt,
      });

      // Cache
      const Threads = db.getModel('threads');
      const now = Date.now();
      const thread = Threads.create({
        id: inputs.id,
        categoryId: inputs.categoryId,
        title: inputs.title,
        content: inputs.content,
        authorId: inputs.authorId,
        encrypted: inputs.encrypted,
        encryptedTitle: inputs.encryptedTitle,
        keyBundle: inputs.keyBundle ? JSON.stringify(inputs.keyBundle) : null,
        pinned: false,
        locked: false,
        hidden: false,
        version: 1,
        lastPostAt: now,
        postCount: 0,
        createdAt: inputs.createdAt,
      });

      // Update search index (skip encrypted content)
      if (!inputs.encrypted) {
        db.updateFtsIndex(inputs.id, inputs.title, inputs.content);
      }

      // Broadcast
      await sails.helpers.broadcastEvent('dataChanged', {
        action: 'threadCreated',
        label: inputs.title,
        threadId: inputs.id,
        categoryId: inputs.categoryId,
      });

      return {
        success: true,
        thread,
        digest: txResult?.digest || null,
      };
    } catch (err) {
      if (err === 'notFound') throw 'notFound';
      if (err === 'forbidden') throw 'forbidden';
      if (err === 'badRequest') throw 'badRequest';
      sails.log.error('[create-thread]', err.message || err);
      this.res.status(err.message?.includes('signature') || err.message?.includes('nonce') ? 400 : 500);
      return { success: false, error: err.message || String(err) };
    }
  },
};
