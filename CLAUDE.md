# IOTA Free Forum — Project Context

## Overview

Forum decentralizzato su IOTA 2.0 Rebased con smart contract Move.
Ogni utente ha il proprio wallet IOTA (Ed25519) e firma transazioni direttamente.
Il server e solo un indexer/cache — non firma mai per conto degli utenti.
Include sistema pagamenti completo: tip, abbonamenti, marketplace, escrow multi-sig.

## Architecture

### Smart Contract Move (`move/forum/sources/forum.move`)

Il contratto e il cuore del sistema. Contiene:

- **Forum** (shared object): registro utenti con ruoli, abbonamenti, badge, reputazione, treasury
- **AdminCap** (owned object): capability del deployer
- **Escrow** (shared objects): escrow multi-sig 2-di-3 per servizi tra utenti
- **ForumEvent**: evento per ogni operazione forum (dati gzippati)
- **TipEvent, SubscriptionEvent, PurchaseEvent, BadgeEvent**: eventi pagamento
- **EscrowCreated, EscrowUpdated, RatingEvent**: eventi escrow e reputazione

Ruoli on-chain: 0=BANNED, 1=USER, 2=MODERATOR, 3=ADMIN

Entry functions: register, post_event, mod_post_event, admin_post_event, set_user_role,
tip, subscribe, renew_subscription, purchase_content, purchase_badge, configure_tier,
configure_badge, create_escrow, mark_delivered, open_dispute, vote_release, vote_refund,
rate_trade, withdraw_funds

### Backend (Sails.js) — INDEXER ONLY

Il backend NON firma transazioni. E un puro indexer:
- `api/utility/iota.js` — SDK wrapper, query eventi, subscribe
- `api/utility/ForumManager.js` — Sync blockchain -> SQLite, usa `eventAuthor` (verificato on-chain)
- `api/utility/db.js` — SQLite schema (users, threads, posts, votes, tips, escrows, reputations, badges, ecc.)
- `api/controllers/` — REST API read-only + faucet
- `config/private_iota_conf.js` — Config con mnemonic server (solo per faucet), chiavi RSA legacy (gitignored)

### Frontend (React 19 + Vite 6 + TailwindCSS 4)

- `frontend/src/api/crypto.js` — Ed25519 keypair (IOTA SDK), BIP39 mnemonic, AES-256-GCM encryption
- `frontend/src/hooks/useIdentity.js` — Wallet management, mnemonic encrypt/decrypt, direct TX signing
- `frontend/src/hooks/useWallet.js` — Pagamenti: tip, subscribe, purchase, escrow, faucet
- `frontend/src/pages/` — Home, Thread, Category, Identity, Settings, Admin, Dashboard, Setup, NewThread, Wallet, Marketplace, EscrowDashboard, Subscription
- `frontend/src/components/` — RichEditor, PostCard, ThreadList, TipButton, ReputationBadge, PaywallGate, EscrowCard, IdentityBadge, Layout
- `frontend/src/i18n/` — 8 lingue con react-i18next
- `frontend/src/contexts/ThemeContext.jsx` — 7 temi

### Desktop (Electron)

- `desktop/main.js` — Avvia Sails + apre BrowserWindow
- Auto-update via GitHub Releases (electron-updater)

## Security Model

- Ogni utente ha un wallet IOTA Ed25519 proprio (derivato da mnemonic BIP39)
- L'utente firma transazioni DIRETTAMENTE sulla blockchain
- `ctx.sender()` verificato dai validatori IOTA a livello di protocollo
- Il server NON possiede chiavi private degli utenti
- Il server NON firma transazioni per conto degli utenti
- `ForumManager.processTransaction()` usa `eventAuthor` dal campo `author` dell'evento blockchain
- `data.authorId` dal payload viene IGNORATO (prevenzione impersonazione)
- Escrow: voti cross-validati (non puoi votare su entrambi i lati)
- Overpayment: resto restituito automaticamente
- Endpoint admin (full-reset, sync-reset): richiedono firma Ed25519 verificata
- Faucet: rate limit per address + cooldown globale + limite per IP

