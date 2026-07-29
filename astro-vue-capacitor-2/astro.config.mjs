// @ts-check
import { execSync } from "node:child_process";
import os from "node:os";
import vue from "@astrojs/vue";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { defineConfig, fontProviders } from "astro/config";
import qrcode from "qrcode-terminal";
import Icons from "unplugin-icons/vite";

/**
 * Build identity from git, resolved when Astro loads this config (dev start or
 * build). The commit COUNT is a monotonic build number; the short HASH pins the
 * exact commit. Both fall back to safe values outside a git checkout so a source
 * tarball still builds.
 */
function gitVersion() {
  const run = (/** @type {string} */ cmd) => {
    try {
      return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] })
        .toString()
        .trim();
    } catch {
      return "";
    }
  };
  return {
    commit: run("git rev-parse --short HEAD") || "dev",
    build: run("git rev-list --count HEAD") || "0",
  };
}

const git = gitVersion();

// `MOBILE=1` (via `bun run dev:mobile`) serves the LAN over HTTPS + prints a QR,
// so the phone loads in a SECURE context and GPS / service worker actually work.
const mobile = process.env.MOBILE === "1";
// Expose the dev server on the LAN over HTTP (for Capacitor live reload).
const lan = mobile || process.env.LAN === "1";

/** First non-internal IPv4 address, so the QR points at the LAN, not localhost. */
function lanIp() {
  for (const nets of Object.values(os.networkInterfaces())) {
    for (const net of nets ?? []) {
      if (net.family === "IPv4" && !net.internal) return net.address;
    }
  }
  return "localhost";
}

/**
 * Astro integration that prints a QR of the LAN URL on server start.
 * Done via the Astro hook (not vite-plugin-qrcode) because Astro replaces
 * Vite's URL printing, so a Vite plugin's QR never shows.
 */
function mobileQr() {
  return {
    name: "rastro-mobile-qr",
    hooks: {
      /** @param {{ address: import('node:net').AddressInfo }} ctx */
      "astro:server:start": ({ address }) => {
        const url = `https://${lanIp()}:${address.port}/`;
        console.log("\n  Abrí en el celu (aceptá el certificado autofirmado):");
        console.log(`      ${url}\n`);
        qrcode.generate(url, { small: true });
        console.log("");
      },
    },
  };
}

// https://astro.build/config
export default defineConfig({
  server: lan ? { host: true } : {},

  integrations: [vue(), ...(mobile ? [mobileQr()] : [])],

  // Self-hosted fonts via fontsource (offline-first, no CDN at runtime). Files
  // are downloaded at build time and served locally; tokens.css maps them.
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: "Roboto",
      cssVariable: "--font-roboto",
      weights: [400, 500, 700],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["system-ui", "-apple-system", "sans-serif"],
    },
    {
      provider: fontProviders.fontsource(),
      name: "Barlow Condensed",
      cssVariable: "--font-barlow",
      weights: [600, 700],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["sans-serif"],
    },
    {
      provider: fontProviders.fontsource(),
      name: "Roboto Mono",
      cssVariable: "--font-roboto-mono",
      weights: [400, 500],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["ui-monospace", "monospace"],
    },
  ],

  vite: {
    // Bake the git build id in at compile time so the About screen can show
    // exactly which commit an APK was cut from. Replaced literally by Vite.
    define: {
      __APP_BUILD__: JSON.stringify(git.build),
      __APP_COMMIT__: JSON.stringify(git.commit),
    },
    // Lucide icons compiled to Vue components. All access goes through the
    // AppIcon design-system primitive, never `~icons/*` imports in features.
    plugins: [Icons({ compiler: "vue3" }), ...(mobile ? [basicSsl()] : [])],
  },
});
