🌍 [English](README.md) | [Italiano](README.it.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português](README.pt.md) | [中文](README.zh.md) | [日本語](README.ja.md)

<p align="center">
  <img src="https://img.shields.io/badge/IOTA-2.0_Rebased-00f0ff?style=for-the-badge&logo=iota&logoColor=white" alt="IOTA 2.0" />
  <img src="https://img.shields.io/badge/Smart_Contract-Move-8B5CF6?style=for-the-badge" alt="Move" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT" />
</p>

<h1 align="center">IotaPolis</h1>

<p align="center">
  <strong>Una piattaforma comunitaria completamente decentralizzata con pagamenti integrati, marketplace ed escrow — basata su IOTA 2.0 e smart contract Move.</strong><br/>
  Ogni post e on-chain. Ogni utente firma con il proprio wallet. Ogni pagamento e trustless.
</p>

<p align="center">
  <a href="#-avvio-rapido">Avvio Rapido</a> &bull;
  <a href="#-funzionalita">Funzionalita</a> &bull;
  <a href="#-architettura">Architettura</a> &bull;
  <a href="#-smart-contract">Smart Contract</a> &bull;
  <a href="#-pagamenti--marketplace">Pagamenti</a> &bull;
  <a href="#-temi">Temi</a> &bull;
  <a href="#-multi-nodo">Multi-Nodo</a> &bull;
  <a href="#-contribuire">Contribuire</a>
</p>

---

## Perche IotaPolis?

I forum tradizionali dipendono da un server centrale che puo essere chiuso, censurato o compromesso. **IotaPolis** memorizza ogni dato sulla blockchain IOTA 2.0 come eventi dello smart contract Move. Il server locale e solo una cache — la blockchain e la fonte di verita.

- **Vera decentralizzazione** — Ogni utente ha il proprio wallet IOTA (Ed25519). Il server non detiene mai chiavi private
- **Nessun punto di rottura singolo** — Qualsiasi nodo puo ricostruire l'intero forum dagli eventi on-chain
- **Storico immutabile** — Ogni post, modifica e voto e registrato permanentemente con un digest di transazione
- **Permessi on-chain** — I ruoli (Utente, Moderatore, Admin) sono applicati dallo smart contract, non dal server
- **Economia integrata** — Mance, abbonamenti, contenuti a pagamento, badge ed escrow — tutto on-chain
- **Zero commissioni su testnet** — La testnet IOTA 2.0 Rebased fornisce gas gratuito tramite faucet automatico

---

## Avvio Rapido

```bash
# Clona
git clone https://github.com/deduzzo/iotapolis.git
cd iotapolis

# Installa le dipendenze
npm install
cd frontend && npm install && cd ..

# Primo avvio — genera il wallet del server + configurazione
npm run dev
# Attendi "Sails lifted", poi Ctrl+C

# Deploya lo smart contract Move sulla testnet IOTA
npm run move:deploy

# Avvia il forum
npm run dev
```

Apri `http://localhost:5173` — crea un wallet, ottieni gas dal faucet, registra un nome utente e inizia a postare.

> Consulta [DEPLOY.md](DEPLOY.md) per il deployment in produzione, reti personalizzate e configurazione avanzata.

---

## Funzionalita

### Forum Base

| Funzionalita | Descrizione |
|---------|-------------|
| **Post on-chain** | Ogni thread, post, risposta, voto e modifica e un evento Move su IOTA 2.0 |
| **Ruoli da smart contract** | Sistema di permessi a 4 livelli (Bannato/Utente/Moderatore/Admin) applicato dai validatori |
| **Identita wallet IOTA** | Keypair Ed25519 con mnemonic BIP39. Cifrato con password nel browser. Nessun account necessario |
| **Firma diretta** | Gli utenti firmano le transazioni direttamente sulla blockchain — il server non tocca mai le chiavi private |
| **Versionamento immutabile** | Lo storico delle modifiche e memorizzato on-chain. Ogni versione ha un digest TX sull'IOTA Explorer |
| **Risposte annidate** | Discussioni con annidamento a profondita illimitata |
| **Sistema di voto** | Upvote/downvote sui post. Punteggi calcolati dagli eventi di voto on-chain |
| **Ricerca full-text** | Indice SQLite FTS5 ricostruito dai dati blockchain |
| **8 lingue** | IT, EN, ES, DE, FR, PT, JA, ZH con react-i18next |
| **Stringa di connessione** | Condividi il tuo forum con `testnet:PACKAGE_ID:FORUM_OBJECT_ID` — chiunque puo unirsi |

