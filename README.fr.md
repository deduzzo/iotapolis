🌍 [English](README.md) | [Italiano](README.it.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português](README.pt.md) | [中文](README.zh.md) | [日本語](README.ja.md)

<p align="center">
  <img src="https://img.shields.io/badge/IOTA-2.0_Rebased-00f0ff?style=for-the-badge&logo=iota&logoColor=white" alt="IOTA 2.0" />
  <img src="https://img.shields.io/badge/Smart_Contract-Move-8B5CF6?style=for-the-badge" alt="Move" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT" />
</p>

<h1 align="center">IotaPolis</h1>

<p align="center">
  <strong>Une plateforme communautaire entierement decentralisee avec paiements integres, marketplace et escrow — propulsee par IOTA 2.0 et les smart contracts Move.</strong><br/>
  Chaque publication est on-chain. Chaque utilisateur signe avec son propre wallet. Chaque paiement est trustless.
</p>

<p align="center">
  <a href="#-demarrage-rapide">Demarrage rapide</a> &bull;
  <a href="#-fonctionnalites">Fonctionnalites</a> &bull;
  <a href="#-architecture">Architecture</a> &bull;
  <a href="#-smart-contract">Smart Contract</a> &bull;
  <a href="#-paiements--marketplace">Paiements</a> &bull;
  <a href="#-themes">Themes</a> &bull;
  <a href="#-multi-noeud">Multi-Noeud</a> &bull;
  <a href="#-contribuer">Contribuer</a>
</p>

---

## Pourquoi IotaPolis ?

Les forums traditionnels dependent d'un serveur central qui peut etre ferme, censure ou compromis. **IotaPolis** stocke chaque donnee sur la blockchain IOTA 2.0 sous forme d'evenements de smart contracts Move. Le serveur local n'est qu'un cache — la blockchain est la source de verite.

- **Veritable decentralisation** — Chaque utilisateur possede son propre wallet IOTA (Ed25519). Le serveur ne detient jamais de cles privees
- **Aucun point de defaillance unique** — N'importe quel noeud peut reconstruire l'integralite du forum a partir des evenements on-chain
- **Historique immuable** — Chaque publication, modification et vote est enregistre de maniere permanente avec un digest de transaction
- **Permissions on-chain** — Les roles (Utilisateur, Moderateur, Admin) sont appliques par le smart contract, pas par le serveur
- **Economie integree** — Pourboires, abonnements, contenu payant, badges et escrow — le tout on-chain
- **Zero frais sur le testnet** — Le testnet IOTA 2.0 Rebased fournit du gas gratuit via un faucet automatique

---

## Demarrage rapide

```bash
# Cloner
git clone https://github.com/deduzzo/iotapolis.git
cd iotapolis

# Installer les dependances
npm install
cd frontend && npm install && cd ..

# Premier lancement — genere le wallet serveur + la configuration
npm run dev
# Attendre "Sails lifted", puis Ctrl+C

# Deployer le smart contract Move sur le testnet IOTA
npm run move:deploy

# Lancer le forum
npm run dev
```

Ouvrez `http://localhost:5173` — creez un wallet, obtenez du gas depuis le faucet, enregistrez un nom d'utilisateur et commencez a publier.

> Consultez [DEPLOY.md](DEPLOY.md) pour le deploiement en production, les reseaux personnalises et la configuration avancee.

---

## Fonctionnalites

### Forum principal

| Fonctionnalite | Description |
|-----------------|-------------|
| **Publications on-chain** | Chaque fil, publication, reponse, vote et modification est un evenement Move sur IOTA 2.0 |
| **Roles via smart contract** | Systeme de permissions a 4 niveaux (Banni/Utilisateur/Moderateur/Admin) applique par les validateurs |
| **Identite par wallet IOTA** | Paire de cles Ed25519 avec mnemonique BIP39. Chiffree par mot de passe dans le navigateur. Aucun compte necessaire |
| **Signature directe** | Les utilisateurs signent les transactions directement sur la blockchain — le serveur ne touche jamais aux cles privees |
| **Versionnage immuable** | Historique des modifications stocke on-chain. Chaque version possede un digest TX sur l'Explorateur IOTA |
| **Reponses imbriquees** | Discussions en fils avec imbrication illimitee |
| **Systeme de votes** | Votes positifs/negatifs sur les publications. Scores calcules a partir des evenements de vote on-chain |
| **Recherche plein texte** | Index SQLite FTS5 reconstruit a partir des donnees blockchain |
| **8 langues** | IT, EN, ES, DE, FR, PT, JA, ZH avec react-i18next |
| **Chaine de connexion** | Partagez votre forum avec `testnet:PACKAGE_ID:FORUM_OBJECT_ID` — tout le monde peut rejoindre |

