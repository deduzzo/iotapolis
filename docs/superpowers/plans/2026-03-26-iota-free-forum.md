# IOTA Free Forum Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a decentralized forum on IOTA 2.0 blockchain with RSA-signed posts, theme system, and real-time updates.

**Architecture:** Fork from exart26-iota, reusing its blockchain layer (iota.js, CryptHelper.js, db.js, ArweaveHelper.js) with a new data model for forum entities. Backend is Sails.js with new controllers for forum operations. Frontend is React 19 + Vite 6 + TailwindCSS 4 with a theme system (4 built-in themes, admin customization, on-chain config).

**Tech Stack:** Sails.js 1.5, IOTA 2.0 SDK, better-sqlite3, React 19, Vite 6, TailwindCSS 4, Framer Motion, Socket.io v2, RSA-2048/AES-256-CBC

**Spec:** `docs/superpowers/specs/2026-03-26-iota-free-forum-design.md`

**Parallelism:** Tasks 1-2 are sequential (setup). Tasks 3-7 can run in parallel (backend controllers, ForumManager, frontend shell, theme system, identity). Tasks 8-10 depend on prior tasks.

---

## File Map

### Copied from exart26-iota (as-is)
- `api/utility/iota.js` — IOTA 2.0 SDK, gzip, chain-linking, bulk cache
- `api/utility/CryptHelper.js` — RSA keygen, encrypt/decrypt, sign/verify, AES, HMAC
- `api/utility/ArweaveHelper.js` — Arweave backup layer
- `api/helpers/broadcast-event.js` — WebSocket broadcast
- `frontend/src/hooks/useApi.js` — data fetching with silent refresh
- `frontend/src/hooks/useWebSocket.js` — socket.io singleton
- `frontend/src/components/Modal.jsx` — animated modal with glassmorphism
- `frontend/src/components/Toast.jsx` — notification stack
- `frontend/src/components/LoadingSpinner.jsx` — neon spinner
- `frontend/src/components/Sidebar.jsx` — collapsible navigation
- `frontend/src/components/StatsCard.jsx` — stat card
- `frontend/src/components/DataTable.jsx` — data table
- `frontend/src/components/StatusBadge.jsx` — status badge

### New backend files
- `api/utility/db.js` — SQLite cache with new forum schema (adapted from exart26)
- `api/utility/ForumManager.js` — forum business logic + blockchain sync
- `api/helpers/verify-signature.js` — RSA signature verification middleware
- `api/enums/ForumTags.js` — forum transaction tag constants
- `api/controllers/register.js` — user registration
- `api/controllers/create-thread.js` — thread creation
- `api/controllers/create-post.js` — post creation
- `api/controllers/edit-post.js` — post editing (versioning)
- `api/controllers/edit-thread.js` — thread editing (versioning)
- `api/controllers/post-history.js` — post version history from chain
- `api/controllers/thread-history.js` — thread version history from chain
- `api/controllers/vote.js` — voting
- `api/controllers/moderate.js` — moderation actions
- `api/controllers/assign-role.js` — role assignment
- `api/controllers/api-categories.js` — category CRUD
- `api/controllers/api-threads.js` — thread listing
- `api/controllers/api-thread-detail.js` — thread detail with posts
- `api/controllers/api-config-theme.js` — theme config CRUD
- `api/controllers/api-dashboard.js` — forum stats
- `api/controllers/api-sync-status.js` — sync status
- `api/controllers/api-sync-reset.js` — sync reset
- `api/controllers/api-search.js` — FTS5 search
- `api/controllers/export-data.js` — data export
- `config/routes.js` — all API routes
- `config/bootstrap.js` — startup with forum sync
- `config/custom.js` — forum-specific config
- `config/security.js` — CORS config
- `config/sockets.js` — socket config
- `config/sample_private_iota_conf.js` — IOTA config template

