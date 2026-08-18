// @ts-check

import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://rastro.surge.sh',
	integrations: [sitemap()],
	fonts: [
		{
			// Display — the app's condensed instrument voice.
			provider: fontProviders.google(),
			name: 'Barlow Condensed',
			cssVariable: '--font-display',
			weights: [500, 600, 700],
			styles: ['normal'],
			subsets: ['latin'],
			fallbacks: ['sans-serif'],
		},
		{
			// Body text.
			provider: fontProviders.google(),
			name: 'Roboto',
			cssVariable: '--font-text',
			weights: [400, 500, 700],
			styles: ['normal'],
			subsets: ['latin'],
			fallbacks: ['system-ui', 'sans-serif'],
		},
		{
			// Numerals & measurements — the readout mono.
			provider: fontProviders.google(),
			name: 'Space Mono',
			cssVariable: '--font-mono',
			weights: [400, 700],
			styles: ['normal'],
			subsets: ['latin'],
			fallbacks: ['ui-monospace', 'monospace'],
		},
	],
});
