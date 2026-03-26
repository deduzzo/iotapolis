import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { motion } from 'framer-motion';

const MentionList = forwardRef(({ items, command }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => setSelectedIndex(0), [items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((i) => (i + items.length - 1) % items.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((i) => (i + 1) % items.length);
        return true;
      }
      if (event.key === 'Enter') {
        if (items[selectedIndex]) command(items[selectedIndex]);
        return true;
      }
      return false;
    },
  }));

  if (!items.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden shadow-lg border"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        minWidth: 180,
      }}
    >
      {items.map((item, index) => (
        <button
          key={item.id || index}
          onClick={() => command(item)}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors"
          style={{
            background: index === selectedIndex ? 'var(--color-surface-hover, rgba(255,255,255,0.05))' : 'transparent',
            color: 'var(--color-text)',
          }}
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: `hsl(${(item.label || '').charCodeAt(0) * 7 % 360}, 70%, 50%)` }}
          >
            {(item.label?.[0] || '?').toUpperCase()}
          </div>
          <span className="truncate">{item.label || item.id}</span>
        </button>
      ))}
    </motion.div>
  );
});

MentionList.displayName = 'MentionList';
export default MentionList;