### New frontend files
- `frontend/src/App.jsx` — React Router with forum routes
- `frontend/src/main.jsx` — entry point
- `frontend/src/index.css` — Tailwind + theme CSS variables
- `frontend/src/contexts/ThemeContext.jsx` — theme provider + CSS variable injection
- `frontend/src/data/themes.js` — 4 built-in theme presets
- `frontend/src/hooks/useIdentity.js` — RSA keypair management
- `frontend/src/hooks/useTheme.js` — theme hook (consumes context)
- `frontend/src/components/Layout.jsx` — main layout with sidebar + theme
- `frontend/src/components/PostCard.jsx` — post display with votes + edit badge
- `frontend/src/components/NestedReplies.jsx` — recursive reply tree
- `frontend/src/components/MarkdownEditor.jsx` — markdown editor with preview
- `frontend/src/components/MarkdownRender.jsx` — markdown renderer
- `frontend/src/components/VoteButtons.jsx` — upvote/downvote
- `frontend/src/components/IdentityBadge.jsx` — user badge with pubkey
- `frontend/src/components/ThreadList.jsx` — thread listing card
- `frontend/src/components/EditHistory.jsx` — version history modal
- `frontend/src/components/ThemeGallery.jsx` — theme selection cards
- `frontend/src/components/ThemeCustomizer.jsx` — admin color/font/effects panel
- `frontend/src/pages/Home.jsx` — category list
- `frontend/src/pages/Category.jsx` — thread list in category
- `frontend/src/pages/Thread.jsx` — thread with nested posts
- `frontend/src/pages/NewThread.jsx` — create thread editor
- `frontend/src/pages/UserProfile.jsx` — user profile page
- `frontend/src/pages/Identity.jsx` — keypair management
- `frontend/src/pages/Admin.jsx` — admin panel
- `frontend/src/pages/ThemeAdmin.jsx` — theme gallery + customizer
- `frontend/src/pages/Dashboard.jsx` — forum stats
- `frontend/src/api/endpoints.js` — API endpoint definitions
- `frontend/src/api/crypto.js` — client-side RSA/AES operations

---

## Task 1: Repository Setup & GitHub

**Files:**
- Create: `package.json`, `app.js`, `.sailsrc`, `.gitignore`, `README.md`
- Create: `frontend/package.json`, `frontend/index.html`, `frontend/vite.config.js`

- [ ] **Step 1: Create GitHub repo**

```bash
gh repo create deduzzo/iota-free-forum --public --description "Decentralized forum on IOTA 2.0 blockchain — zero fees, RSA-signed posts, immutable history" --clone=false
```

- [ ] **Step 2: Initialize git and set remote**

```bash
cd /Users/deduzzo/dev/iota-free-forum
git remote add origin https://github.com/deduzzo/iota-free-forum.git
```

- [ ] **Step 3: Create root package.json**

Create `package.json` with Sails.js 1.5 dependencies, IOTA SDK, better-sqlite3, arweave, crypto libs. Copy dependency versions from exart26-iota but remove unused ones (sails-mysql, bootstrap, swagger).

```json
{
  "name": "iota-free-forum",
  "version": "0.1.0",
  "description": "Decentralized forum on IOTA 2.0 blockchain",
  "keywords": ["iota", "blockchain", "forum", "decentralized"],
  "private": true,
  "main": "app.js",
  "scripts": {
    "start": "NODE_ENV=production node app.js",
    "dev": "concurrently \"sails lift\" \"npm run dev:frontend\"",
    "dev:frontend": "cd frontend && npm run dev",
    "build": "cd frontend && npm run build",
    "lint": "eslint ."
  },
  "dependencies": {
    "@iota/iota-sdk": "^1.10.1",
    "@scure/bip39": "^2.0.1",
    "arweave": "^1.15.5",
    "better-sqlite3": "^12.8.0",
    "concurrently": "^9.1.0",
    "express-rate-limit": "^7.1.0",
    "lodash": "^4.17.21",
    "sails": "^1.5.0",
    "sails-hook-orm": "^4.0.0",
    "sails-hook-sockets": "^2.0.0"
  },
  "devDependencies": {
    "eslint": "^9.0.0"
  },
  "engines": {
    "node": ">=17.0.0"
  }
}
```

- [ ] **Step 4: Create app.js**

```javascript
const sails = require('sails');
const rc = require('sails/accessible/rc');
sails.lift(rc('sails'));
```

- [ ] **Step 5: Create .sailsrc**

```json
{
  "generators": { "modules": {} },
  "hooks": { "grunt": false, "views": false, "session": false }
}
```

- [ ] **Step 6: Create .gitignore**

```
node_modules/
.tmp/
logs/
*.log
.DS_Store
config/private_iota_conf.js
config/private_arweave_conf.js
*.db
```

- [ ] **Step 7: Create README.md**

Include: project name, description, link to exart26-iota as origin project, tech stack, setup instructions, architecture diagram from spec.

- [ ] **Step 8: Create frontend/package.json**

