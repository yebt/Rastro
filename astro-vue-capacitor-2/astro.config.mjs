// @ts-check
import os from 'node:os';
import vue from '@astrojs/vue';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { defineConfig } from 'astro/config';
import qrcode from 'qrcode-terminal';
import Icons from 'unplugin-icons/vite';

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
        console.log('\n  Abrí en el celu (aceptá el certificado autofirmado):');
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

  integrations: [vue(), ...(mobile ? [mobileQr()] : [])],

  vite: {
    // Lucide icons compiled to Vue components. All access goes through the
    // AppIcon design-system primitive, never `~icons/*` imports in features.
    plugins: [Icons({ compiler: 'vue3' }), ...(mobile ? [basicSsl()] : [])],
  },
});
