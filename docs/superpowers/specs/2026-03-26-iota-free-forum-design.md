# IOTA Free Forum - Design Specification

## Overview

Forum decentralizzato su blockchain IOTA 2.0 Rebased. I post sono immutabili e firmati crittograficamente. L'identita degli utenti e una coppia di chiavi RSA-2048 gestita nel browser (esportabile). Zero fee, zero account centralizzati, zero censura.

Fork architetturale di ExArt26 IOTA: riusa il layer blockchain (iota.js, CryptHelper.js, db.js, ArweaveHelper.js) con un modello dati completamente nuovo.

## Stack

- **Backend**: Sails.js v1.5 + Node.js >= 17
- **Blockchain**: IOTA 2.0 Rebased (@iota/iota-sdk) — zero fee, Programmable TX Blocks
- **Backup**: Arweave (opzionale)
- **Cache locale**: better-sqlite3 (ricostruibile dalla blockchain)
- **Frontend**: React 19 + Vite 6 + TailwindCSS 4 + Framer Motion
- **Real-time**: Socket.io v2 (via sails-hook-sockets)
- **Crittografia**: RSA-2048 (firma + cifratura) + AES-256-CBC (thread cifrati)

## Architecture

```
Browser (React SPA)
  ├─ Keypair RSA-2048 in localStorage
  ├─ Firma ogni azione con chiave privata
  ├─ Cifratura/decifratura AES per thread protetti
  │
  │  REST API + WebSocket
  ▼
Server Forum (Sails.js)
  ├─ Verifica firma RSA di ogni richiesta
  ├─ Pubblica TX su IOTA (gzip + u64 + chain-linking)
  ├─ Cache SQLite (ricostruibile dalla chain)
  ├─ WebSocket broadcast (dataChanged)
  │
  ▼
IOTA 2.0 Rebased (source of truth)
  └─ Arweave (backup opzionale)
```

Il server possiede il wallet IOTA e pubblica per conto degli utenti. Ogni azione e firmata dall'utente — il server non puo falsificare contenuti. Chiunque puo verificare l'autenticita di ogni post scaricando i dati dalla blockchain e controllando le firme RSA.

## Identity Model

Modello pseudonimo: ogni utente e identificato da un keypair RSA-2048.

- **Primo accesso**: il browser genera un keypair RSA-2048 e lo salva in localStorage
- **Registrazione**: l'utente sceglie un username; viene pubblicata una TX `FORUM_USER` firmata
- **User ID**: hash SHA-256 della publicKey, primi 16 caratteri hex (es. `USR_A1B2C3D4E5F6`)
- **Autenticazione**: ogni richiesta include la firma RSA del payload + la publicKey dell'autore
- **Multi-dispositivo**: export/import di un file JSON `{privateKey, publicKey, username}`
- **Nessuna password, email, cookie di sessione**

## Transaction Types (On-Chain Tags)

| Tag | EntityId Format | Content | Signed | Encrypted |
|-----|----------------|---------|--------|-----------|
| `FORUM_USER` | `USR_<hash16>` | username, bio, avatar, publicKey | Yes | No |
| `FORUM_CATEGORY` | `CAT_<id>` | name, description | Yes (admin) | No |
| `FORUM_THREAD` | `THR_<id>` | title, content, categoryId, authorId | Yes | Optional (AES) |
| `FORUM_POST` | `POST_<id>` | content, threadId, parentId, authorId | Yes | Inherits from thread |
| `FORUM_VOTE` | `VOTE_<postId>_<authorId>` | postId, vote (+1/-1) | Yes | No |
| `FORUM_ROLE` | `ROLE_<targetUserId>` | targetUserId, role, categoryId | Yes (admin) | No |
| `FORUM_MODERATION` | `MOD_<postId>` | postId, action, reason | Yes (moderator) | No |
| `FORUM_INDEX` | null | Global entity index | No | No |

All transactions use gzip compression and chain-linking for unlimited payload size (inherited from ExArt26).

## Encrypted Threads

A thread can be marked as `encrypted: true` at creation. When encrypted:

- The creator generates an AES-256-CBC key for the thread
- The AES key is encrypted with the publicKey of each authorized user (RSA-OAEP)
- The encrypted key bundle is published as part of the thread TX
- All posts in the thread inherit encryption: content is AES-encrypted before publishing
- The thread title can optionally be encrypted (`encryptedTitle: true`)
- To grant access to a new user: publish a new `FORUM_THREAD` version with the AES key encrypted for the additional user

```javascript
// Encrypted thread payload
{
  id: "THR_5",
  categoryId: "CAT_2",
  title: "Titolo visibile",           // or encrypted base64 if encryptedTitle: true
  content: "<AES encrypted base64>",
  encrypted: true,
  encryptedTitle: false,
  keyBundle: {
    "USR_A1B2...": "<AES key encrypted with user A pubkey>",
    "USR_C3D4...": "<AES key encrypted with user B pubkey>",
  },
  authorId: "USR_A1B2C3D4E5F6",
  signature: "base64...",
  createdAt: 1774460000000
}
```