```json
{
  "name": "iota-free-forum-frontend",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "framer-motion": "^12.0.0",
    "lucide-react": "^0.400.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-markdown": "^9.0.0",
    "react-router-dom": "^7.0.0",
    "remark-gfm": "^4.0.0",
    "rehype-highlight": "^7.0.0",
    "socket.io-client": "^2.5.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "tailwindcss": "^4.0.0",
    "vite": "^6.0.0"
  }
}
```

- [ ] **Step 9: Create frontend/vite.config.js**

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:1337', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:1337', ws: true },
    },
  },
  build: { outDir: '../.tmp/public', emptyOutDir: true },
});
```

- [ ] **Step 10: Create frontend/index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>IOTA Free Forum</title>
  <link rel="manifest" href="/manifest.json" />
</head>
<body class="bg-[var(--color-background)] text-[var(--color-text)]">
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
```

- [ ] **Step 11: Install dependencies**

```bash
cd /Users/deduzzo/dev/iota-free-forum && npm install
cd frontend && npm install
```

- [ ] **Step 12: Commit**

```bash
git add -A && git commit -m "feat: project scaffolding — Sails.js + React/Vite/Tailwind"
```

---

## Task 2: Copy Blockchain Layer from exart26-iota

**Files:**
- Copy: `api/utility/iota.js`, `api/utility/CryptHelper.js`, `api/utility/ArweaveHelper.js`
- Copy: `api/helpers/broadcast-event.js`
- Copy: `config/sample_private_iota_conf.js`
- Copy: frontend components (Modal, Toast, LoadingSpinner, Sidebar, StatsCard, DataTable, StatusBadge)
- Copy: frontend hooks (useApi, useWebSocket)
- Create: `api/enums/ForumTags.js`

- [ ] **Step 1: Copy backend utility files**

```bash
# Clone exart26-iota to /tmp if not present
git clone https://github.com/deduzzo/exart26-iota.git /tmp/exart26-iota 2>/dev/null || true

mkdir -p api/utility api/helpers api/enums api/controllers api/hooks/custom config

cp /tmp/exart26-iota/api/utility/iota.js api/utility/
cp /tmp/exart26-iota/api/utility/CryptHelper.js api/utility/
cp /tmp/exart26-iota/api/utility/ArweaveHelper.js api/utility/
cp /tmp/exart26-iota/api/helpers/broadcast-event.js api/helpers/
cp /tmp/exart26-iota/config/sample_private_iota_conf.js config/
```

- [ ] **Step 2: Modify iota.js APP_TAG**

Change `APP_TAG` from `exart26` to `iotaforum` to avoid on-chain collisions.

- [ ] **Step 3: Copy frontend reusable components**

```bash
mkdir -p frontend/src/components frontend/src/hooks frontend/src/api frontend/src/pages frontend/src/contexts frontend/src/data

cp /tmp/exart26-iota/frontend/src/components/Modal.jsx frontend/src/components/
cp /tmp/exart26-iota/frontend/src/components/Toast.jsx frontend/src/components/
cp /tmp/exart26-iota/frontend/src/components/LoadingSpinner.jsx frontend/src/components/
cp /tmp/exart26-iota/frontend/src/components/Sidebar.jsx frontend/src/components/
cp /tmp/exart26-iota/frontend/src/components/StatsCard.jsx frontend/src/components/
cp /tmp/exart26-iota/frontend/src/components/DataTable.jsx frontend/src/components/
cp /tmp/exart26-iota/frontend/src/components/StatusBadge.jsx frontend/src/components/
cp /tmp/exart26-iota/frontend/src/hooks/useApi.js frontend/src/hooks/
cp /tmp/exart26-iota/frontend/src/hooks/useWebSocket.js frontend/src/hooks/
```

- [ ] **Step 4: Create ForumTags.js**

```javascript
module.exports = {
  FORUM_USER: 'FORUM_USER',
  FORUM_CATEGORY: 'FORUM_CATEGORY',
  FORUM_THREAD: 'FORUM_THREAD',
  FORUM_POST: 'FORUM_POST',
  FORUM_VOTE: 'FORUM_VOTE',
  FORUM_ROLE: 'FORUM_ROLE',
  FORUM_MODERATION: 'FORUM_MODERATION',
  FORUM_INDEX: 'FORUM_INDEX',
  FORUM_CONFIG: 'FORUM_CONFIG',
};
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: copy blockchain layer and reusable components from exart26-iota"
```

