<p align="center">
  <img src="https://img.shields.io/badge/IOTA-2.0_Rebased-00f0ff?style=for-the-badge&logo=iota&logoColor=white" alt="IOTA 2.0" />
  <img src="https://img.shields.io/badge/Smart_Contract-Move-8B5CF6?style=for-the-badge" alt="Move" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT" />
</p>

<h1 align="center">IotaPolis</h1>

<p align="center">
  <strong>A fully decentralized community platform with integrated payments, marketplace, and escrow — powered by IOTA 2.0 and Move smart contracts.</strong><br/>
  Every post is on-chain. Every user signs with their own wallet. Every payment is trustless.
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> &bull;
  <a href="#-features">Features</a> &bull;
  <a href="#-architecture">Architecture</a> &bull;
  <a href="#-smart-contract">Smart Contract</a> &bull;
  <a href="#-payments--marketplace">Payments</a> &bull;
  <a href="#-themes">Themes</a> &bull;
  <a href="#-multi-node">Multi-Node</a> &bull;
  <a href="#-contributing">Contributing</a>
</p>

---

## Why IotaPolis?

Traditional forums depend on a central server that can be shut down, censored, or compromised. **IotaPolis** stores every piece of data on the IOTA 2.0 blockchain as Move smart contract events. The local server is just a cache — the blockchain is the source of truth.

- **True decentralization** — Each user has their own IOTA wallet (Ed25519). The server never holds private keys
- **No single point of failure** — Any node can reconstruct the entire forum from on-chain events
- **Immutable history** — Every post, edit, and vote is permanently recorded with a transaction digest
- **On-chain permissions** — Roles (User, Moderator, Admin) enforced by the smart contract, not the server
- **Built-in economy** — Tips, subscriptions, paid content, badges, and escrow — all on-chain
- **Zero fees on testnet** — IOTA 2.0 Rebased testnet provides free gas via automatic faucet

---

## Quick Start

```bash
# Clone
git clone https://github.com/deduzzo/iotapolis.git
cd iotapolis

# Install dependencies
npm install
cd frontend && npm install && cd ..

# First run — generates server wallet + config
npm run dev
# Wait for "Sails lifted", then Ctrl+C

# Deploy the Move smart contract to IOTA testnet
npm run move:deploy

# Start the forum
npm run dev
```

Open `http://localhost:5173` — create a wallet, get gas from the faucet, register a username, and start posting.

> See [DEPLOY.md](DEPLOY.md) for production deployment, custom networks, and advanced configuration.

---

## Features

### Core Forum

| Feature | Description |
|---------|-------------|
| **On-chain posts** | Every thread, post, reply, vote, and edit is a Move event on IOTA 2.0 |
| **Smart contract roles** | 4-level permission system (Banned/User/Moderator/Admin) enforced by validators |
| **IOTA wallet identity** | Ed25519 keypair with BIP39 mnemonic. Password-encrypted in browser. No accounts needed |
| **Direct signing** | Users sign transactions directly on the blockchain — the server never touches private keys |
| **Immutable versioning** | Edit history stored on-chain. Every version has a TX digest on the IOTA Explorer |
| **Nested replies** | Threaded discussions with unlimited depth nesting |
| **Voting system** | Upvote/downvote posts. Scores computed from on-chain vote events |
| **Full-text search** | SQLite FTS5 index rebuilt from blockchain data |
| **8 languages** | IT, EN, ES, DE, FR, PT, JA, ZH with react-i18next |
| **Connection string** | Share your forum with `testnet:PACKAGE_ID:FORUM_OBJECT_ID` — anyone can join |

### Payments & Marketplace

