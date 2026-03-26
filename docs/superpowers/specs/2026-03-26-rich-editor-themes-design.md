# Rich Editor + Forum Themes — Design Spec

## Overview

Two features for IOTA Free Forum:
1. **Rich WYSIWYG editor** (Tiptap) replacing the textarea-based MarkdownEditor, output always markdown
2. **New forum-style themes** (Invision, Material) + per-user theme selection in Settings

---

## 1. Rich Editor (Tiptap)

### Library Stack

| Package | Purpose |
|---------|---------|
| `@tiptap/react` | Core editor + React integration |
| `@tiptap/starter-kit` | Bold, italic, strike, code, headings, lists, blockquote, HR, code block, history |
| `@tiptap/extension-link` | Clickable links with URL input |
| `@tiptap/extension-task-list` + `task-item` | Checklist / task lists |
| `@tiptap/extension-table` + `table-row` + `table-cell` + `table-header` | Table editing |
| `@tiptap/extension-placeholder` | Placeholder text |
| `@tiptap/extension-mention` | @username mentions |
| `tiptap-markdown` | Bidirectional markdown conversion (MD -> editor, editor -> MD) |
| `emoji-mart` | Emoji picker popup |

### Toolbar Layout

```
[B] [I] [S] [~] | [H1] [H2] [H3] | [Quote] [HR] | [UL] [OL] [Checklist] | [Code] [CodeBlock] | [Link] [Image] | [Table] | [Emoji] [@] | [Undo] [Redo]
```

Grouped with separators. On mobile: collapsible into a scrollable single row.

### Toolbar Behavior

- Each button toggles its formatting or opens a popup (link URL, image URL, emoji picker, mention search)
- Active state: highlighted when cursor is inside that formatting
- Keyboard shortcuts: Ctrl+B, Ctrl+I, Ctrl+K (link), etc. — provided by starter-kit

### Image Insertion Flow

The image button opens a small popover with:
1. **URL input field** — paste any image URL, inserts `![](url)`
2. **Suggested hosting** — small text below: "Upload gratis su: [Imgur](https://imgur.com/upload) | [ImgBB](https://imgbb.com) | [Postimages](https://postimages.org) — poi incolla il link diretto"
3. **Preview** — thumbnail preview after URL pasted, before confirming
4. **Alt text** field — optional description

No base64, no file upload. Only external URLs.

### Mention (@user) Flow

1. User types `@` — opens dropdown
2. Fetches `/api/v1/search?q=<typed>` filtering for users
3. Shows matching usernames with avatar
4. On select: inserts `[@username](/u/USR_ID)` in markdown

### Emoji Picker

- Button opens `emoji-mart` popup
- On select: inserts the unicode emoji character directly into the editor

### Output Format

- `tiptap-markdown` extension handles serialization
- On submit: `editor.storage.markdown.getMarkdown()` returns clean markdown string
- The existing `MarkdownRender` component renders it unchanged
- Backward compatible: old posts (plain markdown) render identically

### Component Architecture

```
RichEditor.jsx (new)
  ├── EditorToolbar.jsx (new) — toolbar buttons with active states
  ├── ImageInsertPopover.jsx (new) — URL input + hosting suggestions
  ├── EmojiPickerPopover.jsx (new) — emoji-mart wrapper
  ├── MentionList.jsx (new) — @mention dropdown
  └── Tiptap useEditor() — core editor instance
```

`MarkdownEditor.jsx` remains unchanged (fallback for edge cases), but all usages switch to `RichEditor`.

### Integration Points

Replace `MarkdownEditor` with `RichEditor` in:
- `frontend/src/pages/Thread.jsx` — reply form
- `frontend/src/pages/NewThread.jsx` — thread content
- `frontend/src/components/PostCard.jsx` — inline reply editor

### Size Indicator

Small text under the editor showing estimated payload size:
- "~1.2 KB" (green when < 50KB after gzip estimate)
- Turns yellow > 50KB, red > 100KB with warning message
- Client-side gzip estimation via `pako` (lightweight zlib for browser) or simple `content.length * 0.6` heuristic

---

## 2. New Themes

### New Theme Presets

Add 3 themes to `frontend/src/data/themes.js`:

#### `invision-light`
- **Category**: light
- **Style**: White backgrounds, soft gray surfaces, subtle box-shadows (no glassmorphism), blue accent (#2D6CDF), rounded corners (10px)
- **Typography**: Inter body, Inter headings, clean and readable
- **Effects**: No glassmorphism, no neon glow, animations enabled
- **Inspiration**: Invision Power Board 4.x light theme

#### `invision-dark`
- **Category**: dark
- **Style**: Dark gray (#1a1c23) background, slightly lighter surface (#22252d), same blue accent, subtle border highlights
- **Typography**: Same as invision-light
- **Effects**: No glassmorphism, no neon glow, animations enabled

#### `material-ocean`
- **Category**: dark
- **Style**: Deep navy (#0F111A) background, elevated surfaces (#1A1C25) with box-shadow layers, teal accent (#00BCD4), Material Design elevation system
- **Typography**: Inter body, Space Grotesk headings, border-radius 12px
- **Effects**: No glassmorphism, no neon glow, animations enabled

### CSS Adjustments for Non-Glass Themes

Current `.glass-card` uses `backdrop-filter: blur()` which doesn't fit Invision/Material themes. When `--glassmorphism: 0`:
- `.glass-card` falls back to solid `background: var(--color-surface)` with `box-shadow` for elevation
- Already handled in current `index.css` — verify and adjust shadow values for new themes

### box-shadow CSS Variable

Add `--shadow-card` variable to theme definitions:
- Glass themes: `none` (glow handled by neon-border)
- Invision themes: `0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)`
- Material Ocean: `0 2px 8px rgba(0,0,0,0.3)`

Update `.glass-card` to use `box-shadow: var(--shadow-card)` when glassmorphism is off.

---

## 3. Per-User Theme Selection

### Storage

- **User preference**: `localStorage` key `forum_user_theme`
- **Value**: theme ID string (e.g. `invision-light`) or `null` (use forum default)
- **Not on-chain**: purely cosmetic, local-only

### Settings Page Changes

Add a "Tema" section to `frontend/src/pages/Settings.jsx`:
- Reuse `ThemeGallery` component (already exists)
- Shows all 7 themes as selectable cards
- "Usa default del forum" option to clear user override
- On select: save to localStorage + apply immediately via `ThemeContext`

### ThemeContext Changes

Modify `frontend/src/contexts/ThemeContext.jsx`:
1. On mount: check `localStorage.forum_user_theme`
2. If set: use that theme ID instead of the server-provided default
3. If not set: use the admin-configured default (current behavior)
4. The admin panel (`ThemeAdmin`) sets the **forum-wide default** — unchanged
5. User selection in Settings sets the **personal override** — new

### Priority Chain

```
User localStorage override > Admin forum default > 'neon-cyber' hardcoded fallback
```

---

## 4. File Changes Summary

### New Files
- `frontend/src/components/RichEditor.jsx` — main Tiptap editor wrapper
- `frontend/src/components/EditorToolbar.jsx` — toolbar buttons
- `frontend/src/components/ImageInsertPopover.jsx` — image URL popover
- `frontend/src/components/EmojiPickerPopover.jsx` — emoji picker wrapper
- `frontend/src/components/MentionList.jsx` — @mention suggestion dropdown

### Modified Files
- `frontend/src/data/themes.js` — add 3 new theme presets
- `frontend/src/index.css` — add `--shadow-card` variable, adjust glass-card for elevation
- `frontend/src/contexts/ThemeContext.jsx` — localStorage user override logic
- `frontend/src/pages/Settings.jsx` — add theme picker section
- `frontend/src/pages/Thread.jsx` — replace MarkdownEditor with RichEditor
- `frontend/src/pages/NewThread.jsx` — replace MarkdownEditor with RichEditor
- `frontend/src/components/PostCard.jsx` — replace MarkdownEditor with RichEditor
- `frontend/package.json` — add Tiptap + emoji-mart dependencies

### Unchanged
- `frontend/src/components/MarkdownEditor.jsx` — kept as fallback
- `frontend/src/components/MarkdownRender.jsx` — unchanged, renders the same markdown
- `frontend/src/pages/ThemeAdmin.jsx` — admin panel unchanged
- Backend — no changes needed

---

## 5. Dependencies to Install

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/pm \
  @tiptap/extension-link @tiptap/extension-placeholder \
  @tiptap/extension-task-list @tiptap/extension-task-item \
  @tiptap/extension-table @tiptap/extension-table-row \
  @tiptap/extension-table-cell @tiptap/extension-table-header \
  @tiptap/extension-mention \
  tiptap-markdown \
  @emoji-mart/react @emoji-mart/data
```
