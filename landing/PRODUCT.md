# Rastro — Product truth

## One-sentence mechanism
Rastro records your walks, runs and workouts entirely on the phone — GPS route, cadence, elevation, splits — and turns each one into a readable "instrument" of how you moved, with no account and no cloud.

## What it is
An offline-first Android fitness tracker. Three activity kinds: **move** (walk/run with live GPS), **exercise** (reps + sets), and **routine** (a sequence played back with timed rests). Every activity is stored locally (IndexedDB) and analyzed by a pure domain layer.

## Who it's for
People who run/walk/train and want honest, private metrics without signing up for a platform. Secondary audience: developers who value a clean offline-first, hexagonal codebase (the project is open source, AGPL-3.0).

## The real scene
Outdoors, mid-effort, phone in hand or pocket; then later, on the couch, reviewing the route and sharing one good run. Bright sun during recording, dim room during review — the app ships a dark "instrument" skin as its identity.

## What only Rastro proves (differentiators)
- **Optimal-cadence engine** — finds the stride/cadence where you were actually most efficient, not just an average.
- **Per-route insights** — plain-language read of where you surged, faded, and peaked ("apretaste en el K3").
- **Records & medals** — automatic PR badges on record-holding activities.
- **Share studio** — export a run as a designed card: photo backgrounds, layouts, typographies, effects, and tilted / topographic maps.
- **Truly offline & accountless** — no login, no server, no tracking; data lives on the device. GPX export to take it anywhere.
- **Deep analytics** — splits, pace/speed over time, elevation profile, cadence & stride series, negative/positive split, calories, segment comparison.

## Constraints / truths (uninventable)
- Android app built with Astro + a persistent Vue island + Capacitor 8; Leaflet + MapLibre maps on CARTO / OpenTopoMap tiles.
- Hexagonal architecture, pure tested domain (~170 unit tests).
- Distribution is a downloadable APK (not on Play Store as a claim). Do NOT invent user counts, ratings, store links, or prices.
- UI language is Spanish (Rioplatense/neutral).

## Brand commitments (the established world — inherit, don't replace)
- **Palette:** near-black ground `#0a0c0d`, surface `#14181a`, ink `#eef1ee`, muted `#838c86`, single accent green `#4ce08c` (light-theme accent `#0e7a45`).
- **Type:** Barlow Condensed for display, a mono (Space Mono / Roboto Mono) for numerals & measurements, Roboto for text.
- **Mark:** a flowing accent-green GPS-route line that traces an "R" — one continuous rounded stroke (thick, organic, like the app's own trace) with a solid ink start-dot at the foot, on a rounded near-black tile. Reads as a route, resolves as an R.
- **Character:** an instrument, not a hype app. Measurement-grade, quiet, monochrome + one signal color.

## This surface
A bilingual (ES/EN toggle) marketing landing page (Persuade) that makes a first-time visitor understand what Rastro is, believe the private/offline/measurement promise, and download the APK or view the source.
