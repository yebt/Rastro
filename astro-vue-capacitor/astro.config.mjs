// @ts-check
import os from 'node:os';
import { defineConfig, fontProviders } from 'astro/config';

import vue from '@astrojs/vue';
import AstroPWA from '@vite-pwa/astro';
import Icons from 'unplugin-icons/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import qrcode from 'qrcode-terminal';

// `MOBILE=1` (via `bun run dev:mobile`) serves the LAN over HTTPS + prints a QR,
// so the phone loads in a SECURE context and GPS / service worker actually work.
const mobile = process.env.MOBILE === '1';
// Expose the dev server on the LAN over HTTP (for Capacitor live reload).
const lan = mobile || process.env.LAN === '1';

/** First non-internal IPv4 address, so the QR points at the LAN, not localhost. */
function lanIp() {
  for (const nets of Object.values(os.networkInterfaces())) {
    for (const net of nets ?? []) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return 'localhost';
}

/**
 * Astro integration that prints a QR of the LAN URL on server start.
 * Done via the Astro hook (not vite-plugin-qrcode) because Astro replaces
 * Vite's URL printing, so a Vite plugin's QR never shows.
 */
function mobileQr() {
  return {
    name: 'rastro-mobile-qr',
    hooks: {
      /** @param {{ address: import('node:net').AddressInfo }} ctx */
      'astro:server:start': ({ address }) => {
        const url = `https://${lanIp()}:${address.port}/`;
        console.log(`\n  📱  Abrí en el celu (aceptá el certificado autofirmado):`);
        console.log(`      ${url}\n`);
        qrcode.generate(url, { small: true });
        console.log('');
      },
    },
  };
}

// https://astro.build/config
export default defineConfig({
  server: lan ? { host: true } : {},

  integrations: [
    vue(),
    ...(mobile ? [mobileQr()] : []),
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

  vite: {
    // Import icons as Vue components: `import IconRoute from '~icons/lucide/route'`.
    plugins: [Icons({ compiler: 'vue3' }), ...(mobile ? [basicSsl()] : [])],
    // MapLibre GL (share "Mapa" theme): bundle it for SSR so Vite doesn't resolve
    // its CommonJS entry on the server. Worker is wired via ?worker&url in routeMap.
    ssr: { noExternal: ['maplibre-gl'] },
    // MapLibre (~900K + worker) is lazy-imported only when a Mapa theme is picked,
    // so it never touches the app-open bundle. Raise the warning limit so Vite
    // stops flagging that intentionally-split chunk.
    build: { chunkSizeWarningLimit: 1000 },
  },
});
