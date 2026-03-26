import { Node, mergeAttributes } from '@tiptap/core';

/**
 * Simple image node for Tiptap — only external URLs, no base64.
 * Renders as <img> in the editor, serializes to ![alt](src) in markdown.
 */
const ImageNode = Node.create({
  name: 'image',
  group: 'block',
  inline: false,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: '' },
      title: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'img[src]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(
      {
        style: 'max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0;',
      },
      HTMLAttributes,
    )];
  },

  addCommands() {
    return {
      setImage: (options) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        });
      },
    };
  },
});

export default ImageNode;
