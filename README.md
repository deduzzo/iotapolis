# IOTA Free Forum

Forum decentralizzato su blockchain IOTA 2.0 Rebased. Post immutabili e firmati crittograficamente. Zero fee, zero account centralizzati.

> Fork architetturale di [ExArt26 IOTA](https://github.com/deduzzo/exart26-iota) — riusa il layer blockchain con un modello dati completamente nuovo per forum.

## Stack

- **Backend**: Sails.js v1.5 + Node.js >= 17
- **Blockchain**: IOTA 2.0 Rebased (@iota/iota-sdk) — zero fee
- **Backup**: Arweave (opzionale)
- **Cache locale**: better-sqlite3
- **Frontend**: React 19 + Vite 6 + TailwindCSS 4 + Framer Motion
- **Real-time**: Socket.io v2
- **Crittografia**: RSA-2048 (firma + cifratura) + AES-256-CBC

## Architecture

```
Browser (React SPA)
  ├─ Keypair RSA-2048 in localStorage
  ├─ Firma ogni azione con chiave privata
  │
  │  REST API + WebSocket
  ▼
Server Forum (Sails.js)
  ├─ Verifica firma RSA di ogni richiesta
  ├─ Pubblica TX su IOTA (gzip + chain-linking)
  ├─ Cache SQLite (ricostruibile dalla chain)
  │
  ▼
IOTA 2.0 Rebased (source of truth)
  └─ Arweave (backup opzionale)
```

## Setup

```bash
npm install
cd frontend && npm install && cd ..
cp config/sample_private_iota_conf.js config/private_iota_conf.js
# Edit private_iota_conf.js with your IOTA node URL and mnemonic
npm run dev
```

## Features

- Identita pseudonima: keypair RSA-2048 nel browser, export/import
- Post e thread firmati crittograficamente e immutabili on-chain
- Thread cifrati end-to-end (AES-256-CBC, chiavi distribuite via RSA)
- Sistema di temi: 4 preset built-in, personalizzazione admin
- Versioning: storico modifiche consultabile dalla blockchain
- Votazione e moderazione decentralizzata
- Ricerca full-text (SQLite FTS5)
- Real-time via WebSocket

## License

MIT
