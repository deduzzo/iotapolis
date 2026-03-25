import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Pin, Lock, MessageSquare, Clock } from 'lucide-react';
import IdentityBadge from './IdentityBadge';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

function formatTime(dateStr) {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  const now = Date.now();
  const diff = now - d.getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  return d.toLocaleDateString();
}

export default function ThreadList({ threads }) {
  if (!threads || threads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <MessageSquare size={40} style={{ color: 'var(--color-text-muted)' }} />
        <p className="mt-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          No threads yet. Be the first to start a discussion!
        </p>
      </div>
    );
  }

  // Sort: pinned first, then by lastActivity
  const sorted = [...threads].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  });

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-3"
    >
      <AnimatePresence>
        {sorted.map((thread) => (
          <motion.div key={thread.id} variants={item} layout>
            <Link to={`/t/${thread.id}`}>
              <motion.div
                whileHover={{ scale: 1.01, x: 4 }}
                className="glass-card cursor-pointer hover:neon-border transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {thread.pinned && (
                        <span
                          className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: 'var(--color-success)',
                            color: 'var(--color-background)',
                          }}
                        >
                          <Pin size={10} />
                          Pinned
                        </span>
                      )}
                      {thread.locked && (
                        <span
                          className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: 'var(--color-warning)',
                            color: 'var(--color-background)',
                          }}
                        >
                          <Lock size={10} />
                          Locked
                        </span>
                      )}
                      <h3 className="font-semibold text-sm md:text-base truncate">
                        {thread.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <IdentityBadge
                        userId={thread.authorId}
                        username={thread.authorName}
                        size="sm"
                      />
                      <span
                        className="flex items-center gap-1 text-xs"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        <MessageSquare size={12} />
                        {thread.postCount ?? 0}
                      </span>
                      <span
                        className="flex items-center gap-1 text-xs"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        <Clock size={12} />
                        {formatTime(thread.lastActivity || thread.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
