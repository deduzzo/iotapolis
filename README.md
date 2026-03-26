<p align="center">
  <img src="https://img.shields.io/badge/IOTA-2.0_Rebased-00f0ff?style=for-the-badge&logo=iota&logoColor=white" alt="IOTA 2.0" />
  <img src="https://img.shields.io/badge/Smart_Contract-Move-8B5CF6?style=for-the-badge" alt="Move" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT" />
</p>

<h1 align="center">IOTA Free Forum</h1>

<p align="center">
  <strong>A fully decentralized forum powered by IOTA 2.0 blockchain and Move smart contracts.</strong><br/>
  Every post is on-chain. Every permission is verified by validators. No central authority. No censorship.
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> &bull;
  <a href="#-features">Features</a> &bull;
  <a href="#-architecture">Architecture</a> &bull;
  <a href="#-smart-contract">Smart Contract</a> &bull;
  <a href="#-themes">Themes</a> &bull;
  <a href="#-multi-node">Multi-Node</a> &bull;
  <a href="#-contributing">Contributing</a>
</p>

---

## Why IOTA Free Forum?

Traditional forums depend on a central server that can be shut down, censored, or compromised. **IOTA Free Forum** stores every piece of data on the IOTA 2.0 blockchain as Move smart contract events. The local server is just a cache — the blockchain is the source of truth.

- **No single point of failure** — Any node can reconstruct the entire forum from on-chain events
- **Immutable history** — Every post, edit, and vote is permanently recorded with a transaction digest
- **On-chain permissions** — Roles (User, Moderator, Admin) are enforced by the smart contract, not the server
- **Cryptographic identity** — Users sign every action with their RSA-2048 keypair. No passwords, no accounts
- **Zero fees on testnet** — IOTA 2.0 Rebased testnet provides free gas via faucet

---

## Quick Start

```bash
# Clone
git clone https://github.com/deduzzo/iota-free-forum.git
cd iota-free-forum

# Install dependencies
npm install
cd frontend && npm install && cd ..

# First run — generates wallet + config
npm run dev
# Wait for "Sails lifted", then Ctrl+C

# Deploy the Move smart contract to IOTA testnet
npm run move:deploy

# Start the forum
npm run dev
```

Open `http://localhost:5173` — generate an identity, register a username, create your first category and start posting.

> See [DEPLOY.md](DEPLOY.md) for production deployment, custom networks, and advanced configuration.

---

## Features

### Core

| Feature | Description |
|---------|-------------|
| **On-chain posts** | Every thread, post, reply, vote, and edit is published as a Move event on IOTA 2.0 |
| **Smart contract roles** | 4-level permission system (Banned/User/Moderator/Admin) enforced by validators |
| **Cryptographic identity** | RSA-2048 keypair generated in-browser. No passwords. Export/import your identity as JSON |
| **Signed actions** | Every API call is signed with RSASSA-PKCS1-v1_5 + SHA-256. The server verifies before publishing |
| **Immutable versioning** | Edit history stored on-chain. Every version has a TX digest linkable on the IOTA Explorer |
| **Nested replies** | Threaded discussions with unlimited depth nesting |
| **Voting system** | Upvote/downvote posts. Scores computed from on-chain vote events |
| **Full-text search** | SQLite FTS5 index rebuilt from blockchain data |
| **Connection string** | Share your forum with `testnet:PACKAGE_ID:FORUM_OBJECT_ID` — anyone can join |

### Editor

| Feature | Description |
|---------|-------------|
| **Rich WYSIWYG editor** | Tiptap-based editor with full toolbar |
| **Markdown output** | Always serializes to clean markdown via `tiptap-markdown` |
| **Formatting** | Bold, italic, strikethrough, headings (H1-H3), blockquote, horizontal rule |
| **Lists** | Bullet lists, numbered lists, checklists (task lists) |
| **Code** | Inline code + code blocks with syntax highlighting |
| **Tables** | Insert and edit tables directly in the editor |
| **Images** | Insert via URL with suggested free hosting (Imgur, ImgBB, Postimages) |
| **Emoji** | Emoji picker powered by emoji-mart |
| **@Mentions** | Type `@` to search and mention users |
| **Undo/Redo** | Full history with Ctrl+Z / Ctrl+Y |

### Themes

7 built-in themes with per-user selection:

| Theme | Style | Layout |
|-------|-------|--------|
| **Neon Cyber** | Dark, glassmorphism, cyan neon glow | Card grid |
| **Clean Minimal** | Light, minimal, blue accent | Card grid |
| **Dark Pro** | Dark, professional, green accent | Card grid |
| **Retro Terminal** | Dark, monospace, green neon | Card grid |
| **Invision Light** | Classic forum, white, blue accent, shadows | IPB table layout |
| **Invision Dark** | Classic forum, dark gray, blue accent | IPB table layout |
| **Material Ocean** | Material Design, deep navy, teal accent | Card grid |

