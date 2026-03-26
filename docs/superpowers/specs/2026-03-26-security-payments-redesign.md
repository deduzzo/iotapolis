# IOTA Free Forum — Security & Payments Redesign

## Overview

Ristrutturazione completa della sicurezza: da modello centralizzato (backend firma per tutti) a modello decentralizzato (ogni utente firma con il proprio wallet IOTA). Aggiunta sistema pagamenti completo: tip, abbonamenti, marketplace, escrow multi-sig con reputazione.

## 1. Architettura Crypto & Identita

### Stato attuale vs Nuovo

| | Ora | Nuovo |
|---|---|---|
| Keypair utente | RSA-2048 (Web Crypto) | Ed25519 (IOTA SDK, client-side) |
| Identita | `USR_` = SHA256(RSA pubkey) | Indirizzo IOTA = identita nativa |
| Firma TX | Backend firma con wallet unico | Utente firma direttamente |
| Ruolo backend | Proxy che firma per tutti | Cache/indexer + faucet + relay gas |
| Verifica | Backend verifica RSA | Smart contract verifica `ctx.sender()` |

### Flusso registrazione

1. Frontend genera Ed25519 keypair (IOTA SDK)
2. Frontend deriva indirizzo IOTA
3. Frontend chiede al backend: `POST /api/v1/faucet-request { address }`
4. Backend invia gas IOTA all'indirizzo dell'utente
5. Frontend costruisce TX e chiama `register()` sullo smart contract
6. `ctx.sender()` = indirizzo utente, registrato on-chain
7. Backend riceve evento via polling/subscribe, aggiorna cache SQLite

### Sicurezza chiave privata

- Chiave Ed25519 derivata da mnemonic BIP39 (12 parole)
- Mnemonic mostrato UNA volta, utente deve salvarlo
- In localStorage: keypair criptato AES-256 con password utente
- Export/import = export/import del mnemonic

### Migrazione identita esistenti

- Al primo login post-update, frontend genera nuovo keypair Ed25519
- Utente si ri-registra con nuovo indirizzo
- Username reclamato tramite prova di possesso vecchia chiave RSA
- Backend mappa vecchio USR_ a nuovo indirizzo IOTA

## 2. Sistema Pagamenti

### 2A. Tip/Donazioni

Pagamento diretto on-chain, nessun intermediario.

- `tip(forum, post_id, coin, recipient, clock, ctx)`
- Verifica sender registrato e non bannato
- Trasferisce Coin<IOTA> da sender a recipient
- Emette TipEvent { from, to, post_id, amount, timestamp }
- UI: pulsante tip su PostCard, preset (0.1 / 0.5 / 1.0 + custom)

### 2B. Abbonamenti

Tier configurabili dall'admin, pagamento va alla treasury del forum.

Tier esempio:
- Free (0): lettura, post base
- Pro (1 IOTA/mese): tutte categorie, thread premium, badge
- Premium (5 IOTA/mese): tutto + marketplace venditore, sezioni VIP

Funzioni: `configure_tier()`, `subscribe()`, `check_subscription()`

### 2C. Marketplace

**Thread a pagamento:**
- Autore crea thread con price > 0, contenuto criptato AES-256
- Compratore chiama `purchase_content()`, fondi trasferiti ad autore (- fee forum)
- Backend invia chiave AES criptata con pubkey del buyer

**Sezioni premium:**
- Admin imposta `category.access_tier`
- Contratto verifica subscription tier >= access_tier

**Badge acquistabili:**
- Admin configura badge (id, nome, prezzo, icona)
- Utente compra con `purchase_badge()`
- Badge visibili accanto al nome nella UI

### 2D. Escrow Multi-sig + Reputazione

3 parti: compratore, venditore, arbitro (moderatore/admin).

**Ciclo:** CREATED > FUNDED > DELIVERED > RESOLVED (release/refund)
Con ramo: FUNDED > DISPUTED > RESOLVED (arbitro vota)

**Multi-sig:** 2 voti su 3 (buyer + seller + arbitrator) per sbloccare.
- `vote_release()` = fondi al venditore
- `vote_refund()` = fondi al compratore
- Fee 1-2% al forum

**Reputazione on-chain:**
- UserReputation { total_trades, successful, disputes_won/lost, total_volume, rating_sum, rating_count }
- `rate_trade(escrow_id, score 1-5, comment)` dopo ogni escrow risolto
- Rating immutabile on-chain
- Badge automatici: "Trusted Seller" (>10 trade, >4.5 stelle)