---

## Task 3: Backend — SQLite Schema & db.js (PARALLEL)

**Files:**
- Create: `api/utility/db.js`

- [ ] **Step 1: Create db.js with forum schema**

Adapt from exart26-iota's db.js pattern (better-sqlite3, WAL mode, dynamic model factory) but with the forum schema from spec. Include all tables: users, categories, threads, posts, seen_nonces, votes, roles, moderations, config. Include FTS5 virtual table and all indexes.

Key functions to implement:
- `initDb()` — create tables if not exist, enable WAL
- `getModel(table)` — returns `{ findAll, findOne, create, update, delete }`
- `checkNonce(nonce)` — returns true if nonce already seen, inserts it if not
- `searchFts(query)` — FTS5 search on search_index
- `updateFtsIndex(entityId, title, content)` — insert/update FTS entry
- `getDb()` — raw db handle for custom queries

Schema must match spec exactly (lines 359-471 of design spec).

- [ ] **Step 2: Commit**

```bash
git add api/utility/db.js && git commit -m "feat: SQLite cache layer with forum schema, FTS5, indexes"
```

---

## Task 4: Backend — Signature Verification & ForumManager (PARALLEL)

**Files:**
- Create: `api/helpers/verify-signature.js`
- Create: `api/utility/ForumManager.js`

- [ ] **Step 1: Create verify-signature.js**

RSA-SHA256 signature verification middleware. Must:
1. Extract `signature` and `publicKey` from request body
2. Remove `signature` field from payload
3. Canonicalize: `JSON.stringify(payload, Object.keys(payload).sort())`
4. Verify RSA-SHA256 signature using Node.js `crypto` module
5. Derive `userId` as `SHA256(publicKey).substring(0, 16)` prefixed with `USR_`
6. Check nonce hasn't been seen (via db.checkNonce)
7. Reject if `createdAt` is older than 24h
8. Attach `req.verifiedUserId` and `req.verifiedPublicKey`

```javascript
const crypto = require('crypto');
const db = require('../utility/db');

module.exports = {
  friendlyName: 'Verify signature',
  description: 'Verify RSA-SHA256 signature on incoming request',
  inputs: {
    req: { type: 'ref', required: true },
  },
  fn: async function ({ req }) {
    const body = { ...req.body };
    const { signature, publicKey } = body;
    if (!signature || !publicKey) throw new Error('Missing signature or publicKey');

    // Remove signature for verification
    const payload = { ...body };
    delete payload.signature;

    // Canonical serialization
    const canonical = JSON.stringify(payload, Object.keys(payload).sort());

    // Verify RSA-SHA256
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(canonical);
    const valid = verifier.verify(publicKey, signature, 'base64');
    if (!valid) throw new Error('Invalid signature');

    // Anti-replay: check nonce
    if (!body.nonce) throw new Error('Missing nonce');
    const seen = db.checkNonce(body.nonce);
    if (seen) throw new Error('Nonce already used');

    // Check createdAt freshness (24h window)
    if (!body.createdAt || Date.now() - body.createdAt > 86400000) {
      throw new Error('Payload too old');
    }

    // Derive userId
    const hash = crypto.createHash('sha256').update(publicKey).digest('hex');
    const userId = 'USR_' + hash.substring(0, 16).toUpperCase();

    return { userId, publicKey };
  },
};
```

- [ ] **Step 2: Create ForumManager.js**

Core business logic adapted from ListManager.js pattern. Key functions:

- `syncFromBlockchain()` — fetch all IOTA TXs with `iotaforum` tag, decode, apply to SQLite cache
- `publishToChain(tag, entityId, data)` — encode + gzip + publish TX via iota.js
- `processTransaction(tx)` — route decoded TX to appropriate handler by tag
- `handleForumUser(data)` — upsert user in cache
- `handleForumThread(data)` — upsert thread (version-aware)
- `handleForumPost(data)` — upsert post (version-aware)
- `handleForumVote(data)` — upsert vote
- `handleForumCategory(data)` — upsert category
- `handleForumRole(data)` — upsert role
- `handleForumModeration(data)` — apply moderation action
- `handleForumConfig(data)` — upsert config
- `getEntityHistory(tag, entityId)` — fetch all TX versions from chain for an entity

Pattern from ListManager.js: uses iota.js `getAllTransactions()` with bulk cache, processes each TX through `processTransaction()`, broadcasts changes via `broadcast-event.js`.