Decryption flow (client-side):
1. Read `keyBundle[myUserId]` from thread
2. Decrypt AES key with own RSA private key
3. Decrypt content with AES key
4. Same AES key decrypts all posts in the thread

## Data Payloads

### FORUM_USER
```json
{
  "username": "marco_dev",
  "bio": "Blockchain developer",
  "avatar": null,
  "publicKey": "-----BEGIN PUBLIC KEY-----\n...",
  "createdAt": 1774460000000,
  "signature": "<RSA signature of payload without signature field>"
}
```

### FORUM_THREAD
```json
{
  "id": "THR_1",
  "categoryId": "CAT_1",
  "title": "First thread",
  "content": "Thread body text with **markdown** support",
  "authorId": "USR_A1B2C3D4E5F6",
  "encrypted": false,
  "createdAt": 1774460000000,
  "signature": "base64..."
}
```

### FORUM_POST (nested reply)
```json
{
  "id": "POST_42",
  "threadId": "THR_1",
  "parentId": "POST_10",
  "content": "Reply to another post",
  "authorId": "USR_A1B2C3D4E5F6",
  "createdAt": 1774460000000,
  "signature": "base64..."
}
```

### FORUM_VOTE
```json
{
  "postId": "POST_42",
  "vote": 1,
  "authorId": "USR_A1B2C3D4E5F6",
  "createdAt": 1774460000000,
  "signature": "base64..."
}
```

### FORUM_ROLE
```json
{
  "targetUserId": "USR_E5F6G7H8I9J0",
  "role": "moderator",
  "categoryId": "CAT_1",
  "grantedBy": "USR_ADMIN...",
  "createdAt": 1774460000000,
  "signature": "base64..."
}
```

### FORUM_MODERATION
```json
{
  "postId": "POST_42",
  "action": "hide",
  "reason": "Spam",
  "moderatorId": "USR_E5F6G7H8I9J0",
  "createdAt": 1774460000000,
  "signature": "base64..."
}
```

## SQLite Schema (Cache)

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  bio TEXT,
  avatar TEXT,
  publicKey TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  createdAt INTEGER,
  updatedAt INTEGER
);

CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  createdBy TEXT,
  sortOrder INTEGER DEFAULT 0,
  createdAt INTEGER
);

CREATE TABLE threads (
  id TEXT PRIMARY KEY,
  categoryId TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  authorId TEXT NOT NULL,
  encrypted INTEGER DEFAULT 0,
  encryptedTitle INTEGER DEFAULT 0,
  keyBundle TEXT,
  pinned INTEGER DEFAULT 0,
  locked INTEGER DEFAULT 0,
  hidden INTEGER DEFAULT 0,
  lastPostAt INTEGER,
  postCount INTEGER DEFAULT 0,
  createdAt INTEGER
);

CREATE TABLE posts (
  id TEXT PRIMARY KEY,
  threadId TEXT NOT NULL,
  parentId TEXT,
  content TEXT NOT NULL,
  authorId TEXT NOT NULL,
  hidden INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  createdAt INTEGER
);

CREATE TABLE votes (
  id TEXT PRIMARY KEY,
  postId TEXT NOT NULL,
  authorId TEXT NOT NULL,
  vote INTEGER NOT NULL,
  createdAt INTEGER,
  UNIQUE(postId, authorId)
);

CREATE TABLE roles (
  id TEXT PRIMARY KEY,
  targetUserId TEXT NOT NULL,
  role TEXT NOT NULL,
  categoryId TEXT,
  grantedBy TEXT NOT NULL,
  createdAt INTEGER
);

CREATE TABLE moderations (
  id TEXT PRIMARY KEY,
  postId TEXT NOT NULL,
  action TEXT NOT NULL,
  reason TEXT,
  moderatorId TEXT NOT NULL,
  createdAt INTEGER
);
```

## API Routes

### Auth (Identity)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/register` | Register username (body: {username, publicKey, signature}) |
| GET | `/api/v1/user/:id` | Get user profile |
| PUT | `/api/v1/user/:id` | Update bio/avatar (signed) |

### Categories
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/categories` | List all categories with stats |
| POST | `/api/v1/categories` | Create category (admin only, signed) |

### Threads
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/threads?category=X&page=1` | List threads in category, paginated |
| GET | `/api/v1/thread/:id` | Thread detail with nested posts |
| POST | `/api/v1/threads` | Create thread (signed, optional encryption) |

### Posts
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/posts` | Create post/reply (signed) |
| GET | `/api/v1/posts?thread=X` | Get posts for thread (with nesting) |

### Votes
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/vote` | Vote on post (signed, +1 or -1) |

### Moderation
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/moderate` | Moderate action (moderator, signed) |
| POST | `/api/v1/role` | Assign role (admin, signed) |

### System
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/dashboard` | Forum stats |
| GET | `/api/v1/sync-status` | Blockchain sync status |
| POST | `/api/v1/sync-reset` | Reset cache and resync |
| GET | `/api/v1/export-data` | Export full snapshot |
| POST | `/api/v1/verify-snapshot` | Verify snapshot integrity |

