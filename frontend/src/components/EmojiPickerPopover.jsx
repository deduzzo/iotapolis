import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

export default function EmojiPickerPopover({ onSelect, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute z-50 top-full right-0 mt-2"
    >
      <Picker
        data={data}
        onEmojiSelect={(emoji) => {
          onSelect(emoji.native);
          onClose();
        }}
        theme="dark"
        previewPosition="none"
        skinTonePosition="none"
        maxFrequentRows={2}
        perLine={8}
      />
    </motion.div>
  );
}
