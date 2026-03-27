# IotaPolis Rebranding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand "IOTA Free Forum" to "IotaPolis" and create a futuristic landing page + documentation site with Astro + Starlight, hosted on GitHub Pages.

**Architecture:** Static site in `/site` using Astro with Starlight plugin. Landing page at `/` with React components + TailwindCSS (dark mode, neon gradients, glassmorphism, scroll animations). Docs at `/docs` with Starlight. GitHub Actions deploys to GitHub Pages on push.

**Tech Stack:** Astro 5, Starlight, React 19, TailwindCSS 4, GitHub Actions

---

## Parallelization Map

```
Group A (parallel):
  Task 1: Rebranding codebase references
  Task 2: Astro + Starlight project scaffold
  Task 5: GitHub Actions workflow

Group B (after Task 2 completes):
  Task 3: Landing page components
  Task 4: Documentation content
```

---

### Task 1: Rebranding — Update All References

**Files:**
- Modify: `package.json`
- Modify: `desktop/main.js`
- Modify: `README.md`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update package.json**

Change the `name` field:

```json
"name": "iotapolis"
```

Also update `description`:

```json
"description": "Decentralized community platform on IOTA 2.0 blockchain — forum, wallet, payments, marketplace, escrow"
```

- [ ] **Step 2: Update desktop/main.js**

Find and replace window title:

```javascript
// OLD:
title: "IOTA Free Forum"
// NEW:
title: "IotaPolis"
```

Find and replace userData path:

```javascript
// OLD:
app.setPath('userData', path.join(app.getPath('appData'), 'iota-free-forum'));
// NEW:
app.setPath('userData', path.join(app.getPath('appData'), 'iotapolis'));
```

- [ ] **Step 3: Update README.md**

Replace title and first line:

```markdown
# IotaPolis

A decentralized community platform with integrated payments, marketplace, and escrow — powered by IOTA 2.0 and Move smart contracts.
```

Replace all remaining occurrences of "IOTA Free Forum" with "IotaPolis" throughout the file.

- [ ] **Step 4: Update CLAUDE.md**

Replace the header:

```markdown
# IotaPolis — Project Context
```

Replace the overview first line:

```markdown
Piattaforma community decentralizzata su IOTA 2.0 Rebased con smart contract Move.
```

- [ ] **Step 5: Search and replace any other references**

Run:
```bash
grep -r "IOTA Free Forum" --include="*.js" --include="*.jsx" --include="*.json" --include="*.md" --include="*.html" -l
grep -r "iota-free-forum" --include="*.js" --include="*.jsx" --include="*.json" --include="*.md" --include="*.html" -l
```

Update any remaining files found. Skip `node_modules/`, `.git/`, `docs/superpowers/`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: rebrand IOTA Free Forum to IotaPolis"
```

---

### Task 2: Astro + Starlight Project Scaffold

**Files:**
- Create: `site/package.json`
- Create: `site/astro.config.mjs`
- Create: `site/tailwind.config.mjs`
- Create: `site/tsconfig.json`
- Create: `site/src/styles/global.css`
- Create: `site/public/favicon.svg`
- Create: `site/src/pages/index.astro` (placeholder)
- Create: `site/src/content/docs/index.mdx` (placeholder)

- [ ] **Step 1: Initialize Astro project**

```bash
cd /Users/deduzzo/dev/iota-free-forum
mkdir -p site
cd site
npm create astro@latest -- --template starlight --no-git --no-install -y .
```

If the interactive CLI doesn't support these flags, create files manually.

- [ ] **Step 2: Create package.json**

```json
{
  "name": "iotapolis-site",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview"
  },
  "dependencies": {
    "@astrojs/react": "^4.0.0",
    "@astrojs/starlight": "^0.32.0",
    "@astrojs/tailwind": "^6.0.0",
    "astro": "^5.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0"
  }
}
```

- [ ] **Step 3: Create astro.config.mjs**

```javascript
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://deduzzo.github.io',
  base: '/iotapolis',
  integrations: [
    react(),
    starlight({
      title: 'IotaPolis',
      description: 'Decentralized community platform on IOTA 2.0',
      defaultLocale: 'en',
      social: {
        github: 'https://github.com/deduzzo/iotapolis',
      },
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Installation', slug: 'getting-started/installation' },
            { label: 'Quick Start', slug: 'getting-started/quick-start' },
            { label: 'Configuration', slug: 'getting-started/configuration' },
          ],
        },
        {
          label: 'Architecture',
          items: [
            { label: 'Overview', slug: 'architecture/overview' },
            { label: 'Smart Contract', slug: 'architecture/smart-contract' },
            { label: 'Backend', slug: 'architecture/backend' },
            { label: 'Frontend', slug: 'architecture/frontend' },
          ],
        },
        {
          label: 'Guides',
          items: [
            { label: 'Wallet', slug: 'guides/wallet' },
            { label: 'Payments & Tips', slug: 'guides/payments' },
            { label: 'Escrow', slug: 'guides/escrow' },
            { label: 'Marketplace', slug: 'guides/marketplace' },
          ],
        },
        {
          label: 'API Reference',
          items: [
            { label: 'REST Endpoints', slug: 'api/endpoints' },
          ],
        },
      ],
      customCss: ['./src/styles/global.css'],
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

