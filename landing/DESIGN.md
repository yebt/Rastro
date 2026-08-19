# Rastro landing — design system

The landing is a **survey of your movement**: the app's dark "instrument" skin
rendered as a geological-survey sheet, carried with running-app conviction.
Form: *dark survey instrument × athletic display* (direction pinned by brief,
key `brief-2026-survey`). Persuade surface; `/tecnologia` is sheet 02 of the
same survey.

## Palette (single committed dark world)

| Token | Value | Role |
|---|---|---|
| `--bg` | `#0a0c0d` | Ground (near-black) |
| `--bg-2` | `#0d1012` | Deeper ground / footer |
| `--surface` | `#14181a` | Panels, plates |
| `--surface-2` | `#1b2124` | Raised surface |
| `--line` / `--line-2` | `#232a2d` / `#2d3538` | Hairlines, borders |
| `--ink` | `#eef1ee` | Primary text |
| `--muted` | `#97a09a` | Body-secondary (~6.6:1) |
| `--faint` | `#626b65` | Decorative marks only (always `aria-hidden`) |
| `--accent` | `#4ce08c` | The one signal color |
| `--accent-ink` | `#04140a` | Text on accent |

`.cap` labels use `#8b938d` (>=4.5:1). The one signal green carries route lines,
the accent headline line, active states, the primary CTA, and one highlighted
contour in the ground. No second accent, no gradient text.

## Type

- **Display** — Barlow Condensed 700, uppercase, `letter-spacing: -0.03em`,
  `line-height: 0.85–0.9`. The hero headline runs at viewport scale
  (`clamp(58px, 11.5vw, 158px)`) and is allowed to run OVER imagery (the route
  plate sits at a lower z-index). Section titles `clamp(38–46px … 72–104px)`.
- **Body** — Roboto, 17px, `line-height 1.6`.
- **Numerals / measurements / survey marks** — Space Mono, `tabular-nums`. Mono
  carries data AND the survey language: registration labels, coordinate
  readouts, grid refs, FIG codes, elevation stamps. Never a "tech" costume
  elsewhere.

## The survey layer (connective tissue)

- **Terrain ground** (`src/components/Terrain.astro`, shared by both pages) —
  a fixed sheet: faint 120px coordinate grid, threading contours, two nested
  contour "hills" with tiny mono elevation labels, sparse crosshair marks, one
  contour picked out in low-opacity accent, two soft accent radial glows.
- **Registration ticks** — `.reg` puts ⌐/⌙ corner ticks (15px, `#8b938d`,
  offset −6px) on key plates: hero HUD, analysis panel, exercise panel, pledge
  legend, tech diagram, tech stats.
- **Section rules** — `.sec-rule`: a hairline with a 36px accent tab, mono
  `SEC. 0N` left and a `GRID X7 · NN` code right. Decorative, `aria-hidden`.
- **Survey line** — the sheet header row under the nav: `LEVANTAMIENTO DE
  MOVIMIENTO` (i18n), Buenos Aires coordinates `34.6037° S · 58.3816° W`, and
  `HOJA 01 · [2026]` (i18n). `/tecnologia` is `HOJA 02 · TÉCNICA`.
- **Compass** — a drawn N-needle mark (accent north half) in the hero HUD bar.
- **Codes are language-neutral** (SEC/GRID/FIG/WPT/ESC/ELEV) and never carry
  content; anything with meaning goes through `data-i18n`.

## Materials & components

- **Hero** — flex column capped `clamp(620px, 100svh − 62px, 920px)`: survey
  line, headline over the rotated (+2°) route plate, sub + CTAs, then a
  corner-ticked full-width **HUD legend bar** (compass, four mono readouts,
  `GRID REF. 08 / X7 / 19`) anchoring the fold.
- **Trust strip** — hairline-bounded mono legend of real facts only (open
  source, offline-first, no account, AGPL-3.0, ~170 domain tests, GPX). Never
  invented counts, ratings, or store logos.
- **Modes ledger** — the three activity kinds as full-width registered rows
  (`M–01..03` code · icon + huge condensed name · description), hairline
  separators, hover fill. Not cards.
- **Panels / plates** — `--surface`→`--bg-2` fade, `--line-2` border, offset
  soft shadow, radius 14/22px. The analysis panel opens with a mono header
  (`FICHA DE ACTIVIDAD` · `N.º 0142 · MOV`) and each chart carries a `FIG.` code.
- **Share deck** — three visible slots (left/center/right) rotating through a
  pool of six authored card designs (tilted map, dawn photo, duotone, topo,
  blueprint/coordinates, big-typographic). JS assigns `pos-l/c/r/back`; every
  advance shifts all three slots. Dots are real buttons; pause on hover/focus
  and hidden tab; static + manual-only under reduced motion.
- **Legend rows** — share features and privacy pledges are hairline-divided
  grid legends, not card stacks.
- **Icons** — drawn SVG, ~1.8px stroke, round caps, `currentColor`. No emoji.
- **Buttons** — accent fill (primary) / ghost surface (secondary); hover lifts
  `translateY(-2px)` with an accent shadow.

## Motion (all `prefers-reduced-motion`-gated)

One connected system: sections rise on entry (observer + scroll sweep + hard
fallback so nothing stays hidden); the hero headline lines stagger up; the hero
route draws itself with km marks popping as the stroke reaches them; the splits
bars fill; the roadmap track draws; the closer R re-traces as a bookend; the
share deck rotates its three slots. Under reduced motion everything is static
and the deck never auto-advances (dots still work, instantly).

## i18n

Bilingual ES/EN, Spanish source (`src/i18n.ts`), rendered ES at build; the
toggle swaps `textContent` of `[data-i18n]` and `aria-label` of
`[data-i18n-label]`, persisted in localStorage. Every key resolves in both
languages. Survey codes are language-neutral and stay out of the dictionary.

## Layout

`--maxw 1160px`, `--edge clamp(20px, 5vw, 64px)`. Hero plate overlaps collapse
at 1040px (plate stacks under the headline); two-column bands collapse at
900px; the deck tightens and legends stack at 620px. Spacing scale `--sp-1..9`;
more space above a heading than below it.

## Rules of the world

- Dark is committed (the app ships dark as identity); there is no light theme.
- Do not introduce a second accent, gradient text, cream/paper grounds, or
  stock chrome. The survey language stays authored and truthful.
- The CL2 route-R glyph (nav / footer / closer / favicon) is FINAL — reuse the
  exact markup, never redraw it.
- New sections inherit the survey layer: a `.sec-rule`, mono-for-data, hairline
  legends, plate material, and corner ticks only on true plates.
- Claims stay truthful — no invented store links, ratings, or user counts;
  demo numbers are illustrative; download goes to GitHub releases.
