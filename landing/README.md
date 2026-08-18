# Rastro — landing

Marketing landing page for [Rastro](https://github.com/yebt/Rastro), the
offline-first, accountless movement recorder for Android.

Built with Astro. Bilingual (ES/EN) with a runtime toggle. Inherits the app's
"instrument" design system — see [`DESIGN.md`](./DESIGN.md); product truth lives
in [`PRODUCT.md`](./PRODUCT.md).

## Develop

```sh
bun install
bun dev        # http://localhost:4321
bun run build  # → dist/
bun run preview
```

## Structure

- `src/pages/index.astro` — the whole landing (single page).
- `src/i18n.ts` — bilingual copy dictionary (Spanish is the source language).
- `src/styles/global.css` — design tokens (the instrument skin).
- `src/components/BaseHead.astro` — `<head>` metadata and fonts.

## License

AGPL-3.0-or-later. See the repository-root [`LICENSE`](../LICENSE).