### Paiements et Marketplace

| Fonctionnalite | Description |
|-----------------|-------------|
| **Pourboires** | Envoyez des IOTA directement aux auteurs de publications. Montants predefinis + personnalises. Tout on-chain |
| **Abonnements** | Plans par paliers (Gratuit/Pro/Premium) avec prix et durees configurables |
| **Contenu payant** | Les auteurs fixent un prix pour les fils. Chiffrement AES-256, cle livree apres paiement |
| **Categories premium** | L'admin restreint l'acces aux categories pour les abonnes d'un palier donne |
| **Badges** | Badges achetables configurables par l'admin, affiches a cote des noms d'utilisateur |
| **Escrow (multi-sig)** | Escrow 2-sur-3 pour les services : acheteur + vendeur + arbitre. Fonds bloques on-chain |
| **Reputation** | Notes on-chain (1 a 5 etoiles) apres resolution d'un escrow. Historique des echanges immuable |
| **Marketplace** | Parcourez le contenu payant, les services et les badges sur une page dediee |
| **Tresorerie** | Le forum collecte des frais (5 % marketplace, 2 % escrow) dans une tresorerie smart contract |

### Editeur

| Fonctionnalite | Description |
|-----------------|-------------|
| **Editeur WYSIWYG riche** | Base sur Tiptap avec barre d'outils complete |
| **Sortie Markdown** | Serialisation en markdown propre via `tiptap-markdown` |
| **Mise en forme** | Gras, italique, barre, titres, citation, ligne horizontale |
| **Code** | Code inline + blocs de code avec coloration syntaxique |
| **Tableaux** | Insertion et edition de tableaux directement |
| **Images** | Insertion par URL |
| **Emoji** | Selecteur d'emoji (emoji-mart) |
| **@Mentions** | Recherche et mention d'utilisateurs |

### Themes

7 themes integres avec selection par utilisateur :

| Theme | Style | Disposition |
|-------|-------|-------------|
| **Neon Cyber** | Sombre, glassmorphisme, lueur neon cyan | Grille de cartes |
| **Clean Minimal** | Clair, minimaliste, accent bleu | Grille de cartes |
| **Dark Pro** | Sombre, professionnel, accent vert | Grille de cartes |
| **Retro Terminal** | Sombre, monospace, neon vert | Grille de cartes |
| **Invision Light** | Forum classique, blanc, accent bleu | Disposition tableau IPB |
| **Invision Dark** | Forum classique, gris fonce, accent bleu | Disposition tableau IPB |
| **Material Ocean** | Material Design, bleu marine profond, accent teal | Grille de cartes |

### Synchronisation en temps reel

| Fonctionnalite | Description |
|-----------------|-------------|
| **Mises a jour WebSocket** | Evenements `dataChanged` granulaires transmis aux composants UI specifiques |
| **UI optimiste** | Les publications/votes apparaissent instantanement, confirmes de maniere asynchrone |
| **Polling blockchain** | Interrogation toutes les 30s pour les nouveaux evenements on-chain |
| **IOTA subscribeEvent** | Abonnement natif aux evenements blockchain (~2s de latence) |
| **Synchronisation inter-noeuds** | Plusieurs serveurs restent synchronises via les evenements blockchain |

---

## Architecture