## Frontend Pages

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Category list with thread counts, last activity |
| Category | `/c/:id` | Thread list sorted by last post, paginated |
| Thread | `/t/:id` | OP + nested replies with votes, markdown rendered |
| New Thread | `/c/:id/new` | Markdown editor, optional encryption toggle |
| User Profile | `/u/:id` | Bio, stats, recent posts |
| Identity | `/identity` | Generate/export/import keypair, set username |
| Admin | `/admin` | Manage categories, roles, moderation queue |
| Dashboard | `/dashboard` | Forum stats, blockchain status, sync info |

## Anti-Spam

- Rate limiting: max 1 post per 10 seconds per user
- Registration required: must have `FORUM_USER` TX to post
- Admin can ban users: `FORUM_ROLE` with `role: "banned"`
- Moderators can hide posts: `FORUM_MODERATION` with `action: "hide"`
- Hidden posts are not deleted (immutable chain) but client hides them by default

## Reused Components from ExArt26

### Backend (100% reuse, copy as-is)
- `api/utility/iota.js` — blockchain SDK, gzip, chain-linking, bulk cache
- `api/utility/CryptHelper.js` — RSA keygen, encrypt/decrypt, sign/verify, AES, HMAC
- `api/utility/ArweaveHelper.js` — Arweave backup layer
- `api/utility/db.js` — SQLite cache layer (new schema, same API pattern)

### Frontend (100% reuse)
- `hooks/useApi.js` — data fetching with silent refresh
- `hooks/useWebSocket.js` — socket.io singleton, dataChanged relay
- `components/Modal.jsx`, `Toast.jsx`, `LoadingSpinner.jsx`, `Sidebar.jsx`
- `components/StatsCard.jsx`, `DataTable.jsx`, `StatusBadge.jsx`

### Backend (adapt pattern)
- `api/helpers/broadcast-event.js` — WebSocket broadcast (copy as-is)
- `config/bootstrap.js` — startup sync pattern (adapt for forum tags)
- `ListManager.js` — sync logic pattern (rewrite as `ForumManager.js`)

## Key Differences from ExArt26

| Aspect | ExArt26 | IOTA Free Forum |
|--------|---------|-----------------|
| Data visibility | Encrypted (AES) | Public by default, optional encryption |
| Identity | Server keypair only | User keypairs (RSA in browser) |
| Authentication | None (single org) | RSA signature per request |
| Content type | Structured records | Free-text markdown posts |
| Hierarchy | Org > Str > Lista > Assistito | Category > Thread > Post (nested) |
| Immutability | Full | Full (no delete, edit = new version) |

## File Structure

```
iota-free-forum/
├── api/
│   ├── controllers/        # Forum-specific controllers
│   │   ├── register.js
│   │   ├── create-thread.js
│   │   ├── create-post.js
│   │   ├── vote.js
│   │   ├── moderate.js
│   │   ├── assign-role.js
│   │   ├── api-categories.js
│   │   ├── api-threads.js
│   │   ├── api-thread-detail.js
│   │   ├── api-dashboard.js
│   │   ├── api-sync-status.js
│   │   ├── api-sync-reset.js
│   │   ├── export-data.js
│   │   └── verify-snapshot.js
│   ├── utility/            # Copied from ExArt26
│   │   ├── iota.js
│   │   ├── CryptHelper.js
│   │   ├── ArweaveHelper.js
│   │   ├── db.js           # New schema, same API
│   │   └── ForumManager.js # New: forum business logic + sync
│   ├── helpers/
│   │   ├── broadcast-event.js
│   │   └── verify-signature.js  # New: RSA signature verification middleware
│   ├── enums/
│   │   └── ForumTags.js
│   └── hooks/
│       └── custom/
├── config/
│   ├── routes.js
│   ├── bootstrap.js
│   ├── custom.js
│   ├── security.js
│   ├── sockets.js
│   └── private_iota_conf.js
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Category.jsx
│   │   │   ├── Thread.jsx
│   │   │   ├── NewThread.jsx
│   │   │   ├── UserProfile.jsx
│   │   │   ├── Identity.jsx
│   │   │   ├── Admin.jsx
│   │   │   └── Dashboard.jsx
│   │   ├── components/     # Copied from ExArt26 + new
│   │   │   ├── Modal.jsx
│   │   │   ├── Toast.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── StatsCard.jsx
│   │   │   ├── DataTable.jsx
│   │   │   ├── PostCard.jsx        # New
│   │   │   ├── NestedReplies.jsx   # New
│   │   │   ├── MarkdownEditor.jsx  # New
│   │   │   ├── MarkdownRender.jsx  # New
│   │   │   ├── VoteButtons.jsx     # New
│   │   │   ├── IdentityBadge.jsx   # New
│   │   │   └── ThreadList.jsx      # New
│   │   ├── hooks/          # Copied from ExArt26 + new
│   │   │   ├── useApi.js
│   │   │   ├── useWebSocket.js
│   │   │   └── useIdentity.js      # New: RSA keypair management
│   │   └── api/
│   │       └── endpoints.js
│   └── vite.config.js
├── docs/
├── logs/
├── .tmp/
└── package.json
```
