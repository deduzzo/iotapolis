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

Ruoli on-chain:
- 0 = BANNED (nessuna operazione)
- 1 = USER (post, thread, voto)
- 2 = MODERATOR (+ categorie, moderazione, ban/unban)
- 3 = ADMIN (+ config, gestione ruoli)

Ogni entry function verifica il ruolo del chiamante PRIMA di eseguire.
Se il ruolo e insufficiente, la TX viene rifiutata dai validatori.

### Backend (Sails.js)

- `api/utility/iota.js` — SDK wrapper, publishDataMove(), queryForumEvents(), setUserRole()
- `api/utility/ForumManager.js` — Sync blockchain -> SQLite, dual-mode (Move/legacy)
- `api/utility/db.js` — SQLite schema + query helpers
- `api/controllers/` — REST API endpoints
- `config/private_iota_conf.js` — Config con mnemonic, chiavi RSA, IDs contratto (gitignored)

### Frontend (React + Vite)

- `frontend/src/pages/` — Pagine: Home, Thread, Category, Identity, Settings, Admin, Setup
- `frontend/src/components/` — Layout, Sidebar, IdentityBadge, BlockchainInfo
- `frontend/src/hooks/` — useApi, useIdentity, useTheme, useWebSocket

## Key Files

| File | Descrizione |
|------|-------------|
| `move/forum/sources/forum.move` | Smart contract — ruoli, permessi, eventi |
| `api/utility/iota.js` | Interfaccia IOTA SDK — publish, query, setUserRole |
| `api/utility/ForumManager.js` | Sync chain -> cache, processTransaction handlers |
| `api/utility/move-publish.js` | Script deploy contratto |
| `api/utility/db.js` | Schema SQLite + model factory |
| `config/bootstrap.js` | Auto-genera config, init wallet, avvia sync |
| `config/routes.js` | Tutte le route API |

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

- I dati pubblicati on-chain sono sempre gzippati (JSON -> gzip -> vector<u8>)
- Ogni azione frontend e firmata RSA-2048 dal browser
- Il backend verifica la firma prima di inoltrare al contratto Move
- La cache SQLite e ricostruibile: `queryEvents({ package: PACKAGE_ID })`
- Connection string formato: `network:packageId:forumObjectId`
- Un forum = un deploy del contratto = un Package ID unico

## Comandi

```bash
npm run dev              # Backend + frontend in sviluppo
npm run move:deploy      # Compila + deploya contratto Move
npm run move:build       # Solo compilazione
npm start                # Produzione
npm run build            # Build frontend
```