### Pagamenti e Marketplace

| Funzionalita | Descrizione |
|---------|-------------|
| **Mance** | Invia IOTA direttamente agli autori dei post. Importi preimpostati + personalizzati. Tutto on-chain |
| **Abbonamenti** | Piani a livelli (Free/Pro/Premium) con prezzi e durate configurabili |
| **Contenuti a pagamento** | Gli autori impostano un prezzo per i thread. Cifrati con AES-256, chiave consegnata dopo il pagamento |
| **Categorie premium** | L'admin limita l'accesso alle categorie agli abbonati di un determinato livello |
| **Badge** | Badge acquistabili configurabili dall'admin, visualizzati accanto ai nomi utente |
| **Escrow (multi-sig)** | Escrow 2-di-3 per servizi: acquirente + venditore + arbitro. Fondi bloccati on-chain |
| **Reputazione** | Valutazioni on-chain (1-5 stelle) dopo la risoluzione dell'escrow. Storico operazioni immutabile |
| **Marketplace** | Sfoglia contenuti a pagamento, servizi e badge in una pagina dedicata |
| **Treasury** | Il forum raccoglie commissioni (5% marketplace, 2% escrow) in un treasury dello smart contract |

### Editor

| Funzionalita | Descrizione |
|---------|-------------|
| **Editor WYSIWYG avanzato** | Basato su Tiptap con toolbar completa |
| **Output Markdown** | Serializza in markdown pulito tramite `tiptap-markdown` |
| **Formattazione** | Grassetto, corsivo, barrato, titoli, citazione, riga orizzontale |
| **Codice** | Codice inline + blocchi di codice con evidenziazione della sintassi |
| **Tabelle** | Inserisci e modifica tabelle direttamente |
| **Immagini** | Inserisci tramite URL |
| **Emoji** | Selettore emoji (emoji-mart) |
| **@Menzioni** | Cerca e menziona utenti |

### Temi

7 temi integrati con selezione per utente:

| Tema | Stile | Layout |
|-------|-------|--------|
| **Neon Cyber** | Scuro, glassmorphism, bagliore neon ciano | Griglia di card |
| **Clean Minimal** | Chiaro, minimale, accento blu | Griglia di card |
| **Dark Pro** | Scuro, professionale, accento verde | Griglia di card |
| **Retro Terminal** | Scuro, monospace, neon verde | Griglia di card |
| **Invision Light** | Forum classico, bianco, accento blu | Layout tabella IPB |
| **Invision Dark** | Forum classico, grigio scuro, accento blu | Layout tabella IPB |
| **Material Ocean** | Material Design, blu navy, accento teal | Griglia di card |

### Sincronizzazione in Tempo Reale

| Funzionalita | Descrizione |
|---------|-------------|
| **Aggiornamenti WebSocket** | Eventi `dataChanged` granulari inviano aggiornamenti a componenti UI specifici |
| **UI ottimistica** | Post/voti appaiono istantaneamente, confermati in modo asincrono |
| **Polling blockchain** | Ogni 30 secondi controlla nuovi eventi on-chain |
| **IOTA subscribeEvent** | Sottoscrizione nativa eventi blockchain (~2s di latenza) |
| **Sincronizzazione cross-nodo** | Piu server restano sincronizzati tramite eventi blockchain |

---

## Architettura