| Feature | Description |
|---------|-------------|
| **Tips** | Send IOTA directly to post authors. Preset amounts + custom. All on-chain |
| **Subscriptions** | Tiered plans (Free/Pro/Premium) with configurable prices and durations |
| **Paid content** | Authors set a price for threads. AES-256 encrypted, key delivered after payment |
| **Premium categories** | Admin restricts category access to subscribers of a given tier |
| **Badges** | Admin-configurable purchasable badges displayed next to usernames |
| **Escrow (multi-sig)** | 2-of-3 escrow for services: buyer + seller + arbitrator. Funds locked on-chain |
| **Reputation** | On-chain ratings (1-5 stars) after escrow resolution. Immutable trade history |
| **Marketplace** | Browse paid content, services, and badges in a dedicated page |
| **Treasury** | Forum collects fees (5% marketplace, 2% escrow) to a smart contract treasury |

### Editor

| Feature | Description |
|---------|-------------|
| **Rich WYSIWYG editor** | Tiptap-based with full toolbar |
| **Markdown output** | Serializes to clean markdown via `tiptap-markdown` |
| **Formatting** | Bold, italic, strikethrough, headings, blockquote, horizontal rule |
| **Code** | Inline code + code blocks with syntax highlighting |
| **Tables** | Insert and edit tables directly |
| **Images** | Insert via URL |
| **Emoji** | Emoji picker (emoji-mart) |
| **@Mentions** | Search and mention users |

### Themes

7 built-in themes with per-user selection:

| Theme | Style | Layout |
|-------|-------|--------|
| **Neon Cyber** | Dark, glassmorphism, cyan neon glow | Card grid |
| **Clean Minimal** | Light, minimal, blue accent | Card grid |
| **Dark Pro** | Dark, professional, green accent | Card grid |
| **Retro Terminal** | Dark, monospace, green neon | Card grid |
| **Invision Light** | Classic forum, white, blue accent | IPB table layout |
| **Invision Dark** | Classic forum, dark gray, blue accent | IPB table layout |
| **Material Ocean** | Material Design, deep navy, teal accent | Card grid |

### Real-time Sync

| Feature | Description |
|---------|-------------|
| **WebSocket updates** | Granular `dataChanged` events push updates to specific UI components |
| **Optimistic UI** | Posts/votes appear instantly, confirmed asynchronously |
| **Blockchain polling** | Every 30s polls for new on-chain events |
| **IOTA subscribeEvent** | Native blockchain event subscription (~2s latency) |
| **Cross-node sync** | Multiple servers stay in sync via blockchain events |

---

## Architecture

```
Browser (React 19 + Vite 6 + TailwindCSS 4)
  |
  |-- IOTA Ed25519 wallet (mnemonic-derived, AES-encrypted in localStorage)
  |-- Signs and executes transactions DIRECTLY on blockchain
  |-- Rich WYSIWYG editor (Tiptap) -> markdown
  |-- Theme engine (7 presets, CSS variables)
  |-- Wallet page: balance, tips, subscriptions, escrow
  |
  |  REST API (read-only cache) + Socket.io WebSocket
  v
Server (Sails.js + Node.js) — INDEXER ONLY
  |
  |-- Indexes blockchain events into SQLite cache
  |-- Faucet: sends gas to new users (testnet)
  |-- Serves cached data via REST for fast queries
  |-- WebSocket broadcast on every state change
  |-- 30s blockchain polling for cross-node sync
  |-- DOES NOT sign or publish transactions for users
  |
  v
Move Smart Contract (on-chain, immutable)
  |
  |-- Forum (shared): user registry, roles, subscriptions, badges, reputation, treasury
  |-- Escrow (shared objects): multi-sig 2-of-3 fund management
  |-- AdminCap (owned): deployer capability
  |-- 20+ entry functions with role-gated access
  |-- Emits events for every operation (gzipped JSON payloads)
  |-- Handles all payments: tips, subscriptions, purchases, escrow
  |
  v
IOTA 2.0 Rebased (source of truth)
  |
  |-- Events queryable by Package ID
  |-- All nodes see the same data
  |-- Zero fees on testnet
```

### Data Flow

