🌍 [English](README.md) | [Italiano](README.it.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português](README.pt.md) | [中文](README.zh.md) | [日本語](README.ja.md)

<p align="center">
  <img src="https://img.shields.io/badge/IOTA-2.0_Rebased-00f0ff?style=for-the-badge&logo=iota&logoColor=white" alt="IOTA 2.0" />
  <img src="https://img.shields.io/badge/Smart_Contract-Move-8B5CF6?style=for-the-badge" alt="Move" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT" />
</p>

<h1 align="center">IotaPolis</h1>

<p align="center">
  <strong>Eine vollstaendig dezentrale Community-Plattform mit integrierten Zahlungen, Marktplatz und Treuhand — betrieben von IOTA 2.0 und Move Smart Contracts.</strong><br/>
  Jeder Beitrag liegt auf der Blockchain. Jeder Nutzer signiert mit seiner eigenen Wallet. Jede Zahlung ist vertrauenslos.
</p>

<p align="center">
  <a href="#-schnellstart">Schnellstart</a> &bull;
  <a href="#-funktionen">Funktionen</a> &bull;
  <a href="#-architektur">Architektur</a> &bull;
  <a href="#-smart-contract">Smart Contract</a> &bull;
  <a href="#-zahlungen--marktplatz">Zahlungen</a> &bull;
  <a href="#-themes">Themes</a> &bull;
  <a href="#-multi-node">Multi-Node</a> &bull;
  <a href="#-mitwirken">Mitwirken</a>
</p>

---

## Warum IotaPolis?

Herkoemmliche Foren sind von einem zentralen Server abhaengig, der abgeschaltet, zensiert oder kompromittiert werden kann. **IotaPolis** speichert saemtliche Daten als Move Smart Contract Events auf der IOTA 2.0 Blockchain. Der lokale Server ist lediglich ein Cache — die Blockchain ist die einzige Quelle der Wahrheit.

- **Echte Dezentralisierung** — Jeder Nutzer besitzt seine eigene IOTA-Wallet (Ed25519). Der Server verwahrt niemals private Schluessel
- **Kein Single Point of Failure** — Jeder Knoten kann das gesamte Forum aus On-Chain-Events rekonstruieren
- **Unveraenderliche Historie** — Jeder Beitrag, jede Bearbeitung und jede Abstimmung wird dauerhaft mit einem Transaction Digest aufgezeichnet
- **On-Chain-Berechtigungen** — Rollen (Nutzer, Moderator, Admin) werden vom Smart Contract durchgesetzt, nicht vom Server
- **Integrierte Wirtschaft** — Trinkgeld, Abonnements, kostenpflichtige Inhalte, Badges und Treuhand — alles On-Chain
- **Keine Gebuehren im Testnet** — IOTA 2.0 Rebased Testnet stellt kostenloses Gas ueber einen automatischen Faucet bereit

---

## Schnellstart

```bash
# Klonen
git clone https://github.com/deduzzo/iotapolis.git
cd iotapolis

# Abhaengigkeiten installieren
npm install
cd frontend && npm install && cd ..

# Erster Start — erzeugt Server-Wallet + Konfiguration
npm run dev
# Auf "Sails lifted" warten, dann Ctrl+C

# Move Smart Contract auf dem IOTA Testnet deployen
npm run move:deploy

# Forum starten
npm run dev
```

Oeffne `http://localhost:5173` — erstelle eine Wallet, hole Gas vom Faucet, registriere einen Benutzernamen und beginne zu posten.

> Siehe [DEPLOY.md](DEPLOY.md) fuer Produktions-Deployment, eigene Netzwerke und erweiterte Konfiguration.

---

## Funktionen

### Kern-Forum