```
Browser (React 19 + Vite 6 + TailwindCSS 4)
  |
  |-- Wallet IOTA Ed25519 (derivato da mnemonic, cifrato AES in localStorage)
  |-- Firma ed esegue transazioni DIRETTAMENTE sulla blockchain
  |-- Editor WYSIWYG avanzato (Tiptap) -> markdown
  |-- Motore temi (7 preset, variabili CSS)
  |-- Pagina wallet: saldo, mance, abbonamenti, escrow
  |
  |  REST API (cache in sola lettura) + Socket.io WebSocket
  v
Server (Sails.js + Node.js) — SOLO INDEXER
  |
  |-- Indicizza eventi blockchain in cache SQLite
  |-- Faucet: invia gas ai nuovi utenti (testnet)
  |-- Serve dati dalla cache via REST per query veloci
  |-- Broadcast WebSocket ad ogni cambio di stato
  |-- Polling blockchain ogni 30s per sincronizzazione cross-nodo
  |-- NON firma o pubblica transazioni per gli utenti
  |
  v
Smart Contract Move (on-chain, immutabile)
  |
  |-- Forum (condiviso): registro utenti, ruoli, abbonamenti, badge, reputazione, treasury
  |-- Escrow (oggetti condivisi): gestione fondi multi-sig 2-di-3
  |-- AdminCap (di proprieta): capability del deployer
  |-- 20+ funzioni entry con accesso basato sui ruoli
  |-- Emette eventi per ogni operazione (payload JSON compressi con gzip)
  |-- Gestisce tutti i pagamenti: mance, abbonamenti, acquisti, escrow
  |
  v
IOTA 2.0 Rebased (fonte di verita)
  |
  |-- Eventi interrogabili per Package ID
  |-- Tutti i nodi vedono gli stessi dati
  |-- Zero commissioni su testnet
```

### Flusso dei Dati

```
L'utente scrive un post
  -> L'editor Tiptap serializza in markdown
  -> Il frontend comprime il payload JSON con gzip
  -> Il keypair Ed25519 dell'utente firma la transazione
  -> La transazione viene eseguita direttamente sulla blockchain IOTA
  -> Lo smart contract verifica il ruolo (USER >= 1), emette un ForumEvent
  -> Il backend rileva l'evento tramite polling/subscribe
  -> Aggiorna la cache SQLite locale
  -> Trasmette 'dataChanged' via WebSocket
  -> Tutti i client connessi aggiornano la loro UI
```

---

## Smart Contract

Lo smart contract Move (`move/forum/sources/forum.move`) e il cuore della sicurezza. Tutti i permessi e i pagamenti sono applicati dai validatori IOTA, non dal server.

### Sistema dei Ruoli

| Livello | Ruolo | Permessi |
|-------|------|-------------|
| 0 | **BANNED** | Tutte le operazioni rifiutate dai validatori |
| 1 | **USER** | Postare, rispondere, votare, modificare i propri contenuti, mance, abbonamenti, acquisti |
| 2 | **MODERATOR** | + Creare categorie, moderare contenuti, bannare/sbannare, arbitrare escrow |
| 3 | **ADMIN** | + Configurazione forum, gestione ruoli, configurare livelli/badge, prelevare dal treasury |

### Funzioni Entry

**Forum (base):**

| Funzione | Ruolo Minimo | Scopo |
|----------|----------|---------|
| `register()` | Nessuno | Registrazione una tantum, assegna ROLE_USER |
| `post_event()` | USER | Thread, post, risposte, voti |
| `mod_post_event()` | MODERATOR | Categorie, azioni di moderazione |
| `admin_post_event()` | ADMIN | Configurazione forum, cambio ruoli |
| `set_user_role()` | MODERATOR | Cambiare ruoli utente (con vincoli) |

**Pagamenti:**

| Funzione | Ruolo Minimo | Scopo |
|----------|----------|---------|
| `tip()` | USER | Invia IOTA all'autore di un post |
| `subscribe()` | USER | Iscriversi a un livello |
| `renew_subscription()` | USER | Rinnovare un abbonamento esistente |
| `purchase_content()` | USER | Acquistare accesso a contenuti a pagamento |
| `purchase_badge()` | USER | Acquistare un badge |
| `configure_tier()` | ADMIN | Aggiungere/modificare livelli di abbonamento |
| `configure_badge()` | ADMIN | Aggiungere/modificare badge |
| `withdraw_funds()` | ADMIN | Prelevare dal treasury del forum |

**Escrow:**

| Funzione | Chi | Scopo |
|----------|-----|---------|
| `create_escrow()` | Acquirente | Bloccare fondi in escrow (multi-sig 2-di-3) |
| `mark_delivered()` | Venditore | Segnare il servizio come consegnato |
| `open_dispute()` | Acquirente | Aprire una disputa |
| `vote_release()` | Qualsiasi parte | Votare per rilasciare i fondi al venditore |
| `vote_refund()` | Qualsiasi parte | Votare per rimborsare l'acquirente |
| `rate_trade()` | Acquirente/Venditore | Valutare la controparte (1-5 stelle) |

