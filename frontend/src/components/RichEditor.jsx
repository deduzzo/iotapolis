import { useCallback, useEffect, useImperativeHandle, forwardRef } from 'react';
import { useEditor, EditorContent, ReactRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Mention } from '@tiptap/extension-mention';
import { Markdown } from 'tiptap-markdown';
import tippy from 'tippy.js';
import EditorToolbar from './EditorToolbar';
import MentionList from './MentionList';
import ImageNode from './ImageNode';

/**
 * Rich WYSIWYG editor based on Tiptap.
 * Always outputs markdown via tiptap-markdown.
 *
 * Props:
 *   value        — initial markdown content
 *   onChange     — called with markdown string on every change
 *   placeholder  — placeholder text
 *   minHeight    — CSS min-height (default '120px')
 */
const RichEditor = forwardRef(function RichEditor(
  { value = '', onChange, placeholder = 'Scrivi...', minHeight = '120px' },
  ref,
) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: { HTMLAttributes: { class: 'code-block' } },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'editor-link' },
      }),
      Placeholder.configure({ placeholder }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
      ImageNode,
      Markdown.configure({
        html: false,
        transformPastedText: true,
        transformCopiedText: true,
      }),
      Mention.configure({
        HTMLAttributes: { class: 'mention' },
        suggestion: {
          items: async ({ query }) => {
            if (!query || query.length < 1) return [];
            try {
              const res = await fetch(`/api/v1/search?q=${encodeURIComponent(query)}`);
              const data = await res.json();
              const users = (data.results || []).filter((r) => r.type === 'user');
              return users.slice(0, 8).map((u) => ({
                id: u.id,
                label: u.title || u.id?.slice(0, 12),
              }));
            } catch {
              return [];
            }
          },
          render: () => {
            let component;
            let popup;

            return {
              onStart: (props) => {
                component = new ReactRenderer(MentionList, {
                  props,
                  editor: props.editor,
                });
                if (!props.clientRect) return;
                popup = tippy('body', {
                  getReferenceClientRect: props.clientRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: 'manual',
                  placement: 'bottom-start',
                });
              },
              onUpdate(props) {
                component?.updateProps(props);
                if (props.clientRect) {
                  popup?.[0]?.setProps({ getReferenceClientRect: props.clientRect });
                }
              },
              onKeyDown(props) {
                if (props.event.key === 'Escape') {
                  popup?.[0]?.hide();
                  return true;
                }
                return component?.ref?.onKeyDown(props) || false;
              },
              onExit() {
                popup?.[0]?.destroy();
                component?.destroy();
              },
            };
          },
        },
      }),
    ],
    content: value || '',
    onUpdate: ({ editor: ed }) => {
      if (onChange) {
        const md = ed.storage.markdown?.getMarkdown?.() || ed.getText();
        onChange(md);
      }
    },
    editorProps: {
      attributes: {
        class: 'rich-editor-content',
        style: `min-height: ${minHeight}; outline: none; padding: 12px; color: var(--color-text);`,
      },
    },
  });

  // Expose editor instance and getMarkdown to parent
  useImperativeHandle(ref, () => ({
    getMarkdown: () => editor?.storage.markdown?.getMarkdown?.() || editor?.getText() || '',
    getEditor: () => editor,
    clear: () => editor?.commands.clearContent(),
  }));

  // Sync external value changes (e.g. after submit, clear)
  useEffect(() => {
    if (!editor) return;
    const current = editor.storage.markdown?.getMarkdown?.() || '';
    if (value !== current && value === '') {
      editor.commands.clearContent();
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        borderColor: 'var(--color-border)',
        background: 'var(--color-background)',
      }}
    >
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
});

export default RichEditor;