- **Per-user theme** — Each user chooses their own theme in Settings (saved in localStorage)
- **Admin default** — The admin sets the forum-wide default theme
- **Customization** — Colors, fonts, border radius, glassmorphism, neon glow — all configurable

### Real-time Sync

| Feature | Description |
|---------|-------------|
| **WebSocket updates** | Granular `dataChanged` events push updates to specific UI components |
| **Optimistic UI** | Posts/votes appear instantly, confirmed asynchronously |
| **Blockchain polling** | Every 30s polls for new on-chain events from other nodes |
| **Cross-node sync** | Multiple servers on the same forum stay in sync via blockchain |
| **Integrity check** | `GET /api/v1/integrity-check` compares local cache vs on-chain data |

### Admin & Moderation

| Feature | Description |
|---------|-------------|
| **Role management** | Promote/demote users (on-chain, enforced by smart contract) |
| **Content moderation** | Hide/unhide posts and threads |
| **Thread controls** | Pin, lock, hide threads |
| **Category management** | Create and edit categories |
| **Theme admin** | Customize forum-wide theme with live preview |
| **Dashboard** | Stats, sync status, load test panel |

---

## Architecture

```
Browser (React 19 + Vite 6 + TailwindCSS 4)
  |
  |-- RSA-2048 keypair in localStorage
  |-- Signs every action with private key
  |-- Rich WYSIWYG editor (Tiptap) → markdown
  |-- Theme engine (7 presets, CSS variables)
  |
  |  REST API + Socket.io WebSocket
  v
Server (Sails.js + Node.js)
  |
  |-- Verifies RSA-SHA256 signature on every request
  |-- Anti-replay: nonce + 24h timestamp window
  |-- Publishes data to blockchain via moveCall()
  |-- SQLite cache (reconstructible from chain)
  |-- WebSocket broadcast on every state change
  |-- 30s blockchain polling for cross-node sync
  |
  v
Move Smart Contract (on-chain, immutable)
  |
  |-- Forum (shared object): user registry + roles Table<address, u8>
  |-- AdminCap (owned): deployer capability
  |-- 4 entry functions with role-gated access
  |-- Emits ForumEvent for every operation (gzipped JSON)
  |-- RoleChanged events for role mutations
  |
  v
IOTA 2.0 Rebased (source of truth)
  |
  |-- Events queryable by Package ID
  |-- All nodes see the same data
  |-- Zero fees on testnet (faucet auto-refill)
```

### Data Flow

```
User types a post
  → Tiptap editor serializes to markdown
  → Frontend signs payload with RSA private key
  → POST /api/v1/posts (signed JSON)
  → Server verifies signature + nonce
  → Server calls moveCall() on the Move contract
  → Contract checks role (USER ≥ 1), emits ForumEvent
  → Server verifies TX on-chain (up to 3 retries)
  → Updates local SQLite cache
  → Broadcasts 'dataChanged' via WebSocket
  → All connected clients update their UI
  → Other nodes pick up the event via 30s polling
```

---

## Smart Contract

The Move smart contract (`move/forum/sources/forum.move`) is the security backbone. All permissions are enforced by IOTA validators, not by the server.

### Role System

| Level | Role | Permissions |
|-------|------|-------------|
| 0 | **BANNED** | All operations rejected by validators |
| 1 | **USER** | Post, reply, vote, edit own content |
| 2 | **MODERATOR** | + Create categories, moderate content, ban/unban |
| 3 | **ADMIN** | + Forum config, role management |

### Entry Functions

| Function | Min Role | Purpose |
|----------|----------|---------|
| `register()` | None | One-time registration, assigns ROLE_USER |
| `post_event()` | USER | Threads, posts, replies, votes |
| `mod_post_event()` | MODERATOR | Categories, moderation actions |
| `admin_post_event()` | ADMIN | Forum config, role changes |
| `set_user_role()` | MODERATOR | Change user roles (with constraints) |

### On-Chain Security Rules

- Banned users cannot perform any operation (TX rejected by validators)
- Cannot promote someone to a role equal or higher than your own
- Cannot modify users with a role equal or higher than your own
- Cannot change your own role (self-protection)
- Registration is one-time per address
- The contract deployer is auto-registered as ADMIN

### Event Tags

Every on-chain event includes a tag for routing:

| Tag | Function | Description |
|-----|----------|-------------|
| `FORUM_USER` | `register()` | User registration/profile update |
| `FORUM_THREAD` | `post_event()` | Thread creation/edit |
| `FORUM_POST` | `post_event()` | Post/reply creation/edit |
| `FORUM_VOTE` | `post_event()` | Upvote/downvote |
| `FORUM_CATEGORY` | `mod_post_event()` | Category creation/edit |
| `FORUM_MODERATION` | `mod_post_event()` | Hide/unhide/pin/lock actions |
| `FORUM_ROLE` | `admin_post_event()` | Role assignments |
| `FORUM_CONFIG` | `admin_post_event()` | Forum configuration |

---

## Multi-Node

IOTA Free Forum supports multiple independent nodes connected to the same smart contract. Each node:

1. Runs its own Sails.js server + React frontend
2. Has its own SQLite cache (reconstructible)
3. Publishes transactions to the same IOTA contract
4. Syncs from blockchain every 30 seconds

### Joining an Existing Forum

```bash
# Start the server
npm run dev

# In the browser: go to Setup → "Connect to existing forum"
# Paste the connection string: testnet:0xPACKAGE_ID:0xFORUM_OBJECT_ID
# The system syncs all events from the blockchain
```

### Connection String Format

```
<network>:<package_id>:<forum_object_id>

Example:
testnet:0xd179...45a87:0x1e65...91b34
```

### Integrity Verification

```bash
# Check if local cache matches blockchain
curl http://localhost:1337/api/v1/integrity-check

# Response:
{
  "synced": true,
  "local":  { "users": 5, "threads": 12, "posts": 87, "votes": 34 },
  "chain":  { "users": 5, "threads": 12, "posts": 87, "votes": 34 },
  "message": "Cache is in sync with blockchain"
}
```

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Blockchain** | IOTA 2.0 Rebased | Testnet |
| **Smart Contract** | Move (IOTA MoveVM) | — |
| **SDK** | @iota/iota-sdk | Latest |
| **Backend** | Sails.js | 1.5 |
| **Runtime** | Node.js | >= 18 |
| **Database** | better-sqlite3 (cache) | Latest |
| **Frontend** | React | 19 |
| **Bundler** | Vite | 6 |
| **CSS** | TailwindCSS | 4 |
| **Animations** | Framer Motion | 12 |
| **Editor** | Tiptap (ProseMirror) | 3 |
| **Markdown** | react-markdown + tiptap-markdown | — |
| **Icons** | Lucide React | Latest |
| **Emoji** | emoji-mart | Latest |
| **Real-time** | Socket.io | 2 |
| **i18n** | react-i18next | Latest |
| **Desktop** | Electron + electron-builder + electron-updater | 33 |
| **Crypto** | Web Crypto API (browser) + Node crypto | — |

---

## Desktop App (Electron)

IOTA Free Forum is available as a standalone desktop application for Windows, macOS, and Linux. One-click install, zero configuration — the server runs embedded inside the app.

### Download