## 3. Smart Contract Move — Strutture

### Forum aggiornato

```
Forum {
  id, admin, event_count, user_count, version,
  users: Table<address, u8>,
  subscriptions: Table<address, Subscription>,
  subscription_tiers: Table<u8, SubscriptionTier>,
  paid_contents: Table<String, PaidContent>,
  badges: Table<u8, Badge>,
  user_badges: Table<address, vector<u8>>,
  reputations: Table<address, UserReputation>,
  treasury: Balance<IOTA>,
}
```

### Nuovi eventi

```
TipEvent { from, to, post_id, amount, timestamp }
SubscriptionEvent { user, tier, expires_at, timestamp }
PurchaseEvent { buyer, content_id, author, amount, timestamp }
BadgeEvent { user, badge_id, timestamp }
EscrowEvent { escrow_id, action, actor, timestamp }
RatingEvent { escrow_id, rater, rated, score, comment, timestamp }
```

### Entry functions

Forum base (esistenti, invariati):
- `register()`, `post_event()`, `mod_post_event()`, `admin_post_event()`
- `set_user_role()`, `transfer_admin()`

Pagamenti (nuove):
- `tip()`, `withdraw_funds()`
- `configure_tier()`, `subscribe()`, `check_subscription()`
- `create_paid_content()`, `purchase_content()`
- `configure_badge()`, `purchase_badge()`
- `create_escrow()`, `mark_delivered()`, `open_dispute()`
- `vote_release()`, `vote_refund()`, `rate_trade()`

## 4. Backend — Indexer puro

### Ruolo

Il backend NON firma piu transazioni. Diventa:
- **Indexer:** ascolta eventi blockchain, popola cache SQLite
- **Faucet:** invia gas a nuovi utenti su richiesta
- **API server:** serve dati cached via REST per performance
- **WebSocket hub:** broadcast real-time ai client connessi
- **Content relay:** gestisce chiavi AES per contenuti a pagamento

### ForumManager fix critico

Ogni handler riceve `eventAuthor` dal campo `author` del ForumEvent (verificato da Move). Il `data.authorId` dentro il payload viene IGNORATO.

### Nuove tabelle SQLite

wallets, subscriptions, escrows, reputations, tips, purchases, badges, user_badges

### API endpoints nuovi

- `POST /api/v1/faucet-request` — richiedi gas per nuovo address
- `GET /api/v1/user/:id/reputation` — reputazione utente
- `GET /api/v1/user/:id/subscriptions` — stato abbonamento
- `GET /api/v1/escrows` — lista escrow (filtri: buyer/seller/status)
- `GET /api/v1/escrow/:id` — dettaglio escrow
- `GET /api/v1/marketplace` — lista servizi/contenuti a pagamento
- `GET /api/v1/tips/:postId` — tip ricevuti su un post

## 5. Frontend

### Crypto layer

- `crypto.js`: da RSA a Ed25519 via `@iota/iota-sdk/keypairs/ed25519`
- `useIdentity.js`: genera IOTA keypair, firma TX direttamente
- Mnemonic BIP39 per backup, AES-256 per storage locale
- `signAndSend()` diventa `signAndExecuteTransaction()` verso blockchain

### Nuove pagine/componenti

- **Wallet page:** saldo, storico transazioni, invia/ricevi IOTA
- **Marketplace page:** lista servizi, contenuti premium, filtri
- **Escrow dashboard:** escrow attivi, cronologia, dispute
- **Subscription page:** tier disponibili, stato abbonamento, rinnovo
- **TipButton component:** sui PostCard, con animazione
- **ReputationBadge component:** stelle, trade count, sul profilo
- **PaywallGate component:** wrapper per contenuti premium/categorie protette

## 6. Real-time

3 livelli invariati:
1. WebSocket (stesso server) — broadcast dataChanged
2. Blockchain polling 30s — pollNewEvents()
3. IOTA subscribeEvent — notifica nativa ~2s

Nuovi eventi broadcast: tipReceived, subscriptionChanged, escrowUpdated, purchaseCompleted, ratingReceived

## 7. Sicurezza

- Ogni utente firma TX con proprio keypair Ed25519
- `ctx.sender()` verificato nativamente dalla rete IOTA
- Smart contract enforza ruoli on-chain
- Backend non puo impersonare utenti
- `eventAuthor` dall'evento blockchain = identita vera
- Nessun single point of failure
- Chiavi private mai inviate al server
- Mnemonic backup responsabilita dell'utente