| Funktion | Beschreibung |
|----------|-------------|
| **On-Chain-Beitraege** | Jeder Thread, Beitrag, jede Antwort, Abstimmung und Bearbeitung ist ein Move Event auf IOTA 2.0 |
| **Smart-Contract-Rollen** | 4-stufiges Berechtigungssystem (Gesperrt/Nutzer/Moderator/Admin), durchgesetzt von Validatoren |
| **IOTA-Wallet-Identitaet** | Ed25519-Schluesselpaar mit BIP39-Mnemonic. Passwort-verschluesselt im Browser. Kein Konto noetig |
| **Direkte Signierung** | Nutzer signieren Transaktionen direkt auf der Blockchain — der Server beruehrt niemals private Schluessel |
| **Unveraenderliche Versionierung** | Bearbeitungsverlauf On-Chain gespeichert. Jede Version hat einen TX Digest im IOTA Explorer |
| **Verschachtelte Antworten** | Diskussionen mit unbegrenzter Verschachtelungstiefe |
| **Abstimmungssystem** | Hoch-/Runterstimmen von Beitraegen. Punktestaende aus On-Chain-Abstimmungs-Events berechnet |
| **Volltextsuche** | SQLite FTS5-Index, aus Blockchain-Daten aufgebaut |
| **8 Sprachen** | IT, EN, ES, DE, FR, PT, JA, ZH mit react-i18next |
| **Verbindungsstring** | Teile dein Forum mit `testnet:PACKAGE_ID:FORUM_OBJECT_ID` — jeder kann beitreten |

### Zahlungen & Marktplatz

| Funktion | Beschreibung |
|----------|-------------|
| **Trinkgeld** | Sende IOTA direkt an Beitragsautoren. Voreingestellte Betraege + individuell. Alles On-Chain |
| **Abonnements** | Gestufte Tarife (Free/Pro/Premium) mit konfigurierbaren Preisen und Laufzeiten |
| **Kostenpflichtige Inhalte** | Autoren legen einen Preis fuer Threads fest. AES-256-verschluesselt, Schluessel nach Zahlung geliefert |
| **Premium-Kategorien** | Admin beschraenkt Kategoriezugang auf Abonnenten einer bestimmten Stufe |
| **Badges** | Vom Admin konfigurierbare, kaufbare Badges, die neben Benutzernamen angezeigt werden |
| **Treuhand (Multi-Sig)** | 2-von-3-Treuhand fuer Dienstleistungen: Kaeufer + Verkaeufer + Schlichter. Gelder On-Chain gesperrt |
| **Reputation** | On-Chain-Bewertungen (1-5 Sterne) nach Treuhand-Abschluss. Unveraenderliche Handelshistorie |
| **Marktplatz** | Durchsuche kostenpflichtige Inhalte, Dienstleistungen und Badges auf einer eigenen Seite |
| **Treasury** | Das Forum erhebt Gebuehren (5% Marktplatz, 2% Treuhand) in eine Smart-Contract-Treasury |

### Editor

| Funktion | Beschreibung |
|----------|-------------|
| **Rich-WYSIWYG-Editor** | Tiptap-basiert mit vollstaendiger Werkzeugleiste |
| **Markdown-Ausgabe** | Serialisiert zu sauberem Markdown via `tiptap-markdown` |
| **Formatierung** | Fett, Kursiv, Durchgestrichen, Ueberschriften, Blockzitat, Horizontale Linie |
| **Code** | Inline-Code + Code-Bloecke mit Syntaxhervorhebung |
| **Tabellen** | Tabellen direkt einfuegen und bearbeiten |
| **Bilder** | Einfuegen per URL |
| **Emoji** | Emoji-Auswahl (emoji-mart) |
| **@Erwaehungen** | Nutzer suchen und erwaehnen |

### Themes

7 integrierte Themes mit nutzerbezogener Auswahl:

| Theme | Stil | Layout |
|-------|------|--------|
| **Neon Cyber** | Dunkel, Glasmorphismus, Cyan-Neon-Leuchten | Kartenraster |
| **Clean Minimal** | Hell, minimal, blauer Akzent | Kartenraster |
| **Dark Pro** | Dunkel, professionell, gruener Akzent | Kartenraster |
| **Retro Terminal** | Dunkel, Monospace, gruenes Neon | Kartenraster |
| **Invision Light** | Klassisches Forum, weiss, blauer Akzent | IPB-Tabellenlayout |
| **Invision Dark** | Klassisches Forum, dunkelgrau, blauer Akzent | IPB-Tabellenlayout |
| **Material Ocean** | Material Design, tiefes Marineblau, Teal-Akzent | Kartenraster |

