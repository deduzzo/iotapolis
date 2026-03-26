import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const sizeMap = {
  sm: { avatar: 'w-6 h-6 text-xs', text: 'text-xs' },
  md: { avatar: 'w-8 h-8 text-sm', text: 'text-sm' },
  lg: { avatar: 'w-10 h-10 text-base', text: 'text-base' },
};

/**
 * Deterministic color from a string (userId).
 */
function avatarGradient(userId) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h1 = Math.abs(hash % 360);
  const h2 = (h1 + 60) % 360;
  return `linear-gradient(135deg, hsl(${h1}, 80%, 55%), hsl(${h2}, 80%, 45%))`;
}

/**
 * Inline identity badge: colored avatar circle + username.
 * Shows truncated userId on hover tooltip.
 *
 * Props:
 *   userId   — full USR_XXXXXXXXXXXXXXXX
 *   username — display name (optional, falls back to truncated userId)
 *   size     — 'sm' | 'md' | 'lg'
 */
/**
 * Props:
 *   userId       — full USR_XXXXXXXXXXXXXXXX
 *   username     — display name (optional)
 *   showUsername  — if false, always show placeholder even if username exists (privacy)
 *   size         — 'sm' | 'md' | 'lg'
 */
export default function IdentityBadge({ userId, username, showUsername = true, size = 'md' }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const s = sizeMap[size] || sizeMap.md;

  const displayName = (showUsername && username) ? username : (userId?.slice(0, 12) || '???');
  const initial = (username?.[0] || userId?.[4] || '?').toUpperCase();
  const truncatedId = userId ? `${userId.slice(0, 12)}...` : '';

  return (
    <Link
      to={userId ? `/u/${userId}` : '#'}
      className="inline-flex items-center gap-1.5 group relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Avatar */}
      <div
        className={`${s.avatar} rounded-full flex items-center justify-center font-bold text-white shrink-0`}
        style={{ background: avatarGradient(userId || 'default') }}
      >
        {initial}
      </div>

      {/* Username */}
      <span className={`${s.text} font-medium group-hover:underline truncate`}>
        {displayName}
      </span>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && userId && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 -bottom-8 z-50 px-2 py-1 rounded-lg text-xs font-mono whitespace-nowrap pointer-events-none"
            style={{
              background: 'var(--color-surface)',
              color: 'var(--color-text-muted)',
              border: '1px solid var(--color-border)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            {truncatedId}
          </motion.div>
        )}
      </AnimatePresence>
    </Link>
  );
}
