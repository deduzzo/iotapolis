const db = require('../utility/db');
const ForumTags = require('../enums/ForumTags');

module.exports = {
  friendlyName: 'Vote',
  description: 'Vote on a post (+1 or -1). Mutable — republishing overwrites previous vote.',

  inputs: {
    postId: { type: 'string', required: true },
    vote: { type: 'number', required: true },
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
    notFound: { statusCode: 404 },
  },

  fn: async function (inputs) {
    try {
      const { userId } = await sails.helpers.verifySignature(this.req.body);

      if (userId !== inputs.authorId) {
        this.res.status(403);
        return { success: false, error: 'Author mismatch' };
      }

      // Validate vote value
      if (inputs.vote !== 1 && inputs.vote !== -1) {
        this.res.status(400);
        return { success: false, error: 'Vote must be +1 or -1' };
      }

      // Check post exists
      const Posts = db.getModel('posts');
      const post = Posts.findOne({ id: inputs.postId });
      if (!post) {
        throw 'notFound';
      }

      const voteId = `VOTE_${inputs.postId}_${userId}`;

      // Publish to blockchain
      const ForumManager = require('../utility/ForumManager');
      const txResult = await ForumManager.publishToChain(ForumTags.FORUM_VOTE, voteId, {
        postId: inputs.postId,
        vote: inputs.vote,
        authorId: userId,
        nonce: inputs.nonce,
        version: inputs.version,
        createdAt: inputs.createdAt,
      });

      // Upsert vote in cache
      const Votes = db.getModel('votes');
      const existingVote = Votes.findOne({ postId: inputs.postId, authorId: userId });
      const oldVoteValue = existingVote ? existingVote.vote : 0;

      if (existingVote) {
        Votes.update(existingVote.id, {
          vote: inputs.vote,
          createdAt: inputs.createdAt,
        });
      } else {
        Votes.create({
          id: voteId,
          postId: inputs.postId,
          authorId: userId,
          vote: inputs.vote,
          createdAt: inputs.createdAt,
        });
      }

      // Recalculate post score
      const newScore = (post.score || 0) - oldVoteValue + inputs.vote;
      Posts.update(inputs.postId, { score: newScore });

      // Broadcast
      await sails.helpers.broadcastEvent('dataChanged', {
        action: 'voted',
        label: inputs.postId,
        postId: inputs.postId,
        score: newScore,
      });

      return {
        success: true,
        score: newScore,
        digest: txResult?.digest || null,
      };
    } catch (err) {
      if (err === 'notFound') throw 'notFound';
      sails.log.error('[vote]', err.message || err);
      this.res.status(err.message?.includes('signature') || err.message?.includes('nonce') ? 400 : 500);
      return { success: false, error: err.message || String(err) };
    }
  },
};
