# IOTA Free Forum — Project Context

## Overview

Forum decentralizzato su IOTA 2.0 Rebased con smart contract Move.
Tutti i dati sono on-chain (eventi Move), la cache SQLite e ricostruibile.
I permessi sono verificati on-chain dallo smart contract, non dal server.

## Architecture

### Smart Contract Move (`move/forum/sources/forum.move`)

Il contratto e il cuore del sistema. Contiene:

- **Forum** (shared object): registro utenti con ruoli (`Table<address, u8>`)
- **AdminCap** (owned object): capability del deployer
- **ForumEvent**: evento emesso per ogni operazione (dati gzippati)
- **RoleChanged**: evento emesso quando un ruolo cambia

Ruoli on-chain: 0=BANNED, 1=USER, 2=MODERATOR, 3=ADMIN

### Backend (Sails.js)

- `api/utility/iota.js` — SDK wrapper, publishDataMove(), queryForumEvents(), subscribeToForumEvents()
- `api/utility/ForumManager.js` — Sync blockchain -> SQLite, polling 30s, auto-repair 60s
- `api/utility/db.js` — SQLite schema + model factory
- `api/controllers/` — REST API endpoints
- `config/private_iota_conf.js` — Config con mnemonic, chiavi RSA, IDs contratto (gitignored)

### Frontend (React 19 + Vite 6 + TailwindCSS 4)

- `frontend/src/pages/` — Home, Thread, Category, Identity, Settings, Admin, Dashboard, Setup, NewThread
- `frontend/src/components/` — RichEditor (Tiptap), PostCard (dual layout), ThreadList (dual layout), Layout, LoadTestPanel
- `frontend/src/hooks/` — useApi, useIdentity, useTheme, useWebSocket
- `frontend/src/i18n/` — 8 lingue (IT, EN, ES, DE, FR, PT, JA, ZH) con react-i18next
- `frontend/src/contexts/ThemeContext.jsx` — 7 temi, selezione per-utente in localStorage

### Desktop (Electron)

- `desktop/main.js` — Avvia Sails + apre BrowserWindow su localhost:1337
- `desktop/package.json` — Config electron-builder per Win/Mac/Linux
- Auto-update via GitHub Releases (electron-updater)
- Dati utente salvati in appdata (`FORUM_DATA_DIR`)

### Multi-Platform Data Paths

- **Dev/Web**: `.tmp/iota-forum.db`, `config/private_iota_conf.js`
- **Electron**: `$APPDATA/iota-free-forum-desktop/forum-data/` (set via `FORUM_DATA_DIR` env var)
- Il codice controlla `process.env.FORUM_DATA_DIR` — se presente usa quello, altrimenti `.tmp/`

## Key Files

| File | Descrizione |
|------|-------------|
| `move/forum/sources/forum.move` | Smart contract — ruoli, permessi, eventi |
| `api/utility/iota.js` | IOTA SDK — publish, query, subscribe, setUserRole |
| `api/utility/ForumManager.js` | Sync, polling 30s, repair 60s, publishToChain, RT subscription |
| `api/utility/db.js` | Schema SQLite + model factory + migrations |
| `config/bootstrap.js` | Init wallet, sync, polling, repair, faucet monitor |
| `config/routes.js` | Tutte le route API |
| `frontend/src/components/RichEditor.jsx` | Tiptap WYSIWYG editor → markdown |
| `frontend/src/components/PostCard.jsx` | Post con dual layout (card/forum) |
| `frontend/src/i18n/index.js` | Config i18next + language detection |
| `desktop/main.js` | Electron main process |
| `scripts/release.sh` | Script release: version bump, build, tag, GitHub Release |

## Real-time Sync

1. **WebSocket** (stesso server): broadcast `dataChanged` con `entity` + `action` per update granulari
2. **Blockchain polling** (cross-node): ogni 30s `pollNewEvents()` via cursor incrementale
3. **Auto-repair**: ogni 60s `repairSync()` confronta cache vs blockchain, fixa mismatch
4. **RT subscription** (tentativo): `subscribeEvent` con timeout 10s, fallback a polling
5. **Optimistic UI**: post/voti appaiono subito, confermati async

## Tag sistema (ForumEvent.tag)

| Tag | Funzione Move | Ruolo minimo |
|-----|---------------|-------------|
| FORUM_USER | register() | Nessuno |
| FORUM_THREAD | post_event() | USER |
| FORUM_POST | post_event() | USER |
| FORUM_VOTE | post_event() | USER |
| FORUM_CATEGORY | mod_post_event() | MODERATOR |
| FORUM_MODERATION | mod_post_event() | MODERATOR |
| FORUM_ROLE | admin_post_event() | ADMIN |
| FORUM_CONFIG | admin_post_event() | ADMIN |

## Convenzioni

- Dati on-chain sempre gzippati (JSON -> gzip -> vector<u8>)
- Ogni azione frontend firmata RSA-2048
- Backend verifica firma + nonce anti-replay + freshness 24h
- Cache SQLite ricostruibile: `queryEvents({ package: PACKAGE_ID })`
- Connection string: `network:packageId:forumObjectId`
- Un forum = un deploy del contratto = un Package ID unico
- Tutti i broadcast includono `entity` per filtraggio websocket granulare

## Comandi

```bash
# Development
npm run dev              # Backend + frontend (2 porte: 1337 + 5173)
npm start                # Produzione (porta unica 1337)
npm run build            # Build frontend → .tmp/public/

# Smart Contract
npm run move:build       # Compila contratto Move
npm run move:deploy      # Compila + deploya su testnet

# Desktop (Electron)
npm run desktop:dev      # Electron in dev mode
npm run desktop:build    # Build per piattaforma corrente
npm run desktop:build:win    # Build Windows .exe
npm run desktop:build:mac    # Build macOS .dmg
npm run desktop:build:linux  # Build Linux .AppImage

# Release
npm run release          # Script interattivo: version bump → build → tag → GitHub Release
./scripts/release.sh     # Equivalente
./scripts/release.sh --patch   # Auto patch bump
./scripts/release.sh --minor   # Auto minor bump
./scripts/release.sh --major   # Auto major bump
```
