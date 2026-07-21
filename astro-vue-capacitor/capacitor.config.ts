import type { CapacitorConfig } from '@capacitor/cli';
import os from 'node:os';

/** First non-internal IPv4 — used as the live-reload host. */
function lanIp(): string {
  for (const nets of Object.values(os.networkInterfaces())) {
    for (const net of nets ?? []) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return 'localhost';
}

// `CAP_LIVE=1` points the native WebView at the dev server (HTTP LAN) for live
// reload. Without it, the app loads the built assets from `dist` (capacitor://).
const liveReload = process.env.CAP_LIVE === '1';

const config: CapacitorConfig = {
  appId: 'com.rastro.app',
  appName: 'Rastro',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      // Keep the splash up until the app signals it's ready (App.vue), so there
      // is no black gap between the native splash and the first WebView paint.
      launchAutoHide: false,
      backgroundColor: '#15181A',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
    },
  },
  ...(liveReload
    ? { server: { url: `http://${lanIp()}:4321`, cleartext: true } }
    : {}),
};

export default config;