```
User types a post
  -> Tiptap editor serializes to markdown
  -> Frontend gzip-compresses the JSON payload
  -> User's Ed25519 keypair signs the transaction
  -> Transaction executes directly on IOTA blockchain
  -> Smart contract checks role (USER >= 1), emits ForumEvent
  -> Backend detects event via polling/subscribe
  -> Updates local SQLite cache
  -> Broadcasts 'dataChanged' via WebSocket
  -> All connected clients update their UI
```

---

## Smart Contract

The Move smart contract (`move/forum/sources/forum.move`) is the security backbone. All permissions and payments are enforced by IOTA validators, not by the server.

### Role System

| Level | Role | Permissions |
|-------|------|-------------|
| 0 | **BANNED** | All operations rejected by validators |
| 1 | **USER** | Post, reply, vote, edit own content, tip, subscribe, purchase |
| 2 | **MODERATOR** | + Create categories, moderate content, ban/unban, arbitrate escrow |
| 3 | **ADMIN** | + Forum config, role management, configure tiers/badges, withdraw treasury |

### Entry Functions

**Forum (base):**

| Function | Min Role | Purpose |
|----------|----------|---------|
| `register()` | None | One-time registration, assigns ROLE_USER |
| `post_event()` | USER | Threads, posts, replies, votes |
| `mod_post_event()` | MODERATOR | Categories, moderation actions |
| `admin_post_event()` | ADMIN | Forum config, role changes |
| `set_user_role()` | MODERATOR | Change user roles (with constraints) |

**Payments:**

| Function | Min Role | Purpose |
|----------|----------|---------|
| `tip()` | USER | Send IOTA to a post author |
| `subscribe()` | USER | Subscribe to a tier |
| `renew_subscription()` | USER | Renew existing subscription |
| `purchase_content()` | USER | Buy access to paid content |
| `purchase_badge()` | USER | Buy a badge |
| `configure_tier()` | ADMIN | Add/edit subscription tiers |
| `configure_badge()` | ADMIN | Add/edit badges |
| `withdraw_funds()` | ADMIN | Withdraw from forum treasury |

**Escrow:**

| Function | Who | Purpose |
|----------|-----|---------|
| `create_escrow()` | Buyer | Lock funds in escrow (2-of-3 multi-sig) |
| `mark_delivered()` | Seller | Mark service as delivered |
| `open_dispute()` | Buyer | Open a dispute |
| `vote_release()` | Any party | Vote to release funds to seller |
| `vote_refund()` | Any party | Vote to refund buyer |
| `rate_trade()` | Buyer/Seller | Rate the other party (1-5 stars) |

### Security

- Each user signs with their own Ed25519 keypair — `ctx.sender()` verified by IOTA validators
- The server never holds user private keys
- Escrow uses cross-validated 2-of-3 voting (cannot vote on both sides)
- Overpayments are automatically refunded (exact change returned)
- Deadline enforcement on escrow operations
- Banned users rejected at the contract level
- Cannot promote above own role, cannot modify equal-or-higher role users

---

## Payments & Marketplace

### Tips

Click the tip button on any post to send IOTA directly to the author. Choose from preset amounts (0.1, 0.5, 1.0 IOTA) or enter a custom amount. Tips are instant, on-chain, with zero intermediaries.

### Subscriptions

Admins configure subscription tiers with price and duration. Users subscribe by paying the tier price. The smart contract automatically manages expiration and access control.

### Paid Content

Authors can set a price for their threads. The content is AES-256 encrypted. After payment (on-chain), the buyer receives the decryption key. 5% fee goes to the forum treasury.

### Escrow

For services between users, the buyer locks funds in an on-chain escrow. Three parties (buyer, seller, arbitrator) form a 2-of-3 multi-sig. Any two can release or refund the funds. 2% fee to the forum treasury on resolution.

### Reputation

After every escrow resolution, both parties can leave a rating (1-5 stars + comment). Ratings are immutable on-chain. User profiles display average rating, trade count, success rate, and volume.

---

## Multi-Node

IotaPolis supports multiple independent nodes connected to the same smart contract. Each node:

