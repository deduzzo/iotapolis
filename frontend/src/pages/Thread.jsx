import { useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Clock, Edit3, Lock } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { api } from '../api/endpoints';
import { useIdentity } from '../hooks/useIdentity';
import PostCard from '../components/PostCard';
import NestedReplies from '../components/NestedReplies';
import MarkdownEditor from '../components/MarkdownEditor';
import MarkdownRender from '../components/MarkdownRender';
import VoteButtons from '../components/VoteButtons';
import IdentityBadge from '../components/IdentityBadge';
import EditHistory from '../components/EditHistory';
import LoadingSpinner from '../components/LoadingSpinner';

function formatDate(dateStr) {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleString();
}

export default function Thread() {
  const { id } = useParams();
  const { identity, signAndSend } = useIdentity();

  const { data, loading, error, reload } = useApi(
    () => api.getThread(id),
    [id],
    ['post', 'thread'],
  );

  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyToId, setReplyToId] = useState(null);

  /* Edit history modal */
  const [historyTarget, setHistoryTarget] = useState(null);

  const thread = data?.thread || data;
  const posts = data?.posts || [];

  const handleVote = useCallback(
    async (postId, direction) => {
      if (!identity) return;
      try {
        await signAndSend(`/api/v1/post/${postId}/vote`, 'POST', { direction });
        reload();
      } catch (err) {
        console.error('Vote failed:', err);
      }
    },
    [identity, signAndSend, reload],
  );

  const handleReply = useCallback(
    async (parentId) => {
      setReplyToId(parentId);
    },
    [],
  );

  const submitReply = useCallback(
    async (content, parentId = null) => {
      if (!identity || !content.trim()) return;
      setSubmitting(true);
      try {
        const res = await signAndSend('/api/v1/post', 'POST', {
          threadId: id,
          parentId,
          content: content.trim(),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to post');
        }
        setReplyContent('');
        setReplyToId(null);
        reload();
      } catch (err) {
        console.error('Reply failed:', err);
      } finally {
        setSubmitting(false);
      }
    },
    [identity, signAndSend, id, reload],
  );

  if (loading) {
    return <LoadingSpinner size={32} className="min-h-[40vh]" />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p style={{ color: 'var(--color-danger)' }}>{error}</p>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p style={{ color: 'var(--color-text-muted)' }}>Thread not found</p>
      </div>
    );
  }

  const isLocked = thread.locked;
  const currentUserId = identity?.userId || null;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav
        className="flex items-center gap-2 text-sm mb-4 flex-wrap"
        style={{ color: 'var(--color-text-muted)' }}
      >
        <Link
          to="/"
          className="flex items-center gap-1 hover:underline"
          style={{ color: 'var(--color-primary)' }}
        >
          <Home size={14} />
          Home
        </Link>
        <span>/</span>
        {thread.categoryId && (
          <>
            <Link
              to={`/c/${thread.categoryId}`}
              className="hover:underline"
              style={{ color: 'var(--color-primary)' }}
            >
              {thread.categoryName || 'Category'}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="truncate">{thread.title}</span>
      </nav>

      {/* OP (original post) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card mb-6"
      >
        <div className="flex items-start gap-4">
          {/* Votes */}
          <VoteButtons
            postId={thread.id}
            score={thread.score ?? 0}
            userVote={thread.userVote ?? 0}
            onVote={handleVote}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {isLocked && (
                <span
                  className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: 'var(--color-warning)',
                    color: 'var(--color-background)',
                  }}
                >
                  <Lock size={10} />
                  Locked
                </span>
              )}
              <h1
                className="text-xl md:text-2xl font-bold"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {thread.title}
              </h1>
            </div>

            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <IdentityBadge
                userId={thread.authorId}
                username={thread.authorUsername || thread.authorName}
                size="sm"
              />
              <span
                className="flex items-center gap-1 text-xs"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <Clock size={12} />
                {formatDate(thread.createdAt)}
              </span>
              {thread.version > 1 && (
                <button
                  onClick={() =>
                    setHistoryTarget({ entityType: 'thread', entityId: thread.id })
                  }
                  className="flex items-center gap-1 text-xs hover:underline"
                  style={{ color: 'var(--color-warning)' }}
                >
                  <Edit3 size={12} />
                  Modified {formatDate(thread.updatedAt)}
                </button>
              )}
            </div>

            <div className="prose-sm">
              <MarkdownRender content={thread.content || ''} />
            </div>

            {currentUserId && currentUserId === thread.authorId && (
              <div className="mt-4 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <button
                  className="flex items-center gap-1 text-xs hover:underline"
                  style={{ color: 'var(--color-primary)' }}
                >
                  <Edit3 size={12} />
                  Edit
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Replies */}
      <div className="mb-6">
        <h2
          className="text-lg font-bold mb-4"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-muted)' }}
        >
          Replies ({posts.length})
        </h2>

        <NestedReplies
          posts={posts}
          parentId={null}
          depth={0}
          onReply={handleReply}
          onVote={handleVote}
          currentUserId={currentUserId}
          threadLocked={isLocked}
          onShowHistory={(entityId) =>
            setHistoryTarget({ entityType: 'post', entityId })
          }
          replyToId={replyToId}
          onSubmitReply={submitReply}
          onCancelReply={() => setReplyToId(null)}
        />
      </div>

      {/* Reply form (top-level) */}
      {identity && !isLocked && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card"
        >
          <h3
            className="text-sm font-semibold mb-3"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Post a Reply
          </h3>
          <MarkdownEditor
            value={replyContent}
            onChange={setReplyContent}
            placeholder="Write your reply..."
          />
          <div className="flex justify-end mt-3">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => submitReply(replyContent)}
              disabled={submitting || !replyContent.trim()}
              className="btn-primary px-5 py-2 rounded-xl text-sm disabled:opacity-40"
            >
              {submitting ? 'Posting...' : 'Post Reply'}
            </motion.button>
          </div>
        </motion.div>
      )}

      {isLocked && (
        <div
          className="glass-card text-center text-sm"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <Lock size={18} className="inline mr-2" />
          This thread is locked. No new replies can be posted.
        </div>
      )}

      {/* Edit history modal */}
      {historyTarget && (
        <EditHistory
          entityType={historyTarget.entityType}
          entityId={historyTarget.entityId}
          isOpen={true}
          onClose={() => setHistoryTarget(null)}
        />
      )}
    </div>
  );
}
