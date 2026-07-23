# TODO — Rastro v2

Control de tareas del rediseño mayor (v2). Se construye **por fases**; el orden
importa porque cada fase apoya en la anterior. Filosofía: **reconstruir para mejor
UX, no parchar lo viejo** salvo que sirva tal cual.

Leyenda: `[ ]` pendiente · `[~]` en progreso · `[x]` hecho · 🔒 bloqueante del resto.

---

## Navegación v2 (acordada)

4 tabs en la barra inferior:

1. **Home** — dashboard de stats + racha/calendario + records.
2. **Work out** — hub para arrancar actividad (moverse: Caminata/Trote/Carrera · o ejercicios: dominadas/…).
3. **Profile** — historial, calendario, records, nombre/nickname.
4. **More (⋯)** — ajustes, datos (export/import/backup), about.

Reemplaza el esquema viejo (Rastrear/Dominadas/Historial/Progreso/Datos + gear-overlay).

---

## Fase 1 — Fundaciones + Datos  🔒

El cimiento. El modelo actual es *lossy* (ruta = `[lat,lng]` a 5 dp, sin tiempo/altitud
por punto; samples sin posición) y **no tiene migraciones**. Se arregla ACÁ, una vez.

- [x] 🔒 Esquema de datos v2 con `schemaVersion` + **capa de migración** que envuelve los blobs viejos sin romperlos. → `src/persistence/migrate.ts` (+ tests), wired en load/add/import.
- [x] 🔒 Captura de punto rico: guardar `alt` + `t` + `acc` por punto. → `GeoFix.altitude` capturado en ambos adapters; `track: TrackPoint[]` lossless en `stop()`; `route` compat intacto.
- [ ] Modelo `Exercise` genérico (dominadas → ejercicios; rutinas a futuro).
- [ ] Reservar en el modelo: `photos[]`, `segments` (tramos manuales), favoritos de tarjeta.
- [ ] Sistema de **accent tokens** (verde / naranja / púrpura / azul / mono) con contraste garantizado en claro y oscuro. Derivar `--accent / --accent-strong / --accent-soft / --accent-contrast`. Ningún hex suelto.
- [ ] Navegación 4 tabs (Home · Work out · Profile · More).
- [ ] **Home**: dashboard de stats + racha/calendario + records.
- [ ] **Profile**: historial + calendario + records + nombre.
- [ ] **More (⋯)**: ajustes + datos (export/import/backup) + about.
- [ ] Splash screen con logo (`@capacitor/splash-screen`) — sin flash blanco/negro.
- [ ] Onboarding primer arranque: permisos → input lindo de nombre/nickname (local, para el futuro).

## Fase 2 — Captura + Review (flujo full UX)

Repensar TODO el flujo de la app con foco en UX.

- [ ] Work out: pantalla previa **sin mapa**; elegir actividad primero.
- [ ] Al arrancar → mapa **full-screen borderless**, casi total.
- [ ] Controles: pausar / reanudar / finalizar / agregar captura.
- [ ] Fotos durante el recorrido (no solo la ruta).
- [ ] Al finalizar la actividad → **directo a la review**.
- [ ] Ícono de meta 🏁 en el punto de llegada.

## Fase 3 — Métricas (repensar profundo)

Analizar cómo se toman, qué se evalúa y cómo se muestran. Datos que le importan
al corredor/caminante, no números sueltos.

- [ ] Insights reales: "del km 18 al 19 apretaste", "con zancada larga rendiste más", "acá bajaste el ritmo", dónde empezaste a caer.
- [ ] Splits negativos/positivos, zonas de esfuerzo, eficiencia de zancada por tramo.
- [ ] Review rediseñada con esos insights.

## Fase 4 — Studio de tarjetas

- [ ] Plantillas: varios layouts de la data + fuentes + colores + inclinación.
- [ ] Guardar config como **favorito**.
- [ ] Adjuntar foto (tomada al finalizar) como fondo.
- [ ] **Colores desde imagen**: paleta dominante + ajustar secundarios por contraste.
- [ ] Tarjeta **topográfica** (tiles topo de fondo — solo estético, la ruta no sale del dispositivo).
- [ ] **Tramos manuales**: guardar un tramo y comparar el ritmo en el mismo tramo entre salidas.

---

## Futuro / backlog (no ahora)

- [ ] Notificación con **estado del recorrido** (en progreso / pausado / …) mientras se rastrea.
- [ ] Elevación real: altitud por GPS suavizada + opción de conectar a terceros (opt-in; rompe offline/privacidad).
- [ ] Detección **automática** de tramos repetidos (hoy: manual).
- [ ] Rutinas de ejercicios configurables.
- [ ] Sync online opcional (Google) — privado, opt-in.
- [ ] Íconos PWA 192/512 maskable reales.

---

## Hecho (v1 + iteraciones)

- [x] F1 tracking GPS + Wake Lock · F2 podómetro acelerómetro.
- [x] F5 tracking con pantalla bloqueada (background-geolocation + foreground service).
- [x] F6 podómetro por hardware (`@capgo/capacitor-pedometer`) + comparación de fuentes.
- [x] F8 motor de zancada / cadencia óptima (idea central).
- [x] F9 tendencias semanales + tab Progreso + records.
- [x] Gráficos con eje de distancia + perfil de tramos denoised + drill-down por km.
- [x] F15 pantalla de permisos (setup).
- [x] F17 modo oscuro + fixes de contraste (hero card, seg buttons).
- [x] Export/backup nativo (Filesystem + Share) con timestamp + carpeta Documents/Rastro + limpiar copias.
- [x] F12 tarjeta para compartir: 8 temas + splash screen.
- [x] Tarjeta Mapa (MapLibre): fix del worker, estilos raster CARTO (voyager/dark/light).
- [x] Tarjeta Mapa: gradient blur en el texto + marcadores inicio/fin + cámara personalizable (pitch/bearing/zoom).
- [x] Fix warning de chunk size (MapLibre lazy, no afecta el arranque).