### Echtzeit-Synchronisierung

| Funktion | Beschreibung |
|----------|-------------|
| **WebSocket-Updates** | Granulare `dataChanged`-Events schieben Aktualisierungen gezielt an UI-Komponenten |
| **Optimistische Oberflaeche** | Beitraege/Abstimmungen erscheinen sofort, Bestaetigung erfolgt asynchron |
| **Blockchain-Polling** | Alle 30 Sekunden Abfrage neuer On-Chain-Events |
| **IOTA subscribeEvent** | Native Blockchain-Event-Abonnierung (~2s Latenz) |
| **Knotenuebergreifende Synchronisierung** | Mehrere Server bleiben ueber Blockchain-Events synchron |

---

## Architektur

```
Browser (React 19 + Vite 6 + TailwindCSS 4)
  |
  |-- IOTA Ed25519 Wallet (Mnemonic-abgeleitet, AES-verschluesselt in localStorage)
  |-- Signiert und fuehrt Transaktionen DIREKT auf der Blockchain aus
  |-- Rich-WYSIWYG-Editor (Tiptap) -> Markdown
  |-- Theme-Engine (7 Voreinstellungen, CSS-Variablen)
  |-- Wallet-Seite: Guthaben, Trinkgelder, Abonnements, Treuhand
  |
  |  REST API (nur-lesender Cache) + Socket.io WebSocket
  v
Server (Sails.js + Node.js) — NUR INDEXER
  |
  |-- Indexiert Blockchain-Events in SQLite-Cache
  |-- Faucet: sendet Gas an neue Nutzer (Testnet)
  |-- Liefert gecachte Daten per REST fuer schnelle Abfragen
  |-- WebSocket-Broadcast bei jeder Zustandsaenderung
  |-- 30s Blockchain-Polling fuer knotenuebergreifende Synchronisierung
  |-- Signiert oder veroeffentlicht KEINE Transaktionen fuer Nutzer
  |
  v
Move Smart Contract (On-Chain, unveraenderlich)
  |
  |-- Forum (shared): Nutzerregister, Rollen, Abonnements, Badges, Reputation, Treasury
  |-- Escrow (shared objects): Multi-Sig 2-von-3 Fondsverwaltung
  |-- AdminCap (owned): Deployer-Capability
  |-- 20+ Entry-Funktionen mit rollenbasierter Zugriffskontrolle
  |-- Emittiert Events fuer jede Operation (gzip-komprimierte JSON-Payloads)
  |-- Verarbeitet alle Zahlungen: Trinkgeld, Abonnements, Kaeufe, Treuhand
  |
  v
IOTA 2.0 Rebased (Quelle der Wahrheit)
  |
  |-- Events nach Package ID abfragbar
  |-- Alle Knoten sehen dieselben Daten
  |-- Keine Gebuehren im Testnet
```

### Datenfluss

```
Nutzer verfasst einen Beitrag
  -> Tiptap-Editor serialisiert zu Markdown
  -> Frontend gzip-komprimiert den JSON-Payload
  -> Ed25519-Schluesselpaar des Nutzers signiert die Transaktion
  -> Transaktion wird direkt auf der IOTA Blockchain ausgefuehrt
  -> Smart Contract prueft Rolle (USER >= 1), emittiert ForumEvent
  -> Backend erkennt Event via Polling/Subscribe
  -> Aktualisiert lokalen SQLite-Cache
  -> Broadcastet 'dataChanged' via WebSocket
  -> Alle verbundenen Clients aktualisieren ihre Oberflaeche
```

---

## Smart Contract

Der Move Smart Contract (`move/forum/sources/forum.move`) bildet das Sicherheitsrueckgrat. Alle Berechtigungen und Zahlungen werden von IOTA-Validatoren durchgesetzt, nicht vom Server.

### Rollensystem