```
Navigateur (React 19 + Vite 6 + TailwindCSS 4)
  |
  |-- Wallet IOTA Ed25519 (derive du mnemonique, chiffre AES dans localStorage)
  |-- Signe et execute les transactions DIRECTEMENT sur la blockchain
  |-- Editeur WYSIWYG riche (Tiptap) -> markdown
  |-- Moteur de themes (7 preselections, variables CSS)
  |-- Page Wallet : solde, pourboires, abonnements, escrow
  |
  |  API REST (cache en lecture seule) + WebSocket Socket.io
  v
Serveur (Sails.js + Node.js) — INDEXEUR UNIQUEMENT
  |
  |-- Indexe les evenements blockchain dans un cache SQLite
  |-- Faucet : envoie du gas aux nouveaux utilisateurs (testnet)
  |-- Sert les donnees en cache via REST pour des requetes rapides
  |-- Diffusion WebSocket a chaque changement d'etat
  |-- Polling blockchain toutes les 30s pour la synchronisation inter-noeuds
  |-- NE signe PAS et NE publie PAS de transactions pour les utilisateurs
  |
  v
Smart Contract Move (on-chain, immuable)
  |
  |-- Forum (partage) : registre utilisateurs, roles, abonnements, badges, reputation, tresorerie
  |-- Escrow (objets partages) : gestion de fonds multi-sig 2-sur-3
  |-- AdminCap (possede) : capability du deployeur
  |-- 20+ fonctions entry avec acces controle par role
  |-- Emet des evenements pour chaque operation (payloads JSON compresses gzip)
  |-- Gere tous les paiements : pourboires, abonnements, achats, escrow
  |
  v
IOTA 2.0 Rebased (source de verite)
  |
  |-- Evenements interrogeables par Package ID
  |-- Tous les noeuds voient les memes donnees
  |-- Zero frais sur le testnet
```

### Flux de donnees

```
L'utilisateur redige une publication
  -> L'editeur Tiptap serialise en markdown
  -> Le frontend compresse le payload JSON en gzip
  -> La paire de cles Ed25519 de l'utilisateur signe la transaction
  -> La transaction s'execute directement sur la blockchain IOTA
  -> Le smart contract verifie le role (USER >= 1), emet un ForumEvent
  -> Le backend detecte l'evenement via polling/subscribe
  -> Met a jour le cache SQLite local
  -> Diffuse 'dataChanged' via WebSocket
  -> Tous les clients connectes mettent a jour leur interface
```

---

## Smart Contract

Le smart contract Move (`move/forum/sources/forum.move`) est le pilier de la securite. Toutes les permissions et tous les paiements sont appliques par les validateurs IOTA, pas par le serveur.

### Systeme de roles

| Niveau | Role | Permissions |
|--------|------|-------------|
| 0 | **BANNI** | Toutes les operations rejetees par les validateurs |
| 1 | **UTILISATEUR** | Publier, repondre, voter, modifier son contenu, donner un pourboire, s'abonner, acheter |
| 2 | **MODERATEUR** | + Creer des categories, moderer le contenu, bannir/debannir, arbitrer les escrows |
| 3 | **ADMIN** | + Configuration du forum, gestion des roles, configurer les paliers/badges, retirer de la tresorerie |

### Fonctions entry

**Forum (base) :**

| Fonction | Role min. | Objectif |
|----------|-----------|----------|
| `register()` | Aucun | Inscription unique, attribue ROLE_USER |
| `post_event()` | USER | Fils, publications, reponses, votes |
| `mod_post_event()` | MODERATOR | Categories, actions de moderation |
| `admin_post_event()` | ADMIN | Configuration du forum, changements de roles |
| `set_user_role()` | MODERATOR | Modifier les roles des utilisateurs (avec contraintes) |

**Paiements :**

| Fonction | Role min. | Objectif |
|----------|-----------|----------|
| `tip()` | USER | Envoyer des IOTA a l'auteur d'une publication |
| `subscribe()` | USER | S'abonner a un palier |
| `renew_subscription()` | USER | Renouveler un abonnement existant |
| `purchase_content()` | USER | Acheter l'acces a du contenu payant |
| `purchase_badge()` | USER | Acheter un badge |
| `configure_tier()` | ADMIN | Ajouter/modifier les paliers d'abonnement |
| `configure_badge()` | ADMIN | Ajouter/modifier les badges |
| `withdraw_funds()` | ADMIN | Retirer de la tresorerie du forum |

**Escrow :**

| Fonction | Qui | Objectif |
|----------|-----|----------|
| `create_escrow()` | Acheteur | Bloquer des fonds en escrow (multi-sig 2-sur-3) |
| `mark_delivered()` | Vendeur | Marquer le service comme livre |
| `open_dispute()` | Acheteur | Ouvrir un litige |
| `vote_release()` | Toute partie | Voter pour liberer les fonds au vendeur |
| `vote_refund()` | Toute partie | Voter pour rembourser l'acheteur |
| `rate_trade()` | Acheteur/Vendeur | Noter l'autre partie (1 a 5 etoiles) |

### Securite

