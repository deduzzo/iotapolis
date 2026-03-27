# IotaPolis Rebranding — Design Spec

## Overview

Rebranding completo del progetto "IOTA Free Forum" in "IotaPolis". Il progetto si è espanso ben oltre un forum: wallet, pagamenti, marketplace, escrow, reputazione. Il nuovo nome riflette una piattaforma/community decentralizzata completa.

## Decisioni

- **Nome**: IotaPolis (IOTA + polis greca = community decentralizzata autogovernata)
- **Dominio futuro**: iotapolis.io (disponibile, €29.73/anno su Namecheap)
- **Framework sito**: Astro + Starlight
- **Hosting**: GitHub Pages con GitHub Actions
- **Repository**: rinominare da `iota-free-forum` a `iotapolis`

## Scope

### 1. Rename Repository GitHub

Da `iota-free-forum` → `iotapolis` (GitHub gestisce il redirect automatico).

### 2. Struttura `/site`

```
site/
├── astro.config.mjs
├── package.json
├── tailwind.config.mjs
├── public/
│   ├── favicon.svg
│   └── og-image.png
├── src/
│   ├── assets/
│   ├── components/        # Componenti React per landing page
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   ├── HowItWorks.tsx
│   │   ├── TechStack.tsx
│   │   └── Footer.tsx
│   ├── layouts/
│   │   └── Landing.astro
│   ├── pages/
│   │   └── index.astro
│   └── styles/
│       └── global.css
├── src/content/docs/       # Starlight docs
│   ├── index.mdx
│   ├── getting-started/
│   │   ├── installation.mdx
│   │   ├── quick-start.mdx
│   │   └── configuration.mdx
│   ├── architecture/
│   │   ├── overview.mdx
│   │   ├── smart-contract.mdx
│   │   ├── backend.mdx
│   │   └── frontend.mdx
│   ├── guides/
│   │   ├── wallet.mdx
│   │   ├── payments.mdx
│   │   ├── escrow.mdx
│   │   └── marketplace.mdx
│   └── api/
│       └── endpoints.mdx
```

### 3. Landing Page (`/`)

Single page con scroll e animazioni. Sezioni:

- **Hero**: titolo "IotaPolis", tagline sulla decentralizzazione, CTA (GitHub, Docs, Download)
- **Features**: grid con icone — decentralizzato, wallet integrato, pagamenti, escrow multi-sig, marketplace, multilingua, temi, desktop app
- **How It Works**: 3 step visuali con animazioni on-scroll (crea wallet, unisciti alla community, scambia valore)
- **Tech Stack**: IOTA 2.0, Move, React, Sails.js, Electron — con loghi
- **Footer**: link GitHub, releases, docs, licenza

Stile: dark mode, neon gradients, glassmorphism, animazioni scroll. Coerente con il design del progetto principale (React + TailwindCSS, futuristico).

### 4. Documentazione (`/docs`)

Starlight con tema dark di default. Struttura:

- **Getting Started**: installazione, quick start, configurazione
- **Architecture**: overview, smart contract Move, backend Sails.js, frontend React
- **Guides**: wallet, pagamenti/tip, escrow, marketplace
- **API Reference**: endpoint REST

Features: sidebar navigabile, search integrata, responsive.

### 5. GitHub Pages Deploy

GitHub Action `.github/workflows/deploy-site.yml`:
- Trigger su push a `main` (path `site/**`)
- Build Astro
- Deploy su GitHub Pages
- Custom domain configurabile in futuro

### 6. Rebranding nel Codice

Aggiornare riferimenti "IOTA Free Forum" / "iota-free-forum" nel codebase:
- `package.json` (name)
- `CLAUDE.md`
- Frontend title/branding
- Electron app name
- README (se presente)

## Fuori Scope

- Acquisto dominio iotapolis.io (decisione utente)
- Migrazione DNS
- Redesign dell'applicazione principale (solo naming)