| Stufe | Rolle | Berechtigungen |
|-------|-------|----------------|
| 0 | **GESPERRT** | Alle Operationen von Validatoren abgelehnt |
| 1 | **NUTZER** | Posten, Antworten, Abstimmen, eigene Inhalte bearbeiten, Trinkgeld, Abonnement, Kauf |
| 2 | **MODERATOR** | + Kategorien erstellen, Inhalte moderieren, Sperren/Entsperren, Treuhand-Schlichtung |
| 3 | **ADMIN** | + Forum-Konfiguration, Rollenverwaltung, Stufen/Badges konfigurieren, Treasury abheben |

### Entry-Funktionen

**Forum (Basis):**

| Funktion | Min. Rolle | Zweck |
|----------|-----------|-------|
| `register()` | Keine | Einmalige Registrierung, weist ROLE_USER zu |
| `post_event()` | USER | Threads, Beitraege, Antworten, Abstimmungen |
| `mod_post_event()` | MODERATOR | Kategorien, Moderationsaktionen |
| `admin_post_event()` | ADMIN | Forum-Konfiguration, Rollenaenderungen |
| `set_user_role()` | MODERATOR | Nutzerrollen aendern (mit Einschraenkungen) |

**Zahlungen:**

| Funktion | Min. Rolle | Zweck |
|----------|-----------|-------|
| `tip()` | USER | IOTA an einen Beitragsautor senden |
| `subscribe()` | USER | Eine Stufe abonnieren |
| `renew_subscription()` | USER | Bestehendes Abonnement verlaengern |
| `purchase_content()` | USER | Zugang zu kostenpflichtigen Inhalten kaufen |
| `purchase_badge()` | USER | Ein Badge kaufen |
| `configure_tier()` | ADMIN | Abo-Stufen hinzufuegen/bearbeiten |
| `configure_badge()` | ADMIN | Badges hinzufuegen/bearbeiten |
| `withdraw_funds()` | ADMIN | Aus der Forum-Treasury abheben |

**Treuhand:**

| Funktion | Wer | Zweck |
|----------|-----|-------|
| `create_escrow()` | Kaeufer | Gelder in Treuhand sperren (2-von-3-Multi-Sig) |
| `mark_delivered()` | Verkaeufer | Dienstleistung als erbracht markieren |
| `open_dispute()` | Kaeufer | Streitfall eroeffnen |
| `vote_release()` | Jede Partei | Fuer Freigabe der Gelder an den Verkaeufer stimmen |
| `vote_refund()` | Jede Partei | Fuer Rueckerstattung an den Kaeufer stimmen |
| `rate_trade()` | Kaeufer/Verkaeufer | Die andere Partei bewerten (1-5 Sterne) |

### Sicherheit

- Jeder Nutzer signiert mit seinem eigenen Ed25519-Schluesselpaar — `ctx.sender()` wird von IOTA-Validatoren verifiziert
- Der Server verwahrt niemals private Schluessel der Nutzer
- Treuhand nutzt kreuzvalidierte 2-von-3-Abstimmung (man kann nicht auf beiden Seiten abstimmen)
- Ueberzahlungen werden automatisch erstattet (exaktes Wechselgeld zurueckgegeben)
- Fristendurchsetzung bei Treuhand-Operationen
- Gesperrte Nutzer werden auf Smart-Contract-Ebene abgewiesen
- Man kann nicht ueber die eigene Rolle hinaus befoerdern und keine gleichrangigen oder hoeherrangigen Nutzer aendern

---

## Zahlungen & Marktplatz

### Trinkgeld

Klicke auf den Trinkgeld-Button bei jedem Beitrag, um IOTA direkt an den Autor zu senden. Waehle aus voreingestellten Betraegen (0,1, 0,5, 1,0 IOTA) oder gib einen individuellen Betrag ein. Trinkgelder sind sofort, On-Chain und ohne Vermittler.

### Abonnements

Admins konfigurieren Abo-Stufen mit Preis und Laufzeit. Nutzer abonnieren durch Zahlung des Stufenpreises. Der Smart Contract verwaltet automatisch Ablauf und Zugriffskontrolle.

### Kostenpflichtige Inhalte

