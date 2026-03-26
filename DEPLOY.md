# Deploy Guide — IOTA Free Forum con Move Contract

## Prerequisiti

```bash
# Node.js 18+
node --version

# Homebrew (macOS) — necessario per installare il CLI IOTA
brew --version
```

## 1. Installazione

```bash
git clone <repo-url> iota-free-forum
cd iota-free-forum
npm install
cd frontend && npm install && cd ..
```

## 2. Primo avvio (genera config e wallet)

```bash
npm run dev
# Attendi "Sails lifted" poi CTRL+C
# Questo genera: config/private_iota_conf.js con mnemonic e chiavi RSA
```

## 3. Configura le porte (opzionale)

Modifica `config/private_iota_conf.js`:

```javascript
PORT: 1400,          // Backend
FRONTEND_PORT: 5174, // Frontend
```

## 4. Deploy dello Smart Contract

```bash
# Compila e deploya in un comando (installa il CLI IOTA automaticamente)
npm run move:deploy
```

Questo:

- Installa `iota` CLI via Homebrew (se assente)
- Compila il contratto Move
- Lo pubblica su testnet
- Salva `FORUM_PACKAGE_ID`, `FORUM_OBJECT_ID`, `ADMIN_CAP_ID` nel config
- Stampa la **connection string** da condividere

## 5. Avvio in produzione

```bash
# Build frontend
npm run build

# Avvia in produzione
npm start
```

## 6. Avvio in sviluppo

```bash
npm run dev
# Apri http://localhost:<FRONTEND_PORT>
```

## 7. Condivisione del forum

La connection string ha il formato:

```
testnet:0xPACKAGE_ID:0xFORUM_OBJECT_ID
```

Gli utenti la incollano in "Collegati a un forum esistente" nel setup.

## 8. Backup (importante!)

Salva in un posto sicuro:

- `config/private_iota_conf.js` — contiene mnemonic (wallet), chiavi RSA, e IDs del contratto
- Il mnemonic e la chiave del wallet admin. **Se lo perdi, perdi il controllo admin del forum.**

## 9. Cambio network (testnet → mainnet)

In `config/private_iota_conf.js`:

```javascript
IOTA_NETWORK: 'mainnet',
IOTA_MNEMONIC: null,           // Resettera e generera un nuovo wallet
FORUM_PACKAGE_ID: null,         // Da ri-deployare
FORUM_OBJECT_ID: null,
ADMIN_CAP_ID: null,
```

Poi ri-esegui:

```bash
npm run dev          # Genera nuovo wallet mainnet
# CTRL+C
npm run move:deploy  # Deploy su mainnet
npm start
```

## Comandi utili

| Comando | Descrizione |
|---|---|
| `npm run dev` | Avvia backend + frontend in sviluppo |
| `npm start` | Avvia in produzione |
| `npm run build` | Build frontend |
| `npm run move:build` | Compila solo il contratto Move |
| `npm run move:deploy` | Compila + deploya il contratto |
| `npm run move:install-cli` | Installa solo il CLI IOTA |

## Architettura

```
Utente A (admin)                    Utente B
    |                                   |
    v                                   v
[wallet A] ---moveCall--->  [Move Contract on IOTA]  <---moveCall--- [wallet B]
                                |
                          Forum (shared object)
                          - users registry (Table)
                          - event_count
                          - admin address
                                |
                          ForumEvent (emitted)
                          - tag, entity_id, data(gzip)
                          - version, author, timestamp
                                |
                    queryEvents({ package: PKG_ID })
                                |
                    +-----------+-----------+
                    |                       |
              [SQLite cache A]        [SQLite cache B]
              (ricostruita)           (ricostruita)
```

Ogni utente paga il proprio gas. Su testnet e gratis (faucet automatico).