- [ ] **Step 4: Create tsconfig.json**

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "jsx": "react-jsx"
  }
}
```

- [ ] **Step 5: Create src/styles/global.css**

```css
@import "tailwindcss";

:root {
  --sl-color-accent-low: #1a1a2e;
  --sl-color-accent: #6c63ff;
  --sl-color-accent-high: #a78bfa;
  --sl-color-white: #f0f0f0;
  --sl-color-gray-1: #e0e0e0;
  --sl-color-gray-2: #b0b0b0;
  --sl-color-gray-3: #808080;
  --sl-color-gray-4: #404040;
  --sl-color-gray-5: #2a2a3e;
  --sl-color-gray-6: #1a1a2e;
  --sl-color-black: #0a0a1a;
}
```

- [ ] **Step 6: Create favicon.svg**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6c63ff"/>
      <stop offset="100%" style="stop-color:#a78bfa"/>
    </linearGradient>
  </defs>
  <circle cx="32" cy="32" r="30" fill="url(#g)"/>
  <text x="32" y="42" text-anchor="middle" font-family="Arial,sans-serif" font-weight="bold" font-size="28" fill="white">iP</text>
</svg>
```

Write to `site/public/favicon.svg`.

- [ ] **Step 7: Create placeholder index.astro**

```astro
---
// Landing page — will be built out in Task 3
---
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>IotaPolis</title>
</head>
<body>
  <h1>IotaPolis — Coming Soon</h1>
</body>
</html>
```

Write to `site/src/pages/index.astro`.

- [ ] **Step 8: Create placeholder docs index**

```mdx
---
title: IotaPolis Documentation
description: Technical documentation for the IotaPolis decentralized community platform.
---

Welcome to the IotaPolis documentation.
```

Write to `site/src/content/docs/index.mdx`.

- [ ] **Step 9: Install dependencies**

```bash
cd /Users/deduzzo/dev/iota-free-forum/site
npm install
```

- [ ] **Step 10: Verify build**

```bash
cd /Users/deduzzo/dev/iota-free-forum/site
npm run build
```

Expected: Build succeeds, output in `site/dist/`.

- [ ] **Step 11: Commit**

```bash
git add site/
git commit -m "feat: scaffold Astro + Starlight site"
```

---

### Task 3: Landing Page — Futuristic Design

**Files:**
- Create: `site/src/layouts/Landing.astro`
- Create: `site/src/components/Hero.tsx`
- Create: `site/src/components/Features.tsx`
- Create: `site/src/components/HowItWorks.tsx`
- Create: `site/src/components/TechStack.tsx`
- Create: `site/src/components/Footer.tsx`
- Modify: `site/src/pages/index.astro`
- Modify: `site/src/styles/global.css`

**Depends on:** Task 2 completed (Astro scaffold exists)

