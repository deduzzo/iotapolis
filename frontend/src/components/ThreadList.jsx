import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Pin, Lock, MessageSquare, Clock } from 'lucide-react';
import IdentityBadge from './IdentityBadge';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
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

function sortThreads(threads) {
  return [...threads].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  });
}

/* ═══════════════════════════════════════════════════════════════════
   IPB Table layout
   ═══════════════════════════════════════════════════════════════════ */
function TableLayout({ sorted, freshThreadIds }) {
  return (
    <motion.div
      variants={container} initial="hidden" animate="show"
      className="rounded-xl overflow-hidden border"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
    >
      <div
        className="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_100px_180px] gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider"
        style={{ background: 'var(--color-primary)', color: 'var(--color-background)' }}
      >
        <span>Topic</span>
        <span className="text-center hidden md:block">Replies</span>
        <span className="hidden md:block">Ultimo post</span>
      </div>

      <AnimatePresence>
        {sorted.map((thread, idx) => {
          const isFresh = freshThreadIds?.has(thread.id);
          return (
            <motion.div key={thread.id} variants={item} layout>
              <Link to={`/t/${thread.id}`}>
                <div
                  className="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_100px_180px] gap-2 px-4 py-3 items-center cursor-pointer transition-colors"
                  style={{
                    borderBottom: idx < sorted.length - 1 ? '1px solid var(--color-border)' : 'none',
                    background: isFresh ? 'rgba(0,255,136,0.04)' : 'transparent',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-hover, rgba(255,255,255,0.03))'}
                  onMouseLeave={(e) => e.currentTarget.style.background = isFresh ? 'rgba(0,255,136,0.04)' : 'transparent'}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ background: `hsl(${(thread.authorId || '').charCodeAt(4) * 7 % 360}, 65%, 50%)` }}
                    >
                      {(thread.authorName?.[0] || thread.authorId?.[4] || '?').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {thread.pinned && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full shrink-0"
                            style={{ backgroundColor: 'var(--color-success)', color: 'var(--color-background)' }}>
                            <Pin size={8} /> Pin
                          </span>
                        )}
                        {thread.locked && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full shrink-0"
                            style={{ backgroundColor: 'var(--color-warning)', color: 'var(--color-background)' }}>
                            <Lock size={8} />
                          </span>
                        )}
                        <h3 className="font-semibold text-sm truncate" style={{ color: 'var(--color-text)' }}>{thread.title}</h3>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <IdentityBadge userId={thread.authorId} username={thread.authorName} size="sm" asLink={false} />
                        <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{formatTime(thread.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-center hidden md:block">
                    <div className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{thread.postCount ?? 0}</div>
                    <div className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>replies</div>
                  </div>
                  <div className="hidden md:flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                      style={{ background: `hsl(${(thread.lastAuthorId || thread.authorId || '').charCodeAt(4) * 11 % 360}, 60%, 50%)` }}>
                      {(thread.lastAuthorName?.[0] || thread.authorName?.[0] || '?').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                        By {thread.lastAuthorName || thread.authorName || thread.authorId?.slice(0, 10)}
                      </p>
                      <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                        <Clock size={10} className="inline mr-0.5" />
                        {formatTime(thread.lastActivity || thread.lastPostAt || thread.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs md:hidden" style={{ color: 'var(--color-text-muted)' }}>
                    <MessageSquare size={12} />{thread.postCount ?? 0}
                    <Clock size={12} />{formatTime(thread.lastActivity || thread.createdAt)}
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Default cards layout
   ═══════════════════════════════════════════════════════════════════ */
function CardsLayout({ sorted, freshThreadIds }) {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
      <AnimatePresence>
        {sorted.map((thread) => {
          const isFresh = freshThreadIds?.has(thread.id);
          return (
            <motion.div key={thread.id} variants={item} layout>
              <Link to={`/t/${thread.id}`}>
                <motion.div
                  whileHover={{ scale: 1.01, x: 4 }}
                  className="glass-card cursor-pointer hover:neon-border"
                  style={{
                    boxShadow: isFresh ? '0 0 12px rgba(0,255,136,0.15)' : undefined,
                    borderColor: isFresh ? 'var(--color-success)' : undefined,
                    transition: 'box-shadow 0.6s ease, border-color 0.6s ease',
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {thread.pinned && (
                          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full shrink-0"
                            style={{ backgroundColor: 'var(--color-success)', color: 'var(--color-background)' }}>
                            <Pin size={10} /> Pinned
                          </span>
                        )}
                        {thread.locked && (
                          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full shrink-0"
                            style={{ backgroundColor: 'var(--color-warning)', color: 'var(--color-background)' }}>
                            <Lock size={10} /> Locked
                          </span>
                        )}
                        <h3 className="font-semibold text-sm md:text-base truncate">{thread.title}</h3>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <IdentityBadge userId={thread.authorId} username={thread.authorName} size="sm" asLink={false} />
                        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          <MessageSquare size={12} />{thread.postCount ?? 0}
                        </span>
                        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          <Clock size={12} />{formatTime(thread.lastActivity || thread.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Main export
   ═══════════════════════════════════════════════════════════════════ */
export default function ThreadList({ threads, freshThreadIds, layout = 'cards' }) {
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

  const sorted = sortThreads(threads);

  return layout === 'table'
    ? <TableLayout sorted={sorted} freshThreadIds={freshThreadIds} />
    : <CardsLayout sorted={sorted} freshThreadIds={freshThreadIds} />;
}