- [ ] **Step 3: Commit**

```bash
git add api/helpers/verify-signature.js api/utility/ForumManager.js
git commit -m "feat: RSA signature verification + ForumManager blockchain sync"
```

---

## Task 5: Backend — Controllers & Routes (PARALLEL)

**Files:**
- Create: all controllers in `api/controllers/`
- Create: `config/routes.js`, `config/bootstrap.js`, `config/custom.js`, `config/security.js`, `config/sockets.js`

- [ ] **Step 1: Create config files**

`config/routes.js` — map all API routes from spec (lines 473-546):
```javascript
module.exports.routes = {
  // Identity
  'POST /api/v1/register': 'register',
  'GET /api/v1/user/:id': 'api-user',
  'PUT /api/v1/user/:id': 'edit-user',
  // Categories
  'GET /api/v1/categories': 'api-categories',
  'POST /api/v1/categories': 'create-category',
  'PUT /api/v1/categories/:id': 'edit-category',
  // Threads
  'GET /api/v1/threads': 'api-threads',
  'GET /api/v1/thread/:id': 'api-thread-detail',
  'POST /api/v1/threads': 'create-thread',
  'PUT /api/v1/thread/:id': 'edit-thread',
  // Posts
  'GET /api/v1/posts': 'api-posts',
  'POST /api/v1/posts': 'create-post',
  'PUT /api/v1/post/:id': 'edit-post',
  // Votes
  'POST /api/v1/vote': 'vote',
  // Moderation
  'POST /api/v1/moderate': 'moderate',
  'POST /api/v1/moderate/thread': 'moderate-thread',
  'POST /api/v1/role': 'assign-role',
  // History
  'GET /api/v1/post/:id/history': 'post-history',
  'GET /api/v1/thread/:id/history': 'thread-history',
  'GET /api/v1/user/:id/history': 'user-history',
  // Theme
  'GET /api/v1/config/theme': 'api-config-theme',
  'PUT /api/v1/config/theme': 'update-config-theme',
  'GET /api/v1/config/theme/history': 'config-theme-history',
  // Search
  'GET /api/v1/search': 'api-search',
  // System
  'GET /api/v1/dashboard': 'api-dashboard',
  'GET /api/v1/sync-status': 'api-sync-status',
  'POST /api/v1/sync-reset': 'api-sync-reset',
  'GET /api/v1/export-data': 'export-data',
  // SPA catch-all
  'GET /*': { fn: (req, res) => res.sendFile(require('path').resolve('.tmp/public/index.html')) },
};
```

`config/bootstrap.js` — init db, start blockchain sync:
```javascript
module.exports.bootstrap = async function(done) {
  const db = require('../api/utility/db');
  const ForumManager = require('../api/utility/ForumManager');
  db.initDb();
  setImmediate(async () => {
    try { await ForumManager.syncFromBlockchain(); }
    catch (e) { sails.log.error('Sync failed:', e); }
  });
  done();
};
```

`config/custom.js`, `config/security.js` (CORS for localhost:5173), `config/sockets.js`.

- [ ] **Step 2: Create controllers**

Each controller follows Sails.js action2 pattern. Write endpoints:

**Write controllers (require signature verification):**
- `register.js` — verify signature, check username uniqueness, publish FORUM_USER TX, cache in SQLite
- `create-thread.js` — verify signature, publish FORUM_THREAD TX, cache, broadcast
- `create-post.js` — verify signature, check thread exists and not locked, publish FORUM_POST TX, update thread.postCount and lastPostAt, cache, broadcast
- `edit-post.js` — verify signature, check author matches, publish new version TX, update cache
- `edit-thread.js` — verify signature, check author matches, publish new version TX, update cache
- `vote.js` — verify signature, publish FORUM_VOTE TX (upsert by postId+authorId), update post score, cache, broadcast
- `moderate.js` — verify signature, check moderator role, publish FORUM_MODERATION TX, update post.hidden, cache, broadcast
- `assign-role.js` — verify signature, check admin role, publish FORUM_ROLE TX, cache

**Read controllers (no signature):**
- `api-categories.js` — query categories with thread counts and last activity
- `api-threads.js` — query threads by category, paginated (20 per page), sorted by lastPostAt DESC
- `api-thread-detail.js` — query thread + all posts with nested replies, include author info
- `api-dashboard.js` — total users, threads, posts, active users (24h)
- `api-sync-status.js` — return ForumManager sync state
- `api-search.js` — FTS5 search on search_index
- `api-config-theme.js` — return latest theme config from cache
- `post-history.js` / `thread-history.js` — call ForumManager.getEntityHistory()
- `export-data.js` — dump all SQLite tables as JSON