## Key Files

| File | Descrizione |
|------|-------------|
| `move/forum/sources/forum.move` | Smart contract — ruoli, pagamenti, escrow, reputazione |
| `api/utility/iota.js` | IOTA SDK — query, subscribe |
| `api/utility/ForumManager.js` | Sync blockchain, handler eventi, usa eventAuthor |
| `api/utility/db.js` | Schema SQLite + model factory (tutte le tabelle) |
| `api/controllers/faucet-request.js` | Faucet gas per nuovi utenti (rate limited) |
| `config/bootstrap.js` | Init wallet (solo faucet), sync, polling |
| `config/routes.js` | Tutte le route API |
| `frontend/src/api/crypto.js` | Ed25519 keypair, BIP39, AES-256-GCM, IOTA client |
| `frontend/src/hooks/useIdentity.js` | Wallet management, TX signing, mnemonic |
| `frontend/src/hooks/useWallet.js` | Pagamenti: tip, subscribe, escrow, badge |
| `frontend/src/components/TipButton.jsx` | Pulsante tip su ogni post |
| `frontend/src/components/EscrowCard.jsx` | Card escrow con azioni e rating |
| `frontend/src/pages/Wallet.jsx` | Pagina wallet: saldo, transazioni, invio |
| `frontend/src/pages/Marketplace.jsx` | Marketplace: contenuti, servizi, badge |

## Real-time Sync

1. **WebSocket** (stesso server): broadcast `dataChanged` con `entity` + `action`
2. **Blockchain polling** (cross-node): ogni 30s `pollNewEvents()` via cursor incrementale
3. **IOTA subscribeEvent**: notifica nativa ~2s (con fallback a polling)
4. **Auto-repair**: ogni 60s `repairSync()` confronta cache vs blockchain

## Event Tags

| Tag | Function | Ruolo minimo |
|-----|----------|-------------|
| FORUM_USER | register() | Nessuno |
| FORUM_THREAD | post_event() | USER |
| FORUM_POST | post_event() | USER |
| FORUM_VOTE | post_event() | USER |
| FORUM_CATEGORY | mod_post_event() | MODERATOR |
| FORUM_MODERATION | mod_post_event() | MODERATOR |
| FORUM_ROLE | admin_post_event() | ADMIN |
| FORUM_CONFIG | admin_post_event() | ADMIN |
| FORUM_TIP | (on-chain event) | USER |
| FORUM_SUBSCRIPTION | (on-chain event) | USER |
| FORUM_PURCHASE | (on-chain event) | USER |
| FORUM_BADGE | (on-chain event) | USER |
| FORUM_ESCROW_CREATED | (on-chain event) | USER |
| FORUM_ESCROW_UPDATED | (on-chain event) | USER |
| FORUM_RATING | (on-chain event) | USER |

## Convenzioni

- Dati on-chain sempre gzippati (JSON -> gzip -> vector<u8>)
- Identita utente = indirizzo IOTA (0x...), non piu USR_
- Ogni azione firmata dall'utente con Ed25519 nativo IOTA
- Backend verifica `eventAuthor` dall'evento blockchain, non dal payload
- Cache SQLite ricostruibile: sync da eventi blockchain
- Connection string: `network:packageId:forumObjectId`
- Pagamenti: il contratto gestisce treasury, fee (5% marketplace, 2% escrow)
- Escrow: 2-di-3 multi-sig, voti cross-validati, deadline enforcement
- Overpayment: resto automatico al sender

## Comandi

```bash
# Development
npm run dev              # Backend + frontend (2 porte: 1337 + 5173)
npm start                # Produzione (porta unica 1337)
npm run build            # Build frontend -> .tmp/public/

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
npm run release          # Script interattivo: version bump -> build -> tag -> GitHub Release
```
