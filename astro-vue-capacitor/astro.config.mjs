// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

import vue from '@astrojs/vue';
import AstroPWA from '@vite-pwa/astro';

// https://astro.build/config
export default defineConfig({
  integrations: [
    vue(),
    AstroPWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Rastro — GPS + Dominadas',
        short_name: 'Rastro',
        description: 'Registrá tus km y tus dominadas. Local-first, sin cuenta.',
        lang: 'es',
        dir: 'ltr',
        theme_color: '#15181A',
        background_color: '#F5F6F3',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          // TODO: generate real 192/512 PNG maskable icons (pwa-assets).
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        // Precache the app shell so it opens offline.
        globPatterns: ['**/*.{js,css,html,svg,woff2,ico,png}'],
        // Cache OpenStreetMap tiles as they are visited → map works offline afterwards.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/[a-c]\.tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: { maxEntries: 3000, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        // Keep the SW off during `astro dev` to avoid caching surprises while developing.
        enabled: false,
      },
    }),
  ],

  // Native Astro Fonts API — self-hosted & optimized, no CDN (offline-first).
  // Files are downloaded at build time and served from _astro/fonts.
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Inter',
      cssVariable: '--font-inter',
      weights: [400, 500, 600, 700],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['system-ui', '-apple-system', 'sans-serif'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'Barlow Condensed',
      cssVariable: '--font-barlow',
      weights: [500, 600, 700],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['sans-serif'],
    },
  ],
});