- [ ] **Step 1: Add animation styles to global.css**

Append to `site/src/styles/global.css`:

```css
/* Landing page styles */
.glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.neon-glow {
  text-shadow: 0 0 10px rgba(108, 99, 255, 0.8), 0 0 40px rgba(108, 99, 255, 0.4);
}

.gradient-text {
  background: linear-gradient(135deg, #6c63ff, #a78bfa, #c084fc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-float { animation: float 3s ease-in-out infinite; }
.animate-fade-in-up { animation: fadeInUp 0.8s ease-out forwards; }

.scroll-reveal {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.scroll-reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
```

- [ ] **Step 2: Create Landing.astro layout**

```astro
---
interface Props {
  title: string;
  description: string;
}

const { title, description } = Astro.props;
---
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content={description} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <link rel="icon" href="/iotapolis/favicon.svg" />
  <title>{title}</title>
</head>
<body class="bg-[#0a0a1a] text-white min-h-screen antialiased">
  <slot />
  <script>
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.scroll-reveal').forEach(el => observer.observe(el));
  </script>
</body>
</html>
```

Write to `site/src/layouts/Landing.astro`.

- [ ] **Step 3: Create Hero.tsx**

```tsx
export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
      {/* Background grid effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(108,99,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(108,99,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/20 rounded-full blur-[100px] animate-float" style={{ animationDelay: '1.5s' }} />

      <div className="relative z-10 text-center max-w-4xl mx-auto">
        <div className="animate-fade-in-up">
          <h1 className="text-6xl md:text-8xl font-bold mb-6 tracking-tight">
            <span className="gradient-text">IotaPolis</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-2xl mx-auto">
            The decentralized community platform powered by IOTA 2.0
          </p>
          <p className="text-base text-gray-500 mb-10 max-w-xl mx-auto">
            Forum, wallet, payments, marketplace, and escrow — all on-chain, all yours.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <a
            href="https://github.com/deduzzo/iotapolis"
            target="_blank"
            rel="noopener noreferrer"
            className="glass px-8 py-3 rounded-xl text-white font-semibold hover:bg-white/10 transition-all duration-300 hover:scale-105"
          >
            GitHub
          </a>
          <a
            href="/iotapolis/docs"
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:opacity-90 transition-all duration-300 hover:scale-105"
          >
            Documentation
          </a>
          <a
            href="https://github.com/deduzzo/iotapolis/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="glass px-8 py-3 rounded-xl text-white font-semibold hover:bg-white/10 transition-all duration-300 hover:scale-105"
          >
            Download
          </a>
        </div>
      </div>
    </section>
  );
}
```

Write to `site/src/components/Hero.tsx`.

- [ ] **Step 4: Create Features.tsx**

```tsx
const features = [
  {
    icon: '🔗',
    title: 'Fully Decentralized',
    desc: 'Every action is signed by your wallet and verified on-chain. No intermediaries, no censorship.',
  },
  {
    icon: '👛',
    title: 'Integrated Wallet',
    desc: 'Ed25519 wallet derived from BIP39 mnemonic. Your keys, your identity.',
  },
  {
    icon: '💸',
    title: 'On-Chain Payments',
    desc: 'Tips, subscriptions, and content purchases — all handled by the smart contract.',
  },
  {
    icon: '🤝',
    title: 'Multi-Sig Escrow',
    desc: '2-of-3 escrow for services between users. Dispute resolution built in.',
  },
  {
    icon: '🏪',
    title: 'Marketplace',
    desc: 'Buy and sell content, services, and badges. 5% marketplace fee managed on-chain.',
  },
  {
    icon: '🌍',
    title: '8 Languages',
    desc: 'Internationalized UI with react-i18next. Community without borders.',
  },
  {
    icon: '🎨',
    title: '7 Themes',
    desc: 'Dark mode, light mode, and 5 more. Make it yours.',
  },
  {
    icon: '🖥️',
    title: 'Desktop App',
    desc: 'Electron app with auto-updates for Windows, macOS, and Linux.',
  },
];

export default function Features() {
  return (
    <section className="py-24 px-4 max-w-7xl mx-auto">
      <div className="text-center mb-16 scroll-reveal">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          <span className="gradient-text">Features</span>
        </h2>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          A complete decentralized platform, not just a forum.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((f, i) => (
          <div
            key={f.title}
            className="scroll-reveal glass rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(108,99,255,0.15)]"
            style={{ transitionDelay: `${i * 0.05}s` }}
          >
            <div className="text-3xl mb-4">{f.icon}</div>
            <h3 className="text-lg font-semibold mb-2 text-white">{f.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
```