- [ ] **Step 3: Commit**

```bash
git add api/controllers/ config/
git commit -m "feat: all API controllers and routes"
```

---

## Task 6: Frontend — Theme System & CSS Variables (PARALLEL)

**Files:**
- Create: `frontend/src/data/themes.js`
- Create: `frontend/src/contexts/ThemeContext.jsx`
- Create: `frontend/src/hooks/useTheme.js`
- Create: `frontend/src/index.css`
- Create: `frontend/src/components/ThemeGallery.jsx`
- Create: `frontend/src/components/ThemeCustomizer.jsx`
- Create: `frontend/src/pages/ThemeAdmin.jsx`

- [ ] **Step 1: Create themes.js with 4 built-in presets**

Define all 4 themes (Neon Cyber, Clean Minimal, Dark Pro, Retro Terminal) exactly as specified in the design doc (lines 266-308). Each theme has: id, name, category, base colors, accent colors, typography, effects.

- [ ] **Step 2: Create ThemeContext.jsx**

React context that:
1. Fetches `GET /api/v1/config/theme` on mount
2. Merges base theme + admin overrides
3. Injects CSS custom properties on `:root` via `document.documentElement.style.setProperty()`
4. Provides `theme`, `setTheme`, `applyOverrides` to consumers
5. Loads Google Fonts dynamically based on selected fontFamily

CSS variables to generate from theme object:
```
--color-background, --color-surface, --color-surface-hover, --color-border
--color-text, --color-text-muted
--color-primary, --color-secondary, --color-success, --color-warning, --color-danger
--font-family, --font-heading, --border-radius
--glassmorphism (0 or 1), --neon-glow (0 or 1)
```

- [ ] **Step 3: Create index.css**

```css
@import "tailwindcss";

@theme {
  --color-background: var(--color-background);
  --color-surface: var(--color-surface);
  --color-primary: var(--color-primary);
  /* etc. */
}

body {
  font-family: var(--font-family), system-ui, sans-serif;
  background-color: var(--color-background);
  color: var(--color-text);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading), var(--font-family), system-ui, sans-serif;
}

/* Glassmorphism utility */
.glass {
  background: rgba(255, 255, 255, calc(var(--glassmorphism) * 0.05));
  backdrop-filter: blur(calc(var(--glassmorphism) * 20px));
  border: 1px solid rgba(255, 255, 255, calc(var(--glassmorphism) * 0.1));
}

/* Neon glow utility */
.neon-glow {
  text-shadow: 0 0 calc(var(--neon-glow) * 10px) var(--color-primary),
               0 0 calc(var(--neon-glow) * 20px) var(--color-primary);
}

/* Custom scrollbar */
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: var(--color-background); }
::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: var(--border-radius); }
```

- [ ] **Step 4: Create ThemeGallery.jsx**

Grid of 4 theme cards, each showing a miniature color preview. Selected theme has a glowing border. Click selects as base. Admin-only component.

- [ ] **Step 5: Create ThemeCustomizer.jsx**

Panel with:
- Color pickers for: primary, secondary, background, surface, text
- Font selector dropdown (Inter, Space Grotesk, JetBrains Mono, Outfit, Orbitron, IBM Plex Sans)
- Border-radius slider (0px — 24px)
- Toggle switches for: glassmorphism, neon glow, animations
- Logo upload (file input, converts to base64)
- Forum name text input
- "Save" button that PUTs to `/api/v1/config/theme`
- "Reset" button to revert to base theme

- [ ] **Step 6: Create ThemeAdmin.jsx page**