- Chaque utilisateur signe avec sa propre paire de cles Ed25519 — `ctx.sender()` verifie par les validateurs IOTA
- Le serveur ne detient jamais les cles privees des utilisateurs
- L'escrow utilise un vote 2-sur-3 avec validation croisee (impossible de voter des deux cotes)
- Les surpaiements sont automatiquement rembourses (rendu de monnaie exact)
- Application des delais sur les operations d'escrow
- Les utilisateurs bannis sont rejetes au niveau du contrat
- Impossible de promouvoir au-dessus de son propre role, impossible de modifier les utilisateurs de role egal ou superieur

---

## Paiements et Marketplace

### Pourboires

Cliquez sur le bouton de pourboire sur n'importe quelle publication pour envoyer des IOTA directement a l'auteur. Choisissez parmi les montants predefinis (0.1, 0.5, 1.0 IOTA) ou saisissez un montant personnalise. Les pourboires sont instantanes, on-chain, sans aucun intermediaire.

### Abonnements

Les admins configurent les paliers d'abonnement avec un prix et une duree. Les utilisateurs s'abonnent en payant le prix du palier. Le smart contract gere automatiquement l'expiration et le controle d'acces.

### Contenu payant

Les auteurs peuvent fixer un prix pour leurs fils. Le contenu est chiffre en AES-256. Apres le paiement (on-chain), l'acheteur recoit la cle de dechiffrement. 5 % de frais vont a la tresorerie du forum.

### Escrow

Pour les services entre utilisateurs, l'acheteur bloque des fonds dans un escrow on-chain. Trois parties (acheteur, vendeur, arbitre) forment un multi-sig 2-sur-3. Deux parties quelconques peuvent liberer ou rembourser les fonds. 2 % de frais pour la tresorerie du forum a la resolution.

### Reputation

Apres chaque resolution d'escrow, les deux parties peuvent laisser une note (1 a 5 etoiles + commentaire). Les notes sont immuables on-chain. Les profils utilisateurs affichent la note moyenne, le nombre d'echanges, le taux de reussite et le volume.

---

## Multi-Noeud

IotaPolis prend en charge plusieurs noeuds independants connectes au meme smart contract. Chaque noeud :

1. Fait tourner son propre serveur Sails.js + frontend React
2. Possede son propre cache SQLite (reconstructible)
3. Les utilisateurs signent les transactions directement on-chain
4. Se synchronise depuis la blockchain toutes les 30 secondes

### Rejoindre un forum existant

```bash
# Demarrer le serveur
npm run dev

# Dans le navigateur : aller dans Setup -> "Se connecter a un forum existant"
# Coller la chaine de connexion : testnet:0xPACKAGE_ID:0xFORUM_OBJECT_ID
# Le systeme synchronise tous les evenements depuis la blockchain
```

---

## Stack technique

| Couche | Technologie | Version |
|--------|-------------|---------|
| **Blockchain** | IOTA 2.0 Rebased | Testnet |
| **Smart Contract** | Move (IOTA MoveVM) | — |
| **SDK** | @iota/iota-sdk | Derniere |
| **Backend** | Sails.js | 1.5 |
| **Runtime** | Node.js | >= 18 |
| **Base de donnees** | better-sqlite3 (cache) | Derniere |
| **Frontend** | React | 19 |
| **Bundler** | Vite | 6 |
| **CSS** | TailwindCSS | 4 |
| **Animations** | Framer Motion | 12 |
| **Editeur** | Tiptap (ProseMirror) | 3 |
| **Icones** | Lucide React | Derniere |
| **Temps reel** | Socket.io | 2 |
| **i18n** | react-i18next | 8 langues |
| **Bureau** | Electron + electron-builder | 33 |
| **Crypto** | Ed25519 (natif IOTA) + AES-256-GCM + BIP39 | — |

---

## Application bureau (Electron)

Disponible en tant qu'application bureau autonome pour Windows, macOS et Linux. Le serveur tourne de maniere embarquee dans l'application.

### Telechargement