Download the latest release from [GitHub Releases](https://github.com/deduzzo/iota-free-forum/releases):

| Platform | File | Auto-update |
|----------|------|-------------|
| **Windows** | `.exe` installer | Yes |
| **macOS** | `.dmg` | Yes |
| **Linux** | `.AppImage` | Yes |

The app automatically checks for updates from GitHub Releases and notifies users when a new version is available.

### Data Storage

The desktop app stores all data in the user's application data directory:

| Platform | Path |
|----------|------|
| **Windows** | `%APPDATA%\iota-free-forum-desktop\forum-data\` |
| **macOS** | `~/Library/Application Support/iota-free-forum-desktop/forum-data/` |
| **Linux** | `~/.config/iota-free-forum-desktop/forum-data/` |

### Building from Source

```bash
# Build for current platform
npm run desktop:build

# Build for specific platform
npm run desktop:build:win
npm run desktop:build:mac
npm run desktop:build:linux
```

---

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start backend + frontend in development |
| `npm start` | Start in production mode (single port 1337) |
| `npm run build` | Build frontend for production |
| `npm run move:build` | Compile the Move smart contract |
| `npm run move:deploy` | Compile + deploy contract to IOTA testnet |
| `npm run move:install-cli` | Install the IOTA CLI tool |
| `npm run desktop:dev` | Run Electron in development mode |
| `npm run desktop:build` | Build desktop app for current platform |
| `npm run release` | Interactive release script (version bump + build + GitHub Release) |

---

## API Endpoints

### Public (no auth required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/categories` | List all categories |
| GET | `/api/v1/threads?category=ID&page=N` | List threads in a category |
| GET | `/api/v1/thread/:id` | Thread detail with all posts |
| GET | `/api/v1/user/:id` | User profile |
| GET | `/api/v1/search?q=QUERY` | Full-text search |
| GET | `/api/v1/config/theme` | Current theme configuration |
| GET | `/api/v1/forum-info` | Forum metadata + connection string |
| GET | `/api/v1/sync-status` | Sync status + wallet info |
| GET | `/api/v1/integrity-check` | DB vs blockchain integrity check |
| GET | `/api/v1/dashboard` | Forum statistics |
| GET | `/api/v1/post/:id/history` | Post version history from blockchain |
| GET | `/api/v1/thread/:id/history` | Thread version history from blockchain |

### Signed (RSA signature required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/register` | Register new user identity |
| POST | `/api/v1/threads` | Create thread |
| POST | `/api/v1/posts` | Create post/reply |
| PUT | `/api/v1/thread/:id` | Edit thread |
| PUT | `/api/v1/post/:id` | Edit post |
| POST | `/api/v1/vote` | Vote on a post |
| POST | `/api/v1/moderate` | Moderate a post (hide/unhide) |
| POST | `/api/v1/moderate/thread` | Moderate a thread (pin/lock/hide) |
| POST | `/api/v1/role` | Assign role to user |
| PUT | `/api/v1/user/:id` | Edit user profile |
| POST | `/api/v1/categories` | Create category (mod+) |

---

## Project Structure

```
iota-free-forum/
  move/forum/sources/
    forum.move              # Move smart contract — roles, permissions, events
  api/
    controllers/            # REST API endpoints (one file per action)
    helpers/
      verify-signature.js   # RSA-SHA256 signature verification
      broadcast-event.js    # WebSocket event broadcaster
    utility/
      iota.js               # IOTA SDK wrapper — publish, query, subscribe
      ForumManager.js       # Blockchain sync engine + event polling
      db.js                 # SQLite schema + model helpers
      move-publish.js       # Contract deployment script
    enums/
      ForumTags.js          # Event tag constants
  config/
    bootstrap.js            # Startup: wallet init, sync, polling
    routes.js               # All API routes
    private_iota_conf.js    # Generated config (gitignored)
  frontend/src/
    components/
      RichEditor.jsx        # Tiptap WYSIWYG editor
      EditorToolbar.jsx     # Editor toolbar with all formatting buttons
      PostCard.jsx          # Post display (dual layout: card + forum)
      ThreadList.jsx        # Thread list (dual layout: card + table)
      NestedReplies.jsx     # Recursive nested reply tree
      IdentityBadge.jsx     # User avatar + name badge
      BlockchainInfo.jsx    # On-chain TX details modal
      EditHistory.jsx       # Version history modal
      LoadTestPanel.jsx     # Stress test tool
      ThemeGallery.jsx      # Theme selection grid
      ThemeCustomizer.jsx   # Admin theme customization
    pages/
      Home.jsx              # Category listing
      Category.jsx          # Thread listing
      Thread.jsx            # Thread view with replies
      NewThread.jsx         # Thread creation form
      Settings.jsx          # User settings + theme picker
      Identity.jsx          # Identity management
      Admin.jsx             # Admin panel
      Dashboard.jsx         # Stats + load test
    hooks/
      useApi.js             # Data fetching + realtime refresh
      useIdentity.js        # RSA keypair management + signing
      useWebSocket.js       # WebSocket connection + events
      useTheme.js           # Theme context access
    contexts/
      ThemeContext.jsx       # Theme provider + CSS variable engine
    data/
      themes.js             # 7 theme presets
    api/
      endpoints.js          # API client helpers
      crypto.js             # Web Crypto API wrappers
```

---

## How Identity Works

1. **Generate** — Browser creates an RSA-2048 keypair via Web Crypto API
2. **Derive** — User ID = `USR_` + first 16 hex chars of SHA-256(publicKey)
3. **Register** — First signed request registers the keypair on-chain
4. **Sign** — Every subsequent action includes: `{ payload, signature, publicKey }`
5. **Verify** — Server verifies the RSA-SHA256 signature and checks nonce uniqueness
6. **Publish** — Server calls the Move contract, which checks the on-chain role
7. **Export** — Users can export their identity as a JSON file and import on another device

No passwords. No emails. No accounts. Just math.

---

## Contributing

Contributions are welcome! This project is in active development.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run `npm run dev` and test locally
5. Commit: `git commit -m 'feat: add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Areas Where Help is Needed

- Additional language translations (i18n coming soon)
- Mobile-responsive improvements
- Additional theme presets
- Performance optimization for large forums (10k+ posts)
- End-to-end encrypted threads
- IPFS integration for media storage

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Built on IOTA 2.0 Rebased</strong><br/>
  <em>Every post is a transaction. Every permission is a smart contract. Every user is a keypair.</em>
</p>