Layout: Gallery on left (1/3 width), Customizer on right (2/3 width), Live preview panel at bottom showing sample forum content (category card, thread card, post card, sidebar) with current theme applied.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/data/ frontend/src/contexts/ frontend/src/hooks/useTheme.js frontend/src/index.css frontend/src/components/ThemeGallery.jsx frontend/src/components/ThemeCustomizer.jsx frontend/src/pages/ThemeAdmin.jsx
git commit -m "feat: theme system — 4 presets, ThemeProvider, admin gallery + customizer"
```

---

## Task 7: Frontend — Identity System (PARALLEL)

**Files:**
- Create: `frontend/src/hooks/useIdentity.js`
- Create: `frontend/src/api/crypto.js`
- Create: `frontend/src/api/endpoints.js`
- Create: `frontend/src/pages/Identity.jsx`
- Create: `frontend/src/components/IdentityBadge.jsx`

- [ ] **Step 1: Create crypto.js**

Client-side cryptography using Web Crypto API:
- `generateKeypair()` — RSA-2048, RSASSA-PKCS1-v1_5, SHA-256. Export as PEM strings.
- `signPayload(privateKey, payload)` — remove `signature` field, sort keys, JSON.stringify, sign with RSA-SHA256, return base64
- `deriveUserId(publicKey)` — SHA-256 hash of publicKey PEM string, first 16 hex chars, prefix `USR_`
- `encryptAES(plaintext, key)` — AES-256-CBC with random IV, return { iv, ciphertext, hmac }
- `decryptAES(encrypted, key)` — verify HMAC, decrypt with AES-256-CBC
- `encryptRSA(data, publicKeyPem)` — RSA-OAEP encrypt
- `decryptRSA(ciphertext, privateKey)` — RSA-OAEP decrypt

- [ ] **Step 2: Create useIdentity.js hook**

```javascript
// Manages RSA keypair in localStorage
// - identity: { privateKey, publicKey, userId, username } or null
// - generateIdentity() — create new keypair
// - registerUsername(username) — POST /api/v1/register with signed payload
// - exportIdentity() — download JSON file
// - importIdentity(file) — load JSON file into localStorage
// - signAndSend(endpoint, method, payload) — sign payload + fetch
```

- [ ] **Step 3: Create endpoints.js**

API client wrapper. Each function calls the appropriate endpoint. Write functions use `signAndSend` from identity hook. Read functions use plain fetch.

- [ ] **Step 4: Create Identity.jsx page**

Page with:
- If no identity: "Generate Identity" button → creates keypair, shows userId
- If identity exists but no username: username registration form
- If fully registered: show userId, username, publicKey (truncated)
- Export/Import buttons
- Warning about key loss

- [ ] **Step 5: Create IdentityBadge.jsx**

Small component showing username + first 8 chars of userId. Links to `/u/:id`.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/api/ frontend/src/hooks/useIdentity.js frontend/src/pages/Identity.jsx frontend/src/components/IdentityBadge.jsx
git commit -m "feat: identity system — RSA keypair, sign/verify, import/export"
```

---

## Task 8: Frontend — Core Forum Pages (depends on Tasks 6, 7)

**Files:**
- Create: `frontend/src/App.jsx`, `frontend/src/main.jsx`
- Create: `frontend/src/components/Layout.jsx`
- Create: `frontend/src/pages/Home.jsx`, `Category.jsx`, `Thread.jsx`, `NewThread.jsx`, `UserProfile.jsx`, `Admin.jsx`, `Dashboard.jsx`
- Create: `frontend/src/components/PostCard.jsx`, `NestedReplies.jsx`, `ThreadList.jsx`, `VoteButtons.jsx`, `MarkdownEditor.jsx`, `MarkdownRender.jsx`, `EditHistory.jsx`

- [ ] **Step 1: Create main.jsx and App.jsx**

```jsx
// main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
```

App.jsx — Routes: `/` Home, `/c/:id` Category, `/c/:id/new` NewThread, `/t/:id` Thread, `/u/:id` UserProfile, `/identity` Identity, `/admin` Admin, `/admin/theme` ThemeAdmin, `/dashboard` Dashboard. All nested under Layout.

- [ ] **Step 2: Create Layout.jsx**

Adapted from exart26-iota Layout. Sidebar with forum navigation (Home, Dashboard, Identity, Admin). Top bar with forum name from theme, sync status indicator. Toast provider. Uses theme CSS variables for all colors.

- [ ] **Step 3: Create Home.jsx**

Category list. Each card shows: name, description, thread count, post count, last activity time. Click navigates to `/c/:id`. Uses `useApi('/api/v1/categories')` with WebSocket refresh.

- [ ] **Step 4: Create Category.jsx**

Thread list for a category. Uses ThreadList component. Paginated (20/page). "New Thread" button links to `/c/:id/new`. Sorted by pinned first, then lastPostAt DESC. Uses `useApi('/api/v1/threads?category=X&page=Y')`.

