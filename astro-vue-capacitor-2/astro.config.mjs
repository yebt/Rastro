// @ts-check
import vue from '@astrojs/vue';
import { defineConfig } from 'astro/config';
import Icons from 'unplugin-icons/vite';

// https://astro.build/config
export default defineConfig({
  integrations: [vue()],
  vite: {
    plugins: [
      // Lucide icons compiled to Vue components. All access goes through the
      // AppIcon design-system primitive, never `~icons/*` imports in features.
      Icons({ compiler: 'vue3' }),
    ],
  },
});
