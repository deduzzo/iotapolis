const db = require('../utility/db');
const ForumTags = require('../enums/ForumTags');

module.exports = {
  friendlyName: 'Edit post',
  description: 'Edit an existing post (creates a new version on-chain).',

  inputs: {
    content: { type: 'string', required: true },
    authorId: { type: 'string', required: true },
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
      const postId = this.req.params.id;

      // Check post exists
      const Posts = db.getModel('posts');
      const post = Posts.findOne({ id: postId });
      if (!post) {
        throw 'notFound';
      }

      // Check author matches
      if (post.authorId !== userId) {
        throw 'forbidden';
      }

      // Increment version
      const newVersion = (post.version || 1) + 1;

      // Publish to blockchain
      const ForumManager = require('../utility/ForumManager');
      const txResult = await ForumManager.publishToChain(ForumTags.FORUM_POST, postId, {
        id: postId,
        threadId: post.threadId,
        parentId: post.parentId,
        content: inputs.content,
        authorId: userId,
        nonce: inputs.nonce,
        version: newVersion,
        createdAt: inputs.createdAt,
      });

      // Update cache
      const updated = Posts.update(postId, {
        content: inputs.content,
        version: newVersion,
      });

      // Update search index
      db.updateFtsIndex(postId, '', inputs.content);

      // Broadcast
      await sails.helpers.broadcastEvent('dataChanged', {
        action: 'postEdited',
        label: postId,
        threadId: post.threadId,
        postId,
        version: newVersion,
      });

      return {
        success: true,
        post: updated,
        digest: txResult?.digest || null,
      };
    } catch (err) {
      if (err === 'notFound') throw 'notFound';
      if (err === 'forbidden') throw 'forbidden';
      sails.log.error('[edit-post]', err.message || err);
      this.res.status(err.message?.includes('signature') || err.message?.includes('nonce') ? 400 : 500);
      return { success: false, error: err.message || String(err) };
    }
  },
};
