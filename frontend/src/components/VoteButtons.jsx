import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown } from 'lucide-react';

export default function VoteButtons({ postId, score, userVote, onVote }) {
  const upActive = userVote === 1;
  const downActive = userVote === -1;

  return (
    <div className="flex flex-col items-center gap-0.5 shrink-0 select-none">
      {/* Upvote */}
      <motion.button
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.85 }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onVote(postId, 1);
        }}
        className="p-1 rounded-lg transition-colors"
        style={{
          color: upActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
          backgroundColor: upActive ? 'rgba(0,240,255,0.1)' : 'transparent',
        }}
        aria-label="Upvote"
      >
        <ChevronUp size={18} />
      </motion.button>

      {/* Score */}
      <AnimatePresence mode="wait">
        <motion.span
          key={score}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.2 }}
          className="text-sm font-bold tabular-nums"
          style={{
            color:
              score > 0
                ? 'var(--color-primary)'
                : score < 0
                  ? 'var(--color-danger)'
                  : 'var(--color-text-muted)',
          }}
        >
          {score}
        </motion.span>
      </AnimatePresence>

      {/* Downvote */}
      <motion.button
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.85 }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onVote(postId, -1);
        }}
        className="p-1 rounded-lg transition-colors"
        style={{
          color: downActive ? 'var(--color-danger)' : 'var(--color-text-muted)',
          backgroundColor: downActive ? 'rgba(255,68,68,0.1)' : 'transparent',
        }}
        aria-label="Downvote"
      >
        <ChevronDown size={18} />
      </motion.button>
    </div>
  );
}