Write to `site/src/components/Features.tsx`.

- [ ] **Step 5: Create HowItWorks.tsx**

```tsx
const steps = [
  {
    num: '01',
    title: 'Create Your Wallet',
    desc: 'Generate a BIP39 mnemonic. Your Ed25519 keypair is your identity — no email, no password, no server.',
  },
  {
    num: '02',
    title: 'Join the Community',
    desc: 'Register on-chain with a single transaction. Post threads, vote, moderate — all signed by you.',
  },
  {
    num: '03',
    title: 'Exchange Value',
    desc: 'Tip creators, subscribe to content, trade services through multi-sig escrow. The smart contract handles everything.',
  },
];

export default function HowItWorks() {
  return (
    <section className="py-24 px-4 max-w-5xl mx-auto">
      <div className="text-center mb-16 scroll-reveal">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          <span className="gradient-text">How It Works</span>
        </h2>
      </div>

      <div className="space-y-12">
        {steps.map((step, i) => (
          <div
            key={step.num}
            className="scroll-reveal flex flex-col md:flex-row items-start gap-6 glass rounded-2xl p-8"
            style={{ transitionDelay: `${i * 0.15}s` }}
          >
            <div className="text-5xl font-bold gradient-text shrink-0 w-20">
              {step.num}
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-3 text-white">{step.title}</h3>
              <p className="text-gray-400 leading-relaxed">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

Write to `site/src/components/HowItWorks.tsx`.

- [ ] **Step 6: Create TechStack.tsx**

```tsx
const techs = [
  { name: 'IOTA 2.0', desc: 'Rebased L1 blockchain', color: '#6c63ff' },
  { name: 'Move', desc: 'Smart contract language', color: '#a78bfa' },
  { name: 'React 19', desc: 'Frontend framework', color: '#61dafb' },
  { name: 'Sails.js', desc: 'Backend indexer', color: '#38bdf8' },
  { name: 'Electron', desc: 'Desktop application', color: '#47848f' },
  { name: 'SQLite', desc: 'Local cache / index', color: '#003b57' },
];

