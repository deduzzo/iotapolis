import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Edit3, Clock } from 'lucide-react';
import IdentityBadge from './IdentityBadge';
import MarkdownRender from './MarkdownRender';
import MarkdownEditor from './MarkdownEditor';
import VoteButtons from './VoteButtons';

function formatDate(dateStr) {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  const now = Date.now();
  const diff = now - d.getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  return d.toLocaleString();
}

export default function PostCard({
  post,
  onReply,
  onVote,
  currentUserId,
  threadLocked,
  onShowHistory,
  replyToId,
  onSubmitReply,
  onCancelReply,
}) {
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isReplying = replyToId === post.id;

  async function handleSubmitInlineReply() {
    if (!replyContent.trim()) return;
    setSubmitting(true);
    try {
      await onSubmitReply(replyContent, post.id);
      setReplyContent('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-card"
      style={{
        borderLeft: '3px solid var(--color-primary)',
      }}
    >
      <div className="flex gap-3">
        {/* Vote buttons */}
        <VoteButtons
          postId={post.id}
          score={post.score ?? 0}
          userVote={post.userVote ?? 0}
          onVote={onVote}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Author + time */}
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <IdentityBadge
              userId={post.authorId}
              username={post.authorUsername || post.authorName}
              showUsername={!!post.authorShowUsername}
              size="sm"
            />
            <span
              className="flex items-center gap-1 text-xs"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <Clock size={12} />
              {formatDate(post.createdAt)}
            </span>
            {post.version > 1 && (
              <button
                onClick={() => onShowHistory?.(post.id)}
                className="flex items-center gap-1 text-xs hover:underline"
                style={{ color: 'var(--color-warning)' }}
              >
                <Edit3 size={12} />
                Modified
              </button>
            )}
          </div>

          {/* Markdown content */}
          <div className="mb-3">
            <MarkdownRender content={post.content || ''} />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {!threadLocked && currentUserId && (
              <button
                onClick={() => onReply(post.id)}
                className="flex items-center gap-1 text-xs hover:underline transition-colors"
                style={{ color: 'var(--color-primary)' }}
              >
                <MessageSquare size={12} />
                Reply
              </button>
            )}
            {currentUserId && currentUserId === post.authorId && (
              <button
                className="flex items-center gap-1 text-xs hover:underline transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <Edit3 size={12} />
                Edit
              </button>
            )}
          </div>

          {/* Inline reply editor */}
          {isReplying && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <MarkdownEditor
                value={replyContent}
                onChange={setReplyContent}
                placeholder="Write your reply..."
              />
              <div className="flex items-center gap-2 mt-2 justify-end">
                <button
                  onClick={onCancelReply}
                  className="px-3 py-1.5 rounded-lg text-xs border transition-colors hover:bg-white/5"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSubmitInlineReply}
                  disabled={submitting || !replyContent.trim()}
                  className="btn-primary px-4 py-1.5 rounded-lg text-xs disabled:opacity-40"
                >
                  {submitting ? 'Posting...' : 'Reply'}
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
