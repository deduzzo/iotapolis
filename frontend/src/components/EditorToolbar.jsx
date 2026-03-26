import { useState, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  Bold, Italic, Strikethrough, Code, Link2,
  Heading1, Heading2, Heading3, Quote, Minus,
  List, ListOrdered, CheckSquare,
  FileCode2, Image, Table2,
  Smile, AtSign,
  Undo2, Redo2,
} from 'lucide-react';
import ImageInsertPopover from './ImageInsertPopover';
import EmojiPickerPopover from './EmojiPickerPopover';
import { useTranslation } from 'react-i18next';

function ToolbarButton({ icon: Icon, label, isActive, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className="p-1.5 rounded-md transition-colors disabled:opacity-30"
      style={{
        background: isActive ? 'var(--color-primary)' : 'transparent',
        color: isActive ? 'var(--color-background)' : 'var(--color-text-muted)',
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = 'var(--color-surface-hover, rgba(255,255,255,0.08))';
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = 'transparent';
      }}
    >
      <Icon size={15} />
    </button>
  );
}

function Separator() {
  return <div className="w-px h-5 mx-0.5" style={{ background: 'var(--color-border)' }} />;
}

export default function EditorToolbar({ editor }) {
  const { t } = useTranslation();
  const [showImagePopover, setShowImagePopover] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const imageRef = useRef(null);
  const emojiRef = useRef(null);

  if (!editor) return null;

  function setLink() {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL:', previousUrl || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  }

  function insertTable() {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }

  function handleImageInsert({ src, alt }) {
    editor.chain().focus().setImage({ src, alt }).run();
  }

  function handleEmojiSelect(emoji) {
    editor.chain().focus().insertContent(emoji).run();
  }

  function triggerMention() {
    editor.chain().focus().insertContent('@').run();
  }

  return (
    <div
      className="flex items-center gap-0.5 px-2 py-1.5 border-b flex-wrap"
      style={{ borderColor: 'var(--color-border)' }}
    >
      {/* Text formatting */}
      <ToolbarButton icon={Bold} label="Grassetto (Ctrl+B)" isActive={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} />
      <ToolbarButton icon={Italic} label="Corsivo (Ctrl+I)" isActive={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} />
      <ToolbarButton icon={Strikethrough} label="Barrato" isActive={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} />
      <ToolbarButton icon={Code} label="Codice inline" isActive={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()} />
      <ToolbarButton icon={Link2} label="Link (Ctrl+K)" isActive={editor.isActive('link')} onClick={setLink} />

      <Separator />

      {/* Headings */}
      <ToolbarButton icon={Heading1} label="Titolo 1" isActive={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} />
      <ToolbarButton icon={Heading2} label="Titolo 2" isActive={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
      <ToolbarButton icon={Heading3} label="Titolo 3" isActive={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />

      <Separator />

      {/* Structure */}
      <ToolbarButton icon={Quote} label="Citazione" isActive={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
      <ToolbarButton icon={Minus} label="Separatore" onClick={() => editor.chain().focus().setHorizontalRule().run()} />

      <Separator />

      {/* Lists */}
      <ToolbarButton icon={List} label="Lista puntata" isActive={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} />
      <ToolbarButton icon={ListOrdered} label="Lista numerata" isActive={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
      <ToolbarButton icon={CheckSquare} label="Checklist" isActive={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()} />

      <Separator />

      {/* Code block */}
      <ToolbarButton icon={FileCode2} label="Blocco codice" isActive={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()} />

      {/* Image */}
      <div className="relative" ref={imageRef}>
        <ToolbarButton icon={Image} label="Immagine" onClick={() => setShowImagePopover((v) => !v)} />
        <AnimatePresence>
          {showImagePopover && (
            <ImageInsertPopover
              onInsert={handleImageInsert}
              onClose={() => setShowImagePopover(false)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Table */}
      <ToolbarButton icon={Table2} label="Tabella" onClick={insertTable} />

      <Separator />

      {/* Emoji */}
      <div className="relative" ref={emojiRef}>
        <ToolbarButton icon={Smile} label="Emoji" onClick={() => setShowEmojiPicker((v) => !v)} />
        <AnimatePresence>
          {showEmojiPicker && (
            <EmojiPickerPopover
              onSelect={handleEmojiSelect}
              onClose={() => setShowEmojiPicker(false)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Mention */}
      <ToolbarButton icon={AtSign} label="Menziona utente" onClick={triggerMention} />

      <Separator />

      {/* Undo/Redo */}
      <ToolbarButton icon={Undo2} label="Annulla" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} />
      <ToolbarButton icon={Redo2} label="Ripeti" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} />
    </div>
  );
}