export default function TechStack() {
  return (
    <section className="py-24 px-4 max-w-5xl mx-auto">
      <div className="text-center mb-16 scroll-reveal">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          <span className="gradient-text">Tech Stack</span>
        </h2>
        <p className="text-gray-400 text-lg">Built on proven, modern technology.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {techs.map((t, i) => (
          <div
            key={t.name}
            className="scroll-reveal glass rounded-2xl p-6 text-center hover:scale-105 transition-all duration-300"
            style={{ transitionDelay: `${i * 0.05}s` }}
          >
            <div
              className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center text-xl font-bold"
              style={{ backgroundColor: `${t.color}20`, color: t.color }}
            >
              {t.name[0]}
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">{t.name}</h3>
            <p className="text-gray-500 text-sm">{t.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
```

Write to `site/src/components/TechStack.tsx`.

- [ ] **Step 7: Create Footer.tsx**

```tsx
export default function Footer() {
  return (
    <footer className="py-16 px-4 border-t border-white/5">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="text-center md:text-left">
          <h3 className="text-xl font-bold gradient-text mb-1">IotaPolis</h3>
          <p className="text-gray-500 text-sm">Decentralized community platform on IOTA 2.0</p>
        </div>

        <div className="flex gap-6 text-sm text-gray-400">
          <a href="https://github.com/deduzzo/iotapolis" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
            GitHub
          </a>
          <a href="https://github.com/deduzzo/iotapolis/releases" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
            Releases
          </a>
          <a href="/iotapolis/docs" className="hover:text-white transition-colors">
            Docs
          </a>
        </div>

        <p className="text-gray-600 text-xs">
          MIT License
        </p>
      </div>
    </footer>
  );
}
```

Write to `site/src/components/Footer.tsx`.

- [ ] **Step 8: Update index.astro with all components**

```astro
---
import Landing from '../layouts/Landing.astro';
import Hero from '../components/Hero';
import Features from '../components/Features';
import HowItWorks from '../components/HowItWorks';
import TechStack from '../components/TechStack';
import Footer from '../components/Footer';
---

<Landing title="IotaPolis — Decentralized Community Platform" description="Forum, wallet, payments, marketplace, and escrow — all on-chain, powered by IOTA 2.0">
  <Hero client:load />
  <Features client:visible />
  <HowItWorks client:visible />
  <TechStack client:visible />
  <Footer client:load />
</Landing>
```

Write to `site/src/pages/index.astro`.

- [ ] **Step 9: Build and verify**

```bash
cd /Users/deduzzo/dev/iota-free-forum/site
npm run build
```

Expected: Build succeeds.

- [ ] **Step 10: Commit**

```bash
git add site/src/
git commit -m "feat: add futuristic landing page with animations"
```

---

### Task 4: Documentation Content

**Files:**
- Create: `site/src/content/docs/getting-started/installation.mdx`
- Create: `site/src/content/docs/getting-started/quick-start.mdx`
- Create: `site/src/content/docs/getting-started/configuration.mdx`
- Create: `site/src/content/docs/architecture/overview.mdx`
- Create: `site/src/content/docs/architecture/smart-contract.mdx`
- Create: `site/src/content/docs/architecture/backend.mdx`
- Create: `site/src/content/docs/architecture/frontend.mdx`
- Create: `site/src/content/docs/guides/wallet.mdx`
- Create: `site/src/content/docs/guides/payments.mdx`
- Create: `site/src/content/docs/guides/escrow.mdx`
- Create: `site/src/content/docs/guides/marketplace.mdx`
- Create: `site/src/content/docs/api/endpoints.mdx`

**Depends on:** Task 2 completed (Astro scaffold exists)

**Source material:** Use `CLAUDE.md` at project root as the authoritative source for all documentation content. Also read the actual source files referenced in CLAUDE.md for accurate details.

- [ ] **Step 1: Create Getting Started docs**

**installation.mdx:**
```mdx
---
title: Installation
description: How to install and run IotaPolis locally.
---

## Prerequisites

- Node.js 20+
- npm 10+
- IOTA 2.0 Rebased testnet access

## Clone & Install

\`\`\`bash
git clone https://github.com/deduzzo/iotapolis.git
cd iotapolis
npm install
\`\`\`

## Smart Contract

Build and deploy the Move smart contract:

\`\`\`bash
npm run move:build
npm run move:deploy
\`\`\`

This deploys to the IOTA testnet and outputs the package ID and forum object ID.

## Run

\`\`\`bash
# Development (backend on :1337, frontend on :5173)
npm run dev

# Production (single port :1337)
npm start
\`\`\`
```

**quick-start.mdx:**
```mdx
---
title: Quick Start
description: Get up and running in 5 minutes.
---

## 1. Start the Server

\`\`\`bash
npm run dev
\`\`\`

## 2. Open the App

Navigate to `http://localhost:5173` in your browser.

## 3. Create Your Identity

Click **Setup** and generate a new BIP39 mnemonic. This creates your Ed25519 wallet — your on-chain identity.

Encrypt your mnemonic with a password. This is stored locally in your browser.

## 4. Get Test Tokens

Use the built-in faucet to receive testnet IOTA tokens for gas fees.

## 5. Register On-Chain

Your first transaction registers you on the forum smart contract. Once confirmed, you can create threads, post, vote, and more.
```

**configuration.mdx:**
```mdx
---
title: Configuration
description: Configure IotaPolis for your environment.
---

## Connection String

IotaPolis uses a connection string format:

\`\`\`
network:packageId:forumObjectId
\`\`\`

- **network**: IOTA network URL (testnet or custom)
- **packageId**: Deployed Move package ID
- **forumObjectId**: Forum shared object ID

## Environment

Key config files:

| File | Purpose |
|------|---------|
| `config/bootstrap.js` | Server startup, wallet init, sync |
| `config/routes.js` | API route definitions |
| `config/private_iota_conf.js` | Network config (gitignored) |

## Desktop

For Electron desktop builds:

\`\`\`bash
npm run desktop:dev     # Dev mode
npm run desktop:build   # Build for current platform
\`\`\`
```

Write all three files to `site/src/content/docs/getting-started/`.

- [ ] **Step 2: Create Architecture docs**

Read the actual source files to write accurate docs:
- `move/forum/sources/forum.move` for smart contract docs
- `api/utility/ForumManager.js` and `api/utility/iota.js` for backend docs
- `frontend/src/hooks/useIdentity.js` and `frontend/src/hooks/useWallet.js` for frontend docs

Create `overview.mdx`, `smart-contract.mdx`, `backend.mdx`, `frontend.mdx` in `site/src/content/docs/architecture/`.

Content should cover:
- **overview.mdx**: 3-layer architecture (smart contract, backend indexer, frontend), security model, data flow
- **smart-contract.mdx**: Forum shared object, entry functions, roles, events, payment structs
- **backend.mdx**: Sails.js indexer role, ForumManager sync, SQLite schema, eventAuthor verification
- **frontend.mdx**: React 19 + Vite, hooks architecture, wallet management, TX signing

- [ ] **Step 3: Create Guides docs**

Create `wallet.mdx`, `payments.mdx`, `escrow.mdx`, `marketplace.mdx` in `site/src/content/docs/guides/`.

Content based on CLAUDE.md sections:
- **wallet.mdx**: BIP39 mnemonic, Ed25519 keypair, AES-256-GCM encryption, faucet
- **payments.mdx**: Tips, subscriptions, content purchases, on-chain events
- **escrow.mdx**: 2-of-3 multi-sig, dispute resolution, cross-validation, deadline, rating
- **marketplace.mdx**: Content, services, badges, 5% fee, treasury

- [ ] **Step 4: Create API docs**

Read `config/routes.js` to get all endpoints.

Create `endpoints.mdx` in `site/src/content/docs/api/`.

List all REST endpoints with method, path, description, and required auth.

- [ ] **Step 5: Build and verify**

```bash
cd /Users/deduzzo/dev/iota-free-forum/site
npm run build
```

Expected: Build succeeds with all docs pages.

- [ ] **Step 6: Commit**

```bash
git add site/src/content/
git commit -m "docs: add complete technical documentation"
```

---

### Task 5: GitHub Actions Workflow

**Files:**
- Create: `.github/workflows/deploy-site.yml`

- [ ] **Step 1: Create workflow file**

```yaml
name: Deploy Site to GitHub Pages

on:
  push:
    branches: [main]
    paths:
      - 'site/**'
      - '.github/workflows/deploy-site.yml'
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: site/package-lock.json

      - name: Install dependencies
        working-directory: site
        run: npm ci

      - name: Build site
        working-directory: site
        run: npm run build

      - uses: actions/upload-pages-artifact@v3
        with:
          path: site/dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

Write to `.github/workflows/deploy-site.yml`.

- [ ] **Step 2: Commit**

```bash
git add .github/
git commit -m "ci: add GitHub Actions workflow for site deployment"
```

---

## Final Verification

After all tasks complete:

- [ ] Run full site build: `cd site && npm run build`
- [ ] Preview locally: `cd site && npm run preview`
- [ ] Verify landing page at `http://localhost:4321/iotapolis/`
- [ ] Verify docs at `http://localhost:4321/iotapolis/docs/`
- [ ] Verify no remaining "IOTA Free Forum" references: `grep -r "IOTA Free Forum" --include="*.{js,jsx,json,md}" -l`