- [ ] **Step 5: Create ThreadList.jsx component**

Card per thread: title, author badge, post count, last activity, pinned/locked icons. Click navigates to `/t/:id`.

- [ ] **Step 6: Create Thread.jsx**

OP post at top (full content, markdown rendered). Below: nested replies via NestedReplies. Reply form at bottom (MarkdownEditor). Edit button on own posts. Uses `useApi('/api/v1/thread/:id')` with WebSocket.

- [ ] **Step 7: Create PostCard.jsx**

Displays: author IdentityBadge, timestamp, markdown content (via MarkdownRender), VoteButtons, "reply" button, "edit" button (if own post), "modified" badge with version history link.

- [ ] **Step 8: Create NestedReplies.jsx**

Recursive component. Renders posts as a tree (parentId-based nesting). Indentation per level (max 5 levels, then flat). Each node is a PostCard.

- [ ] **Step 9: Create VoteButtons.jsx**

Upvote/downvote arrows + score. Click calls `POST /api/v1/vote` with signed payload. Highlighted if user already voted.

- [ ] **Step 10: Create MarkdownEditor.jsx**

Textarea with tabs: "Write" and "Preview". Write tab is a textarea. Preview tab renders markdown via MarkdownRender. Toolbar: bold, italic, link, code, quote buttons.

- [ ] **Step 11: Create MarkdownRender.jsx**

Uses `react-markdown` with `remark-gfm` for GFM support and `rehype-highlight` for code syntax highlighting.

- [ ] **Step 12: Create EditHistory.jsx**

Modal triggered by "modified" badge on PostCard. Fetches `GET /api/v1/post/:id/history`. Shows list of versions with: version number, date, full content. Most recent first.

- [ ] **Step 13: Create NewThread.jsx**

Form: title input, MarkdownEditor for content, optional encryption toggle (checkbox). Submit calls `POST /api/v1/threads` with signed payload. Redirect to new thread on success.

- [ ] **Step 14: Create UserProfile.jsx**

Shows: username, userId, bio, avatar, join date, recent posts, total post count. Edit bio/avatar if viewing own profile.

- [ ] **Step 15: Create Admin.jsx**

Admin panel: category management (create/edit), moderation queue (hidden posts), role management (assign moderator). Only visible to admin users.

- [ ] **Step 16: Create Dashboard.jsx**

Stats cards: total users, threads, posts, active users (24h). Blockchain sync status. Chart placeholder.

- [ ] **Step 17: Commit**

```bash
git add frontend/src/
git commit -m "feat: all forum pages — Home, Category, Thread, Posts, Admin, Dashboard"
```

---

## Task 9: Integration & Polish (depends on Tasks 3-8)

**Files:**
- Modify: various files for integration

- [ ] **Step 1: Wire up WebSocket real-time updates**

Ensure all write controllers call `sails.helpers.broadcastEvent('dataChanged', { entity: 'threads' })` (or posts, users, etc.) after successful writes. Frontend useApi hooks already listen for these via useWebSocket.

- [ ] **Step 2: Add rate limiting**

In controllers that write: use express-rate-limit middleware. Limits per spec:
- Posts: 1 per 10s per IP
- Registration: 1 per 60s per IP
- Votes: 1 per 2s per IP
- Other writes: 1 per 5s per IP

- [ ] **Step 3: Add error handling and loading states**

Ensure all pages show LoadingSpinner during data fetch. Error states show Toast notifications. Network errors show offline indicator.

- [ ] **Step 4: Responsive design**

Ensure sidebar collapses on mobile. Thread page readable on small screens. ThemeAdmin has mobile layout (stacked instead of side-by-side).

- [ ] **Step 5: PWA manifest**

Create `frontend/public/manifest.json` with app name, icons, theme color from active theme.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: integration — real-time updates, rate limiting, responsive, PWA"
```

---

## Task 10: Push to GitHub

- [ ] **Step 1: Final push**

```bash
git push -u origin main
```

---

## Parallelism Map

```
Task 1 (setup) → Task 2 (copy layer) → [parallel block]:
                                          ├── Task 3 (db.js)
                                          ├── Task 4 (verify-sig + ForumManager)
                                          ├── Task 5 (controllers + routes)
                                          ├── Task 6 (theme system)
                                          └── Task 7 (identity system)
                                        → Task 8 (forum pages, depends on 6+7)
                                        → Task 9 (integration, depends on all)
                                        → Task 10 (push)
```
