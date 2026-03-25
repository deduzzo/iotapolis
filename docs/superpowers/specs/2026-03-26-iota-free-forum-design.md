# IOTA Free Forum - Design Specification
# fork of: https://github.com/deduzzo/exart26-iota

## Overview

Forum decentralizzato su blockchain IOTA 2.0 Rebased. I post sono immutabili e firmati crittograficamente. L'identita degli utenti e una coppia di chiavi RSA-2048 gestita nel browser (esportabile). Zero fee, zero account centralizzati.

**Modello di fiducia**: il server possiede il wallet IOTA e pubblica per conto degli utenti. Questo significa che il server puo potenzialmente omettere azioni (censura per omissione) o riordinarle. Per mitigare: ogni TX pubblicata restituisce il digest IOTA al client, che puo verificarlo indipendentemente su un explorer. Il server non puo falsificare il contenuto dei post (firmati RSA dall'autore). In futuro, un client diretto che pubblica dal proprio wallet eliminerebbe completamente questo trust point.

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
| `FORUM_INDEX` | null | Global entity index | Yes (server wallet) | No |
| `FORUM_CONFIG` | `CONFIG_<type>` | Forum configuration (theme, etc.) | Yes (admin) | No |

All transactions use gzip compression and chain-linking for unlimited payload size (inherited from ExArt26).

### Anti-Replay & ID Generation

Every signed payload includes:
- `nonce`: UUID v4 casuale generato dal client. Il server rifiuta nonce gia visti (stored in SQLite table `seen_nonces`, mantenuti indefinitamente — UUID a 36 byte ha costo storage trascurabile). Inoltre il server rifiuta payload con `createdAt` piu vecchio di 24h come ulteriore protezione anti-replay.
- `id`: generato dal client come `<PREFIX>_<nonce_first8>` (es. `POST_a1b2c3d4`). L'ID e parte dei dati firmati, il server non puo alterarlo. Eccezione: `FORUM_USER` il cui id e derivato deterministicamente dalla publicKey (vedi Identity Model).
- `version`: intero incrementale. Per edit, il client pubblica una nuova TX con lo stesso `id` e `version + 1`. La versione piu alta e canonica.
- `signature`: RSA-SHA256 firma del payload serializzato con chiavi ordinate alfabeticamente: `JSON.stringify(payload_senza_campo_signature, Object.keys(payload).sort())`. Questa canonicalizzazione garantisce che client e server producano la stessa stringa indipendentemente dall'ordine di inserimento delle chiavi.

### Username Conflict Resolution

- Il server verifica unicita nel DB locale prima di pubblicare la TX `FORUM_USER`
- Durante la ricostruzione da chain: se due TX `FORUM_USER` hanno lo stesso username, vince quella con timestamp on-chain piu basso (first-come-first-served)
- Username minimo 3 caratteri, max 20, alfanumerico + underscore
- Username riservati: admin, moderator, system, null, undefined

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

Encryption per-post: ogni post genera un IV casuale di 16 byte. Il contenuto viene cifrato con AES-256-CBC usando la chiave AES del thread + IV unico. Un HMAC-SHA256 viene calcolato sul ciphertext per garantire integrita. Viene usato il metodo `CryptHelper.encryptAndSend()` gia esistente che gestisce IV + HMAC correttamente.

Decryption flow (client-side):
1. Read `keyBundle[myUserId]` from thread
2. Decrypt AES key with own RSA private key
3. For each post: decrypt with AES key + post's IV, verify HMAC
4. Same AES key decrypts all posts in the thread

**Limitazione revoca**: una volta che un utente ha decifrato la chiave AES, la possiede per sempre. Revocare l'accesso a un utente (rimuovendolo dal keyBundle) impedisce l'accesso a NUOVI post (se si rigenera la chiave AES), ma NON ai post gia letti. La revoca completa richiederebbe ri-cifrare tutto il thread con una nuova chiave, che e costoso on-chain. Questo e un compromesso accettato.

**keyBundle scaling**: ogni entry nel keyBundle e ~344 bytes. Per thread con 100+ utenti autorizzati, considerare un meccanismo di group key (una chiave AES di gruppo cifrata una sola volta, distribuita separatamente).

## Data Payloads

### FORUM_USER

Note: `id` (`USR_<hash16>`) non e incluso nel payload — e derivato deterministicamente come `SHA-256(publicKey).substring(0,16)` da entrambi client e server. Poiche la publicKey e nel payload firmato, l'id e implicitamente autenticato.

```json
{
  "username": "marco_dev",
  "bio": "Blockchain developer",
  "avatar": null,
  "publicKey": "-----BEGIN PUBLIC KEY-----\n...",
  "nonce": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "version": 1,
  "createdAt": 1774460000000,
  "signature": "<RSA-SHA256 of canonicalized payload without signature field>"
}
```

### FORUM_THREAD
```json
{
  "id": "THR_a1b2c3d4",
  "categoryId": "CAT_1",
  "title": "First thread",
  "content": "Thread body text with **markdown** support",
  "authorId": "USR_A1B2C3D4E5F6",
  "encrypted": false,
  "nonce": "...",
  "version": 1,
  "createdAt": 1774460000000,
  "signature": "base64..."
}
```

### FORUM_POST (nested reply)
```json
{
  "id": "POST_b3c4d5e6",
  "threadId": "THR_a1b2c3d4",
  "parentId": "POST_f7g8h9i0",
  "content": "Reply to another post",
  "authorId": "USR_A1B2C3D4E5F6",
  "nonce": "...",
  "version": 1,
  "createdAt": 1774460000000,
  "signature": "base64..."
}
```

### FORUM_VOTE
```json
{
  "postId": "POST_b3c4d5e6",
  "vote": 1,
  "authorId": "USR_A1B2C3D4E5F6",
  "nonce": "...",
  "version": 1,
  "createdAt": 1774460000000,
  "signature": "base64..."
}
```

Note: i voti sono mutabili — un utente puo cambiare voto pubblicando una nuova TX `FORUM_VOTE` con lo stesso `postId + authorId` e `version + 1`. La versione piu alta e canonica (consistente con il meccanismo di versioning usato per tutti gli altri tipi di TX).

### FORUM_CATEGORY
```json
{
  "id": "CAT_a1b2c3d4",
  "name": "General Discussion",
  "description": "Talk about anything",
  "authorId": "USR_ADMIN...",
  "nonce": "...",
  "version": 1,
  "createdAt": 1774460000000,
  "signature": "base64..."
}
```

Note: le categorie supportano versioning (edit nome/descrizione) e sono create solo da admin.

### FORUM_ROLE
```json
{
  "targetUserId": "USR_E5F6G7H8I9J0",
  "role": "moderator",
  "categoryId": "CAT_1",
  "grantedBy": "USR_ADMIN...",
  "nonce": "...",
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
  "nonce": "...",
  "createdAt": 1774460000000,
  "signature": "base64..."
}
```

### FORUM_CONFIG (Theme)
```json
{
  "id": "CONFIG_theme",
  "type": "theme",
  "baseTheme": "neon-cyber",
  "overrides": {
    "accent.primary": "#ff6600",
    "typography.fontFamily": "Space Grotesk",
    "typography.borderRadius": "4px",
    "effects.neonGlow": false,
    "forumName": "My Community",
    "logo": "<base64 or URL>"
  },
  "authorId": "USR_ADMIN...",
  "nonce": "...",
  "version": 1,
  "createdAt": 1774460000000,
  "signature": "base64..."
}
```

## Theme System

### Theme Architecture

Ogni tema e un oggetto JSON con struttura standardizzata. 4 temi built-in sono hardcoded nel frontend come preset. L'admin ne sceglie uno come base, poi personalizza via pannello. La config custom viene salvata on-chain come `FORUM_CONFIG` con versioning (ultima versione e canonica).

### Theme Object Structure

```javascript
{
  id: "neon-cyber",
  name: "Neon Cyber",
  category: "dark",
  base: {
    background: "#0a0a1a",
    surface: "#12122a",
    surfaceHover: "#1a1a3a",
    border: "#2a2a4a",
    text: "#e0e0ff",
    textMuted: "#8888aa",
  },
  accent: {
    primary: "#00f0ff",
    secondary: "#ff00aa",
    success: "#00ff88",
    warning: "#ffaa00",
    danger: "#ff4444",
  },
  typography: {
    fontFamily: "Inter",
    headingFamily: "Orbitron",
    borderRadius: "12px",
  },
  effects: {
    glassmorphism: true,
    neonGlow: true,
    animations: true,
  },
  logo: null,
  forumName: "IOTA Free Forum",
}
```

### Built-in Themes (4)

| Theme | Style | Key Colors |
|-------|-------|------------|
| **Neon Cyber** (default) | Dark, glassmorphism, neon glow | Cyan `#00f0ff` + Magenta `#ff00aa` |
| **Clean Minimal** | Light, clean, subtle shadows | Blue `#3b82f6` + Slate |
| **Dark Pro** | Dark sober, professional | Emerald `#10b981` + Zinc |
| **Retro Terminal** | Dark, monospace, phosphor green | Green `#00ff41` + Amber |

### Admin Customization Panel (`/admin/theme`)

- **Gallery** (left): card dei 4 temi con miniatura preview
- **Customization panel** (right): color picker per colori primari, selector font (5-6 opzioni preimpostate), slider border-radius, toggle effetti, upload logo, nome forum
- **Live preview** (bottom/split): mostra come apparira il forum in tempo reale
- Solo utenti con ruolo `admin` possono accedere

### Theme Application (Frontend)

Un `ThemeProvider` React context che:
1. Al boot, chiama `GET /api/v1/config/theme`
2. Il server restituisce l'ultima `FORUM_CONFIG` di tipo theme (dalla cache SQLite)
3. Il provider merge il tema base con gli overrides dell'admin
4. Genera CSS custom properties e le inietta nel `:root`
5. Tutti i componenti usano `var(--color-primary)` etc.
6. Cambio tema = update CSS variables, zero reload

### Available Fonts (preimpostati)

Inter, Space Grotesk, JetBrains Mono, Outfit, Orbitron, IBM Plex Sans

## Post/Thread Versioning & Edit History

### Edit Mechanism

- L'autore originale puo modificare il proprio post o thread
- Edit = nuova TX con stesso `id` + `version + 1`, firmata dall'autore
- La versione piu alta e canonica (mostrata di default)
- Le versioni precedenti restano on-chain (immutabili)
- Il server cache solo la versione corrente in SQLite, ma ricostruisce lo storico dalla chain on-demand

### Edit History UI

- Accanto a ogni post/thread editato: badge "modificato" con timestamp ultima modifica
- Click sul badge apre modale con lista versioni (dalla chain)
- Ogni versione mostra: contenuto completo, data, numero versione
- Opzionale: diff visuale rispetto alla versione precedente
- Endpoint: `GET /api/v1/post/:id/history` e `GET /api/v1/thread/:id/history`
- Il server legge tutte le TX con quell'id dalla chain e le restituisce ordinate per versione decrescente

### Entities with Versioning

- **Posts** (`FORUM_POST`): contenuto
- **Threads** (`FORUM_THREAD`): titolo e contenuto
- **User profiles** (`FORUM_USER`): bio e avatar
- **Theme config** (`FORUM_CONFIG`): configurazione tema admin

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
  version INTEGER DEFAULT 1,
  lastPostAt INTEGER,
  postCount INTEGER DEFAULT 0,
  createdAt INTEGER,
  updatedAt INTEGER
);