Autoren koennen einen Preis fuer ihre Threads festlegen. Der Inhalt wird mit AES-256 verschluesselt. Nach der Zahlung (On-Chain) erhaelt der Kaeufer den Entschluesselungsschluessel. 5% Gebuehr gehen an die Forum-Treasury.

### Treuhand

Fuer Dienstleistungen zwischen Nutzern sperrt der Kaeufer Gelder in einer On-Chain-Treuhand. Drei Parteien (Kaeufer, Verkaeufer, Schlichter) bilden eine 2-von-3-Multi-Sig. Zwei beliebige koennen die Gelder freigeben oder erstatten. 2% Gebuehr an die Forum-Treasury bei Abschluss.

### Reputation

Nach jedem Treuhand-Abschluss koennen beide Parteien eine Bewertung hinterlassen (1-5 Sterne + Kommentar). Bewertungen sind unveraenderlich On-Chain. Nutzerprofile zeigen Durchschnittsbewertung, Handelsanzahl, Erfolgsquote und Volumen.

---

## Multi-Node

IotaPolis unterstuetzt mehrere unabhaengige Knoten, die mit demselben Smart Contract verbunden sind. Jeder Knoten:

1. Betreibt seinen eigenen Sails.js-Server + React-Frontend
2. Hat seinen eigenen SQLite-Cache (rekonstruierbar)
3. Nutzer signieren Transaktionen direkt On-Chain
4. Synchronisiert sich alle 30 Sekunden von der Blockchain

### Einem bestehenden Forum beitreten

```bash
# Server starten
npm run dev

# Im Browser: Setup -> "Mit bestehendem Forum verbinden"
# Verbindungsstring einfuegen: testnet:0xPACKAGE_ID:0xFORUM_OBJECT_ID
# Das System synchronisiert alle Events von der Blockchain
```

---

## Tech-Stack

| Schicht | Technologie | Version |
|---------|------------|---------|
| **Blockchain** | IOTA 2.0 Rebased | Testnet |
| **Smart Contract** | Move (IOTA MoveVM) | — |
| **SDK** | @iota/iota-sdk | Aktuell |
| **Backend** | Sails.js | 1.5 |
| **Laufzeitumgebung** | Node.js | >= 18 |
| **Datenbank** | better-sqlite3 (Cache) | Aktuell |
| **Frontend** | React | 19 |
| **Bundler** | Vite | 6 |
| **CSS** | TailwindCSS | 4 |
| **Animationen** | Framer Motion | 12 |
| **Editor** | Tiptap (ProseMirror) | 3 |
| **Icons** | Lucide React | Aktuell |
| **Echtzeit** | Socket.io | 2 |
| **i18n** | react-i18next | 8 Sprachen |
| **Desktop** | Electron + electron-builder | 33 |
| **Kryptografie** | Ed25519 (IOTA nativ) + AES-256-GCM + BIP39 | — |

---

## Desktop-App (Electron)

Verfuegbar als eigenstaendige Desktop-Anwendung fuer Windows, macOS und Linux. Der Server laeuft eingebettet in der App.

### Download