Telechargez la derniere version depuis les [GitHub Releases](https://github.com/deduzzo/iotapolis/releases) :

| Plateforme | Fichier | Mise a jour automatique |
|------------|---------|-------------------------|
| **Windows** | Installateur `.exe` | Oui |
| **macOS** | `.dmg` | Oui |
| **Linux** | `.AppImage` | Oui |

---

## Commandes

| Commande | Description |
|----------|-------------|
| `npm run dev` | Demarrer le backend + frontend en developpement |
| `npm start` | Demarrer en mode production (port unique 1337) |
| `npm run build` | Compiler le frontend pour la production |
| `npm run move:build` | Compiler le smart contract Move |
| `npm run move:deploy` | Compiler + deployer le contrat sur le testnet IOTA |
| `npm run desktop:dev` | Lancer Electron en mode developpement |
| `npm run desktop:build` | Compiler l'application bureau pour la plateforme actuelle |
| `npm run release` | Script de release interactif |

---

## Points d'acces API

### Publics (cache en lecture seule)

| Methode | Point d'acces | Description |
|---------|---------------|-------------|
| GET | `/api/v1/categories` | Lister toutes les categories avec statistiques |
| GET | `/api/v1/threads?category=ID&page=N` | Lister les fils d'une categorie |
| GET | `/api/v1/thread/:id` | Detail du fil avec toutes les publications |
| GET | `/api/v1/posts?thread=ID` | Publications d'un fil |
| GET | `/api/v1/user/:id` | Profil utilisateur + reputation + badges |
| GET | `/api/v1/user/:id/reputation` | Reputation commerciale de l'utilisateur |
| GET | `/api/v1/user/:id/subscription` | Statut d'abonnement de l'utilisateur |
| GET | `/api/v1/search?q=QUERY` | Recherche plein texte |
| GET | `/api/v1/dashboard` | Statistiques du forum + paiements |
| GET | `/api/v1/marketplace` | Contenu payant, badges, meilleurs vendeurs |
| GET | `/api/v1/escrows` | Liste des escrows (filtrable) |
| GET | `/api/v1/escrow/:id` | Detail de l'escrow avec notes |
| GET | `/api/v1/tips/:postId` | Pourboires sur une publication specifique |
| GET | `/api/v1/forum-info` | Metadonnees du forum + chaine de connexion |

### Actions serveur

| Methode | Point d'acces | Description |
|---------|---------------|-------------|
| POST | `/api/v1/faucet-request` | Demander du gas pour une nouvelle adresse (limite de debit) |
| POST | `/api/v1/full-reset` | Reinitialisation complete (signature admin requise) |
| POST | `/api/v1/sync-reset` | Reinitialisation du cache + resynchronisation (signature admin requise) |

Toutes les operations d'ecriture (publications, votes, moderation, paiements, escrow) sont executees directement sur la blockchain IOTA par le wallet de l'utilisateur. Le serveur est un indexeur en lecture seule.

---

## Fonctionnement de l'identite

1. **Generation** — Le navigateur cree une paire de cles Ed25519 a partir d'un mnemonique BIP39 (12 mots)
2. **Chiffrement** — Le mnemonique est chiffre avec le mot de passe de l'utilisateur (AES-256-GCM + PBKDF2) et stocke dans localStorage
3. **Faucet** — Le backend envoie du gas IOTA a la nouvelle adresse (testnet)
4. **Inscription** — L'utilisateur appelle `register()` directement sur le contrat Move
5. **Signature** — Chaque action (publication, vote, pourboire, escrow) est une transaction signee avec la cle Ed25519 de l'utilisateur
6. **Verification** — `ctx.sender()` verifie par les validateurs IOTA au niveau du protocole
7. **Sauvegarde** — Les utilisateurs exportent leur mnemonique de 12 mots pour restaurer sur n'importe quel appareil

Pas de mots de passe sur le serveur. Pas d'e-mails. Pas de comptes. Votre wallet est votre identite.

---

## Contribuer

Les contributions sont les bienvenues ! Ce projet est en developpement actif.

1. Forkez le depot
2. Creez une branche de fonctionnalite : `git checkout -b feature/fonctionnalite-geniale`
3. Apportez vos modifications
4. Lancez `npm run dev` et testez localement
5. Commitez : `git commit -m 'feat: add fonctionnalite-geniale'`
6. Poussez : `git push origin feature/fonctionnalite-geniale`
7. Ouvrez une Pull Request

---

## Licence

Licence MIT. Voir [LICENSE](LICENSE) pour les details.

---

<p align="center">
  <strong>Construit sur IOTA 2.0 Rebased</strong><br/>
  <em>Chaque publication est une transaction. Chaque permission est un smart contract. Chaque utilisateur est un wallet.</em>
</p>