CREATE TABLE posts (
  id TEXT PRIMARY KEY,
  threadId TEXT NOT NULL,
  parentId TEXT,
  content TEXT NOT NULL,
  authorId TEXT NOT NULL,
  hidden INTEGER DEFAULT 0,
  version INTEGER DEFAULT 1,
  score INTEGER DEFAULT 0,
  createdAt INTEGER,
  updatedAt INTEGER
);

-- Anti-replay: nonce gia visti (mantenuti indefinitamente, ~36 byte ciascuno)
CREATE TABLE seen_nonces (
  nonce TEXT PRIMARY KEY,
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

CREATE TABLE config (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  baseTheme TEXT,
  overrides TEXT,
  authorId TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  createdAt INTEGER,
  updatedAt INTEGER
);

-- Full-text search (cache-only, ricostruibile)
CREATE VIRTUAL TABLE search_index USING fts5(
  entityId,
  title,
  content,
  content='',
  tokenize='unicode61'
);

-- Indexes for common queries
CREATE INDEX idx_threads_category ON threads(categoryId, lastPostAt DESC);
CREATE INDEX idx_posts_thread ON posts(threadId, createdAt);
CREATE INDEX idx_votes_post ON votes(postId);
CREATE INDEX idx_roles_target ON roles(targetUserId);
CREATE INDEX idx_moderations_post ON moderations(postId);
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
| PUT | `/api/v1/categories/:id` | Edit category (admin only, signed, increments version) |

### Threads
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/threads?category=X&page=1` | List threads in category, paginated |
| GET | `/api/v1/thread/:id` | Thread detail with nested posts |
| POST | `/api/v1/threads` | Create thread (signed, optional encryption) |

### Threads (continued)
| Method | Route | Description |
|--------|-------|-------------|
| PUT | `/api/v1/thread/:id` | Edit thread (signed, increments version) |

### Posts
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/posts` | Create post/reply (signed) |
| PUT | `/api/v1/post/:id` | Edit post (signed, increments version) |
| GET | `/api/v1/posts?thread=X` | Get posts for thread (with nesting) |

### Votes
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/vote` | Vote on post (signed, +1 or -1, mutable) |

### Moderation
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/moderate` | Moderate action: hide/flag post (moderator, signed) |
| POST | `/api/v1/moderate/thread` | Lock/pin/unpin thread (moderator, signed) |
| POST | `/api/v1/role` | Assign role (admin, signed) |

### History (Versioning)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/post/:id/history` | Get all versions of a post from chain |
| GET | `/api/v1/thread/:id/history` | Get all versions of a thread from chain |
| GET | `/api/v1/user/:id/history` | Get all versions of a user profile from chain |

### Theme / Config
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/config/theme` | Get current theme config (latest version) |
| PUT | `/api/v1/config/theme` | Update theme config (admin only, signed, increments version) |
| GET | `/api/v1/config/theme/history` | Get theme config version history |

### Search
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/search?q=term` | Full-text search su thread e post (SQLite FTS5, cache-only) |

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
| Theme Admin | `/admin/theme` | Theme gallery, customization panel with live preview |
| Dashboard | `/dashboard` | Forum stats, blockchain status, sync info |

## Anti-Spam

- Rate limiting: max 1 post per 10 seconds per user
- Registration required: must have `FORUM_USER` TX to post
- Admin can ban users: `FORUM_ROLE` with `role: "banned"`
- Moderators can hide posts: `FORUM_MODERATION` with `action: "hide"`
- Hidden posts are not deleted (immutable chain) but client hides them by default
- Rate limiting per IP address in aggiunta a per-user-ID
- Rate limiting su tutti gli endpoint di scrittura (non solo post)
- Account orfani: se un utente perde la chiave, il suo username resta bloccato. Non esiste recovery. L'utente deve creare una nuova identita con un nuovo username

## Configuration Notes

- `APP_TAG` in `iota.js` deve essere cambiato da `exart26` a `iotaforum` per evitare collisioni on-chain
- `FORUM_INDEX` e firmato con la chiave del wallet del server per prevenire poisoning durante il recovery
- Il server restituisce il `digest` IOTA al client dopo ogni TX, per verifica indipendente su explorer

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
│   │   ├── edit-post.js
│   │   ├── edit-thread.js
│   │   ├── post-history.js
│   │   ├── thread-history.js
│   │   ├── vote.js
│   │   ├── moderate.js
│   │   ├── assign-role.js
│   │   ├── api-categories.js
│   │   ├── api-threads.js
│   │   ├── api-thread-detail.js
│   │   ├── api-config-theme.js
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
│   │   │   ├── ThemeAdmin.jsx
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
│   │   │   ├── ThreadList.jsx      # New
│   │   │   ├── EditHistory.jsx    # New: version history modal
│   │   │   └── ThemeGallery.jsx   # New: theme selection cards
│   │   ├── hooks/          # Copied from ExArt26 + new
│   │   │   ├── useApi.js
│   │   │   ├── useWebSocket.js
│   │   │   ├── useIdentity.js      # New: RSA keypair management
│   │   │   └── useTheme.js        # New: theme context + CSS vars
│   │   └── api/
│   │       └── endpoints.js
│   └── vite.config.js
├── docs/
├── logs/
├── .tmp/
└── package.json
```