Lade die neueste Version von [GitHub Releases](https://github.com/deduzzo/iotapolis/releases) herunter:

| Plattform | Datei | Auto-Update |
|-----------|-------|-------------|
| **Windows** | `.exe` Installer | Ja |
| **macOS** | `.dmg` | Ja |
| **Linux** | `.AppImage` | Ja |

---

## Befehle

| Befehl | Beschreibung |
|--------|-------------|
| `npm run dev` | Backend + Frontend im Entwicklungsmodus starten |
| `npm start` | Im Produktionsmodus starten (einzelner Port 1337) |
| `npm run build` | Frontend fuer Produktion bauen |
| `npm run move:build` | Move Smart Contract kompilieren |
| `npm run move:deploy` | Contract kompilieren + auf IOTA Testnet deployen |
| `npm run desktop:dev` | Electron im Entwicklungsmodus starten |
| `npm run desktop:build` | Desktop-App fuer aktuelle Plattform bauen |
| `npm run release` | Interaktives Release-Skript |

---

## API-Endpunkte

### Oeffentlich (nur-lesender Cache)

| Methode | Endpunkt | Beschreibung |
|---------|----------|-------------|
| GET | `/api/v1/categories` | Alle Kategorien mit Statistiken auflisten |
| GET | `/api/v1/threads?category=ID&page=N` | Threads einer Kategorie auflisten |
| GET | `/api/v1/thread/:id` | Thread-Detail mit allen Beitraegen |
| GET | `/api/v1/posts?thread=ID` | Beitraege eines Threads |
| GET | `/api/v1/user/:id` | Nutzerprofil + Reputation + Badges |
| GET | `/api/v1/user/:id/reputation` | Handelsreputation des Nutzers |
| GET | `/api/v1/user/:id/subscription` | Abo-Status des Nutzers |
| GET | `/api/v1/search?q=QUERY` | Volltextsuche |
| GET | `/api/v1/dashboard` | Forum- und Zahlungsstatistiken |
| GET | `/api/v1/marketplace` | Kostenpflichtige Inhalte, Badges, Top-Verkaeufer |
| GET | `/api/v1/escrows` | Treuhandliste (filterbar) |
| GET | `/api/v1/escrow/:id` | Treuhand-Detail mit Bewertungen |
| GET | `/api/v1/tips/:postId` | Trinkgelder zu einem bestimmten Beitrag |
| GET | `/api/v1/forum-info` | Forum-Metadaten + Verbindungsstring |

### Server-Aktionen

| Methode | Endpunkt | Beschreibung |
|---------|----------|-------------|
| POST | `/api/v1/faucet-request` | Gas fuer eine neue Adresse anfordern (ratenbegrenzt) |
| POST | `/api/v1/full-reset` | Vollstaendiger Reset (Admin-Signatur erforderlich) |
| POST | `/api/v1/sync-reset` | Cache-Reset + Neusynchronisierung (Admin-Signatur erforderlich) |

Alle Schreiboperationen (Beitraege, Abstimmungen, Moderation, Zahlungen, Treuhand) werden direkt auf der IOTA Blockchain durch die Wallet des Nutzers ausgefuehrt. Der Server ist ein reiner Nur-Lese-Indexer.

---

## Wie die Identitaet funktioniert

1. **Erzeugen** — Der Browser erstellt ein Ed25519-Schluesselpaar aus einem BIP39-Mnemonic (12 Woerter)
2. **Verschluesseln** — Mnemonic wird mit dem Passwort des Nutzers verschluesselt (AES-256-GCM + PBKDF2) und in localStorage gespeichert
3. **Faucet** — Backend sendet Gas-IOTA an die neue Adresse (Testnet)
4. **Registrieren** — Nutzer ruft `register()` direkt auf dem Move Contract auf
5. **Signieren** — Jede Aktion (Beitrag, Abstimmung, Trinkgeld, Treuhand) ist eine mit dem Ed25519-Schluessel des Nutzers signierte Transaktion
6. **Verifizieren** — `ctx.sender()` wird von IOTA-Validatoren auf Protokollebene verifiziert
7. **Sichern** — Nutzer exportieren ihr 12-Woerter-Mnemonic zur Wiederherstellung auf beliebigen Geraeten

Keine Passwoerter auf dem Server. Keine E-Mails. Keine Konten. Deine Wallet ist deine Identitaet.

---

## Mitwirken

Beitraege sind willkommen! Dieses Projekt befindet sich in aktiver Entwicklung.

1. Forke das Repository
2. Erstelle einen Feature-Branch: `git checkout -b feature/amazing-feature`
3. Nimm deine Aenderungen vor
4. Fuehre `npm run dev` aus und teste lokal
5. Committe: `git commit -m 'feat: add amazing feature'`
6. Pushe: `git push origin feature/amazing-feature`
7. Erstelle einen Pull Request

---

## Lizenz

MIT-Lizenz. Siehe [LICENSE](LICENSE) fuer Details.

---

<p align="center">
  <strong>Gebaut auf IOTA 2.0 Rebased</strong><br/>
  <em>Jeder Beitrag ist eine Transaktion. Jede Berechtigung ist ein Smart Contract. Jeder Nutzer ist eine Wallet.</em>
</p>
