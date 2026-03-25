import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Bold, Italic, Link2, Code, Quote } from 'lucide-react';
import MarkdownRender from './MarkdownRender';

const toolbarActions = [
  { icon: Bold, label: 'Bold', prefix: '**', suffix: '**', placeholder: 'bold text' },
  { icon: Italic, label: 'Italic', prefix: '_', suffix: '_', placeholder: 'italic text' },
  { icon: Link2, label: 'Link', prefix: '[', suffix: '](url)', placeholder: 'link text' },
  { icon: Code, label: 'Code', prefix: '`', suffix: '`', placeholder: 'code' },
  { icon: Quote, label: 'Quote', prefix: '> ', suffix: '', placeholder: 'quote' },
];

export default function MarkdownEditor({ value, onChange, placeholder }) {
  const [tab, setTab] = useState('write');
  const textareaRef = useRef(null);

  const insertMarkdown = useCallback(
    (action) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = value.slice(start, end);
      const text = selected || action.placeholder;
      const newText =
        value.slice(0, start) +
        action.prefix +
        text +
        action.suffix +
        value.slice(end);

      onChange(newText);

      // Restore cursor position after React re-render
      requestAnimationFrame(() => {
        const cursorPos = start + action.prefix.length + text.length;
        textarea.focus();
        textarea.setSelectionRange(
          start + action.prefix.length,
          cursorPos,
        );
      });
    },
    [value, onChange],
  );

  return (
    <div className="glass-card p-0 overflow-hidden">
      {/* Tabs + Toolbar */}
      <div
        className="flex items-center justify-between border-b px-3 py-2 flex-wrap gap-2"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex gap-1">
          {['write', 'preview'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-3 py-1 text-xs font-medium rounded-lg transition-colors capitalize"
              style={{
                backgroundColor:
                  tab === t ? 'var(--color-primary)' : 'transparent',
                color:
                  tab === t
                    ? 'var(--color-background)'
                    : 'var(--color-text-muted)',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'write' && (
          <div className="flex gap-1">
            {toolbarActions.map((action) => (
              <motion.button
                key={action.label}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => insertMarkdown(action)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
                title={action.label}
                type="button"
              >
                <action.icon size={14} />
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 min-h-[120px]">
        {tab === 'write' ? (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || 'Write markdown here...'}
            className="w-full min-h-[120px] bg-transparent outline-none resize-y text-sm font-mono leading-relaxed"
            style={{ color: 'var(--color-text)' }}
          />
        ) : (
          <div className="min-h-[120px] text-sm">
            {value.trim() ? (
              <MarkdownRender content={value} />
            ) : (
              <p style={{ color: 'var(--color-text-muted)' }}>
                Nothing to preview
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