### Sicurezza

- Ogni utente firma con il proprio keypair Ed25519 — `ctx.sender()` verificato dai validatori IOTA
- Il server non detiene mai le chiavi private degli utenti
- L'escrow utilizza voti cross-validati 2-di-3 (non si puo votare su entrambi i lati)
- I pagamenti in eccesso vengono rimborsati automaticamente (resto esatto restituito)
- Scadenze applicate sulle operazioni di escrow
- Gli utenti bannati vengono rifiutati a livello di contratto
- Non si puo promuovere sopra il proprio ruolo, ne modificare utenti di ruolo uguale o superiore

---

## Pagamenti & Marketplace

### Mance

Clicca il pulsante mancia su qualsiasi post per inviare IOTA direttamente all'autore. Scegli tra importi preimpostati (0.1, 0.5, 1.0 IOTA) o inserisci un importo personalizzato. Le mance sono istantanee, on-chain, senza intermediari.

### Abbonamenti

Gli admin configurano i livelli di abbonamento con prezzo e durata. Gli utenti si iscrivono pagando il prezzo del livello. Lo smart contract gestisce automaticamente scadenza e controllo degli accessi.

### Contenuti a Pagamento

Gli autori possono impostare un prezzo per i loro thread. Il contenuto e cifrato con AES-256. Dopo il pagamento (on-chain), l'acquirente riceve la chiave di decifratura. Il 5% di commissione va al treasury del forum.

### Escrow

Per servizi tra utenti, l'acquirente blocca i fondi in un escrow on-chain. Tre parti (acquirente, venditore, arbitro) formano un multi-sig 2-di-3. Due qualsiasi possono rilasciare o rimborsare i fondi. Il 2% di commissione al treasury del forum alla risoluzione.

### Reputazione

Dopo ogni risoluzione di escrow, entrambe le parti possono lasciare una valutazione (1-5 stelle + commento). Le valutazioni sono immutabili on-chain. I profili utente mostrano valutazione media, numero di operazioni, tasso di successo e volume.

---

## Multi-Nodo

IotaPolis supporta piu nodi indipendenti connessi allo stesso smart contract. Ogni nodo:

1. Esegue il proprio server Sails.js + frontend React
2. Ha la propria cache SQLite (ricostruibile)
3. Gli utenti firmano le transazioni direttamente on-chain
4. Si sincronizza dalla blockchain ogni 30 secondi

### Unirsi a un Forum Esistente

```bash
# Avvia il server
npm run dev

# Nel browser: vai su Setup -> "Connetti a un forum esistente"
# Incolla la stringa di connessione: testnet:0xPACKAGE_ID:0xFORUM_OBJECT_ID
# Il sistema sincronizza tutti gli eventi dalla blockchain
```

---

## Stack Tecnologico

| Livello | Tecnologia | Versione |
|-------|-----------|---------|
| **Blockchain** | IOTA 2.0 Rebased | Testnet |
| **Smart Contract** | Move (IOTA MoveVM) | — |
| **SDK** | @iota/iota-sdk | Ultima |
| **Backend** | Sails.js | 1.5 |
| **Runtime** | Node.js | >= 18 |
| **Database** | better-sqlite3 (cache) | Ultima |
| **Frontend** | React | 19 |
| **Bundler** | Vite | 6 |
| **CSS** | TailwindCSS | 4 |
| **Animazioni** | Framer Motion | 12 |
| **Editor** | Tiptap (ProseMirror) | 3 |
| **Icone** | Lucide React | Ultima |
| **Real-time** | Socket.io | 2 |
| **i18n** | react-i18next | 8 lingue |
| **Desktop** | Electron + electron-builder | 33 |
| **Crittografia** | Ed25519 (nativo IOTA) + AES-256-GCM + BIP39 | — |

---

## App Desktop (Electron)

Disponibile come applicazione desktop standalone per Windows, macOS e Linux. Il server gira integrato nell'app.

### Download

Scarica l'ultima release da [GitHub Releases](https://github.com/deduzzo/iotapolis/releases):

