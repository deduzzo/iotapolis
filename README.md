# IOTA Free Forum

Forum decentralizzato su blockchain IOTA 2.0 Rebased con smart contract Move. Post immutabili, permessi verificati on-chain, zero fee su testnet.

> Fork architetturale di [ExArt26 IOTA](https://github.com/deduzzo/exart26-iota) — riusa il layer blockchain con un modello dati completamente nuovo per forum.

## Stack

- **Backend**: Sails.js v1.5 + Node.js >= 18
- **Smart Contract**: Move (IOTA MoveVM) — permessi e ruoli on-chain
- **Blockchain**: IOTA 2.0 Rebased (@iota/iota-sdk) — zero fee su testnet
- **Cache locale**: better-sqlite3 (ricostruibile dagli eventi on-chain)
- **Frontend**: React 19 + Vite 6 + TailwindCSS 4 + Framer Motion
- **Real-time**: Socket.io v2
- **Crittografia**: RSA-2048 (firma + cifratura) + AES-256-CBC

## Architettura

```
Browser (React SPA)
  |-- Keypair RSA-2048 in localStorage
  |-- Firma ogni azione con chiave privata
  |
  |  REST API + WebSocket
  v
Server Forum (Sails.js)
  |-- Verifica firma RSA di ogni richiesta
  |-- Chiama il contratto Move via moveCall()
  |-- Cache SQLite (ricostruita dagli eventi on-chain)
  |
  v
Smart Contract Move (on-chain, immutabile)
  |-- Forum (shared object): registro utenti + ruoli
  |-- Verifica permessi ad ogni operazione
  |-- Emette ForumEvent per ogni dato
  |
  v
IOTA 2.0 Rebased (source of truth)
  |-- Eventi queryabili per Package ID
  |-- Tutti i nodi vedono gli stessi dati
```

## Smart Contract — Sistema Ruoli On-Chain

Ogni utente ha un ruolo memorizzato nella `Table<address, u8>` del contratto:

| Livello | Ruolo | Permessi |
|---------|-------|----------|
| 0 | **BANNED** | Nessuna operazione permessa |
| 1 | **USER** | Post, thread, voto |
| 2 | **MODERATOR** | + categorie, moderazione (hide/unhide), ban/unban utenti |
| 3 | **ADMIN** | + configurazione forum, gestione ruoli (promozione/degradazione) |

### Funzioni Move e permessi

| Funzione | Ruolo minimo | Uso |
|----------|-------------|-----|
| `register()` | Nessuno (aperta) | Registrazione nuovi utenti (ROLE_USER) |
| `post_event()` | USER (1) | Thread, post, voti |
| `mod_post_event()` | MODERATOR (2) | Categorie, moderazione |
| `admin_post_event()` | ADMIN (3) | Config forum, gestione ruoli |
| `set_user_role()` | MODERATOR (2) | Cambio ruolo utenti |

### Regole di sicurezza (enforce on-chain)

- **Utenti bannati**: ogni operazione viene rifiutata dai validatori
- **Promozione**: non puoi promuovere qualcuno a un ruolo >= al tuo
- **Protezione ruolo**: non puoi modificare utenti con ruolo >= al tuo
- **Self-protection**: non puoi cambiare il tuo stesso ruolo
- **Registrazione**: one-time per indirizzo, ruolo iniziale = USER
- **Admin deployer**: chi deploya il contratto e auto-registrato come ADMIN

## Quick Start

```bash
# 1. Installa
git clone <repo-url> iota-free-forum
cd iota-free-forum
npm install
cd frontend && npm install && cd ..

# 2. Primo avvio (genera config + wallet)
npm run dev
# Attendi "Sails lifted" poi CTRL+C

# 3. Deploy smart contract (compila + pubblica su testnet)
npm run move:deploy

# 4. Avvia
npm run dev
```

Vedi [DEPLOY.md](DEPLOY.md) per la guida completa.

## Connection String

Ogni forum ha una connection string unica:

```
testnet:0xPACKAGE_ID:0xFORUM_OBJECT_ID
```

Gli altri utenti la incollano in "Collegati a un forum esistente" per:
1. Collegarsi allo smart contract
2. Sincronizzare tutti i dati (utenti, categorie, post, voti)
3. Registrarsi e interagire direttamente con la blockchain

## Features

- Smart contract Move con ruoli e permessi verificati on-chain
- Identita pseudonima: keypair RSA-2048 nel browser, export/import
- Post e thread firmati crittograficamente e immutabili on-chain
- Thread cifrati end-to-end (AES-256-CBC, chiavi distribuite via RSA)
- Sistema di temi: 4 preset built-in, personalizzazione admin
- Versioning: storico modifiche consultabile dalla blockchain
- Votazione e moderazione decentralizzata
- Ricerca full-text (SQLite FTS5)
- Real-time via WebSocket
- Ogni utente paga il proprio gas (gratis su testnet via faucet)

## Comandi

| Comando | Descrizione |
|---------|-------------|
| `npm run dev` | Avvia backend + frontend in sviluppo |
| `npm start` | Avvia in produzione |
| `npm run build` | Build frontend |
| `npm run move:build` | Compila il contratto Move |
| `npm run move:deploy` | Compila + deploya il contratto |
| `npm run move:install-cli` | Installa il CLI IOTA |

## License

MIT
