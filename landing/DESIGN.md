# Rastro landing — design system

The landing inherits the Rastro app's "instrument" skin and applies it as a
**Persuade** surface. Form: *map-first immersion* — the product's own map and
readouts are the page, not a brochure about them. Direction seed `a15b0ba6`.

## Palette (single committed dark world)

| Token | Value | Role |
|---|---|---|
| `--bg` | `#0a0c0d` | Ground (near-black) |
| `--bg-2` | `#0d1012` | Deeper ground / footer |
| `--surface` | `#14181a` | Panels, cards |
| `--surface-2` | `#1b2124` | Raised surface |
| `--line` / `--line-2` | `#232a2d` / `#2d3538` | Hairlines, borders |
| `--ink` | `#eef1ee` | Primary text |
| `--muted` | `#97a09a` | Body-secondary (~6.6:1) |
| `--faint` | `#626b65` | Decorative ticks only |
| `--accent` | `#4ce08c` | The one signal color |
| `--accent-ink` | `#04140a` | Text on accent |

`.cap` labels use `#8b938d` (>=4.5:1) — quiet by size + tracking, still legible.
The one signal green carries route lines, emphasis words, active states, and the
primary CTA. Emphasis is weight/size/color — never gradient text.

## Type

- **Display** — Barlow Condensed 600, uppercase, `letter-spacing: -0.02em`,
  `line-height: ~0.9`. Headlines split across lines with an accent second line.
- **Body** — Roboto, 17px, `line-height 1.6`.
- **Numerals / measurements** — Space Mono, `tabular-nums`, tightened tracking.
  Mono is reserved for data (readouts, splits, tags), never as a "tech" costume.

## Materials & components

- **Terrain ground** — a fixed, faint topographic contour SVG behind everything
  (`--line` strokes, low opacity) with two soft accent radial glows.
- **Instrument scope** — the hero panel: a drawn route (start = solid ink dot,
  end = hollow accent ring) on a dot grid, gently tilted, over a HUD readout row.
  The route animates its stroke on reveal.
- **Panels / cards** — `--surface`→`--bg-2` vertical fade, `--line-2` border,
  soft offset shadow (`--shadow`, offset + blur — never a zero-offset halo).
  Corners: `--radius 14px` / `--radius-lg 22px`.
- **Icons** — drawn SVG, ~1.8px stroke, round caps/joins, `currentColor`. No
  emoji, no unicode-as-icon.
- **Buttons** — accent fill (primary) or ghost surface (secondary); hover lifts
  `translateY(-2px)` with an accent shadow.

## Motion

One authored moment: sections rise (`translateY` + fade, ease-out) as they enter,
and the hero route draws itself. Reveal is progressive-enhanced (visible by
default, armed only under `.js`) with an observer + scroll sweep + hard fallback
so content is never left hidden. All motion is disabled under
`prefers-reduced-motion`.

## i18n

Bilingual ES/EN. Spanish is the source language (rendered at build from
`src/i18n.ts`); a toggle swaps `textContent` of every `[data-i18n]` node and
persists the choice. Default follows the browser language, falling back to ES.

## Layout

`--maxw 1160px`, `--edge clamp(20px, 5vw, 64px)`. Two-column bands collapse to a
single column at 900px (instrument/visual stacks first); dense grids collapse at
620px. Spacing scale `--sp-1..9`; more space above a heading than below it.

## Rules of the world

- Dark is committed (the app ships dark as identity); there is no light theme.
- Do not introduce a second accent color, gradient text, or stock chrome.
- New sections inherit panel material, hairline weights, corner language, and the
  mono-for-data rule. Claims stay truthful — no invented store links, ratings, or
  user counts; demo numbers are illustrative.