| Piattaforma | File | Aggiornamento automatico |
|----------|------|-------------|
| **Windows** | Installer `.exe` | Si |
| **macOS** | `.dmg` | Si |
| **Linux** | `.AppImage` | Si |

---

## Comandi

| Comando | Descrizione |
|---------|-------------|
| `npm run dev` | Avvia backend + frontend in sviluppo |
| `npm start` | Avvia in modalita produzione (porta singola 1337) |
| `npm run build` | Compila il frontend per la produzione |
| `npm run move:build` | Compila lo smart contract Move |
| `npm run move:deploy` | Compila + deploya il contratto sulla testnet IOTA |
| `npm run desktop:dev` | Avvia Electron in modalita sviluppo |
| `npm run desktop:build` | Compila l'app desktop per la piattaforma corrente |
| `npm run release` | Script di rilascio interattivo |

---

## Endpoint API

### Pubblici (cache in sola lettura)

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/v1/categories` | Elenca tutte le categorie con statistiche |
| GET | `/api/v1/threads?category=ID&page=N` | Elenca i thread in una categoria |
| GET | `/api/v1/thread/:id` | Dettaglio thread con tutti i post |
| GET | `/api/v1/posts?thread=ID` | Post di un thread |
| GET | `/api/v1/user/:id` | Profilo utente + reputazione + badge |
| GET | `/api/v1/user/:id/reputation` | Reputazione commerciale dell'utente |
| GET | `/api/v1/user/:id/subscription` | Stato abbonamento dell'utente |
| GET | `/api/v1/search?q=QUERY` | Ricerca full-text |
| GET | `/api/v1/dashboard` | Statistiche forum + pagamenti |
| GET | `/api/v1/marketplace` | Contenuti a pagamento, badge, top venditori |
| GET | `/api/v1/escrows` | Lista escrow (filtrabile) |
| GET | `/api/v1/escrow/:id` | Dettaglio escrow con valutazioni |
| GET | `/api/v1/tips/:postId` | Mance su un post specifico |
| GET | `/api/v1/forum-info` | Metadati forum + stringa di connessione |

### Azioni del server

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| POST | `/api/v1/faucet-request` | Richiedi gas per un nuovo indirizzo (con limite di frequenza) |
| POST | `/api/v1/full-reset` | Reset completo (richiede firma admin) |
| POST | `/api/v1/sync-reset` | Reset cache + risincronizzazione (richiede firma admin) |

Tutte le operazioni di scrittura (post, voti, moderazione, pagamenti, escrow) vengono eseguite direttamente sulla blockchain IOTA dal wallet dell'utente. Il server e un indexer in sola lettura.

---

## Come Funziona l'Identita

1. **Generazione** — Il browser crea un keypair Ed25519 da un mnemonic BIP39 (12 parole)
2. **Cifratura** — Il mnemonic viene cifrato con la password dell'utente (AES-256-GCM + PBKDF2) e salvato in localStorage
3. **Faucet** — Il backend invia gas IOTA al nuovo indirizzo (testnet)
4. **Registrazione** — L'utente chiama `register()` direttamente sullo smart contract Move
5. **Firma** — Ogni azione (post, voto, mancia, escrow) e una transazione firmata con la chiave Ed25519 dell'utente
6. **Verifica** — `ctx.sender()` verificato dai validatori IOTA a livello di protocollo
7. **Backup** — Gli utenti esportano le 12 parole del mnemonic per ripristinare su qualsiasi dispositivo

Nessuna password sul server. Nessuna email. Nessun account. Il tuo wallet e la tua identita.

---

## Contribuire

I contributi sono benvenuti! Questo progetto e in sviluppo attivo.

1. Fai il fork del repository
2. Crea un branch per la funzionalita: `git checkout -b feature/funzionalita-fantastica`
3. Apporta le tue modifiche
4. Esegui `npm run dev` e testa in locale
5. Committa: `git commit -m 'feat: aggiungi funzionalita fantastica'`
6. Pusha: `git push origin feature/funzionalita-fantastica`
7. Apri una Pull Request

---

## Licenza

Licenza MIT. Consulta [LICENSE](LICENSE) per i dettagli.

---

<p align="center">
  <strong>Costruito su IOTA 2.0 Rebased</strong><br/>
  <em>Ogni post e una transazione. Ogni permesso e uno smart contract. Ogni utente e un wallet.</em>
</p>