1. Runs its own Sails.js server + React frontend
2. Has its own SQLite cache (reconstructible)
3. Users sign transactions directly on-chain
4. Syncs from blockchain every 30 seconds

### Joining an Existing Forum

```bash
# Start the server
npm run dev

# In the browser: go to Setup -> "Connect to existing forum"
# Paste the connection string: testnet:0xPACKAGE_ID:0xFORUM_OBJECT_ID
# The system syncs all events from the blockchain
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
| **Icons** | Lucide React | Latest |
| **Real-time** | Socket.io | 2 |
| **i18n** | react-i18next | 8 languages |
| **Desktop** | Electron + electron-builder | 33 |
| **Crypto** | Ed25519 (IOTA native) + AES-256-GCM + BIP39 | — |

---

## Desktop App (Electron)

Available as a standalone desktop application for Windows, macOS, and Linux. The server runs embedded inside the app.

### Download

Download the latest release from [GitHub Releases](https://github.com/deduzzo/iotapolis/releases):

| Platform | File | Auto-update |
|----------|------|-------------|
| **Windows** | `.exe` installer | Yes |
| **macOS** | `.dmg` | Yes |
| **Linux** | `.AppImage` | Yes |

---

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start backend + frontend in development |
| `npm start` | Start in production mode (single port 1337) |
| `npm run build` | Build frontend for production |
| `npm run move:build` | Compile the Move smart contract |
| `npm run move:deploy` | Compile + deploy contract to IOTA testnet |
| `npm run desktop:dev` | Run Electron in development mode |
| `npm run desktop:build` | Build desktop app for current platform |
| `npm run release` | Interactive release script |

---

## API Endpoints

### Public (read-only cache)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/categories` | List all categories with stats |
| GET | `/api/v1/threads?category=ID&page=N` | List threads in a category |
| GET | `/api/v1/thread/:id` | Thread detail with all posts |
| GET | `/api/v1/posts?thread=ID` | Posts for a thread |
| GET | `/api/v1/user/:id` | User profile + reputation + badges |
| GET | `/api/v1/user/:id/reputation` | User trade reputation |
| GET | `/api/v1/user/:id/subscription` | User subscription status |
| GET | `/api/v1/search?q=QUERY` | Full-text search |
| GET | `/api/v1/dashboard` | Forum + payment statistics |
| GET | `/api/v1/marketplace` | Paid content, badges, top sellers |
| GET | `/api/v1/escrows` | Escrow list (filterable) |
| GET | `/api/v1/escrow/:id` | Escrow detail with ratings |
| GET | `/api/v1/tips/:postId` | Tips on a specific post |
| GET | `/api/v1/forum-info` | Forum metadata + connection string |

### Server actions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/faucet-request` | Request gas for a new address (rate-limited) |
| POST | `/api/v1/full-reset` | Full reset (admin signature required) |
| POST | `/api/v1/sync-reset` | Cache reset + resync (admin signature required) |

All write operations (posts, votes, moderation, payments, escrow) are executed directly on the IOTA blockchain by the user's wallet. The server is a read-only indexer.

---

## How Identity Works

1. **Generate** — Browser creates an Ed25519 keypair from a BIP39 mnemonic (12 words)
2. **Encrypt** — Mnemonic encrypted with user's password (AES-256-GCM + PBKDF2) and stored in localStorage
3. **Faucet** — Backend sends gas IOTA to the new address (testnet)
4. **Register** — User calls `register()` on the Move contract directly
5. **Sign** — Every action (post, vote, tip, escrow) is a transaction signed with the user's Ed25519 key
6. **Verify** — `ctx.sender()` verified by IOTA validators at the protocol level
7. **Backup** — Users export their 12-word mnemonic to restore on any device

No passwords on the server. No emails. No accounts. Your wallet is your identity.

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

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Built on IOTA 2.0 Rebased</strong><br/>
  <em>Every post is a transaction. Every permission is a smart contract. Every user is a wallet.</em>
</p>
