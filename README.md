# Rastro

**App personal de seguimiento de ejercicio: GPS (caminar · trotar · correr) + dominadas, con reportes y análisis de zancada.**

Local-first, sin cuenta, sin servidores. Tus datos viven en tu dispositivo.

> Rastro no solo cuenta cuántos kilómetros hiciste, sino a qué ritmo, con qué cadencia de pasos y cuál es tu zancada eficiente — para enseñarte cómo mejorás.

---

## Estado

| Versión | Qué es | Dónde |
|---------|--------|-------|
| **v1** (en uso) | MVP en un solo archivo HTML (vanilla JS + Leaflet + `localStorage`) | [`index.html`](./index.html) |
| **v2** (en desarrollo) | Reescritura con stack moderno + app nativa Android | [`astro-vue-capacitor/`](./astro-vue-capacitor) |

El roadmap completo y el estado por feature (F1–F13) está en **[`SPECS.md`](./SPECS.md)**.

## Principios (no negociables)

- **Sin cuenta.** Nada de login, correo ni registro.
- **Local-first.** Los datos viven en el dispositivo. No hay servidor propio.
- **El usuario es dueño de sus datos.** Exportar/importar e borrado total siempre disponibles.
- **Privacidad.** La ubicación nunca sale del dispositivo salvo que exportes o compartas a propósito.
- **Funciona sin internet** para registrar (solo el mapa base pide red).
- **Métrico** y **en español**.

## Funcionalidades

- **Registro GPS** en vivo (distancia, tiempo, ritmo, velocidad) con mapa (Leaflet + OpenStreetMap) y filtrado de ruido consciente de la precisión.
- **Dominadas** por series, con totales y récords.
- **Cadencia y pasos** por acelerómetro (F2) y **contador de hardware** alterno (F6), comparables lado a lado.
- **Reportes por actividad** (F4): splits por km, series de ritmo/velocidad/cadencia con tooltip táctil y eje conmutable **tiempo/distancia**, perfil de rendimiento por tramo, marcadores de inicio/fin.
- **Motor de zancada** (F8): encuentra tu cadencia óptima (`velocidad = zancada × cadencia`).
- **Progreso** (F9): récords, distancia/ritmo/cadencia por semana, dominadas por semana.
- **PWA** offline + **app nativa Android** vía Capacitor, con **GPS en segundo plano** (F5, servicio en primer plano).

Estado detallado de cada feature → [`SPECS.md`](./SPECS.md).

## Stack (v2)

- **[Astro](https://astro.build) 7** — shell SPA con una isla Vue (`client:only`), no MPA (recargar mataría el estado del tracking en vivo).
- **[Vue 3](https://vuejs.org)** (Composition API + TS) + **[nanostores](https://github.com/nanostores/nanostores)** para estado a nivel de módulo que sobrevive cambios de pestaña.
- **[Capacitor](https://capacitorjs.com) 8** (Android): geolocalización, background geolocation, SQLite, motion, pedómetro de hardware.
- **[@vite-pwa/astro](https://vite-pwa-org.netlify.app)** — offline + caché de tiles.
- **[Leaflet](https://leafletjs.com)** — mapa. Gráficas SVG hechas a mano (sin librería de charts).
- **[Vitest](https://vitest.dev)** (89 tests) · **[oxlint](https://oxc.rs) / oxfmt** · **TypeScript** estricto.
- **[Bun](https://bun.sh)** como gestor de paquetes.

## Estructura del repo

```
.
├── index.html              # v1 (MVP, un solo archivo)
├── SPECS.md                # especificación y roadmap del producto
└── astro-vue-capacitor/    # v2
    ├── src/
    │   ├── lib/            # lógica pura y testeable (track, steps, reports, stride, trends, format)
    │   ├── stores/        # estado (tracker, activities, settings, ui) — nanostores
    │   ├── geolocation/   # puerto hexagonal + adaptadores (capacitor / background / web)
    │   ├── persistence/   # puerto de persistencia + adaptadores (sqlite / indexeddb / memory)
    │   ├── motion/        # podómetros: acelerómetro (F2) y hardware (F6)
    │   ├── components/    # UI Vue (tabs, detalle, charts)
    │   └── pages/         # index.astro (shell)
    └── android/            # proyecto Capacitor Android
```

## Puesta en marcha (v2)

Requisitos: [Bun](https://bun.sh), Node ≥ 22.12, y (para Android) Android Studio + un dispositivo o emulador.

```bash
cd astro-vue-capacitor
bun install

# Desarrollo web
bun run dev

# Desarrollo con el teléfono en la misma red (imprime un QR + HTTPS para el GPS)
bun run dev:mobile
```

### Android (Capacitor)

```bash
# Compilar y correr en el dispositivo/emulador conectado
bun run cap:run

# Live-reload en el dispositivo (apunta al dev server por LAN)
bun run cap:live
```

> El GPS en segundo plano, la SQLite nativa y el podómetro de hardware **solo funcionan en el build nativo**; en web degradan (IndexedDB, acelerómetro, sin background).

## Calidad

```bash
bun run test        # Vitest (unit, lógica pura de src/lib)
bun run check       # astro check (tipos) + oxlint
bun run format      # oxfmt
```

## Arquitectura, en breve

- **Puertos y adaptadores (hexagonal).** El tracker depende de interfaces (`GeolocationProvider`, `ActivityRepository`), no de plugins concretos. Cambiar de GPS web a background nativo, o de IndexedDB a SQLite, es un swap del adaptador — no una reescritura.
- **Lógica pura en `src/lib`.** Haversine, filtro de ruido GPS, detección de pasos, reportes, motor de zancada y tendencias son funciones sin DOM, cubiertas por tests.
- **Estado a nivel de módulo** (nanostores): la sesión de tracking vive fuera de los componentes, así sobrevive a cambios de pestaña — la razón por la que la app es un shell persistente y no una MPA.

## Privacidad

Rastro no envía tus datos a ningún lado. La ubicación, los pasos y el historial se quedan en el dispositivo. Compartir e exportar son **siempre acciones explícitas** tuyas.

---

Proyecto personal · repositorio: [github.com/yebt/Rastro](https://github.com/yebt/Rastro)
