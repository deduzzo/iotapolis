import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://iotapolis.io',
  base: '/',
  image: {
    service: { entrypoint: 'astro/assets/services/noop' },
  },
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
